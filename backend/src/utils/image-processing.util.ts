/**
 * Image Processing Utility
 * 
 * Handles image operations including thumbnail generation and EXIF data extraction.
 * Uses Sharp for efficient image processing.
 */

import sharp from 'sharp';
import { logger } from './logger';

// Thumbnail configuration
const THUMBNAIL_WIDTH = 200;
const THUMBNAIL_HEIGHT = 200;
const THUMBNAIL_QUALITY = 80;

/**
 * Image dimensions
 */
export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * EXIF data structure
 */
export interface ExifData {
  make?: string;
  model?: string;
  dateTime?: string;
  orientation?: number;
  gps?: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
  };
  exposureTime?: string;
  fNumber?: number;
  iso?: number;
  focalLength?: string;
  flash?: string;
}

/**
 * Image processing result
 */
export interface ImageProcessResult {
  dimensions: ImageDimensions;
  thumbnail?: Buffer;
  exifData?: ExifData;
}

/**
 * Generate thumbnail from image buffer
 */
export const generateThumbnail = async (
  imageBuffer: Buffer,
  width: number = THUMBNAIL_WIDTH,
  height: number = THUMBNAIL_HEIGHT
): Promise<Buffer> => {
  try {
    const thumbnail = await sharp(imageBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: THUMBNAIL_QUALITY })
      .toBuffer();

    logger.info('Thumbnail generated', { width, height, size: thumbnail.length });
    return thumbnail;
  } catch (error) {
    logger.error('Failed to generate thumbnail', { error });
    throw new Error('Thumbnail generation failed');
  }
};

/**
 * Get image dimensions
 */
export const getImageDimensions = async (imageBuffer: Buffer): Promise<ImageDimensions> => {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to determine image dimensions');
    }

    return {
      width: metadata.width,
      height: metadata.height
    };
  } catch (error) {
    logger.error('Failed to get image dimensions', { error });
    throw error;
  }
};

/**
 * Extract EXIF data from image
 */
export const extractExifData = async (imageBuffer: Buffer): Promise<ExifData | null> => {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const exif = metadata.exif;

    if (!exif) {
      return null;
    }

    // Parse EXIF buffer
    const exifData: ExifData = {};

    // Basic camera info
    if (metadata.exif) {
      try {
        // Sharp provides EXIF as a buffer, we'll extract common fields
        // For more detailed EXIF parsing, consider using 'exif-parser' library
        
        // Extract what Sharp provides directly
        if (metadata.orientation) {
          exifData.orientation = metadata.orientation;
        }

        // Note: For full EXIF support, you may want to add the 'exif-parser' package
        // This is a simplified version using what Sharp provides
        
        logger.info('EXIF data extracted', { hasExif: !!exif });
      } catch (parseError) {
        logger.warn('Failed to parse EXIF data', { parseError });
      }
    }

    return Object.keys(exifData).length > 0 ? exifData : null;
  } catch (error) {
    logger.error('Failed to extract EXIF data', { error });
    return null;
  }
};

/**
 * Process image: get dimensions, generate thumbnail, extract EXIF
 */
export const processImage = async (imageBuffer: Buffer): Promise<ImageProcessResult> => {
  try {
    const [dimensions, thumbnail, exifData] = await Promise.all([
      getImageDimensions(imageBuffer),
      generateThumbnail(imageBuffer),
      extractExifData(imageBuffer)
    ]);

    logger.info('Image processed', { 
      dimensions, 
      thumbnailSize: thumbnail.length,
      hasExif: !!exifData 
    });

    return {
      dimensions,
      thumbnail,
      exifData: exifData || undefined
    };
  } catch (error) {
    logger.error('Failed to process image', { error });
    throw error;
  }
};

/**
 * Optimize image for web
 */
export const optimizeImage = async (
  imageBuffer: Buffer,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 85
): Promise<Buffer> => {
  try {
    const optimized = await sharp(imageBuffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality, progressive: true })
      .toBuffer();

    logger.info('Image optimized', { 
      originalSize: imageBuffer.length,
      optimizedSize: optimized.length,
      reduction: ((1 - optimized.length / imageBuffer.length) * 100).toFixed(2) + '%'
    });

    return optimized;
  } catch (error) {
    logger.error('Failed to optimize image', { error });
    throw error;
  }
};

/**
 * Convert image to specified format
 */
export const convertImageFormat = async (
  imageBuffer: Buffer,
  format: 'jpeg' | 'png' | 'webp',
  quality: number = 85
): Promise<Buffer> => {
  try {
    let converter = sharp(imageBuffer);

    switch (format) {
      case 'jpeg':
        converter = converter.jpeg({ quality });
        break;
      case 'png':
        converter = converter.png({ quality });
        break;
      case 'webp':
        converter = converter.webp({ quality });
        break;
    }

    const converted = await converter.toBuffer();
    logger.info('Image format converted', { format, size: converted.length });
    return converted;
  } catch (error) {
    logger.error('Failed to convert image format', { error, format });
    throw error;
  }
};

/**
 * Check if file is an image based on MIME type
 */
export const isImage = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};

/**
 * Check if file is a document based on MIME type
 */
export const isDocument = (mimeType: string): boolean => {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  return documentTypes.includes(mimeType);
};

/**
 * Strip EXIF data from image (for privacy)
 */
export const stripExifData = async (imageBuffer: Buffer): Promise<Buffer> => {
  try {
    const stripped = await sharp(imageBuffer)
      .rotate() // This auto-rotates based on EXIF and removes orientation data
      .toBuffer();

    logger.info('EXIF data stripped from image');
    return stripped;
  } catch (error) {
    logger.error('Failed to strip EXIF data', { error });
    throw error;
  }
};

export default {
  generateThumbnail,
  getImageDimensions,
  extractExifData,
  processImage,
  optimizeImage,
  convertImageFormat,
  isImage,
  isDocument,
  stripExifData
};

