import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
      index: true,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 12,
      index: true,
    },
    unit: {
      type: Number,
      min: 1,
      max: 10,
      default: null,
      index: true,
    },
    isPYQ: {
      type: Boolean,
      default: false,
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Resource type is required'],
      enum: {
        values: ['PDF', 'PPT', 'DOC', 'DOCX', 'Notes', 'Assignment', 'Reference Link', 'Other'],
        message: '{VALUE} is not a supported resource type',
      },
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (arr) {
          return arr.length <= 10;
        },
        message: 'Cannot provide more than 10 tags',
      },
    },
    resourceUrl: {
      type: String,
      required: [true, 'Resource URL or file path is required'],
      trim: true,
    },
    filePublicId: {
      type: String,
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploaded by user reference is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'verified', 'reported'],
      default: 'unverified',
      index: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    upvoteCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    aiSummary: {
      summary: { type: String, default: null },
      keyConcepts: { type: [String], default: [] },
      examTips: { type: [String], default: [] },
      generatedAt: { type: Date, default: null },
    },
    aiQuiz: [
      {
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        answerIndex: { type: Number, required: true },
        explanation: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for searching, filtering, and sorting
resourceSchema.index({ status: 1, subject: 1, semester: 1 });
resourceSchema.index({ status: 1, type: 1 });
resourceSchema.index({ status: 1, createdAt: -1 });
resourceSchema.index({ status: 1, views: -1 });
resourceSchema.index({ status: 1, upvoteCount: -1 });
resourceSchema.index({ title: 'text', description: 'text', tags: 'text' });

const Resource = mongoose.model('Resource', resourceSchema);
export default Resource;
