import React from 'react';
import { ProjectInfo } from '../types/glass';
import { X, Check } from 'lucide-react';

interface ProjectInfoModalProps {
  project: ProjectInfo;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: ProjectInfo) => void;
}

export const ProjectInfoModal: React.FC<ProjectInfoModalProps> = ({
  project,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = React.useState<ProjectInfo>(project);

  React.useEffect(() => {
    setFormData(project);
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden">
        <div className="bg-[#002D54] text-white px-5 py-3.5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-wide uppercase font-mono">
              Project &amp; Estimate Metadata
            </h3>
            <p className="text-xs text-blue-200">
              Commercial submittal document information for ASG shop drawings
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-mono">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">
                Estimate / Document ID
              </label>
              <input
                type="text"
                value={formData.docId}
                onChange={(e) =>
                  setFormData({ ...formData, docId: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-bold text-[#004F8A] focus:border-[#004F8A] focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">
                Document Date
              </label>
              <input
                type="text"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:border-[#004F8A] focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-semibold">
              Project Name
            </label>
            <input
              type="text"
              value={formData.projectName}
              onChange={(e) =>
                setFormData({ ...formData, projectName: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-bold focus:border-[#004F8A] focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-semibold">
              Jobsite Address / Location
            </label>
            <input
              type="text"
              value={formData.projectAddress}
              onChange={(e) =>
                setFormData({ ...formData, projectAddress: e.target.value })
              }
              placeholder="e.g. 555 California St, Suite 4200, San Francisco, CA"
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:border-[#004F8A] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">
                Client / Glazing Company
              </label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) =>
                  setFormData({ ...formData, clientName: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:border-[#004F8A] focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData({ ...formData, contactPerson: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:border-[#004F8A] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) =>
                  setFormData({ ...formData, contactEmail: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:border-[#004F8A] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">
                Contact Phone
              </label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) =>
                  setFormData({ ...formData, contactPhone: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:border-[#004F8A] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">
                Production Lead Time
              </label>
              <input
                type="text"
                value={formData.leadTime}
                onChange={(e) =>
                  setFormData({ ...formData, leadTime: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:border-[#004F8A] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">
                Prepared By (ASG Engineering)
              </label>
              <input
                type="text"
                value={formData.preparedBy}
                onChange={(e) =>
                  setFormData({ ...formData, preparedBy: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:border-[#004F8A] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-slate-600 hover:bg-slate-100 transition-colors font-sans text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-[#004F8A] hover:bg-[#002D54] text-white font-medium flex items-center gap-1.5 transition-colors font-sans text-xs shadow-xs"
            >
              <Check className="w-4 h-4" /> Save Project Info
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
