import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  cloudinaryId: {
    type: String,
    required: true,
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isStarred: {
    type: Boolean,
    default: false,
  },
  isTrashed: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    }
  }],
  tags: [{
    name: { type: String, required: true },
    color: { type: String, required: true }
  }],
  shareToken: {
    type: String,
    default: null
  },
  shareExpiresAt: {
    type: Date,
    default: null
  },
  sharePassword: {
    type: String,
    default: null
  },
}, { timestamps: true });

const File = mongoose.model('File', fileSchema);
export default File;
