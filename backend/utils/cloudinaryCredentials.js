/**
 * Shared Cloudinary credentials from env (same rules as lost/found uploads).
 * Supports CLOUDINARY_URL (cloudinary://...) or discrete CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET.
 */
function parseCloudinaryUrl() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  if (cloudinaryUrl) {
    try {
      const parsed = new URL(cloudinaryUrl);
      if (parsed.protocol !== 'cloudinary:') return null;

      const cloudName = parsed.hostname;
      const apiKey = decodeURIComponent(parsed.username || '');
      const apiSecret = decodeURIComponent(parsed.password || '');

      if (!cloudName || !apiKey || !apiSecret) return null;
      return { cloudName, apiKey, apiSecret };
    } catch (err) {
      console.error('Invalid CLOUDINARY_URL format:', err.message);
      return null;
    }
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

module.exports = { parseCloudinaryUrl };
