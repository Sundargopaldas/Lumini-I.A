import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTranslation } from 'react-i18next';
import CustomAlert from '../components/CustomAlert';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

// Initialize Stripe outside component to avoid recreation
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51SHVpM2OKONfldjlWcZ714t20Mk9IxsNHcSusy3sbhiAF1p3MKU19MPLgHP758KFx2tNWcxfmFgVdTXglxPkaDa600kUz6toaj');

const CheckoutForm = ({ plan }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    coupon: ''
  });

  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showAlert = (title, message, type = 'info') => {
    setAlertState({ isOpen: true, title, message, type });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMockPayment = async () => {
    setLoading(true);
    try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const email = storedUser.email || 'guest@example.com';

        // Call backend with special mock ID
        const response = await api.post('/payments/create-subscription', {
            email: email,
            paymentMethodId: 'mock_payment_method_dev', // Special flag
            planName: plan?.name,
            name: 'Simulated User',
            cpfCnpj: '000.000.000-00'
        });

        if (response.data.status === 'active') {
            const newPlan = (plan?.name || 'premium').toLowerCase();
            
            // 1. Force Backend Update
            try { await api.put('/auth/plan', { plan: newPlan }); } catch (e) {}
            
            // 2. Local Update
            const updatedUser = { ...storedUser, plan: newPlan };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            showAlert(t('checkout.success_mock_title'), t('checkout.success_mock_msg', { plan: plan?.displayName }), 'success');
            
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        }
    } catch (err) {
        console.error('Mock Error:', err);
        showAlert(t('checkout.error_mock_title'), t('checkout.error_mock_msg'), 'error');
        setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    const cardElement = elements.getElement(CardElement);

    const {error, paymentMethod} = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: formData.name,
      },
    });

    if (error) {
      console.log('[error]', error);
      showAlert(t('checkout.error_payment_title'), error.message, 'error');
      setLoading(false);
    } else {
      console.log('[PaymentMethod]', paymentMethod);
      
      try {
        // Get fresh user data from storage (updated by useEffect) or use current
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        let email = storedUser.email;

        // If no email in storage, try to fetch from API one last time or use guest (not ideal for subscription)
        if (!email) {
             try {
                 const res = await api.get('/auth/me');
                 email = res.data.email;
             } catch(e) {
                 console.error("Could not fetch user email", e);
             }
        }
        
        email = email || 'guest@example.com';

        const response = await api.post('/payments/create-subscription', {
           email: email,
           paymentMethodId: paymentMethod.id,
           planName: plan?.name,
           name: formData.name,
           cpfCnpj: formData.cpfCnpj
        });

        if (response.data.status === 'active' || response.data.status === 'trialing') {
            console.log('--- Pagamento Confirmado via Stripe ---');
            const newPlan = (plan?.name || 'premium').toLowerCase();
            
            // 1. Force Backend Update (Via Auth Token)
            try {
                console.log('Atualizando plano no backend via API Auth...');
                await api.put('/auth/plan', { plan: newPlan });
                console.log('Plano atualizado no backend com sucesso.');
            } catch (err) {
                console.error('Falha ao atualizar plano no DB (não fatal, pagamento ok):', err);
            }

            // 2. Force Local Update
            try {
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                const updatedUser = { ...currentUser, plan: newPlan };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                console.log('LocalStorage atualizado para:', newPlan);
            } catch (e) {
                console.error('Erro ao salvar no LocalStorage:', e);
            }
            
            // 3. UI Feedback & Redirect
            showAlert(t('checkout.payment_approved'), t('checkout.welcome_msg', { plan: plan?.displayName || 'Premium' }), 'success');
            
            setTimeout(() => {
                console.log('Redirecionando para Dashboard...');
                window.location.href = '/dashboard';
            }, 1000);
        } else {
             showAlert(t('checkout.pending'), t('checkout.check_email', { status: response.data.status }), 'warning');
             setLoading(false);
        }

      } catch (backendError) {
          console.error('Backend Error:', backendError);
          const msg = backendError.response?.data?.error?.message || t('checkout.server_processing_error');
          showAlert(t('checkout.processing_error'), msg, 'error');
          setLoading(false);
      }
    }
  };

  return (
    <>
      <CustomAlert 
        isOpen={alertState.isOpen}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
      
      <form onSubmit={handleSubmit} className="space-y-6">
          <div>
              <label className="block text-sm font-semibold text-slate-600 dark:text-gray-400 mb-1 transition-colors">{t('checkout.name_on_card')}</label>
              <input 
                  type="text" 
                  name="name"
                  required
                  placeholder={t('checkout.card_name_placeholder') || "COMO NO CARTAO"}
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  value={formData.name}
                  onChange={handleInputChange}
              />
          </div>

          <div>
              <label className="block text-sm font-semibold text-slate-600 dark:text-gray-400 mb-1 transition-colors">{t('checkout.card_details')}</label>
              <div className="border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 transition-all bg-white dark:bg-slate-800">
                <CardElement options={{
                    style: {
                        base: {
                            fontSize: '16px',
                            color: theme === 'dark' ? '#ffffff' : '#424770',
                            '::placeholder': {
                                color: '#aab7c4',
                            },
                        },
                        invalid: {
                            color: '#9e2146',
                        },
                    },
                }}/>
              </div>
          </div>

          <div>
              <label className="block text-sm font-semibold text-slate-600 dark:text-gray-400 mb-1 transition-colors">{t('checkout.coupon')}</label>
              <div className="flex gap-2">
                  <input 
                      type="text" 
                      name="coupon"
                      placeholder={t('checkout.coupon_code')}
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none uppercase transition-all"
                      value={formData.coupon}
                      onChange={handleInputChange}
                  />
                  <button type="button" className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-gray-300 font-bold px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                      {t('checkout.apply')}
                  </button>
              </div>
          </div>

          <button 
              type="submit" 
              disabled={!stripe || loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-purple-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
              {loading ? (
                  <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {t('checkout.processing')}
                  </>
              ) : (
                  <>
                      <span>🔒</span> {t('checkout.confirm_subscription')}
                  </>
              )}
          </button>
          
          <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 dark:text-gray-500 text-xs">{t('checkout.dev_mode')}</span>
              <div className="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
          </div>

          <button 
              type="button"
              onClick={handleMockPayment}
              disabled={loading}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-gray-400 font-bold py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 text-sm border border-slate-300 dark:border-slate-700 border-dashed"
          >
              <span>🛠️</span> {t('checkout.mock_payment_btn')}
          </button>
          
          <p className="text-center text-xs text-slate-400 dark:text-gray-500 mt-4 flex items-center justify-center gap-2">
              <span>🔒 {t('checkout.encrypted_msg')}</span>
          </p>
          <div className="flex justify-center gap-4 grayscale opacity-50 mt-2">
              <span className="font-bold text-lg italic text-blue-800">VISA</span>
              <span className="font-bold text-lg text-red-600">Mastercard</span>
              <span className="font-bold text-lg text-blue-500">Amex</span>
          </div>
      </form>
    </>
  );
};

