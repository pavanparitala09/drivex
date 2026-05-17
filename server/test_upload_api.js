import fs from 'fs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function testUpload() {
  try {
    const filePath = './scratch_test.js'; // some file to upload
    
    const fileData = fs.readFileSync(filePath);
    
    const token = jwt.sign({ id: '6a05d8f0f43d4cf68b275559' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    // We need to construct a multipart/form-data body manually for fetch
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    
    let data = '';
    data += '--' + boundary + '\r\n';
    data += 'Content-Disposition: form-data; name="file"; filename="scratch_test.js"\r\n';
    data += 'Content-Type: application/javascript\r\n\r\n';
    
    const payload = Buffer.concat([
        Buffer.from(data, 'utf8'),
        fileData,
        Buffer.from('\r\n--' + boundary + '--\r\n', 'utf8')
    ]);

    const response = await fetch('http://localhost:5000/api/files/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: payload
    });

    const result = await response.json().catch(() => response.text());
    console.log("Status:", response.status);
    console.log("Response:", result);

  } catch (error) {
    console.error("Error:", error);
  }
}

testUpload();
