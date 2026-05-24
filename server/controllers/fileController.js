import File from '../models/File.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';

import fs from 'fs/promises';
import { getResourceType } from '../utils/cloudinaryUtils.js';

const uploadToCloudinary = async (filePath) => {
  return cloudinary.uploader.upload(filePath, {
    resource_type: 'auto',
    timeout: 120000 // 120 seconds timeout
  });
};

// @desc    Upload file
// @route   POST /api/files/upload
// @access  Private
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const { folderId } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const MAX_STORAGE = 500 * 1024 * 1024; // 500MB
    const currentStorage = user.storageUsed || 0;
    if (currentStorage + req.file.size > MAX_STORAGE) {
      return res.status(400).json({ success: false, message: 'Storage limit exceeded (Max 500MB)' });
    }

    // Upload to cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file.path);

    // Save metadata to MongoDB
    const file = await File.create({
      filename: req.file.originalname, // keeping original name as filename for user display
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: cloudinaryResult.secure_url,
      cloudinaryId: cloudinaryResult.public_id,
      folderId: folderId || null,
      userId: req.user._id,
    });

    user.storageUsed = currentStorage + req.file.size;
    await user.save();

    // Clean up temp file
    try {
      await fs.unlink(req.file.path);
    } catch (err) {
      console.error('Failed to delete temp file:', err);
    }

    res.status(201).json({
      success: true,
      data: file,
      storageUsed: user.storageUsed,
    });
  } catch (error) {
    console.error(error);
    
    // Clean up temp file on error too
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.error('Failed to delete temp file on error:', err);
      }
    }

    res.status(500).json({ success: false, message: 'File upload failed', error: error.message, stack: error.stack });
  }
};

// @desc    Get files
// @route   GET /api/files
// @access  Private
export const getFiles = async (req, res) => {
  try {
    const { folderId, search, isStarred, isTrashed, tag } = req.query;
    
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
        if (folderId) {
          query.folderId = folderId;
        } else if (folderId === 'null' || (!folderId && !search && !tag)) {
          query.folderId = null; // root folder
        }
      }
    }

    if (search) {
      query.filename = { $regex: search, $options: 'i' };
      delete query.folderId; // search across all folders
    }

    if (tag) {
      query['tags.name'] = tag;
      delete query.folderId; // query across all folders
    }

    const files = await File.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: files,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete file
