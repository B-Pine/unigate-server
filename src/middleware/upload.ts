import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import "../lib/cloudinary"; // triggers cloudinary.config()

const isProduction = process.env.NODE_ENV === "production";

// ── Helper: create local directory if it doesn't exist ──
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ── Helper: local disk storage factory ──
function localDisk(subDir: string) {
  const dir = path.join(process.env.UPLOAD_DIR || "./uploads", subDir);
  ensureDir(dir);
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    },
  });
}

// ── Helper: Cloudinary storage factory ──
function cloudStorage(folder: string, resourceType: "image" | "video" | "raw" | "auto" = "auto", allowedFormats?: string[]) {
  return new CloudinaryStorage({
    cloudinary,
    params: async (_req: any, _file: any) => {
      return {
        folder: `unigate/${folder}`,
        resource_type: resourceType,
        public_id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
        ...(allowedFormats ? { allowed_formats: allowedFormats } : {}),
      };
    },
  } as any);
}

// ── File Filters ──
const pdfFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"));
  }
};

const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, PNG, WebP, GIF) are allowed"));
  }
};

const audioFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/x-m4a"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only audio files (MP3, WAV, OGG, M4A) are allowed"));
  }
};

// ── Past Papers (PDF) ──
export const uploadPaper = multer({
  storage: isProduction
    ? cloudStorage("past-papers", "raw", ["pdf"])
    : localDisk("past-papers"),
  fileFilter: pdfFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ── Images (scholarships/jobs) ──
export const uploadImage = multer({
  storage: isProduction
    ? cloudStorage("images", "image", ["jpg", "jpeg", "png", "webp", "gif"])
    : localDisk("images"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ── Audio (scholarships/jobs) ──
export const uploadAudio = multer({
  storage: isProduction
    ? cloudStorage("audio", "video", ["mp3", "wav", "ogg", "m4a"])
    : localDisk("audio"),
  fileFilter: audioFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});

// ── Payment Proof (images) ──
export const uploadPaymentProof = multer({
  storage: isProduction
    ? cloudStorage("payments", "image", ["jpg", "jpeg", "png", "webp", "gif"])
    : localDisk("payments"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
