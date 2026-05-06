import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { taskService } from '../services';
import { useSocket } from '../context/SocketContext';
import { CheckSquare, Calendar, FolderKanban, Filter, Clock } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import { SkeletonRow } from '../components/ui/Skeleton';
import { format } from 'date-fns';

export default function Tasks() {
  const socket = useSocket();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, todo, in-progress, completed, overdue

  const fetchTasks = async () => {
    try {
      const params = {};
      if (filter !== 'all' && filter !== 'overdue') params.status = filter;
      if (filter === 'overdue') params.overdue = 'true';

      const { data } = await taskService.getAll(params);
      setTasks(data.tasks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchTasks();
  }, [filter]);

  useEffect(() => {
    if (socket) {
      // Listen to generic task events (would be better with user specific room, but polling is fine here for simplicity)
      socket.on('task:created', fetchTasks);
      socket.on('task:updated', fetchTasks);
      socket.on('task:deleted', fetchTasks);
    }
    return () => {
      if (socket) {
        socket.off('task:created');
        socket.off('task:updated');
        socket.off('task:deleted');
      }
    };
  }, [socket, filter]);

  const tabs = [
    { id: 'all', label: 'All Tasks' },
    { id: 'todo', label: 'To Do' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
    { id: 'overdue', label: 'Overdue' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-light-900">My Tasks</h1>
          <p className="text-light-500">View and manage tasks assigned to you</p>
        </div>
      </div>

      <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === tab.id 
                ? 'bg-brand-500 text-light-900 shadow-glow-sm' 
                : 'glass text-light-500 hover:text-light-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-hidden shadow-card">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-light-200 text-sm font-medium text-light-500 bg-white/[0.02]">
          <div className="col-span-5">Task</div>
          <div className="col-span-2">Project</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Due Date</div>
          <div className="col-span-1 text-right">Priority</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-white/[0.06]">
          {loading ? (
            Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
          ) : tasks.length > 0 ? (
            tasks.map((task, i) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-white/[0.02] transition-colors"
              >
                <div className="col-span-1 md:col-span-5 flex items-start gap-3">
                  <div className={`mt-1 flex-shrink-0 ${task.status === 'completed' ? 'text-green-400' : 'text-gray-500'}`}>
                    <CheckSquare size={18} />
                  </div>
                  <div>
                    <h4 className={`font-medium text-sm ${task.status === 'completed' ? 'text-light-500 line-through' : 'text-light-900'}`}>
                      {task.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{task.description}</p>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.project?.color }} />
                  <span className="text-gray-300 truncate">{task.project?.name}</span>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <span className={`badge badge-${task.status}`}>
                    {task.status.replace('-', ' ')}
                  </span>
                </div>

                <div className="col-span-1 md:col-span-2 flex items-center gap-2 text-sm">
                  <Calendar size={14} className={task.isOverdue ? 'text-red-400' : 'text-gray-500'} />
                  <span className={task.isOverdue ? 'text-red-400 font-medium' : 'text-gray-300'}>
                    {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '-'}
                  </span>
                </div>

                <div className="col-span-1 flex md:justify-end">
                  <span className={`badge priority-${task.priority} capitalize`}>
                    {task.priority}
                  </span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <CheckSquare className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-light-900 mb-1">No tasks found</h3>
              <p className="text-light-500 text-sm">Try changing your filters or create a new task.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
