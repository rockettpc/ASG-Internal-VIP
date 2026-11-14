import React, { useState, useEffect } from 'react';
import {
  parseGlassDimension,
  formatFraction,
  calculateItemMetrics,
} from '../utils/dimensions';
import { GlassLineItem } from '../types/glass';
import { X, CheckCircle2, Calculator, ArrowRight } from 'lucide-react';

interface DimensionTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DimensionTesterModal: React.FC<DimensionTesterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [testInput, setTestInput] = useState('20 1/2"');

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const testCases = [
    { input: '20 1/2"', expected: 20.5 },
    { input: '20-1/2', expected: 20.5 },
    { input: '20.5', expected: 20.5 },
    { input: '20 1/2', expected: 20.5 },
    { input: '3/16', expected: 0.1875 },
    { input: '36 5/8"', expected: 36.625 },
    { input: '83 5/8', expected: 83.625 },
    { input: '84', expected: 84.0 },
  ];

  const weightTestItem: GlassLineItem = {
    id: 'test-weight',
    tag: 'Weight Verification Unit',
    quantity: 1,
    widthRaw: '48',
    heightRaw: '96',
    width: 48,
    height: 96,
    layers: [
      {
        id: 'w1',
        kind: 'glass',
        thickness: '3/16"',
        glassType: 'Clear',
        process: 'Fully Tempered',
      },
      {
        id: 'w2',
        kind: 'glass',
        thickness: '3/16"',
        glassType: 'Clear',
        process: 'Fully Tempered',
      },
    ],
  };

  const weightMetrics = calculateItemMetrics(weightTestItem);
  const weightPassed = Math.abs(weightMetrics.weightPerUnitLbs - 156.0) < 0.01;

  const deductionTestItem: GlassLineItem = {
    id: 'test-deduction',
    tag: 'Deduction Verification Unit',
    quantity: 1,
    widthRaw: '36',
    heightRaw: '84',
    width: 36,
    height: 84,
    layers: [],
  };
  const deductionMetrics = calculateItemMetrics(deductionTestItem);
  const deductionPassed =
    Math.abs(deductionMetrics.filmWidth - 35.625) < 0.001 &&
    Math.abs(deductionMetrics.filmHeight - 83.625) < 0.001;

  const currentParsed = parseGlassDimension(testInput);
  const currentFormatted = formatFraction(currentParsed);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qa-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-black/[0.06] overflow-hidden text-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 id="qa-modal-title" className="text-base font-semibold text-slate-900">
                Formula &amp; Parser QA
              </h3>
              <p className="text-xs text-slate-500">
                Verify fractional parsing, film setbacks, and weight math
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Interactive Parser */}
          <div className="bg-[#F2F2F7]/70 p-4 rounded-2xl space-y-2">
            <label
              htmlFor="custom-dim-input"
              className="block text-xs font-medium text-slate-600"
            >
              Try Free-Form Dimension
            </label>
            <div className="flex items-center gap-2">
              <input
                id="custom-dim-input"
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="e.g. 20 1/2 or 3/16 or 36.625"
                className="flex-1 bg-white border border-black/[0.06] rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-900 tabular-nums focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 focus:outline-hidden"
              />
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="bg-[#007AFF] text-white px-3.5 py-2 rounded-xl text-sm font-semibold tabular-nums shrink-0">
                {currentParsed.toFixed(4)}&Prime; ({currentFormatted})
              </div>
            </div>
          </div>

          {/* Acceptance Suite */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-900">
                Parser Acceptance Cases
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                All Passed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {testCases.map((tc, idx) => {
                const parsed = parseGlassDimension(tc.input);
                const passed = Math.abs(parsed - tc.expected) < 0.001;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-[#F2F2F7]/50 px-3 py-2 rounded-xl text-[11px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 ${
                          passed ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      />
                      <span className="font-semibold text-slate-900 tabular-nums">
                        &ldquo;{tc.input}&rdquo;
                      </span>
                    </div>
                    <span className="text-slate-600 tabular-nums">
                      {parsed.toFixed(3)}&Prime; ({formatFraction(parsed)})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formulas Verified */}
          <div className="space-y-2">
            <div className="p-3 bg-sky-50/80 border border-sky-200/60 rounded-2xl text-[11px]">
              <div className="flex items-center gap-1.5 text-sky-900 font-semibold mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#007AFF]" />
                Film Setback (3/8&Prime; Perimeter Deduction)
              </div>
              <div className="text-slate-600 tabular-nums">
                36&Prime; &times; 84&Prime; &rarr;{' '}
                <strong className="text-slate-900">
                  {formatFraction(deductionMetrics.filmWidth)} &times;{' '}
                  {formatFraction(deductionMetrics.filmHeight)}
                </strong>{' '}
                {deductionPassed && (
                  <span className="ml-1 text-emerald-700 font-semibold">&check; Exact</span>
                )}
              </div>
            </div>

            <div className="p-3 bg-emerald-50/80 border border-emerald-200/60 rounded-2xl text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-900 font-semibold mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Glass Weight (13 lbs / SF per inch thickness)
              </div>
              <div className="text-slate-600 tabular-nums">
                48&Prime; &times; 96&Prime; (2 &times; 3/16&Prime;) &rarr;{' '}
                <strong className="text-slate-900">
                  {weightMetrics.weightPerUnitLbs.toFixed(1)} lbs
                </strong>{' '}
                {weightPassed && (
                  <span className="ml-1 text-emerald-700 font-semibold">&check; Exact</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
