import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { execFile } from 'child_process';
import { pipeline } from 'stream/promises';
import { promisify } from 'util';
import sharp from 'sharp';
import convert from 'heic-convert';

const execFileAsync = promisify(execFile);

const MAX_IMAGE_DIMENSION = 1920;
const WEBP_QUALITY = 80;

export interface CompressedAttachmentResult {
  storageName: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  originalSize: number;
}

function isHeicFile(ext: string, mimeType: string): boolean {
  const m = mimeType.toLowerCase();
  return ext === '.heic' || ext === '.heif' || m.includes('heic') || m.includes('heif');
}

function isRasterImage(ext: string, mimeType: string): boolean {
  const m = mimeType.toLowerCase();
  if (
    m === 'image/svg+xml' ||
    ext === '.svg' ||
    ext === '.dxf' ||
    ext === '.dwg' ||
    m.includes('dxf') ||
    m.includes('dwg')
  ) {
    return false;
  }
  if (m.startsWith('image/')) return true;
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tif', '.tiff', '.avif'].includes(ext);
}

function isPdfFile(ext: string, mimeType: string): boolean {
  return ext === '.pdf' || mimeType.toLowerCase() === 'application/pdf';
}

function replaceExtension(fileName: string, newExt: string): string {
  const parsed = path.parse(fileName);
  return `${parsed.name}${newExt}`;
}

async function safeUnlink(filePath: string): Promise<void> {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch {
    // ignore cleanup errors
  }
}

async function tryGzipFile(inputPath: string): Promise<string | null> {
  const gzPath = `${inputPath}.gz`;
  try {
    const origStat = await fs.promises.stat(inputPath);
    await pipeline(
      fs.createReadStream(inputPath),
      zlib.createGzip({ level: 9 }),
      fs.createWriteStream(gzPath)
    );
    const gzStat = await fs.promises.stat(gzPath);
    // Keep gzipped version only if it saves at least 5%
    if (gzStat.size > 0 && gzStat.size < origStat.size * 0.95) {
      await safeUnlink(inputPath);
      return gzPath;
    }
    await safeUnlink(gzPath);
    return null;
  } catch {
    await safeUnlink(gzPath);
    return null;
  }
}

async function compressImageToWebp(
  inputPath: string,
  heic: boolean
): Promise<{ outputPath: string; size: number } | null> {
  const parsed = path.parse(inputPath);
  const webpPath = path.join(parsed.dir, `${parsed.name}.webp`);

  try {
    let source: string | Buffer = inputPath;

    if (heic) {
      // Try sharp first; fall back to heic-convert if libvips lacks HEVC support
      try {
        await sharp(inputPath).metadata();
      } catch {
        const inputBuffer = await fs.promises.readFile(inputPath);
        const jpegResult = await convert({
          buffer: inputBuffer,
          format: 'JPEG',
          quality: 0.92,
        });
        source = Buffer.from(jpegResult);
      }
    }

    await sharp(source, { failOn: 'none' })
      .rotate()
      .resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toFile(webpPath);

    const webpStat = await fs.promises.stat(webpPath);
    if (webpStat.size > 0) {
      return { outputPath: webpPath, size: webpStat.size };
    }
    await safeUnlink(webpPath);
    return null;
  } catch (err) {
    console.warn('Image compression failed, keeping original:', err);
    await safeUnlink(webpPath);
    return null;
  }
}

async function compressPdfWithGhostscript(inputPath: string): Promise<string | null> {
  const gsPath = `${inputPath}.gs.pdf`;
  try {
    const origStat = await fs.promises.stat(inputPath);
    await execFileAsync(
      'gs',
      [
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.4',
        '-dPDFSETTINGS=/ebook',
        '-dNOPAUSE',
        '-dQUIET',
        '-dBATCH',
        `-sOutputFile=${gsPath}`,
        inputPath,
      ],
      { timeout: 30000 }
    );

    const gsStat = await fs.promises.stat(gsPath);
    if (gsStat.size > 0 && gsStat.size < origStat.size * 0.96) {
      await safeUnlink(inputPath);
      await fs.promises.rename(gsPath, inputPath);
      return inputPath;
    }
    await safeUnlink(gsPath);
    return null;
  } catch {
    await safeUnlink(gsPath);
    return null;
  }
}

export async function compressUploadedFile(
  inputPath: string,
  originalName: string,
  mimeType: string
): Promise<CompressedAttachmentResult> {
  const origStat = await fs.promises.stat(inputPath);
  const originalSize = origStat.size;
  const ext = path.extname(originalName || inputPath).toLowerCase();
  const heic = isHeicFile(ext, mimeType);

  // 1. Compress raster images & HEIC/HEIF to WebP (max 1920px, quality 80)
  if (heic || isRasterImage(ext, mimeType)) {
    const result = await compressImageToWebp(inputPath, heic);
    if (result) {
      // Always convert HEIC so it's browser-previewable; for other images keep whichever is smaller
      if (heic || result.size < originalSize) {
        if (result.outputPath !== inputPath) {
          await safeUnlink(inputPath);
        }
        return {
          storageName: path.basename(result.outputPath),
          fileName: replaceExtension(originalName, '.webp'),
          mimeType: 'image/webp',
          fileSize: result.size,
          originalSize,
        };
      }
      if (result.outputPath !== inputPath) {
        await safeUnlink(result.outputPath);
      }
    }
  }

  // 2. Compress PDFs via Ghostscript (/ebook 150dpi) if > 150KB, then gzip if smaller
  if (isPdfFile(ext, mimeType) && originalSize > 150 * 1024) {
    await compressPdfWithGhostscript(inputPath);
  }

  // 3. Gzip-compress non-image documents (PDF, DXF, DWG, SVG, TXT, CSV, DOCX, etc.) if it saves >= 5%
  if (!heic && !isRasterImage(ext, mimeType)) {
    const gzPath = await tryGzipFile(inputPath);
    if (gzPath) {
      const gzStat = await fs.promises.stat(gzPath);
      return {
        storageName: path.basename(gzPath),
        fileName: originalName,
        mimeType: mimeType || 'application/octet-stream',
        fileSize: gzStat.size,
        originalSize,
      };
    }
  }

  // Fallback: keep current file on disk (possibly Ghostscript-optimized PDF)
  const finalStat = await fs.promises.stat(inputPath);
  return {
    storageName: path.basename(inputPath),
    fileName: originalName,
    mimeType: mimeType || 'application/octet-stream',
    fileSize: finalStat.size,
    originalSize,
  };
}

