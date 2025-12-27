import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Plans = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const currentPlan = user.plan || 'free';

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

  const plans = [
    {
      name: 'Free',
      displayName: 'Básico',
      price: 'R$ 0',
      period: '/mês',
      description: 'Perfeito para iniciantes.',
      features: [
        'Até 2 fontes de renda',
        'Lançamento manual de despesas',
        'Painel de controle básico',
        'Relatórios mensais em PDF',
        'Rastreador de Limite MEI'
      ],
      buttonText: 'Começar Grátis',
      buttonStyle: 'bg-white/10 text-white hover:bg-white/20',
      highlight: false
    },
    {
      name: 'Pro',
      displayName: 'Pro',
      price: 'R$ 49',
      period: '/mês',
      description: 'Para criadores em crescimento que precisam de automação.',
      features: [
        'Integrações ilimitadas',
        'Categorização automática',
        'Relatórios Avançados',
        'Simulador de Impostos (Avançado)',
        'Suporte Prioritário'
      ],
      buttonText: 'Upgrade para Pro',
      buttonStyle: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/30',
      highlight: true
    },
    {
      name: 'Premium',
      displayName: 'Premium',
      price: 'R$ 99',
      period: '/mês',
      description: 'Gestão financeira completa + ajuda de especialistas.',
      features: [
        'Tudo do Pro',
        'Consultoria Mensal',
        'Emissão de Notas (NFS-e)',
        'Gerente de Conta Dedicado',
        'Planejamento Financeiro'
      ],
      buttonText: 'Obter Premium',
      buttonStyle: 'bg-white text-purple-900 hover:bg-gray-100',
      highlight: false
    }
  ];

  return (
    <div className="space-y-12 pb-12">
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-white">Escolha seu Plano</h1>
        <p className="text-gray-400 max-w-2xl mx-auto px-4">
          Escale seu negócio com as ferramentas financeiras certas. 
          Faça upgrade a qualquer momento conforme você cresce.
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
                ? 'bg-white/10 border-purple-500 transform scale-105 shadow-2xl shadow-purple-900/20' 
                : 'bg-white/5 border-white/10 hover:border-white/20'
            } transition-all duration-300 flex flex-col`}
          >
            {plan.highlight && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                Mais Popular
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2">{plan.displayName}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-gray-400 text-sm">{plan.period}</span>
              </div>
              <p className="text-gray-400 text-sm mt-3 min-h-[40px]">{plan.description}</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <button 
                onClick={() => !isCurrent && handleUpgrade(plan)}
                disabled={isCurrent || loading}
                className={`w-full py-3 rounded-lg font-bold transition-all ${
                    isCurrent 
                    ? 'bg-green-500/20 text-green-400 cursor-default border border-green-500/50' 
                    : plan.buttonStyle
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isCurrent ? 'Current Plan' : (loading ? 'Processing...' : plan.buttonText)}
            </button>
          </div>
        )})}
      </div>

      {/* Histórico de Faturas */}
      {invoices.length > 0 && (
          <div className="mt-16 max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Histórico de Cobranças</h2>
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-gray-300">
                          <thead className="bg-white/5 text-gray-100 uppercase text-xs">
                              <tr>
                                  <th className="px-6 py-4 font-semibold">Data</th>
                                  <th className="px-6 py-4 font-semibold">Valor</th>
                                  <th className="px-6 py-4 font-semibold">Status</th>
                                  <th className="px-6 py-4 font-semibold text-right">Fatura</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                              {invoices.map((inv) => (
                                  <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                                      <td className="px-6 py-4">{inv.date}</td>
                                      <td className="px-6 py-4 font-medium text-white">{inv.amount}</td>
                                      <td className="px-6 py-4">
                                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                              inv.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                          }`}>
                                              {inv.status === 'paid' ? 'Pago' : inv.status}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <a 
                                              href={inv.pdf} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="text-purple-400 hover:text-purple-300 text-sm font-semibold hover:underline"
                                          >
                                              Baixar PDF
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
      <div className="mt-16 border-t border-white/10 pt-12">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Optional Add-ons</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-white">Partner Accountant</h3>
                    <span className="text-purple-400 font-bold">R$ 149/mo</span>
                </div>
                <p className="text-sm text-gray-400 mb-4">Get a certified accountant to handle all your monthly tax filings and doubts.</p>
                <button className="text-sm text-white border border-white/20 px-4 py-2 rounded hover:bg-white/10 w-full">Learn More</button>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-white">Tax Declaration (IR)</h3>
                    <span className="text-purple-400 font-bold">R$ 199/yr</span>
                </div>
                <p className="text-sm text-gray-400 mb-4">Simplified annual income tax declaration service for creators.</p>
                <button className="text-sm text-white border border-white/20 px-4 py-2 rounded hover:bg-white/10 w-full">Learn More</button>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-white">Financial Audit</h3>
                    <span className="text-purple-400 font-bold">R$ 497</span>
                </div>
                <p className="text-sm text-gray-400 mb-4">One-time deep dive into your finances with a customized growth plan.</p>
                <button className="text-sm text-white border border-white/20 px-4 py-2 rounded hover:bg-white/10 w-full">Learn More</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Plans;
