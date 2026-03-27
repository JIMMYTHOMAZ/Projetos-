import React, { useState, useMemo } from 'react';
import { Calculator, DollarSign, Calendar, TrendingDown, Percent, ArrowRight, Info, Car, Plus, Trash2 } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

interface Quota {
  id: string;
  group: string;
  credit: number;
  term: number;
  adminFee: string;
  reserveFund: string;
}

export default function App() {
  const [quotas, setQuotas] = useState<Quota[]>([
    { id: '1', group: '', credit: 0, term: 0, adminFee: '', reserveFund: '' }
  ]);
  const [plan, setPlan] = useState<'integral' | 'reduzido25' | 'reduzido40'>('integral');
  const [monthsPaid, setMonthsPaid] = useState<number>(0);
  
  const [bidType, setBidType] = useState<'nenhum' | 'embutido' | 'fixo' | 'livre'>('nenhum');
  const [embutidoPct, setEmbutidoPct] = useState<number>(0);
  const [proprioPct, setProprioPct] = useState<number>(0);
  
  const [postContemplation, setPostContemplation] = useState<'diluido' | 'normal'>('diluido');

  const addQuota = () => {
    if (quotas.length < 6) {
      setQuotas([...quotas, { id: Date.now().toString(), group: '', credit: 0, term: 0, adminFee: '', reserveFund: '' }]);
    }
  };

  const removeQuota = (id: string) => {
    if (quotas.length > 1) {
      setQuotas(quotas.filter(q => q.id !== id));
    }
  };

  const updateQuota = (id: string, field: keyof Quota, value: string | number) => {
    setQuotas(quotas.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const maxTerm = useMemo(() => quotas.reduce((max, q) => Math.max(max, q.term), 0), [quotas]);

  const {
    totalCredit,
    currentInstallment,
    netCredit,
    newInstallment,
    newRemainingMonths,
    leVal,
    lpVal,
    totalBid,
    saldoDevedor,
    residueTotal
  } = useMemo(() => {
    const R = plan === 'integral' ? 0 : plan === 'reduzido25' ? 0.25 : 0.40;
    const LE_pct = bidType === 'nenhum' ? 0 : bidType === 'embutido' ? embutidoPct : 15;
    const LP_pct = bidType === 'nenhum' ? 0 : bidType === 'embutido' ? 0 : bidType === 'fixo' ? 15 : proprioPct;

    let sumCredit = 0;
    let sumCurrentInstallment = 0;
    let sumNetCredit = 0;
    let sumNewInstallment = 0;
    let maxNewRemainingMonths = 0;
    let sumLeVal = 0;
    let sumLpVal = 0;
    let sumTotalBid = 0;
    let sumSaldoDevedor = 0;
    let sumResidueTotal = 0;

    quotas.forEach(q => {
      const safeTerm = q.term > 0 ? q.term : 1;
      const adminFeeNum = Number(q.adminFee.replace(',', '.')) || 0;
      const reserveFundNum = Number(q.reserveFund.replace(',', '.')) || 0;
      
      const totalFees = q.credit * (adminFeeNum + reserveFundNum) / 100;
      const monthlyFee = totalFees / safeTerm;
      const fullAmortization = q.credit / safeTerm;
      
      const reducedAmortization = fullAmortization * (1 - R);
      const qCurrentInstallment = reducedAmortization + monthlyFee;

      const qMonthsPaid = Math.min(monthsPaid, q.term);

      const unpaidCredit = q.credit - (qMonthsPaid * reducedAmortization);
      const unpaidFees = totalFees - (qMonthsPaid * monthlyFee);
      const qSaldoDevedor = Math.max(0, unpaidCredit + unpaidFees);
      
      const qResidueTotal = (fullAmortization * R) * qMonthsPaid;
      const remainingMonths = q.term - qMonthsPaid;
      const recalculatedInstallment = remainingMonths > 0 ? qSaldoDevedor / remainingMonths : 0;

      const qLeVal = q.credit * (LE_pct / 100);
      const qLpVal = q.credit * (LP_pct / 100);
      const qTotalBid = qLeVal + qLpVal;
      const qNetCredit = q.credit - qLeVal;

      let newSD = Math.max(0, qSaldoDevedor - qTotalBid);
      let qNewInstallment = 0;
      let qNewRemainingMonths = 0;

      if (bidType === 'nenhum') {
        qNewRemainingMonths = remainingMonths;
        qNewInstallment = recalculatedInstallment;
      } else if (postContemplation === 'diluido') {
        qNewRemainingMonths = remainingMonths;
        qNewInstallment = qNewRemainingMonths > 0 ? newSD / qNewRemainingMonths : 0;
      } else {
        qNewInstallment = recalculatedInstallment;
        qNewRemainingMonths = qNewInstallment > 0 ? Math.ceil(newSD / qNewInstallment) : 0;
      }

      sumCredit += q.credit;
      sumCurrentInstallment += qCurrentInstallment;
      sumNetCredit += qNetCredit;
      sumNewInstallment += qNewInstallment;
      if (qNewRemainingMonths > maxNewRemainingMonths) {
        maxNewRemainingMonths = qNewRemainingMonths;
      }
      sumLeVal += qLeVal;
      sumLpVal += qLpVal;
      sumTotalBid += qTotalBid;
      sumSaldoDevedor += qSaldoDevedor;
      sumResidueTotal += qResidueTotal;
    });

    return {
      totalCredit: sumCredit,
      currentInstallment: sumCurrentInstallment,
      netCredit: sumNetCredit,
      newInstallment: sumNewInstallment,
      newRemainingMonths: maxNewRemainingMonths,
      leVal: sumLeVal,
      lpVal: sumLpVal,
      totalBid: sumTotalBid,
      saldoDevedor: sumSaldoDevedor,
      residueTotal: sumResidueTotal
    };
  }, [quotas, plan, monthsPaid, bidType, embutidoPct, proprioPct, postContemplation]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-amber-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="text-center flex flex-col items-center justify-center space-y-3">
          <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
            <Car className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent tracking-tight">
            Simulador de contemplação
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
            Alta performance, precisão matemática e clareza comercial.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          <div className="md:col-span-7 space-y-6">
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-amber-400" />
                  Composição do Crédito
                </h2>
                {quotas.length < 6 && (
                  <button onClick={addQuota} className="text-sm bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg font-medium hover:bg-amber-500/30 transition-colors flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Adicionar Cota
                  </button>
                )}
              </div>
              
              <div className="space-y-4 mb-6">
                {quotas.map((q, index) => (
                  <div key={q.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl relative">
                    {quotas.length > 1 && (
                      <button onClick={() => removeQuota(q.id)} className="absolute top-3 right-3 text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <h3 className="text-sm font-medium text-slate-400 mb-3">Cota {index + 1}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div className="space-y-1 col-span-2 sm:col-span-1 lg:col-span-1">
                        <label className="text-xs text-slate-500">Grupo</label>
                        <input type="text" value={q.group} onChange={(e) => updateQuota(q.id, 'group', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 text-white" placeholder="Ex: 2001" />
                      </div>
                      <div className="space-y-1 col-span-2 sm:col-span-2 lg:col-span-2">
                        <label className="text-xs text-slate-500">Crédito (R$)</label>
                        <input type="text" inputMode="numeric" value={q.credit === 0 ? '' : q.credit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          updateQuota(q.id, 'credit', Number(val) / 100);
                        }} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 text-amber-400 font-bold" placeholder="0,00" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">Prazo</label>
                        <input type="text" inputMode="numeric" value={q.term === 0 ? '' : q.term} onChange={(e) => updateQuota(q.id, 'term', Number(e.target.value.replace(/\D/g, '')))} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 text-white" placeholder="180" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">Tx. Adm(%)</label>
                        <input type="text" inputMode="decimal" value={q.adminFee} onChange={(e) => updateQuota(q.id, 'adminFee', e.target.value.replace(/[^0-9.,]/g, ''))} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 text-white" placeholder="0,00" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">F. Res(%)</label>
                        <input type="text" inputMode="decimal" value={q.reserveFund} onChange={(e) => updateQuota(q.id, 'reserveFund', e.target.value.replace(/[^0-9.,]/g, ''))} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 text-white" placeholder="0,00" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 group relative">
                  <label className="text-sm font-medium text-slate-400">Tipo de Plano</label>
                  <Info className="w-4 h-4 text-slate-500 cursor-help" />
                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-64 p-3 bg-slate-800 text-xs text-slate-300 rounded-lg shadow-xl border border-slate-700 z-10">
                    <p className="mb-1"><strong className="text-amber-400">Integral:</strong> Parcela calculada sobre 100% do crédito.</p>
                    <p className="mb-1"><strong className="text-amber-400">Reduzido 25%:</strong> Parcela calculada sobre 75% do crédito até a contemplação.</p>
                    <p><strong className="text-amber-400">Reduzido 40%:</strong> Parcela calculada sobre 60% do crédito até a contemplação.</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'integral', label: 'Integral' },
                    { id: 'reduzido25', label: 'Reduzido 25%' },
                    { id: 'reduzido40', label: 'Reduzido 40%' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPlan(p.id as any)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        plan === p.id 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' 
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-blue-400" />
                Estratégia de Lance
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-400 block">Mês da Contemplação</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={monthsPaid === 0 ? '' : monthsPaid} 
                        onChange={(e) => {
                          const val = Number(e.target.value.replace(/\D/g, ''));
                          if (maxTerm > 0 && val >= maxTerm) {
                            setMonthsPaid(Math.max(1, maxTerm - 1));
                          } else {
                            setMonthsPaid(val);
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-lg focus:outline-none focus:border-blue-500 text-blue-400 font-bold"
                        placeholder="Ex: 5"
                      />
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        <span className="text-slate-500 font-medium">Mês</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      Simula o pagamento de {monthsPaid || 0} parcela(s) antes do lance.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-medium text-slate-400 block text-center md:text-left">Selecione o Tipo de Lance</label>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                      {[
                        { id: 'nenhum', label: 'Sem Lance' },
                        { id: 'embutido', label: 'Embutido' },
                        { id: 'fixo', label: 'Fixo (30%)' },
                        { id: 'livre', label: 'Livre' }
                      ].map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setBidType(b.id as any)}
                          className={`py-2.5 px-5 rounded-xl text-sm font-medium transition-all duration-200 ${
                            bidType === b.id 
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)] scale-105' 
                              : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:scale-105'
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {bidType === 'embutido' && (
                    <div className="space-y-4 p-5 bg-slate-950/50 rounded-xl border border-blue-500/20 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                      <div className="flex justify-between items-end">
                        <label className="text-sm font-medium text-slate-300">Lance Embutido (%)</label>
                        <span className="text-xl font-bold text-blue-400">{embutidoPct}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" max="15" step="1" 
                        value={embutidoPct} 
                        onChange={(e) => setEmbutidoPct(Number(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-4 flex gap-3 items-start">
                        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-slate-300 space-y-1">
                          <p><strong>Limite Máximo:</strong> 15% do valor do crédito.</p>
                          <p><strong>Impacto:</strong> O valor do lance ({formatCurrency(totalCredit * (embutidoPct / 100))}) será descontado do seu crédito, resultando em um Crédito Líquido de <strong className="text-amber-400">{formatCurrency(totalCredit - (totalCredit * (embutidoPct / 100)))}</strong>.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {bidType === 'fixo' && (
                    <div className="space-y-4 p-5 bg-slate-950/50 rounded-xl border border-blue-500/20 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                      <h3 className="text-sm font-medium text-slate-300 mb-2">Composição do Lance Fixo (30%)</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                          <p className="text-xs text-slate-500 mb-1">Lance Embutido (15%)</p>
                          <p className="text-lg font-bold text-blue-400">{formatCurrency(totalCredit * 0.15)}</p>
                        </div>
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                          <p className="text-xs text-slate-500 mb-1">Recurso Próprio (15%)</p>
                          <p className="text-lg font-bold text-blue-400">{formatCurrency(totalCredit * 0.15)}</p>
                        </div>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-2 flex gap-3 items-start">
                        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-300">
                          O lance fixo é estritamente composto por 15% embutido (reduz o crédito líquido para <strong className="text-amber-400">{formatCurrency(totalCredit * 0.85)}</strong>) e 15% pagos com recursos próprios.
                        </p>
                      </div>
                    </div>
                  )}

                  {bidType === 'livre' && (
                    <div className="space-y-4 p-5 bg-slate-950/50 rounded-xl border border-blue-500/20 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                      
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 mb-4 flex justify-between items-center">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Lance Embutido Obrigatório</p>
                          <p className="text-sm font-medium text-slate-300">Fixado em 15%</p>
                        </div>
                        <p className="text-lg font-bold text-blue-400">{formatCurrency(totalCredit * 0.15)}</p>
                      </div>

                      <div className="flex justify-between items-end">
                        <label className="text-sm font-medium text-slate-300">Recurso Próprio (%)</label>
                        <span className="text-xl font-bold text-blue-400">{proprioPct}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="85" step="1" 
                        value={proprioPct} 
                        onChange={(e) => setProprioPct(Number(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1 mb-2">
                        <span>0%</span>
                        <span>85%</span>
                      </div>
                      
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4 flex justify-between items-center">
                        <div>
                          <p className="text-sm text-blue-400 font-medium mb-1">Total Ofertado ({15 + proprioPct}%)</p>
                          <p className="text-xs text-slate-400">Embutido + Próprio</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-400">{formatCurrency(totalCredit * ((15 + proprioPct) / 100))}</p>
                      </div>
                    </div>
                  )}

                  {bidType !== 'nenhum' && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-400">Como aplicar o lance?</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setPostContemplation('diluido')}
                          className={`py-3 px-4 rounded-xl text-sm font-medium transition-colors flex flex-col items-center gap-1 ${
                            postContemplation === 'diluido' 
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' 
                              : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          <span>Reduzir Parcela</span>
                          <span className="text-[10px] opacity-70">Mantém o prazo</span>
                        </button>
                        <button
                          onClick={() => setPostContemplation('normal')}
                          className={`py-3 px-4 rounded-xl text-sm font-medium transition-colors flex flex-col items-center gap-1 ${
                            postContemplation === 'normal' 
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' 
                              : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          <span>Reduzir Prazo</span>
                          <span className="text-[10px] opacity-70">Mantém a parcela</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </section>
          </div>

          <div className="md:col-span-5">
            <div className="sticky top-8 space-y-6">
              <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-1 shadow-2xl">
                <div className="bg-slate-900 rounded-[22px] p-6 h-full">
                  
                  <div className="text-center mb-8">
                    <p className="text-sm font-medium text-slate-400 mb-1">Parcela Hoje</p>
                    <div className="text-4xl font-black text-white tracking-tight">
                      {formatCurrency(currentInstallment)}
                    </div>
                    {plan !== 'integral' && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium">
                        <Percent className="w-3 h-3" />
                        Plano Mais Fácil ({plan === 'reduzido25' ? '25%' : '40%'})
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Crédito Total</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(totalCredit)}</p>
                      </div>
                      <Calculator className="w-6 h-6 text-slate-600" />
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Crédito Líquido</p>
                        <p className="text-lg font-bold text-amber-400">{formatCurrency(netCredit)}</p>
                      </div>
                      <DollarSign className="w-6 h-6 text-amber-500/50" />
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Parcela Pós-Contemplação</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(newInstallment)}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-600" />
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Prazo Restante</p>
                        <p className="text-lg font-bold text-white">{newRemainingMonths} meses</p>
                      </div>
                      <Calendar className="w-5 h-5 text-slate-600" />
                    </div>
                  </div>

                  {bidType !== 'nenhum' && (
                    <div className="mt-6 pt-6 border-t border-slate-800">
                      <h3 className="text-sm font-semibold text-slate-300 mb-4">Composição do Lance</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Lance Embutido</span>
                          <span className="font-medium text-slate-300">{formatCurrency(leVal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Recurso Próprio</span>
                          <span className="font-medium text-slate-300">{formatCurrency(lpVal)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-800/50">
                          <span className="text-slate-400 font-medium">Total Ofertado</span>
                          <span className="font-bold text-blue-400">{formatCurrency(totalBid)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {saldoDevedor - totalBid <= 0 && totalBid > 0 && (
                    <div className="mt-4 p-3 bg-amber-500/20 border border-amber-500/50 rounded-xl text-amber-400 text-sm font-medium text-center">
                      Consórcio Quitado! 🎉
                    </div>
                  )}

                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-4 flex gap-3 text-sm text-slate-400">
                <Info className="w-5 h-5 text-slate-500 shrink-0" />
                <p>
                  A Taxa de Administração e Fundo de Reserva incidem sobre 100% do crédito de cada cota. 
                  {plan !== 'integral' && ` O resíduo acumulado até a contemplação (${formatCurrency(residueTotal)}) foi redistribuído no saldo devedor.`}
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
