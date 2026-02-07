import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractTextFromImage } from "./ocrService.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Placeholder detection patterns - blocks placeholder/helper text
 * Should NOT be extracted as field labels
 */
const placeholderPatterns = [
  /^\s*enter\s+/i,           // "Enter your name"
  /^\s*type\s+/i,             // "Type here"
  /^\s*fill\s+/i,             // "Fill in your"
  /^\s*provide\s+/i,          // "Provide details"
  /^\s*write\s+/i,            // "Write your"
  /^\s*input\s+/i,            // "Input your"
  /xxxx/i,                     // Masked formats
  /yyyy|mm\/dd|dd\/mm/i,     // Date format hints
  /^\s*[_\-\.\s]+$/,          // Just placeholders (underscores)
  /^\s*placeholder/i,         // Explicit placeholder
  /^\s*sample\s+/i,           // "Sample text"
  /^\s*example\s+/i,          // "Example value"
];

/**
 * Section/Heading detection patterns - should NOT be fields
 * These are document structure elements, not form fields
 */
const sectionPatterns = [
  /^\d+\.\s+[A-Z][a-zA-Z\s]+$/,  // "1. Student Information"
  /^[A-Z][A-Z\s]+$/,              // "STUDENT INFORMATION" (all caps)
  /^\d+\)\s+[A-Z][a-zA-Z\s]+$/,  // "1) Personal Details"
  /^section\s+\d+/i,             // "Section 1"
  /^part\s+[A-Z0-9]/i,           // "Part A"
  /information$/i,                // Ends with "Information"
  /details$/i,                    // Ends with "Details"
  /^previous\s+education$/i,     // "Previous Education"
  /^personal\s+information$/i,   // "Personal Information"
  /^contact\s+details$/i,        // "Contact Details"
  /^academic\s+information$/i,   // "Academic Information"
];

/**
 * Semantic field classification - maps field labels to semantic meaning tags
 * Enables intelligent vault mapping (Father Name ≠ Full Name)
 * ENHANCED: Handles spelling variations (Aadhar = Aadhaar)
 */
const semanticFieldMap = {
  // Person Name variants
  'PERSON_FULL_NAME': [
    'full name', 'fullname', 'name', 'student name', 'candidate name', 
    'applicant name', 'your name', 'person name'
  ],
  'PERSON_FATHER_NAME': [
    'father name', 'fathername', 'father\'s name', 'fathers name',
    'guardian name', 'parent name', 'fathersname'
  ],
  'PERSON_MOTHER_NAME': [
    'mother name', 'mothername', 'mother\'s name', 'mothers name', 'mothersname'
  ],
  
  // Date variants
  'PERSON_DOB': [
    'date of birth', 'dateofbirth', 'dob', 'birth date', 'birthdate', 
    'd.o.b', 'd o b', 'date birth'
  ],
  
  // ID variants - HANDLES SPELLING VARIATIONS
  'PERSON_AADHAAR': [
    'aadhaar', 'aadhar', 'aadhaar number', 'aadhar number', 
    'aadhaar no', 'aadhar no', 'uid', 'uid number',
    'aadhaar id', 'aadhar id', 'adhaar', 'adhar'  // Common misspellings
  ],
  'PERSON_PAN': [
    'pan', 'pan number', 'pan no', 'pan card', 'pan card number',
    'pannumber', 'pancard'
  ],
  
  // Contact variants
  'CONTACT_PHONE': [
    'phone', 'phone number', 'phonenumber', 'mobile', 'mobile number',
    'mobilenumber', 'contact number', 'contactnumber', 'telephone',
    'mobile no', 'phone no', 'contact no', 'cell', 'cellphone'
  ],
  'CONTACT_EMAIL': [
    'email', 'email address', 'emailaddress', 'e-mail', 'e mail',
    'mail', 'mail address', 'mailaddress'
  ],
  'CONTACT_ADDRESS': [
    'address', 'residential address', 'permanent address', 
    'current address', 'home address', 'mailing address',
    'residentialaddress', 'permanentaddress'
  ],
  
  // Generic
  'PERSON_GENDER': ['gender', 'sex', 'male/female'],
  'PERSON_AGE': ['age', 'years', 'years old'],
};

/**
 * Normalize text for semantic matching
 * Removes spaces, special chars, converts to lowercase
 * Example: "Aadhar Number" → "aadharnumber"
 */
const normalizeForSemanticMatch = (text) => {
  if (!text) return '';
  return text.toLowerCase()
    .replace(/[^a-z0-9]/g, '')  // Remove all non-alphanumeric
    .trim();
};

