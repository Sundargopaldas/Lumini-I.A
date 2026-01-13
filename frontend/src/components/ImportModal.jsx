import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const ImportModal = ({ isOpen, onClose, onImportSuccess }) => {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.name.endsWith('.ofx') || selectedFile.name.endsWith('.OFX'))) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    } else {
      setFile(null);
      setError(t('transactions.invalid_file_type'));
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/import/ofx', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data.summary);
      onImportSuccess();
    } catch (err) {
      console.error('Upload failed', err);
      setError(t('transactions.import_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center py-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[90vh] flex flex-col">
          <div className="p-6 overflow-y-auto flex-1">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('transactions.import_ofx')}</h2>
            <button 
              onClick={handleClose}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {!result ? (
            <div className="space-y-4">
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  file ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-purple-400 dark:hover:border-purple-500'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  accept=".ofx" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                
                <div className="flex flex-col items-center gap-3 cursor-pointer">
                  <span className="text-4xl">📄</span>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {file ? file.name : t('transactions.click_to_upload')}
                  </p>
                  <p className="text-xs text-slate-400">
                    {t('transactions.supported_formats')} (.ofx)
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all shadow-lg shadow-purple-500/30 flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    {t('common.processing')}
                  </>
                ) : (
                  t('transactions.import_button')
                )}
              </button>
            </div>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('transactions.import_success')}</h3>
              
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">{t('transactions.total_found')}:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{result.totalFound}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600 dark:text-green-400">{t('transactions.imported_new')}:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">{result.imported}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-600 dark:text-yellow-400">{t('transactions.skipped_duplicates')}:</span>
                  <span className="font-bold text-yellow-600 dark:text-yellow-400">{result.duplicates}</span>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-all"
              >
                {t('common.close')}
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
