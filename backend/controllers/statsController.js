import VaultDocument from "../models/VaultDocument.js";
import VaultField from "../models/VaultField.js";
import FormSubmission from "../models/FormSubmission.js";

export const getQuickStats = async (req, res) => {
  try {
    const userId = req.userId;

    const [documentsUploaded, fieldsExtracted, autofillsUsed] = await Promise.all([
      VaultDocument.countDocuments({ userId }),
      VaultField.countDocuments({ userId }),
      FormSubmission.countDocuments({ userId }),
    ]);

    res.json({
      documentsUploaded,
      fieldsExtracted,
      autofillsUsed,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch stats",
      error: error.message,
    });
  }
};