/**
 * Classify field label into semantic tag
 * Uses NORMALIZED MATCHING with synonym support
 * Returns semantic tag or null if no match
 * 
 * Example:
 *   "Aadhar Number" → normalizes to "aadharnumber" → matches "PERSON_AADHAAR"
 *   "Father Name" → normalizes to "fathername" → matches "PERSON_FATHER_NAME"
 */
export const classifyFieldSemantic = (label) => {
  if (!label) return null;
  
  const normalizedLabel = normalizeForSemanticMatch(label);
  
  // Try exact normalized match first (best accuracy)
  for (const [tag, patterns] of Object.entries(semanticFieldMap)) {
    for (const pattern of patterns) {
      const normalizedPattern = normalizeForSemanticMatch(pattern);
      
      // Exact match (e.g., "aadharnumber" === "aadharnumber")
      if (normalizedLabel === normalizedPattern) {
        console.log(`🎯 Semantic match: "${label}" → ${tag} (exact)`);
        return tag;
      }
      
      // Contains match (e.g., "fathername" contains "father")
      if (normalizedLabel.includes(normalizedPattern) || 
          normalizedPattern.includes(normalizedLabel)) {
        console.log(`🎯 Semantic match: "${label}" → ${tag} (contains)`);
        return tag;
      }
    }
  }
  
  return null; // No semantic classification
};

/**
 * Check if text is a placeholder/helper/format hint
 */
const isPlaceholder = (label) => {
  if (!label) return false;
  return placeholderPatterns.some((pattern) => pattern.test(label));
};

/**
 * Check if text is a section heading (not a field)
 * Sections: "1. Student Information", "PERSONAL DETAILS"
 */
const isSectionHeading = (label) => {
  if (!label) return false;
  return sectionPatterns.some((pattern) => pattern.test(label.trim()));
};

/**
 * Final field filter - removes placeholders and low-confidence fields
 * Applied before MongoDB storage
 * minConfidence = 70 means at least 70% confidence
 */
const finalFieldFilter = (fields, minConfidence = 70) => {
  const filtered = fields.filter((field) => {
    // Check confidence threshold (minConfidence is in percentage, e.g., 70 for 70%)
    if (field.confidence && field.confidence < minConfidence) {
      console.log(`⚠️ Low confidence field removed: "${field.label}" (${field.confidence}%)`);
      return false;
    }

    // Check if section heading (NOT a field)
    if (isSectionHeading(field.label)) {
      console.log(`📋 Section heading removed: "${field.label}" (not a field)`);
      return false;
    }

    // Check if placeholder
    if (isPlaceholder(field.label)) {
      console.log(`🚫 Placeholder field removed: "${field.label}"`);
      return false;
    }

    return true;
  });

  console.log(`✅ Field filter: ${fields.length} → ${filtered.length} valid fields`);
  return filtered;
};

/**
 * Extract form structure from image using OCR + AI
 * Accepts image buffer (PNG normalized)
 */
export const extractFormFromImage = async (imageBuffer) => {
  try {
    console.log("🔍 Extracting text from image buffer...");
    const ocrText = await extractTextFromImage(imageBuffer);

    console.log("🤖 Analyzing form structure with AI...");
    const formStructure = await analyzeFormStructure(ocrText);

    return {
      success: true,
      formStructure,
      extractedText: ocrText,
    };
  } catch (error) {
    console.error("Error extracting form from image:", error);
    throw error;
  }
};

/**
 * Extract form structure from pasted text
 */
export const extractFormFromText = async (pastedText) => {
  try {
    console.log("🤖 Analyzing pasted text for form structure...");
    const formStructure = await analyzeFormStructure(pastedText);

    return {
      success: true,
      formStructure,
      extractedText: pastedText,
    };
  } catch (error) {
    console.error("Error extracting form from text:", error);
    throw error;
  }
};

/**
 * Fallback form parser - works without API key
 * Uses regex patterns to extract fields from text with intelligent type detection
 */
