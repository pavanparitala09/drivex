import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  parentFolder: {
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
}, { timestamps: true });

const Folder = mongoose.model('Folder', folderSchema);
export default Folder;
