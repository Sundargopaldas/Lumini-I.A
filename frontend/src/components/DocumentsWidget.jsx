import { useState, useEffect } from 'react';
import api from '../services/api';

const DocumentsWidget = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/accountants/my-documents');
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (documentId, filename) => {
    try {
      setDownloading(documentId);
      const response = await api.get(`/accountants/documents/${documentId}/download`, {
        responseType: 'blob'
      });
      
      // Criar link de download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Erro ao baixar documento');
    } finally {
      setDownloading(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${kb.toFixed(1)} KB`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return '📄';
    if (fileType.includes('pdf')) return '📕';
    if (fileType.includes('word') || fileType.includes('document')) return '📘';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📗';
    if (fileType.includes('image')) return '🖼️';
    return '📄';
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return null; // Não mostrar widget se não tem documentos
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-xl p-6 border border-purple-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          📁 Documentos Recebidos
          <span className="text-sm font-normal text-purple-300">
            ({documents.length})
          </span>
        </h3>
      </div>

      <div className="space-y-3">
        {documents.slice(0, 5).map((doc) => (
          <div
            key={doc.id}
            className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800/70 transition-colors border border-slate-700/50"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{getFileIcon(doc.fileType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {doc.originalName}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>•</span>
                      <span>{formatDate(doc.uploadedAt)}</span>
                      {doc.accountant && (
                        <>
                          <span>•</span>
                          <span className="truncate">De: {doc.accountant.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {doc.description && (
                  <p className="text-sm text-slate-400 mt-2">
                    {doc.description}
                  </p>
                )}
              </div>

              <button
                onClick={() => downloadDocument(doc.id, doc.originalName)}
                disabled={downloading === doc.id}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  downloading === doc.id
                    ? 'bg-slate-700 text-slate-400 cursor-wait'
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg'
                }`}
              >
                {downloading === doc.id ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    ...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    📥 Baixar
                  </span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {documents.length > 5 && (
        <p className="text-center text-sm text-slate-400 mt-4">
          + {documents.length - 5} documento(s) a mais
        </p>
      )}
    </div>
  );
};

export default DocumentsWidget;
