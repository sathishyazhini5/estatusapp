const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const { BlobServiceClient } = require('@azure/storage-blob');
const authAccessToken = require('../middlewares/authAccessToken');
const db = require('../middlewares/db'); // PostgreSQL client

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME;

router.post('/upload-confrere-photo', authAccessToken, upload.single('file'), async (req, res) => {
  try {
    const confrer_code = req.authuser?.confrer_code;

    if (!confrer_code || !req.file) {
      return res.json({ response_code: 0, message: 'Missing token data or file.' });
    }

    // ✅ Fetch province_code from DB with correct schema reference
    const selectQuery = `
      SELECT province_code 
      FROM estatus.confreres_dtl 
      WHERE confrer_code = $1 
      LIMIT 1
    `;
    const { rows } = await db.query(selectQuery, [confrer_code]);

    if (rows.length === 0) {
      return res.json({ response_code: 0, message: 'User not found in database.' });
    }

    const province_code = rows[0].province_code;
    const file = req.file;
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png'];

    if (!allowed.includes(ext)) {
      return res.json({ response_code: 0, message: 'Invalid file format. Use .jpg, .jpeg, or .png.' });
    }

    const imageName = `${confrer_code}${ext}`;
    const blobName = `confrere_photos/${province_code}/${imageName}`;
    const thumbBlobName = `confrere_photos/${province_code}/thumb_64/${imageName}`;

    // 🔧 Compress image < 512KB
    let quality = 80;
    let outputBuffer = await sharp(file.buffer).jpeg({ quality }).toBuffer();

    while (outputBuffer.length > 512 * 1024 && quality > 10) {
      quality -= 10;
      outputBuffer = await sharp(file.buffer).jpeg({ quality }).toBuffer();
    }

    if (outputBuffer.length > 512 * 1024) {
      return res.json({
        response_code: 0,
        message: 'Image size exceeds 512KB after compression.'
      });
    }

    // 🔧 Create thumbnail (100px width)
    const thumbBuffer = await sharp(outputBuffer).resize({ width: 100 }).toBuffer();

    // 📤 Upload to Azure Blob Storage
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    const imageBlob = containerClient.getBlockBlobClient(blobName);
    const thumbBlob = containerClient.getBlockBlobClient(thumbBlobName);

    await imageBlob.uploadData(outputBuffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype }
    });

    await thumbBlob.uploadData(thumbBuffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype }
    });

    const publicUrl = imageBlob.url;

    // ✅ Update image info in DB (schema optional here)
    const updateQuery = `
      UPDATE estatus.confreres_dtl 
      SET image_file_name = $1, image_file_path = $2, updated_date = NOW() 
      WHERE confrer_code = $3 AND province_code = $4
    `;
    await db.query(updateQuery, [imageName, publicUrl, confrer_code, province_code]);

    return res.json({
      response_code: 1,
      data: imageName,
      message: 'Profile Updated Successfully'
    });

  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({
      response_code: 0,
      message: 'Upload failed.',
      error: err.message
    });
  }
});

module.exports = router;
