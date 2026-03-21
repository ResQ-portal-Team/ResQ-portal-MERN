const crypto = require('crypto');
const CommunityEvent = require('../models/CommunityEvent');

const parseCloudinaryUrl = () => {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (!cloudinaryUrl) return null;
  const parsedUrl = new URL(cloudinaryUrl);
  return {
    cloudName: parsedUrl.hostname,
    apiKey: parsedUrl.username,
    apiSecret: parsedUrl.password,
  };
};

async function uploadImageToCloudinary(imageData, folder = 'resq-portal/community-events') {
  if (!imageData) return null;
  const credentials = parseCloudinaryUrl();
  if (!credentials) throw new Error('Cloudinary is not configured.');

  const timestamp = Math.floor(Date.now() / 1000);
  const signaturePayload = `folder=${folder}&timestamp=${timestamp}${credentials.apiSecret}`;
  const signature = crypto.createHash('sha1').update(signaturePayload).digest('hex');

  const body = new URLSearchParams({
    file: imageData,
    api_key: credentials.apiKey,
    timestamp: String(timestamp),
    folder,
    signature,
  });

  const response = await fetch(`https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/upload`, {
    method: 'POST',
    body,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Banner image upload failed.');
  }
  return { url: data.secure_url, publicId: data.public_id };
}

async function uploadVideoToCloudinary(videoData, folder = 'resq-portal/community-events/videos') {
  if (!videoData) return null;
  const credentials = parseCloudinaryUrl();
  if (!credentials) throw new Error('Cloudinary is not configured.');

  const timestamp = Math.floor(Date.now() / 1000);
  const signaturePayload = `folder=${folder}&timestamp=${timestamp}${credentials.apiSecret}`;
  const signature = crypto.createHash('sha1').update(signaturePayload).digest('hex');

  const body = new URLSearchParams({
    file: videoData,
    api_key: credentials.apiKey,
    timestamp: String(timestamp),
    folder,
    signature,
  });

  const response = await fetch(`https://api.cloudinary.com/v1_1/${credentials.cloudName}/video/upload`, {
    method: 'POST',
    body,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Video upload failed.');
  }
  return { url: data.secure_url, publicId: data.public_id };
}

async function deleteCloudinaryAsset(publicId, resourceType = 'image') {
  if (!publicId) return;
  const credentials = parseCloudinaryUrl();
  if (!credentials) return;

  const timestamp = Math.floor(Date.now() / 1000);
  const signaturePayload = `public_id=${publicId}&timestamp=${timestamp}${credentials.apiSecret}`;
  const signature = crypto.createHash('sha1').update(signaturePayload).digest('hex');

  const body = new URLSearchParams({
    public_id: publicId,
    api_key: credentials.apiKey,
    timestamp: String(timestamp),
    signature,
  });

  const endpoint =
    resourceType === 'video'
      ? `https://api.cloudinary.com/v1_1/${credentials.cloudName}/video/destroy`
      : `https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/destroy`;

  await fetch(endpoint, { method: 'POST', body });
}

exports.list = async (req, res) => {
  try {
    const events = await CommunityEvent.find().sort({ startDateTime: -1 }).lean();
    res.status(200).json({ events });
  } catch (err) {
    console.error('communityEvent list:', err);
    res.status(500).json({ message: 'Failed to load community events.' });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      title,
      description,
      startDateTime,
      endDateTime,
      location,
      organizer,
      category,
      bannerImageData,
      videoData,
      videoUrl: videoUrlBody,
      contactInfo,
    } = req.body;

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }
    if (!startDateTime || !location?.trim() || !organizer?.trim() || !category?.trim()) {
      return res.status(400).json({
        message: 'Start date/time, location, organizer, and category are required.',
      });
    }

    let imageUrl = null;
    let imagePublicId = null;
    if (bannerImageData) {
      const img = await uploadImageToCloudinary(bannerImageData);
      imageUrl = img.url;
      imagePublicId = img.publicId;
    }

    let videoUrl = videoUrlBody?.trim() || null;
    let videoPublicId = null;
    if (videoData) {
      const vid = await uploadVideoToCloudinary(videoData);
      videoUrl = vid.url;
      videoPublicId = vid.publicId;
    }

    const start = new Date(startDateTime);
    const end = endDateTime ? new Date(endDateTime) : null;
    if (end && end < start) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }

    const doc = await CommunityEvent.create({
      title: title.trim(),
      description: description.trim(),
      startDateTime: start,
      endDateTime: end || undefined,
      location: location.trim(),
      organizer: organizer.trim(),
      category: category.trim(),
      imageUrl,
      imagePublicId,
      videoUrl,
      videoPublicId,
      contactInfo: contactInfo?.trim() || null,
    });

    res.status(201).json({ message: 'Event created.', event: doc });
  } catch (err) {
    console.error('communityEvent create:', err);
    res.status(500).json({ message: err.message || 'Failed to create event.' });
  }
};

exports.update = async (req, res) => {
  try {
    const event = await CommunityEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const {
      title,
      description,
      startDateTime,
      endDateTime,
      location,
      organizer,
      category,
      bannerImageData,
      videoData,
      videoUrl: videoUrlBody,
      contactInfo,
    } = req.body;

    if (title !== undefined) event.title = String(title).trim();
    if (description !== undefined) event.description = String(description).trim();
    if (startDateTime !== undefined) event.startDateTime = new Date(startDateTime);
    if (endDateTime !== undefined) event.endDateTime = endDateTime ? new Date(endDateTime) : null;
    if (location !== undefined) event.location = String(location).trim();
    if (organizer !== undefined) event.organizer = String(organizer).trim();
    if (category !== undefined) event.category = String(category).trim();
    if (contactInfo !== undefined) event.contactInfo = contactInfo?.trim() || null;

    if (bannerImageData) {
      await deleteCloudinaryAsset(event.imagePublicId, 'image');
      const img = await uploadImageToCloudinary(bannerImageData);
      event.imageUrl = img.url;
      event.imagePublicId = img.publicId;
    }

    if (videoData) {
      await deleteCloudinaryAsset(event.videoPublicId, 'video');
      const vid = await uploadVideoToCloudinary(videoData);
      event.videoUrl = vid.url;
      event.videoPublicId = vid.publicId;
    } else if (videoUrlBody !== undefined && !videoData) {
      const next = videoUrlBody?.trim() || null;
      if (event.videoPublicId) {
        if (next !== event.videoUrl) {
          await deleteCloudinaryAsset(event.videoPublicId, 'video');
          event.videoPublicId = null;
          event.videoUrl = next;
        }
      } else {
        event.videoUrl = next;
      }
    }

    const start = event.startDateTime;
    const end = event.endDateTime;
    if (end && start && end < start) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }

    await event.save();
    res.status(200).json({ message: 'Event updated.', event });
  } catch (err) {
    console.error('communityEvent update:', err);
    res.status(500).json({ message: err.message || 'Failed to update event.' });
  }
};

exports.remove = async (req, res) => {
  try {
    const event = await CommunityEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    await deleteCloudinaryAsset(event.imagePublicId, 'image');
    await deleteCloudinaryAsset(event.videoPublicId, 'video');
    await event.deleteOne();
    res.status(200).json({ message: 'Event deleted.' });
  } catch (err) {
    console.error('communityEvent remove:', err);
    res.status(500).json({ message: 'Failed to delete event.' });
  }
};
