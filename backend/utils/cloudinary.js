const cloudinary = require('cloudinary').v2;

const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function isCloudinaryConfigured() {
  return isConfigured;
}

/**
 * Upload a memory buffer (e.g. from multer memoryStorage) to Cloudinary
 */
function uploadBuffer(buffer, options = {}) {
  if (!isCloudinaryConfigured()) {
    return Promise.reject(new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'));
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'hoftrix/branding',
        ...options,
      },
      (error, result) => {
        if (error) {
          if (error.http_code === 403 && error.message && error.message.includes('missing permissions')) {
            const friendlyErr = new Error(
              'Cloudinary API Key is missing "Create/Upload" permission. In Cloudinary Console, go to Settings > Access Keys, edit your API key and enable "Create" permission, or use the Master API Key.'
            );
            friendlyErr.http_code = 403;
            friendlyErr.originalError = error;
            return reject(friendlyErr);
          }
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Upload a base64 data URI (e.g. from canvas signature) to Cloudinary
 */
async function uploadBase64(base64Data, options = {}) {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  }

  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      resource_type: 'image',
      folder: 'hoftrix/branding',
      ...options,
    });
    return result;
  } catch (error) {
    if (error.http_code === 403 && error.message && error.message.includes('missing permissions')) {
      const friendlyErr = new Error(
        'Cloudinary API Key is missing "Create/Upload" permission. In Cloudinary Console, go to Settings > Access Keys, edit your API key and enable "Create" permission, or use the Master API Key.'
      );
      friendlyErr.http_code = 403;
      friendlyErr.originalError = error;
      throw friendlyErr;
    }
    throw error;
  }
}

/**
 * Extract public_id from a Cloudinary URL
 */
function getPublicIdFromUrl(url = '') {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return null;
  }

  try {
    // Cloudinary URL format:
    // https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<public_id>.<ext>
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Safely delete an image from Cloudinary (ignoring errors if not found)
 */
async function deleteImage(publicIdOrUrl) {
  if (!isCloudinaryConfigured() || !publicIdOrUrl) return;

  const publicId = publicIdOrUrl.startsWith('http')
    ? getPublicIdFromUrl(publicIdOrUrl)
    : publicIdOrUrl;

  if (!publicId) return;

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`🗑️ Cloudinary image deleted: ${publicId}`, result);
    return result;
  } catch (err) {
    console.warn(`⚠️ Cloudinary delete failed for ${publicId}:`, err.message);
  }
}

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadBuffer,
  uploadBase64,
  deleteImage,
  getPublicIdFromUrl,
};
