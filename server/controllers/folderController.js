import Folder from '../models/Folder.js';
import File from '../models/File.js';
import { getResourceType } from '../utils/cloudinaryUtils.js';

// @desc    Create folder
// @route   POST /api/folders
// @access  Private
export const createFolder = async (req, res) => {
  try {
    const { name, parentFolder } = req.body;

    const folder = await Folder.create({
      name,
      parentFolder: parentFolder || null,
      userId: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: folder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get folders
// @route   GET /api/folders
// @access  Private
export const getFolders = async (req, res) => {
  try {
    const { parentFolder, isStarred, isTrashed } = req.query;

    let query = {
      userId: req.user.id,
    };

    if (isTrashed === 'true') {
      query.isTrashed = true;
    } else {
      query.isTrashed = false;
      if (isStarred === 'true') {
        query.isStarred = true;
      } else {
        if (parentFolder) {
          query.parentFolder = parentFolder;
        } else if (parentFolder === 'null' || !parentFolder) {
          query.parentFolder = null;
        }
      }
    }

    const folders = await Folder.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: folders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Rename folder
// @route   PATCH /api/folders/:id
// @access  Private
export const updateFolder = async (req, res) => {
  try {
    const { name } = req.body;

    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { name },
      { new: true }
    );

    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found' });
    }

    res.status(200).json({
      success: true,
      data: folder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete folder
// @route   DELETE /api/folders/:id
// @access  Private
export const deleteFolder = async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, userId: req.user.id });

    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found' });
    }

    // Soft delete logic
    if (!folder.isTrashed) {
      folder.isTrashed = true;
      folder.deletedAt = new Date();
      await folder.save();
      // Also soft delete all child files
      await File.updateMany({ folderId: folder._id, isTrashed: false }, { isTrashed: true, deletedAt: new Date() });
      // TODO: Ideally we should recursively soft delete child folders as well, but for MVP this handles immediate files.
      return res.status(200).json({ success: true, message: 'Folder moved to trash', data: folder });
    }

    // Hard delete logic
    // Delete all child files from cloudinary and db
    const childFiles = await File.find({ folderId: folder._id });
    for (const file of childFiles) {
      if (file.cloudinaryId) {
        await cloudinary.uploader.destroy(file.cloudinaryId, { resource_type: getResourceType(file.mimeType) });
      }
      await File.deleteOne({ _id: file._id });
    }
    await Folder.deleteOne({ _id: folder._id });

    res.status(200).json({
      success: true,
      message: 'Folder and contents permanently deleted',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle star
// @route   PATCH /api/folders/:id/star
// @access  Private
export const toggleStar = async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, userId: req.user.id });
    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found' });
    folder.isStarred = !folder.isStarred;
    await folder.save();
    res.status(200).json({ success: true, data: folder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Restore folder
// @route   PATCH /api/folders/:id/restore
// @access  Private
export const restoreFolder = async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, userId: req.user.id });
    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found' });
    folder.isTrashed = false;
    folder.deletedAt = null;
    await folder.save();
    // Also restore immediate child files
    await File.updateMany({ folderId: folder._id, isTrashed: true }, { isTrashed: false, deletedAt: null });
    res.status(200).json({ success: true, data: folder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
