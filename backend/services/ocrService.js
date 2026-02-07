import Tesseract from "tesseract.js";

/**
 * Perform OCR on image file path
 * @param {string} imagePath - Path to image file
 * @returns {Promise<string>} - Extracted text
 */
export const performOCR = async (imagePath) => {
  try {
    console.log("🔍 Performing OCR with Tesseract on:", imagePath);
    
    const { data: { text } } = await Tesseract.recognize(imagePath, "eng", {
      logger: (m) => {
        if (m.progress === 1) {
          console.log(`✅ OCR Complete - ${m.status}`);
        }
      },
    });
    
    return text || "";
  } catch (error) {
    console.error("OCR error:", error);
    throw new Error("Failed to perform OCR");
  }
};

/**
 * Extract text from image buffer (PNG normalized)
 * @param {Buffer} imageBuffer - Buffer containing PNG image data
 * @returns {Promise<string>} - Extracted text
 */
export const extractTextFromImage = async (imageBuffer) => {
  try {
    console.log("🔍 Extracting text from image buffer...");
    console.log("   Buffer size:", imageBuffer.length, "bytes");
    
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error("Image buffer is empty");
    }

    const { data: { text } } = await Tesseract.recognize(imageBuffer, "eng", {
      logger: (m) => {
        if (m.progress === 1 || m.progress === 0) {
          console.log(`   [${Math.round(m.progress * 100)}%] ${m.status}`);
        }
      },
    });
    
    console.log("✅ Text extracted successfully");
    console.log("   Extracted text length:", text.length, "characters");
    return text || "";
  } catch (error) {
    console.error("❌ Text extraction error:", error.message);
    throw new Error("Failed to extract text from image: " + error.message);
  }
};
