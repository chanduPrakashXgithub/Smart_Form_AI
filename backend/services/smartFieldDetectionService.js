import { GoogleGenerativeAI } from "@google/generative-ai";

import { extractTextFromImage } from "./ocrService.js";

// Lazy initialization - initialize only when needed
let genAI, isInitialized = false;

function initializeGemini() {
  if (isInitialized) return true;
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "your_api_key_here") {
    console.warn("⚠️ GEMINI_API_KEY not configured - smart detection will use OCR fallback");
    return false;
  }
  
  console.log("✅ Initializing Gemini AI for smart field detection");
  genAI = new GoogleGenerativeAI(apiKey);
  isInitialized = true;
  return true;
}

// Helper to check if Gemini is available
function isGeminiAvailable() {
  return initializeGemini();
}

/**
 * 🎯 SMART FIELD DETECTION SERVICE
 * Filters UI noise and extracts ONLY meaningful form fields
 * 
 * STRICT RULES:
 * 1. Extract ONLY actual user input fields (Name, Email, CGPA, etc.)
 * 2. IGNORE UI/SYSTEM TEXT (Choose File, No file chosen, Submit, etc.)
 * 3. Ignore button text, progress bars, section numbers
 * 4. Detect field types intelligently
 */

/**
 * UI NOISE PATTERNS - These should be IGNORED
 */
const UI_NOISE_PATTERNS = [
  // Button text
  /^submit$/i,
  /^cancel$/i,
  /^save$/i,
  /^reset$/i,
  /^clear$/i,
  /^next$/i,
  /^previous$/i,
  /^back$/i,
  /^continue$/i,
  /^finish$/i,
  /^send$/i,
  /^ok$/i,
  /^confirm$/i,
  
  // File upload UI text
  /^choose\s+file$/i,
  /^no\s+file\s+chosen$/i,
  /^browse$/i,
  /^upload$/i,
  /^drag\s+(and\s+)?drop$/i,
  /^click\s+to\s+upload$/i,
  /^select\s+file$/i,
  
  // Status/Progress text
  /^loading\.{3}$/i,
  /^please\s+wait/i,
  /^\d+%$/,  // Progress percentages like "75%"
  /^uploading\.{3}$/i,
  /^processing\.{3}$/i,
  
  // Navigation/Section numbers
  /^step\s+\d+$/i,
  /^page\s+\d+$/i,
  /^\d+\s+of\s+\d+$/i,
  
  // Generic UI labels
  /^required\s+field[s]?$/i,
  /^optional$/i,
  /^mandatory$/i,
  /^note:?$/i,
  /^info:?$/i,
  /^warning:?$/i,
  
  // Decorative text
  /^-+$/,
  /^_+$/,
  /^\*+$/,
  /^\.+$/,
  /^\|+$/,
];

/**
 * SECTION HEADING PATTERNS - Document structure, not fields
 */
const SECTION_HEADING_PATTERNS = [
  /^\d+\.\s+[A-Z][a-zA-Z\s]+$/,  // "1. Student Information"
  /^[A-Z][A-Z\s]{3,}$/,           // "STUDENT INFORMATION" (all caps, 3+ words)
  /^\d+\)\s+[A-Z][a-zA-Z\s]+$/,  // "1) Personal Details"
  /^section\s+\d+/i,
  /^part\s+[A-Z0-9]/i,
  /information$/i,
  /details$/i,
  /^personal\s+information$/i,
  /^contact\s+details$/i,
  /^academic\s+information$/i,
  /^previous\s+education$/i,
  /^educational\s+qualification$/i,
  /^work\s+experience$/i,
];

/**
 * VALID FIELD PATTERNS - These are likely real form fields
 */
const VALID_FIELD_PATTERNS = [
  // Identity fields
  { pattern: /name|naam/i, type: 'text', category: 'identity' },
  { pattern: /roll\s*number|roll\s*no/i, type: 'text', category: 'identity' },
  { pattern: /registration\s*number|reg\s*no/i, type: 'text', category: 'identity' },
  { pattern: /student\s*id|student\s*number/i, type: 'text', category: 'identity' },
  
  // Contact fields
  { pattern: /email|e-mail|mail/i, type: 'email', category: 'contact' },
  { pattern: /phone|mobile|contact\s*number|telephone/i, type: 'tel', category: 'contact' },
  { pattern: /address|residence/i, type: 'textarea', category: 'contact' },
  
  // Academic fields
  { pattern: /cgpa|gpa/i, type: 'number', category: 'academic' },
  { pattern: /percentage|marks|score/i, type: 'number', category: 'academic' },
  { pattern: /year\s*of\s*passing|passing\s*year/i, type: 'number', category: 'academic' },
  { pattern: /grade|class/i, type: 'text', category: 'academic' },
  
  // Date fields
  { pattern: /date\s*of\s*birth|dob|birth\s*date/i, type: 'date', category: 'personal' },
  { pattern: /date\s*of\s*joining|joining\s*date/i, type: 'date', category: 'professional' },
  
  // File upload fields
  { pattern: /resume|cv/i, type: 'file', category: 'document', accept: '.pdf,.doc,.docx' },
  { pattern: /certificate|marksheet|transcript/i, type: 'file', category: 'document', accept: '.pdf,.jpg,.png' },
  { pattern: /photo|photograph|picture|image/i, type: 'file', category: 'document', accept: 'image/*' },
  { pattern: /upload/i, type: 'file', category: 'document', accept: '*/*' },
  
  // Other common fields
  { pattern: /gender|sex/i, type: 'select', category: 'personal', options: ['Male', 'Female', 'Other'] },
  { pattern: /age/i, type: 'number', category: 'personal' },
  { pattern: /nationality/i, type: 'text', category: 'personal' },
];