const Checkout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { plan } = location.state || {};
  const [loading, setLoading] = useState(false);
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Redirect if no plan selected
  useEffect(() => {
    if (!plan) {
      navigate('/plans');
    }
  }, [plan, navigate]);

  if (!plan) return null;

  const isFreePlan = 
    (plan.price && plan.price.includes('0')) || 
    plan.name.toLowerCase() === 'basic' || 
    plan.name.toLowerCase() === 'free';

  const handleFreePlanConfirm = async () => {
      console.log('--- Iniciando Downgrade/Confirmação de Plano Grátis ---');
      setLoading(true);

      // 1. Atualizar Backend (Tentativa)
      try {
         await api.put('/auth/plan', { plan: 'free' });
         console.log('Backend atualizado com sucesso.');
      } catch (e) { 
         console.error('Erro ao atualizar backend (não fatal):', e); 
      }
      
      // 2. Atualizar LocalStorage (Mandatório)
      try {
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const updatedUser = { ...currentUser, plan: 'free' };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          console.log('LocalStorage atualizado:', updatedUser);
      } catch (e) {
          console.error('Erro crítico ao salvar no LocalStorage:', e);
      }
      
      // 3. Feedback Visual
      setAlertState({
          isOpen: true,
          title: t('checkout.plan_confirmed'),
          message: t('checkout.free_plan_success'),
          type: 'success'
      });

      // 4. Redirecionamento Forçado
      setTimeout(() => {
          console.log('Redirecionando para dashboard...');
          window.location.href = '/dashboard';
      }, 1000);
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start pt-8">
      <CustomAlert 
        isOpen={alertState.isOpen}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />

      {/* Left: Plan Summary */}
      <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-8 space-y-6 transition-colors shadow-lg dark:shadow-none">
        <div>
            <h2 className="text-sm uppercase tracking-wider text-slate-500 dark:text-gray-400 font-semibold mb-2 transition-colors">{t('checkout.order_summary')}</h2>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 transition-colors">{t('checkout.plan_title', { plan: plan.displayName })}</h1>
            <p className="text-purple-600 dark:text-purple-400 text-xl font-bold transition-colors">{plan.price} <span className="text-sm font-normal text-slate-500 dark:text-gray-400">{t('plans.month')}</span></p>
        </div>

        <div className="h-px bg-slate-200 dark:bg-white/10 transition-colors"></div>

        <ul className="space-y-3">
            {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-gray-300 transition-colors">
                    <span className="text-green-500 dark:text-green-400 mt-1">✓</span>
                    {feature}
                </li>
            ))}
        </ul>

        <div className="h-px bg-slate-200 dark:bg-white/10 transition-colors"></div>

        <div className="flex justify-between items-center text-sm text-slate-500 dark:text-gray-400 transition-colors">
            <span>{t('checkout.subtotal')}</span>
            <span>{plan.price}</span>
        </div>
        <div className="flex justify-between items-center text-lg font-bold text-slate-900 dark:text-white mt-2 transition-colors">
            <span>{t('checkout.total_today')}</span>
            <span>{plan.price}</span>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-4 flex gap-3 mt-4 transition-colors">
            <span className="text-xl">🛡️</span>
            <div>
                <h4 className="font-bold text-blue-800 dark:text-blue-200 text-sm transition-colors">{t('checkout.guarantee_title')}</h4>
                <p className="text-xs text-blue-600/80 dark:text-blue-300/80 transition-colors">{t('checkout.guarantee_desc')}</p>
            </div>
        </div>
      </div>

      {/* Right: Payment Form Wrapper OR Free Plan Confirmation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-slate-900 dark:text-white shadow-2xl dark:shadow-none dark:border dark:border-white/10 transition-colors">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span>{isFreePlan ? '✅' : '💳'}</span> 
            {isFreePlan ? t('checkout.confirm_change') : t('checkout.secure_payment')}
        </h2>
        
        {isFreePlan ? (
            <div className="space-y-6">
                <p className="text-slate-600 dark:text-gray-400 transition-colors">
                    {t('checkout.downgrade_msg')} 
                    {t('checkout.free_plan_note')}
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/20 rounded-lg p-4 text-sm text-yellow-800 dark:text-yellow-200 transition-colors">
                    {t('checkout.downgrade_warning')}
                </div>
                <button 
                    onClick={handleFreePlanConfirm}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-gray-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            {t('checkout.processing')}
                        </>
                    ) : (
                        <>
                            <span>✅</span> {t('checkout.confirm_free')}
                        </>
                    )}
                </button>
            </div>
        ) : (
            <Elements stripe={stripePromise}>
                <CheckoutForm plan={plan} />
            </Elements>
        )}
      </div>
    </div>
  );
};

export default Checkout;
