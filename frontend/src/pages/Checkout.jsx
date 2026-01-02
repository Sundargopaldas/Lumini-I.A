import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTranslation } from 'react-i18next';
import CustomAlert from '../components/CustomAlert';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

// Initialize Stripe outside component to avoid recreation
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_live_51SHVp6Rv6V0vaAnPReLRLbmk7pFYdBUKzwh19zr5Cl42mncVIQELphhY67g9aPXt4dXsP7bkljFIUzh8mpOJ3sO5002bWJrPpY');

const PLANS_DATA = {
    'free': {
        name: 'Free',
        displayName: 'Free',
        price: 'R$ 0',
        features: ['Relatórios Mensais', 'Dashboard Básico', 'Até 3 Metas']
    },
    'pro': {
        name: 'Pro',
        displayName: 'Pro',
        price: 'R$ 49',
        features: ['Integrações ilimitadas', 'Categorização automática', 'Relatórios Avançados', 'Simulador de Impostos', 'Suporte VIP']
    },
    'premium': {
        name: 'Premium',
        displayName: 'Premium',
        price: 'R$ 99',
        features: ['Tudo do Pro', 'Consultoria Mensal', 'Emissão de Notas (NFS-e)', 'Gerente Dedicado', 'Planejamento Financeiro']
    },
    'teste': {
        name: 'teste',
        displayName: 'Teste de Integração',
        price: 'R$ 5,00',
        features: ['Validação de Pagamento Real', 'Teste de Webhook', 'Cobrança no Cartão', 'Acesso Temporário']
    }
};

const CheckoutForm = ({ plan }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useTranslation();
  
  // Define explicitamente para evitar erros e garantir a lógica
  const testPlanActive = plan?.name === 'teste';
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cpfCnpj: '',
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
                window.location.replace('/dashboard');
            }, 1500);
        }
    } catch (err) {
        console.error('Mock Error:', err);
        showAlert(t('checkout.error_mock_title'), t('checkout.error_mock_msg'), 'error');
        setLoading(false);
    }
  };

  const cardStyle = useMemo(() => ({
     hidePostalCode: true,
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
   }), [theme]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    const cardElement = elements.getElement(CardNumberElement);

    const {error, paymentMethod} = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: formData.name,
      },
    });

    if (error) {
      console.log('[error]', error);
      showAlert(t('checkout.error_card_title'), error.message, 'error');
      setLoading(false);
    } else {
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
        const cpfCnpj = storedUser.cpfCnpj || '000.000.000-00';

        const response = await api.post('/payments/create-subscription', {
           email: email,
           paymentMethodId: paymentMethod.id,
           planName: testPlanActive ? 'teste' : plan?.name,
           name: formData.name,
           cpfCnpj: cpfCnpj
        });

        if (response.data.status === 'active' || response.data.status === 'trialing' || response.data.status === 'succeeded') {
            console.log('--- Pagamento Confirmado via Stripe ---');
            
            // Determine the final plan name to save (map 'teste' -> 'premium')
            const finalPlanName = (testPlanActive ? 'premium' : (plan?.name || 'premium')).toLowerCase();
            
            // 1. Force Local Update with Backend Response (Best Source of Truth)
            if (response.data.user) {
                console.log('Recebido usuário atualizado do backend:', response.data.user);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            } else {
                // Fallback: Optimistic Update
                try {
                    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                    const updatedUser = { ...currentUser, plan: finalPlanName };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    console.log('LocalStorage atualizado manualmente para:', finalPlanName);
                } catch (e) {
                    console.error('Erro ao salvar no LocalStorage:', e);
                }
            }
            
            // 2. UI Feedback & Redirect
            const msg = testPlanActive 
                ? 'Pagamento de teste (R$ 1.00) realizado com sucesso! Seu plano agora é Premium.' 
                : t('checkout.welcome_msg', { plan: plan?.displayName || 'Premium' });
                
            showAlert(t('checkout.payment_approved'), msg, 'success');
            
            setTimeout(() => {
                console.log('Redirecionando para Dashboard...');
                window.location.replace('/dashboard');
            }, 2000);
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
              <label className="block text-sm font-semibold text-slate-600 dark:text-gray-400 mb-1 transition-colors">CPF/CNPJ</label>
              <input 
                  type="text" 
                  name="cpfCnpj"
                  required
                  placeholder="000.000.000-00"
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  value={formData.cpfCnpj}
                  onChange={handleInputChange}
              />
          </div>

          <div className="space-y-4">
              <div>
                  <label className="block text-sm font-semibold text-slate-600 dark:text-gray-400 mb-1 transition-colors">Número do Cartão</label>
                  <div className="border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 transition-all bg-white dark:bg-slate-800">
                    <CardNumberElement options={{
                        showIcon: true,
                        style: cardStyle.style
                    }}/>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-semibold text-slate-600 dark:text-gray-400 mb-1 transition-colors">Validade</label>
                      <div className="border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 transition-all bg-white dark:bg-slate-800">
                        <CardExpiryElement options={{
                            style: cardStyle.style
                        }}/>
                      </div>
                  </div>
                  
                  <div>
                      <label className="block text-sm font-semibold text-slate-600 dark:text-gray-400 mb-1 transition-colors">CVC</label>
                      <div className="border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 transition-all bg-white dark:bg-slate-800">
                        <CardCvcElement options={{
                            style: cardStyle.style
                        }}/>
                      </div>
                  </div>
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
          
          <p className="text-center text-xs text-slate-400 dark:text-gray-500 mt-4 flex items-center justify-center gap-2">
              <span>🔒 {t('checkout.encrypted_msg')}</span>
          </p>
      </form>
    </>
  );
};