// @route   DELETE /api/files/:id
// @access  Private
export const deleteFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.user.id });

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Soft delete logic (move to trash)
    if (!file.isTrashed) {
      file.isTrashed = true;
      file.deletedAt = new Date();
      await file.save();
      return res.status(200).json({ success: true, message: 'File moved to trash', data: file });
    }

    // Hard delete logic (from trash)
    await cloudinary.uploader.destroy(file.cloudinaryId, { resource_type: getResourceType(file.mimeType) });
    await File.deleteOne({ _id: file._id });
    
    const userToUpdate = await User.findById(req.user._id);
    if (userToUpdate) {
      userToUpdate.storageUsed = (userToUpdate.storageUsed || 0) - file.size;
      if (userToUpdate.storageUsed < 0) userToUpdate.storageUsed = 0;
      await userToUpdate.save();
    }

    res.status(200).json({
      success: true,
      message: 'File permanently deleted',
      storageUsed: userToUpdate ? userToUpdate.storageUsed : undefined
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update file (rename)
// @route   PATCH /api/files/:id
// @access  Private
export const updateFile = async (req, res) => {
  try {
    const { filename } = req.body;

    const file = await File.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { filename },
      { new: true }
    );

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    res.status(200).json({
      success: true,
      data: file,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle star
// @route   PATCH /api/files/:id/star
// @access  Private
export const toggleStar = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    file.isStarred = !file.isStarred;
    await file.save();
    res.status(200).json({ success: true, data: file });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Restore file
// @route   PATCH /api/files/:id/restore
// @access  Private
export const restoreFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });
    file.isTrashed = false;
    file.deletedAt = null;
    await file.save();
    res.status(200).json({ success: true, data: file });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Summarize file content using Gemini AI
// @route   POST /api/files/:id/summarize
// @access  Private
export const summarizeFile = async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return res.status(400).json({ 
        success: false, 
        message: 'Gemini API key is not configured. Please add a valid GEMINI_API_KEY to your server/.env file.' 
      });
    }

    const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const isImage = file.mimeType.startsWith('image/');
    const isPDF = file.mimeType === 'application/pdf' || file.filename.toLowerCase().endsWith('.pdf');
    const isText = file.mimeType.startsWith('text/') || 
                   file.filename.endsWith('.md') || 
                   file.filename.endsWith('.json') || 
                   file.filename.endsWith('.js') || 
                   file.filename.endsWith('.html') || 
                   file.filename.endsWith('.css');

    if (!isText && !isImage && !isPDF) {
      return res.status(400).json({ 
        success: false, 
        message: 'Only text files, images, and PDFs are supported for AI summarization.' 
      });
    }

    let promptText = '';
    let payload = {};

    if (isText) {
      // Fetch text content from cloudinary URL
      const response = await fetch(file.url);
      if (!response.ok) {
        return res.status(400).json({ success: false, message: 'Failed to retrieve file content' });
      }
      let fileContent = await response.text();
      
      // Truncate to first 40,000 characters to stay within safety limits
      if (fileContent.length > 40000) {
        fileContent = fileContent.substring(0, 40000) + '\n... [Content Truncated]';
      }

      promptText = `You are a helpful AI assistant. Please analyze the following file named "${file.filename}".
Provide the analysis in the following structured layout:

## Overview
A brief 1-2 sentence description explaining exactly what this file is so the user instantly understands it.

## Key Takeaways
List 2-3 of the most critical or important points from the file as short bullet points.

## Detailed Summary
A structured, detailed summary of the file's content, using subheadings if appropriate.

File Content:
${fileContent}`;
      
      payload = {
        contents: [
          {
            parts: [
              { text: promptText }
            ]
          }
        ]
      };
    } else if (isImage || isPDF) {
      // Fetch file and convert to base64
      const fileResponse = await fetch(file.url);
      if (!fileResponse.ok) {
        return res.status(400).json({ success: false, message: `Failed to retrieve ${isPDF ? 'PDF' : 'image'} content` });
      }
      const buffer = await fileResponse.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString('base64');

      if (isPDF) {
        promptText = `You are a helpful AI assistant. Please analyze this PDF document named "${file.filename}".
Provide the analysis in the following structured layout:

## Overview
A brief 1-2 sentence description explaining exactly what this PDF document is so the user instantly understands it.

## Key Takeaways
List 3-5 of the most critical or important points, findings, or sections from the PDF as short bullet points.

## Detailed Summary
A structured, detailed summary of the PDF document's contents, using subheadings if appropriate.`;
      } else {
        promptText = `Analyze this image named "${file.filename}".
Provide the analysis in the following structured layout:

## Overview
A brief 1-2 sentence description explaining exactly what this image is so the user instantly understands it.

## Key Visuals & OCR
List the most important visual components and extract any clear, visible text from the image as bullet points.

## Detailed Description
A structured, detailed analysis describing the contents, context, and elements of the image.`;
      }

      payload = {
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType: file.mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ]
      };
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      throw new Error(errorData.error?.message || 'Failed to generate content from Gemini API');
    }

    const geminiData = await geminiResponse.json();
    const summary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!summary) {
      throw new Error('Gemini API returned an empty response');
    }

    res.status(200).json({
      success: true,
      summary
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get file direct stream / inline preview
// @route   GET /api/files/:id/view
// @access  Private
export const viewFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const response = await fetch(file.url);
    if (!response.ok) {
      return res.status(400).json({ success: false, message: 'Failed to retrieve file from storage' });
    }

    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', 'inline');

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle a tag on a file
// @route   PATCH /api/files/:id/tags
// @access  Private
export const toggleFileTag = async (req, res) => {
  try {
    const { name, color } = req.body;
    const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });

    const tagIndex = file.tags.findIndex(tag => tag.name === name);
    if (tagIndex > -1) {
      file.tags.splice(tagIndex, 1);
    } else {
      file.tags.push({ name, color });
    }

    await file.save();
    res.status(200).json({ success: true, data: file });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update text file content
// @route   PUT /api/files/:id/content
// @access  Private
export const updateTextContent = async (req, res) => {
  try {
    const { content } = req.body;
    const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });

    const buffer = Buffer.from(content || '', 'utf-8');

    const cloudinaryResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          public_id: file.cloudinaryId,
          overwrite: true,
          invalidate: true
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    file.size = buffer.length;
    file.url = cloudinaryResult.secure_url;
    await file.save();

    res.status(200).json({ success: true, data: file });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new text file
// @route   POST /api/files/text
// @access  Private
export const createNewTextFile = async (req, res) => {
  try {
    const { filename, content, folderId } = req.body;
    const finalFilename = filename.endsWith('.md') || filename.endsWith('.txt') ? filename : `${filename}.txt`;

    const buffer = Buffer.from(content || '', 'utf-8');

    const cloudinaryResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'drivex_text'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const file = await File.create({
      filename: finalFilename,
      originalName: finalFilename,
      mimeType: filename.endsWith('.md') ? 'text/markdown' : 'text/plain',
      size: buffer.length,
      url: cloudinaryResult.secure_url,
      cloudinaryId: cloudinaryResult.public_id,
      folderId: folderId || null,
      userId: req.user._id,
    });

    res.status(201).json({ success: true, data: file });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Suggest user-friendly filename using Gemini AI
// @route   GET /api/files/:id/suggest-name
// @access  Private
export const suggestFileName = async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return res.status(400).json({ 
        success: false, 
        message: 'Gemini API key is not configured.' 
      });
    }

    const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });

    const isImage = file.mimeType.startsWith('image/');
    const isPDF = file.mimeType === 'application/pdf' || file.filename.toLowerCase().endsWith('.pdf');
    const isText = file.mimeType.startsWith('text/') || 
                   file.filename.endsWith('.md') || 
                   file.filename.endsWith('.json') || 
                   file.filename.endsWith('.js') || 
                   file.filename.endsWith('.html') || 
                   file.filename.endsWith('.css');

    let payload = {};
    const promptText = `Analyze this file and suggest a clean, descriptive, and user-friendly filename matching its contents. 
Original filename: "${file.filename}"
Extension: "${file.filename.split('.').pop()}"
Respond ONLY with the suggested filename string (including the extension), no explanations, no markdown formatting. E.g. "Invoice-May-2026.pdf" or "College-ID-Card.jpg".`;

    if (isText) {
      const response = await fetch(file.url);
      let fileContent = '';
      if (response.ok) {
        fileContent = await response.text();
        if (fileContent.length > 5000) fileContent = fileContent.substring(0, 5000);
      }
      payload = {
        contents: [
          {
            parts: [
              { text: `${promptText}\n\nFile Content Snippet:\n${fileContent}` }
            ]
          }
        ]
      };
    } else if (isImage || isPDF) {
      const fileResponse = await fetch(file.url);
      if (!fileResponse.ok) {
        return res.status(400).json({ success: false, message: 'Failed to retrieve file content' });
      }
      const buffer = await fileResponse.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString('base64');
      payload = {
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType: file.mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ]
      };
    } else {
      payload = {
        contents: [
          {
            parts: [
              { text: `${promptText}\nNo content available for this type. Suggest based on the original name.` }
            ]
          }
        ]
      };
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      throw new Error(errorData.error?.message || 'Gemini suggestion failed');
    }

    const geminiData = await geminiResponse.json();
    let suggestedName = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    
    // Clean up markdown wrapping if Gemini ignores instructions
    suggestedName = suggestedName.replace(/```/g, '').replace(/`/g, '').trim();

    res.status(200).json({
      success: true,
      suggestedName
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Chat with a file/document content using Gemini AI
// @route   POST /api/files/:id/chat
// @access  Private
export const chatWithFile = async (req, res) => {
  try {
    const { question, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return res.status(400).json({ 
        success: false, 
        message: 'Gemini API key is not configured.' 
      });
    }

    const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });

    const isImage = file.mimeType.startsWith('image/');
    const isPDF = file.mimeType === 'application/pdf' || file.filename.toLowerCase().endsWith('.pdf');
    const isText = file.mimeType.startsWith('text/') || 
                   file.filename.endsWith('.md') || 
                   file.filename.endsWith('.json') || 
                   file.filename.endsWith('.js') || 
                   file.filename.endsWith('.html') || 
                   file.filename.endsWith('.css');

    let payloadContents = [];

    // Construct system instruction / context part
    let contextText = `You are a helpful AI assistant. The user wants to chat about the file named "${file.filename}". Answer questions accurately based on the file content.\n\n`;

    if (isText) {
      const response = await fetch(file.url);
      let fileContent = '';
      if (response.ok) {
        fileContent = await response.text();
        if (fileContent.length > 20000) fileContent = fileContent.substring(0, 20000) + '\n... [Content Truncated]';
      }
      contextText += `File Content:\n${fileContent}\n\n`;
      payloadContents.push({
        role: 'user',
        parts: [{ text: contextText }]
      });
    } else if (isImage || isPDF) {
      const fileResponse = await fetch(file.url);
      if (!fileResponse.ok) {
        return res.status(400).json({ success: false, message: 'Failed to retrieve file content' });
      }
      const buffer = await fileResponse.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString('base64');
      
      payloadContents.push({
        role: 'user',
        parts: [
          { text: contextText },
          {
            inlineData: {
              mimeType: file.mimeType,
              data: base64Data
            }
          }
        ]
      });
    } else {
      contextText += `No content preview is available for this file type. Answer generic questions based on the filename: "${file.filename}".`;
      payloadContents.push({
        role: 'user',
        parts: [{ text: contextText }]
      });
    }

    // Add a model response to set the stage / confirm context loaded
    payloadContents.push({
      role: 'model',
      parts: [{ text: "Understood. I have loaded the file. What would you like to know about it?" }]
    });

    // Append chat history (if any)
    if (history && history.length > 0) {
      history.forEach(msg => {
        payloadContents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
    }

    // Append current user question
    payloadContents.push({
      role: 'user',
      parts: [{ text: question }]
    });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: payloadContents })
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      throw new Error(errorData.error?.message || 'Gemini chat failed');
    }

    const geminiData = await geminiResponse.json();
    const answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    res.status(200).json({
      success: true,
      answer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
