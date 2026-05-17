import express from 'express';
import { shareFile, getSharedFiles } from '../controllers/shareController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/shared-with-me', protect, getSharedFiles);
router.post('/:fileId', protect, shareFile);

export default router;
