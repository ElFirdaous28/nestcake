import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';

export type UploadFolder = 'avatars' | 'portfolio' | 'requests' | 'products';

export function multerDiskConfig(folder: UploadFolder) {
  const dest = join(process.cwd(), 'public', 'uploads', folder);
  mkdirSync(dest, { recursive: true });
  const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ]);

  return {
    storage: diskStorage({
      destination: dest,
      filename: (_req, file, cb) => {
        const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${suffix}${extname(file.originalname).toLowerCase()}`);
      },
    }),
    fileFilter: (_req, file, cb) => {
      if (!allowedMimeTypes.has(file.mimetype.toLowerCase())) {
        return cb(new Error('Only jpeg, jpg, png, webp images are allowed'));
      }
      return cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  };
}
