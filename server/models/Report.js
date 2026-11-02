import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: [true, 'Resource reference is required'],
      index: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter user reference is required'],
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Report reason is required'],
      enum: {
        values: [
          'Broken link',
          'Outdated material',
          'Incorrect information',
          'Duplicate resource',
          'Inappropriate content',
          'Other',
        ],
        message: '{VALUE} is not a valid reason',
      },
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Under Review', 'Resolved', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Admin notes cannot exceed 1000 characters'],
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent multiple pending/active reports by the same user on the same resource
reportSchema.index(
  { resource: 1, reportedBy: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['Pending', 'Under Review'] } },
  }
);

const Report = mongoose.model('Report', reportSchema);
export default Report;

