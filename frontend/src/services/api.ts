import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
});

export const documentService = {
  uploadDocument: async (file: File, documentType: string) => {
    const formData = new FormData();
    formData.append("document", file);
    formData.append("documentType", documentType);

    const response = await axios.post(
      `${API_URL}/api/documents/upload`,
      formData,
      {
        headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  processDocument: async (documentId: string) => {
    const response = await axios.post(
      `${API_URL}/api/documents/process`,
      { documentId },
      { headers: getAuthHeaders() },
    );
    return response.data;
  },

  getDocuments: async () => {
    const response = await axios.get(`${API_URL}/api/documents`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getDocument: async (documentId: string) => {
    const response = await axios.get(`${API_URL}/api/documents/${documentId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};

export const vaultService = {
  getVaultSections: async () => {
    const response = await axios.get(`${API_URL}/api/vault/sections`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getSectionDetails: async (sectionType: string) => {
    const response = await axios.get(
      `${API_URL}/api/vault/section/${sectionType}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return response.data;
  },

  getSectionFields: async (sectionId: string) => {
    const response = await axios.get(
      `${API_URL}/api/vault/fields/${sectionId}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return response.data;
  },

  addField: async (
    sectionType: string,
    fieldName: string,
    fieldValue: string,
  ) => {
    const response = await axios.post(
      `${API_URL}/api/vault/fields`,
      { sectionType, fieldName, fieldValue },
      { headers: getAuthHeaders() },
    );
    return response.data;
  },

  updateField: async (
    fieldId: string,
    fieldValue: string,
    confidence: number,
  ) => {
    const response = await axios.put(
      `${API_URL}/api/vault/fields/${fieldId}`,
      { fieldValue, confidence },
      { headers: getAuthHeaders() },
    );
    return response.data;
  },

  deleteField: async (fieldId: string) => {
    const response = await axios.delete(
      `${API_URL}/api/vault/fields/${fieldId}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return response.data;
  },

  deleteSection: async (sectionId: string) => {
    const response = await axios.delete(
      `${API_URL}/api/vault/section/${sectionId}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return response.data;
  },
};

export const autofillService = {
  suggestAutofill: async (formFieldName: string, formContext: string) => {
    const response = await axios.post(
      `${API_URL}/api/autofill/suggest`,
      { formFieldName, formContext },
      { headers: getAuthHeaders() },
    );
    return response.data;
  },

  getAlternatives: async (fieldName: string) => {
    const response = await axios.post(
      `${API_URL}/api/autofill/alternatives`,
      { fieldName },
      { headers: getAuthHeaders() },
    );
    return response.data;
  },

  getLearnedFields: async () => {
    const response = await axios.get(`${API_URL}/api/autofill/learned-fields`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  copyWithFormat: async (fieldValue: string, targetFormat: string) => {
    const response = await axios.post(
      `${API_URL}/api/autofill/format`,
      { fieldValue, targetFormat },
      { headers: getAuthHeaders() },
    );
    return response.data;
  },
};

export const ambiguityService = {
  getAmbiguities: async (status: string = "PENDING") => {
    const response = await axios.get(
      `${API_URL}/api/ambiguities?status=${status}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return response.data;
  },

  resolveAmbiguity: async (
    ambiguityId: string,
    resolvedValue: string,
    notes: string,
  ) => {
    const response = await axios.put(
      `${API_URL}/api/ambiguities/${ambiguityId}/resolve`,
      { resolvedValue, resolutionNotes: notes },
      { headers: getAuthHeaders() },
    );
    return response.data;
  },

  deleteAmbiguity: async (ambiguityId: string) => {
    const response = await axios.delete(
      `${API_URL}/api/ambiguities/${ambiguityId}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return response.data;
  },
};

export const formService = {
  generateFromImage: async (formImage: File) => {
    const formData = new FormData();
    formData.append("formImage", formImage);

    const response = await axios.post(
      `${API_URL}/api/forms/generate-from-image`,
      formData,
      {
        headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  // 🎯 Smart generation with UI noise filtering
  smartGenerateFromImage: async (formImage: File) => {
    const formData = new FormData();
    formData.append("formImage", formImage);

    const response = await axios.post(
      `${API_URL}/api/forms/smart-generate-from-image`,
      formData,
      {
        headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  generateFromText: async (pastedText: string) => {
    const response = await axios.post(
      `${API_URL}/api/forms/generate-from-text`,
      { pastedText },
      { headers: getAuthHeaders() },
    );
    return response.data;
  },

  getUserForms: async (status?: string) => {
    const response = await axios.get(`${API_URL}/api/forms`, {
      headers: getAuthHeaders(),
      params: { status },
    });
    return response.data;
  },

  getFormById: async (formId: string) => {
    const response = await axios.get(`${API_URL}/api/forms/${formId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  updateForm: async (formId: string, updates: any) => {
    const response = await axios.put(
      `${API_URL}/api/forms/${formId}`,
      updates,
      { headers: getAuthHeaders() },
    );
    return response.data;
  },

  deleteForm: async (formId: string) => {
    const response = await axios.delete(`${API_URL}/api/forms/${formId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  submitForm: async (formId: string, submittedData: any, notes?: string) => {
    const formData = new FormData();
    
    const plainData: Record<string, any> = {};
    
    Object.entries(submittedData).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        plainData[key] = value;
      }
    });
    
    formData.append("submittedData", JSON.stringify(plainData));
    if (notes) formData.append("notes", notes);
    
    const response = await axios.post(
      `${API_URL}/api/forms/${formId}/submit`,
      formData,
      { 
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  getFormSubmissions: async (
    formId: string,
    startDate?: string,
    endDate?: string,
  ) => {
    const response = await axios.get(
      `${API_URL}/api/forms/${formId}/submissions`,
      {
        headers: getAuthHeaders(),
        params: { startDate, endDate },
      },
    );
    return response.data;
  },

  getAllSubmissions: async (
    period?: string,
    startDate?: string,
    endDate?: string,
  ) => {
    const response = await axios.get(`${API_URL}/api/forms/submissions/all`, {
      headers: getAuthHeaders(),
      params: { period, startDate, endDate },
    });
    return response.data;
  },

  deleteSubmission: async (submissionId: string) => {
    const response = await axios.delete(
      `${API_URL}/api/forms/submissions/${submissionId}`,
      { headers: getAuthHeaders() },
    );
    return response.data;
  },

  updateSubmission: async (
    submissionId: string,
    submittedData: any,
    notes?: string,
    status?: string,
  ) => {
    const formData = new FormData();

    const plainData: Record<string, any> = {};

    Object.entries(submittedData).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        plainData[key] = value;
      }
    });

    formData.append("submittedData", JSON.stringify(plainData));
    if (notes) formData.append("notes", notes);
    if (status) formData.append("status", status);

    const response = await axios.put(
      `${API_URL}/api/forms/submissions/${submissionId}`,
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  getFieldAlternatives: async (
    fieldLabel: string,
    vaultMappingKey?: string,
  ) => {
    const response = await axios.post(
      `${API_URL}/api/forms/alternatives`,
      { fieldLabel, vaultMappingKey },
      { headers: getAuthHeaders() },
    );
    return response.data;
  },

  // 🤖 AI Guidance methods
  getFieldGuidance: async (
    fieldLabel: string,
    fieldType?: string,
    filledFields?: Record<string, any>
  ) => {
    const response = await axios.post(
      `${API_URL}/api/forms/field-guidance`,
      { fieldLabel, fieldType, filledFields },
      { headers: getAuthHeaders() },
    );
    return response.data;
  },

  getBatchGuidance: async (fields: Array<{ label: string; type: string }>) => {
    const response = await axios.post(
      `${API_URL}/api/forms/batch-guidance`,
      { fields },
      { headers: getAuthHeaders() },
    );
    return response.data;
  },
};

export const statsService = {
  getQuickStats: async () => {
    const response = await axios.get(`${API_URL}/api/stats/quick`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};
