import Form from "../models/Form.js";
import FormSubmission from "../models/FormSubmission.js";
import VaultField from "../models/VaultField.js";
import {
  extractFormFromImage,
  extractFormFromText,
  validateFormData,
  classifyFieldSemantic,
} from "../services/formAIService.js";
import {
  autoMapFormFields,
  getAlternativesForField,
} from "../services/vaultMappingService.js";
import { extractSmartFieldsFromImage } from "../services/smartFieldDetectionService.js";
import { 
  getFieldGuidance, 
  getBatchFieldGuidance,
  getContextAwareGuidance 
} from "../services/fieldGuidanceService.js";
import { getOrCreateSection } from "../services/documentVaultService.js";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

const normalizeFieldType = (fieldType) => {
  const normalized = (fieldType || "").toLowerCase().trim();
  const aliasMap = {
    tel: "phone",
    phone: "phone",
    select: "dropdown",
    drop: "dropdown",
  };

  const mapped = aliasMap[normalized] || normalized || "text";
  const allowed = new Set([
    "text",
    "number",
    "date",
    "email",
    "phone",
    "dropdown",
    "checkbox",
    "radio",
    "textarea",
    "file",
  ]);

  return allowed.has(mapped) ? mapped : "text";
};

const normalizeMapKey = (key) =>
  (key || "")
    .toString()
    .trim()
    .replace(/[.$]/g, "_");

const normalizeSubmittedData = (submittedData) => {
  const sanitizedData = {};
  const dataList = [];

  Object.entries(submittedData || {}).forEach(([label, value]) => {
    dataList.push({ label, value });
    const safeKey = normalizeMapKey(label);
    sanitizedData[safeKey] = value;
  });

  return { sanitizedData, dataList };
};

const storeSubmissionInVault = async (userId, dataList) => {
  if (!dataList || dataList.length === 0) return;

  const section = await getOrCreateSection(userId, "FORM_SUBMISSIONS");

  for (const entry of dataList) {
    const label = (entry.label || "").toString().trim();
    if (!label) continue;

    const value = entry.value;

    if (
      value === null ||
      value === undefined ||
      value === "" ||
      (typeof value === "object" && Object.keys(value || {}).length === 0)
    ) {
      continue;
    }

    if (typeof value === "object" && (value.fileName || value.filePath || value.mimeType)) {
      continue;
    }

    const valueString = typeof value === "string" ? value : String(value);
    const semanticTag = classifyFieldSemantic(label);

    const existingField = await VaultField.findOne({
      userId,
      sectionId: section._id,
      fieldName: label,
    });

    if (existingField) {
      existingField.fieldValue = valueString;
      existingField.confidence = 90;
      existingField.semanticTag = existingField.semanticTag || semanticTag;
      await existingField.save();
    } else {
      const newField = new VaultField({
        sectionId: section._id,
        userId,
        fieldName: label,
        fieldValue: valueString,
        semanticTag,
        confidence: 90,
        extractedFrom: "MANUAL",
      });
      await newField.save();
    }
  }
};

