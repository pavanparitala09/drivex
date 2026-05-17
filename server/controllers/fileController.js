import File from '../models/File.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';

import fs from 'fs/promises';
import { getResourceType } from '../utils/cloudinaryUtils.js';

const uploadToCloudinary = async (filePath) => {
  return cloudinary.uploader.upload(filePath, {
    resource_type: 'auto',
    timeout: 120000 // 120 seconds timeout
  });
};

// @desc    Upload file
// @route   POST /api/files/upload
// @access  Private
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const { folderId } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const MAX_STORAGE = 500 * 1024 * 1024; // 500MB
    const currentStorage = user.storageUsed || 0;
    if (currentStorage + req.file.size > MAX_STORAGE) {
      return res.status(400).json({ success: false, message: 'Storage limit exceeded (Max 500MB)' });
    }

    // Upload to cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file.path);

    // Save metadata to MongoDB
    const file = await File.create({
      filename: req.file.originalname, // keeping original name as filename for user display
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: cloudinaryResult.secure_url,
      cloudinaryId: cloudinaryResult.public_id,
      folderId: folderId || null,
      userId: req.user._id,
    });

    user.storageUsed = currentStorage + req.file.size;
    await user.save();

    // Clean up temp file
    try {
      await fs.unlink(req.file.path);
    } catch (err) {
      console.error('Failed to delete temp file:', err);
    }

    res.status(201).json({
      success: true,
      data: file,
      storageUsed: user.storageUsed,
    });
  } catch (error) {
    console.error(error);
    
    // Clean up temp file on error too
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.error('Failed to delete temp file on error:', err);
      }
    }

    res.status(500).json({ success: false, message: 'File upload failed', error: error.message, stack: error.stack });
  }
};

// @desc    Get files
// @route   GET /api/files
// @access  Private
export const getFiles = async (req, res) => {
  try {
    const { folderId, search, isStarred, isTrashed } = req.query;
    
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
        if (folderId) {
          query.folderId = folderId;
        } else if (folderId === 'null' || (!folderId && !search)) {
          query.folderId = null; // root folder
        }
      }
    }

    if (search) {
      query.filename = { $regex: search, $options: 'i' };
      delete query.folderId; // search across all folders
    }

    const files = await File.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: files,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete file
// @route   DELETE /api/files/:id
// @access  Private
export const deleteFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.user.id });

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Soft delete logic (move to trash)
    if (!file.isTrashed) {
      file.isTrashed = true;
      file.deletedAt = new Date();
      await file.save();
      return res.status(200).json({ success: true, message: 'File moved to trash', data: file });
    }

    // Hard delete logic (from trash)
    await cloudinary.uploader.destroy(file.cloudinaryId, { resource_type: getResourceType(file.mimeType) });
    await File.deleteOne({ _id: file._id });
    
    const userToUpdate = await User.findById(req.user._id);
    if (userToUpdate) {
      userToUpdate.storageUsed = (userToUpdate.storageUsed || 0) - file.size;
      if (userToUpdate.storageUsed < 0) userToUpdate.storageUsed = 0;
      await userToUpdate.save();
    }

    res.status(200).json({
      success: true,
      message: 'File permanently deleted',
      storageUsed: userToUpdate ? userToUpdate.storageUsed : undefined
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update file (rename)
// @route   PATCH /api/files/:id
// @access  Private
export const updateFile = async (req, res) => {
  try {
    const { filename } = req.body;

    const file = await File.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { filename },
      { new: true }
    );

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    res.status(200).json({
      success: true,
      data: file,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle star
// @route   PATCH /api/files/:id/star
// @access  Private
export const toggleStar = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    file.isStarred = !file.isStarred;
    await file.save();
    res.status(200).json({ success: true, data: file });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Restore file
// @route   PATCH /api/files/:id/restore
// @access  Private
export const restoreFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    file.isTrashed = false;
    file.deletedAt = null;
    await file.save();
    res.status(200).json({ success: true, data: file });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