const parseFormStructureWithoutAI = (text) => {
  console.log("🔄 Using intelligent regex-based parser...");
  
  // Extract lines from text
  const lines = text.split('\n').filter(line => line.trim());
  
  // Try to detect form name from first line or use default
  let formName = "Extracted Form";
  let contentLines = lines;
  
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine.length < 50 && !firstLine.includes(':') && !firstLine.match(/^\d+\.|^•|^-/)) {
      formName = firstLine;
      contentLines = lines.slice(1);
    }
  }
  
  let fields = [];
  const fieldSet = new Set();
  
  // Helper: Check if text is just placeholder characters (underscores, dashes, dots)
  const isPlaceholderLine = (text) => {
    return /^[\s_.\-*]+$/.test(text); // Only underscores, dots, dashes, spaces
  };
  
  // Helper: Check if text contains actual field label (not just whitespace/placeholders)
  const isValidFieldLabel = (label) => {
    // Must have at least one letter or common field indicator
    return /[a-zA-Z]/.test(label) && !isPlaceholderLine(label);
  };
  
  // Pattern 1: "Label:" or "Label :" (most common)
  const colonPattern = /^([^:]+?)(\s*\*)?\s*:\s*(.*)$/gm;
  const processedLines = contentLines.join('\n');
  const colonMatches = processedLines.matchAll(colonPattern);
  
  for (const match of colonMatches) {
    const label = match[1].trim();
    const valueAfterColon = (match[3] || '').trim();
    const required = !!match[2];
    
    // Skip if: placeholder line, already added, too short/long, value is just placeholder
    if (label && 
        label.length > 2 && 
        label.length < 100 && 
        isValidFieldLabel(label) &&
        !isPlaceholderLine(valueAfterColon) &&
        !fieldSet.has(label)) {
      
      const fieldType = detectFieldType(label);
      const semanticTag = classifyFieldSemantic(label);
      fields.push({
        label,
        fieldType,
        required,
        placeholder: generatePlaceholder(label),
        vaultMappingKey: generateVaultKey(label),
        semanticTag, // Add semantic classification
        confidence: 82, // Colon pattern: reliable detection
        extractedFrom: 'REGEX_COLON',
      });
      fieldSet.add(label);
    }
  }
  
  // Pattern 2: "• Label" or "- Label" or "* Label"
  const bulletPattern = /^[•\-\*]\s+(.+?)$/gm;
  const bulletMatches = processedLines.matchAll(bulletPattern);
  
  for (const match of bulletMatches) {
    const label = match[1].trim();
    
    if (label && 
        label.length > 2 && 
        label.length < 100 && 
        isValidFieldLabel(label) &&
        !fieldSet.has(label)) {
      
      const fieldType = detectFieldType(label);
      const semanticTag = classifyFieldSemantic(label);
      fields.push({
        label,
        fieldType,
        required: false,
        placeholder: generatePlaceholder(label),
        vaultMappingKey: generateVaultKey(label),
        semanticTag, // Add semantic classification
        confidence: 85, // Bullet pattern: very reliable
        extractedFrom: 'REGEX_BULLET',
      });
      fieldSet.add(label);
    }
  }
  
  // Pattern 3: "1. Label" or "1) Label"
  const numberedPattern = /^\d+[\.\)]\s+(.+?)$/gm;
  const numberedMatches = processedLines.matchAll(numberedPattern);
  
  for (const match of numberedMatches) {
    const label = match[1].trim();
    
    if (label && 
        label.length > 2 && 
        label.length < 100 && 
        isValidFieldLabel(label) &&
        !fieldSet.has(label)) {
      
      const fieldType = detectFieldType(label);
      const semanticTag = classifyFieldSemantic(label);
      fields.push({
        label,
        fieldType,
        required: false,
        placeholder: generatePlaceholder(label),
        vaultMappingKey: generateVaultKey(label),
        semanticTag, // Add semantic classification
        confidence: 88, // Numbered pattern: extremely reliable
        extractedFrom: 'REGEX_NUMBERED',
      });
      fieldSet.add(label);
    }
  }
  
  // If no fields detected, try splitting by common delimiters
  if (fields.length === 0) {
    const candidates = processedLines
      .split(/[\n,;|]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2 && 
                     s.length < 100 && 
                     isValidFieldLabel(s) &&
                     !s.match(/^https?|^http/));

    const uniqueCandidates = Array.from(new Set(candidates));
    
    uniqueCandidates.slice(0, 30).forEach((candidate) => {
      if (!fieldSet.has(candidate)) {
        const fieldType = detectFieldType(candidate);
        const semanticTag = classifyFieldSemantic(candidate);
        fields.push({
          label: candidate,
          fieldType,
          required: false,
          placeholder: generatePlaceholder(candidate),
          vaultMappingKey: generateVaultKey(candidate),
          semanticTag, // Add semantic classification
          confidence: 72, // Delimiter splitting: moderate confidence
          extractedFrom: 'REGEX_DELIMITER',
        });
        fieldSet.add(candidate);
      }
    });
  }
  
  // CRITICAL: Filter out placeholder/format hint fields BEFORE returning
  fields = finalFieldFilter(fields);
  
  // Ensure at least one field
  if (fields.length === 0) {
    fields.push({
      label: 'Information',
      fieldType: 'text',
      required: true,
      placeholder: 'Enter information',
      vaultMappingKey: 'information',
      confidence: 50,
      extractedFrom: 'REGEX_FALLBACK',
    });
  }
  
  // Add order and format for response
  const formattedFields = fields.map((field, index) => ({
    ...field,
    order: index,
  }));
  
  console.log(`✅ Detected ${formattedFields.length} fields`);
  return {
    formName,
    fields: formattedFields,
    confidence: 0.75,
  };
};

