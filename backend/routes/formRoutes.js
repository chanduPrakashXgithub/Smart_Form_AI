import express from "express";
import multer from "multer";
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
  getFieldAlternatives,
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

// Form generation routes
router.post(
  "/generate-from-image",
  authMiddleware,
  upload.single("formImage"),
  generateFormFromImage,
);
router.post("/generate-from-text", authMiddleware, generateFormFromText);

// Form management routes
router.get("/", authMiddleware, getUserForms);
router.get("/:formId", authMiddleware, getFormById);
router.put("/:formId", authMiddleware, updateForm);
router.delete("/:formId", authMiddleware, deleteForm);

// Submission routes
router.post("/:formId/submit", authMiddleware, submitForm);
router.get("/:formId/submissions", authMiddleware, getFormSubmissions);
router.get("/submissions/all", authMiddleware, getAllUserSubmissions);

// Vault mapping routes
router.post("/alternatives", authMiddleware, getFieldAlternatives);

export default router;
