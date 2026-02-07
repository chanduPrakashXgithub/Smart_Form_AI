import mongoose from "mongoose";

const vaultFieldSchema = new mongoose.Schema(
  {
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VaultSection",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fieldName: {
      type: String,
      required: true,
    },
    fieldValue: {
      type: String,
      required: true,
    },
    semanticTag: {
      type: String,
      default: null,
      // Examples: PERSON_FULL_NAME, PERSON_FATHER_NAME, PERSON_DOB, etc.
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 85,
    },
    extractedFrom: {
      type: String,
      enum: [
        "AADHAAR",
        "PAN",
        "PASSPORT",
        "TENTH",
        "INTER",
        "DEGREE",
        "MANUAL",
      ],
      required: true,
    },
    metadata: {
      isFamilyData: Boolean,
      documentId: mongoose.Schema.Types.ObjectId,
      rawExtractedText: String,
    },
  },
  { timestamps: true },
);

// Index for efficient querying
vaultFieldSchema.index({ userId: 1, sectionId: 1 });
vaultFieldSchema.index({ userId: 1, fieldName: 1 });

export default mongoose.model("VaultField", vaultFieldSchema);