const storeResumeInVault = async (userId, attachments) => {
  console.log("🔍 storeResumeInVault called with:", {
    userId,
    attachmentsCount: attachments?.length || 0,
    attachments: attachments?.map(att => ({
      fieldLabel: att.fieldLabel,
      fileName: att.fileName
    }))
  });

  if (!attachments || attachments.length === 0) {
    console.log("⚠️ No attachments found");
    return;
  }

  // Find resume attachments (by field label or file type)
  const resumeAttachments = attachments.filter((att) => {
    const label = (att.fieldLabel || "").toLowerCase();
    const fileName = (att.fileName || "").toLowerCase();
    const isResume = (
      label.includes("resume") ||
      label.includes("cv") ||
      fileName.includes("resume") ||
      fileName.includes("cv") ||
      fileName.endsWith(".pdf") ||
      fileName.endsWith(".doc") ||
      fileName.endsWith(".docx")
    );
    console.log(`📄 Checking file: ${att.fileName}, fieldLabel: ${att.fieldLabel}, isResume: ${isResume}`);
    return isResume;
  });

  console.log(`✅ Found ${resumeAttachments.length} resume attachments`);

  if (resumeAttachments.length === 0) {
    console.log("⚠️ No resume attachments found after filtering");
    return;
  }

  const section = await getOrCreateSection(userId, "RESUME_SECTION");
  console.log(`📦 Resume section created/found: ${section._id}`);

  for (const attachment of resumeAttachments) {
    console.log(`💾 Storing resume: ${attachment.fileName}`);
    
    // Store file metadata in vault
    const filePathField = await VaultField.findOne({
      userId,
      sectionId: section._id,
      fieldName: "Resume File Path",
    });

    if (filePathField) {
      filePathField.fieldValue = attachment.filePath;
      filePathField.confidence = 95;
      await filePathField.save();
      console.log(`✏️ Updated Resume File Path field`);
    } else {
      await new VaultField({
        sectionId: section._id,
        userId,
        fieldName: "Resume File Path",
        fieldValue: attachment.filePath,
        semanticTag: "DOCUMENT",
        confidence: 95,
        extractedFrom: "UPLOAD",
      }).save();
      console.log(`✨ Created new Resume File Path field`);
    }

    // Store file name
    const fileNameField = await VaultField.findOne({
      userId,
      sectionId: section._id,
      fieldName: "Resume File Name",
    });

    if (fileNameField) {
      fileNameField.fieldValue = attachment.fileName;
      fileNameField.confidence = 95;
      await fileNameField.save();
      console.log(`✏️ Updated Resume File Name field`);
    } else {
      await new VaultField({
        sectionId: section._id,
        userId,
        fieldName: "Resume File Name",
        fieldValue: attachment.fileName,
        semanticTag: "NAME",
        confidence: 95,
        extractedFrom: "UPLOAD",
      }).save();
      console.log(`✨ Created new Resume File Name field`);
    }

    // Store upload date
    const uploadDateField = await VaultField.findOne({
      userId,
      sectionId: section._id,
      fieldName: "Resume Upload Date",
    });

    const currentDate = new Date().toISOString();

    if (uploadDateField) {
      uploadDateField.fieldValue = currentDate;
      uploadDateField.confidence = 100;
      await uploadDateField.save();
      console.log(`✏️ Updated Resume Upload Date field`);
    } else {
      await new VaultField({
        sectionId: section._id,
        userId,
        fieldName: "Resume Upload Date",
        fieldValue: currentDate,
        semanticTag: "DATE",
        confidence: 100,
        extractedFrom: "UPLOAD",
      }).save();
      console.log(`✨ Created new Resume Upload Date field`);
    }
  }

  console.log(`🎉 Successfully stored ${resumeAttachments.length} resume(s) in vault`);
};

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

    let parsedSubmittedData = submittedData;
    if (typeof submittedData === "string") {
      try {
        parsedSubmittedData = JSON.parse(submittedData);
      } catch (parseError) {
        return res.status(400).json({
          message: "Invalid submittedData JSON",
          error: parseError.message,
        });
      }
    }

    const files = Array.isArray(req.files) ? req.files : [];
    const attachments = files.map((file) => ({
      fieldLabel: file.fieldname,
      filePath: file.path,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    }));

    if (attachments.length > 0) {
      const augmented = { ...(parsedSubmittedData || {}) };
      for (const attachment of attachments) {
        augmented[attachment.fieldLabel] = {
          fileName: attachment.fileName,
          filePath: attachment.filePath,
          mimeType: attachment.mimeType,
          fileSize: attachment.fileSize,
        };
      }
      parsedSubmittedData = augmented;
    }

    // Get form
    const form = await Form.findOne({ _id: formId, userId });

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    // Validate form data
    const validation = validateFormData(form.fields, parsedSubmittedData);

    if (!validation.isValid) {
      return res.status(400).json({
        message: "Form validation failed",
        errors: validation.errors,
      });
    }

    const { sanitizedData, dataList } = normalizeSubmittedData(parsedSubmittedData);

    // Create submission
    const submissionDate = new Date();
    const submission = new FormSubmission({
      formId,
      userId,
      submittedData: sanitizedData,
      submittedDataList: dataList,
      attachments,
      submissionDate,
      submissionMonth: `${submissionDate.getFullYear()}-${String(
        submissionDate.getMonth() + 1,
      ).padStart(2, "0")}`,
      submissionYear: submissionDate.getFullYear(),
      notes,
    });

    await submission.save();

    // Store submitted fields in vault for future auto-fill
    try {
      await storeSubmissionInVault(userId, dataList);
    } catch (vaultError) {
      console.error("Error storing submission in vault:", vaultError);
    }

    // Store resume attachments in vault
    try {
      console.log("📝 Attempting to store resume in vault...");
      await storeResumeInVault(userId, attachments);
    } catch (resumeError) {
      console.error("❌ Error storing resume in vault:", resumeError);
    }

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
 * Delete a submission
 * DELETE /api/forms/submissions/:submissionId
 */
