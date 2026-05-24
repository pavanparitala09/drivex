import dotenv from 'dotenv';
import mongoose from 'mongoose';
import File from './models/File.js';

dotenv.config({path: './.env'});

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const file = await File.findOne({ filename: /.*\.pdf$/i }).sort({ createdAt: -1 });
    if (!file) {
      console.log("No PDF file found.");
      process.exit(0);
    }

    console.log("Fetching URL with User-Agent header...");
    const response = await fetch(file.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log("Response status:", response.status);
    console.log("Response headers:", [...response.headers.entries()]);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
