import React, { useEffect } from 'react';
import { ProjectInfo, ProjectStatus } from '../types/glass';
import { X, Check } from 'lucide-react';

interface ProjectInfoModalProps {
  project: ProjectInfo;
  status: ProjectStatus;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: ProjectInfo, status: ProjectStatus) => void;
}

export const ProjectInfoModal: React.FC<ProjectInfoModalProps> = ({
  project,
  status,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = React.useState<ProjectInfo>(project);
  const [formStatus, setFormStatus] = React.useState<ProjectStatus>(status);

  useEffect(() => {
    setFormData(project);
    setFormStatus(status);
  }, [project, status, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, formStatus);
    onClose();
  };

  const inputClass =
    'w-full bg-[#F2F2F7]/80 border border-transparent rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 focus:outline-hidden transition-all';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-black/[0.06] overflow-hidden max-h-[92vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 id="project-modal-title" className="text-base font-semibold text-slate-900">
              Project Details
            </h3>
            <p className="text-xs text-slate-500">
              Submittal metadata for estimate &amp; CAD title blocks
            </p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 px-0.5">
                Estimate / Doc ID
              </label>
              <input
                type="text"
                value={formData.docId}
                onChange={(e) => setFormData({ ...formData, docId: e.target.value })}
                className={`${inputClass} font-semibold text-[#007AFF] tabular-nums`}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 px-0.5">
                Project Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as ProjectStatus)}
                className={`${inputClass} font-semibold`}
              >
                <option value="Draft">Draft</option>
                <option value="Quoted">Quoted</option>
                <option value="Approved">Approved</option>
                <option value="In Production">In Production</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 px-0.5">
                Document Date
              </label>
              <input
                type="text"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 px-0.5">
              Project Name
            </label>
            <input
              type="text"
              value={formData.projectName}
              onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
              className={`${inputClass} font-semibold`}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 px-0.5">
              Jobsite Address
            </label>
            <input
              type="text"
              value={formData.projectAddress}
              onChange={(e) => setFormData({ ...formData, projectAddress: e.target.value })}
              placeholder="e.g. 555 California St, Suite 4200, San Francisco, CA"
              className={inputClass}
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-800 mb-2.5">
              Glass Fabricator (For Fabrication RFQ)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 px-0.5">
                  Fabricator Company
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 px-0.5">
                  Fabricator Contact
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 px-0.5">
                  Fabricator Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 px-0.5">
                  Fabricator Phone
                </label>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-800 mb-2.5">
              End Client (For Client Proposal)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 px-0.5">
                  Client / Owner Name
                </label>
                <input
                  type="text"
                  value={formData.endClientName || ''}
                  onChange={(e) => setFormData({ ...formData, endClientName: e.target.value })}
                  placeholder="e.g. Apex Financial Group"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 px-0.5">
                  Client Contact Person
                </label>
                <input
                  type="text"
                  value={formData.endClientContact || ''}
                  onChange={(e) => setFormData({ ...formData, endClientContact: e.target.value })}
                  placeholder="e.g. Jane Doe, Facilities Director"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 px-0.5">
                  Client Email
                </label>
                <input
                  type="email"
                  value={formData.endClientEmail || ''}
                  onChange={(e) => setFormData({ ...formData, endClientEmail: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 px-0.5">
                  Client Phone
                </label>
                <input
                  type="text"
                  value={formData.endClientPhone || ''}
                  onChange={(e) => setFormData({ ...formData, endClientPhone: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 px-0.5">
                Production Lead Time
              </label>
              <input
                type="text"
                value={formData.leadTime}
                onChange={(e) => setFormData({ ...formData, leadTime: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 px-0.5">
                Payment Terms
              </label>
              <input
                type="text"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 px-0.5">
                Prepared By
              </label>
              <input
                type="text"
                value={formData.preparedBy}
                onChange={(e) => setFormData({ ...formData, preparedBy: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 px-0.5">
                Proposal Notes
              </label>
              <input
                type="text"
                value={formData.proposalNotes || ''}
                onChange={(e) => setFormData({ ...formData, proposalNotes: e.target.value })}
                placeholder="Optional client scope notes"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-slate-600 hover:bg-slate-100 transition-colors text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-[#007AFF] hover:bg-[#0062CC] text-white font-semibold flex items-center gap-1.5 transition-colors text-xs shadow-xs"
            >
              <Check className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
