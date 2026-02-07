import VaultField from "../models/VaultField.js";
import { suggestVaultMappings, classifyFieldSemantic } from "./formAIService.js";

/**
 * Auto-map form fields to vault data
 */
export const autoMapFormFields = async (userId, formFields) => {
  try {
    // Get all vault fields for the user
    const vaultFields = await VaultField.find({ userId }).lean();

    if (vaultFields.length === 0) {
      return formFields.map((field) => ({
        ...field,
        vaultValue: null,
        mappingStatus: "NO_DATA",
      }));
    }

    // Create a mapping object for quick lookup
    const vaultMap = {};
    vaultFields.forEach((vf) => {
      const key = vf.fieldName.toLowerCase().trim();
      if (!vaultMap[key]) {
        vaultMap[key] = [];
      }
      vaultMap[key].push(vf);
    });

    // Map each form field
    const mappedFields = formFields.map((field) => {
      const mappingResult = findBestMatch(field, vaultMap, vaultFields);

      return {
        ...field,
        vaultValue: mappingResult.value,
        vaultFieldId: mappingResult.fieldId,
        mappingStatus: mappingResult.status,
        mappingType: mappingResult.type,
        alternatives: mappingResult.alternatives,
      };
    });

    return mappedFields;
  } catch (error) {
    console.error("Error auto-mapping form fields:", error);
    throw error;
  }
};

/**
 * Find best match for a form field in vault data
 * Priority: Semantic Tag > Direct Key > Exact Label > Synonym > Fuzzy
 */
const findBestMatch = (field, vaultMap, allVaultFields) => {
  const label = field.label.toLowerCase().trim();
  const vaultKey = field.vaultMappingKey?.toLowerCase().trim();
  const semanticTag = field.semanticTag;

  // 0. HIGHEST PRIORITY: Semantic Tag Match (prevents Father Name → Full Name)
  if (semanticTag) {
    // Find vault fields with matching semantic tag
    const semanticMatches = allVaultFields.filter(vf => 
      vf.semanticTag === semanticTag
    );
    
    if (semanticMatches.length === 1) {
      return {
        value: semanticMatches[0].fieldValue,
        fieldId: semanticMatches[0]._id,
        status: "MAPPED",
        type: "SEMANTIC_TAG",
        alternatives: [],
      };
    } else if (semanticMatches.length > 1) {
      return {
        value: semanticMatches[0].fieldValue,
        fieldId: semanticMatches[0]._id,
        status: "MULTIPLE_MATCHES",
        type: "SEMANTIC_TAG",
        alternatives: semanticMatches.slice(1).map((m) => ({
          value: m.fieldValue,
          fieldId: m._id,
          source: m.extractedFrom,
        })),
      };
    }
  }

  // 1. Try direct vault key match
  if (vaultKey && vaultMap[vaultKey]) {
    const matches = vaultMap[vaultKey];
    if (matches.length === 1) {
      return {
        value: matches[0].fieldValue,
        fieldId: matches[0]._id,
        status: "MAPPED",
        type: "DIRECT_KEY",
        alternatives: [],
      };
    } else if (matches.length > 1) {
      return {
        value: matches[0].fieldValue,
        fieldId: matches[0]._id,
        status: "MULTIPLE_MATCHES",
        type: "DIRECT_KEY",
        alternatives: matches.slice(1).map((m) => ({
          value: m.fieldValue,
          fieldId: m._id,
          source: m.extractedFrom,
        })),
      };
    }
  }

  // 2. Try exact label match
  if (vaultMap[label]) {
    const matches = vaultMap[label];
    if (matches.length === 1) {
      return {
        value: matches[0].fieldValue,
        fieldId: matches[0]._id,
        status: "MAPPED",
        type: "EXACT_LABEL",
        alternatives: [],
      };
    } else if (matches.length > 1) {
      return {
        value: matches[0].fieldValue,
        fieldId: matches[0]._id,
        status: "MULTIPLE_MATCHES",
        type: "EXACT_LABEL",
        alternatives: matches.slice(1).map((m) => ({
          value: m.fieldValue,
          fieldId: m._id,
          source: m.extractedFrom,
        })),
      };
    }
  }

  // 3. Try synonym matching
  const synonymMatches = findSynonymMatches(label, vaultMap);
  if (synonymMatches.length > 0) {
    if (synonymMatches.length === 1) {
      return {
        value: synonymMatches[0].fieldValue,
        fieldId: synonymMatches[0]._id,
        status: "MAPPED",
        type: "SYNONYM",
        alternatives: [],
      };
    } else {
      return {
        value: synonymMatches[0].fieldValue,
        fieldId: synonymMatches[0]._id,
        status: "MULTIPLE_MATCHES",
        type: "SYNONYM",
        alternatives: synonymMatches.slice(1).map((m) => ({
          value: m.fieldValue,
          fieldId: m._id,
          source: m.extractedFrom,
        })),
      };
    }
  }

  // 4. Try fuzzy matching (WITH SEMANTIC BLOCKING)
  const fuzzyMatches = findFuzzyMatches(label, allVaultFields, semanticTag);
  if (fuzzyMatches.length > 0) {
    if (fuzzyMatches.length === 1) {
      return {
        value: fuzzyMatches[0].fieldValue,
        fieldId: fuzzyMatches[0]._id,
        status: "MAPPED",
        type: "FUZZY",
        alternatives: [],
      };
    } else {
      return {
        value: fuzzyMatches[0].fieldValue,
        fieldId: fuzzyMatches[0]._id,
        status: "MULTIPLE_MATCHES",
        type: "FUZZY",
        alternatives: fuzzyMatches.slice(1).map((m) => ({
          value: m.fieldValue,
          fieldId: m._id,
          source: m.extractedFrom,
        })),
      };
    }
  }

  // No match found
  return {
    value: null,
    fieldId: null,
    status: "NO_MATCH",
    type: null,
    alternatives: [],
  };
};

