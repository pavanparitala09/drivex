import mongoose from 'mongoose';
import Folder from './models/Folder.js';

const MONGO_URI = 'mongodb://localhost:27017/drivex';

async function check() {
  await mongoose.connect(MONGO_URI);
  
  // mock req user
  const req = {
    user: { id: '6a05d8f0f43d4cf68b275559' }, // from the previous script
    query: {
      parentFolder: undefined // undefined as Dashboard passes it when currentFolder is null
    }
  };

  const { parentFolder, isStarred, isTrashed } = req.query;

  let query = {
    userId: req.user.id,
  };

  if (isTrashed === 'true') {
    query.isTrashed = true;
  } else {
    query.isTrashed = false;
    if (isStarred === 'true') {
      query.isStarred = true;
    } else {
      if (parentFolder) {
        query.parentFolder = parentFolder;
      } else if (parentFolder === 'null' || !parentFolder) {
        query.parentFolder = null;
      }
    }
  }

  const folders = await Folder.find(query).sort({ name: 1 });
  console.log("Folders length:", folders.length);
  console.log("Folders:", folders.map(f => f._id));

  process.exit(0);
}

check();
