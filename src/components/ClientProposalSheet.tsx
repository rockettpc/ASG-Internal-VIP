import React from 'react';
import { GlassLineItem, ProjectInfo } from '../types/glass';
import {
  calculateItemMetrics,
  calculateProjectTotals,
  formatFraction,
} from '../utils/dimensions';
import { BrandLogo } from './BrandLogo';

interface ClientProposalSheetProps {
  items: GlassLineItem[];
  project: ProjectInfo;
  totalSheets: number;
  isPrintPreview?: boolean;
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

export const ClientProposalSheet: React.FC<ClientProposalSheetProps> = ({
  items,
  project,
  totalSheets,
  isPrintPreview = false,
}) => {
  const totals = calculateProjectTotals(items);
  const grandTotal = items.reduce(
    (sum, item) => sum + (item.quantity || 1) * (item.unitPrice || 0),
    0
  );

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
                  Commercial Glazing Contractor &middot; Switchable Privacy Glass Systems
                </div>
                <div className="text-[8.5px] text-slate-500 font-mono mt-0.5">
                  sales@americanswitchglass.com &middot; (800) 555-SWCH &middot; San Francisco, CA
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[18px] font-black text-[#004F8A] tracking-wider uppercase font-mono">
                CLIENT PROPOSAL
              </div>
              <div className="text-[11px] font-bold text-slate-800 font-mono">
                PROPOSAL ID: <span className="text-[#004F8A]">{project.docId}</span>
              </div>
              <div className="text-[9px] text-slate-500 font-mono">
                ISSUE DATE: {project.date}
              </div>
            </div>
          </div>

          {/* Project & End-Client Information Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-2.5 rounded-sm mb-3 text-[9px]">
            <div>
              <div className="text-[7.5px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-0.5">
                PROJECT &amp; JOBSITE LOCATION
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
                PREPARED FOR (END CLIENT)
              </div>
              <div className="text-[11px] font-bold text-slate-900">
                {project.endClientName || 'Client / Building Owner'}
              </div>
              {project.endClientContact && (
                <div className="text-slate-700 font-mono">
                  ATTN: {project.endClientContact}
                </div>
              )}
              {(project.endClientEmail || project.endClientPhone) && (
                <div className="text-slate-500 font-mono">
                  {[project.endClientEmail, project.endClientPhone].filter(Boolean).join(' · ')}
                </div>
              )}
              <div className="text-slate-500 font-mono mt-1">
                VALIDITY: <strong className="text-slate-800">{project.validUntil}</strong>
              </div>
            </div>
          </div>

          {/* Client Proposal Pricing Table */}
          <div className="border border-slate-300 rounded-sm overflow-hidden mb-3">
            <table className="w-full text-left border-collapse text-[8.5px]">
              <thead>
                <tr className="bg-[#002D54] text-white font-mono uppercase text-[7.5px] tracking-wider">
                  <th className="py-1.5 px-2 w-8 text-center border-r border-[#004F8A]">ITEM</th>
                  <th className="py-1.5 px-2 border-r border-[#004F8A]">LOCATION / DESCRIPTION</th>
                  <th className="py-1.5 px-1.5 w-9 text-center border-r border-[#004F8A]">QTY</th>
                  <th className="py-1.5 px-2 border-r border-[#004F8A]">SIZE (W &times; H)</th>
                  <th className="py-1.5 px-2 border-r border-[#004F8A]">GLASS SPECIFICATION</th>
                  <th className="py-1.5 px-2 w-20 text-right border-r border-[#004F8A]">UNIT PRICE</th>
                  <th className="py-1.5 px-2 w-24 text-right">EXTENDED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {items.map((item, idx) => {
                  const m = calculateItemMetrics(item);
                  const unitPrice = item.unitPrice || 0;
                  const lineTotal = (item.quantity || 1) * unitPrice;
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
                          <div className="text-[7px] text-slate-500 font-normal mt-0.5 truncate max-w-[190px]">
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
                          {m.grossSqFtPerUnit.toFixed(1)} SF/ea
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-slate-700 border-r border-slate-200 text-[7.5px] leading-tight">
                        <div className="font-medium text-slate-900">{m.layerMakeupString}</div>
                        <div className="text-slate-500 text-[7px] mt-0.5">
                          Nom. Thick: {formatFraction(m.totalNominalThickness)}
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-right border-r border-slate-200 text-slate-800">
                        {unitPrice > 0 ? formatCurrency(unitPrice) : 'TBD'}
                      </td>
                      <td className="py-1.5 px-2 text-right font-bold text-slate-900">
                        {unitPrice > 0 ? formatCurrency(lineTotal) : 'TBD'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Scope & Proposal Totals */}
          <div className="grid grid-cols-12 gap-3 mb-3">
            <div className="col-span-7 bg-slate-50 border border-slate-300 rounded-sm p-2.5 text-[8px] font-mono">
              <div className="text-[8.5px] font-bold text-[#002D54] uppercase mb-1">
                COMMERCIAL TERMS &amp; SCOPE OF SUPPLY
              </div>
              <ul className="space-y-0.5 text-slate-700 list-disc pl-3">
                <li>
                  <strong>Lead Time:</strong> {project.leadTime}
                </li>
                <li>
                  <strong>Payment Terms:</strong> {project.paymentTerms}
                </li>
                <li>
                  <strong>Electrical &amp; Warranty:</strong> Includes 12 ft. 18 AWG Teflon leads
                  and 5-Year ASG Laminated PDLC Warranty. Step-down transformer (48V–65V AC)
                  provided per circuit spec.
                </li>
                {project.proposalNotes && (
                  <li>
                    <strong>Project Notes:</strong> {project.proposalNotes}
                  </li>
                )}
              </ul>
            </div>

            <div className="col-span-5 bg-[#F8FAFC] border-2 border-[#004F8A] rounded-sm p-2.5 text-right font-mono flex flex-col justify-between">
              <div>
                <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                  PROPOSAL SUMMARY
                </div>
                <div className="text-[9.5px] text-slate-800 mt-1 flex justify-between">
                  <span className="text-slate-500">TOTAL PANELS:</span>
                  <span className="font-bold text-slate-900">{totals.totalPanels} Lites</span>
                </div>
                <div className="text-[9.5px] text-slate-800 mt-0.5 flex justify-between">
                  <span className="text-slate-500">TOTAL GLASS AREA:</span>
                  <span className="font-bold text-slate-900">{totals.totalGrossSqFt.toFixed(2)} SF</span>
                </div>
                <div className="text-[12px] text-[#002D54] font-black mt-2 pt-2 border-t border-slate-300 flex justify-between items-baseline">
                  <span>TOTAL PROPOSAL:</span>
                  <span className="text-[#004F8A]">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <div className="text-[7px] text-slate-500 text-left mt-1.5 pt-1 border-t border-slate-200">
                Taxes, crating, and freight quoted separately unless noted above.
              </div>
            </div>
          </div>
        </div>

        {/* Client Acceptance Signature Block */}
        <div className="border-t-2 border-slate-800 pt-2 text-[8px] font-mono">
          <div className="mb-2 text-slate-600 text-[7.5px] leading-tight">
            <strong>PROPOSAL ACCEPTANCE &amp; AUTHORIZATION TO PROCEED:</strong> By signing below,
            the Client accepts this proposal, pricing, and commercial terms, and authorizes
            American Switch Glass to proceed with final shop drawings, glass fabrication, and
            material staging.
          </div>

          <div className="grid grid-cols-12 gap-4 mt-2">
            <div className="col-span-6 border-t border-slate-400 pt-1">
              <div className="flex justify-between text-[8px] text-slate-500">
                <span>AUTHORIZED CLIENT SIGNATURE</span>
                <span>DATE</span>
              </div>
              <div className="h-6"></div>
              <div className="text-[8px] text-slate-700 font-semibold uppercase">
                PRINT NAME: {project.endClientContact || '____________________'} &middot;{' '}
                {project.endClientName || 'CLIENT'}
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

          <div className="flex items-center justify-between text-[7.5px] text-slate-400 border-t border-slate-200 mt-2 pt-1">
            <span>American Switch Glass Corporation &middot; Glazing Contractor &middot; www.americanswitchglass.com</span>
            <span className="font-bold text-slate-600">SHEET 1 OF {totalSheets} &middot; CLIENT PROPOSAL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

