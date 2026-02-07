import { useState, useEffect } from "react";
import { vaultService } from "../services/api";
import { ChevronDown, Edit2, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import EditFieldModal from "../components/EditFieldModal";
import AddFieldModal from "../components/AddFieldModal";
import ConfirmationDialog from "../components/ConfirmationDialog";

export default function DataVault() {
  const [sections, setSections] = useState<any[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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
          fields: section.fields?.map((field) =>
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
            (field) => field._id !== confirmDialog.fieldId,
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading vault sections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Data Vault Management</h1>

        {sections.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              No vault sections found. Start by uploading a document.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((section: any) => (
              <div key={section._id} className="bg-white rounded-lg shadow">
                <div className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <button
                    onClick={() =>
                      setExpandedSection(
                        expandedSection === section._id ? null : section._id,
                      )
                    }
                    className="flex-1 text-left"
                  >
                    <h3 className="text-lg font-bold">{section.sectionType}</h3>
                    <p className="text-sm text-gray-600">
                      {section.fields?.length || 0} fields
                    </p>
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteSectionClick(section)}
                      disabled={actionLoading}
                      className="p-2 hover:bg-red-50 rounded disabled:opacity-50"
                      title="Delete section"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                    <ChevronDown
                      className={`w-5 h-5 transition ${
                        expandedSection === section._id ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>

                {expandedSection === section._id && (
                  <div className="border-t p-4 space-y-3">
                    {section.fields && section.fields.length > 0 ? (
                      <>
                        {section.fields.map((field: any) => (
                          <div
                            key={field._id}
                            className="flex justify-between items-start p-3 bg-slate-50 rounded"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{field.fieldName}</p>
                              <p className="text-sm text-gray-600 break-words">
                                {field.fieldValue}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {field.extractedFrom === "MANUAL"
                                  ? "Manually added"
                                  : `From ${field.extractedFrom}`}
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleEditField(field)}
                                disabled={actionLoading}
                                className="p-1 hover:bg-slate-200 rounded disabled:opacity-50"
                                title="Edit field"
                              >
                                <Edit2 className="w-4 h-4 text-blue-600" />
                              </button>
                              <button
                                onClick={() => handleDeleteFieldClick(field)}
                                disabled={actionLoading}
                                className="p-1 hover:bg-slate-200 rounded disabled:opacity-50"
                                title="Delete field"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        No fields in this section
                      </p>
                    )}

                    <button
                      onClick={() => handleAddFieldClick(section)}
                      disabled={actionLoading}
                      className="w-full mt-4 py-2 border-2 border-dashed border-green-400 text-green-600 rounded-lg hover:bg-green-50 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      Add Field Manually
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
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
