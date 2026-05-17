import File from '../models/File.js';
import User from '../models/User.js';

// @desc    Share a file
// @route   POST /api/share/:fileId
// @access  Private
export const shareFile = async (req, res) => {
  try {
    const { email, permission } = req.body;
    
    // Find the file to share
    const file = await File.findOne({ _id: req.params.fileId, userId: req.user.id });
    
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found or you do not have permission' });
    }

    // Find the user to share with
    const shareUser = await User.findOne({ email });
    
    if (!shareUser) {
      return res.status(404).json({ success: false, message: 'User to share with not found' });
    }

    // Check if already shared
    const alreadySharedIndex = file.sharedWith.findIndex(
      (share) => share.user.toString() === shareUser._id.toString()
    );

    if (alreadySharedIndex !== -1) {
      // Update permission if already shared
      file.sharedWith[alreadySharedIndex].permission = permission;
    } else {
      // Add new share
      file.sharedWith.push({
        user: shareUser._id,
        permission: permission || 'view'
      });
    }

    await file.save();

    res.status(200).json({
      success: true,
      message: `File shared with ${email}`,
      data: file
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get shared files for logged-in user
// @route   GET /api/share/shared-with-me
// @access  Private
export const getSharedFiles = async (req, res) => {
  try {
    const files = await File.find({ 'sharedWith.user': req.user.id })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: files
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
