import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'on-hold', 'archived'],
    default: 'active',
  },
  color: {
    type: String,
    default: '#6c3ef7',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  dueDate: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

// Ensure creator is always a member
projectSchema.pre('save', async function () {
  if (this.createdBy && !this.members.map(m => m.toString()).includes(this.createdBy.toString())) {
    this.members.push(this.createdBy);
  }
});

export default mongoose.model('Project', projectSchema);
