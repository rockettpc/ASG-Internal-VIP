import express from 'express';
import mysql, { RowDataPacket } from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import multer from 'multer';
import { compressUploadedFile } from './compression';
import { buildInitialRevision, computeNextRevision } from './revisions';
import {
  calculateItemMetrics,
  calculateProjectTotals,
} from '../src/utils/dimensions';
import { GlassLineItem, ProjectInfo, ProjectStatus } from '../src/types/glass';

dotenv.config();

const app = express();
app.use(express.json({ limit: '5mb' }));

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeName = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

const PORT = Number(process.env.PORT || 4000);

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3308),
  user: process.env.DB_USER || 'asg_user',
  password: process.env.DB_PASSWORD || 'asg_pass',
  database: process.env.DB_NAME || 'asg_estimator',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const VALID_STATUSES: ProjectStatus[] = [
  'Draft',
  'Quoted',
  'Approved',
  'In Production',
  'Completed',
];

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

async function ensureRevisionColumns(): Promise<void> {
  try {
    await pool.query(
      `ALTER TABLE project_items
        ADD COLUMN IF NOT EXISTS revision INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS revision_history_json LONGTEXT`
    );
  } catch (err) {
    console.warn('ensureRevisionColumns warning:', err);
  }
}

void ensureRevisionColumns();

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, database: 'connected' });
  } catch (err) {
    console.error('Healthcheck error:', err);
    res.status(500).json({ ok: false, error: 'Database unavailable' });
  }
});

