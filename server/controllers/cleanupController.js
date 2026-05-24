import File from '../models/File.js';
import mongoose from 'mongoose';

// @desc    Get storage category breakdown
// @route   GET /api/files/storage-breakdown
// @access  Private
export const getStorageBreakdown = async (req, res) => {
  try {
    const files = await File.find({ userId: req.user.id, isTrashed: false });
    
    let categories = {
      images: 0,
      videos: 0,
      pdfs: 0,
      documents: 0, // text, md, json, html, css
      others: 0
    };

    files.forEach(file => {
      const mime = file.mimeType.toLowerCase();
      const name = file.filename.toLowerCase();
      
      if (mime.startsWith('image/')) {
        categories.images += file.size;
      } else if (mime.startsWith('video/')) {
        categories.videos += file.size;
      } else if (mime === 'application/pdf' || name.endsWith('.pdf')) {
        categories.pdfs += file.size;
      } else if (
        mime.startsWith('text/') ||
        name.endsWith('.md') ||
        name.endsWith('.json') ||
        name.endsWith('.js') ||
        name.endsWith('.html') ||
        name.endsWith('.css') ||
        mime.includes('document') ||
        mime.includes('word') ||
        mime.includes('excel') ||
        mime.includes('spreadsheet') ||
        mime.includes('presentation') ||
        mime.includes('powerpoint')
      ) {
        categories.documents += file.size;
      } else {
        categories.others += file.size;
      }
    });

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get cleanup suggestions (large, duplicates, old)
// @route   GET /api/files/cleanup-suggestions
// @access  Private
export const getCleanupSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Large files (> 15MB)
    const largeFiles = await File.find({
      userId,
      isTrashed: false,
      size: { $gt: 15 * 1024 * 1024 }
    }).sort({ size: -1 }).limit(10);

    // 2. Old unused files (uploaded > 30 days ago, not starred, not trashed)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oldFiles = await File.find({
      userId,
      isTrashed: false,
      isStarred: false,
      createdAt: { $lt: thirtyDaysAgo }
    }).sort({ createdAt: 1 }).limit(10);

    // 3. Duplicate files (same filename and size)
    // Aggregate to find duplicate filenames and sizes
    const duplicateGroups = await File.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), isTrashed: false } },
      {
        $group: {
          _id: { filename: '$filename', size: '$size' },
          count: { $sum: 1 },
          files: { $push: '$$ROOT' }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    // Format duplicates to return the flat list of duplicate files
    let duplicateFiles = [];
    duplicateGroups.forEach(group => {
      // Keep the first one, recommend deleting the rest
      const [original, ...duplicates] = group.files;
      duplicates.forEach(dup => {
        duplicateFiles.push({
          ...dup,
          originalName: original.filename,
          originalId: original._id
        });
      });
    });

    res.status(200).json({
      success: true,
      data: {
        largeFiles,
        oldFiles,
        duplicateFiles: duplicateFiles.slice(0, 10)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
