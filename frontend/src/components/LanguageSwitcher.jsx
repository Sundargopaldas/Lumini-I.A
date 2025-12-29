import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center space-x-2 bg-slate-800 rounded-lg p-1 border border-slate-700">
      <button
        onClick={() => changeLanguage('pt')}
        className={`px-2 py-1 text-xs rounded transition-colors ${
          i18n.language.startsWith('pt') 
            ? 'bg-purple-600 text-white font-bold' 
            : 'text-gray-400 hover:text-white'
        }`}
      >
        PT
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 text-xs rounded transition-colors ${
          i18n.language.startsWith('en') 
            ? 'bg-purple-600 text-white font-bold' 
            : 'text-gray-400 hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
