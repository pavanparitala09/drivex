import express from 'express';
import { createFolder, getFolders, updateFolder, deleteFolder, toggleStar, restoreFolder } from '../controllers/folderController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createFolder)
  .get(protect, getFolders);

router.route('/:id')
  .patch(protect, updateFolder)
  .delete(protect, deleteFolder);

router.patch('/:id/star', protect, toggleStar);
router.patch('/:id/restore', protect, restoreFolder);

export default router;
