import Activity from '../models/Activity.model.js';

export const logActivity = async ({ message, type, userId, projectId, taskId }) => {
  try {
    await Activity.create({
      message,
      type,
      user: userId,
      project: projectId,
      task: taskId,
    });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
};