// List all projects with summary metrics
app.get('/api/projects', async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        p.id,
        p.doc_id AS docId,
        p.project_name AS projectName,
        p.client_name AS clientName,
        p.end_client_name AS endClientName,
        p.status,
        p.total_lites AS totalPanels,
        p.total_gross_sf AS totalGrossSqFt,
        p.total_film_sf AS totalFilmSqFt,
        p.total_weight_lbs AS totalWeightLbs,
        p.total_proposal_amount AS totalProposalAmount,
        p.created_at AS createdAt,
        p.updated_at AS updatedAt,
        COUNT(pi.id) AS itemCount
      FROM projects p
      LEFT JOIN project_items pi ON pi.project_id = p.id
      GROUP BY p.id
      ORDER BY p.updated_at DESC`
    );

    const formatted = rows.map((r) => ({
      ...r,
      totalPanels: Number(r.totalPanels || 0),
      totalGrossSqFt: Number(r.totalGrossSqFt || 0),
      totalFilmSqFt: Number(r.totalFilmSqFt || 0),
      totalWeightLbs: Number(r.totalWeightLbs || 0),
      totalProposalAmount: Number(r.totalProposalAmount || 0),
      itemCount: Number(r.itemCount || 0),
    }));

    res.json(formatted);
  } catch (err) {
    console.error('GET /api/projects error:', err);
    res.status(500).json({ error: 'Failed to load projects' });
  }
});

// Get single project + line items
app.get('/api/projects/:id', async (req, res) => {
  try {
    const [projectRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM projects WHERE id = ?`,
      [req.params.id]
    );

    if (projectRows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const row = projectRows[0];
    const [itemRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM project_items WHERE project_id = ? ORDER BY sort_order ASC`,
      [req.params.id]
    );

    const project: ProjectInfo = {
      docId: row.doc_id,
      projectName: row.project_name,
      clientName: row.client_name,
      contactPerson: row.contact_person || '',
      contactEmail: row.contact_email || '',
      contactPhone: row.contact_phone || '',
      endClientName: row.end_client_name || '',
      endClientContact: row.end_client_contact || '',
      endClientEmail: row.end_client_email || '',
      endClientPhone: row.end_client_phone || '',
      proposalNotes: row.proposal_notes || '',
      projectAddress: row.project_address || '',
      date: row.project_date || '',
      validUntil: row.valid_until || '30 Days from Issue',
      leadTime: row.lead_time || '',
      paymentTerms: row.payment_terms || '',
      preparedBy: row.prepared_by || '',
    };

    const items: GlassLineItem[] = itemRows.map((item) => {
      let revisionHistory = [];
      if (item.revision_history_json) {
        try {
          revisionHistory = JSON.parse(item.revision_history_json);
        } catch {
          revisionHistory = [];
        }
      }
      return {
        id: item.id,
        tag: item.tag,
        quantity: Number(item.quantity),
        widthRaw: item.width_raw,
        heightRaw: item.height_raw,
        width: Number(item.width),
        height: Number(item.height),
        layers: JSON.parse(item.layers_json || '[]'),
        notes: item.notes || '',
        fabricatorCost:
          item.fabricator_cost !== null && item.fabricator_cost !== undefined
            ? Number(item.fabricator_cost)
            : undefined,
        unitPrice: item.unit_price !== null ? Number(item.unit_price) : undefined,
        revision: Number(item.revision || 0),
        revisionHistory,
      };
    });

    res.json({
      id: row.id,
      status: row.status as ProjectStatus,
      project,
      items,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    console.error('GET /api/projects/:id error:', err);
    res.status(500).json({ error: 'Failed to load project' });
  }
});

// Create new project
app.post('/api/projects', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { project, items, status } = req.body as {
      project: ProjectInfo;
      items: GlassLineItem[];
      status?: ProjectStatus;
    };

    if (!project || !project.projectName || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid project payload' });
    }

    const projectId = generateId('proj');
    const safeStatus: ProjectStatus =
      status && VALID_STATUSES.includes(status) ? status : 'Draft';
    const totals = calculateProjectTotals(items);
    const totalProposalAmount = items.reduce(
      (sum, it) => sum + (it.quantity || 1) * (it.unitPrice || 0),
      0
    );

    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO projects (
        id, doc_id, project_name, client_name, contact_person, contact_email, contact_phone,
        end_client_name, end_client_contact, end_client_email, end_client_phone, proposal_notes,
        project_address, project_date, valid_until, lead_time, payment_terms, prepared_by,
        status, total_lites, total_gross_sf, total_film_sf, total_weight_lbs, total_proposal_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        project.docId || 'ASG-EST-NEW',
        project.projectName,
        project.clientName || 'Fabricator TBD',
        project.contactPerson || '',
        project.contactEmail || '',
        project.contactPhone || '',
        project.endClientName || '',
        project.endClientContact || '',
        project.endClientEmail || '',
        project.endClientPhone || '',
        project.proposalNotes || '',
        project.projectAddress || '',
        project.date || '',
        project.validUntil || '30 Days from Issue',
        project.leadTime || '',
        project.paymentTerms || '',
        project.preparedBy || '',
        safeStatus,
        totals.totalPanels,
        totals.totalGrossSqFt,
        totals.totalFilmSqFt,
        totals.totalWeightLbs,
        totalProposalAmount,
      ]
    );

    const nowIso = new Date().toISOString();
    const savedItems: GlassLineItem[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemId = `${projectId}-${i}-${Math.random().toString(36).slice(2, 6)}`;
      const { revision, revisionHistory } = buildInitialRevision(item, nowIso);
      await conn.query(
        `INSERT INTO project_items (
          id, project_id, sort_order, tag, quantity, width_raw, height_raw,
          width, height, layers_json, notes, fabricator_cost, unit_price,
          revision, revision_history_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemId,
          projectId,
          i,
          item.tag || `Lite ${i + 1}`,
          item.quantity || 1,
          item.widthRaw || String(item.width || 0),
          item.heightRaw || String(item.height || 0),
          item.width || 0,
          item.height || 0,
          JSON.stringify(item.layers || []),
          item.notes || '',
          item.fabricatorCost ?? null,
          item.unitPrice ?? null,
          revision,
          JSON.stringify(revisionHistory),
        ]
      );
      savedItems.push({
        ...item,
        id: itemId,
        revision,
        revisionHistory,
      });
    }

    await conn.commit();

    res.status(201).json({
      id: projectId,
      status: safeStatus,
      project,
      items: savedItems,
    });
  } catch (err) {
    await conn.rollback();
    console.error('POST /api/projects error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  } finally {
    conn.release();
  }
});

