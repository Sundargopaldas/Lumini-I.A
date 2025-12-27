import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import CustomAlert from '../components/CustomAlert';
import api from '../services/api';

// Initialize Stripe outside component to avoid recreation
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51SHVpM2OKONfldjlWcZ714t20Mk9IxsNHcSusy3sbhiAF1p3MKU19MPLgHP758KFx2tNWcxfmFgVdTXglxPkaDa600kUz6toaj');

const CheckoutForm = ({ plan }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  
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
      showAlert('Erro no Pagamento', error.message, 'error');
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
            showAlert('Pagamento Aprovado!', `Bem-vindo ao plano ${plan?.displayName || 'Premium'}!`, 'success');
            
            setTimeout(() => {
                console.log('Redirecionando para Dashboard...');
                window.location.href = '/dashboard';
            }, 1000);
        } else {
             showAlert('Processamento Pendente', `Status: ${response.data.status}. Verifique seu email.`, 'warning');
             setLoading(false);
        }

      } catch (backendError) {
          console.error('Backend Error:', backendError);
          const msg = backendError.response?.data?.error?.message || 'Erro ao processar a assinatura no servidor.';
          showAlert('Erro no Processamento', msg, 'error');
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
              <label className="block text-sm font-semibold text-gray-600 mb-1">Nome no Cartão</label>
              <input 
                  type="text" 
                  name="name"
                  required
                  placeholder="COMO NO CARTAO"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  value={formData.name}
                  onChange={handleInputChange}
              />
          </div>

          <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Dados do Cartão</label>
              <div className="border border-gray-300 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 transition-all bg-white">
                <CardElement options={{
                    style: {
                        base: {
                            fontSize: '16px',
                            color: '#424770',
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
              <label className="block text-sm font-semibold text-gray-600 mb-1">Cupom de Desconto</label>
              <div className="flex gap-2">
                  <input 
                      type="text" 
                      name="coupon"
                      placeholder="Código"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none uppercase"
                      value={formData.coupon}
                      onChange={handleInputChange}
                  />
                  <button type="button" className="bg-gray-100 text-gray-600 font-bold px-4 rounded-lg hover:bg-gray-200 transition-colors">
                      Aplicar
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
                      Processando...
                  </>
              ) : (
                  <>
                      <span>🔒</span> Confirmar Assinatura
                  </>
              )}
          </button>
          
          <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-2">
              <span>🔒 Pagamento criptografado via Stripe</span>
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
          title: 'Plano Confirmado!',
          message: 'Você está no plano Básico (Grátis).',
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
      <div className="bg-slate-800/50 backdrop-blur-md border border-white/10 rounded-2xl p-8 space-y-6">
        <div>
            <h2 className="text-sm uppercase tracking-wider text-gray-400 font-semibold mb-2">Resumo do Pedido</h2>
            <h1 className="text-3xl font-bold text-white mb-1">Plano {plan.displayName}</h1>
            <p className="text-purple-400 text-xl font-bold">{plan.price} <span className="text-sm font-normal text-gray-400">/ mês</span></p>
        </div>

        <div className="h-px bg-white/10"></div>

        <ul className="space-y-3">
            {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-300">
                    <span className="text-green-400 mt-1">✓</span>
                    {feature}
                </li>
            ))}
        </ul>

        <div className="h-px bg-white/10"></div>

        <div className="flex justify-between items-center text-sm text-gray-400">
            <span>Subtotal</span>
            <span>{plan.price}</span>
        </div>
        <div className="flex justify-between items-center text-lg font-bold text-white mt-2">
            <span>Total Hoje</span>
            <span>{plan.price}</span>
        </div>
        
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3 mt-4">
            <span className="text-xl">🛡️</span>
            <div>
                <h4 className="font-bold text-blue-200 text-sm">Garantia de 7 dias</h4>
                <p className="text-xs text-blue-300/80">Se não gostar, devolvemos seu dinheiro. Sem perguntas.</p>
            </div>
        </div>
      </div>

      {/* Right: Payment Form Wrapper OR Free Plan Confirmation */}
      <div className="bg-white rounded-2xl p-8 text-gray-800 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span>{isFreePlan ? '✅' : '💳'}</span> 
            {isFreePlan ? 'Confirmar Alteração' : 'Pagamento Seguro'}
        </h2>
        
        {isFreePlan ? (
            <div className="space-y-6">
                <p className="text-gray-600">
                    Você está alterando para o <strong>Plano Básico</strong>. 
                    Este plano é gratuito e não requer cartão de crédito.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                    ⚠️ Ao confirmar, você perderá acesso aos recursos exclusivos dos planos Pro e Premium imediatamente.
                </div>
                <button 
                    onClick={handleFreePlanConfirm}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-gray-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Processando...
                        </>
                    ) : (
                        <>
                            <span>✅</span> Confirmar Plano Gratuito
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
