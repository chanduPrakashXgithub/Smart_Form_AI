import { GoogleGenerativeAI } from "@google/generative-ai";
import VaultField from "../models/VaultField.js";

// Lazy initialization - initialize only when needed
let genAI, isInitialized = false;

function initializeGemini() {
  if (isInitialized) return true;
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "your_api_key_here") {
    console.warn("⚠️ GEMINI_API_KEY not configured - guidance will use templates only");
    return false;
  }
  
  console.log("✅ Initializing Gemini AI for field guidance");
  genAI = new GoogleGenerativeAI(apiKey);
  isInitialized = true;
  return true;
}

// Helper to check if Gemini is available
function isGeminiAvailable() {
  return initializeGemini();
}

/**
 * 🤖 FIELD GUIDANCE SERVICE
 * Provides intelligent guidance to users while filling forms
 * 
 * Features:
 * - Explains what each field means
 * - Provides example inputs
 * - Warns about format requirements
 * - Suggests values from vault (smart autofill)
 */

/**
 * Field-specific guidance templates
 * Used for fast responses without AI calls
 */
const FIELD_GUIDANCE_TEMPLATES = {
  // Name fields
  'name': {
    meaning: 'Enter your full official name as it appears on your certificates and documents',
    example: 'Naveen Mandadi',
    validationTip: 'Use proper capitalization. Include middle name if applicable.',
    format: 'text',
  },
  'full name': {
    meaning: 'Enter your complete legal name (First, Middle, Last)',
    example: 'Naveen Kumar Mandadi',
    validationTip: 'Match the name on your government ID exactly',
    format: 'text',
  },
  'first name': {
    meaning: 'Enter your first/given name only',
    example: 'Naveen',
    validationTip: 'First name only, no surname',
    format: 'text',
  },
  'last name': {
    meaning: 'Enter your family name/surname',
    example: 'Mandadi',
    validationTip: 'Last name or surname only',
    format: 'text',
  },
  'father name': {
    meaning: "Enter your father's full name",
    example: 'Ramesh Mandadi',
    validationTip: 'Use official name as per documents',
    format: 'text',
  },
  
  // Contact fields
  'email': {
    meaning: 'Enter your valid email address for communication',
    example: 'naveen.mandadi@gmail.com',
    validationTip: 'Must contain @ and a valid domain. Check for typos.',
    format: 'email',
  },
  'phone': {
    meaning: 'Enter your mobile/phone number with country code',
    example: '+91 9876543210 or 9876543210',
    validationTip: 'Use 10-digit format. Include +91 for India if required.',
    format: 'tel',
  },
  'mobile': {
    meaning: 'Enter your mobile number for SMS/WhatsApp communication',
    example: '9876543210',
    validationTip: '10-digit Indian mobile number without country code',
    format: 'tel',
  },
  'address': {
    meaning: 'Enter your complete residential address',
    example: 'House #123, Street Name, City, State - 500001',
    validationTip: 'Include house number, street, city, state, and PIN code',
    format: 'textarea',
  },
  
  // Academic fields
  'cgpa': {
    meaning: 'Enter your Cumulative Grade Point Average (B.Tech or equivalent)',
    example: '8.45 (for 10-point scale) or 3.8 (for 4-point scale)',
    validationTip: 'Use decimal point. Range: 0-10 (Indian) or 0-4 (US)',
    format: 'number',
  },
  'gpa': {
    meaning: 'Enter your Grade Point Average',
    example: '3.75',
    validationTip: 'Decimal number. Usually 0-4 scale in US, 0-10 in India',
    format: 'number',
  },
  'percentage': {
    meaning: 'Enter your marks/score in percentage',
    example: '92.5 (do NOT include % symbol)',
    validationTip: 'Enter number only, no % symbol. Range: 0-100',
    format: 'number',
  },
  'marks': {
    meaning: 'Enter your total marks obtained',
    example: '450 out of 500',
    validationTip: 'Enter marks obtained. Mention total if asked.',
    format: 'number',
  },
  'year of passing': {
    meaning: 'Enter the year you completed/will complete this qualification',
    example: '2024 or 2025',
    validationTip: 'Use 4-digit year format (YYYY)',
    format: 'number',
  },
  'passing year': {
    meaning: 'Year of completion of this educational qualification',
    example: '2024',
    validationTip: '4-digit year format',
    format: 'number',
  },
  
  // ID fields
  'roll number': {
    meaning: 'Enter your college/university roll number',
    example: '21CSE1234 or 2021BT0001',
    validationTip: 'Check your ID card or hall ticket for exact format',
    format: 'text',
  },
  'registration number': {
    meaning: 'Enter your official registration/enrollment number',
    example: 'REG2021CS001234',
    validationTip: 'Check your enrollment certificate',
    format: 'text',
  },
  'student id': {
    meaning: 'Enter your unique student identification number',
    example: 'STU2021001234',
    validationTip: 'Found on your student ID card',
    format: 'text',
  },
  
  // Date fields
  'date of birth': {
    meaning: 'Enter your date of birth as per certificates',
    example: '15/08/2000 or 2000-08-15',
    validationTip: 'Use DD/MM/YYYY or YYYY-MM-DD format. Match your ID proof.',
    format: 'date',
  },
  'dob': {
    meaning: 'Enter your date of birth',
    example: '15-08-2000',
    validationTip: 'Follow the format shown (DD-MM-YYYY or MM/DD/YYYY)',
    format: 'date',
  },
  
  // File upload fields
  'resume': {
    meaning: 'Upload your latest resume/CV document',
    example: 'File: Naveen_Resume_2024.pdf',
    validationTip: 'Accepted formats: PDF, DOC, DOCX. Max size: 2MB usually',
    format: 'file',
    accept: '.pdf,.doc,.docx',
  },
  'cv': {
    meaning: 'Upload your curriculum vitae (CV)',
    example: 'File: CV_Naveen_Mandadi.pdf',
    validationTip: 'PDF format preferred. Keep file size under 2MB',
    format: 'file',
    accept: '.pdf,.doc,.docx',
  },
  'certificate': {
    meaning: 'Upload the required certificate document',
    example: 'File: 10th_Certificate.pdf',
    validationTip: 'Clear scan or photo. PDF/JPG/PNG accepted',
    format: 'file',
    accept: '.pdf,.jpg,.jpeg,.png',
  },
  'photo': {
    meaning: 'Upload your recent passport-size photograph',
    example: 'File: Passport_Photo.jpg',
    validationTip: 'JPG/PNG format. White background preferred. Under 1MB',
    format: 'file',
    accept: 'image/jpeg,image/png',
  },
  
  // Other fields
  'gender': {
    meaning: 'Select your gender',
    example: 'Male / Female / Other',
    validationTip: 'Choose the option that applies to you',
    format: 'select',
  },
  'age': {
    meaning: 'Enter your current age in years',
    example: '22',
    validationTip: 'Whole number only. Calculate from your date of birth',
    format: 'number',
  },
};

