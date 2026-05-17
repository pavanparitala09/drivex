import mongoose from 'mongoose';
import File from './models/File.js';
import Folder from './models/Folder.js';

const MONGO_URI = 'mongodb://localhost:27017/drivex';

async function check() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const id = '6a09ce82edf248d211e40e1e';
  
  const file = await File.findById(id);
  console.log("File:", file);
  
  const folder = await Folder.findById(id);
  console.log("Folder:", folder);

  const allFiles = await File.find({});
  console.log("All Files count:", allFiles.length);

  const allFolders = await Folder.find({});
  console.log("All Folders count:", allFolders.length);

  // Check for duplicates in the sense of duplicate objects with same id
  console.log("Files with this ID:", await File.find({_id: id}));
  console.log("Folders with this ID:", await Folder.find({_id: id}));

  process.exit(0);
}

check();
