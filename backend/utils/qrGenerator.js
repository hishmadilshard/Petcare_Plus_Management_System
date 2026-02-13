const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { generateQRIdentifier } = require('./encryption');

/**
 * Generate QR code for a pet
 * @param {number} petId - Pet database ID
 * @param {number} ownerId - Owner database ID
 * @param {string} petName - Pet name
 * @returns {Promise<object>} - QR code data
 */
const generatePetQRCode = async (petId, ownerId, petName) => {
  try {
    // Generate unique identifier
    const qrIdentifier = generateQRIdentifier(petId, ownerId);
    
    // Create QR data payload
    const qrData = {
      type: 'PETCARE_PLUS_PET',
      version: '1.0',
      petId: petId,
      ownerId: ownerId,
      identifier: qrIdentifier,
      petName: petName,
      generatedAt: new Date().toISOString(),
      validUntil: null //永久有效
    };
    
    const qrString = JSON.stringify(qrData);
    
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'H', // High error correction
      type: 'image/png',
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Save QR code to file
    const uploadsDir = path.join(__dirname, '../uploads/qrcodes');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filename = `pet_${petId}_${qrIdentifier}.png`;
    const filepath = path.join(uploadsDir, filename);
    
    // Extract base64 data and save
    const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(filepath, base64Data, 'base64');
    
    console.log(`✅ QR code generated for Pet ID ${petId}: ${filename}`);
    
    return {
      qrIdentifier,
      qrCodeDataURL,
      qrCodePath: `/uploads/qrcodes/${filename}`,
      qrCodeFilename: filename
    };
    
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Verify QR code data
 * @param {string} qrData - QR code data (JSON string)
 * @returns {object} - Verification result
 */
const verifyQRCode = (qrData) => {
  try {
    const data = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    
    // Check QR code type
    if (data.type !== 'PETCARE_PLUS_PET') {
      return {
        valid: false,
        message: 'Invalid QR code type - not a PetCare Plus pet QR code'
      };
    }
    
    // Check required fields
    if (!data.petId || !data.ownerId || !data.identifier) {
      return {
        valid: false,
        message: 'Incomplete QR code data - missing required fields'
      };
    }
    
    // Check version compatibility
    if (data.version !== '1.0') {
      return {
        valid: false,
        message: 'Incompatible QR code version'
      };
    }
    
    // Check validity period (if set)
    if (data.validUntil) {
      const validUntil = new Date(data.validUntil);
      if (validUntil < new Date()) {
        return {
          valid: false,
          message: 'QR code has expired'
        };
      }
    }
    
    return {
      valid: true,
      petId: data.petId,
      ownerId: data.ownerId,
      identifier: data.identifier,
      petName: data.petName,
      generatedAt: data.generatedAt
    };
    
  } catch (error) {
    console.error('QR verification error:', error);
    return {
      valid: false,
      message: 'Invalid QR code format - unable to parse data'
    };
  }
};

/**
 * Generate QR code as buffer (for inline display)
 * @param {object} qrData - QR code data object
 * @returns {Promise<Buffer>} - QR code image buffer
 */
const generateQRCodeBuffer = async (qrData) => {
  try {
    const qrString = JSON.stringify(qrData);
    
    return await QRCode.toBuffer(qrString, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 400,
      margin: 2
    });
    
  } catch (error) {
    console.error('QR buffer generation error:', error);
    throw new Error('Failed to generate QR code buffer');
  }
};

/**
 * Delete QR code file
 * @param {string} filename - QR code filename
 * @returns {boolean} - Success status
 */
const deleteQRCode = (filename) => {
  try {
    const filepath = path.join(__dirname, '../uploads/qrcodes', filename);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log(`🗑️ QR code deleted: ${filename}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('QR deletion error:', error);
    return false;
  }
};

module.exports = {
  generatePetQRCode,
  verifyQRCode,
  generateQRCodeBuffer,
  deleteQRCode
};