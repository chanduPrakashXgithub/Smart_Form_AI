import mongoose from "mongoose";

const vaultSectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sectionType: {
      type: String,
      enum: [
        "PERSONAL_MASTER",
        "AADHAAR_SECTION",
        "PAN_SECTION",
        "PASSPORT_SECTION",
        "EDUCATION_10TH",
        "EDUCATION_INTER",
        "EDUCATION_DEGREE",
        "RESUME_SECTION",
        "FORM_SUBMISSIONS",
      ],
      required: true,
    },
    authority: {
      type: Number,
      default: function () {
        const authorityMap = {
          PERSONAL_MASTER: 100,
          AADHAAR_SECTION: 95,
          PASSPORT_SECTION: 90,
          PAN_SECTION: 85,
          EDUCATION_DEGREE: 70,
          EDUCATION_INTER: 70,
          EDUCATION_10TH: 70,
          RESUME_SECTION: 80,
        };
        return authorityMap[this.sectionType] || 0;
      },
    },
    sourceDocument: String,
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { timestamps: true },
);

// Unique index: one section type per user
vaultSectionSchema.index({ userId: 1, sectionType: 1 }, { unique: true });

export default mongoose.model("VaultSection", vaultSectionSchema);
