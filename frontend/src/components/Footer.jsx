import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="mt-auto py-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500 dark:text-gray-500">
                <div>
                    &copy; {new Date().getFullYear()} Lumini I.A. Todos os direitos reservados.
                </div>
                <div className="flex gap-6">
                    <Link to="/terms" className="hover:text-purple-600 transition-colors">
                        Termos de Uso e Regras
                    </Link>
                    <a href="mailto:suporte@lumini.ai" className="hover:text-purple-600 transition-colors">
                        Suporte
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
