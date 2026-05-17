import cloudinary from './config/cloudinary.js';

async function test() {
  try {
    const filePath = './scratch_test.js';
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto',
      timeout: 120000
    });
    console.log("Success:", result.public_id);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

test();
