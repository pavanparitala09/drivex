import File from '../models/File.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// @desc    Generate/update public share settings for a file
// @route   POST /api/files/:id/share-link
// @access  Private
export const generatePublicShareLink = async (req, res) => {
  try {
    const { expirationHours, password } = req.body;
    const file = await File.findOne({ _id: req.params.id, userId: req.user.id });

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Generate a unique token if not exists
    if (!file.shareToken) {
      file.shareToken = crypto.randomBytes(16).toString('hex');
    }

    // Set expiration
    if (expirationHours) {
      file.shareExpiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
    } else {
      file.shareExpiresAt = null; // never expires
    }

    // Set password
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      file.sharePassword = await bcrypt.hash(password.trim(), salt);
    } else if (password === '') {
      file.sharePassword = null; // remove password
    }

    await file.save();

    res.status(200).json({
      success: true,
      data: {
        shareToken: file.shareToken,
        shareExpiresAt: file.shareExpiresAt,
        isPasswordProtected: !!file.sharePassword
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Disable public sharing for a file
// @route   DELETE /api/files/:id/share-link
// @access  Private
export const disablePublicShareLink = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    file.shareToken = null;
    file.shareExpiresAt = null;
    file.sharePassword = null;
    await file.save();

    res.status(200).json({
      success: true,
      message: 'Public link sharing disabled'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get public file metadata by token
// @route   GET /api/share/public/:token
// @access  Public
export const getPublicFileMetadata = async (req, res) => {
  try {
    const file = await File.findOne({ shareToken: req.params.token });
    if (!file) {
      return res.status(404).json({ success: false, message: 'Link invalid or disabled' });
    }

    // Check expiration
    if (file.shareExpiresAt && file.shareExpiresAt < new Date()) {
      return res.status(410).json({ success: false, message: 'This share link has expired' });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: file._id,
        filename: file.filename,
        mimeType: file.mimeType,
        size: file.size,
        isPasswordProtected: !!file.sharePassword,
        createdAt: file.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download public file (verifying password if needed)
// @route   GET /api/share/public/:token/download
// @access  Public
export const downloadPublicFile = async (req, res) => {
  try {
    const { password } = req.query;
    const file = await File.findOne({ shareToken: req.params.token });

    if (!file) {
      return res.status(404).json({ success: false, message: 'Link invalid or disabled' });
    }

    // Check expiration
    if (file.shareExpiresAt && file.shareExpiresAt < new Date()) {
      return res.status(410).json({ success: false, message: 'This share link has expired' });
    }

    // Check password protection
    if (file.sharePassword) {
      if (!password) {
        return res.status(401).json({ success: false, message: 'Password is required to access this file' });
      }
      const isMatch = await bcrypt.compare(password, file.sharePassword);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Incorrect password' });
      }
    }

    // Stream/retrieve the file
    const response = await fetch(file.url);
    if (!response.ok) {
      return res.status(400).json({ success: false, message: 'Failed to retrieve file from storage' });
    }

    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.filename)}"`);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
