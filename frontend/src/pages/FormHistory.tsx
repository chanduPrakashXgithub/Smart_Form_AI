import { useState, useEffect } from "react";
import { formService } from "../services/api";
import { toast } from "sonner";
import { Calendar, FileText, ChevronLeft, Eye, Trash2, Edit2, Download, File, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FormHistory() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      let result;

      switch (filter) {
        case "today":
        case "week":
        case "month":
          result = await formService.getAllSubmissions(filter);
          break;
        default:
          result = await formService.getAllSubmissions();
      }

      setSubmissions(result.submissions || []);
    } catch (error) {
      toast.error("Failed to fetch submissions");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewSubmission = (submission: any) => {
    setSelectedSubmission(submission);
  };

  const handleDeleteClick = (submission: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSubmissionToDelete(submission);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!submissionToDelete) return;

    try {
      setDeleting(true);
      await formService.deleteSubmission(submissionToDelete._id);
      toast.success("Submission deleted successfully");
      setShowDeleteModal(false);
      setSubmissionToDelete(null);
      fetchSubmissions();
    } catch (error) {
      toast.error("Failed to delete submission");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block p-4 bg-white rounded-2xl shadow-lg mb-4">
            <svg className="animate-spin h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-slate-600 font-medium">Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (selectedSubmission) {
    const submittedEntries =
      selectedSubmission.submittedDataList?.length
        ? selectedSubmission.submittedDataList.map((entry: any) => [entry.label, entry.value])
        : Object.entries(selectedSubmission.submittedData || {});

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => setSelectedSubmission(null)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to All Submissions
            </button>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6">
            <div className="border-b border-slate-200 pb-4 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedSubmission.formId?.formName || "Form Submission"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-2">
                    Submitted on {formatDate(selectedSubmission.submittedAt)}
                  </p>
                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${
                      selectedSubmission.status === "SUBMITTED"
                        ? "bg-blue-100 text-blue-800"
                        : selectedSubmission.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {selectedSubmission.status}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    setSelectedSubmission(null);
                    handleDeleteClick(selectedSubmission, e);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold mb-4">Submitted Data</h3>
              {submittedEntries.map(
                ([label, value]: [string, any]) => (
                  <div key={label} className="border-b pb-3">
                    <p className="text-sm font-medium text-gray-700">{label}</p>
                    <p className="text-gray-900 mt-1">
                      {typeof value === 'object' && value.fileName ? (
                        <span className="text-blue-600">📎 {value.fileName}</span>
                      ) : Array.isArray(value) ? value.join(", ") : String(value)}
                    </p>
                  </div>
                ),
              )}
            </div>

            {/* File Attachments Section */}
            {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-4">File Attachments</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedSubmission.attachments.map((attachment: any, index: number) => {
                    const isImage = attachment.mimeType?.startsWith('image/');
                    const isResume = (attachment.fieldLabel || '').toLowerCase().includes('resume') || 
                                     (attachment.fieldLabel || '').toLowerCase().includes('cv') ||
                                     (attachment.fileName || '').toLowerCase().includes('resume') ||
                                     (attachment.fileName || '').toLowerCase().includes('cv');
                    
                    return (
                      <div key={index} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          {isImage ? (
                            <div className="flex-shrink-0 w-16 h-16 bg-slate-100 rounded-lg overflow-hidden">
                              <img 
                                src={`http://localhost:5000/${attachment.filePath}`}
                                alt={attachment.fileName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><ImageIcon class="w-6 h-6 text-slate-400" /></div>';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex-shrink-0 w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                              <File className="w-8 h-8 text-slate-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{attachment.fileName}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {attachment.fieldLabel}
                              {isResume && <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">Resume</span>}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {(attachment.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <a
                            href={`http://localhost:5000/${attachment.filePath}`}
                            download={attachment.fileName}
                            className="flex-shrink-0 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="w-4 h-4 text-blue-600" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedSubmission.notes && (
              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Notes</p>
                <p className="text-gray-900">{selectedSubmission.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Form Submission History</h1>
              <p className="text-sm text-slate-500 mt-1">{submissions.length} submission{submissions.length !== 1 ? 's' : ''} found</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate("/dashboard")}
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate("/form-builder")}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-sm font-medium text-sm"
              >
                Create New Form
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 mb-6 p-4">
          <div className="flex gap-2 flex-wrap">
            {["all", "today", "week", "month"].map((period) => (
              <button
                key={period}
                onClick={() => setFilter(period)}
                className={`px-4 py-2 rounded-lg transition font-medium text-sm ${
                  filter === period
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {period === "all"
                  ? "All Time"
                  : period === "today"
                    ? "Today"
                    : period === "week"
                      ? "This Week"
                      : "This Month"}
              </button>
            ))}
          </div>
        </div>

        {/* Submissions List */}
        {submissions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-12 text-center">
            <div className="bg-slate-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              No Submissions Yet
            </h2>
            <p className="text-slate-500 mb-6">
              Create and submit forms to see them here
            </p>
            <button
              onClick={() => navigate("/form-builder")}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg font-medium"
            >
              Create Your First Form
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {submissions.map((submission) => (
              <div
                key={submission._id}
                className="bg-white rounded-xl shadow-md border border-slate-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 p-6 cursor-pointer"
                onClick={() => handleViewSubmission(submission)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">
                      {submission.formId?.formName || "Untitled Form"}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {formatDate(submission.submittedAt)}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      submission.status === "SUBMITTED"
                        ? "bg-blue-100 text-blue-800"
                        : submission.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {submission.status}
                  </span>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {(submission.submittedDataList?.length || Object.keys(submission.submittedData || {}).length)} fields
                    submitted
                  </p>
                  <div className="flex items-center gap-2">
                    <button className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(submission, e)}
                      className="text-sm text-red-600 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Statistics */}
        {submissions.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Total Submissions</p>
              <p className="text-3xl font-bold text-blue-600">
                {submissions.length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Unique Forms</p>
              <p className="text-3xl font-bold text-purple-600">
                {new Set(submissions.map((s) => s.formId?._id)).size}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">This Month</p>
              <p className="text-3xl font-bold text-green-600">
                {
                  submissions.filter(
                    (s) =>
                      s.submissionMonth ===
                      `${new Date().getFullYear()}-${String(
                        new Date().getMonth() + 1,
                      ).padStart(2, "0")}`,
                  ).length
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Delete Submission</h3>
                <p className="text-sm text-slate-500">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this submission for{" "}
              <span className="font-semibold">
                {submissionToDelete?.formId?.formName || "this form"}
              </span>
              ?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSubmissionToDelete(null);
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
