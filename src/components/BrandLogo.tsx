import React, { useState } from 'react';

interface BrandLogoProps {
  className?: string;
  variant?: 'full' | 'compact' | 'cad-title';
  showSubtitle?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = 'h-10',
  variant = 'full',
  showSubtitle = true,
}) => {
  const [imgError, setImgError] = useState(false);
  const logoUrl =
    'https://images.squarespace-cdn.com/content/v1/523b7f10e4b06bef209493b2/1392228274650-LVNBC5PYTZSGJ29LNUCB/ASG-logo-large.jpg?format=1000w';

  if (!imgError) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <img
          src={logoUrl}
          alt="American Switch Glass"
          className="h-full object-contain max-h-14 rounded-sm"
          onError={() => setImgError(true)}
        />
        {variant === 'cad-title' && showSubtitle && (
          <div className="hidden sm:flex flex-col border-l border-slate-300 pl-2.5">
            <span className="text-[11px] font-bold tracking-wider text-slate-800 uppercase">
              American Switch Glass
            </span>
            <span className="text-[9px] text-slate-500 font-mono tracking-tight">
              ARCHITECTURAL SUBMITTAL
            </span>
          </div>
        )}
      </div>
    );
  }

  // Fallback crisp SVG vector mark matching ASG commercial identity
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <svg
        viewBox="0 0 160 50"
        className="h-full w-auto text-[#004F8A]"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="2" y="4" width="40" height="42" rx="4" fill="#002D54" />
        <rect x="7" y="9" width="30" height="32" rx="2" fill="#004F8A" opacity="0.9" />
        <path
          d="M12 36 L22 14 L32 36 M16 28 L28 28"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <text
          x="50"
          y="28"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="900"
          fontSize="24"
          letterSpacing="0.05em"
          fill="#002D54"
        >
          ASG
        </text>
        <text
          x="51"
          y="42"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="600"
          fontSize="8.5"
          letterSpacing="0.12em"
          fill="#0284C7"
        >
          AMERICAN SWITCH GLASS
        </text>
      </svg>
      {showSubtitle && variant !== 'compact' && (
        <span className="text-[10px] tracking-widest text-slate-400 uppercase font-mono hidden md:inline border-l border-slate-200 pl-2">
          Technical Drafting
        </span>
      )}
    </div>
  );
};