// Update existing project
app.put('/api/projects/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const projectId = req.params.id;
    const { project, items, status } = req.body as {
      project: ProjectInfo;
      items: GlassLineItem[];
      status?: ProjectStatus;
    };

    if (!project || !project.projectName || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid project payload' });
    }

    const [existing] = await conn.query<RowDataPacket[]>(
      'SELECT id, status FROM projects WHERE id = ?',
      [projectId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const safeStatus: ProjectStatus =
      status && VALID_STATUSES.includes(status)
        ? status
        : (existing[0].status as ProjectStatus);
    const totals = calculateProjectTotals(items);
    const totalProposalAmount = items.reduce(
      (sum, it) => sum + (it.quantity || 1) * (it.unitPrice || 0),
      0
    );

    await conn.beginTransaction();

    await conn.query(
      `UPDATE projects SET
        doc_id = ?, project_name = ?, client_name = ?, contact_person = ?,
        contact_email = ?, contact_phone = ?,
        end_client_name = ?, end_client_contact = ?, end_client_email = ?, end_client_phone = ?, proposal_notes = ?,
        project_address = ?, project_date = ?,
        valid_until = ?, lead_time = ?, payment_terms = ?, prepared_by = ?,
        status = ?, total_lites = ?, total_gross_sf = ?, total_film_sf = ?, total_weight_lbs = ?, total_proposal_amount = ?
      WHERE id = ?`,
      [
        project.docId || 'ASG-EST',
        project.projectName,
        project.clientName || 'Fabricator TBD',
        project.contactPerson || '',
        project.contactEmail || '',
        project.contactPhone || '',
        project.endClientName || '',
        project.endClientContact || '',
        project.endClientEmail || '',
        project.endClientPhone || '',
        project.proposalNotes || '',
        project.projectAddress || '',
        project.date || '',
        project.validUntil || '30 Days from Issue',
        project.leadTime || '',
        project.paymentTerms || '',
        project.preparedBy || '',
        safeStatus,
        totals.totalPanels,
        totals.totalGrossSqFt,
        totals.totalFilmSqFt,
        totals.totalWeightLbs,
        totalProposalAmount,
        projectId,
      ]
    );

    const [prevRows] = await conn.query<RowDataPacket[]>(
      'SELECT * FROM project_items WHERE project_id = ? ORDER BY sort_order ASC',
      [projectId]
    );
    const prevById = new Map<string, GlassLineItem>();
    for (const r of prevRows) {
      let revHist = [];
      if (r.revision_history_json) {
        try {
          revHist = JSON.parse(r.revision_history_json);
        } catch {
          revHist = [];
        }
      }
      prevById.set(r.id, {
        id: r.id,
        tag: r.tag,
        quantity: Number(r.quantity),
        widthRaw: r.width_raw,
        heightRaw: r.height_raw,
        width: Number(r.width),
        height: Number(r.height),
        layers: JSON.parse(r.layers_json || '[]'),
        notes: r.notes || '',
        revision: Number(r.revision || 0),
        revisionHistory: revHist,
      });
    }

    await conn.query('DELETE FROM project_items WHERE project_id = ?', [projectId]);

    const nowIso = new Date().toISOString();
    const savedItems: GlassLineItem[] = [];
    const usedIds = new Set<string>();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const matchedPrev =
        item.id && prevById.has(item.id)
          ? prevById.get(item.id)
          : undefined;

      const itemId =
        item.id && prevById.has(item.id) && !usedIds.has(item.id)
          ? item.id
          : `${projectId}-${i}-${Math.random().toString(36).slice(2, 6)}`;
      usedIds.add(itemId);

      const { revision, revisionHistory } = matchedPrev
        ? computeNextRevision(matchedPrev, item, nowIso)
        : buildInitialRevision(item, nowIso);

      await conn.query(
        `INSERT INTO project_items (
          id, project_id, sort_order, tag, quantity, width_raw, height_raw,
          width, height, layers_json, notes, fabricator_cost, unit_price,
          revision, revision_history_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemId,
          projectId,
          i,
          item.tag || `Lite ${i + 1}`,
          item.quantity || 1,
          item.widthRaw || String(item.width || 0),
          item.heightRaw || String(item.height || 0),
          item.width || 0,
          item.height || 0,
          JSON.stringify(item.layers || []),
          item.notes || '',
          item.fabricatorCost ?? null,
          item.unitPrice ?? null,
          revision,
          JSON.stringify(revisionHistory),
        ]
      );

      savedItems.push({
        ...item,
        id: itemId,
        revision,
        revisionHistory,
      });
    }

    await conn.commit();

    res.json({
      id: projectId,
      status: safeStatus,
      project,
      items: savedItems,
    });
  } catch (err) {
    await conn.rollback();
    console.error('PUT /api/projects/:id error:', err);
    res.status(500).json({ error: 'Failed to update project' });
  } finally {
    conn.release();
  }
});

// Quick status update
app.patch('/api/projects/:id/status', async (req, res) => {
  try {
    const { status } = req.body as { status: ProjectStatus };
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const [result] = await pool.query<mysql.ResultSetHeader>(
      'UPDATE projects SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ id: req.params.id, status });
  } catch (err) {
    console.error('PATCH /api/projects/:id/status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Delete project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const [attRows] = await pool.query<RowDataPacket[]>(
      'SELECT storage_name FROM project_attachments WHERE project_id = ?',
      [req.params.id]
    );

    const [result] = await pool.query<mysql.ResultSetHeader>(
      'DELETE FROM projects WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    for (const att of attRows) {
      const filePath = path.join(UPLOAD_DIR, att.storage_name);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, () => {});
      }
    }

    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    console.error('DELETE /api/projects/:id error:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// List attachments for a project
app.get('/api/projects/:id/attachments', async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, project_id AS projectId, file_name AS fileName, mime_type AS mimeType, file_size AS fileSize, created_at AS createdAt
       FROM project_attachments
       WHERE project_id = ?
       ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json(rows.map((r) => ({ ...r, fileSize: Number(r.fileSize || 0) })));
  } catch (err) {
    console.error('GET /api/projects/:id/attachments error:', err);
    res.status(500).json({ error: 'Failed to load attachments' });
  }
});

// Upload attachment for a project
app.post('/api/projects/:id/attachments', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const [proj] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM projects WHERE id = ?',
      [req.params.id]
    );
    if (proj.length === 0) {
      fs.unlink(file.path, () => {});
      return res.status(404).json({ error: 'Project not found' });
    }

    const attId = generateId('att');
    const compressed = await compressUploadedFile(
      file.path,
      file.originalname,
      file.mimetype || 'application/octet-stream'
    );

    await pool.query(
      `INSERT INTO project_attachments (id, project_id, file_name, mime_type, file_size, storage_name)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        attId,
        req.params.id,
        compressed.fileName,
        compressed.mimeType,
        compressed.fileSize,
        compressed.storageName,
      ]
    );

    res.status(201).json({
      id: attId,
      projectId: req.params.id,
      fileName: compressed.fileName,
      mimeType: compressed.mimeType,
      fileSize: compressed.fileSize,
      originalSize: compressed.originalSize,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('POST /api/projects/:id/attachments error:', err);
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
});

// View / download attachment
app.get('/api/attachments/:attachmentId', async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM project_attachments WHERE id = ?',
      [req.params.attachmentId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const att = rows[0];
    const filePath = path.join(UPLOAD_DIR, att.storage_name);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Attachment file missing on disk' });
    }

    const disposition = req.query.download === '1' ? 'attachment' : 'inline';
    res.setHeader('Content-Type', att.mime_type || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${encodeURIComponent(att.file_name)}"`
    );

    if (String(att.storage_name).endsWith('.gz')) {
      const readStream = fs.createReadStream(filePath);
      const gunzip = zlib.createGunzip();
      readStream.on('error', (err) => {
        console.error('Attachment read error:', err);
        if (!res.headersSent) res.status(500).end();
      });
      gunzip.on('error', (err) => {
        console.error('Attachment gunzip error:', err);
        if (!res.headersSent) res.status(500).end();
      });
      readStream.pipe(gunzip).pipe(res);
      return;
    }

    res.sendFile(filePath);
  } catch (err) {
    console.error('GET /api/attachments/:attachmentId error:', err);
    res.status(500).json({ error: 'Failed to serve attachment' });
  }
});

