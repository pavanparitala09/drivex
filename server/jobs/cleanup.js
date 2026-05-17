import cron from 'node-cron';
import File from '../models/File.js';
import Folder from '../models/Folder.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import { getResourceType } from '../utils/cloudinaryUtils.js';

export const initCronJobs = () => {
  // Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily cleanup job for trashed files...');
    try {
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      // Find files to permanently delete
      const expiredFiles = await File.find({
        isTrashed: true,
        deletedAt: { $lte: fifteenDaysAgo }
      });

      if (expiredFiles.length === 0) {
        console.log('No expired files found in trash.');
      } else {
        console.log(`Found ${expiredFiles.length} expired files. Proceeding with hard delete.`);
        
        for (const file of expiredFiles) {
          // Delete from Cloudinary
          if (file.cloudinaryId) {
            try {
              await cloudinary.uploader.destroy(file.cloudinaryId, { resource_type: getResourceType(file.mimeType) });
            } catch (cloudErr) {
              console.error(`Failed to delete from Cloudinary: ${file.cloudinaryId}`, cloudErr);
            }
          }

          // Update user storage
          const user = await User.findById(file.userId);
          if (user) {
            user.storageUsed = (user.storageUsed || 0) - file.size;
            if (user.storageUsed < 0) user.storageUsed = 0;
            await user.save();
          }

          // Delete from DB
          await File.deleteOne({ _id: file._id });
        }
        console.log('Finished deleting expired files.');
      }

      // Cleanup expired folders as well
      const expiredFolders = await Folder.find({
        isTrashed: true,
        deletedAt: { $lte: fifteenDaysAgo }
      });

      if (expiredFolders.length > 0) {
        for (const folder of expiredFolders) {
          await Folder.deleteOne({ _id: folder._id });
        }
        console.log(`Finished deleting ${expiredFolders.length} expired folders.`);
      }

    } catch (error) {
      console.error('Error during cleanup job:', error);
    }
  });
};
