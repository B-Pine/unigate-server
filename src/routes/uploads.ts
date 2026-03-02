import { Router, Request, Response } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";
import { uploadImage, uploadAudio } from "../middleware/upload";

const router = Router();

// POST /api/uploads/image — admin uploads an image
router.post("/image", authenticate, requireAdmin, uploadImage.single("file"), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image file provided" });
  }
  // Cloudinary sets path to the full URL; local disk uses filename
  const url = (req.file as any).path?.startsWith("http")
    ? (req.file as any).path
    : `/uploads/images/${req.file.filename}`;
  res.json({ url });
});

// POST /api/uploads/audio — admin uploads audio
router.post("/audio", authenticate, requireAdmin, uploadAudio.single("file"), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "No audio file provided" });
  }
  const url = (req.file as any).path?.startsWith("http")
    ? (req.file as any).path
    : `/uploads/audio/${req.file.filename}`;
  res.json({ url });
});

export default router;
