import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['task_created', 'task_updated', 'task_completed', 'task_deleted', 
           'member_added', 'member_removed', 'project_created', 'project_updated', 'status_changed'],
    default: 'task_updated',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  },
}, { timestamps: true });

activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

export default mongoose.model('Activity', activitySchema);
