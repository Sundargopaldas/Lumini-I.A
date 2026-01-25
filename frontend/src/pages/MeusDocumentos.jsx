import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import CustomAlert from '../components/CustomAlert';

const MeusDocumentos = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [alert, setAlert] = useState({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/accountants/my-documents');
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      showAlert('Erro', 'Não foi possível carregar os documentos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title, message, type = 'success') => {
    setAlert({ show: true, title, message, type });
  };

  const markAsViewed = async (documentId) => {
    try {
      await api.patch(`/accountants/documents/${documentId}/mark-viewed`);
      // Atualizar estado local
      setDocuments(docs => 
        docs.map(doc => 
          doc.id === documentId ? { ...doc, viewed: true } : doc
        )
      );
    } catch (error) {
      console.error('Error marking document as viewed:', error);
    }
  };

  const downloadDocument = async (documentId, filename) => {
    try {
      setDownloading(documentId);
      
      // Marcar como visualizado ao baixar
      await markAsViewed(documentId);
      
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
      
      showAlert('Sucesso', `Documento "${filename}" baixado com sucesso!`, 'success');
    } catch (error) {
      console.error('Error downloading document:', error);
      showAlert('Erro', 'Não foi possível baixar o documento', 'error');
    } finally {
      setDownloading(null);
    }
  };

  const deleteDocument = async (documentId, filename) => {
    try {
      setDeleting(documentId);
      
      await api.delete(`/accountants/my-documents/${documentId}`);
      
      // Remover da lista local
      setDocuments(docs => docs.filter(doc => doc.id !== documentId));
      
      showAlert('Sucesso', `Documento "${filename}" removido da sua visualização!`, 'success');
    } catch (error) {
      console.error('Error deleting document:', error);
      showAlert('Erro', 'Não foi possível deletar o documento', 'error');
    } finally {
      setDeleting(null);
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const unviewedCount = documents.filter(doc => !doc.viewed).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando documentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-2 md:px-0">
      {/* Header Simplificado */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            📄 Meus Documentos
          </h1>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full border border-slate-700">
              {documents.length} total
            </span>
            {unviewedCount > 0 && (
              <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full border border-red-500/50 font-semibold animate-pulse">
                {unviewedCount} novos
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm"
        >
          ← Voltar
        </button>
      </div>

      {/* Lista de Documentos */}
      {documents.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
          <span className="text-6xl mb-4 block">📭</span>
          <h3 className="text-xl font-bold text-white mb-2">Nenhum documento</h3>
          <p className="text-slate-400">
            Você ainda não recebeu documentos do seu contador
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc, index) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`bg-slate-800 rounded-lg p-4 border transition-all hover:border-purple-500/50 ${
                doc.viewed 
                  ? 'border-slate-700' 
                  : 'border-red-500/50 bg-red-900/5'
              }`}
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-3xl">{getFileIcon(doc.fileType)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base font-semibold text-white truncate">
                        {doc.originalName}
                      </h3>
                      {!doc.viewed && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                          NOVO
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>•</span>
                      <span>{formatDate(doc.uploadedAt)}</span>
                      {doc.accountant && (
                        <>
                          <span>•</span>
                          <span>{doc.accountant.name}</span>
                        </>
                      )}
                    </div>
                    {doc.description && (
                      <p className="text-xs text-slate-300 mt-2 line-clamp-2">
                        💬 {doc.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => downloadDocument(doc.id, doc.originalName)}
                    disabled={downloading === doc.id}
                    className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                      downloading === doc.id
                        ? 'bg-slate-700 text-slate-400 cursor-wait'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {downloading === doc.id ? '...' : '📥 Baixar'}
                  </button>
                  <button
                    onClick={() => deleteDocument(doc.id, doc.originalName)}
                    disabled={deleting === doc.id}
                    className={`px-3 py-2 rounded-lg transition-all text-sm ${
                      deleting === doc.id
                        ? 'bg-slate-700 text-slate-400 cursor-wait'
                        : 'bg-slate-700 hover:bg-red-600 text-white'
                    }`}
                    title="Remover da minha visualização"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <CustomAlert
        isOpen={alert.show}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, show: false })}
      />
    </div>
  );
};

export default MeusDocumentos;
