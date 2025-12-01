import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Get the folder path for a tenant's uploads
 * Uses the business slug for readable folder names in Cloudinary
 *
 * IMPORTANT: The business slug cannot be changed once set because
 * it determines the Cloudinary folder structure. Changing the slug
 * would orphan existing images. Users must contact support to change
 * their business name/slug.
 *
 * @param {string} slug - The tenant's business slug
 */
export function getTenantFolder(slug) {
  return `clientflow/${slug}`;
}

/**
 * Get Cloudinary transformation based on image type
 * Each type has an optimized aspect ratio for its use case
 * @param {string} type - The image type
 * @returns {object|null} Cloudinary transformation object or null for no transformation
 */
export function getTransformationForType(type) {
  const transformations = {
    // Logo: Keep original aspect ratio, just limit max size (preserves shape of wordmarks, icons, etc.)
    logo: { width: 800, height: 800, crop: "limit", quality: "auto" },
    // Hero: Full-width display, 16:9 widescreen
    hero: { width: 1920, aspect_ratio: "16:9", crop: "fill", gravity: "auto", quality: "auto" },
    // Banner: Ultra-wide for full-width banners
    banner: { width: 1920, aspect_ratio: "21:9", crop: "fill", gravity: "auto", quality: "auto" },
    // Gallery: Classic photography ratio (3:2)
    gallery: { width: 1200, aspect_ratio: "3:2", crop: "fill", gravity: "auto", quality: "auto" },
    // Team: Square with face detection for portraits
    team: { width: 800, aspect_ratio: "1:1", crop: "fill", gravity: "face", quality: "auto" },
    // Product: Square for e-commerce products
    product: { width: 800, aspect_ratio: "1:1", crop: "fill", gravity: "auto", quality: "auto" },
    // General: Versatile standard ratio
    general: { width: 1200, aspect_ratio: "4:3", crop: "fill", gravity: "auto", quality: "auto" },
  };

  return transformations[type] ?? transformations.general;
}

/**
 * Check if image type requires PNG format (for transparency)
 * Logos always use PNG because they have transparent padding added
 * @param {string} type - The image type
 * @returns {boolean} Whether to use PNG format
 */
export function shouldUsePng(type) {
  return type === "logo";
}

/**
 * Upload an image to Cloudinary with tenant isolation
 * @param {Buffer|string} file - File buffer or base64 string
 * @param {string} slug - Tenant's business slug for folder isolation
 * @param {string} type - Image type for aspect ratio transformation
 * @param {string} mimeType - Original file MIME type (e.g., "image/png")
 * @param {object} options - Additional upload options
 */