/**
 * Detect field type from label using intelligent patterns
 */
const detectFieldType = (label) => {
  const labelLower = label.toLowerCase();
  
  // Email patterns
  if (/email|e-mail|mail address|email address/.test(labelLower)) {
    return 'email';
  }
  
  // Phone/Tel patterns
  if (/phone|mobile|contact|telephone|cell|whatsapp|number\s*\(/.test(labelLower)) {
    return 'phone';
  }
  
  // Date patterns
  if (/date|dob|birth|born|when|joining|expiry|valid|issue/.test(labelLower)) {
    return 'date';
  }
  
  // Number patterns
  if (/number|count|quantity|amount|price|age|year|marks|percentage|cgpa|score|years of|no\./.test(labelLower)) {
    return 'number';
  }
  
  // ID patterns (Aadhaar, PAN, etc)
  if (/aadhaar|aadhar|pan|passport|license|id|uid|identification/.test(labelLower)) {
    return 'text';
  }
  
  // Textarea patterns (long text)
  if (/address|description|comment|message|reason|remark|note|query|feedback|experience|summary/.test(labelLower)) {
    return 'textarea';
  }
  
  // Default to text
  return 'text';
};

/**
 * Generate placeholder text from label
 */
const generatePlaceholder = (label) => {
  if (/email/.test(label.toLowerCase())) {
    return 'example@email.com';
  }
  if (/phone|mobile/.test(label.toLowerCase())) {
    return '10-digit number';
  }
  if (/date|dob/.test(label.toLowerCase())) {
    return 'DD/MM/YYYY';
  }
  if (/aadhaar/.test(label.toLowerCase())) {
    return '12-digit number';
  }
  if (/pan/.test(label.toLowerCase())) {
    return 'ABCDE1234F';
  }
  return `Enter ${label.toLowerCase()}`;
};

/**
 * Generate vault mapping key from label
 */
const generateVaultKey = (label) => {
  return label
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

/**
 * Normalize field label for deduplication
 * Converts similar labels to canonical form
 */
const normalizeLabel = (label) => {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/dateofbirth|dob|birthdate|birth.*date/, 'dob')
    .replace(/aadhaar|aadhar|uid|aadharnumber/, 'aadhaar')
    .replace(/pan|pannumber/, 'pan')
    .replace(/mothersname|motherName/, 'mothersname')
    .replace(/fathersname|fatherName/, 'fathersname')
    .replace(/phone|mobile|contact|telephone/, 'phone')
    .replace(/email|emailaddress/, 'email')
    .replace(/address|residential.*address/, 'address')
    .trim();
};

/**
 * Clean OCR text - remove extra characters and artifacts
 */
const cleanTextField = (text) => {
  if (!text) return '';
  
  return text
    .replace(/[^\w\s\-\.\/\,\@]/g, '') // Remove special OCR artifacts
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/([A-Z])\s(?=[A-Z])/g, '$1') // Remove spaces between initials
    .trim();
};

/**
 * Remove duplicate/template fields
 * Keeps only one field per concept, choosing highest confidence
 */
const removeDuplicates = (fields) => {
  const map = new Map();
  
  fields.forEach((field) => {
    const key = normalizeLabel(field.label);
    const existing = map.get(key);
    
    // Keep field with higher confidence, or first occurrence if same confidence
    if (!existing || (field.confidence || 0) > (existing.confidence || 0)) {
      map.set(key, field);
    }
  });
  
  return Array.from(map.values());
};

/**
 * Validate field count - remove lowest confidence fields if over limit
 */
