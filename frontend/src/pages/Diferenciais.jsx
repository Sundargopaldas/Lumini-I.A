import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const Diferenciais = () => {
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-20 lg:pt-20 lg:pb-28">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-purple-500/10 blur-3xl"></div>
          <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="flex justify-center mb-8"
          >
            <Logo className="w-24 h-24 md:w-32 md:h-32" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6"
          >
            Por que escolher a <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">Lumini I.A</span>?
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-4 max-w-2xl mx-auto text-xl text-slate-600 dark:text-slate-300"
          >
            A primeira contabilidade inteligente projetada exclusivamente para a nova economia dos criadores de conteúdo.
          </motion.p>
        </div>
      </section>

      {/* Grid de Diferenciais */}
      <section className="py-12 bg-white dark:bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {/* Card 1 */}
            <motion.div variants={itemVariants} className="bg-slate-50 dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-shadow duration-300 group">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Automação com IA Real</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Nossa IA não é apenas um chatbot. Ela analisa suas transações bancárias, categoriza despesas dedutíveis e calcula seus impostos em tempo real, economizando horas do seu mês.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div variants={itemVariants} className="bg-slate-50 dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-shadow duration-300 group">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Feito para Criadores de Conteúdo</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Entendemos AdSense, Publis, Twitch Bits e Doações. Nossa plataforma fala a sua língua e sabe exatamente como tributar cada fonte de renda digital.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div variants={itemVariants} className="bg-slate-50 dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-shadow duration-300 group">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Híbrido Humano + IA</h3>
              <p className="text-slate-600 dark:text-slate-400">
                A eficiência da máquina com a segurança humana. Conecte-se com contadores reais especializados através do nosso Marketplace para consultorias complexas.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Comparativo</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Veja porque somos a melhor opção para você</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-4 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-sm tracking-wider w-1/3">Recurso</th>
                  <th className="p-4 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-sm tracking-wider w-1/3">Contabilidade Tradicional</th>
                  <th className="p-4 border-b-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 font-bold uppercase text-sm tracking-wider w-1/3">Lumini I.A</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                <tr className="bg-white dark:bg-slate-900">
                  <td className="p-4 font-medium text-slate-900 dark:text-white">Tempo de Resposta</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">24h a 48h úteis</td>
                  <td className="p-4 text-purple-600 dark:text-purple-400 font-semibold">Imediato (IA) / Rápido (Humano)</td>
                </tr>
                <tr className="bg-slate-50 dark:bg-slate-800/30">
                  <td className="p-4 font-medium text-slate-900 dark:text-white">Integração Bancária</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">Manual (envio de extratos)</td>
                  <td className="p-4 text-purple-600 dark:text-purple-400 font-semibold">Automática (Open Finance)</td>
                </tr>
                <tr className="bg-white dark:bg-slate-900">
                  <td className="p-4 font-medium text-slate-900 dark:text-white">Custo Mensal</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">Alto (honorários fixos)</td>
                  <td className="p-4 text-purple-600 dark:text-purple-400 font-semibold">Acessível (planos escaláveis)</td>
                </tr>
                <tr className="bg-slate-50 dark:bg-slate-800/30">
                  <td className="p-4 font-medium text-slate-900 dark:text-white">Foco</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">Generalista (padarias, lojas, etc)</td>
                  <td className="p-4 text-purple-600 dark:text-purple-400 font-semibold">Especialista em Digital/Tech</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Pronto para evoluir sua gestão financeira?</h2>
          <p className="text-purple-100 text-lg mb-8">
            Junte-se a milhares de criadores de conteúdo que já simplificaram suas vidas com a Lumini I.A.
          </p>
          <Link 
            to="/register" 
            className="inline-block bg-white text-purple-600 font-bold py-4 px-8 rounded-full shadow-lg hover:bg-slate-100 hover:scale-105 transition-all transform"
          >
            Começar Gratuitamente
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Diferenciais;
