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
 */
export function getTenantFolder(slug) {
  return `clientflow/${slug}`;
}

/**
 * Get Cloudinary transformation based on image type
 */
export function getTransformationForType(type) {
  const transformations = {
    logo: { width: 800, height: 800, crop: "limit", quality: "auto" },
    hero: { width: 1920, aspect_ratio: "16:9", crop: "fill", gravity: "auto", quality: "auto" },
    banner: { width: 1920, aspect_ratio: "21:9", crop: "fill", gravity: "auto", quality: "auto" },
    gallery: { width: 1200, aspect_ratio: "3:2", crop: "fill", gravity: "auto", quality: "auto" },
    team: { width: 800, aspect_ratio: "1:1", crop: "fill", gravity: "face", quality: "auto" },
    product: { width: 800, aspect_ratio: "1:1", crop: "fill", gravity: "auto", quality: "auto" },
    general: { width: 1200, aspect_ratio: "4:3", crop: "fill", gravity: "auto", quality: "auto" },
  };

  return transformations[type] ?? transformations.general;
}

/**
 * Check if image type requires PNG format (for transparency)
 */
export function shouldUsePng(type) {
  return type === "logo";
}

/**
 * Upload an image to Cloudinary with tenant isolation
 */
export async function uploadImage(file, slug, type = "general", mimeType = "image/jpeg", options = {}) {
  const folder = getTenantFolder(slug);
  const transformation = getTransformationForType(type);
  const outputFormat = shouldUsePng(type) ? "png" : "webp";

  const uploadOptions = {
    folder,
    resource_type: "image",
    format: outputFormat,
    ...(transformation && { transformation: [transformation] }),
    ...options,
  };

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
 * Generate a Cloudinary URL with transformation
 */
export function generateImageUrl(publicId, type = "general") {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const transformation = getTransformationForType(type);
  const outputFormat = shouldUsePng(type) ? "png" : "webp";

  let transformationStr = "";
  if (transformation) {
    const parts = [];
    if (transformation.width) parts.push(`w_${transformation.width}`);
    if (transformation.height) parts.push(`h_${transformation.height}`);
    if (transformation.aspect_ratio) parts.push(`ar_${transformation.aspect_ratio}`);
    if (transformation.crop) parts.push(`c_${transformation.crop}`);
    if (transformation.gravity) parts.push(`g_${transformation.gravity}`);
    if (transformation.quality) parts.push(`q_${transformation.quality}`);
    transformationStr = parts.join(",") + "/";
  }

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformationStr}${publicId}.${outputFormat}`;
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteImage(publicId) {
  const result = await cloudinary.uploader.destroy(publicId);
  return result.result === "ok";
}

/**
 * Get Cloudinary transformation based on video type
 */
export function getVideoTransformationForType(type) {
  const transformations = {
    hero: { width: 1920, height: 1080, crop: "limit", quality: "auto:good" },
    background: { width: 1280, height: 720, crop: "limit", quality: "auto:eco" },
    testimonial: { width: 1920, height: 1080, crop: "limit", quality: "auto:good" },
    tutorial: { width: 1920, height: 1080, crop: "limit", quality: "auto:good" },
    promo: { width: 1920, height: 1080, crop: "limit", quality: "auto:good" },
    general: { width: 1280, height: 720, crop: "limit", quality: "auto" },
  };

  return transformations[type] ?? transformations.general;
}

/**
 * Upload a video to Cloudinary with tenant isolation
 */
export async function uploadVideo(file, slug, type = "general", options = {}) {
  const folder = getTenantFolder(slug) + "/videos";
  const transformation = getVideoTransformationForType(type);

  const uploadOptions = {
    folder,
    resource_type: "video",
    format: "mp4",
    transformation: [transformation],
    eager: [{ width: 640, height: 360, crop: "fill", format: "jpg" }],
    eager_async: true,
    ...options,
  };

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
 */
export function generateVideoUrl(publicId, type = "general") {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const transformation = getVideoTransformationForType(type);

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
 */
export function generateVideoThumbnailUrl(publicId) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/video/upload/w_640,h_360,c_fill,so_0/${publicId}.jpg`;
}

/**
 * Delete a video from Cloudinary
 */
export async function deleteVideo(publicId) {
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
  return result.result === "ok";
}

/**
 * Delete multiple images from Cloudinary
 */
export async function deleteImages(publicIds) {
  const result = await cloudinary.api.delete_resources(publicIds);
  return result;
}

/**
 * Delete all images in a tenant's folder
 */
export async function deleteTenantImages(slug) {
  const folder = getTenantFolder(slug);
  const result = await cloudinary.api.delete_resources_by_prefix(folder);
  return result;
}

/**
 * List all images in a tenant's folder
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
 */
export function generateUploadSignature(slug) {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = getTenantFolder(slug);
  const transformation = "ar_16:9,c_fill,g_auto";

  const params = {
    timestamp,
    folder,
    format: "webp",
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