/**
 * Synonym matching
 */
const findSynonymMatches = (label, vaultMap) => {
  const synonyms = {
    name: ["full name", "fullname", "complete name", "your name"],
    firstname: ["first name", "given name", "fname"],
    lastname: ["last name", "surname", "family name", "lname"],
    dob: [
      "date of birth",
      "birth date",
      "birthday",
      "dateofbirth",
      "d.o.b",
      "d o b",
    ],
    phone: [
      "mobile",
      "mobile number",
      "phone number",
      "contact",
      "contact number",
      "telephone",
    ],
    email: ["email address", "e-mail", "mail", "email id"],
    address: [
      "full address",
      "residential address",
      "permanent address",
      "current address",
    ],
    aadhaar: ["aadhaar number", "aadhar", "aadhar number", "uid"],
    pan: ["pan number", "pan card", "pan card number"],
    father: ["father name", "fathers name", "father's name"],
    mother: ["mother name", "mothers name", "mother's name"],
    gender: ["sex"],
    pincode: ["pin", "postal code", "zip", "pin code"],
  };

  const matches = [];

  for (const [key, syns] of Object.entries(synonyms)) {
    if (syns.includes(label)) {
      const keyMatches = vaultMap[key];
      if (keyMatches) {
        matches.push(...keyMatches);
      }

      // Also check other synonyms
      syns.forEach((syn) => {
        const synMatches = vaultMap[syn];
        if (synMatches) {
          matches.push(...synMatches);
        }
      });
    }
  }

  // Remove duplicates
  const unique = [];
  const seen = new Set();
  matches.forEach((m) => {
    if (!seen.has(m._id.toString())) {
      unique.push(m);
      seen.add(m._id.toString());
    }
  });

  return unique;
};

/**
 * Check if two semantic tags are incompatible (hard block wrong mappings)
 */
const areSemanticTagsIncompatible = (tag1, tag2) => {
  if (!tag1 || !tag2) return false;
  
  // Hard blocking rules: these should NEVER map to each other
  const incompatiblePairs = [
    ['PERSON_FULL_NAME', 'PERSON_FATHER_NAME'],
    ['PERSON_FULL_NAME', 'PERSON_MOTHER_NAME'],
    ['PERSON_FATHER_NAME', 'PERSON_MOTHER_NAME'],
    ['PERSON_DOB', 'PERSON_AGE'],
    ['PERSON_EMAIL', 'PERSON_PHONE'],
    ['PERSON_AADHAAR', 'PERSON_PAN'],
  ];
  
  return incompatiblePairs.some(pair => 
    (pair[0] === tag1 && pair[1] === tag2) || 
    (pair[1] === tag1 && pair[0] === tag2)
  );
};

/**
 * Fuzzy matching using string similarity
 * WITH SEMANTIC INCOMPATIBILITY BLOCKING
 */
const findFuzzyMatches = (label, vaultFields, formFieldSemanticTag = null) => {
  const matches = [];

  vaultFields.forEach((vf) => {
    // HARD BLOCK: Check semantic incompatibility BEFORE text similarity
    if (formFieldSemanticTag && vf.semanticTag) {
      if (areSemanticTagsIncompatible(formFieldSemanticTag, vf.semanticTag)) {
        console.log(`🚫 BLOCKED: "${label}" (${formFieldSemanticTag}) ≠ "${vf.fieldName}" (${vf.semanticTag})`);
        return; // Skip this vault field - semantically incompatible
      }
    }
    
    const similarity = stringSimilarity(
      label,
      vf.fieldName.toLowerCase().trim(),
    );
    if (similarity > 0.6) {
      matches.push({ ...vf, similarity });
    }
  });

  // Sort by similarity
  matches.sort((a, b) => b.similarity - a.similarity);

  return matches;
};

/**
 * Calculate string similarity (Levenshtein distance)
 */
const stringSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

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
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
};

/**
 * Get alternative values for a form field
 */
export const getAlternativesForField = async (
  userId,
  fieldLabel,
  vaultMappingKey,
) => {
  try {
    const query = { userId };

    if (vaultMappingKey) {
      // Search by vault key first
      const keyResults = await VaultField.find({
        userId,
        fieldName: new RegExp(vaultMappingKey, "i"),
      }).lean();

      if (keyResults.length > 0) {
        return keyResults.map((vf) => ({
          value: vf.fieldValue,
          fieldId: vf._id,
          source: vf.extractedFrom,
          fieldName: vf.fieldName,
        }));
      }
    }

    // Search by field label
    const labelResults = await VaultField.find({
      userId,
      fieldName: new RegExp(fieldLabel, "i"),
    }).lean();

    return labelResults.map((vf) => ({
      value: vf.fieldValue,
      fieldId: vf._id,
      source: vf.extractedFrom,
      fieldName: vf.fieldName,
    }));
  } catch (error) {
    console.error("Error getting alternatives:", error);
    return [];
  }
};