const validateFieldCount = (fields, maxFields = 50) => {
  if (fields.length <= maxFields) {
    return fields;
  }
  
  console.log(`⚠️ Too many fields detected (${fields.length}). Keeping top ${maxFields}`);
  
  // Sort by confidence descending, then by order
  const sorted = [...fields].sort((a, b) => {
    const confDiff = (b.confidence || 0) - (a.confidence || 0);
    if (confDiff !== 0) return confDiff;
    return (a.order || 0) - (b.order || 0);
  });
  
  return sorted.slice(0, maxFields);
};

/**
 * Clean and normalize all fields in form structure
 */
const cleanFormStructure = (structure) => {
  if (!structure || !structure.fields) {
    return structure;
  }
  
  // Clean field values and labels
  let cleanedFields = structure.fields.map((field) => ({
    ...field,
    label: cleanTextField(field.label),
    value: cleanTextField(field.value || ''),
    placeholder: cleanTextField(field.placeholder || ''),
  }));
  
  // Remove template/duplicate fields
  cleanedFields = removeDuplicates(cleanedFields);
  
  // Validate field count
  cleanedFields = validateFieldCount(cleanedFields);
  
  // Re-order by position
  cleanedFields = cleanedFields.map((field, index) => ({
    ...field,
    order: index,
  }));
  
  console.log(`✅ Cleaned structure: ${cleanedFields.length} unique, high-quality fields`);
  
  return {
    ...structure,
    fields: cleanedFields,
  };
};

/**
 * Use Gemini AI to analyze text and extract form structure
 * Falls back to regex parser if API fails
 */