export async function uploadImage(file, slug, type = "general", mimeType = "image/jpeg", options = {}) {
  const folder = getTenantFolder(slug);
  const transformation = getTransformationForType(type);

  // Logos always use PNG to preserve transparent padding, others use WebP for smaller size
  const outputFormat = shouldUsePng(type) ? "png" : "webp";

  const uploadOptions = {
    folder,
    resource_type: "image",
    format: outputFormat,
    // Only apply transformation if type has one (logos keep original aspect ratio)
    ...(transformation && { transformation: [transformation] }),
    ...options,
  };

  // If file is a base64 string, upload directly
  // If it's a buffer, convert to base64 data URI with correct MIME type
  const fileToUpload =
    typeof file === "string"
      ? file
      : `data:${mimeType};base64,${file.toString("base64")}`;

  const result = await cloudinary.uploader.upload(fileToUpload, uploadOptions);

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

/**
 * Generate a Cloudinary URL with transformation for a given public_id and type
 * Used when changing image type to regenerate the URL with new transformation
 * @param {string} publicId - The Cloudinary public_id
 * @param {string} type - Image type for aspect ratio transformation
 * @param {string} currentFormat - Current format of the image (png, webp, etc.)
 * @returns {string} The transformed image URL
 */
export function generateImageUrl(publicId, type = "general") {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const transformation = getTransformationForType(type);

  // Logos always use PNG for transparent padding, others use WebP
  const outputFormat = shouldUsePng(type) ? "png" : "webp";

  // Build transformation string manually
  let transformationStr = "";
  if (transformation) {
    const parts = [];
    if (transformation.width) parts.push(`w_${transformation.width}`);
    if (transformation.height) parts.push(`h_${transformation.height}`);
    if (transformation.aspect_ratio) parts.push(`ar_${transformation.aspect_ratio}`);
    if (transformation.crop) parts.push(`c_${transformation.crop}`);
    if (transformation.gravity) parts.push(`g_${transformation.gravity}`);
    if (transformation.background) parts.push(`b_${transformation.background}`);
    if (transformation.quality) parts.push(`q_${transformation.quality}`);
    transformationStr = parts.join(",") + "/";
  }

  // Build the full URL
  // Format: https://res.cloudinary.com/{cloud}/image/upload/{transformations}/{public_id}.{format}
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformationStr}${publicId}.${outputFormat}`;
}

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 */
export async function deleteImage(publicId) {
  const result = await cloudinary.uploader.destroy(publicId);
  return result.result === "ok";
}

// ============================================
// VIDEO FUNCTIONS
// ============================================

/**
 * Video type options with their intended use cases
 * - hero: Full-width background videos (16:9)
 * - background: Looping ambient background videos
 * - testimonial: Customer testimonial videos (16:9)
 * - tutorial: How-to/explainer videos (16:9)
 * - promo: Promotional/marketing videos (16:9)
 * - general: General purpose videos
 */
const VIDEO_TYPES = ["hero", "background", "testimonial", "tutorial", "promo", "general"];

/**
 * Get Cloudinary transformation based on video type
 * @param {string} type - The video type
 * @returns {object} Cloudinary transformation object
 */
export function getVideoTransformationForType(type) {
  const transformations = {
    // Hero: Full HD, optimized for quality
    hero: { width: 1920, height: 1080, crop: "limit", quality: "auto:good" },
    // Background: Smaller, optimized for looping
    background: { width: 1280, height: 720, crop: "limit", quality: "auto:eco" },
    // Testimonial: HD quality for talking heads
    testimonial: { width: 1920, height: 1080, crop: "limit", quality: "auto:good" },
    // Tutorial: HD quality for clear visuals
    tutorial: { width: 1920, height: 1080, crop: "limit", quality: "auto:good" },
    // Promo: Full HD for marketing
    promo: { width: 1920, height: 1080, crop: "limit", quality: "auto:good" },
    // General: Balanced quality and size
    general: { width: 1280, height: 720, crop: "limit", quality: "auto" },
  };

  return transformations[type] ?? transformations.general;
}

/**
 * Upload a video to Cloudinary with tenant isolation
 * @param {Buffer|string} file - File buffer or base64 string
 * @param {string} slug - Tenant's business slug for folder isolation
 * @param {string} type - Video type for transformation
 * @param {object} options - Additional upload options
 */
export async function uploadVideo(file, slug, type = "general", options = {}) {
  const folder = getTenantFolder(slug) + "/videos";
  const transformation = getVideoTransformationForType(type);

  const uploadOptions = {
    folder,
    resource_type: "video",
    format: "mp4", // Convert all videos to MP4 for broad compatibility
    transformation: [transformation],
    eager: [
      // Generate a thumbnail automatically
      { width: 640, height: 360, crop: "fill", format: "jpg" },
    ],
    eager_async: true,
    ...options,
  };

  // If file is a base64 string, upload directly
  // If it's a buffer, convert to base64 data URI
  const fileToUpload =
    typeof file === "string"
      ? file
      : `data:video/mp4;base64,${file.toString("base64")}`;

  const result = await cloudinary.uploader.upload(fileToUpload, uploadOptions);

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
    duration: result.duration,
    thumbnailUrl: result.eager?.[0]?.secure_url || null,
  };
}

/**
 * Generate a Cloudinary video URL with transformation
 * @param {string} publicId - The Cloudinary public_id
 * @param {string} type - Video type for transformation
 * @returns {string} The transformed video URL
 */
export function generateVideoUrl(publicId, type = "general") {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const transformation = getVideoTransformationForType(type);

  // Build transformation string
  const parts = [];
  if (transformation.width) parts.push(`w_${transformation.width}`);
  if (transformation.height) parts.push(`h_${transformation.height}`);
  if (transformation.crop) parts.push(`c_${transformation.crop}`);
  if (transformation.quality) parts.push(`q_${transformation.quality}`);
  const transformationStr = parts.length > 0 ? parts.join(",") + "/" : "";

  return `https://res.cloudinary.com/${cloudName}/video/upload/${transformationStr}${publicId}.mp4`;
}

/**
 * Generate a thumbnail URL for a video
 * @param {string} publicId - The Cloudinary public_id
 * @returns {string} The thumbnail URL
 */
export function generateVideoThumbnailUrl(publicId) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/video/upload/w_640,h_360,c_fill,so_0/${publicId}.jpg`;
}

/**
 * Delete a video from Cloudinary
 * @param {string} publicId - The public ID of the video to delete
 */
export async function deleteVideo(publicId) {
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
  return result.result === "ok";
}

/**
 * Delete multiple images from Cloudinary
 * @param {string[]} publicIds - Array of public IDs to delete
 */
export async function deleteImages(publicIds) {
  const result = await cloudinary.api.delete_resources(publicIds);
  return result;
}

/**
 * Delete all images in a tenant's folder
 * Useful for tenant cleanup/deletion
 * @param {string} slug - Tenant's business slug
 */
export async function deleteTenantImages(slug) {
  const folder = getTenantFolder(slug);
  const result = await cloudinary.api.delete_resources_by_prefix(folder);
  return result;
}

/**
 * List all images in a tenant's folder
 * @param {string} slug - Tenant's business slug
 * @param {object} options - Pagination options
 */
export async function listTenantImages(slug, options = {}) {
  const folder = getTenantFolder(slug);
  const result = await cloudinary.api.resources({
    type: "upload",
    prefix: folder,
    max_results: options.limit || 100,
    next_cursor: options.cursor,
  });
  return {
    images: result.resources,
    nextCursor: result.next_cursor,
  };
}

/**
 * Generate a signed upload URL for client-side uploads
 * This allows direct browser-to-Cloudinary uploads with tenant isolation
 * @param {string} slug - Tenant's business slug for folder isolation
 */
export function generateUploadSignature(slug) {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = getTenantFolder(slug);
  const transformation = "ar_16:9,c_fill,g_auto"; // 16:9 aspect ratio with smart cropping

  const params = {
    timestamp,
    folder,
    format: "webp", // Convert all images to WebP for optimal file size
    transformation,
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET
  );

  return {
    signature,
    timestamp,
    folder,
    format: "webp",
    transformation,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  };
}

export default cloudinary;
