import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface FormField {
  label: string;
  fieldType: string;
  vaultMappingKey?: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  validation?: any;
  order?: number;
  vaultValue?: any;
  mappingStatus?: string;
  alternatives?: any[];
}

interface DynamicFormRendererProps {
  fields: FormField[];
  formData: { [key: string]: any };
  onChange: (label: string, value: any) => void;
  onAlternativeRequest?: (label: string, vaultMappingKey?: string) => void;
  errors?: { [key: string]: string };
}

export default function DynamicFormRenderer({
  fields,
  formData,
  onChange,
  onAlternativeRequest,
  errors = {},
}: DynamicFormRendererProps) {
  const sortedFields = [...fields].sort(
    (a, b) => (a.order || 0) - (b.order || 0),
  );

  const renderField = (field: FormField) => {
    const value = formData[field.label] || "";
    const error = errors[field.label];
    const hasAlternatives = field.alternatives && field.alternatives.length > 0;

    const baseInputClasses = `w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
      error ? "border-red-400 bg-red-50 focus:ring-red-300 focus:bg-white" : "border-slate-300 bg-slate-50 hover:border-slate-400 focus:ring-blue-500 focus:bg-white"
    } ${
      field.vaultValue ? "bg-green-50 border-green-300 focus:ring-green-300" : ""
    }`;

    const renderInput = () => {
      switch (field.fieldType) {
        case "text":
        case "email":
        case "phone":
        case "number":
        case "date":
          return (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(field.label, e.target.value)}
              placeholder={field.placeholder || field.label}
              required={field.required}
              className={baseInputClasses}
            />
          );

        case "textarea":
          return (
            <textarea
              value={value}
              onChange={(e) => onChange(field.label, e.target.value)}
              placeholder={field.placeholder || field.label}
              required={field.required}
              rows={4}
              className={baseInputClasses}
            />
          );

        case "dropdown":
          return (
            <select
              value={value}
              onChange={(e) => onChange(field.label, e.target.value)}
              required={field.required}
              className={baseInputClasses}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );

        case "radio":
          return (
            <div className="space-y-2">
              {field.options?.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={field.label}
                    value={option}
                    checked={value === option}
                    onChange={(e) => onChange(field.label, e.target.value)}
                    required={field.required}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          );

        case "checkbox":
          return (
            <div className="space-y-2">
              {field.options?.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    value={option}
                    checked={Array.isArray(value) && value.includes(option)}
                    onChange={(e) => {
                      const currentValue = Array.isArray(value) ? value : [];
                      const newValue = e.target.checked
                        ? [...currentValue, option]
                        : currentValue.filter((v) => v !== option);
                      onChange(field.label, newValue);
                    }}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          );

        case "file":
          return (
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                onChange(field.label, file);
              }}
              required={field.required}
              className={baseInputClasses}
            />
          );

        default:
          return (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(field.label, e.target.value)}
              placeholder={field.placeholder || field.label}
              required={field.required}
              className={baseInputClasses}
            />
          );
      }
    };

    return (
      <div key={field.label} className="mb-6">
        <label className="block text-sm font-bold text-slate-800 mb-2.5">
          {field.label}
          {field.required && <span className="text-red-500 ml-1.5 text-base">*</span>}
          {field.vaultValue && (
            <span className="ml-3 text-xs font-semibold text-green-700 bg-green-100 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-sm border border-green-200">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Auto-filled
            </span>
          )}
        </label>

        {renderInput()}

        {error && (
          <p className="text-red-700 text-sm mt-2.5 flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg border border-red-200 animate-fade-in">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{error}</span>
          </p>
        )}

        {hasAlternatives && onAlternativeRequest && (
          <button
            type="button"
            onClick={() =>
              onAlternativeRequest(field.label, field.vaultMappingKey)
            }
            className="mt-3 text-sm text-blue-700 hover:text-blue-800 hover:bg-blue-50 flex items-center gap-1.5 font-semibold px-3 py-2 rounded-lg border border-blue-200 bg-blue-50/50 transition-all duration-200 hover:shadow-md"
          >
            <ChevronDown className="w-4 h-4" />
            Show {field.alternatives?.length} alternative value{field.alternatives?.length !== 1 ? 's' : ''} from vault
          </button>
        )}

        {field.mappingStatus === "MULTIPLE_MATCHES" && (
          <div className="flex items-start gap-2.5 mt-3 text-sm text-amber-800 bg-amber-50 px-4 py-3 rounded-lg border border-amber-300 shadow-sm animate-fade-in">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">Multiple matches found. Best match auto-selected.</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {sortedFields.map((field) => renderField(field))}
    </div>
  );
}