/**
 * Get guidance template for a field label
 */
const getGuidanceTemplate = (label) => {
  if (!label) return null;
  
  const normalizedLabel = label.toLowerCase().trim();
  
  // Exact match
  if (FIELD_GUIDANCE_TEMPLATES[normalizedLabel]) {
    return FIELD_GUIDANCE_TEMPLATES[normalizedLabel];
  }
  
  // Partial match (contains)
  for (const [key, template] of Object.entries(FIELD_GUIDANCE_TEMPLATES)) {
    if (normalizedLabel.includes(key) || key.includes(normalizedLabel)) {
      return template;
    }
  }
  
  return null;
};

/**
 * 🎯 MAIN FUNCTION - Get Field Guidance
 * Returns intelligent guidance for a specific form field
 * 
 * @param {string} fieldLabel - The label of the field user is filling
 * @param {string} fieldType - The type of field (text, email, number, etc.)
 * @param {string} userId - User ID for vault suggestions
 * @param {object} options - Additional options
 * @returns {object} Guidance object with meaning, example, validation tips
 */
export const getFieldGuidance = async (fieldLabel, fieldType = 'text', userId = null, options = {}) => {
  try {
    console.log(`🤖 Getting guidance for field: "${fieldLabel}" (${fieldType})`);
    
    // Try template first (fast, no API call)
    const template = getGuidanceTemplate(fieldLabel);
    
    if (template) {
      console.log(`✅ Using pre-built template for "${fieldLabel}"`);
      
      // Get vault suggestion if userId provided
      let vaultSuggestion = null;
      let vaultConfidence = 0;
      
      if (userId) {
        const vaultData = await getVaultSuggestion(userId, fieldLabel);
        if (vaultData) {
          vaultSuggestion = vaultData.value;
          vaultConfidence = vaultData.confidence;
        }
      }
      
      return {
        fieldLabel,
        fieldType: template.format,
        guidance: {
          meaning: template.meaning,
          example: template.example,
          validationTip: template.validationTip,
          format: template.format,
          accept: template.accept,
        },
        vaultSuggestion,
        vaultConfidence,
        autoFill: vaultConfidence >= 85, // Auto-fill if confidence >= 85%
        source: 'template',
      };
    }
    
    // Fallback to AI generation
    console.log(`🧠 Generating AI guidance for "${fieldLabel}"...`);
    return await generateAIGuidance(fieldLabel, fieldType, userId);
    
  } catch (error) {
    console.error(`❌ Error getting guidance for "${fieldLabel}":`, error);
    
    // Return basic guidance as fallback
    return {
      fieldLabel,
      fieldType,
      guidance: {
        meaning: `Enter your ${fieldLabel.toLowerCase()}`,
        example: getDefaultExample(fieldType),
        validationTip: getDefaultValidation(fieldType),
        format: fieldType,
      },
      vaultSuggestion: null,
      vaultConfidence: 0,
      autoFill: false,
      source: 'fallback',
    };
  }
};

