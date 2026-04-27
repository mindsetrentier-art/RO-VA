/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import {
  FileText, Shield, Sparkles, TrendingUp, AlertTriangle, ChevronRight, Activity,
  PieChart, Home, Layers, Settings, Zap, BarChart3, Wallet, DollarSign, Target, CheckCircle, Download, Scale
} from 'lucide-react';
import { useSimulationStore, ScenarioType } from './store';
import { runSimulation, generateScenarios } from './lib/finance';

// --- Utils ---
export function useCountUp(value: number, format?: (v: number) => string) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    let start = display;
    const distance = value - start;
    const duration = 500; // ms
    let startTime: number | null = null;

    const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4);

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeProgress = easeOutQuart(progress);
      
      setDisplay(start + distance * easeProgress);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
          setDisplay(value); // ensure exact final value
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  return format ? format(display) : display.toFixed(0);
}

// --- Components ---
const Card = ({ children, className = "" }: any) => (
  <div className={`bg-[#111827]/80 backdrop-blur-xl border border-white/10 rounded-[16px] shadow-sm p-6 card-hover ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, className = "", icon: Icon, variant = "primary" }: any) => {
  const isPrimary = variant === "primary";
  return (
    <button 
      onClick={onClick}
      className={`w-full relative group overflow-hidden px-4 py-3 rounded-xl font-medium transition-all hover:-translate-y-0.5 active:translate-y-0 ${
        isPrimary 
          ? "text-white shadow-lg hover:shadow-xl shadow-[#7C5CFF]/20" 
          : "bg-[#1F2937] text-white hover:bg-[#374151] border border-white/10"
      } ${className}`}
    >
      {isPrimary && <div className="absolute inset-0 bg-gradient-to-r from-[#7C5CFF] to-[#2563EB] opacity-90 group-hover:opacity-100 transition-opacity"></div>}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {Icon && <Icon size={18} />}
        {children}
      </div>
    </button>
  );
};

const KPICard = ({ title, value, trend, icon: Icon, prefix = "", suffix = "", colorClass="text-[#7C5CFF]", isCurrency = false }: any) => {
  const formattedValue = useCountUp(value, (v) => {
    if (isCurrency && v >= 1000000) return (v / 1000000).toFixed(1) + "M";
    if (isCurrency && v >= 1000) return (v / 1000).toFixed(1) + "k";
    if (v <= 100 && suffix === "%") return v.toFixed(1);
    return v.toFixed(0);
  });

  return (
    <Card className="flex flex-col justify-between overflow-hidden relative group p-5">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
      <div className="flex justify-between items-start mb-2 relative z-10">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{title}</p>
        {Icon && <Icon className={`w-5 h-5 ${colorClass}`} strokeWidth={2.5} />}
      </div>
      <div className="relative z-10 mt-1">
        <motion.p
          key={value}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-2xl lg:text-3xl font-bold text-white tabular-nums"
        >
          {prefix}{formattedValue}{suffix}
        </motion.p>
        <p className="text-xs text-gray-500 font-medium mt-1">{trend}</p>
      </div>
    </Card>
  );
};

const ScenarioToggle = ({ value, setValue }: { value: ScenarioType, setValue: (val: ScenarioType) => void }) => {
  const options: ScenarioType[] = ["Pessimiste", "Réaliste", "Optimiste"];
  return (
    <div className="flex bg-[#111827] border border-white/10 rounded-xl p-1 relative shadow-inner">
      {options.map((opt) => {
        const isActive = value === opt;
        return (
          <button
            key={opt}
            onClick={() => setValue(opt)}
            className={`flex-1 py-2 lg:py-2.5 text-xs lg:text-sm font-semibold rounded-lg z-10 transition-all ${
              isActive ? "text-white" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {opt}
          </button>
        );
      })}
      <div 
        className="absolute top-1 bottom-1 w-[calc(33.33%-4px)] bg-gradient-to-r from-[#7C5CFF] to-[#2563EB] rounded-lg transition-transform duration-300 ease-out shadow-lg"
        style={{ transform: `translateX(${options.indexOf(value) * 100}%)` }}
      />
    </div>
  );
};