const analyzeFormStructure = async (text) => {
  try {
    // Try Gemini AI first
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_key_here') {
      console.log("⏮️ No valid Gemini API key, using fallback parser...");
      return parseFormStructureWithoutAI(text);
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // ULTRA STRICT: Intelligent Form Structure Analyzer with Semantic Classification
    const prompt = `You are an Intelligent Form Structure Analyzer.

GOALS:
1. Detect sections (headings) → IGNORE THEM
2. Detect real form fields → EXTRACT THEM
3. Ignore placeholders → BLOCK THEM
4. Classify fields into semantic meaning → TAG THEM
5. Enable smart vault mapping

TEXT CLASSIFICATION RULES:

❌ SECTION (IGNORE - NOT A FIELD):
- Numbered headings: "1. Student Information", "2. Academic Details"
- Bold/ALL CAPS titles: "STUDENT INFORMATION", "PREVIOUS EDUCATION"
- Ends with "Information", "Details", "Section"
- Example: "1. Personal Information" → NOT A FIELD

✅ FIELD LABEL (EXTRACT):
- Followed by colon, line, or blank space
- Followed by input area
- Example: "Full Name: ____" → FIELD

❌ PLACEHOLDER (IGNORE):
- Contains: Enter, Type, Fill, XXXX, YYYY, MM/DD, DD/MM
- Example: "Enter your name" → NOT A FIELD

SEMANTIC CLASSIFICATION:

Classify each field into semantic tag:

Full Name → PERSON_FULL_NAME
Father Name → PERSON_FATHER_NAME
Mother Name → PERSON_MOTHER_NAME
DOB/Date of Birth → PERSON_DOB
Aadhaar Number → PERSON_AADHAAR
PAN Number → PERSON_PAN
Phone/Mobile → CONTACT_PHONE
Email → CONTACT_EMAIL
Address → CONTACT_ADDRESS
Gender → PERSON_GENDER
Age → PERSON_AGE

STRICT MAPPING RULE:
Semantic tags enable correct vault mapping.
NEVER MAP:
Father Name → Full Name ❌
Mother Name → Full Name ❌
DOB → Age ❌

Text to analyze:
${text}

Return ONLY valid JSON object with NO markdown or code blocks:
{
  "formName": "Detected form name",
  "fields": [
    {
      "label": "Real field label (as written)",
      "fieldType": "text|number|date|email|phone|dropdown|checkbox|radio|textarea|file",
      "vaultMappingKey": "mapping key",
      "semanticTag": "PERSON_FULL_NAME or other semantic tag or null",
      "required": boolean,
      "confidence": 80-95
    }
  ]
}

FINAL CHECK:
Before returning JSON:
1. Remove section headings
2. Remove placeholders
3. Ensure semantic tags are correct
4. Each real field has proper classification

Return ONLY the JSON object, no explanation.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let textResponse = response.text();

    // Clean up the response - remove markdown code blocks if present
    textResponse = textResponse
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    console.log("✅ AI Response received");

    const formStructure = JSON.parse(textResponse);

    // Validate structure
    if (!formStructure.formName || !Array.isArray(formStructure.fields)) {
      throw new Error("Invalid form structure returned by AI");
    }

    // Clean and normalize all fields
    let fields = formStructure.fields.map((field, index) => ({
      order: index,
      label: cleanTextField(field.label || ''),
      fieldType: field.fieldType || detectFieldType(field.label || ''),
      vaultMappingKey: field.vaultMappingKey || generateVaultKey(field.label || ''),
      placeholder: field.placeholder || generatePlaceholder(field.label || ''),
      semanticTag: field.semanticTag || classifyFieldSemantic(field.label || ''), // Use AI tag or classify
      required: field.required || false,
      confidence: Math.min(field.confidence || 85, 95),
      extractedFrom: 'GEMINI_STRICT',
    }));

    // Apply deduplication and validation
    fields = removeDuplicates(fields);
    fields = validateFieldCount(fields);
    
    // CRITICAL: Filter out placeholder/format hint fields
    fields = finalFieldFilter(fields);
    
    // Re-assign orders after filtering
    fields = fields.map((field, index) => ({
      ...field,
      order: index,
    }));

    console.log(`✅ Extracted ${fields.length} unique, validated, placeholder-free fields`);

    return {
      formName: formStructure.formName,
      fields: fields,
    };
  } catch (error) {
    console.error("❌ AI parsing failed:", error.message);
    console.log("⏮️ Falling back to regex-based parser...");
    
    try {
      const fallbackStructure = parseFormStructureWithoutAI(text);
      console.log("✅ Fallback parser succeeded");
      return fallbackStructure;
    } catch (fallbackError) {
      console.error("Fallback parser error:", fallbackError);
      throw new Error("Failed to parse form structure");
    }
  }
};

/**
 * Generate vault mapping suggestions for form fields
 */
export const suggestVaultMappings = async (fields, vaultFields) => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Match form fields with vault data fields. Return ONLY a valid JSON array.

Form Fields:
${JSON.stringify(
  fields.map((f) => ({ label: f.label, currentMapping: f.vaultMappingKey })),
)}

Available Vault Fields:
${JSON.stringify(vaultFields.map((f) => ({ name: f.fieldName, value: f.fieldValue })))}

Return format (strict JSON array):
[
  {
    "formFieldLabel": "Field label from form",
    "suggestedVaultKey": "fieldName from vault that matches",
    "confidence": 0-100,
    "matchReason": "direct|synonym|semantic"
  }
]

Matching rules:
1. Direct match: Exact label match (e.g., "Name" → "Name")
2. Synonym match: Similar meaning (e.g., "Mobile" → "Phone Number")
3. Semantic match: AI understanding (e.g., "DOB" → "Date of Birth")

Return ONLY the JSON array, no other text.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    let textResponse = response.text();

    textResponse = textResponse
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const mappings = JSON.parse(textResponse);
    return mappings;
  } catch (error) {
    console.error("Error generating vault mappings:", error);
    return [];
  }
};

/**
 * Validate form field values
 */
export const validateFormData = (fields, data) => {
  const errors = {};

  fields.forEach((field) => {
    const value = data[field.label];

    // Check required fields
    if (field.required && (!value || value.toString().trim() === "")) {
      errors[field.label] = `${field.label} is required`;
      return;
    }

    if (!value) return;

    // All fields accept text - minimal validation
    // Only semantic validations for specific field types

    // Aadhaar: 12 digits (optional)
    if (
      field.vaultMappingKey === "aadhaar" ||
      field.label.toLowerCase().includes("aadhaar")
    ) {
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length > 0 && digitsOnly.length !== 12) {
        errors[field.label] = "Aadhaar should be 12 digits (if provided)";
      }
    }

    // PAN: Specific format (optional)
    if (
      field.vaultMappingKey === "pan" ||
      field.label.toLowerCase().includes("pan")
    ) {
      const panValue = value.trim().toUpperCase();
      if (panValue.length > 0 && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panValue)) {
        console.log(
          `⚠️  PAN format suggestion: ${panValue} (expected: ABCDE1234F)`,
        );
      }
    }

    // Phone: Extract digits and warn if not in expected range
    if (
      field.label.toLowerCase().includes("phone") ||
      field.label.toLowerCase().includes("mobile") ||
      field.label.toLowerCase().includes("contact")
    ) {
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length > 0 && digitsOnly.length < 7) {
        console.log(`⚠️  Phone number seems too short: ${value}`);
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
