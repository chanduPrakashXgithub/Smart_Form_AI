import {
  getAllVaultSections,
  getSectionFields,
  getOrCreateSection,
} from "../services/documentVaultService.js";
import VaultField from "../models/VaultField.js";
import VaultAmbiguity from "../models/VaultAmbiguity.js";
import { classifyFieldSemantic } from "../services/formAIService.js";

export const getVaultSections = async (req, res) => {
  try {
    const userId = req.userId;
    const sections = await getAllVaultSections(userId);

    res.json({
      sections,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get vault sections", error: error.message });
  }
};

export const getSectionDetails = async (req, res) => {
  try {
    const userId = req.userId;
    const { sectionType } = req.params;

    const fields = await getSectionFields(userId, sectionType);

    res.json({
      sectionType,
      fieldCount: fields.length,
      fields,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get section details", error: error.message });
  }
};

export const getSectionFieldsBySectionId = async (req, res) => {
  try {
    const userId = req.userId;
    const { sectionId } = req.params;

    const fields = await VaultField.find({ userId, sectionId });

    res.json({
      fields,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get section fields", error: error.message });
  }
};

export const addFieldToSection = async (req, res) => {
  try {
    const userId = req.userId;
    const { sectionType, fieldName, fieldValue } = req.body;

    const section = await getOrCreateSection(userId, sectionType);

    // Classify field semantically for intelligent mapping
    const semanticTag = classifyFieldSemantic(fieldName);
    
    const field = new VaultField({
      sectionId: section._id,
      userId,
      fieldName,
      fieldValue,
      semanticTag,  // Add semantic tag for intelligent mapping
      confidence: 100,
      extractedFrom: "MANUAL",
      metadata: {
        isFamilyData: false,
      },
    });

    await field.save();

    res.status(201).json({
      message: "Field added successfully",
      field,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add field", error: error.message });
  }
};

export const updateField = async (req, res) => {
  try {
    const userId = req.userId;
    const { fieldId } = req.params;
    const { fieldValue, confidence } = req.body;

    const field = await VaultField.findByIdAndUpdate(
      fieldId,
      { fieldValue, confidence, updatedAt: new Date() },
      { new: true },
    );

    if (!field || field.userId.toString() !== userId) {
      return res.status(404).json({ message: "Field not found" });
    }

    res.json({
      message: "Field updated successfully",
      field,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update field", error: error.message });
  }
};

export const deleteField = async (req, res) => {
  try {
    const userId = req.userId;
    const { fieldId } = req.params;

    const field = await VaultField.findByIdAndDelete(fieldId);

    if (!field || field.userId.toString() !== userId) {
      return res.status(404).json({ message: "Field not found" });
    }

    res.json({
      message: "Field deleted successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete field", error: error.message });
  }
};

export const deleteSection = async (req, res) => {
  try {
    const userId = req.userId;
    const { sectionId } = req.params;

    // Verify the section belongs to the user
    const VaultSection = (await import("../models/VaultSection.js")).default;
    const section = await VaultSection.findById(sectionId);

    if (!section || section.userId.toString() !== userId) {
      return res.status(404).json({ message: "Section not found" });
    }

    // Delete all fields in the section
    await VaultField.deleteMany({ sectionId });

    // Delete the section
    await VaultSection.findByIdAndDelete(sectionId);

    res.json({
      message: "Section and all its fields deleted successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete section", error: error.message });
  }
};
