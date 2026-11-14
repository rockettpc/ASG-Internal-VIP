import React from 'react';
import { GlassLineItem, ProjectInfo } from '../types/glass';
import {
  calculateItemMetrics,
  calculateProjectTotals,
  formatFraction,
} from '../utils/dimensions';
import { BrandLogo } from './BrandLogo';

interface EstimateSheetProps {
  items: GlassLineItem[];
  project: ProjectInfo;
  isPrintPreview?: boolean;
}

export const EstimateSheet: React.FC<EstimateSheetProps> = ({
  items,
  project,
  isPrintPreview = false,
}) => {
  const totals = calculateProjectTotals(items);

  return (
    <div
      className={`bg-white text-slate-900 border border-slate-300 shadow-sm print-page ${
        isPrintPreview ? 'mx-auto' : ''
      }`}
      style={{
        width: '8.5in',
        minHeight: '11in',
        height: '11in',
        boxSizing: 'border-box',
      }}
    >
      <div className="h-full w-full flex flex-col justify-between p-4 border border-slate-200 bg-white">
        {/* Header Section */}
        <div>
          <div className="flex items-start justify-between border-b-2 border-[#004F8A] pb-3 mb-3">
            <div className="flex items-center gap-3">
              <BrandLogo className="h-12" variant="full" />
              <div className="border-l border-slate-300 pl-3">
                <div className="text-[14px] font-black tracking-tight text-slate-900">
                  AMERICAN SWITCH GLASS
                </div>
                <div className="text-[9.5px] text-slate-600 leading-tight">
                  Architectural Switchable Privacy Glass &middot; Custom Laminated IGUs
                </div>
                <div className="text-[8.5px] text-slate-500 font-mono mt-0.5">
                  sales@americanswitchglass.com &middot; (800) 555-SWCH &middot; San Francisco, CA
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[18px] font-black text-[#004F8A] tracking-wider uppercase font-mono">
                FABRICATION ESTIMATE
              </div>
              <div className="text-[11px] font-bold text-slate-800 font-mono">
                DOC ID: <span className="text-[#004F8A]">{project.docId}</span>
              </div>
              <div className="text-[9px] text-slate-500 font-mono">
                ISSUE DATE: {project.date}
              </div>
            </div>
          </div>

          {/* Project & Client Information Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-2.5 rounded-sm mb-3 text-[9px]">
            <div>
              <div className="text-[7.5px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-0.5">
                PROJECT &amp; LOCATION
              </div>
              <div className="text-[11px] font-bold text-slate-900">
                {project.projectName}
              </div>
              <div className="text-slate-600 mt-0.5 font-mono">
                {project.projectAddress || 'Commercial Jobsite Specification'}
              </div>
              <div className="text-slate-500 font-mono mt-1">
                PREPARED BY: <strong className="text-slate-800">{project.preparedBy}</strong>
              </div>
            </div>

            <div className="border-l border-slate-200 pl-3">
              <div className="text-[7.5px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-0.5">
                GLASS FABRICATOR (TO)
              </div>
              <div className="text-[11px] font-bold text-slate-900">
                {project.clientName}
              </div>
              <div className="text-slate-700 font-mono">
                ATTN: {project.contactPerson}
              </div>
              <div className="text-slate-500 font-mono">
                {project.contactEmail} &middot; {project.contactPhone}
              </div>
              <div className="text-slate-500 font-mono mt-1">
                VALIDITY: <strong className="text-slate-800">{project.validUntil}</strong>
              </div>
            </div>
          </div>

          {/* Commercial Glass Schedule Table */}
          <div className="border border-slate-300 rounded-sm overflow-hidden mb-3">
            <table className="w-full text-left border-collapse text-[8.5px]">
              <thead>
                <tr className="bg-[#002D54] text-white font-mono uppercase text-[7.5px] tracking-wider">
                  <th className="py-1.5 px-2 w-8 text-center border-r border-[#004F8A]">ITEM</th>
                  <th className="py-1.5 px-2 border-r border-[#004F8A]">LOCATION / PANEL TAG</th>
                  <th className="py-1.5 px-1.5 w-9 text-center border-r border-[#004F8A]">QTY</th>
                  <th className="py-1.5 px-2 border-r border-[#004F8A]">FINISHED SIZE (W &times; H)</th>
                  <th className="py-1.5 px-2 border-r border-[#004F8A]">ASG FILM CUT SIZE (-3/8&quot;)</th>
                  <th className="py-1.5 px-2 border-r border-[#004F8A]">LAYER MAKEUP SPECIFICATION</th>
                  <th className="py-1.5 px-1.5 w-14 text-right border-r border-[#004F8A]">SQ FT</th>
                  <th className="py-1.5 px-1.5 w-14 text-right">WEIGHT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {items.map((item, idx) => {
                  const m = calculateItemMetrics(item);
                  return (
                    <tr
                      key={item.id}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}
                    >
                      <td className="py-1.5 px-2 text-center font-bold text-slate-700 border-r border-slate-200">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-1.5 px-2 font-semibold text-slate-900 border-r border-slate-200">
                        <div>{item.tag}</div>
                        {item.notes && (
                          <div className="text-[7px] text-slate-500 font-normal mt-0.5 truncate max-w-[200px]">
                            {item.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-1.5 px-1.5 text-center font-bold text-slate-800 border-r border-slate-200">
                        {item.quantity}
                      </td>
                      <td className="py-1.5 px-2 text-slate-800 border-r border-slate-200 whitespace-nowrap">
                        <strong className="text-slate-900">
                          {formatFraction(item.width)} &times; {formatFraction(item.height)}
                        </strong>
                        <div className="text-[7px] text-slate-500">
                          [{item.width.toFixed(2)}&quot; &times; {item.height.toFixed(2)}&quot;]
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-[#0284C7] font-bold border-r border-slate-200 whitespace-nowrap">
                        {formatFraction(m.filmWidth)} &times; {formatFraction(m.filmHeight)}
                        <div className="text-[7px] text-slate-500 font-normal">
                          [{m.filmWidth.toFixed(3)}&quot; &times; {m.filmHeight.toFixed(3)}&quot;]
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-slate-700 border-r border-slate-200 text-[7.5px] leading-tight">
                        <div className="font-medium text-slate-900">{m.layerMakeupString}</div>
                        <div className="text-slate-500 text-[7px] mt-0.5">
                          Nom. Thick: {formatFraction(m.totalNominalThickness)} &plusmn; 1/32&quot;
                        </div>
                      </td>
                      <td className="py-1.5 px-1.5 text-right border-r border-slate-200">
                        <div className="font-bold text-slate-900">{m.totalGrossSqFt.toFixed(1)}</div>
                        <div className="text-[7px] text-slate-500">({m.grossSqFtPerUnit.toFixed(1)}/ea)</div>
                      </td>
                      <td className="py-1.5 px-1.5 text-right font-bold text-slate-900">
                        <div>{m.totalWeightLbs.toFixed(0)} lbs</div>
                        <div className="text-[7px] text-slate-500 font-normal">
                          ({m.weightPerUnitLbs.toFixed(0)} lbs/ea)
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Project Totals & Production Schedule Box */}
          <div className="grid grid-cols-12 gap-3 mb-3">
            <div className="col-span-8 bg-slate-50 border border-slate-300 rounded-sm p-2 text-[8px] font-mono">
              <div className="text-[8.5px] font-bold text-[#002D54] uppercase mb-1">
                MANUFACTURING &amp; FABRICATION SPECIFICATIONS
              </div>
              <ul className="space-y-0.5 text-slate-700 list-disc pl-3">
                <li>
                  <strong>Perimeter Edge Clearance:</strong> 3/8&quot; continuous setback on active
                  PDLC film provides edge seal barrier against moisture and delamination.
                </li>
                <li>
                  <strong>Silicone Compatibility:</strong> Approved neutral-cure structural silicone
                  only (Dow Corning 795 or 995). Acetic acid silicones strictly void warranty.
                </li>
                <li>
                  <strong>Electrical Connections:</strong> Each unit includes 12 ft. 18 AWG Teflon
                  leads pre-soldered to copper busbars. Power via ASG step-down transformer (48V–65V AC).
                </li>
                <li>
                  <strong>Testing &amp; QA:</strong> 100% factory optical clarity and switch cycling tested
                  under ASTM C1172 laminated safety standards prior to crating.
                </li>
              </ul>
            </div>

            <div className="col-span-4 bg-[#F8FAFC] border-2 border-[#004F8A] rounded-sm p-2 text-right font-mono flex flex-col justify-between">
              <div>
                <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                  PROJECT TOTALS
                </div>
                <div className="text-[9.5px] text-slate-800 mt-1 flex justify-between">
                  <span className="text-slate-500">TOTAL PANELS:</span>
                  <span className="font-bold text-slate-900">{totals.totalPanels} Lites</span>
                </div>
                <div className="text-[9.5px] text-slate-800 mt-0.5 flex justify-between">
                  <span className="text-slate-500">GROSS SQ FT:</span>
                  <span className="font-bold text-slate-900">{totals.totalGrossSqFt.toFixed(2)} SF</span>
                </div>
                <div className="text-[9.5px] text-slate-800 mt-0.5 flex justify-between">
                  <span className="text-slate-500">ASG FILM AREA:</span>
                  <span className="font-bold text-[#0284C7]">{totals.totalFilmSqFt.toFixed(2)} SF</span>
                </div>
                <div className="text-[10px] text-slate-900 font-bold mt-1 pt-1 border-t border-slate-300 flex justify-between">
                  <span className="text-slate-700">GLASS WEIGHT:</span>
                  <span className="text-[#002D54]">{totals.totalWeightLbs.toFixed(0)} LBS</span>
                </div>
              </div>

              <div className="text-[7.5px] text-slate-500 text-left mt-1 pt-1 border-t border-slate-200">
                LEAD TIME: <strong className="text-slate-800">{project.leadTime}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Fabricator Confirmation & ASG Authorization Signature Block */}
        <div className="border-t-2 border-slate-800 pt-2 text-[8px] font-mono">
          <div className="mb-2 text-slate-600 text-[7.5px] leading-tight">
            <strong>FABRICATION ESTIMATE &amp; SPECIFICATION CONFIRMATION:</strong> By signing below,
            the Glass Fabricator confirms receipt of all dimensions, layer stack makeups, busbar
            locations, and active PDLC film cut sizes for production quoting and scheduling. All
            ASTM C1172 tolerances must be verified prior to glass cutting and tempering.
          </div>

          <div className="grid grid-cols-12 gap-4 mt-2">
            <div className="col-span-6 border-t border-slate-400 pt-1">
              <div className="flex justify-between text-[8px] text-slate-500">
                <span>AUTHORIZED FABRICATOR SIGNATURE</span>
                <span>DATE</span>
              </div>
              <div className="h-6"></div>
              <div className="text-[8px] text-slate-700 font-semibold uppercase">
                PRINT NAME: {project.contactPerson} &middot; {project.clientName}
              </div>
            </div>

            <div className="col-span-6 border-t border-slate-400 pt-1">
              <div className="flex justify-between text-[8px] text-slate-500">
                <span>AMERICAN SWITCH GLASS (GLAZING CONTRACTOR)</span>
                <span>DATE</span>
              </div>
              <div className="h-6"></div>
              <div className="text-[8px] text-slate-700 font-semibold uppercase">
                ASG REPRESENTATIVE: {project.preparedBy}
              </div>
            </div>
          </div>

          {/* Footer Page Marker */}
          <div className="flex items-center justify-between text-[7.5px] text-slate-400 border-t border-slate-200 mt-2 pt-1">
            <span>American Switch Glass Corporation &middot; Glazing Contractor &middot; www.americanswitchglass.com</span>
            <span className="font-bold text-slate-600">SHEET 1 OF {items.length + 1} &middot; FABRICATION ESTIMATE REQUEST</span>
          </div>
        </div>
      </div>
    </div>
  );
};
