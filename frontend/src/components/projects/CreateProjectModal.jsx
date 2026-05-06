import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, FolderKanban } from 'lucide-react';
import { projectService } from '../../services';
import toast from 'react-hot-toast';

const colors = [
  '#6c3ef7', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#3b82f6', '#8b5cf6'
];

export default function CreateProjectModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dueDate: '',
    color: colors[0],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Project name is required');

    setLoading(true);
    try {
      await projectService.create(formData);
      toast.success('Project created successfully');
      onSuccess();
      onClose();
      setFormData({ name: '', description: '', dueDate: '', color: colors[0] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-lg bg-surface-50 border border-surface-200 rounded-2xl shadow-2xl relative z-10 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-surface-200 flex items-center justify-between bg-white/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-500/10 rounded-lg text-brand-600">
                  <FolderKanban size={20} />
                </div>
                <h3 className="text-lg font-bold text-surface-900">Create New Project</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-surface-200 rounded-full transition-colors text-surface-500">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Project Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Website Redesign"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is this project about?"
                  rows={3}
                  className="input resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Accent Color</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {colors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-6 h-6 rounded-full transition-transform active:scale-90 ${
                          formData.color === color ? 'ring-2 ring-brand-500 ring-offset-2 scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : 'Create Project'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
