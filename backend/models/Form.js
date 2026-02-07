import mongoose from "mongoose";

const formFieldSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
  fieldType: {
    type: String,
    enum: [
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
    ],
    required: true,
  },
  vaultMappingKey: {
    type: String,
    default: null,
  },
  required: {
    type: Boolean,
    default: false,
  },
  options: [String], // For dropdown, radio, checkbox
  placeholder: String,
  validation: {
    pattern: String,
    minLength: Number,
    maxLength: Number,
    min: Number,
    max: Number,
  },
  order: {
    type: Number,
    default: 0,
  },
});

const formSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    formName: {
      type: String,
      required: true,
    },
    description: String,
    fields: [formFieldSchema],
    sourceType: {
      type: String,
      enum: ["IMAGE", "TEXT", "MANUAL"],
      required: true,
    },
    sourceImage: String, // Path to original image if from image
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "ARCHIVED"],
      default: "ACTIVE",
    },
    submissionCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      aiConfidence: Number,
      processingTime: Number,
      originalText: String,
    },
  },
  { timestamps: true },
);

// Index for faster queries
formSchema.index({ userId: 1, createdAt: -1 });
formSchema.index({ userId: 1, status: 1 });

export default mongoose.model("Form", formSchema);