const AsaasCheckoutForm = ({ plan }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [billingType, setBillingType] = useState('BOLETO'); // BOLETO, PIX, CREDIT_CARD
    const [formData, setFormData] = useState({
        name: '',
        cpfCnpj: '',
        email: '',
        phone: '',
        postalCode: '',
        addressNumber: '',
        ccName: '',
        ccNumber: '',
        ccExpiry: '',
        ccCvv: ''
    });
    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Get current user info if fields empty
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const cleanCpf = formData.cpfCnpj.replace(/\D/g, '');
            
            const payload = {
                planName: plan?.name,
                billingType,
                name: formData.name || storedUser.name,
                email: formData.email || storedUser.email,
                cpfCnpj: cleanCpf
            };

            if (billingType === 'CREDIT_CARD') {
                // Robust Expiry Parsing
                let expMonth = '';
                let expYear = '';
                const rawExpiry = formData.ccExpiry.trim();

                if (rawExpiry.includes('/')) {
                    const parts = rawExpiry.split('/');
                    expMonth = parts[0].trim();
                    expYear = parts[1].trim();
                } else {
                    // Handle MMYY or MMYYYY without separator
                    const clean = rawExpiry.replace(/\D/g, '');
                    if (clean.length === 4) { // MMYY
                        expMonth = clean.substring(0, 2);
                        expYear = clean.substring(2);
                    } else if (clean.length === 6) { // MMYYYY
                        expMonth = clean.substring(0, 2);
                        expYear = clean.substring(2);
                    }
                }

                // Normalize Month (ensure 2 digits)
                if (expMonth.length === 1) expMonth = '0' + expMonth;

                // Normalize Year (ensure 4 digits)
                if (expYear.length === 2) expYear = '20' + expYear;

                console.log(`Parsed Expiry: ${expMonth}/${expYear}`); // Debug log

                payload.creditCard = {
                    holderName: formData.ccName,
                    number: formData.ccNumber.replace(/\s/g, ''),
                    expiryMonth: expMonth,
                    expiryYear: expYear,
                    ccv: formData.ccCvv
                };
                
                payload.creditCardHolderInfo = {
                    name: formData.name || storedUser.name,
                    email: formData.email || storedUser.email,
                    cpfCnpj: cleanCpf,
                    postalCode: formData.postalCode.replace(/\D/g, ''),
                    addressNumber: formData.addressNumber,
                    phone: formData.phone.replace(/\D/g, '')
                };
            }

            const response = await api.post('/payments/create-subscription-asaas', payload);

            if (response.data.invoiceUrl || response.data.subscriptionId) {
                // Update LocalStorage immediately for optimistic UI
                if (response.data.updatedPlan) {
                    try {
                        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                        const updatedUser = { ...currentUser, plan: response.data.updatedPlan };
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                        console.log('LocalStorage atualizado com novo plano:', response.data.updatedPlan);
                    } catch (e) {
                        console.error('Erro ao atualizar LocalStorage:', e);
                    }
                }

                setAlertState({
                    isOpen: true,
                    title: 'Assinatura Criada!',
                    message: billingType === 'CREDIT_CARD' ? 'Pagamento processado com sucesso!' : 'Você será redirecionado para realizar o pagamento.',
                    type: 'success'
                });
                
                setTimeout(() => {
                    if (billingType === 'CREDIT_CARD') {
                        window.location.replace('/dashboard');
                    } else {
                        window.location.href = response.data.invoiceUrl;
                    }
                }, 2000);
            }

        } catch (error) {
            console.error('Asaas Error Full Object:', error);
            if (error.response) {
                console.error('Asaas Error Response Data:', error.response.data);
                console.error('Asaas Error Response Status:', error.response.status);
            }
            
            setAlertState({
                isOpen: true,
                title: 'Erro',
                message: error.response?.data?.message || 'Falha ao criar assinatura.',
                type: 'error'
            });
            setLoading(false);
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
                    <label className="block text-sm font-semibold text-slate-600 dark:text-gray-400 mb-3 transition-colors">Forma de Pagamento</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => setBillingType('BOLETO')}
                            className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${billingType === 'BOLETO' ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <span className="text-xl">📄</span>
                            <span className="font-bold text-xs">Boleto</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setBillingType('PIX')}
                            className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${billingType === 'PIX' ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <span className="text-xl">💠</span>
                            <span className="font-bold text-xs">Pix</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setBillingType('CREDIT_CARD')}
                            className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${billingType === 'CREDIT_CARD' ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <span className="text-xl">💳</span>
                            <span className="font-bold text-xs">Cartão</span>
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-gray-400 mb-1 transition-colors">Nome Completo</label>
                    <input 
                        type="text" 
                        name="name"
                        required
                        className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Seu nome completo"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-gray-400 mb-1 transition-colors">CPF/CNPJ</label>
                    <input 
                        type="text" 
                        name="cpfCnpj"
                        required
                        className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                        value={formData.cpfCnpj}
                        onChange={handleInputChange}
                        placeholder="000.000.000-00"
                    />
                </div>

                {billingType === 'CREDIT_CARD' && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-4 border border-slate-200 dark:border-slate-700">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-gray-300 flex items-center gap-2">
                                <span>💳</span> Dados do Cartão
                            </h4>
                            
                            <div>
                                <input 
                                    type="text" 
                                    name="ccName"
                                    required
                                    className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={formData.ccName}
                                    onChange={handleInputChange}
                                    placeholder="Nome impresso no cartão"
                                />
                            </div>

                            <div>
                                <input 
                                    type="text" 
                                    name="ccNumber"
                                    required
                                    className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={formData.ccNumber}
                                    onChange={handleInputChange}
                                    placeholder="Número do Cartão"
                                    maxLength="19"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <input 
                                    type="text" 
                                    name="ccExpiry"
                                    required
                                    className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={formData.ccExpiry}
                                    onChange={handleInputChange}
                                    placeholder="MM/AA"
                                    maxLength="5"
                                />
                                <input 
                                    type="text" 
                                    name="ccCvv"
                                    required
                                    className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={formData.ccCvv}
                                    onChange={handleInputChange}
                                    placeholder="CVV"
                                    maxLength="4"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-4 border border-slate-200 dark:border-slate-700">
                             <h4 className="text-sm font-bold text-slate-700 dark:text-gray-300 flex items-center gap-2">
                                <span>📍</span> Endereço do Titular
                            </h4>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <input 
                                    type="text" 
                                    name="phone"
                                    required
                                    className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="Celular (com DDD)"
                                />
                                <input 
                                    type="text" 
                                    name="postalCode"
                                    required
                                    className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={formData.postalCode}
                                    onChange={handleInputChange}
                                    placeholder="CEP"
                                />
                            </div>
                            <div>
                                <input 
                                    type="text" 
                                    name="addressNumber"
                                    required
                                    className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={formData.addressNumber}
                                    onChange={handleInputChange}
                                    placeholder="Número do Endereço"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Processando...
                        </>
                    ) : (
                        <>
                            <span>🚀</span> Assinar com Asaas
                        </>
                    )}
                </button>
            </form>
        </>
    );
};