/**
 * Check if text is UI noise (buttons, status messages, etc.)
 */
const isUINoiseText = (text) => {
  if (!text || typeof text !== 'string') return true;
  
  const trimmed = text.trim();
  
  // Too short (likely noise)
  if (trimmed.length < 2) return true;
  
  // Check against UI noise patterns
  return UI_NOISE_PATTERNS.some(pattern => pattern.test(trimmed));
};

/**
 * Check if text is a section heading (not a field)
 */
const isSectionHeading = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  const trimmed = text.trim();
  
  // Check against section patterns
  return SECTION_HEADING_PATTERNS.some(pattern => pattern.test(trimmed));
};

/**
 * Detect field type and category based on label
 */
const detectFieldMetadata = (label) => {
  const normalizedLabel = label.toLowerCase().trim();
  
  for (const field of VALID_FIELD_PATTERNS) {
    if (field.pattern.test(normalizedLabel)) {
      return {
        type: field.type,
        category: field.category,
        options: field.options,
        accept: field.accept,
      };
    }
  }
  
  // Default to text input
  return {
    type: 'text',
    category: 'general',
  };
};

/**
 * Clean and deduplicate field labels
 * Example: "Name:", "Name *", "Name (Required)" → "Name"
 */
const cleanFieldLabel = (label) => {
  if (!label) return '';
  
  return label
    .trim()
    .replace(/[:\*]+$/g, '')           // Remove trailing : or *
    .replace(/\(required\)/gi, '')     // Remove (Required)
    .replace(/\(optional\)/gi, '')     // Remove (Optional)
    .replace(/\(mandatory\)/gi, '')    // Remove (Mandatory)
    .replace(/\s+/g, ' ')              // Normalize spaces
    .trim();
};

/**
 * Check if field is likely a duplicate based on semantic similarity
 */
const isDuplicateField = (newLabel, existingLabels) => {
  const normalized = cleanFieldLabel(newLabel).toLowerCase();
  
  return existingLabels.some(existing => {
    const existingNormalized = cleanFieldLabel(existing).toLowerCase();
    
    // Exact match
    if (normalized === existingNormalized) return true;
    
    // Very similar (Levenshtein distance)
    const distance = levenshteinDistance(normalized, existingNormalized);
    const maxLength = Math.max(normalized.length, existingNormalized.length);
    const similarity = 1 - (distance / maxLength);
    
    // If 85% or more similar, consider duplicate
    return similarity > 0.85;
  });
};

/**
 * Calculate Levenshtein distance between two strings
 */
const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

/**
 * 🧠 MASTER FUNCTION - Extract Smart Fields from Form Image
 * Uses Gemini Vision API with intelligent prompting
 */
