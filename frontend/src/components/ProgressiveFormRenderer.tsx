import { useState, useCallback, useMemo } from "react";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver";
import { SectionSkeleton } from "./SkeletonLoader";
import DynamicFormRenderer from "./DynamicFormRenderer";

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

interface ProgressiveFormRendererProps {
  fields: FormField[];
  formData: { [key: string]: any };
  onChange: (label: string, value: any) => void;
  onAlternativeRequest?: (label: string, vaultMappingKey?: string) => void;
  errors?: { [key: string]: string };
  fieldsPerSection?: number;
}

export default function ProgressiveFormRenderer({
  fields,
  formData,
  onChange,
  onAlternativeRequest,
  errors = {},
  fieldsPerSection = 5,
}: ProgressiveFormRendererProps) {
  const [visibleSections, setVisibleSections] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Split fields into sections
  const sections = useMemo(() => {
    const result = [];
    for (let i = 0; i < fields.length; i += fieldsPerSection) {
      result.push(fields.slice(i, i + fieldsPerSection));
    }
    return result;
  }, [fields, fieldsPerSection]);

  const loadMore = useCallback(() => {
    if (visibleSections < sections.length) {
      setIsLoading(true);
      setTimeout(() => {
        setVisibleSections((prev) => prev + 1);
        setIsLoading(false);
      }, 300); // Simulate loading delay for smooth UX
    }
  }, [visibleSections, sections.length]);

  const loadMoreRef = useIntersectionObserver(loadMore, {
    threshold: 0.1,
    rootMargin: "100px",
  });

  // Calculate progress
  const totalFields = fields.length;
  const filledFields = Object.keys(formData).filter(
    (key) => formData[key] && formData[key] !== ""
  ).length;
  const progress = totalFields > 0 ? (filledFields / totalFields) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">
            Form Progress
          </span>
          <span className="text-sm font-bold text-blue-600">
            {filledFields} / {totalFields} fields
          </span>
        </div>
        <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-500 text-right">
          {progress.toFixed(0)}% complete
        </div>
      </div>

      {/* Render visible sections with fade-in animation */}
      {sections.slice(0, visibleSections).map((sectionFields, idx) => (
        <div
          key={idx}
          className="animate-fade-in-up bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300"
          style={{ animationDelay: `${idx * 0.1}s` }}
        >
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                Section {idx + 1} of {sections.length}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {sectionFields.length} fields in this section
              </p>
            </div>
            <div className="flex items-center gap-2">
              {sectionFields.every(
                (field) => formData[field.label] && formData[field.label] !== ""
              ) && (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Complete
                </div>
              )}
            </div>
          </div>

          {/* Section Fields */}
          <DynamicFormRenderer
            fields={sectionFields}
            formData={formData}
            onChange={onChange}
            onAlternativeRequest={onAlternativeRequest}
            errors={errors}
          />
        </div>
      ))}

      {/* Loading trigger & skeleton */}
      {visibleSections < sections.length && (
        <div ref={loadMoreRef}>
          {isLoading ? (
            <SectionSkeleton />
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 text-slate-500 text-sm">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                Scroll to load more sections
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completion Message */}
      {visibleSections >= sections.length && progress === 100 && (
        <div className="animate-fade-in bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-lg p-6 text-white text-center">
          <svg
            className="w-16 h-16 mx-auto mb-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="text-2xl font-bold mb-2">All fields completed!</h3>
          <p className="text-green-100">
            Review your information and submit the form
          </p>
        </div>
      )}
    </div>
  );
}