const InsightsCard = ({ insights, title = "Analyses Récentes" }: any) => (
  <Card className="p-0 overflow-hidden">
    <div className="p-5 border-b border-white/5 flex items-center gap-2">
      <Sparkles size={18} className="text-[#7C5CFF]" />
      <h3 className="font-semibold text-white">{title}</h3>
    </div>
    <div className="flex flex-col">
      {insights.map((i: any, idx: number) => (
        <div key={idx} className="flex items-start gap-4 p-5 hover:bg-white/5 transition-colors cursor-pointer group border-b border-white/5 last:border-0 relative">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${i.color}1a` }}>
            <i.icon size={18} style={{ color: i.color }} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white mb-1 group-hover:text-[#7C5CFF] transition-colors">{i.title}</h4>
            <p className="text-xs text-gray-400 leading-relaxed">{i.desc}</p>
          </div>
          <ChevronRight size={16} className="text-gray-500 group-hover:text-white transition-colors mt-2" />
        </div>
      ))}
    </div>
  </Card>
);

const PremiumSlider = ({ label, value, onChange, min, max, format, icon: Icon }: any) => {
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-gray-400">
           {Icon && <Icon size={16} />}
           <label className="text-xs font-semibold uppercase tracking-widest">{label}</label>
        </div>
        <span className="text-sm font-bold text-[#7C5CFF] tabular-nums bg-[#7C5CFF]/10 px-3 py-1 rounded-md border border-[#7C5CFF]/20">
          {format(value)}
        </span>
      </div>
      <div className="relative pt-1 pb-2 group">
        <input
          type="range"
          min={min}
          max={max}
          step={(max-min)/100}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="slider-custom"
          style={{
             background: `linear-gradient(to right, #7C5CFF ${(value-min)/(max-min)*100}%, rgba(255,255,255,0.1) ${(value-min)/(max-min)*100}%)`
          }}
        />
      </div>
    </div>
  );
};


// --- Views ---

const DashboardView = () => {
  const store = useSimulationStore();
  const state = store as any; // easy access
  const results = runSimulation(state, state.activeScenario);
  
  // Fake chart data based on net profit
  const data = [
    { name: 'Jan', val: results.netProfit * 0.1 },
    { name: 'Fév', val: results.netProfit * 0.25 },
    { name: 'Mar', val: results.netProfit * 0.4 },
    { name: 'Avr', val: results.netProfit * 0.45 },
    { name: 'Mai', val: results.netProfit * 0.6 },
    { name: 'Juin', val: results.netProfit * 1.0 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="space-y-6 pb-28 max-w-lg mx-auto w-full pt-20 px-6"
    >
      <header>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Aperçu Financier</p>
        <div className="flex items-end gap-3 mb-1">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white tabular-nums tracking-tighter">
            €{(results.revenue / 1000000).toFixed(1)}M
          </h1>
          <div className="mb-1 flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold border border-emerald-500/20">
            <TrendingUp size={12} strokeWidth={3} />
            +{(state.annualGrowth).toFixed(1)}%
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-6">Revenus projetés (Scénario {state.activeScenario})</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <KPICard 
          title="Bénéfice Net" 
          value={results.netProfit} 
          trend="Marge opérationnelle saine"
          icon={Wallet}
          prefix="€"
          isCurrency={true}
          colorClass="text-[#10B981]"
        />
        <KPICard 
          title="ROI" 
          value={results.roi} 
          trend="Objectif dépassé"
          icon={Target}
          suffix="%"
          colorClass="text-[#7C5CFF]"
        />
      </div>

      <Card>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-white">Performance (YTD)</h3>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C5CFF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#7C5CFF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} dy={10} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
                cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                formatter={(value: number) => [`€${(value / 1000000).toFixed(2)}M`, 'Bénéfice']}
              />
              <Area type="monotone" dataKey="val" stroke="#7C5CFF" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      <InsightsCard 
        title="Alertes & Opportunités"
        insights={[
          { title: "Croissance Aggressive", desc: "Le modèle actuel suggère un fort potentiel sur T4.", icon: Sparkles, color: "#7C5CFF" },
          { title: "Couverture Prudente", desc: "Augmentez le stock de sécurité de 10% pour pallier les ruptures.", icon: Shield, color: "#10B981" }
        ]} 
      />
    </motion.div>
  );
};


const SimulationView = () => {
  const store = useSimulationStore();
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="space-y-6 pb-36 max-w-lg mx-auto w-full pt-20 px-6"
    >
      <header>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Mode Bac à sable</p>
        <h1 className="text-2xl font-bold text-white tracking-tight mb-4">Labo de Simulation</h1>
        <ScenarioToggle value={store.activeScenario} setValue={store.setActiveScenario} />
      </header>

      <Card className="p-6">
        <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-3">
          <Wallet className="text-[#7C5CFF]" size={16} /> Investissement
        </h3>
        <PremiumSlider 
          label="Capital Initial" 
          value={store.initialCapital} 
          min={500000} max={10000000} 
          format={(v: number) => `€${(v/1000000).toFixed(2)}M`}
          onChange={store.setInitialCapital}
        />
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-3">
          <TrendingUp className="text-[#10B981]" size={16} /> Revenus & Croissance
        </h3>
        <PremiumSlider 
           label="Volume (Unités)" value={store.volume} min={100} max={5000} 
           format={(v: number) => `${v.toFixed(0)} u.`} onChange={store.setVolume}
        />
        <PremiumSlider 
           label="Prix Unitaire" value={store.unitPrice} min={50} max={1500} 
           format={(v: number) => `€${v.toFixed(0)}`} onChange={store.setUnitPrice}
        />
        <PremiumSlider 
           label="Croissance Annuelle" value={store.annualGrowth} min={0} max={100} 
           format={(v: number) => `${v.toFixed(1)}%`} onChange={store.setAnnualGrowth}
        />
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-3">
          <BarChart3 className="text-[#F59E0B]" size={16} /> Structure des Coûts
        </h3>
        <PremiumSlider 
           label="Coût Unitaire (COGS)" value={store.unitCost} min={20} max={1000} 
           format={(v: number) => `€${v.toFixed(0)}`} onChange={store.setUnitCost}
        />
        <PremiumSlider 
           label="Dépenses Marketing" value={store.marketingExpense} min={0} max={50} 
           format={(v: number) => `${v.toFixed(1)}%`} onChange={store.setMarketingExpense}
        />
      </Card>
      
      <Card className="p-6 mb-28">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
          <Scale className="text-[#3B82F6]" size={16} /> Analyse de Sensibilité (ROI)
        </h3>
        <p className="text-xs text-gray-400 mb-6 font-medium">Impact des variations de prix et de coûts sur votre ROI projeté.</p>
        <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-medium bg-[#111827] rounded-xl border border-white/5 overflow-hidden">
           <div className="flex items-center justify-center text-gray-500 bg-white/5 p-2 font-bold tracking-wider">COÛT \ PRIX</div>
           <div className="flex items-center justify-center text-gray-400 bg-white/5 p-2 font-bold">-10%</div>
           <div className="flex items-center justify-center text-gray-400 bg-white/5 p-2 font-bold">BASE</div>
           <div className="flex items-center justify-center text-gray-400 bg-white/5 p-2 font-bold">+10%</div>
           
           {[-0.1, 0, 0.1].map(costShift => {
              const baseRoi = runSimulation(store as any, store.activeScenario).roi;
              return (
                <React.Fragment key={costShift}>
                   <div className="flex items-center justify-center text-gray-400 py-3 bg-white/5">
                     {costShift > 0 ? "+10%" : costShift < 0 ? "-10%" : "Base"}
                   </div>
                   {[-0.1, 0, 0.1].map(priceShift => {
                      const modifiedState = { ...store, unitPrice: store.unitPrice * (1 + priceShift), unitCost: store.unitCost * (1 + costShift) };
                      const cellRoi = runSimulation(modifiedState as any, store.activeScenario).roi;
                      const diff = cellRoi - baseRoi;
                      
                      let cellClass = "bg-[#111827] text-gray-300";
                      if (diff > 5) cellClass = "bg-[#10B981]/20 text-[#10B981] font-bold";
                      else if (diff > 0.1) cellClass = "bg-[#10B981]/10 text-[#10B981]";
                      else if (diff < -5) cellClass = "bg-[#EF4444]/20 text-[#EF4444] font-bold";
                      else if (diff < -0.1) cellClass = "bg-[#EF4444]/10 text-[#EF4444]";

                      return (
                        <div key={`${costShift}-${priceShift}`} className={`flex items-center justify-center py-3 tabular-nums ${cellClass}`}>
                          {cellRoi.toFixed(1)}%
                        </div>
                      )
                   })}
                </React.Fragment>
              )
           })}
        </div>
      </Card>

      {/* Sticky Bottom Bar for Simulation Results */}
      <div className="fixed bottom-[5.5rem] left-0 right-0 p-4 z-40 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/90 to-transparent pointer-events-none flex justify-center">
         <div className="bg-[#111827] border border-[#7C5CFF]/30 shadow-[0_0_30px_rgba(124,92,255,0.15)] rounded-2xl p-4 flex items-center justify-between w-full max-w-lg pointer-events-auto">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">ROI PROJETÉ</p>
              <div className="flex items-center gap-2">
                 <span className="text-2xl font-bold text-white tabular-nums">{runSimulation(store as any, store.activeScenario).roi.toFixed(1)}%</span>
                 <TrendingUp className="text-[#10B981]" size={16} />
              </div>
            </div>
            <div className="w-px h-10 bg-white/10"></div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">BÉNÉFICE NET</p>
              <p className="text-xl font-bold text-[#7C5CFF] tabular-nums">€{(runSimulation(store as any, store.activeScenario).netProfit / 1000000).toFixed(2)}M</p>
            </div>
         </div>
      </div>
    </motion.div>
  );
}


const ScenariosView = () => {
  const store = useSimulationStore();
  const scenarios = generateScenarios(store as any);
  
  const chartData = [
    { name: 'T1', Pessimiste: scenarios.Pessimiste.netProfit * 0.2, Réaliste: scenarios.Réaliste.netProfit * 0.25, Optimiste: scenarios.Optimiste.netProfit * 0.3 },
    { name: 'T2', Pessimiste: scenarios.Pessimiste.netProfit * 0.4, Réaliste: scenarios.Réaliste.netProfit * 0.5, Optimiste: scenarios.Optimiste.netProfit * 0.65 },
    { name: 'T3', Pessimiste: scenarios.Pessimiste.netProfit * 0.65, Réaliste: scenarios.Réaliste.netProfit * 0.75, Optimiste: scenarios.Optimiste.netProfit * 0.9 },
    { name: 'T4', Pessimiste: scenarios.Pessimiste.netProfit, Réaliste: scenarios.Réaliste.netProfit, Optimiste: scenarios.Optimiste.netProfit },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="space-y-6 pb-28 max-w-lg mx-auto w-full pt-20 px-6"
    >
      <header>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Analyse Comparative</p>
        <h1 className="text-2xl font-bold text-white tracking-tight">Scénarios</h1>
      </header>

      <Card className="overflow-hidden p-0">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">TRÉSORERIE FIN D'ANNÉE</p>
              <div className="flex items-center gap-2">
                 <span className="text-3xl font-bold text-white">€{(scenarios[store.activeScenario].netProfit / 1000000).toFixed(1)}M</span>
              </div>
            </div>
            <div className="bg-[#7C5CFF]/10 text-[#7C5CFF] border border-[#7C5CFF]/20 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
               {store.activeScenario}
            </div>
        </div>
        
        <div className="h-56 w-full p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRealiste" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C5CFF" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} dy={10} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number, name: string) => [`€${(value / 1000000).toFixed(2)}M`, name]}
              />
              <Area type="monotone" dataKey="Optimiste" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" fill="none" opacity={0.5} />
              <Area type="monotone" dataKey="Réaliste" stroke="#7C5CFF" strokeWidth={3} fillOpacity={1} fill="url(#colorRealiste)" />
              <Area type="monotone" dataKey="Pessimiste" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" fill="none" opacity={0.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest text-gray-400">Variance de Trésorerie</h3>
        <div className="space-y-4">
          {(["Optimiste", "Réaliste", "Pessimiste"] as ScenarioType[]).map((type) => (
             <div key={type} className={`flex justify-between items-center p-3 rounded-lg border ${
                store.activeScenario === type 
                  ? "bg-[#7C5CFF]/10 border-[#7C5CFF]/30" 
                  : "bg-transparent border-transparent hover:bg-white/5"
             }`} onClick={() => store.setActiveScenario(type)}>
                <span className={`font-medium ${store.activeScenario === type ? "text-[#7C5CFF]" : "text-gray-300"}`}>{type}</span>
                <span className={`font-bold tabular-nums ${store.activeScenario === type ? "text-white" : "text-gray-400"}`}>
                   €{(scenarios[type].netProfit / 1000000).toFixed(2)}M
                </span>
             </div>
          ))}
        </div>
      </Card>

      <div className="space-y-3">
        <Button icon={CheckCircle}>
          Appliquer ce modèle au Budget
        </Button>
        <Button icon={Download} variant="secondary">
          Exporter le Rapport PDF
        </Button>
      </div>
    </motion.div>
  );
}


const InsightsView = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="space-y-6 pb-28 max-w-lg mx-auto w-full pt-20 px-6"
    >
      <header className="mb-2">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Analyses IA</h1>
        <p className="text-sm text-gray-400">Analyse propulsée par l'intelligence artificielle pour optimiser vos décisions.</p>
      </header>

      <div className="flex justify-between items-center mb-[-0.5rem]">
        <h2 className="font-semibold text-white">Analyse des Risques</h2>
        <span className="text-[10px] font-bold px-2 py-1 bg-[#EF4444]/10 text-[#EF4444] rounded-md border border-[#EF4444]/20 flex items-center gap-1 uppercase tracking-wide">
          <AlertTriangle size={12} fill="currentColor" /> Alerte Critique
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <KPICard 
          title="Volatilité Marché" 
          value={12.4} 
          trend="Risque Élevé"
          icon={TrendingUp}
          suffix="%"
          colorClass="text-[#EF4444]"
        />
        <KPICard 
          title="Couverture" 
          value={84} 
          trend="Sain"
          icon={Shield}
          suffix="%"
          colorClass="text-[#2563EB]"
        />
      </div>

      <Card className="border-l-4 border-l-[#EF4444] bg-gradient-to-r from-[#EF4444]/5 to-transparent relative overflow-hidden p-5">
        <div className="flex gap-4 relative z-10">
          <div className="mt-0.5">
            <AlertTriangle className="text-[#EF4444]" fill="currentColor" size={20} />
          </div>
          <div>
            <h3 className="text-white font-semibold mb-1">Risque de Liquidité Détecté</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Vos réserves de trésorerie approchent des seuils critiques. Les sorties prévues dépassent les liquidités actuelles de 12% pour le T4 en raison de l'augmentation des OPEX.
            </p>
          </div>
        </div>
      </Card>

      <h2 className="font-semibold text-white pt-2">Optimisation Recommandée</h2>

      <Card className="p-0 border-[#7C5CFF]/30 shadow-[0_0_30px_rgba(124,92,255,0.05)] overflow-hidden">
        <div className="h-32 bg-gradient-to-br from-[#7C5CFF]/20 to-[#2563EB]/10 relative overflow-hidden flex items-center px-6 border-b border-white/5">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <PieChart size={120} />
          </div>
          <span className="bg-[#2563EB] text-white text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-widest shadow-lg">Stratégique</span>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-2">Réallocation d'Actifs</h3>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            Transférez 15% des actions Tech sous-performantes vers des marchés émergents à haut rendement. Ce mouvement devrait augmenter le rendement annuel de <span className="text-[#7C5CFF] font-bold">2,4%</span> tout en maintenant votre profil de risque.
          </p>
          <Button icon={Zap}>
            Exécuter la Recommandation
          </Button>
        </div>
      </Card>

      <InsightsCard 
        insights={[
          { title: "Optimisation Fiscale", desc: "La récupération des pertes dans le secteur de l'énergie pourrait économiser 12 400 €.", icon: FileText, color: "#2563EB" },
          { title: "Impact ESG", desc: "Le score de durabilité est passé à A+ ce mois-ci, réduisant potentiellement le coût du capital.", icon: Activity, color: "#10B981" }
        ]} 
      />
    </motion.div>
  );
}

// --- App ---
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-[#0F172A] font-sans text-gray-200 selection:bg-[#7C5CFF]/30 relative overflow-x-hidden">
      
      {/* Background Ambient Glow */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#7C5CFF]/10 blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#2563EB]/10 blur-[120px] pointer-events-none"></div>

      {/* TopNav */}
      <header className="fixed top-0 w-full z-50 bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/5 flex justify-between items-center px-6 h-16 w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7C5CFF] to-[#2563EB] flex items-center justify-center overflow-hidden border border-white/20 shadow-lg shadow-[#7C5CFF]/20">
            <span className="text-white font-bold text-xs tracking-tighter">RV</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-display">Roïva</span>
        </div>
        <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden bg-white/5 shadow-sm">
          <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop" alt="Profile" className="w-full h-full object-cover" />
        </div>
      </header>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === "dashboard" && <DashboardView key="dashboard" />}
        {activeTab === "simulation" && <SimulationView key="simulation" />}
        {activeTab === "scenarios" && <ScenariosView key="scenarios" />}
        {activeTab === "analyses" && <InsightsView key="analyses" />}
      </AnimatePresence>

      {/* BottomNav */}
      <nav className="fixed bottom-0 w-full z-50 bg-[#0F172A]/90 backdrop-blur-2xl border-t border-white/5 shadow-2xl flex justify-around items-center h-[5.5rem] px-2 pb-6 max-w-lg mx-auto left-0 right-0 rounded-t-3xl">
        <NavItem 
          icon={Home} 
          label="Dashboard" 
          active={activeTab === "dashboard"} 
          onClick={() => setActiveTab("dashboard")} 
        />
        <NavItem 
          icon={Activity} 
          label="Simulation" 
          active={activeTab === "simulation"} 
          onClick={() => setActiveTab("simulation")} 
        />
        <NavItem 
          icon={Layers} 
          label="Scénarios" 
          active={activeTab === "scenarios"} 
          onClick={() => setActiveTab("scenarios")} 
        />
        <NavItem 
          icon={Sparkles} 
          label="Analyses IA" 
          active={activeTab === "analyses"} 
          onClick={() => setActiveTab("analyses")} 
          highlight={true}
        />
      </nav>
    </div>
  );
}

const NavItem = ({ icon: Icon, label, active, onClick, highlight = false }: any) => {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 w-[22%] group transition-all duration-300 ${active ? 'scale-105' : 'hover:scale-105'}`}
    >
      <div className={`relative flex items-center justify-center w-12 h-8 rounded-full overflow-hidden transition-all duration-300 ${active ? (highlight ? 'bg-gradient-to-r from-[#7C5CFF] to-[#2563EB] shadow-[0_0_15px_rgba(124,92,255,0.4)] text-white' : 'bg-white/10 text-white') : 'bg-transparent text-gray-500 group-hover:text-gray-300 group-hover:bg-white/5'}`}>
         <Icon 
           size={active ? 20 : 20} 
           className={`transition-colors duration-300`} 
           strokeWidth={active ? 2.5 : 2}
         />
      </div>
      <span className={`text-[9px] font-semibold tracking-wide mt-1.5 uppercase transition-colors duration-300 ${active ? 'text-white' : 'text-gray-500 group-hover:text-gray-400'}`}>
        {label}
      </span>
    </button>
  );
};
