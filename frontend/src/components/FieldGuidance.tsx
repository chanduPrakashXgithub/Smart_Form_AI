import { useState, useEffect } from 'react';
import { formService } from '../services/api';
import { Lightbulb, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface FieldGuidanceProps {
  fieldLabel: string;
  fieldType: string;
  show: boolean;
  onClose?: () => void;
  filledFields?: Record<string, any>;
}

interface GuidanceData {
  fieldLabel: string;
  fieldType: string;
  guidance: {
    meaning: string;
    example: string;
    validationTip: string;
    format: string;
  };
  vaultSuggestion: string | null;
  vaultConfidence: number;
  autoFill: boolean;
  source: string;
  contextHints?: string[];
}

export default function FieldGuidance({
  fieldLabel,
  fieldType,
  show,
  onClose,
  filledFields = {},
}: FieldGuidanceProps) {
  const [guidance, setGuidance] = useState<GuidanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show && fieldLabel) {
      fetchGuidance();
    }
  }, [show, fieldLabel]);

  const fetchGuidance = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await formService.getFieldGuidance(
        fieldLabel,
        fieldType,
        filledFields
      );

      setGuidance(response.guidance);
    } catch (err: any) {
      console.error('Error fetching guidance:', err);
      setError('Failed to fetch guidance');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-xl shadow-2xl border border-blue-100 z-50 animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center space-x-2 text-white">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-semibold">AI Field Assistant</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Getting guidance...</span>
          </div>
        ) : error ? (
          <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        ) : guidance ? (
          <div className="space-y-4">
            {/* Field Label */}
            <div className="border-b pb-2">
              <span className="text-sm text-gray-500">Field:</span>
              <h4 className="text-lg font-semibold text-gray-800">{guidance.fieldLabel}</h4>
            </div>

            {/* Vault Suggestion (if available) */}
            {guidance.vaultSuggestion && (
              <div className={`p-3 rounded-lg ${
                guidance.autoFill 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-start">
                  <CheckCircle className={`w-5 h-5 mt-0.5 mr-2 ${
                    guidance.autoFill ? 'text-green-600' : 'text-yellow-600'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {guidance.autoFill ? '✨ Auto-filled from Vault' : '💡 Suggested from Vault'}
                    </p>
                    <p className="text-sm mt-1 font-mono bg-white px-2 py-1 rounded border">
                      {guidance.vaultSuggestion}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Confidence: {guidance.vaultConfidence}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Field Meaning */}
            <div className="space-y-2">
              <div className="flex items-start">
                <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-gray-800 text-sm">What this field means:</h5>
                  <p className="text-gray-700 text-sm mt-1">{guidance.guidance.meaning}</p>
                </div>
              </div>
            </div>

            {/* Example */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <h5 className="font-medium text-gray-800 text-sm mb-1">📝 Example:</h5>
              <p className="text-blue-800 font-mono text-sm">{guidance.guidance.example}</p>
            </div>

            {/* Validation Tip */}
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <h5 className="font-medium text-gray-800 text-sm mb-1">⚠️ Important:</h5>
              <p className="text-amber-800 text-sm">{guidance.guidance.validationTip}</p>
            </div>

            {/* Context Hints (if available) */}
            {guidance.contextHints && guidance.contextHints.length > 0 && (
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <h5 className="font-medium text-purple-800 text-sm mb-2">💭 Based on your form:</h5>
                <ul className="space-y-1">
                  {guidance.contextHints.map((hint, idx) => (
                    <li key={idx} className="text-purple-700 text-sm flex items-start">
                      <span className="mr-2">•</span>
                      <span>{hint}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Source badge */}
            <div className="text-xs text-gray-500 text-center pt-2 border-t">
              Powered by {guidance.source === 'ai' ? 'Gemini AI' : 'Smart Templates'}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
