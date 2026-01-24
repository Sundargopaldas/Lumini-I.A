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
  const [filter, setFilter] = useState('all'); // all, viewed, unviewed
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

  // Filtrar documentos
  const filteredDocuments = documents.filter(doc => {
    if (filter === 'viewed') return doc.viewed;
    if (filter === 'unviewed') return !doc.viewed;
    return true;
  });

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
    <div className="space-y-6 px-2 md:px-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">📄 Meus Documentos</h1>
          <p className="text-slate-400">
            Documentos compartilhados pelo seu contador
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
        >
          ← Voltar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-1">Total de Documentos</p>
              <p className="text-3xl font-bold text-white">{documents.length}</p>
            </div>
            <span className="text-4xl">📁</span>
          </div>
        </div>

        <div className="bg-red-900/20 rounded-xl p-6 border border-red-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-300 text-sm mb-1">Não Visualizados</p>
              <p className="text-3xl font-bold text-red-400">{unviewedCount}</p>
            </div>
            <span className="text-4xl">🔴</span>
          </div>
        </div>

        <div className="bg-green-900/20 rounded-xl p-6 border border-green-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300 text-sm mb-1">Visualizados</p>
              <p className="text-3xl font-bold text-green-400">{documents.length - unviewedCount}</p>
            </div>
            <span className="text-4xl">✅</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Todos ({documents.length})
        </button>
        <button
          onClick={() => setFilter('unviewed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'unviewed'
              ? 'bg-red-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Não Visualizados ({unviewedCount})
        </button>
        <button
          onClick={() => setFilter('viewed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'viewed'
              ? 'bg-green-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Visualizados ({documents.length - unviewedCount})
        </button>
      </div>

      {/* Lista de Documentos */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
          <span className="text-6xl mb-4 block">📭</span>
          <h3 className="text-xl font-bold text-white mb-2">
            {filter === 'all' ? 'Nenhum documento' : `Nenhum documento ${filter === 'viewed' ? 'visualizado' : 'não visualizado'}`}
          </h3>
          <p className="text-slate-400">
            {filter === 'all' 
              ? 'Você ainda não recebeu documentos do seu contador'
              : 'Tente outro filtro'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map((doc, index) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-slate-800 rounded-xl p-6 border transition-all hover:shadow-xl ${
                doc.viewed 
                  ? 'border-slate-700' 
                  : 'border-red-500/50 bg-red-900/10'
              }`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{getFileIcon(doc.fileType)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-white truncate">
                          {doc.originalName}
                        </h3>
                        {!doc.viewed && (
                          <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                            NOVO
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-400 flex-wrap">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>{formatDate(doc.uploadedAt)}</span>
                        {doc.accountant && (
                          <>
                            <span>•</span>
                            <span className="truncate">📤 De: {doc.accountant.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {doc.description && (
                    <div className="bg-slate-900/50 rounded-lg p-3 mt-3">
                      <p className="text-slate-300 text-sm">
                        💬 {doc.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {!doc.viewed && (
                    <button
                      onClick={() => markAsViewed(doc.id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all whitespace-nowrap"
                    >
                      ✓ Marcar como Lido
                    </button>
                  )}
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
                        Baixando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        📥 Baixar
                      </span>
                    )}
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
