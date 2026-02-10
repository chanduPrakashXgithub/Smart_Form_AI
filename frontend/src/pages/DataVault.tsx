import { useState, useEffect } from "react";
import { vaultService } from "../services/api";
import { ChevronDown, Edit2, Trash2, Plus, Database, ArrowLeft, Shield } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import EditFieldModal from "../components/EditFieldModal";
import AddFieldModal from "../components/AddFieldModal";
import ConfirmationDialog from "../components/ConfirmationDialog";
import "../styles/animations.css";

export default function DataVault() {
  const navigate = useNavigate();
  const [sections, setSections] = useState<any[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [sectionsLoaded, setSectionsLoaded] = useState(false);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<any>(null);

  // Add Field Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<any>(null);

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: "deleteField" | "deleteSection" | null;
    fieldId?: string;
    sectionId?: string;
    fieldName?: string;
    sectionType?: string;
  }>({
    isOpen: false,
    type: null,
  });

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const data = await vaultService.getVaultSections();
      setSections(data.sections);
      setTimeout(() => setSectionsLoaded(true), 100);
    } catch (error) {
      toast.error("Failed to fetch vault sections");
    } finally {
      setLoading(false);
    }
  };

  // ==================== EDIT FIELD ====================
  const handleEditField = (field: any) => {
    setSelectedField(field);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (
    fieldId: string,
    fieldName: string,
    fieldValue: string,
  ) => {
    try {
      setActionLoading(true);
      await vaultService.updateField(fieldId, fieldValue, 100);

      // Update local state
      setSections(
        sections.map((section) => ({
          ...section,
          fields: section.fields?.map((field: any) =>
            field._id === fieldId ? { ...field, fieldName, fieldValue } : field,
          ),
        })),
      );

      toast.success("Field updated successfully");
      setEditModalOpen(false);
      setSelectedField(null);
    } catch (error) {
      toast.error("Failed to update field");
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== DELETE FIELD ====================
  const handleDeleteFieldClick = (field: any) => {
    setConfirmDialog({
      isOpen: true,
      type: "deleteField",
      fieldId: field._id,
      fieldName: field.fieldName,
    });
  };

  const handleConfirmDeleteField = async () => {
    if (!confirmDialog.fieldId) return;

    try {
      setActionLoading(true);
      await vaultService.deleteField(confirmDialog.fieldId);

      // Update local state
      setSections(
        sections.map((section) => ({
          ...section,
          fields: section.fields?.filter(
            (field: any) => field._id !== confirmDialog.fieldId,
          ),
        })),
      );

      toast.success("Field deleted successfully");
      setConfirmDialog({ isOpen: false, type: null });
    } catch (error) {
      toast.error("Failed to delete field");
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== ADD FIELD ====================
  const handleAddFieldClick = (section: any) => {
    setSelectedSection(section);
    setAddModalOpen(true);
  };

  const handleSaveAddField = async (
    sectionType: string,
    fieldName: string,
    fieldValue: string,
  ) => {
    try {
      setActionLoading(true);
      const response = await vaultService.addField(
        sectionType,
        fieldName,
        fieldValue,
      );

      // Update local state
      setSections(
        sections.map((section) =>
          section._id === selectedSection._id
            ? {
                ...section,
                fields: [...(section.fields || []), response.field],
              }
            : section,
        ),
      );

      toast.success("Field added successfully");
      setAddModalOpen(false);
      setSelectedSection(null);
    } catch (error) {
      toast.error("Failed to add field");
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  // ==================== DELETE SECTION ====================
  const handleDeleteSectionClick = (section: any) => {
    setConfirmDialog({
      isOpen: true,
      type: "deleteSection",
      sectionId: section._id,
      sectionType: section.sectionType,
    });
  };

  const handleConfirmDeleteSection = async () => {
    if (!confirmDialog.sectionId) return;

    try {
      setActionLoading(true);
      await vaultService.deleteSection(confirmDialog.sectionId);

      // Update local state
      setSections(sections.filter((s) => s._id !== confirmDialog.sectionId));

      toast.success("Section and all its fields deleted successfully");
      setConfirmDialog({ isOpen: false, type: null });
      setExpandedSection(null);
    } catch (error) {
      toast.error("Failed to delete section");
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const renderConfirmationDialog = () => {
    if (confirmDialog.type === "deleteField") {
      return (
        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          title="Delete Field"
          message={`Are you sure you want to delete "${confirmDialog.fieldName}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          isDangerous={true}
          isLoading={actionLoading}
          onConfirm={handleConfirmDeleteField}
          onCancel={() => setConfirmDialog({ isOpen: false, type: null })}
        />
      );
    }

    if (confirmDialog.type === "deleteSection") {
      return (
        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          title="Delete Section"
          message={`This will delete all fields in "${confirmDialog.sectionType}" section. This action cannot be undone. Continue?`}
          confirmText="Delete Section"
          cancelText="Cancel"
          isDangerous={true}
          isLoading={actionLoading}
          onConfirm={handleConfirmDeleteSection}
          onCancel={() => setConfirmDialog({ isOpen: false, type: null })}
        />
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block p-4 bg-white rounded-2xl shadow-sm mb-4">
            <svg className="animate-spin h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-slate-600 font-medium">Loading vault sections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Data Vault</h1>
                </div>
                <p className="text-sm text-slate-600 ml-12">Manage your stored documents and fields securely</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">{sections.length} Sections</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6">

        {sections.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Database className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No vault sections found</h3>
            <p className="text-slate-600 mb-6">Start by uploading a document to populate your data vault</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-800">{sections.reduce((acc, s) => acc + (s.fields?.length || 0), 0)}</span> total fields across <span className="font-semibold text-slate-800">{sections.length}</span> sections
              </p>
            </div>
            <div className="space-y-4">
            {sections.map((section: any, index: number) => (
              <div key={section._id} className={`bg-white rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 ${sectionsLoaded ? 'fade-in-up' : 'opacity-0'}`} style={{ animationDelay: `${index * 50}ms` }}>
                <div className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <button
                    onClick={() =>
                      setExpandedSection(
                        expandedSection === section._id ? null : section._id,
                      )
                    }
                    className="flex-1 text-left"
                  >
                    <h3 className="text-base sm:text-lg font-bold text-slate-800">{section.sectionType}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      {section.fields?.length || 0} fields
                    </p>
                  </button>
                  <div className="flex gap-1 sm:gap-2 ml-4">
                    <button
                      onClick={() => handleDeleteSectionClick(section)}
                      disabled={actionLoading}
                      className="p-2 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors"
                      title="Delete section"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                    </button>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-600 transition-transform duration-200 ${
                        expandedSection === section._id ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>

                {expandedSection === section._id && (
                  <div className="border-t border-slate-200 p-4 space-y-3">
                    {section.fields && section.fields.length > 0 ? (
                      <>
                        {section.fields.map((field: any) => (
                          <div
                            key={field._id}
                            className="flex flex-col sm:flex-row sm:justify-between sm:items-start p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex-1 mb-3 sm:mb-0">
                              <p className="font-medium text-slate-800 text-sm sm:text-base">{field.fieldName}</p>
                              <p className="text-sm text-slate-600 break-words mt-1">
                                {field.fieldValue}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {field.extractedFrom === "MANUAL"
                                  ? "Manually added"
                                  : `From ${field.extractedFrom}`}
                              </p>
                            </div>
                            <div className="flex gap-2 self-end sm:self-auto sm:ml-4">
                              <button
                                onClick={() => handleEditField(field)}
                                disabled={actionLoading}
                                className="p-2 hover:bg-slate-200 rounded-lg disabled:opacity-50 transition-colors"
                                title="Edit field"
                              >
                                <Edit2 className="w-4 h-4 text-blue-600" />
                              </button>
                              <button
                                onClick={() => handleDeleteFieldClick(field)}
                                disabled={actionLoading}
                                className="p-2 hover:bg-slate-200 rounded-lg disabled:opacity-50 transition-colors"
                                title="Delete field"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="text-slate-500 text-sm py-4 text-center">
                        No fields in this section
                      </p>
                    )}

                    <button
                      onClick={() => handleAddFieldClick(section)}
                      disabled={actionLoading}
                      className="w-full mt-4 py-2.5 border-2 border-dashed border-green-400 text-green-600 rounded-lg hover:bg-green-50 flex items-center justify-center gap-2 disabled:opacity-50 transition-all font-medium text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Field Manually
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          </>
        )}
      </div>

      {/* Modals */}
      <EditFieldModal
        isOpen={editModalOpen}
        field={selectedField}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedField(null);
        }}
        onSave={handleSaveEdit}
        isLoading={actionLoading}
      />

      <AddFieldModal
        isOpen={addModalOpen}
        sectionType={selectedSection?.sectionType || ""}
        onClose={() => {
          setAddModalOpen(false);
          setSelectedSection(null);
        }}
        onSave={handleSaveAddField}
        isLoading={actionLoading}
      />

      {/* Confirmation Dialogs */}
      {renderConfirmationDialog()}
    </div>
  );
}
