import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';

import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import fileRoutes from './routes/files.js';
import folderRoutes from './routes/folders.js';
import shareRoutes from './routes/share.js';
import publicShareRoutes from './routes/publicShare.js';
import { initCronJobs } from './jobs/cleanup.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: ['http://localhost:5173',
  'https://drivex-tawny.vercel.app',
  'https://drivex-git-master-paritala-pavan-kumars-projects.vercel.app',
  'https://drivex-je3x0a08l-paritala-pavan-kumars-projects.vercel.app',
  'https://drivex-f84g83n25-paritala-pavan-kumars-projects.vercel.app'],
 credentials: true, }));
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    frameguard: false,
  })
);
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/public-share', publicShareRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('DriveX API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  initCronJobs();
});

// Restart server to reload environment variables