export const extractSmartFieldsFromImage = async (imageBuffer) => {
  try {
    console.log("🧠 Starting Smart Field Detection...");
    
    // Check if Gemini is available
    if (!isGeminiAvailable()) {
      console.log("⚠️ Gemini not available, using OCR fallback");
      const ocrText = await extractTextFromImage(imageBuffer);
      return extractFieldsFromOCRText(ocrText);
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
    
    // 🎯 MASTER PROMPT - Smart Field Detection
    const prompt = `You are an intelligent Form Understanding AI.

Your task is to analyze this form image and extract ONLY meaningful data input fields.

STRICT RULES:

1. Extract ONLY actual user input fields such as:
   - Name (Full Name, First Name, Last Name, Father Name, Mother Name)
   - Roll Number / Registration Number / Student ID
   - Email / Phone / Address
   - CGPA / Percentage / Grade / Marks
   - Year of Passing / Date of Birth
   - Resume Upload / Certificate Upload / Photo Upload
   - Academic Fields / Identity Fields

2. IGNORE UI / SYSTEM TEXT such as:
   - Choose File, No file chosen, Browse
   - Submit, Cancel, Save, Reset, Next, Previous buttons
   - Upload Button Text, Progress Bars, Loading messages
   - Section Numbers (1., 2., 3.), Decorative Labels
   - Navigation Text (Step 1, Page 1 of 2)
   - Placeholder UI Messages ("Please wait...", "Uploading...")
   - Status indicators ("Required field", "Optional")

3. If text is near an input box, text field, or upload field → treat it as FIELD LABEL.

4. If text is inside a button or status message → IGNORE IT.

5. If duplicate labels exist → Keep only ONE unique meaningful field.

6. Detect Field Type:
   - Email → email input
   - Phone → number/tel input
   - Year → number input (year)
   - Percentage → number (decimal)
   - File Upload → file type (specify accept types)
   - Date fields → date type
   - Gender → select/radio

7. Confidence Scoring:
   - Only include fields you are 70%+ confident are real form fields
   - Reject anything that looks like UI noise

OUTPUT FORMAT (STRICT JSON):

{
  "formFields": [
    {
      "label": "Full Name",
      "type": "text",
      "required": true,
      "confidence": 95
    },
    {
      "label": "Email",
      "type": "email",
      "required": true,
      "confidence": 98
    },
    {
      "label": "CGPA",
      "type": "number",
      "required": true,
      "confidence": 92
    },
    {
      "label": "Resume",
      "type": "file",
      "required": false,
      "accept": ".pdf,.doc,.docx",
      "confidence": 88
    }
  ]
}

IMPORTANT: Return ONLY the JSON, no additional text or explanation.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: 'image/png',
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    console.log("📝 Raw AI response:", text);
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid AI response - no JSON found");
    }
    
    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    if (!parsedResponse.formFields || !Array.isArray(parsedResponse.formFields)) {
      throw new Error("Invalid response format - missing formFields array");
    }
    
    // Post-process fields
    const processedFields = [];
    const seenLabels = [];
    
    for (const field of parsedResponse.formFields) {
      const label = cleanFieldLabel(field.label);
      
      // Skip if no label
      if (!label) {
        console.log(`⚠️ Skipping field with empty label`);
        continue;
      }
      
      // Skip UI noise
      if (isUINoiseText(label)) {
        console.log(`🚫 Filtered UI noise: "${label}"`);
        continue;
      }
      
      // Skip section headings
      if (isSectionHeading(label)) {
        console.log(`📋 Filtered section heading: "${label}"`);
        continue;
      }
      
      // Skip duplicates
      if (isDuplicateField(label, seenLabels)) {
        console.log(`🔄 Skipped duplicate: "${label}"`);
        continue;
      }
      
      // Skip low confidence fields
      const confidence = field.confidence || 0;
      if (confidence < 70) {
        console.log(`⚠️ Low confidence field removed: "${label}" (${confidence}%)`);
        continue;
      }
      
      // Detect metadata
      const metadata = detectFieldMetadata(label);
      
      // Add to processed fields
      processedFields.push({
        label: label,
        type: field.type || metadata.type,
        required: field.required !== undefined ? field.required : true,
        confidence: confidence,
        category: metadata.category,
        options: field.options || metadata.options,
        accept: field.accept || metadata.accept,
      });
      
      seenLabels.push(label);
      console.log(`✅ Valid field detected: "${label}" (${confidence}%, ${metadata.type})`);
    }
    
    console.log(`\n🎯 Smart Detection Complete:`);
    console.log(`   Total AI fields: ${parsedResponse.formFields.length}`);
    console.log(`   After filtering: ${processedFields.length}`);
    console.log(`   Filtered out: ${parsedResponse.formFields.length - processedFields.length} noise fields\n`);
    
    return {
      fields: processedFields,
      metadata: {
        totalDetected: parsedResponse.formFields.length,
        validFields: processedFields.length,
        filteredOut: parsedResponse.formFields.length - processedFields.length,
        processingTime: Date.now(),
      },
    };
    
  } catch (error) {
    console.error("❌ Smart field detection error:", error);
    throw new Error("Failed to extract smart fields: " + error.message);
  }
};

/**
 * Fallback: Extract fields from OCR text (if Vision API fails)
 */
export const extractFieldsFromOCRText = (ocrText) => {
  console.log("📝 Extracting fields from OCR text (fallback method)...");
  
  const lines = ocrText.split('\n').filter(line => line.trim());
  const fields = [];
  const seenLabels = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip if too short
    if (trimmed.length < 2) continue;
    
    // Skip UI noise
    if (isUINoiseText(trimmed)) continue;
    
    // Skip section headings
    if (isSectionHeading(trimmed)) continue;
    
    const label = cleanFieldLabel(trimmed);
    
    // Skip duplicates
    if (isDuplicateField(label, seenLabels)) continue;
    
    // Detect metadata
    const metadata = detectFieldMetadata(label);
    
    // Only add if it looks like a valid field
    if (metadata.category !== 'general' || VALID_FIELD_PATTERNS.some(p => p.pattern.test(label))) {
      fields.push({
        label: label,
        type: metadata.type,
        required: true,
        confidence: 75, // Lower confidence for OCR fallback
        category: metadata.category,
        options: metadata.options,
        accept: metadata.accept,
      });
      
      seenLabels.push(label);
    }
  }
  
  console.log(`✅ Extracted ${fields.length} fields from OCR text`);
  return { fields, metadata: { method: 'ocr_fallback' } };
};