const Checkout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Determine plan from state or URL query
  const plan = useMemo(() => {
      const statePlan = location.state?.plan;
      const queryPlanName = searchParams.get('plan');
      
      // If full plan object passed via state
      if (statePlan && statePlan.features && statePlan.price) {
          return statePlan;
      }

      // Resolve plan name
      const planName = (statePlan?.name || queryPlanName || '').toLowerCase();
      
      // Look up in constant data
      if (PLANS_DATA[planName]) {
          // Merge allows overriding price if needed via state (e.g. discount)
          return { ...PLANS_DATA[planName], ...statePlan };
      }

      return null;
  }, [location.state, searchParams]);

  const [loading, setLoading] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState('stripe'); // 'stripe' or 'asaas'
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
    plan.name.toLowerCase() === 'basic' || 
    plan.name.toLowerCase() === 'free' ||
    plan.price === 'R$ 0' ||
    plan.price === '0';

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
            <>
                {/* Payment Provider Toggle - HIDDEN FOR LAUNCH (STRIPE ONLY) */}
                {/* 
                <div className="flex gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <button
                        onClick={() => setPaymentProvider('stripe')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 ${paymentProvider === 'stripe' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                        <span>💳</span> Cartão (Stripe)
                    </button>
                    <button
                        onClick={() => setPaymentProvider('asaas')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 ${paymentProvider === 'asaas' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                        <span>🇧🇷</span> Asaas (Boleto/Pix)
                    </button>
                </div>
                */}
                
                {/* Header Simples (Já que só tem Stripe) */}
                <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Seus dados são processados com criptografia de ponta a ponta.
                    </p>
                </div>

                {paymentProvider === 'stripe' ? (
                    <>
                        {window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && (
                            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg flex gap-3">
                                <span className="text-xl">⚠️</span>
                                <div className="text-sm text-red-700 dark:text-red-300">
                                    <p className="font-bold">Atenção: Conexão Não Segura</p>
                                    <p>O Stripe bloqueia a digitação de dados de cartão em sites sem HTTPS (exceto localhost).</p>
                                    <p className="mt-2">
                                        <strong>Solução:</strong> Use a aba <strong>Asaas</strong> acima e escolha a opção <strong>Cartão</strong>, ou acesse via HTTPS.
                                    </p>
                                </div>
                            </div>
                        )}
                        <Elements stripe={stripePromise}>
                            <CheckoutForm plan={plan} />
                        </Elements>
                    </>
                ) : (
                    <AsaasCheckoutForm plan={plan} />
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default Checkout;
