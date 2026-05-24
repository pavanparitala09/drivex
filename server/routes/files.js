import express from 'express';
import { 
  uploadFile, 
  getFiles, 
  deleteFile, 
  updateFile, 
  toggleStar, 
  restoreFile, 
  summarizeFile, 
  viewFile,
  toggleFileTag,
  updateTextContent,
  createNewTextFile,
  suggestFileName,
  chatWithFile
} from '../controllers/fileController.js';
import { getStorageBreakdown, getCleanupSuggestions } from '../controllers/cleanupController.js';
import { generatePublicShareLink, disablePublicShareLink } from '../controllers/publicShareController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

router.route('/')
  .get(protect, getFiles);

router.post('/upload', protect, upload.single('file'), uploadFile);
router.post('/text', protect, createNewTextFile);

router.get('/storage-breakdown', protect, getStorageBreakdown);
router.get('/cleanup-suggestions', protect, getCleanupSuggestions);

router.route('/:id')
  .patch(protect, updateFile)
  .delete(protect, deleteFile);

router.put('/:id/content', protect, updateTextContent);
router.patch('/:id/tags', protect, toggleFileTag);
router.patch('/:id/star', protect, toggleStar);
router.patch('/:id/restore', protect, restoreFile);
router.post('/:id/summarize', protect, summarizeFile);
router.get('/:id/view', protect, viewFile);
router.post('/:id/share-link', protect, generatePublicShareLink);
router.delete('/:id/share-link', protect, disablePublicShareLink);
router.get('/:id/suggest-name', protect, suggestFileName);
router.post('/:id/chat', protect, chatWithFile);

export default router;
