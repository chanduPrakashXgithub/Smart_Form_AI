import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { FileUp, BarChart3, Settings, LogOut, FileText } from "lucide-react";
import DocumentUploadModal from "../components/DocumentUploadModal";
import { Link } from "react-router-dom";
import { statsService } from "../services/api";
import "../styles/animations.css";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [stats, setStats] = useState({
    documentsUploaded: 0,
    fieldsExtracted: 0,
    autofillsUsed: 0,
  });

  const [cardsLoaded, setCardsLoaded] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await statsService.getQuickStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };
    fetchStats();
    
    // Trigger animations with stagger
    setTimeout(() => setCardsLoaded(true), 100);
    setTimeout(() => setStatsLoaded(true), 600);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                VisionForm Assist
              </h1>
              <p className="text-slate-600 text-sm mt-1">Welcome back, <span className="font-semibold">{user?.fullName}</span></p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition shadow-sm self-start sm:self-auto"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Upload Card */}
          <div className={`bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-200 p-6 hover:scale-[1.02] transition-all duration-300 ${cardsLoaded ? 'fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0ms' }}>
            <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
              <FileUp className="w-7 h-7 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Upload Documents</h2>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Upload Aadhaar, PAN, Passport, and education certificates
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-medium shadow-sm"
            >
              Upload Now
            </button>
          </div>

          {/* Vault Card */}
          <Link to="/vault" className="block">
            <div className={`bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-200 p-6 hover:scale-[1.02] transition-all duration-300 h-full ${cardsLoaded ? 'fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '150ms' }}>
              <div className="bg-green-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <FileUp className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-2">Data Vault</h2>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                View and manage your stored documents and fields
              </p>
              <button className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transition font-medium shadow-sm">
                Open Vault
              </button>
            </div>
          </Link>

          {/* Form Assistant Card */}
          <Link to="/form-assist" className="block">
            <div className={`bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-200 p-6 hover:scale-[1.02] transition-all duration-300 h-full ${cardsLoaded ? 'fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '300ms' }}>
              <div className="bg-purple-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-7 h-7 text-purple-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-2">Form Assistant</h2>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                Get intelligent suggestions when filling forms
              </p>
              <button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2.5 rounded-lg hover:from-purple-700 hover:to-purple-800 transition font-medium shadow-sm">
                Use Assistant
              </button>
            </div>
          </Link>

          {/* Form Builder Card */}
          <Link to="/form-builder" className="block">
            <div className={`bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-200 p-6 hover:scale-[1.02] transition-all duration-300 h-full ${cardsLoaded ? 'fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '450ms' }}>
              <div className="bg-orange-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-orange-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-2">Form Builder</h2>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                AI-powered dynamic form generation and auto-fill
              </p>
              <button className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-2.5 rounded-lg hover:from-orange-700 hover:to-orange-800 transition font-medium shadow-sm">
                Create Form
              </button>
            </div>
          </Link>
        </div>

        {/* Statistics */}
        <div className={`mt-6 md:mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${statsLoaded ? 'fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0ms' }}>
          <h3 className="text-xl font-bold text-slate-800 mb-6">Quick Stats</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">{stats.documentsUploaded}</div>
              <div className="text-sm text-slate-600 font-medium">Documents Uploaded</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-2">{stats.fieldsExtracted}</div>
              <div className="text-sm text-slate-600 font-medium">Fields Extracted</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <div className="text-3xl sm:text-4xl font-bold text-purple-600 mb-2">{stats.autofillsUsed}</div>
              <div className="text-sm text-slate-600 font-medium">Autofills Used</div>
            </div>
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <DocumentUploadModal onClose={() => setShowUploadModal(false)} />
      )}
    </div>
  );
}
