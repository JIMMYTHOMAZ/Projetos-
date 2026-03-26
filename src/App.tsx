import React, { useState, useMemo } from 'react';
import { Calculator, DollarSign, Calendar, TrendingDown, Percent, ArrowRight, Info } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function App() {
  const [credit, setCredit] = useState<number>(100000);
  const [term, setTerm] = useState<number>(180);
  const [adminFee, setAdminFee] = useState<string>('15');
  const [reserveFund, setReserveFund] = useState<string>('2');
  const [plan, setPlan] = useState<'integral' | 'reduzido25' | 'reduzido40'>('integral');
  const [monthsPaid, setMonthsPaid] = useState<number>(1);
  
  const [bidType, setBidType] = useState<'nenhum' | 'embutido' | 'fixo' | 'livre'>('nenhum');
  const [embutidoPct, setEmbutidoPct] = useState<number>(15);
  const [proprioPct, setProprioPct] = useState<number>(15);
  
  const [postContemplation, setPostContemplation] = useState<'diluido' | 'normal'>('diluido');

  const {
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

    const safeTerm = term > 0 ? term : 1;
    const adminFeeNum = Number(adminFee.replace(',', '.')) || 0;
    const reserveFundNum = Number(reserveFund.replace(',', '.')) || 0;
    const totalFees = credit * (adminFeeNum + reserveFundNum) / 100;
    const monthlyFee = totalFees / safeTerm;
    const fullAmortization = credit / safeTerm;
    
    const reducedAmortization = fullAmortization * (1 - R);
    const currentInstallment = reducedAmortization + monthlyFee;

    const unpaidCredit = credit - (monthsPaid * reducedAmortization);
    const unpaidFees = totalFees - (monthsPaid * monthlyFee);
    const saldoDevedor = unpaidCredit + unpaidFees;
    
    const residueTotal = (fullAmortization * R) * monthsPaid;

    const remainingMonths = term - monthsPaid;
    const recalculatedInstallment = remainingMonths > 0 ? saldoDevedor / remainingMonths : 0;

    const leVal = credit * (LE_pct / 100);
    const lpVal = credit * (LP_pct / 100);
    const totalBid = leVal + lpVal;
    const netCredit = credit - leVal;

    let newSD = Math.max(0, saldoDevedor - totalBid);
    let newInstallment = 0;
    let newRemainingMonths = 0;

    if (bidType === 'nenhum') {
      newRemainingMonths = remainingMonths;
      newInstallment = recalculatedInstallment;
    } else if (postContemplation === 'diluido') {
      newRemainingMonths = remainingMonths;
      newInstallment = newRemainingMonths > 0 ? newSD / newRemainingMonths : 0;
    } else {
      newInstallment = recalculatedInstallment;
      newRemainingMonths = newInstallment > 0 ? Math.ceil(newSD / newInstallment) : 0;
    }

    return {
      currentInstallment,
      netCredit,
      newInstallment,
      newRemainingMonths,
      leVal,
      lpVal,
      totalBid,
      saldoDevedor,
      residueTotal
    };
  }, [credit, term, adminFee, reserveFund, plan, monthsPaid, bidType, embutidoPct, proprioPct, postContemplation]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Simulador de Consórcio PRO
          </h1>
          <p className="text-zinc-400 mt-2">Alta performance, precisão matemática e clareza comercial.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          <div className="md:col-span-7 space-y-6">
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-400" />
                Dados do Plano
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-zinc-400">Valor do Crédito</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-zinc-500 font-medium text-lg">R$</span>
                    </div>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={credit === 0 ? '' : credit} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setCredit(Number(val));
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-xl font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      placeholder="100000"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-zinc-400">Prazo (Meses)</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={term === 0 ? '' : term} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      const newTerm = Number(val);
                      setTerm(newTerm);
                      if (monthsPaid >= newTerm && newTerm > 0) setMonthsPaid(Math.max(1, newTerm - 1));
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xl font-bold text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    placeholder="180"
                  />
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <label className="text-sm font-medium text-zinc-400">Tipo de Plano</label>
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
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Taxa de Administração (%)</label>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    value={adminFee} 
                    onChange={(e) => setAdminFee(e.target.value.replace(/[^0-9.,]/g, ''))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Fundo de Reserva (%)</label>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    value={reserveFund} 
                    onChange={(e) => setReserveFund(e.target.value.replace(/[^0-9.,]/g, ''))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </section>

            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-cyan-400" />
                Estratégia de Lance
              </h2>

              <div className="space-y-3 mb-8">
                <label className="text-sm font-medium text-zinc-400 block">Mês da Contemplação</label>
                <div className="relative">
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={monthsPaid === 0 ? '' : monthsPaid} 
                    onChange={(e) => {
                      const val = Number(e.target.value.replace(/\D/g, ''));
                      if (val < term) {
                        setMonthsPaid(val);
                      }
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-lg focus:outline-none focus:border-cyan-500 text-cyan-400 font-bold"
                    placeholder="Ex: 5"
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <span className="text-zinc-500 font-medium">Mês</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500">
                  Simula o pagamento de {monthsPaid || 0} parcela(s) antes do lance.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <label className="text-sm font-medium text-zinc-400 block text-center">Selecione o Tipo de Lance</label>
                <div className="flex flex-wrap justify-center gap-3">
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
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-105' 
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:scale-105'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {bidType === 'embutido' && (
                <div className="space-y-4 mb-6 p-5 bg-zinc-950/50 rounded-xl border border-cyan-500/20 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                  <div className="flex justify-between items-end">
                    <label className="text-sm font-medium text-zinc-300">Lance Embutido (%)</label>
                    <span className="text-xl font-bold text-cyan-400">{embutidoPct}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" max="15" step="1" 
                    value={embutidoPct} 
                    onChange={(e) => setEmbutidoPct(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 mt-4 flex gap-3 items-start">
                    <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-zinc-300 space-y-1">
                      <p><strong>Limite Máximo:</strong> 15% do valor do crédito.</p>
                      <p><strong>Impacto:</strong> O valor do lance ({formatCurrency(credit * (embutidoPct / 100))}) será descontado do seu crédito, resultando em um Crédito Líquido de <strong className="text-emerald-400">{formatCurrency(credit - (credit * (embutidoPct / 100)))}</strong>.</p>
                    </div>
                  </div>
                </div>
              )}

              {bidType === 'fixo' && (
                <div className="space-y-4 mb-6 p-5 bg-zinc-950/50 rounded-xl border border-cyan-500/20 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                  <h3 className="text-sm font-medium text-zinc-300 mb-2">Composição do Lance Fixo (30%)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-1">Lance Embutido (15%)</p>
                      <p className="text-lg font-bold text-cyan-400">{formatCurrency(credit * 0.15)}</p>
                    </div>
                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-1">Recurso Próprio (15%)</p>
                      <p className="text-lg font-bold text-cyan-400">{formatCurrency(credit * 0.15)}</p>
                    </div>
                  </div>
                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 mt-2 flex gap-3 items-start">
                    <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-zinc-300">
                      O lance fixo é estritamente composto por 15% embutido (reduz o crédito líquido para <strong className="text-emerald-400">{formatCurrency(credit * 0.85)}</strong>) e 15% pagos com recursos próprios.
                    </p>
                  </div>
                </div>
              )}

              {bidType === 'livre' && (
                <div className="space-y-4 mb-6 p-5 bg-zinc-950/50 rounded-xl border border-cyan-500/20 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                  
                  <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 mb-4 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Lance Embutido Obrigatório</p>
                      <p className="text-sm font-medium text-zinc-300">Fixado em 15%</p>
                    </div>
                    <p className="text-lg font-bold text-cyan-400">{formatCurrency(credit * 0.15)}</p>
                  </div>

                  <div className="flex justify-between items-end">
                    <label className="text-sm font-medium text-zinc-300">Recurso Próprio (%)</label>
                    <span className="text-xl font-bold text-cyan-400">{proprioPct}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="85" step="1" 
                    value={proprioPct} 
                    onChange={(e) => setProprioPct(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-xs text-zinc-500 mt-1">
                    <span>0%</span>
                    <span>Total Ofertado: {15 + proprioPct}%</span>
                    <span>85%</span>
                  </div>
                </div>
              )}

              {bidType !== 'nenhum' && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-zinc-400">Como aplicar o lance?</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPostContemplation('diluido')}
                      className={`py-3 px-4 rounded-xl text-sm font-medium transition-colors flex flex-col items-center gap-1 ${
                        postContemplation === 'diluido' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      <span>Reduzir Parcela</span>
                      <span className="text-[10px] opacity-70">Mantém o prazo</span>
                    </button>
                    <button
                      onClick={() => setPostContemplation('normal')}
                      className={`py-3 px-4 rounded-xl text-sm font-medium transition-colors flex flex-col items-center gap-1 ${
                        postContemplation === 'normal' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      <span>Reduzir Prazo</span>
                      <span className="text-[10px] opacity-70">Mantém a parcela</span>
                    </button>
                  </div>
                </div>
              )}

            </section>
          </div>

          <div className="md:col-span-5">
            <div className="sticky top-8 space-y-6">
              <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700 rounded-3xl p-1 shadow-2xl">
                <div className="bg-zinc-900 rounded-[22px] p-6 h-full">
                  
                  <div className="text-center mb-8">
                    <p className="text-sm font-medium text-zinc-400 mb-1">Parcela Hoje</p>
                    <div className="text-4xl font-black text-white tracking-tight">
                      {formatCurrency(currentInstallment)}
                    </div>
                    {plan !== 'integral' && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                        <Percent className="w-3 h-3" />
                        Plano Mais Fácil ({plan === 'reduzido25' ? '25%' : '40%'})
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-zinc-500 font-medium">Crédito Líquido</p>
                        <p className="text-lg font-bold text-emerald-400">{formatCurrency(netCredit)}</p>
                      </div>
                      <DollarSign className="w-6 h-6 text-emerald-500/50" />
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-zinc-500 font-medium">Parcela Pós-Contemplação</p>
                        <p className="text-lg font-bold text-white">{formatCurrency(newInstallment)}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-zinc-600" />
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-zinc-500 font-medium">Prazo Restante</p>
                        <p className="text-lg font-bold text-white">{newRemainingMonths} meses</p>
                      </div>
                      <Calendar className="w-5 h-5 text-zinc-600" />
                    </div>
                  </div>

                  {bidType !== 'nenhum' && (
                    <div className="mt-6 pt-6 border-t border-zinc-800">
                      <h3 className="text-sm font-semibold text-zinc-300 mb-4">Composição do Lance</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Lance Embutido</span>
                          <span className="font-medium text-zinc-300">{formatCurrency(leVal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Recurso Próprio</span>
                          <span className="font-medium text-zinc-300">{formatCurrency(lpVal)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-zinc-800/50">
                          <span className="text-zinc-400 font-medium">Total Ofertado</span>
                          <span className="font-bold text-cyan-400">{formatCurrency(totalBid)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {saldoDevedor - totalBid <= 0 && totalBid > 0 && (
                    <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-400 text-sm font-medium text-center">
                      Consórcio Quitado! 🎉
                    </div>
                  )}

                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 flex gap-3 text-sm text-zinc-400">
                <Info className="w-5 h-5 text-zinc-500 shrink-0" />
                <p>
                  A Taxa de Administração ({adminFee}%) e Fundo de Reserva ({reserveFund}%) incidem sobre 100% do crédito. 
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
