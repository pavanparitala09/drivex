import express from 'express';
import { uploadFile, getFiles, deleteFile, updateFile } from '../controllers/fileController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

router.route('/')
  .get(protect, getFiles);

router.post('/upload', protect, upload.single('file'), uploadFile);

router.route('/:id')
  .patch(protect, updateFile)
  .delete(protect, deleteFile);

export default router;
