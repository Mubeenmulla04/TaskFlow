import Project from '../models/Project.model.js';
import Task from '../models/Task.model.js';
import Activity from '../models/Activity.model.js';
import { asyncHandler } from '../middleware/async.middleware.js';
import { getIO } from '../socket.js';
import { logActivity } from '../utils/activity.utils.js';

// @desc    Create project
// @route   POST /api/projects
export const createProject = asyncHandler(async (req, res) => {
  const { name, description, status, color, dueDate, members } = req.body;
  console.log('[createProject] body:', req.body, 'user:', req.user?._id);

  try {
    const project = await Project.create({
      name, description, status, color, dueDate,
      createdBy: req.user._id,
      members: members || [],
    });

    await project.populate('members', 'name email avatar role');
    await project.populate('createdBy', 'name email avatar');

    await logActivity({
      message: `${req.user.name} created project "${project.name}"`,
      type: 'project_created',
      userId: req.user._id,
      projectId: project._id,
    });

    getIO().emit('project:created', project);
    res.status(201).json({ success: true, project });
  } catch (err) {
    console.error('[createProject] ERROR:', err.message, err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Get all projects for current user
// @route   GET /api/projects
export const getProjects = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin'
    ? {}
    : { members: req.user._id };

  const projects = await Project.find(filter)
    .populate('members', 'name email avatar role')
    .populate('createdBy', 'name email avatar')
    .sort({ createdAt: -1 });

  // Attach task counts
  const projectsWithCounts = await Promise.all(projects.map(async (p) => {
    const taskCounts = await Task.aggregate([
      { $match: { project: p._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const counts = { total: 0, todo: 0, 'in-progress': 0, completed: 0, overdue: 0 };
    taskCounts.forEach(({ _id, count }) => {
      counts[_id] = count;
      counts.total += count;
    });
    const overdue = await Task.countDocuments({
      project: p._id,
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' },
    });
    counts.overdue = overdue;
    return { ...p.toJSON(), taskCounts: counts };
  }));

  res.json({ success: true, projects: projectsWithCounts });
});

// @desc    Get single project
// @route   GET /api/projects/:id
export const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('members', 'name email avatar role')
    .populate('createdBy', 'name email avatar');

  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

  const isMember = project.members.some(m => m._id.toString() === req.user._id.toString());
  if (!isMember && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  res.json({ success: true, project });
});

// @desc    Update project
// @route   PUT /api/projects/:id
export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

  if (project.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to update this project' });
  }

  const { name, description, status, color, dueDate, members } = req.body;
  if (name) project.name = name;
  if (description !== undefined) project.description = description;
  if (status) project.status = status;
  if (color) project.color = color;
  if (dueDate !== undefined) project.dueDate = dueDate;
  if (members) project.members = members;

  await project.save();
  await project.populate('members', 'name email avatar role');
  await project.populate('createdBy', 'name email avatar');

  await logActivity({
    message: `${req.user.name} updated project "${project.name}"`,
    type: 'project_updated',
    userId: req.user._id,
    projectId: project._id,
  });

  getIO().to(`project:${project._id}`).emit('project:updated', project);
  res.json({ success: true, project });
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

  if (project.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  await Task.deleteMany({ project: project._id });
  await Activity.deleteMany({ project: project._id });
  await project.deleteOne();

  getIO().emit('project:deleted', { _id: req.params.id });
  res.json({ success: true, message: 'Project deleted successfully' });
});

// @desc    Add member to project
// @route   POST /api/projects/:id/members
export const addMember = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

  if (project.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  if (!project.members.map(m => m.toString()).includes(userId)) {
    project.members.push(userId);
    await project.save();
  }

  await project.populate('members', 'name email avatar role');
  await logActivity({
    message: `${req.user.name} added a member to "${project.name}"`,
    type: 'member_added',
    userId: req.user._id,
    projectId: project._id,
  });

  getIO().to(`project:${project._id}`).emit('project:updated', project);
  res.json({ success: true, project });
});

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
export const removeMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

  if (project.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  project.members = project.members.filter(m => m.toString() !== req.params.userId);
  await project.save();
  await project.populate('members', 'name email avatar role');

  await logActivity({
    message: `${req.user.name} removed a member from "${project.name}"`,
    type: 'member_removed',
    userId: req.user._id,
    projectId: project._id,
  });

  getIO().to(`project:${project._id}`).emit('project:updated', project);
  res.json({ success: true, project });
});
