import { useState } from "react";
import { formService } from "../services/api";
import { toast } from "sonner";
import { Upload, FileText, Send, Loader2, Eye, Sparkles } from "lucide-react";
import ProgressiveFormRenderer from "../components/ProgressiveFormRenderer";
import { useNavigate } from "react-router-dom";

export default function FormBuilder() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"image" | "text">("image");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Text paste state
  const [pastedText, setPastedText] = useState("");

  // Generated form state
  const [generatedForm, setGeneratedForm] = useState<any>(null);
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Alternative values modal
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternativesField, setAlternativesField] = useState<string>("");
  const [alternatives, setAlternatives] = useState<any[]>([]);

  // Drag and drop state
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  const processImageFile = (file: File) => {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        processImageFile(file);
      } else {
        toast.error("Please drop an image file");
      }
    }
  };

  const handleGenerateFromImage = async () => {
    if (!selectedImage) {
      toast.error("Please select an image");
      return;
    }

    try {
      setLoading(true);
      const result = await formService.generateFromImage(selectedImage);

      setGeneratedForm(result.form);

      // Auto-fill form data with vault values
      const initialData: { [key: string]: any } = {};
      result.mappedFields?.forEach((field: any) => {
        if (field.vaultValue) {
          initialData[field.label] = field.vaultValue;
        }
      });
      setFormData(initialData);

      toast.success("Form generated successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to generate form");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromText = async () => {
    if (!pastedText.trim()) {
      toast.error("Please paste form text");
      return;
    }

    try {
      setLoading(true);
      const result = await formService.generateFromText(pastedText);

      setGeneratedForm(result.form);

      // Auto-fill form data with vault values
      const initialData: { [key: string]: any } = {};
      result.mappedFields?.forEach((field: any) => {
        if (field.vaultValue) {
          initialData[field.label] = field.vaultValue;
        }
      });
      setFormData(initialData);

      toast.success("Form generated successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to generate form");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (label: string, value: any) => {
    setFormData((prev) => ({ ...prev, [label]: value }));
    // Clear error for this field
    if (formErrors[label]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[label];
        return newErrors;
      });
    }
  };

  const handleShowAlternatives = async (
    label: string,
    vaultMappingKey?: string,
  ) => {
    try {
      const result = await formService.getFieldAlternatives(
        label,
        vaultMappingKey,
      );
      setAlternatives(result.alternatives || []);
      setAlternativesField(label);
      setShowAlternatives(true);
    } catch (error) {
      toast.error("Failed to fetch alternatives");
    }
  };

  const handleSelectAlternative = (value: string) => {
    setFormData((prev) => ({ ...prev, [alternativesField]: value }));
    setShowAlternatives(false);
    toast.success("Value updated");
  };

  const handleSubmitForm = async () => {
    if (!generatedForm) return;

    try {
      setSubmitting(true);
      await formService.submitForm(generatedForm._id, formData);
      toast.success("Form submitted successfully!");

      // Reset form
      setGeneratedForm(null);
      setFormData({});
      setSelectedImage(null);
      setImagePreview(null);
      setPastedText("");
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
        toast.error("Please fix validation errors");
      } else {
        toast.error(error.response?.data?.message || "Failed to submit form");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Dynamic Form Builder</h1>
              <p className="text-sm text-slate-500 mt-1">AI-powered form extraction and auto-fill</p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate("/form-history")}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm text-sm"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">View Submissions</span>
                <span className="sm:hidden">History</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">

        {!generatedForm ? (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex gap-1 bg-slate-50 p-1 border-b border-slate-200">
              <button
                onClick={() => setActiveTab("image")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                  activeTab === "image"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Upload Form Image</span>
                <span className="sm:hidden">Image</span>
              </button>
              <button
                onClick={() => setActiveTab("text")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                  activeTab === "text"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Paste Form Text</span>
                <span className="sm:hidden">Text</span>
              </button>
            </div>

            <div className="p-4 sm:p-6">

            {/* Image Upload Tab */}
            {activeTab === "image" && (
              <div className="space-y-4">
                {!imagePreview ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleImageDrop}
                    className={`border-2 border-dashed rounded-xl p-6 sm:p-12 text-center transition-all ${
                      isDraggingImage
                        ? "border-blue-500 bg-blue-50 scale-[0.98]"
                        : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="form-image-upload"
                    />
                    <label
                      htmlFor="form-image-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        Upload Form Screenshot or Photo
                      </p>
                      <p className="text-sm text-gray-500">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </label>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Selected Image:
                    </p>
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 flex flex-col items-center justify-center"
                      style={{ minHeight: "300px", maxHeight: "400px" }}
                    >
                      <div
                        style={{ overflowY: "auto" }}
                        className="w-full flex items-center justify-center"
                      >
                        <img
                          src={imagePreview}
                          alt="Form preview"
                          className="max-h-80 max-w-full rounded object-contain"
                        />
                      </div>
                      <div className="mt-3 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          id="form-image-upload-2"
                        />
                        <label
                          htmlFor="form-image-upload-2"
                          className="text-xs text-blue-600 hover:underline cursor-pointer"
                        >
                          Change Image
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleGenerateFromImage}
                  disabled={!selectedImage || loading}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700 flex items-center justify-center gap-2 font-medium shadow-lg shadow-blue-500/30 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Generate Form"
                  )}
                </button>
              </div>
            )}

            {/* Text Paste Tab */}
            {activeTab === "text" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paste Form Structure
                  </label>
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`Paste form fields here, for example:

Name:
Date of Birth:
Phone Number:
Email:
Address:
City:
State:
PIN Code:

Or use bullet points:
• Full Name
• Mobile Number
• Aadhaar Number`}
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handleGenerateFromText}
                  disabled={!pastedText.trim() || loading}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700 flex items-center justify-center gap-2 font-medium shadow-lg shadow-blue-500/30 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Generate Form"
                  )}
                </button>
              </div>
            )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Form Preview - Takes 2 columns on large screens */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                    {generatedForm.formName}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {generatedForm.fields.length} fields detected • Auto-fill enabled
                  </p>
                </div>
                <button
                  onClick={() => {
                    setGeneratedForm(null);
                    setFormData({});
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium self-start sm:self-auto"
                >
                  Start Over
                </button>
              </div>

              <form onSubmit={(e) => e.preventDefault()}>
                <ProgressiveFormRenderer
                  fields={generatedForm.fields}
                  formData={formData}
                  onChange={handleFieldChange}
                  onAlternativeRequest={handleShowAlternatives}
                  errors={formErrors}
                  fieldsPerSection={5}
                />

                <button
                  onClick={handleSubmitForm}
                  disabled={submitting}
                  className="sticky bottom-4 w-full mt-6 py-4 bg-gradient-to-r from-green-600 via-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:via-green-700 hover:to-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 font-bold text-lg shadow-2xl shadow-green-500/30 transition-all hover:scale-[1.02] disabled:hover:scale-100"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Form
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Auto-Fill Preview - Sidebar on large screens */}
            <div className="lg:col-span-1 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-100 p-4 sm:p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Auto-Filled Data
              </h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                {generatedForm.fields.map((field: any) => {
                  const value = formData[field.label];
                  return (
                    <div key={field.label} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition">
                      <p className="text-sm font-semibold text-slate-700">
                        {field.label}
                      </p>
                      {value ? (
                        <p className="text-sm text-slate-900 mt-1 flex items-start gap-1">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span className="break-words">{String(value).substring(0, 50)}{String(value).length > 50 ? '...' : ''}</span>
                        </p>
                      ) : (
                        <p className="text-sm text-slate-400 mt-1 italic">Not filled</p>
                      )}
                      {field.vaultValue && (
                        <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          Mapped from {field.mappingType}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alternatives Modal */}
      {showAlternatives && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Alternative Values for <span className="text-blue-600">{alternativesField}</span>
            </h3>
            {alternatives.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                {alternatives.map((alt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectAlternative(alt.value)}
                    className="w-full text-left p-3 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition shadow-sm hover:shadow"
                  >
                    <p className="font-medium text-slate-900">{alt.value}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      From: {alt.source || alt.fieldName}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8 text-sm">
                No alternative values found
              </p>
            )}
            <button
              onClick={() => setShowAlternatives(false)}
              className="w-full mt-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium text-slate-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
