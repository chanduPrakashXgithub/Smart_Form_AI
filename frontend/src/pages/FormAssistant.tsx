import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Brain,
  Filter,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  Database,
  Zap,
  Shield,
} from "lucide-react";

export default function FormAssistant() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Filter className="w-8 h-8 text-purple-600" />,
      title: "Smart Field Detection",
      description:
        "Automatically filters out UI noise like 'Submit', 'Choose File', 'No file chosen', and detects only real form fields.",
      badge: "AI-Powered",
      color: "purple",
    },
    {
      icon: <Lightbulb className="w-8 h-8 text-blue-600" />,
      title: "Real-Time AI Guidance",
      description:
        "Get intelligent guidance while filling forms. AI explains what each field means, provides examples, and warns about format requirements.",
      badge: "Smart Assistant",
      color: "blue",
    },
    {
      icon: <Database className="w-8 h-8 text-green-600" />,
      title: "Smart Auto-Fill",
      description:
        "Automatically fills form fields from your vault with confidence scoring. Auto-fills at 85%+ confidence, suggests at 50-85%.",
      badge: "Intelligent",
      color: "green",
    },
    {
      icon: <Brain className="w-8 h-8 text-pink-600" />,
      title: "Context-Aware Suggestions",
      description:
        "AI learns from your previous fields to suggest similar formats. If you filled '10th Percentage', it guides you for '12th Percentage'.",
      badge: "Learning AI",
      color: "pink",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Upload Form Image",
      description:
        "Take a screenshot or photo of any form you need to fill",
      icon: <ArrowRight className="w-5 h-5" />,
    },
    {
      step: "2",
      title: "Smart Detection",
      description:
        "AI filters UI noise and extracts only real form fields",
      icon: <ArrowRight className="w-5 h-5" />,
    },
    {
      step: "3",
      title: "Auto-Fill from Vault",
      description:
        "System automatically maps and fills fields from your documents",
      icon: <ArrowRight className="w-5 h-5" />,
    },
    {
      step: "4",
      title: "AI Guidance",
      description:
        "Click help icon on any field to get intelligent filling guidance",
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    },
  ];

  const technicalDetails = [
    {
      title: "Field Detection Rules",
      items: [
        "✅ Extracts: Name, Email, Phone, CGPA, Roll Number, etc.",
        "❌ Ignores: Submit, Cancel, Choose File, No file chosen",
        "❌ Filters: Progress bars, section numbers, decorative labels",
        "🎯 Confidence Threshold: 70%+ only",
      ],
    },
    {
      title: "AI Guidance Features",
      items: [
        "💡 Explains field meaning and purpose",
        "📝 Provides realistic examples (Indian context)",
        "⚠️ Warns about format requirements",
        "💎 Suggests values from your vault",
      ],
    },
    {
      title: "Intelligence Levels",
      items: [
        "🟢 85%+ Confidence: Auto-fill automatically",
        "🟡 50-85% Confidence: Suggest with confirmation",
        "🔴 Below 50%: Ask user manually",
        "🧠 Context-aware: Learns from filled fields",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-semibold">AI-Powered Form Assistant</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Smart Form Filling
              <br />
              <span className="text-yellow-300">Made Effortless</span>
            </h1>
            
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Industry-level AI system that understands forms, filters noise, and guides you through every field with intelligent suggestions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/form-builder")}
                className="px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-blue-50 font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Try Form Builder
              </button>
              <button
                onClick={() => navigate("/vault")}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 font-bold text-lg border-2 border-white/30 hover:border-white/50 transition-all flex items-center justify-center gap-2"
              >
                <Database className="w-5 h-5" />
                Manage Vault
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Powerful AI Features
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Built with cutting-edge AI to solve real-world form filling problems
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 bg-${feature.color}-50 rounded-xl`}>
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-slate-800">
                      {feature.title}
                    </h3>
                    <span className={`text-xs font-semibold px-3 py-1 bg-${feature.color}-100 text-${feature.color}-700 rounded-full`}>
                      {feature.badge}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4">
                    {step.step}
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {step.description}
                  </p>
                </div>
                {idx < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-slate-300">
                    {step.icon}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Technical Details */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">
            Technical Intelligence
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {technicalDetails.map((detail, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
              >
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  {detail.title}
                </h3>
                <ul className="space-y-2">
                  {detail.items.map((item, itemIdx) => (
                    <li
                      key={itemIdx}
                      className="text-sm text-slate-700 leading-relaxed font-mono bg-slate-50 px-3 py-2 rounded-lg"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-2xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Experience Smart Form Filling?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Upload your first form and watch AI magic happen
          </p>
          <button
            onClick={() => navigate("/form-builder")}
            className="px-10 py-5 bg-white text-blue-600 rounded-xl hover:bg-blue-50 font-bold text-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 inline-flex items-center gap-3"
          >
            <Sparkles className="w-6 h-6" />
            Start Building Forms
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
