import express from 'express';
import { getPublicFileMetadata, downloadPublicFile } from '../controllers/publicShareController.js';

const router = express.Router();

router.get('/:token', getPublicFileMetadata);
router.get('/:token/download', downloadPublicFile);

export default router;
