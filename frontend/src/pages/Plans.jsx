import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import CustomAlert from '../components/CustomAlert';
import CancelSurveyModal from '../components/CancelSurveyModal';

const Plans = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const currentPlan = user.plan || 'free';

  const showAlert = (title, message, type = 'info', onConfirm = null) => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type,
      onConfirm
    });
  };

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    // Fetch invoices if user is logged in
    if (user.email) {
        api.get('/payments/my-invoices')
           .then(res => setInvoices(res.data))
           .catch(err => console.error('Erro ao buscar faturas:', err));
    }
  }, []);

  const handleUpgrade = (plan) => {
    navigate('/checkout', { state: { plan } });
  };

  const handleCancelClick = () => {
      setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async (reason) => {
      setLoading(true);
      try {
          const res = await api.post('/payments/cancel-subscription', { reason });
          setIsCancelModalOpen(false); // Close survey modal
          showAlert('Sucesso', res.data.message, 'success');
          // Reload after a short delay to let user read the message
          setTimeout(() => {
              window.location.reload();
          }, 2000);
      } catch (error) {
          console.error('Erro ao cancelar:', error);
          setIsCancelModalOpen(false);
          showAlert('Erro', 'Erro ao cancelar assinatura. Tente novamente ou contate o suporte.', 'error');
      } finally {
          setLoading(false);
      }
  };

  const plans = [
    {
      name: 'Free',
      displayName: t('plans.free') || 'Free',
      price: 'R$ 0',
      period: t('plans.month'),
      description: t('plans.free_desc'),
      features: [
        t('plans.features.monthly_reports'),
        t('plans.features.basic_dashboard'),
        t('plans.features.up_to_3_goals')
      ],
      buttonText: t('plans.start_free'),
      buttonStyle: 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20',
      highlight: false
    },
    {
      name: 'Pro',
      displayName: t('plans.pro') || 'Pro',
      price: 'R$ 49',
      period: t('plans.month'),
      description: t('plans.pro_desc'),
      features: [
        t('plans.features.unlimited_integrations'),
        t('plans.features.auto_categorization'),
        t('plans.features.advanced_reports'),
        t('plans.features.tax_simulator'),
        t('plans.features.priority_support')
      ],
      buttonText: t('plans.upgrade_pro'),
      buttonStyle: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/30',
      highlight: true
    },
    {
      name: 'Premium',
      displayName: t('plans.premium') || 'Premium',
      price: 'R$ 99',
      period: t('plans.month'),
      description: t('plans.premium_desc'),
      features: [
        t('plans.features.all_from_pro'),
        t('plans.features.monthly_consulting'),
        t('plans.features.nfse_issuance'),
        t('plans.features.dedicated_manager'),
        t('plans.features.financial_planning')
      ],
      buttonText: t('plans.get_premium'),
      buttonStyle: 'bg-white text-purple-900 hover:bg-gray-100',
      highlight: false
    }
  ];

  return (
    <div className="space-y-12 pb-12">
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white transition-colors">{t('plans.title')}</h1>
        <p className="text-slate-500 dark:text-gray-400 max-w-2xl mx-auto px-4 transition-colors">
          {t('plans.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan) => {
            const isCurrent = currentPlan === plan.name.toLowerCase();
            return (
          <div 
            key={plan.name}
            className={`relative rounded-2xl p-6 backdrop-blur-lg border ${
              plan.highlight 
                ? 'bg-slate-50 dark:bg-white/10 border-purple-500 transform scale-105 shadow-2xl shadow-purple-900/20' 
                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-lg dark:shadow-none'
            } transition-all duration-300 flex flex-col`}
          >
            {plan.highlight && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                {t('plans.most_popular')}
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">{plan.displayName}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900 dark:text-white transition-colors">{plan.price}</span>
                <span className="text-slate-500 dark:text-gray-400 text-sm transition-colors">{plan.period}</span>
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-sm mt-3 min-h-[40px] transition-colors">{plan.description}</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-gray-300 transition-colors">
                  <svg className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <div className="space-y-3">
                <button 
                    onClick={() => !isCurrent && handleUpgrade(plan)}
                    disabled={isCurrent || loading}
                    className={`w-full py-3 rounded-lg font-bold transition-all ${
                        isCurrent 
                        ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 cursor-default border border-green-200 dark:border-green-500/50' 
                        : (plan.name.toLowerCase() === 'free' ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20' : plan.buttonStyle)
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                {isCurrent ? t('plans.current_plan') : (loading ? t('plans.processing') : plan.buttonText)}
                </button>
                
                {isCurrent && plan.name.toLowerCase() !== 'free' && (
                    <button 
                        onClick={handleCancelClick}
                        disabled={loading}
                        className="w-full py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        {t('plans.cancel_subscription')}
                    </button>
                )}
            </div>
          </div>
        )})}
      </div>

      {/* Test Plan (Removed) */}

      {/* Histórico de Faturas */}
      {invoices.length > 0 && (
          <div className="mt-16 max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center transition-colors">{t('plans.history_title')}</h2>
              <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden transition-colors">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-slate-600 dark:text-gray-300">
                          <thead className="bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-gray-100 uppercase text-xs transition-colors">
                              <tr>
                                  <th className="px-6 py-4 font-semibold">{t('plans.date')}</th>
                                  <th className="px-6 py-4 font-semibold">{t('plans.amount')}</th>
                                  <th className="px-6 py-4 font-semibold">{t('plans.status')}</th>
                                  <th className="px-6 py-4 font-semibold text-right">{t('plans.invoice')}</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-white/10 transition-colors">
                              {invoices.map((inv) => (
                                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                      <td className="px-6 py-4">{inv.date}</td>
                                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white transition-colors">{inv.amount}</td>
                                      <td className="px-6 py-4">
                                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                              inv.status === 'paid' ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                                          }`}>
                                              {inv.status === 'paid' ? t('plans.paid') : inv.status}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <a 
                                              href={inv.pdf} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 text-sm font-semibold hover:underline"
                                          >
                                              {t('plans.download_pdf')}
                                          </a>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* Upsells Section */}
      <div className="mt-16 border-t border-slate-200 dark:border-white/10 pt-12 transition-colors">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center transition-colors">{t('plans.addons_title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
                {
                    name: t('addons.accountant_name'),
                    price: 'R$ 149/mês',
                    description: t('addons.accountant_desc'),
                    details: t('addons.accountant_details')
                },
                {
                    name: t('addons.ir_name'),
                    price: 'R$ 199/ano',
                    description: t('addons.ir_desc'),
                    details: t('addons.ir_details')
                },
                {
                    name: t('addons.audit_name'),
                    price: 'R$ 497',
                    description: t('addons.audit_desc'),
                    details: t('addons.audit_details')
                }
            ].map((addon) => (
                <div key={addon.name} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors flex flex-col justify-between shadow-lg dark:shadow-none">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white max-w-[70%] transition-colors">{addon.name}</h3>
                            <span className="text-purple-600 dark:text-purple-400 font-bold text-sm whitespace-nowrap transition-colors">{addon.price}</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-gray-400 mb-6 transition-colors">{addon.description}</p>
                    </div>
                    <button 
                        onClick={() => {
                            showAlert(
                                addon.name,
                                `${addon.details}\n\n${t('plans.addon_interest_confirm') || 'Deseja solicitar o contato de um consultor para este serviço?'}`,
                                'confirm',
                                () => {
                                    // Mock sending interest
                                    setLoading(true);
                                    setTimeout(() => {
                                        setLoading(false);
                                        showAlert(
                                            t('plans.addon_interest_title'),
                                            t('plans.addon_interest_msg'),
                                            'success'
                                        );
                                    }, 1000);
                                }
                            );
                        }}
                        className="text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-white/20 px-4 py-2 rounded hover:bg-slate-100 dark:hover:bg-white/10 w-full hover:border-purple-500/50 transition-all"
                    >
                        {t('plans.learn_more')}
                    </button>
                </div>
            ))}
        </div>
      </div>
      <CustomAlert 
        isOpen={alertConfig.isOpen}
        onClose={closeAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
      />
      
      <CancelSurveyModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        loading={loading}
      />
    </div>
  );
};

export default Plans;
