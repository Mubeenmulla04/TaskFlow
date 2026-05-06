import Activity from '../models/Activity.model.js';
import { asyncHandler } from '../middleware/async.middleware.js';

export const getActivities = asyncHandler(async (req, res) => {
  const { project, limit = 20, page = 1 } = req.query;
  const filter = project ? { project } : {};
  const skip = (Number(page) - 1) * Number(limit);

  const activities = await Activity.find(filter)
    .populate('user', 'name email avatar')
    .populate('project', 'name color')
    .populate('task', 'title')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip(skip);

  const total = await Activity.countDocuments(filter);

  res.json({ success: true, activities, total, page: Number(page), pages: Math.ceil(total / limit) });
});
