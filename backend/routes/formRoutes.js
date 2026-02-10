import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { authMiddleware } from "../middleware/auth.js";
import {
  generateFormFromImage,
  generateFormFromText,
  getUserForms,
  getFormById,
  updateForm,
  deleteForm,
  submitForm,
  getFormSubmissions,
  getAllUserSubmissions,
  deleteSubmission,
  updateSubmission,
  getFieldAlternatives,
  getFieldGuidanceAPI,
  getBatchGuidanceAPI,
  smartGenerateFromImage,
} from "../controllers/formController.js";

const router = express.Router();

// Configure multer for form image uploads (Memory Storage for OCR processing)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Configure multer for submission file uploads (Disk Storage)
const submissionsDir = path.join("uploads", "submissions");
if (!fs.existsSync(submissionsDir)) {
  fs.mkdirSync(submissionsDir, { recursive: true });
}

const submissionUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, submissionsDir);
    },
    filename: (req, file, cb) => {
      const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
      cb(null, safeName);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Form generation routes
router.post(
  "/generate-from-image",
  authMiddleware,
  upload.single("formImage"),
  generateFormFromImage,
);
router.post(
  "/smart-generate-from-image",
  authMiddleware,
  upload.single("formImage"),
  smartGenerateFromImage,
);
router.post("/generate-from-text", authMiddleware, generateFormFromText);

// Form management routes
router.get("/", authMiddleware, getUserForms);
router.get("/:formId", authMiddleware, getFormById);
router.put("/:formId", authMiddleware, updateForm);
router.delete("/:formId", authMiddleware, deleteForm);

// Submission routes
router.post("/:formId/submit", authMiddleware, submissionUpload.any(), submitForm);
// 🤖 AI Guidance routes
router.post("/field-guidance", authMiddleware, getFieldGuidanceAPI);
router.post("/batch-guidance", authMiddleware, getBatchGuidanceAPI);

router.get("/:formId/submissions", authMiddleware, getFormSubmissions);
router.get("/submissions/all", authMiddleware, getAllUserSubmissions);
router.delete("/submissions/:submissionId", authMiddleware, deleteSubmission);
router.put("/submissions/:submissionId", authMiddleware, submissionUpload.any(), updateSubmission);

// Vault mapping routes
router.post("/alternatives", authMiddleware, getFieldAlternatives);

export default router;
