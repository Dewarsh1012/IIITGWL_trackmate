import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const EVIDENCE_DIR = path.join(UPLOAD_DIR, 'evidence');
const FILES_DIR = path.join(UPLOAD_DIR, 'files');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}
if (!fs.existsSync(FILES_DIR)) {
    fs.mkdirSync(FILES_DIR, { recursive: true });
}

const MIME_TO_EXT: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
};

function getSafeFileName(file: Express.Multer.File): string {
    const ext = MIME_TO_EXT[file.mimetype] || '.bin';
    const random = crypto.randomUUID().replace(/-/g, '');
    return `${Date.now()}-${random}${ext}`;
}

function getExtension(fileName: string): string {
    return path.extname(fileName || '').toLowerCase();
}

function isMimeExtPairAllowed(mime: string, ext: string): boolean {
    const expectedExt = MIME_TO_EXT[mime];
    if (!expectedExt) return false;
    return expectedExt === ext || ext === '';
}

const storage = multer.diskStorage({
    destination: (_req, file, cb) => {
        const ext = MIME_TO_EXT[file.mimetype] || getExtension(file.originalname);
        if (ext === '.pdf') {
            cb(null, FILES_DIR);
            return;
        }
        cb(null, EVIDENCE_DIR);
    },
    filename: (_req, file, cb) => {
        cb(null, getSafeFileName(file));
    },
});

const fileFilter = (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const ext = getExtension(file.originalname);
    if (allowedMimes.includes(file.mimetype) && isMimeExtPairAllowed(file.mimetype, ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed with matching extension.'));
    }
};

/**
 * Upload up to 4 evidence files, max 5 MB each.
 */
export const uploadEvidence = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
        files: 6,
    },
}).array('evidence', 6);

/**
 * Upload a single avatar/logo file.
 */
export const uploadSingle = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
}).single('file');

export function toPublicUploadPath(filePath: string): string {
    const normalized = filePath.split(path.sep).join('/');
    const marker = '/uploads/';
    const index = normalized.lastIndexOf(marker);
    if (index >= 0) {
        return normalized.substring(index);
    }
    return `/uploads/${path.basename(filePath)}`;
}