export const deleteSubmission = async (req, res) => {
  try {
    const userId = req.userId;
    const { submissionId } = req.params;

    const submission = await FormSubmission.findOne({
      _id: submissionId,
      userId,
    });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Delete associated file attachments
    if (submission.attachments && submission.attachments.length > 0) {
      for (const attachment of submission.attachments) {
        try {
          await fs.unlink(attachment.filePath);
        } catch (err) {
          console.error("Error deleting attachment:", err);
        }
      }
    }

    await FormSubmission.findByIdAndDelete(submissionId);

    // Decrement form submission count
    const form = await Form.findById(submission.formId);
    if (form && form.submissionCount > 0) {
      form.submissionCount -= 1;
      await form.save();
    }

    res.json({
      message: "Submission deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting submission:", error);
    res.status(500).json({
      message: "Failed to delete submission",
      error: error.message,
    });
  }
};

/**
 * Update a submission
 * PUT /api/forms/submissions/:submissionId
 */
export const updateSubmission = async (req, res) => {
  try {
    const userId = req.userId;
    const { submissionId } = req.params;
    const { submittedData, notes, status } = req.body;

    let parsedSubmittedData = submittedData;
    if (typeof submittedData === "string") {
      try {
        parsedSubmittedData = JSON.parse(submittedData);
      } catch (parseError) {
        return res.status(400).json({
          message: "Invalid submittedData JSON",
          error: parseError.message,
        });
      }
    }

    const submission = await FormSubmission.findOne({
      _id: submissionId,
      userId,
    });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Handle file uploads if any
    const files = Array.isArray(req.files) ? req.files : [];
    const newAttachments = files.map((file) => ({
      fieldLabel: file.fieldname,
      filePath: file.path,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    }));

    if (newAttachments.length > 0) {
      const augmented = { ...(parsedSubmittedData || {}) };
      for (const attachment of newAttachments) {
        augmented[attachment.fieldLabel] = {
          fileName: attachment.fileName,
          filePath: attachment.filePath,
          mimeType: attachment.mimeType,
          fileSize: attachment.fileSize,
        };
      }
      parsedSubmittedData = augmented;
      submission.attachments = [...(submission.attachments || []), ...newAttachments];
    }

    if (parsedSubmittedData) {
      const { sanitizedData, dataList } = normalizeSubmittedData(parsedSubmittedData);
      submission.submittedData = sanitizedData;
      submission.submittedDataList = dataList;
    }

    if (notes !== undefined) submission.notes = notes;
    if (status) submission.status = status;

    await submission.save();

    res.json({
      message: "Submission updated successfully",
      submission,
    });
  } catch (error) {
    console.error("Error updating submission:", error);
    res.status(500).json({
      message: "Failed to update submission",
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

/**
 * 🤖 Get AI guidance for a specific field
 * POST /api/forms/field-guidance
 */
export const getFieldGuidanceAPI = async (req, res) => {
  try {
    const userId = req.userId;
    const { fieldLabel, fieldType, filledFields } = req.body;

    if (!fieldLabel) {
      return res.status(400).json({ message: "Field label is required" });
    }

    console.log(`🤖 Getting guidance for field: "${fieldLabel}"`);

    // Get context-aware guidance if filledFields provided
    const guidance = filledFields
      ? await getContextAwareGuidance(fieldLabel, fieldType || 'text', userId, filledFields)
      : await getFieldGuidance(fieldLabel, fieldType || 'text', userId);

    res.json({
      success: true,
      guidance,
    });
  } catch (error) {
    console.error("Error getting field guidance:", error);
    res.status(500).json({
      message: "Failed to get field guidance",
      error: error.message,
    });
  }
};

/**
 * 🤖 Get batch guidance for multiple fields
 * POST /api/forms/batch-guidance
 */
export const getBatchGuidanceAPI = async (req, res) => {
  try {
    const userId = req.userId;
    const { fields } = req.body;

    if (!fields || !Array.isArray(fields)) {
      return res.status(400).json({ message: "Fields array is required" });
    }

    console.log(`🤖 Getting batch guidance for ${fields.length} fields`);

    const guidanceList = await getBatchFieldGuidance(fields, userId);

    res.json({
      success: true,
      guidanceList,
      count: guidanceList.length,
    });
  } catch (error) {
    console.error("Error getting batch guidance:", error);
    res.status(500).json({
      message: "Failed to get batch guidance",
      error: error.message,
    });
  }
};

/**
 * 🎯 Generate form with SMART FIELD DETECTION
 * POST /api/forms/smart-generate-from-image
 */
export const smartGenerateFromImage = async (req, res) => {
  try {
    const userId = req.userId;

    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    console.log("🎯 Processing form image with SMART DETECTION...");
    console.log("📦 Image buffer size:", req.file.buffer.length, "bytes");

    // Convert image to PNG buffer
    console.log("🖼️ Normalizing image to PNG format...");
    const pngBuffer = await sharp(req.file.buffer)
      .png()
      .toBuffer();

    console.log("✅ Image normalized. PNG buffer size:", pngBuffer.length, "bytes");

    // Use SMART field detection (filters UI noise)
    const { fields, metadata } = await extractSmartFieldsFromImage(pngBuffer);

    if (!fields || fields.length === 0) {
      return res.status(400).json({
        message: "No valid fields detected in image. Please try another image.",
        details: "Image may contain only UI elements or be unclear",
      });
    }

    console.log(`✅ Smart detection: ${fields.length} valid fields extracted`);

    // Auto-map vault data
    console.log("🗂️ Auto-mapping vault data...");
    const mappedFields = await autoMapFormFields(userId, fields);
    const normalizedFields = mappedFields.map((field, index) => ({
      ...field,
      fieldType: normalizeFieldType(field.fieldType || field.type),
      order: typeof field.order === "number" ? field.order : index,
    }));

    // Create form in database
    const form = new Form({
      userId,
      formName: "Smart Extracted Form",
      fields: normalizedFields,
      sourceType: "IMAGE_SMART",
      metadata: {
        aiConfidence: 0.92,
        processingTime: Date.now(),
        mimeType: req.file.mimetype,
        fileSize: req.file.buffer.length,
        fieldCount: normalizedFields.length,
        detectionMethod: 'smart',
        totalDetected: metadata.totalDetected,
        filteredOut: metadata.filteredOut,
      },
    });

    await form.save();
    console.log(`✅ Form saved with ${normalizedFields.length} smart-detected fields`);

    res.json({
      success: true,
      message: "Form generated successfully with smart field detection",
      form: {
        _id: form._id,
        formName: form.formName,
        fields: form.fields,
        sourceType: form.sourceType,
      },
      mappedFields: normalizedFields,
      detectionStats: {
        totalDetected: metadata.totalDetected,
        validFields: metadata.validFields,
        filteredOut: metadata.filteredOut,
      },
    });
  } catch (error) {
    console.error("Error in smart form generation:", error);
    res.status(500).json({
      message: "Failed to generate form with smart detection",
      error: error.message,
    });
  }
};
