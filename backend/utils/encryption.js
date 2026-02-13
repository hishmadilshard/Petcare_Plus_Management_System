const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.HASH_SALT_ROUNDS) || 12);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Password hashing failed');
  }
};

/**
 * Verify password against hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if match
 */
const verifyPassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    throw new Error('Password verification failed');
  }
};

/**
 * Encrypt sensitive data (for medical records, etc.)
 * @param {string} text - Text to encrypt
 * @returns {object} - Encrypted data with IV and auth tag
 */
const encrypt = (text) => {
  try {
    const algorithm = process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted,
      authTag: authTag.toString('hex')
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
};

/**
 * Decrypt sensitive data
 * @param {object} encryptedObj - Object containing iv, encryptedData, authTag
 * @returns {string} - Decrypted text
 */
const decrypt = (encryptedObj) => {
  try {
    const algorithm = process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    const iv = Buffer.from(encryptedObj.iv, 'hex');
    const authTag = Buffer.from(encryptedObj.authTag, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedObj.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Decryption failed');
  }
};

/**
 * Generate secure random token
 * @param {number} length - Token length in bytes
 * @returns {string} - Hex token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate unique QR code identifier for pets
 * @param {number} petId - Pet database ID
 * @param {number} ownerId - Owner database ID
 * @returns {string} - Unique QR identifier
 */
const generateQRIdentifier = (petId, ownerId) => {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(4).toString('hex');
  const data = `PET${petId}OWN${ownerId}${timestamp}${randomBytes}`;
  
  return crypto
    .createHash('sha256')
    .update(data + process.env.JWT_SECRET)
    .digest('hex')
    .substring(0, 16)
    .toUpperCase();
};

/**
 * Hash sensitive identifiers
 * @param {string} identifier - Identifier to hash
 * @returns {string} - Hashed identifier
 */
const hashIdentifier = (identifier) => {
  return crypto
    .createHash('sha256')
    .update(identifier + process.env.JWT_SECRET)
    .digest('hex');
};

/**
 * Generate invoice number
 * @returns {string} - Unique invoice number (e.g., INV-20260213-XXXX)
 */
const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  
  return `INV-${year}${month}${day}-${random}`;
};

module.exports = {
  hashPassword,
  verifyPassword,
  encrypt,
  decrypt,
  generateSecureToken,
  generateQRIdentifier,
  hashIdentifier,
  generateInvoiceNumber
};