import Task from '../models/Task.model.js';
import Project from '../models/Project.model.js';
import { asyncHandler } from '../middleware/async.middleware.js';
import { getIO } from '../socket.js';
import { logActivity } from '../utils/activity.utils.js';

// @desc    Create task
// @route   POST /api/tasks
export const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate, project, assignedTo, tags } = req.body;

  // Verify project access
  const proj = await Project.findById(project);
  if (!proj) return res.status(404).json({ success: false, message: 'Project not found' });

  const isMember = proj.members.map(m => m.toString()).includes(req.user._id.toString());
  if (!isMember && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const task = await Task.create({
    title, description, status, priority, dueDate, project, assignedTo, tags,
    createdBy: req.user._id,
  });

  await task.populate('assignedTo', 'name email avatar');
  await task.populate('createdBy', 'name email avatar');
  await task.populate('project', 'name color');

  await logActivity({
    message: `${req.user.name} created task "${task.title}"`,
    type: 'task_created',
    userId: req.user._id,
    projectId: project,
    taskId: task._id,
  });

  getIO().to(`project:${project}`).emit('task:created', task);
  res.status(201).json({ success: true, task });
});

// @desc    Get tasks (filter by project, status, priority, assignee)
// @route   GET /api/tasks
export const getTasks = asyncHandler(async (req, res) => {
  const { project, status, priority, assignedTo, search, overdue } = req.query;

  const filter = {};

  if (project) {
    filter.project = project;
  } else {
    // Only tasks in user's projects
    if (req.user.role !== 'admin') {
      const userProjects = await Project.find({ members: req.user._id }).select('_id');
      const projectIds = userProjects.map(p => p._id);
      filter.$or = [
        { project: { $in: projectIds }, assignedTo: req.user._id },
        { createdBy: req.user._id }
      ];
    }
  }

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (search) filter.title = { $regex: search, $options: 'i' };
  if (overdue === 'true') {
    filter.dueDate = { $lt: new Date() };
    filter.status = { $ne: 'completed' };
  }

  const tasks = await Task.find(filter)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('project', 'name color')
    .sort({ order: 1, createdAt: -1 });

  res.json({ success: true, tasks, count: tasks.length });
});

// @desc    Update task
// @route   PUT /api/tasks/:id
export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('project');
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  const project = task.project;
  const isMember = project.members.map(m => m.toString()).includes(req.user._id.toString());
  if (!isMember && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const oldStatus = task.status;
  const { title, description, status, priority, dueDate, assignedTo, tags, order } = req.body;

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (status !== undefined) task.status = status;
  if (priority !== undefined) task.priority = priority;
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (assignedTo !== undefined) task.assignedTo = assignedTo;
  if (tags !== undefined) task.tags = tags;
  if (order !== undefined) task.order = order;

  await task.save();
  await task.populate('assignedTo', 'name email avatar');
  await task.populate('createdBy', 'name email avatar');
  await task.populate('project', 'name color');

  // Log status change
  if (status && status !== oldStatus) {
    await logActivity({
      message: `${req.user.name} moved "${task.title}" to ${status.replace('-', ' ')}`,
      type: 'status_changed',
      userId: req.user._id,
      projectId: task.project._id,
      taskId: task._id,
    });
  } else {
    await logActivity({
      message: `${req.user.name} updated task "${task.title}"`,
      type: 'task_updated',
      userId: req.user._id,
      projectId: task.project._id,
      taskId: task._id,
    });
  }

  getIO().to(`project:${task.project._id}`).emit('task:updated', task);
  res.json({ success: true, task });
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('project');
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  const isCreator = task.createdBy.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isCreator && !isAdmin) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });
  }

  const projectId = task.project._id;
  await logActivity({
    message: `${req.user.name} deleted task "${task.title}"`,
    type: 'task_deleted',
    userId: req.user._id,
    projectId,
    taskId: task._id,
  });

  await task.deleteOne();
  getIO().to(`project:${projectId}`).emit('task:deleted', { _id: req.params.id });
  res.json({ success: true, message: 'Task deleted' });
});

// @desc    Get dashboard stats
// @route   GET /api/tasks/stats
export const getDashboardStats = asyncHandler(async (req, res) => {
  const projectFilter = req.user.role === 'admin'
    ? {}
    : { members: req.user._id };

  const userProjects = await Project.find(projectFilter).select('_id');
  const projectIds = userProjects.map(p => p._id);

  const baseFilter = req.user.role === 'admin'
    ? { project: { $in: projectIds } }
    : { $or: [{ project: { $in: projectIds }, assignedTo: req.user._id }, { createdBy: req.user._id }] };

  const [total, completed, inProgress, todo, overdue] = await Promise.all([
    Task.countDocuments(baseFilter),
    Task.countDocuments({ ...baseFilter, status: 'completed' }),
    Task.countDocuments({ ...baseFilter, status: 'in-progress' }),
    Task.countDocuments({ ...baseFilter, status: 'todo' }),
    Task.countDocuments({
      ...baseFilter,
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' },
    }),
  ]);

  // Last 7 days task completion
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const weeklyData = await Task.aggregate([
    {
      $match: {
        project: { $in: projectIds },
        updatedAt: { $gte: sevenDaysAgo },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    stats: { total, completed, inProgress, todo, overdue, projectCount: projectIds.length },
    weeklyData,
  });
});
