import Form from "../models/Form.js";
import FormSubmission from "../models/FormSubmission.js";
import {
  extractFormFromImage,
  extractFormFromText,
  validateFormData,
} from "../services/formAIService.js";
import {
  autoMapFormFields,
  getAlternativesForField,
} from "../services/vaultMappingService.js";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

/**
 * Generate form from uploaded image
 * POST /api/forms/generate-from-image
 */
export const generateFormFromImage = async (req, res) => {
  try {
    const userId = req.userId;

    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    console.log("📸 Processing form image...");
    console.log("📦 Image buffer size:", req.file.buffer.length, "bytes");
    console.log("📝 MIME type:", req.file.mimetype);

    // Convert image to PNG buffer for consistent OCR processing
    console.log("🖼️ Normalizing image to PNG format...");
    const pngBuffer = await sharp(req.file.buffer)
      .png()
      .toBuffer();

    console.log("✅ Image normalized. PNG buffer size:", pngBuffer.length, "bytes");

    const { formStructure, extractedText } =
      await extractFormFromImage(pngBuffer);

    // Validate and clean extracted fields before storage
    console.log("🧹 Validating and cleaning extracted fields...");
    if (!formStructure.fields || !Array.isArray(formStructure.fields)) {
      throw new Error("Invalid form structure - no fields extracted");
    }

    // Ensure field count is reasonable
    if (formStructure.fields.length === 0) {
      return res.status(400).json({ 
        message: "No fields detected in image. Please try another image.",
        details: "Image clarity or content may not be suitable for form extraction"
      });
    }

    if (formStructure.fields.length > 50) {
      console.warn(`⚠️ Too many fields detected (${formStructure.fields.length}). Trimming to 50.`);
      formStructure.fields = formStructure.fields.slice(0, 50);
    }

    // Auto-map vault data
    console.log("🗂️ Auto-mapping vault data...");
    const mappedFields = await autoMapFormFields(userId, formStructure.fields);

    // Create form in database
    const form = new Form({
      userId,
      formName: formStructure.formName || "Extracted Form",
      fields: mappedFields,
      sourceType: "IMAGE",
      metadata: {
        originalText: extractedText,
        aiConfidence: formStructure.confidence || 0.85,
        processingTime: Date.now(),
        mimeType: req.file.mimetype,
        fileSize: req.file.buffer.length,
        fieldCount: mappedFields.length,
      },
    });

    await form.save();
    console.log(`✅ Form saved with ${mappedFields.length} clean, deduplicated fields`);

    res.json({
      success: true,
      message: "Form generated successfully from image",
      form: {
        _id: form._id,
        formName: form.formName,
        fields: form.fields,
        sourceType: form.sourceType,
      },
      mappedFields,
    });
  } catch (error) {
    console.error("Error generating form from image:", error);
    res.status(500).json({
      message: "Failed to generate form from image",
      error: error.message,
    });
  }
};

/**
 * Generate form from pasted text
 * POST /api/forms/generate-from-text
 */
export const generateFormFromText = async (req, res) => {
  try {
    const userId = req.userId;
    const { pastedText } = req.body;

    if (!pastedText || pastedText.trim() === "") {
      return res.status(400).json({ message: "No text provided" });
    }

    console.log("📝 Processing pasted text...");
    const { formStructure, extractedText } =
      await extractFormFromText(pastedText);

    // Validate and clean extracted fields before storage
    console.log("🧹 Validating and cleaning extracted fields...");
    if (!formStructure.fields || !Array.isArray(formStructure.fields)) {
      throw new Error("Invalid form structure - no fields extracted");
    }

    if (formStructure.fields.length === 0) {
      return res.status(400).json({ 
        message: "No fields detected in text. Please check format.",
        details: "Could not parse any form fields from the provided text"
      });
    }

    if (formStructure.fields.length > 50) {
      console.warn(`⚠️ Too many fields detected (${formStructure.fields.length}). Trimming to 50.`);
      formStructure.fields = formStructure.fields.slice(0, 50);
    }

    // Auto-map vault data
    console.log("🗂️ Auto-mapping vault data...");
    const mappedFields = await autoMapFormFields(userId, formStructure.fields);

    // Create form in database
    const form = new Form({
      userId,
      formName: formStructure.formName || "Extracted Form",
      fields: mappedFields,
      sourceType: "TEXT",
      metadata: {
        originalText: extractedText,
        aiConfidence: formStructure.confidence || 0.85,
        processingTime: Date.now(),
        fieldCount: mappedFields.length,
      },
    });

    await form.save();
    console.log(`✅ Form saved with ${mappedFields.length} clean, deduplicated fields`);

    res.json({
      success: true,
      message: "Form generated successfully from text",
      form: {
        _id: form._id,
        formName: form.formName,
        fields: form.fields,
        sourceType: form.sourceType,
      },
      mappedFields,
    });
  } catch (error) {
    console.error("Error generating form from text:", error);
    res.status(500).json({
      message: "Failed to generate form from text",
      error: error.message,
    });
  }
};

/**
 * Get all forms for user
 * GET /api/forms
 */
export const getUserForms = async (req, res) => {
  try {
    const userId = req.userId;
    const { status } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const forms = await Form.find(query).sort({ createdAt: -1 }).lean();

    res.json({
      forms,
      count: forms.length,
    });
  } catch (error) {
    console.error("Error fetching forms:", error);
    res.status(500).json({
      message: "Failed to fetch forms",
      error: error.message,
    });
  }
};

