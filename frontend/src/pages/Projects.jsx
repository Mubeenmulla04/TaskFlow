import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FolderKanban, Plus, MoreVertical, Calendar } from 'lucide-react';
import { projectService } from '../services';
import { SkeletonCard } from '../components/ui/Skeleton';
import Avatar from '../components/ui/Avatar';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import CreateProjectModal from '../components/projects/CreateProjectModal';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await projectService.getAll();
      setProjects(data.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    active: 'text-green-400 bg-green-500/10 border-green-500/20',
    completed: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    'on-hold': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    archived: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-light-900">Projects</h1>
          <p className="text-light-500">Manage your team's projects and boards</p>
        </div>
        {user?.role === 'admin' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            New Project
          </button>
        )}
      </div>

      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchProjects}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : projects.length > 0 ? (
          projects.map((project, i) => (
            <motion.div
              key={project._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/projects/${project._id}`} className="block h-full group">
                <div className="card h-full flex flex-col relative overflow-hidden">
                  {/* Color Accent line */}
                  <div 
                    className="absolute top-0 left-0 w-full h-1" 
                    style={{ backgroundColor: project.color }}
                  />

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl glass flex items-center justify-center" style={{ color: project.color }}>
                        <FolderKanban size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-light-900 group-hover:text-brand-400 transition-colors">
                          {project.name}
                        </h3>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold border mt-1 ${statusColors[project.status]}`}>
                          {project.status}
                        </span>
                      </div>
                    </div>
                    <button className="p-1 text-gray-500 hover:text-light-900 transition-colors" onClick={(e) => e.preventDefault()}>
                      <MoreVertical size={20} />
                    </button>
                  </div>

                  <p className="text-light-500 text-sm mb-6 flex-1 line-clamp-2">
                    {project.description || 'No description provided.'}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-xs text-light-500 mb-2">
                      <span>Progress</span>
                      <span>
                        {project.taskCounts?.total > 0 
                          ? Math.round((project.taskCounts?.completed / project.taskCounts?.total) * 100) 
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-light-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-500 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${project.taskCounts?.total > 0 
                            ? (project.taskCounts?.completed / project.taskCounts?.total) * 100 
                            : 0}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/[0.06]">
                    <div className="flex -space-x-2">
                      {project.members.slice(0, 4).map((member) => (
                        <Avatar 
                          key={member._id} 
                          name={member.name} 
                          avatar={member.avatar} 
                          size="sm" 
                          className="ring-dark-800"
                        />
                      ))}
                      {project.members.length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-light-100 border-2 border-dark-800 flex items-center justify-center text-xs font-medium text-light-900">
                          +{project.members.length - 4}
                        </div>
                      )}
                    </div>

                    {project.dueDate && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar size={14} />
                        {format(new Date(project.dueDate), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center glass rounded-2xl">
            <FolderKanban className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-light-900 mb-2">No Projects Found</h3>
            <p className="text-gray-400">You don't have any projects yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
