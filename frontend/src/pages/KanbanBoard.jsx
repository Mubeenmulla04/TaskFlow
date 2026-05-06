import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { Plus, MoreHorizontal, Calendar, ChevronLeft, Loader2 } from 'lucide-react';
import { taskService, projectService } from '../services';
import { useSocket } from '../context/SocketContext';
import Avatar from '../components/ui/Avatar';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import CreateTaskModal from '../components/tasks/CreateTaskModal';

const columns = [
  { id: 'todo', title: 'To Do', border: 'border-gray-500/30' },
  { id: 'in-progress', title: 'In Progress', border: 'border-blue-500/30' },
  { id: 'completed', title: 'Completed', border: 'border-green-500/30' },
];

export default function KanbanBoard() {
  const { id } = useParams();
  const socket = useSocket();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState({ 'todo': [], 'in-progress': [], 'completed': [] });
  const [loading, setLoading] = useState(true);
  const [dragUpdating, setDragUpdating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeStatus, setActiveStatus] = useState('todo');

  const fetchBoardData = useCallback(async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        projectService.getById(id),
        taskService.getAll({ project: id })
      ]);
      setProject(projRes.data.project);

      const grouped = { 'todo': [], 'in-progress': [], 'completed': [] };
      // Sort tasks by order before grouping
      const sortedTasks = tasksRes.data.tasks.sort((a, b) => a.order - b.order);
      sortedTasks.forEach(task => {
        if (grouped[task.status]) grouped[task.status].push(task);
      });
      setTasks(grouped);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load board');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  useEffect(() => {
    if (!socket || dragUpdating) return;

    socket.emit('join-project', id);
    socket.on('task:created', fetchBoardData);
    socket.on('task:updated', fetchBoardData);
    socket.on('task:deleted', fetchBoardData);

    return () => {
      socket.emit('leave-project', id);
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:deleted');
    };
  }, [id, socket, fetchBoardData, dragUpdating]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    setDragUpdating(true);
    
    // Optimistic UI update
    const sourceCol = [...tasks[source.droppableId]];
    const destCol = source.droppableId === destination.droppableId ? sourceCol : [...tasks[destination.droppableId]];
    
    const [movedTask] = sourceCol.splice(source.index, 1);
    movedTask.status = destination.droppableId;
    destCol.splice(destination.index, 0, movedTask);

    setTasks(prev => ({
      ...prev,
      [source.droppableId]: sourceCol,
      [destination.droppableId]: destCol,
    }));

    try {
      // Calculate new order logic if necessary (simplified here: just update status and let DB default order)
      await taskService.update(draggableId, { 
        status: destination.droppableId,
        order: destination.index
      });
    } catch (err) {
      toast.error('Failed to update task status');
      fetchBoardData(); // revert
    } finally {
      setDragUpdating(false);
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>;
  }

  if (!project) return <div>Project not found</div>;

  return (
    <div className="flex flex-col h-full -m-4 lg:-m-6 p-4 lg:p-6 bg-light-50 overflow-hidden">
      {/* Board Header */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-light-200 shrink-0">
        <div className="flex items-center gap-4">
          <Link to={`/projects/${id}`} className="p-2 glass rounded-xl text-light-500 hover:text-light-900">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-light-900 flex items-center gap-3">
              {project.name}
              <span className="text-sm font-normal px-2 py-1 rounded bg-light-100 text-light-500">Kanban Board</span>
            </h1>
          </div>
        </div>
        <button 
          onClick={() => { setActiveStatus('todo'); setIsModalOpen(true); }}
          className="btn-primary flex items-center gap-2 py-2"
        >
          <Plus size={18} /> Add Task
        </button>
      </div>

      <CreateTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        projectId={id}
        status={activeStatus}
        onSuccess={fetchBoardData}
      />

      {/* Board Columns */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-6 overflow-x-auto overflow-y-hidden pb-4 no-scrollbar">
          {columns.map(column => (
            <div key={column.id} className="kanban-col shrink-0 flex flex-col max-h-full">
              {/* Column Header */}
              <div className={`glass p-3 rounded-xl border-t-2 ${column.border} mb-3 flex items-center justify-between shrink-0`}>
                <h3 className="font-semibold text-light-900">{column.title}</h3>
                <span className="bg-light-100 text-light-500 text-xs px-2 py-1 rounded-lg">
                  {tasks[column.id]?.length || 0}
                </span>
              </div>

              {/* Column Body */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto space-y-3 rounded-xl p-2 transition-colors min-h-[150px] ${
                      snapshot.isDraggingOver ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    {tasks[column.id]?.map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`task-card ${snapshot.isDragging ? 'rotate-2 shadow-glow z-50' : ''}`}
                            style={provided.draggableProps.style}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className={`badge priority-${task.priority} capitalize text-[10px]`}>
                                {task.priority}
                              </span>
                              <button className="text-gray-500 hover:text-light-900" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal size={16} />
                              </button>
                            </div>
                            
                            <h4 className="text-light-900 font-medium text-sm mb-2">{task.title}</h4>
                            
                            <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                              <div className="flex items-center gap-2">
                                {task.dueDate && (
                                  <div className="flex items-center gap-1 bg-dark-600 px-2 py-1 rounded">
                                    <Calendar size={12} />
                                    {format(new Date(task.dueDate), 'MMM d')}
                                  </div>
                                )}
                              </div>
                              {task.assignedTo && (
                                <Avatar name={task.assignedTo.name} avatar={task.assignedTo.avatar} size="xs" />
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    <button 
                      onClick={() => { setActiveStatus(column.id); setIsModalOpen(true); }}
                      className="w-full py-2.5 rounded-xl border border-dashed border-white/10 text-gray-500 hover:text-light-900 hover:border-white/20 transition-colors flex items-center justify-center gap-2 text-sm mt-2"
                    >
                      <Plus size={16} /> Add Task
                    </button>
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
