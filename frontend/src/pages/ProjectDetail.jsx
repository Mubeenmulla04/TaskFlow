import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectService, taskService, activityService } from '../services';
import { useSocket } from '../context/SocketContext';
import { Calendar, Users, Kanban, Clock, CheckSquare, Activity, ChevronRight } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import { SkeletonCard, SkeletonRow } from '../components/ui/Skeleton';
import { format } from 'date-fns';

export default function ProjectDetail() {
  const { id } = useParams();
  const socket = useSocket();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    if (socket) {
      socket.emit('join-project', id);
      socket.on('task:created', fetchData);
      socket.on('task:updated', fetchData);
      socket.on('task:deleted', fetchData);
    }
    return () => {
      if (socket) {
        socket.emit('leave-project', id);
        socket.off('task:created');
        socket.off('task:updated');
        socket.off('task:deleted');
      }
    };
  }, [id, socket]);

  const fetchData = async () => {
    try {
      const [projRes, tasksRes, actRes] = await Promise.all([
        projectService.getById(id),
        taskService.getAll({ project: id }),
        activityService.getAll({ project: id, limit: 10 })
      ]);
      setProject(projRes.data.project);
      setTasks(tasksRes.data.tasks);
      setActivities(actRes.data.activities);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-40" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <SkeletonCard className="h-64" />
          </div>
          <SkeletonCard className="h-96" />
        </div>
      </div>
    );
  }

  if (!project) return <div className="text-center py-10">Project not found</div>;

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="glass rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: project.color }} />
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-light-500">
              <Link to="/projects" className="hover:text-light-900 transition-colors">Projects</Link>
              <ChevronRight size={14} />
              <span className="text-light-900">{project.name}</span>
            </div>
            <h1 className="text-3xl font-bold text-light-900">{project.name}</h1>
            <p className="text-light-500 max-w-2xl">{project.description || 'No description'}</p>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              to={`/projects/${id}/kanban`}
              className="btn-primary flex items-center gap-2"
            >
              <Kanban size={18} />
              Open Kanban Board
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 mt-8 pt-6 border-t border-light-200">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Calendar size={16} className="text-gray-500" />
            <span>Due: {project.dueDate ? format(new Date(project.dueDate), 'MMM d, yyyy') : 'No date'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Users size={16} className="text-gray-500" />
            <span>{project.members.length} Members</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <CheckSquare size={16} className="text-gray-500" />
            <span>{completedTasks} / {tasks.length} Tasks</span>
          </div>
          <div className="flex items-center gap-3 flex-1 min-w-[200px] max-w-sm">
            <div className="flex-1 h-2 bg-dark-600 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Members */}
        <div className="glass rounded-2xl p-6 shadow-card">
          <h3 className="section-title mb-6 flex items-center gap-2">
            <Users className="text-brand-400" /> Team Members
          </h3>
          <div className="space-y-4">
            {project.members.map(member => (
              <div key={member._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} avatar={member.avatar} />
                  <div>
                    <p className="text-sm font-medium text-light-900">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-brand-300 bg-brand-500/10 px-2 py-1 rounded">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 shadow-card flex flex-col">
          <h3 className="section-title mb-6 flex items-center gap-2">
            <Activity className="text-accent-cyan" /> Project Activity
          </h3>
          <div className="flex-1 space-y-4">
            {activities.length > 0 ? activities.map(activity => (
              <div key={activity._id} className="flex gap-4">
                <div className="mt-1">
                  <Avatar name={activity.user?.name} avatar={activity.user?.avatar} size="sm" />
                </div>
                <div className="flex-1 glass p-3 rounded-xl border border-white/[0.04]">
                  <p className="text-sm text-gray-300">
                    <span className="font-medium text-light-900">{activity.user?.name}</span>{' '}
                    {activity.message.replace(activity.user?.name || '', '')}
                  </p>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Clock size={12} />
                    {format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-center text-gray-500">No activity yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
