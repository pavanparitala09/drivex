import express from 'express';
import { googleAuth, getMe, logout } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.post('/logout', logout);

export default router;
