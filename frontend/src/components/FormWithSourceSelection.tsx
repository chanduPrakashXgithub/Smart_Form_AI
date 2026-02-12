import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FieldWithSourceSelection from './FieldWithSourceSelection';
import { AlertCircle, Loader } from 'lucide-react';

interface FieldData {
  formField: string;
  current: {
    value: string;
    source: string;
    confidence: number;
  } | null;
  alternatives: Array<{
    value: string;
    source: string;
    confidence: number;
    id: string;
  }>;
  totalSources: number;
  status: 'filled' | 'missing';
  userCanOverride: boolean;
}

interface FormWithSourceSelectionProps {
  formFields: string[];
  onSubmit?: (data: Record<string, any>) => void;
  onCancel?: () => void;
}

export default function FormWithSourceSelection({
  formFields,
  onSubmit,
  onCancel,
}: FormWithSourceSelectionProps) {
  const [fieldsData, setFieldsData] = useState<FieldData[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, { value: string; source: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);

  // 1️⃣ AUTO-FILL WITH ALTERNATIVES ON MOUNT
  useEffect(() => {
    autoFillWithSelection();
  }, [formFields]);

  async function autoFillWithSelection() {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please login first.');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/autofill/with-selection`,
        { formFields },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Auto-fill complete with alternatives:', response.data);
      setFieldsData(response.data.fields);
      setSummary(response.data.summary);

      // Initialize selected variants with current values
      const initial: Record<string, { value: string; source: string }> = {};
      response.data.fields.forEach((field: FieldData) => {
        if (field.current) {
          initial[field.formField] = {
            value: field.current.value,
            source: field.current.source,
          };
        }
      });
      setSelectedVariants(initial);
    } catch (err: any) {
      console.error('❌ Auto-fill error:', err);
      setError(
        err.response?.data?.error ||
        'Failed to auto-fill form. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  // 2️⃣ USER CHANGES FIELD SOURCE
  async function changeFieldSource(
    fieldName: string,
    newValue: string,
    newSource: string
  ) {
    try {
      const token = localStorage.getItem('token');

      // Track this selection in backend
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/autofill/select-variant`,
        {
          fieldName,
          selectedValue: newValue,
          selectedSource: newSource,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Update UI
      setSelectedVariants((prev) => ({
        ...prev,
        [fieldName]: {
          value: newValue,
          source: newSource,
        },
      }));

      console.log(`✅ Changed ${fieldName} to ${newSource}`);
    } catch (err: any) {
      console.error('Error changing source:', err);
      setError('Failed to change field source. Please try again.');
    }
  }

  // 3️⃣ HANDLE FORM SUBMISSION
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Compile form data with selected values
    const formData: Record<string, string> = {};
    Object.entries(selectedVariants).forEach(([fieldName, fieldData]) => {
      formData[fieldName] = fieldData.value;
    });

    console.log('📤 Submitting form with data:', formData);

    if (onSubmit) {
      onSubmit(formData);
    }
  }

  // LOADING STATE
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Auto-filling your form...</p>
          <p className="text-gray-500 text-sm mt-2">
            Retrieving data from your vault
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Smart Form Auto-Fill
          </h1>
          <p className="text-gray-600">
            Your form has been auto-filled with data from your vault. Click any
            field to see alternatives.
          </p>
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* SUMMARY */}
        {summary && (
          <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-indigo-600">
                  {summary.filled}
                </p>
                <p className="text-gray-600 text-sm">Filled</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-400">
                  {summary.missing}
                </p>
                <p className="text-gray-600 text-sm">Missing</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {summary.fieldsWithAlternatives}
                </p>
                <p className="text-gray-600 text-sm">Alternatives</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(
                    (summary.filled / summary.total) * 100
                  )}%
                </p>
                <p className="text-gray-600 text-sm">Success</p>
              </div>
            </div>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {fieldsData.map((field) => (
            <FieldWithSourceSelection
              key={field.formField}
              field={field}
              currentValue={selectedVariants[field.formField]}
              onChangeVariant={(value, source) =>
                changeFieldSource(field.formField, value, source)
              }
            />
          ))}

          {/* ACTION BUTTONS */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-lg hover:shadow-xl"
            >
              ✓ Submit Form
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition duration-200"
              >
                ✕ Cancel
              </button>
            )}
          </div>
        </form>

        {/* FOOTER */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>💡 Tip: Click on any field to see alternatives from other documents</p>
        </div>
      </div>
    </div>
  );
}
