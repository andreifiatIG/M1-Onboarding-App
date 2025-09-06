import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { logger } from '../utils/logger';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
const photosDir = path.join(uploadsDir, 'photos');
const documentsDir = path.join(uploadsDir, 'documents');

// Ensure directories exist
[uploadsDir, photosDir, documentsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created directory: ${dir}`);
  }
});

// Storage configuration for photos
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, photosDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and villa ID if available
    const villaId = req.params.villaId || req.body.villaId || 'unknown';
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `${villaId}-${timestamp}-${Math.random().toString(36).substring(2)}${extension}`;
    cb(null, filename);
  },
});

// Storage configuration for documents
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, documentsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and villa ID if available
    const villaId = req.params.villaId || req.body.villaId || 'unknown';
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `${villaId}-${timestamp}-${Math.random().toString(36).substring(2)}${extension}`;
    cb(null, filename);
  },
});

// File filter for photos
const photoFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for photo: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`));
  }
};

// File filter for documents
const documentFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for document: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`));
  }
};

// Photo upload configuration
export const photoUpload = multer({
  storage: photoStorage,
  fileFilter: photoFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for photos
    files: 20, // Maximum 20 files per request
  },
});

// Document upload configuration
export const documentUpload = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit for documents
    files: 10, // Maximum 10 files per request
  },
});

// Error handler for multer
export const handleMulterError = (err: any, req: Request, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: 'File too large',
          message: 'The uploaded file exceeds the maximum allowed size',
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: 'Too many files',
          message: 'The number of uploaded files exceeds the maximum allowed',
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: 'Unexpected field',
          message: 'An unexpected field was encountered during upload',
        });
      default:
        return res.status(400).json({
          error: 'Upload error',
          message: err.message || 'An error occurred during file upload',
        });
    }
  } else if (err) {
    return res.status(400).json({
      error: 'Upload error',
      message: err.message || 'An error occurred during file upload',
    });
  }
  
  next();
};

// Helper function to get file URL
export const getFileUrl = (filename: string, type: 'photo' | 'document'): string => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:4001';
  return `${baseUrl}/api/${type}s/file/${filename}`;
};

// Helper function to delete file
export const deleteFile = (filename: string, type: 'photo' | 'document'): void => {
  const filePath = path.join(type === 'photo' ? photosDir : documentsDir, filename);
  
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      logger.info(`Deleted file: ${filePath}`);
    } catch (error) {
      logger.error(`Failed to delete file: ${filePath}`, error);
    }
  }
};

// Helper function to get file info
export const getFileInfo = (file: Express.Multer.File) => {
  return {
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
  };
};

// Helper function to generate thumbnail (placeholder for future implementation)
export const generateThumbnail = async (photoPath: string): Promise<string | null> => {
  // TODO: Implement thumbnail generation using Sharp or similar library
  // For now, return null
  logger.info(`Thumbnail generation requested for: ${photoPath}`);
  return null;
};