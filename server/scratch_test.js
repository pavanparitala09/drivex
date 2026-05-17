import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config({path: './.env'});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        resource_type: 'auto',
        timeout: 120000
      }, 
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

(async () => {
    try {
        console.log("Starting upload...");
        const buf = Buffer.from('hello world');
        const res = await uploadToCloudinary(buf);
        console.log("Success:", res);
    } catch (e) {
        console.error("Error:", e);
    }
})();