/**
 * Generate AI guidance using Gemini (when no template exists)
 */
const generateAIGuidance = async (fieldLabel, fieldType, userId) => {
    // Check if Gemini is available
    if (!isGeminiAvailable()) {
      console.log("⚠️ Gemini not available, returning basic guidance");
      return {
        fieldLabel,
        fieldType,
        guidance: {
          meaning: `Enter your ${fieldLabel.toLowerCase()}`,
          example: getDefaultExample(fieldType),
          validationTip: getDefaultValidation(fieldType),
          format: fieldType,
        },
        vaultSuggestion: null,
        vaultConfidence: 0,
        autoFill: false,
        source: 'fallback',
      };
    }
  
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const prompt = `You are a Smart Form Filling Assistant.

User is filling a form field with the following details:
- Field Label: "${fieldLabel}"
- Field Type: ${fieldType}

Provide clear, helpful guidance in JSON format:

{
  "fieldMeaning": "What this field means and why it's needed",
  "example": "Example value user should enter (realistic Indian context)",
  "validationTip": "Format requirements or warnings"
}

RULES:
1. Be concise and clear
2. Use Indian context (names, phone numbers, education system)
3. Provide realistic examples
4. Warn about common mistakes
5. Return ONLY JSON, no extra text

Example for "CGPA":
{
  "fieldMeaning": "Enter your B.Tech CGPA on a 10-point scale",
  "example": "8.45",
  "validationTip": "Use decimal point. Range: 0-10. Do not include '/10'"
}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  console.log("📝 AI guidance response:", text);
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Invalid AI response");
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  // Get vault suggestion
  let vaultSuggestion = null;
  let vaultConfidence = 0;
  
  if (userId) {
    const vaultData = await getVaultSuggestion(userId, fieldLabel);
    if (vaultData) {
      vaultSuggestion = vaultData.value;
      vaultConfidence = vaultData.confidence;
    }
  }
  
  return {
    fieldLabel,
    fieldType,
    guidance: {
      meaning: parsed.fieldMeaning,
      example: parsed.example,
      validationTip: parsed.validationTip,
      format: fieldType,
    },
    vaultSuggestion,
    vaultConfidence,
    autoFill: vaultConfidence >= 85,
    source: 'ai',
  };
};

/**
 * Get vault suggestion for a field
 */
const getVaultSuggestion = async (userId, fieldLabel) => {
  try {
    const normalizedLabel = (fieldLabel || "").toLowerCase().trim();
    if (!normalizedLabel) return null;
    
    // Search vault for matching field
    const vaultFields = await VaultField.find({ userId })
      .sort({ confidence: -1 })
      .limit(10);
    
    // Find best match
    let bestMatch = null;
    let bestScore = 0;
    
    for (const field of vaultFields) {
      const fieldKey = (field.fieldName || "").toLowerCase();
      const fieldName = (field.fieldName || "").toLowerCase();
      if (!fieldKey) continue;
      
      let score = 0;
      
      // Exact match (highest score)
      if (fieldKey === normalizedLabel || fieldName === normalizedLabel) {
        score = 100;
      }
      // Contains match
      else if (normalizedLabel.includes(fieldKey) || fieldKey.includes(normalizedLabel)) {
        score = 80;
      }
      else if (normalizedLabel.includes(fieldName) || fieldName.includes(normalizedLabel)) {
        score = 75;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = field;
      }
    }
    
    if (bestMatch && bestScore >= 70) {
      console.log(`💎 Vault match: "${fieldLabel}" → "${bestMatch.fieldName}" (${bestScore}% match, ${bestMatch.confidence}% confidence)`);
      
      return {
        value: bestMatch.fieldValue,
        confidence: Math.min(bestScore, bestMatch.confidence), // Take lower of the two
        source: bestMatch.documentName,
        fieldKey: bestMatch.fieldName,
      };
    }
    
    return null;
    
  } catch (error) {
    console.error("Error getting vault suggestion:", error);
    return null;
  }
};

/**
 * Get default example based on field type
 */
const getDefaultExample = (fieldType) => {
  const examples = {
    text: 'John Doe',
    email: 'user@example.com',
    tel: '9876543210',
    number: '123',
    date: '2000-01-01',
    file: 'document.pdf',
    textarea: 'Enter detailed information here',
    select: 'Select an option',
  };
  
  return examples[fieldType] || 'Enter value';
};

/**
 * Get default validation message based on field type
 */
const getDefaultValidation = (fieldType) => {
  const validations = {
    text: 'Enter text without special characters',
    email: 'Must be a valid email address (user@domain.com)',
    tel: 'Enter 10-digit mobile number',
    number: 'Enter numeric value only',
    date: 'Select or enter date in correct format',
    file: 'Upload valid file (check size and format limits)',
    textarea: 'Provide complete information as requested',
    select: 'Choose one of the available options',
  };
  
  return validations[fieldType] || 'Follow the format shown';
};

/**
 * 🎯 Batch Guidance for Multiple Fields
 * Get guidance for all fields in a form at once
 */
export const getBatchFieldGuidance = async (fields, userId = null) => {
  try {
    console.log(`🤖 Getting batch guidance for ${fields.length} fields...`);
    
    const guidancePromises = fields.map(field => 
      getFieldGuidance(field.label, field.type, userId)
    );
    
    const results = await Promise.all(guidancePromises);
    
    console.log(`✅ Generated guidance for ${results.length} fields`);
    
    return results;
    
  } catch (error) {
    console.error("Error getting batch guidance:", error);
    throw error;
  }
};

/**
 * 🎯 Context-Aware Guidance
 * Provides guidance based on user's current form context
 * 
 * Example: If user already filled "10th Percentage", suggest format for "12th Percentage"
 */
export const getContextAwareGuidance = async (fieldLabel, fieldType, userId, filledFields = {}) => {
  try {
    console.log(`🧠 Getting context-aware guidance for "${fieldLabel}"...`);
    
    // Get basic guidance first
    const basicGuidance = await getFieldGuidance(fieldLabel, fieldType, userId);
    
    // Enhance with context
    const contextHints = [];
    
    // Check if similar field was already filled
    const normalizedLabel = fieldLabel.toLowerCase();
    
    for (const [key, value] of Object.entries(filledFields)) {
      const normalizedKey = key.toLowerCase();
      
      // If similar field exists, use its format as hint
      if (normalizedKey.includes(normalizedLabel.split(' ')[0]) || 
          normalizedLabel.includes(normalizedKey.split(' ')[0])) {
        
        contextHints.push(`You filled "${key}" as "${value}". Use similar format.`);
      }
    }
    
    if (contextHints.length > 0) {
      basicGuidance.contextHints = contextHints;
    }
    
    return basicGuidance;
    
  } catch (error) {
    console.error("Error getting context-aware guidance:", error);
    return await getFieldGuidance(fieldLabel, fieldType, userId);
  }
};