// Delete attachment
app.delete('/api/attachments/:attachmentId', async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT storage_name FROM project_attachments WHERE id = ?',
      [req.params.attachmentId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const storageName = rows[0].storage_name;
    await pool.query('DELETE FROM project_attachments WHERE id = ?', [
      req.params.attachmentId,
    ]);

    const filePath = path.join(UPLOAD_DIR, storageName);
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, () => {});
    }

    res.json({ deleted: true, id: req.params.attachmentId });
  } catch (err) {
    console.error('DELETE /api/attachments/:attachmentId error:', err);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

// In-depth Financial, Order & Material Report Summary
app.get('/api/reports/summary', async (_req, res) => {
  try {
    const [projectRows] = await pool.query<RowDataPacket[]>(
      `SELECT
        id, doc_id, project_name, client_name, end_client_name, status,
        total_lites, total_gross_sf, total_film_sf, total_weight_lbs,
        total_proposal_amount, updated_at
      FROM projects
      ORDER BY updated_at DESC`
    );

    const [itemRows] = await pool.query<RowDataPacket[]>(
      `SELECT
        id, project_id, tag, quantity, width_raw, height_raw,
        width, height, layers_json, fabricator_cost, unit_price
      FROM project_items`
    );

    const itemsByProject = new Map<string, RowDataPacket[]>();
    for (const item of itemRows) {
      const list = itemsByProject.get(item.project_id) || [];
      list.push(item);
      itemsByProject.set(item.project_id, list);
    }

    const materialMap = new Map<
      string,
      {
        specLabel: string;
        lites: number;
        grossSqFt: number;
        filmSqFt: number;
        weightLbs: number;
        fabCost: number;
        clientPrice: number;
      }
    >();

    const reportProjects = projectRows.map((p) => {
      const pItems = itemsByProject.get(p.id) || [];
      let totalFabCost = 0;
      let totalClientPrice = 0;

      for (const row of pItems) {
        const qty = Number(row.quantity || 1);
        const fabCost = row.fabricator_cost !== null ? Number(row.fabricator_cost) : 0;
        const unitPrice = row.unit_price !== null ? Number(row.unit_price) : 0;
        const lineFab = qty * fabCost;
        const lineClient = qty * unitPrice;

        totalFabCost += lineFab;
        totalClientPrice += lineClient;

        const parsedItem: GlassLineItem = {
          id: row.id,
          tag: row.tag,
          quantity: qty,
          widthRaw: row.width_raw,
          heightRaw: row.height_raw,
          width: Number(row.width),
          height: Number(row.height),
          layers: JSON.parse(row.layers_json || '[]'),
        };
        const m = calculateItemMetrics(parsedItem);
        const specKey = m.layerMakeupString || 'Custom Specification';

        const existingMat = materialMap.get(specKey) || {
          specLabel: specKey,
          lites: 0,
          grossSqFt: 0,
          filmSqFt: 0,
          weightLbs: 0,
          fabCost: 0,
          clientPrice: 0,
        };
        existingMat.lites += qty;
        existingMat.grossSqFt += m.totalGrossSqFt;
        existingMat.filmSqFt += m.filmAreaSqFt * qty;
        existingMat.weightLbs += m.totalWeightLbs;
        existingMat.fabCost += lineFab;
        existingMat.clientPrice += lineClient;
        materialMap.set(specKey, existingMat);
      }

      const grossProfit = totalClientPrice - totalFabCost;
      const marginPercent =
        totalClientPrice > 0 ? (grossProfit / totalClientPrice) * 100 : 0;

      return {
        id: p.id,
        docId: p.doc_id,
        projectName: p.project_name,
        fabricatorName: p.client_name,
        endClientName: p.end_client_name || '',
        status: p.status as ProjectStatus,
        itemCount: pItems.length,
        totalPanels: Number(p.total_lites || 0),
        totalGrossSqFt: Number(p.total_gross_sf || 0),
        totalFilmSqFt: Number(p.total_film_sf || 0),
        totalWeightLbs: Number(p.total_weight_lbs || 0),
        totalFabCost,
        totalClientPrice,
        grossProfit,
        marginPercent,
        updatedAt: p.updated_at,
      };
    });

    const materialBreakdown = Array.from(materialMap.values()).sort(
      (a, b) => b.grossSqFt - a.grossSqFt
    );

    res.json({ projects: reportProjects, materialBreakdown });
  } catch (err) {
    console.error('GET /api/reports/summary error:', err);
    res.status(500).json({ error: 'Failed to generate report summary' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ASG API server listening on port ${PORT}`);
});