/**
 * Get single form by ID
 * GET /api/forms/:formId
 */
export const getFormById = async (req, res) => {
  try {
    const userId = req.userId;
    const { formId } = req.params;

    const form = await Form.findOne({ _id: formId, userId }).lean();

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    // Auto-map latest vault data
    const mappedFields = await autoMapFormFields(userId, form.fields);

    res.json({
      form: {
        ...form,
        fields: mappedFields,
      },
    });
  } catch (error) {
    console.error("Error fetching form:", error);
    res.status(500).json({
      message: "Failed to fetch form",
      error: error.message,
    });
  }
};

/**
 * Update form
 * PUT /api/forms/:formId
 */
export const updateForm = async (req, res) => {
  try {
    const userId = req.userId;
    const { formId } = req.params;
    const { formName, fields, status } = req.body;

    const form = await Form.findOne({ _id: formId, userId });

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    if (formName) form.formName = formName;
    if (fields) form.fields = fields;
    if (status) form.status = status;

    await form.save();

    res.json({
      message: "Form updated successfully",
      form,
    });
  } catch (error) {
    console.error("Error updating form:", error);
    res.status(500).json({
      message: "Failed to update form",
      error: error.message,
    });
  }
};

/**
 * Delete form
 * DELETE /api/forms/:formId
 */
export const deleteForm = async (req, res) => {
  try {
    const userId = req.userId;
    const { formId } = req.params;

    const form = await Form.findOneAndDelete({ _id: formId, userId });

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    // Delete associated image if exists
    if (form.sourceImage) {
      try {
        await fs.unlink(form.sourceImage);
      } catch (err) {
        console.error("Error deleting form image:", err);
      }
    }

    res.json({
      message: "Form deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting form:", error);
    res.status(500).json({
      message: "Failed to delete form",
      error: error.message,
    });
  }
};

/**
 * Submit form data
 * POST /api/forms/:formId/submit
 */
export const submitForm = async (req, res) => {
  try {
    const userId = req.userId;
    const { formId } = req.params;
    const { submittedData, notes } = req.body;

    // Get form
    const form = await Form.findOne({ _id: formId, userId });

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    // Validate form data
    const validation = validateFormData(form.fields, submittedData);

    if (!validation.isValid) {
      return res.status(400).json({
        message: "Form validation failed",
        errors: validation.errors,
      });
    }

    // Create submission
    const submissionDate = new Date();
    const submission = new FormSubmission({
      formId,
      userId,
      submittedData,
      submissionDate,
      submissionMonth: `${submissionDate.getFullYear()}-${String(
        submissionDate.getMonth() + 1,
      ).padStart(2, "0")}`,
      submissionYear: submissionDate.getFullYear(),
      notes,
    });

    await submission.save();

    // Update form submission count
    form.submissionCount += 1;
    await form.save();

    res.json({
      message: "Form submitted successfully",
      submission,
    });
  } catch (error) {
    console.error("Error submitting form:", error);
    res.status(500).json({
      message: "Failed to submit form",
      error: error.message,
    });
  }
};

/**
 * Get form submissions
 * GET /api/forms/:formId/submissions
 */
export const getFormSubmissions = async (req, res) => {
  try {
    const userId = req.userId;
    const { formId } = req.params;
    const { startDate, endDate, status } = req.query;

    const query = { formId, userId };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.submissionDate = {};
      if (startDate) query.submissionDate.$gte = new Date(startDate);
      if (endDate) query.submissionDate.$lte = new Date(endDate);
    }

    const submissions = await FormSubmission.find(query)
      .sort({ submittedAt: -1 })
      .lean();

    res.json({
      submissions,
      count: submissions.length,
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({
      message: "Failed to fetch submissions",
      error: error.message,
    });
  }
};

/**
 * Get all user submissions (across all forms)
 * GET /api/forms/submissions/all
 */
export const getAllUserSubmissions = async (req, res) => {
  try {
    const userId = req.userId;
    const { period, startDate, endDate } = req.query;

    const query = { userId };

    // Handle period filters
    if (period) {
      const now = new Date();
      let start;

      switch (period) {
        case "today":
          start = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "week":
          start = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          start = new Date(now.setMonth(now.getMonth() - 1));
          break;
      }

      if (start) {
        query.submissionDate = { $gte: start };
      }
    } else if (startDate || endDate) {
      query.submissionDate = {};
      if (startDate) query.submissionDate.$gte = new Date(startDate);
      if (endDate) query.submissionDate.$lte = new Date(endDate);
    }

    const submissions = await FormSubmission.find(query)
      .populate("formId", "formName")
      .sort({ submittedAt: -1 })
      .lean();

    res.json({
      submissions,
      count: submissions.length,
    });
  } catch (error) {
    console.error("Error fetching all submissions:", error);
    res.status(500).json({
      message: "Failed to fetch submissions",
      error: error.message,
    });
  }
};

/**
 * Get alternative field values from vault
 * POST /api/forms/alternatives
 */
export const getFieldAlternatives = async (req, res) => {
  try {
    const userId = req.userId;
    const { fieldLabel, vaultMappingKey } = req.body;

    const alternatives = await getAlternativesForField(
      userId,
      fieldLabel,
      vaultMappingKey,
    );

    res.json({
      alternatives,
    });
  } catch (error) {
    console.error("Error fetching alternatives:", error);
    res.status(500).json({
      message: "Failed to fetch alternatives",
      error: error.message,
    });
  }
};
