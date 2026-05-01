/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import {
  FileText, Shield, Sparkles, TrendingUp, AlertTriangle, ChevronRight, Activity,
  PieChart, Home, Layers, Settings, Zap, BarChart3, Wallet, DollarSign, Target, CheckCircle, Download, Scale, Boxes, Pencil, Eye, X,
  Plus, Calculator, Info, Banknote, LifeBuoy, Mail, ShieldCheck, Gavel, Globe, ChevronDown, ChevronUp, ExternalLink,
  BookOpen, MousePointer2, Lightbulb, ArrowRight, Info as InfoIcon, Sun, Wind, Thermometer, Clock, Calendar, History, RotateCcw, Trash2
} from 'lucide-react';
import { useSimulationStore, ScenarioType, PeriodType } from './store';
import { runSimulation, generateScenarios } from './lib/finance';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Utils ---
const formatCurrency = (v: number, withM = true) => {
  if (withM && Math.abs(v) >= 1000000) return `€${(v / 1000000).toFixed(2)}M`;
  return `€${v.toLocaleString()}`;
};

export function useCountUp(value: number, format?: (v: number) => string) {
  const safeValue = isFinite(value) ? value : 0;
  const [display, setDisplay] = useState(safeValue);

  useEffect(() => {
    let start = isFinite(display) ? display : 0;
    const target = isFinite(value) ? value : 0;
    const distance = target - start;
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
const Card = ({ children, className = "", bgIcon: BgIcon = Shield }: any) => (
  <div className={`relative bg-[#0B0F1A] border border-white/10 rounded-[16px] shadow-sm p-6 card-hover overflow-hidden ${className}`}>
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 z-0">
      <BgIcon size={120} className="text-[#7C5CFF]" />
    </div>
    <div className="relative z-10">
      {children}
    </div>
  </div>
);

const Button = ({ children, onClick, className = "", icon: Icon, variant = "primary" }: any) => {
  const isPrimary = variant === "primary";
  
  return (
    <motion.button 
      onClick={onClick}
      whileHover={{ 
        scale: 1.01,
        backgroundColor: isPrimary ? undefined : "#374151",
        y: -2
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        duration: 0.3,
        ease: [0.23, 1, 0.32, 1] // Custom cubic-bezier for a "fluid" feel
      }}
      className={`w-full relative group overflow-hidden px-4 py-3 rounded-xl font-medium ${
        isPrimary 
          ? "text-white shadow-lg shadow-[#7C5CFF]/20" 
          : "bg-[#1F2937] text-white border border-white/10"
      } ${className}`}
    >
      {isPrimary && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-[#7C5CFF] to-[#2563EB]"
          initial={{ opacity: 0.9 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {Icon && <Icon size={18} />}
        {children}
      </div>
    </motion.button>
  );
};

const KPICard = ({ title, value, trend, icon: Icon, prefix = "", suffix = "", colorClass="text-[#7C5CFF]", isCurrency = false }: any) => {
  const formattedValue = useCountUp(value, (v) => {
    if (isCurrency) return formatCurrency(v).replace("€", "");
    if (suffix === "%" || suffix === "x") return v.toFixed(1);
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

const AnalysisModeToggle = ({ value, setValue }: { value: 'Product' | 'Project', setValue: (val: 'Product' | 'Project') => void }) => {
  return (
    <div className="flex bg-[#111827] border border-white/10 rounded-xl p-1 relative shadow-inner overflow-hidden">
      <button
        onClick={() => setValue('Product')}
        className={`px-4 py-1.5 text-[10px] font-bold rounded-lg z-10 transition-all ${
          value === 'Product' ? "text-white" : "text-gray-500 hover:text-gray-300"
        }`}
      >
        PRODUIT
      </button>
      <button
        onClick={() => setValue('Project')}
        className={`px-4 py-1.5 text-[10px] font-bold rounded-lg z-10 transition-all ${
          value === 'Project' ? "text-white" : "text-gray-500 hover:text-gray-300"
        }`}
      >
        PROJET
      </button>
      <motion.div 
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gradient-to-r from-[#7C5CFF] to-[#2563EB] rounded-lg shadow-lg"
        animate={{ x: value === 'Product' ? 0 : '100%' }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    </div>
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
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    if (!isEditing) {
      setInputValue(value.toString());
    }
  }, [value, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    const num = parseFloat(inputValue);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue(value.toString());
    }
  };

  const sliderVal = Math.min(Math.max(value, min), max);
  const percentage = (max - min) === 0 ? 0 : ((sliderVal - min) / (max - min) * 100);

  return (
    <div className="mb-6 last:mb-0">
      <div className="flex justify-between items-center mb-4 min-h-[32px]">
        <div className="flex items-center gap-2 text-gray-400">
           {Icon && <Icon size={16} />}
           <label className="text-xs font-semibold uppercase tracking-widest">{label}</label>
        </div>
        
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div 
              key="input"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <input 
                autoFocus
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="text-sm font-bold text-[#7C5CFF] tabular-nums bg-[#7C5CFF]/20 px-2 py-1 rounded-md border border-[#7C5CFF] text-right w-24 outline-none focus:ring-2 focus:ring-[#7C5CFF]/50"
              />
            </motion.div>
          ) : (
            <motion.div 
              key="value"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsEditing(true)}
              className="group/value cursor-pointer flex items-center gap-2"
            >
              <span 
                className="text-sm font-bold text-[#7C5CFF] tabular-nums bg-[#7C5CFF]/10 px-3 py-1 rounded-md border border-[#7C5CFF]/20 hover:bg-[#7C5CFF]/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                title="Cliquer pour saisir une valeur"
              >
                {format(value)}
                <Pencil size={10} className="opacity-0 group-hover/value:opacity-100 transition-opacity" />
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="relative pt-1 pb-2 group">
        <input
          type="range"
          min={min}
          max={max}
          step={(max-min)/100 || 1}
          value={sliderVal}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="slider-custom"
          style={{
             background: `linear-gradient(to right, #7C5CFF ${percentage}%, rgba(255,255,255,0.1) ${percentage}%)`
          }}
        />
      </div>
    </div>
  );
};


// --- Components ---

const QuickAddModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const store = useSimulationStore();
  const [localName, setLocalName] = useState(store.productName);
  const [localCost, setLocalCost] = useState(store.unitCost);
  const [coeff, setCoeff] = useState(3);
  const [weeklySales, setWeeklySales] = useState(store.targetSales);

  const price = localCost * coeff;
  const margin = price > 0 ? ((price - localCost) / price) * 100 : 0;
  
  const stockDuration = coeff >= 3 ? 2 : 1;
  const isHighCoeff = coeff >= 3;

  const handleApply = () => {
    store.setProductName(localName || "Nouveau Produit");
    store.setUnitCost(localCost);
    store.setUnitPrice(price);
    store.setTargetSales(weeklySales);
    store.setTargetSalesPeriod("Semaine");
    store.setVolume(weeklySales * 52); 
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-black/90 backdrop-blur-md" 
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.95, opacity: 0, y: 20 }} 
        className="bg-[#0F172A] border border-white/10 w-full max-w-sm rounded-[2rem] p-8 relative z-10 shadow-3xl overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#7C5CFF]/10 blur-[80px] -mr-16 -mt-16 rounded-full" />
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Plus className="text-[#7C5CFF]" size={24} /> AJOUT PROD.
          </h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Nom du Produit</label>
            <input 
              type="text" 
              value={localName} 
              onChange={(e) => setLocalName(e.target.value)}
              className="w-full bg-[#1e293b] border border-white/5 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-[#7C5CFF]/50 transition-all"
              placeholder="Ex: Sneakers Air"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Prix d'Achat</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={localCost} 
                  onChange={(e) => setLocalCost(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#1e293b] border border-white/5 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-[#7C5CFF]/50 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold">€</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Coefficient</label>
              <select 
                value={coeff} 
                onChange={(e) => setCoeff(parseFloat(e.target.value))}
                className="w-full bg-[#1e293b] border border-white/5 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-[#7C5CFF]/50 appearance-none transition-all"
              >
                <option value={2}>x2 (Standard)</option>
                <option value={2.5}>x2.5 (Bon)</option>
                <option value={3}>x3 (Excellent)</option>
                <option value={4}>x4 (Premium)</option>
                <option value={5}>x5 (Luxe)</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-[#7C5CFF]/5 rounded-2xl border border-[#7C5CFF]/10 flex justify-between items-center">
            <div>
              <p className="text-[9px] font-black text-[#7C5CFF] uppercase tracking-tighter">Prix de vente calculé</p>
              <p className="text-xl font-black text-white">€{price.toFixed(0)}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter">Marge</p>
              <p className="text-xl font-black text-emerald-400">{margin.toFixed(0)}%</p>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Ventes Hebdo. (u/sem)</label>
            <input 
              type="number" 
              value={weeklySales} 
              onChange={(e) => setWeeklySales(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#1e293b] border border-white/5 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-[#7C5CFF]/50 transition-all"
            />
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
             <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-full ${isHighCoeff ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                   <Info size={14} />
                </div>
                <p className="text-[11px] font-bold text-gray-300 leading-tight">
                   {isHighCoeff 
                     ? "Volume optimisé : Stockez pour 2 semaines." 
                     : "Volume serré : Commande recommandée chaque semaine."
                   }
                </p>
             </div>
             <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md w-fit">
                <span className="text-[9px] font-black text-gray-500 uppercase">Rotation suggérée</span>
                <span className={`text-[9px] font-black uppercase ${isHighCoeff ? 'text-emerald-400' : 'text-amber-400'}`}>
                   {stockDuration} Semaine{stockDuration > 1 ? 's' : ''}
                </span>
             </div>
          </div>
        </div>

        <button 
          onClick={handleApply}
          className="w-full mt-8 bg-gradient-to-r from-[#7C5CFF] to-[#2563EB] text-white font-black py-4 rounded-2xl shadow-xl shadow-[#7C5CFF]/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
        >
          Valider le Produit
        </button>
      </motion.div>
    </div>
  );
};

// --- Views ---

const DashboardView = () => {
  const store = useSimulationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const state = store as any; 
  const results = runSimulation(state, state.activeScenario);
  
  const score = useCountUp(results.roivaScore);

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
      <QuickAddModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      <header className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2 pr-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Aperçu {store.analysisMode === 'Product' ? 'Financier' : 'du Projet'}
              </p>
              <span className="text-[10px] text-[#7C5CFF] font-bold px-2 py-0.5 bg-[#7C5CFF]/10 rounded border border-[#7C5CFF]/20 uppercase">{store.productName}</span>
            </div>
            <div className="flex items-end gap-3 mb-1">
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white tabular-nums tracking-tighter">
                {formatCurrency(results.revenue)}
              </h1>
              <div className="mb-1 flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold border border-emerald-500/20">
                <TrendingUp size={12} strokeWidth={3} />
                +{(state.annualGrowth).toFixed(1)}%
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {store.analysisMode === 'Product' ? 'Revenus projetés' : 'Chiffre d\'affaires prévisionnel'} ({state.activeScenario})
            </p>
          </div>
          
          {/* Roïva Score Gauge */}
          <div className="relative flex flex-col items-center">
            <div className="w-16 h-16 rounded-full border-4 border-[#7C5CFF]/20 flex items-center justify-center relative">
               <svg className="absolute inset-0 w-full h-full -rotate-90">
                 <circle
                   cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5"
                 />
                 <motion.circle
                   cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" 
                   strokeDasharray="175.9" 
                   initial={{ strokeDashoffset: 175.9 }}
                   animate={{ strokeDashoffset: 175.9 - (175.9 * score) / 100 }}
                   transition={{ duration: 1.5, ease: "easeOut" }}
                   strokeLinecap="round" className="text-[#7C5CFF]"
                 />
               </svg>
               <span className="text-xl font-bold text-white z-10">{score}</span>
            </div>
            <span className="text-[8px] font-bold text-gray-500 mt-1 uppercase tracking-tighter">Score Roïva</span>
          </div>
        </div>
      </header>

      <button 
        onClick={() => setIsModalOpen(true)}
        className="group relative flex items-center justify-between w-full bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white p-4 rounded-2xl overflow-hidden transition-all shadow-lg shadow-[#7C5CFF]/20 active:scale-[0.98]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        <div className="flex items-center gap-3">
           <div className="p-2 bg-white/20 rounded-xl">
              <Plus size={20} className="text-white" />
           </div>
           <div className="text-left">
              <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">Ajouter un Produit</p>
              <p className="text-[10px] text-white/70 font-medium">Calculer marge, coeff & rotation</p>
           </div>
        </div>
        <Calculator className="text-white/40 group-hover:text-white/60 transition-colors" size={24} />
      </button>

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
        <KPICard 
          title="Marge" 
          value={results.margin} 
          trend="Rentabilité globale"
          icon={PieChart}
          suffix="%"
          colorClass="text-amber-400"
        />
        <KPICard 
          title="Bénef / Unité" 
          value={state.volume > 0 ? results.netProfit / state.volume : 0} 
          trend="Profit par article"
          icon={DollarSign}
          prefix="€"
          isCurrency={true}
          colorClass="text-cyan-400"
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
                formatter={(value: number) => [formatCurrency(value), 'Bénéfice']}
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
  const results = runSimulation(store as any, store.activeScenario);
  const baseRoi = results.roi;

  // Dynamic AI Narrative logic (Heuristic based for now)
  const getAiNarrative = () => {
    if (results.roi > 40) return "Performance exceptionnelle. Votre capital travaille dur.";
    if (results.roivaScore < 30) return "Attention, le risque de liquidité est élevé avec ces paramètres.";
    if (store.marketingExpense > 25) return "Le coût d'acquisition pourrait étouffer votre marge nette.";
    return "Structure de coût équilibrée. Continuez à optimiser le volume.";
  };
  
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

      {/* AI Pulse Narrative */}
      <div className="bg-[#7C5CFF]/5 border border-[#7C5CFF]/20 rounded-xl p-3 flex items-center gap-3">
         <div className="w-2 h-2 rounded-full bg-[#7C5CFF] animate-pulse shadow-[0_0_8px_#7C5CFF]"></div>
         <p className="text-[10px] font-medium text-gray-300 italic">{getAiNarrative()}</p>
      </div>

      <Card className="p-6">
        <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-3">
          <Wallet className="text-[#7C5CFF]" size={16} /> Investissement
        </h3>
        <PremiumSlider 
          label="Capital Initial" 
          value={store.initialCapital} 
          min={0} max={1000000000} 
          format={(v: number) => formatCurrency(v)}
          onChange={store.setInitialCapital}
        />
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-3">
          <TrendingUp className="text-[#10B981]" size={16} /> 
          {store.analysisMode === 'Product' ? 'Revenus & Croissance' : 'Objectifs & Rentabilité'}
        </h3>
        <PremiumSlider 
           label={store.analysisMode === 'Product' ? "Volume (Unités)" : "Nombre de Projets"} 
           value={store.volume} min={0} max={1000000} 
           format={(v: number) => `${v.toLocaleString()} ${store.analysisMode === 'Product' ? 'u.' : 'pr.'}`} 
           onChange={store.setVolume}
        />
        <PremiumSlider 
           label={store.analysisMode === 'Product' ? "Prix Unitaire" : "Revenu / Projet"} 
           value={store.unitPrice} min={0} max={100000} 
           format={(v: number) => formatCurrency(v, false)} onChange={store.setUnitPrice}
        />

        <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/5 grid grid-cols-2 gap-4">
           <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Revenu Live</p>
              <p className="text-sm font-bold text-white">€{(store.unitPrice * store.volume).toLocaleString()}</p>
           </div>
           <div className="text-right">
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Marge Brute</p>
              <p className="text-sm font-bold text-[#10B981]">€{((store.unitPrice - store.unitCost) * store.volume).toLocaleString()}</p>
           </div>
        </div>
        
        <div className="mt-4 mb-2 px-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Nom du {store.analysisMode === 'Product' ? 'Produit' : 'Projet'}</label>
          <div className="relative group">
            <input 
              type="text"
              value={store.productName}
              onChange={(e) => store.setProductName(e.target.value)}
              className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold outline-none focus:border-[#7C5CFF]/50 focus:ring-1 focus:ring-[#7C5CFF]/30 transition-all"
              placeholder={store.analysisMode === 'Product' ? "Ex: Produit Alpha" : "Ex: Projet Construction"}
            />
          </div>
        </div>

        <PremiumSlider 
           label="Croissance Annuelle" value={store.annualGrowth} min={0} max={100} 
           format={(v: number) => `${v.toFixed(1)}%`} onChange={store.setAnnualGrowth}
        />
      </Card>

      <Card className="p-6" bgIcon={Banknote}>
        <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-3">
          <BarChart3 className="text-[#F59E0B]" size={16} /> Structure des Coûts
        </h3>
        <PremiumSlider 
           label={store.analysisMode === 'Product' ? "Coût de revient" : "Coût de réalisation"} 
           value={store.unitCost} min={0} max={100000} 
           format={(v: number) => formatCurrency(v, false)} onChange={store.setUnitCost}
           icon={DollarSign}
        />
        <PremiumSlider 
           label="Frais Fixes Mensuels" value={store.fixedCosts} min={0} max={10000000} 
           format={(v: number) => formatCurrency(v, false)} onChange={store.setFixedCosts}
           icon={Wallet}
        />
        <div className="flex flex-wrap items-center gap-2 mb-6 -mt-2 ml-1">
          <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${store.unitPrice - store.unitCost > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
            Marge brute: €{(store.unitPrice - store.unitCost).toFixed(0)} / u.
          </div>
          <div className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
            Fixe Annuel: €{(store.fixedCosts * 12).toLocaleString()}
          </div>
        </div>
        <PremiumSlider 
           label="Dépenses Marketing" value={store.marketingExpense} min={0} max={50} 
           format={(v: number) => `${v.toFixed(1)}%`} onChange={store.setMarketingExpense}
        />
        <PremiumSlider 
           label="Ops & Logistique" value={store.logisticsOps} min={0} max={30} 
           format={(v: number) => `${v.toFixed(1)}%`} onChange={store.setLogisticsOps}
        />
        <PremiumSlider 
           label="Stock de Sécurité" value={store.safetyStock} min={0} max={120} 
           format={(v: number) => `${v.toFixed(0)} j.`} onChange={store.setSafetyStock}
        />
      </Card>

      <Card className="p-6 border-[#10B981]/20">
        <h3 className="text-sm font-bold text-white mb-6 flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <PieChart className="text-[#10B981]" size={16} /> 
            {store.analysisMode === 'Product' ? 'Analyse des Marges' : 'Rentabilité du Projet'}
          </div>
          <div className={`text-[10px] font-black px-2 py-0.5 rounded ${results.margin > 20 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
            {results.margin > 20 ? 'SANTÉ : EXCELLENTE' : 'SANTÉ : À SURVEILLER'}
          </div>
        </h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
                <span className="text-xs text-gray-400 font-medium">
                  {store.analysisMode === 'Product' ? 'Marge Brute Unit.' : 'Marge Brute / Projet'}
                </span>
             </div>
             <div className="text-right">
                <p className="text-sm font-bold text-white">€{(store.unitPrice - store.unitCost).toFixed(0)}</p>
                <p className="text-[10px] text-emerald-400 font-bold tracking-tighter">
                  {store.unitPrice > 0 ? (((store.unitPrice - store.unitCost) / store.unitPrice) * 100).toFixed(1) : "0"}%
                </p>
             </div>
          </div>

          <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#3B82F6]"></div>
                <span className="text-xs text-gray-400 font-medium">
                  {store.analysisMode === 'Product' ? 'Marge Nette Unit.' : 'Marge Nette / Projet'}
                </span>
             </div>
             <div className="text-right">
                <p className="text-sm font-bold text-white">€{(results.netProfit / (store.volume || 1)).toFixed(0)}</p>
                <p className="text-[10px] text-blue-400 font-bold tracking-tighter">
                   {results.margin.toFixed(1)}%
                </p>
             </div>
          </div>

          <div className="pt-2">
            <div className="flex justify-between text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2 px-1">
              <span>Conversion Revenu</span>
              <span>Profit</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, results.margin)}%` }}
                className="bg-gradient-to-r from-[#3B82F6] to-[#10B981]"
              />
            </div>
            <p className="text-[9px] text-gray-500 italic mt-2 leading-relaxed">
              Pour chaque <span className="text-white">€1.00</span> de vente, vous conservez <span className="text-white">€{isFinite(results.margin) ? (results.margin / 100).toFixed(2) : "0.00"}</span> après tous les frais.
            </p>
          </div>
        </div>
      </Card>
      
      {/* Suggestions Intelligentes */}
      <Card className="p-6 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
        <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-3">
          <Sparkles className="text-amber-400" size={16} /> 
          Suggestions Intelligentes
        </h3>
        
        <div className="space-y-4">
          {(() => {
            const suggestions = [];
            
            // Simulation logic for suggestions
            const pricePlus10 = runSimulation({ ...store, unitPrice: store.unitPrice * 1.1 } as any, store.activeScenario);
            const costMinus10 = runSimulation({ ...store, unitCost: store.unitCost * 0.9 } as any, store.activeScenario);
            const volumePlus20 = runSimulation({ ...store, volume: store.volume * 1.2 } as any, store.activeScenario);
            
            if (pricePlus10.roi > results.roi + 5) {
              suggestions.push({
                title: "Optimisation du Prix",
                desc: `Augmenter le prix de 10% porterait votre ROI à ${pricePlus10.roi.toFixed(1)}%.`,
                action: () => store.setUnitPrice(store.unitPrice * 1.1),
                impact: "HAUT",
                icon: TrendingUp,
                color: "text-emerald-400"
              });
            }
            
            if (costMinus10.roi > results.roi + 3) {
              suggestions.push({
                title: "Réduction des Coûts",
                desc: `Une baisse de 10% du coût de revient améliorerait significativement la marge nette.`,
                action: () => store.setUnitCost(store.unitCost * 0.9),
                impact: "MÉDIUM",
                icon: Shield,
                color: "text-blue-400"
              });
            }

            if (volumePlus20.roi > results.roi + 2) {
              suggestions.push({
                title: "Échelle de Volume",
                desc: `Atteindre +20% de volume permettrait de mieux absorber les frais fixes.`,
                action: () => store.setVolume(store.volume * 1.2),
                impact: "MÉDIUM",
                icon: Layers,
                color: "text-[#7C5CFF]"
              });
            }

            if (results.roi < 10 && store.marketingExpense > 15) {
              suggestions.push({
                title: "Efficacité Marketing",
                desc: "Vos dépenses marketing impactent trop lourdement votre ROI actuel.",
                action: () => store.setMarketingExpense(Math.max(0, store.marketingExpense - 5)),
                impact: "CRITIQUE",
                icon: AlertTriangle,
                color: "text-rose-400"
              });
            }

            if (suggestions.length === 0) {
              return (
                <div className="flex flex-col items-center py-4 text-center">
                  <CheckCircle size={24} className="text-emerald-500 mb-2" />
                  <p className="text-xs text-gray-400">Vos paramètres actuels sont déjà hautement optimisés pour ce scénario.</p>
                </div>
              );
            }

            return suggestions.map((s, i) => (
              <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 items-start">
                <div className={`p-2 rounded-xl bg-white/5 ${s.color}`}>
                  <s.icon size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-[12px] font-bold text-white">{s.title}</h4>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border border-white/10 ${s.impact === 'HAUT' || s.impact === 'CRITIQUE' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {s.impact}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-tight mb-3 italic">"{s.desc}"</p>
                  <button 
                    onClick={s.action}
                    className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#7C5CFF] hover:text-white transition-colors"
                  >
                    Appliquer <ArrowRight size={10} />
                  </button>
                </div>
              </div>
            ));
          })()}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden mb-28 border-[#7C5CFF]/30">
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[#7C5CFF]/5">
          <div className="flex items-center gap-2">
            <Layers className="text-[#7C5CFF]" size={18} />
            <h3 className="font-bold text-white uppercase tracking-widest text-xs">Matrice de Sensibilité ROI</h3>
          </div>
          <span className="text-[10px] text-[#7C5CFF] font-black px-2 py-0.5 bg-[#7C5CFF]/10 rounded border border-[#7C5CFF]/20 uppercase">Projections ±20%</span>
        </div>
        <div className="p-6">
          <p className="text-[10px] text-gray-500 mb-6 font-medium leading-relaxed uppercase tracking-widest">
            Impact croisé des prix <span className="text-white">(Y)</span> et des coûts <span className="text-white">(X)</span> sur votre rentabilité.
          </p>
          
          <div className="overflow-x-auto no-scrollbar pb-2">
            <div className="min-w-[450px]">
              <div className="grid grid-cols-6 gap-1">
                {/* Header Corner */}
                <div className="flex flex-col items-center justify-center text-[7px] text-gray-600 bg-[#0F172A] p-2 font-black tracking-widest border border-white/5 rounded-tl-xl uppercase leading-none">
                  <span>COÛTS</span>
                  <div className="h-px w-4 bg-gray-800 my-1"></div>
                  <span>PRIX</span>
                </div>
                
                {/* Cost headers (Top) */}
                {[-20, -10, 0, 10, 20].map(mod => (
                  <div key={mod} className="p-2 flex flex-col items-center justify-center bg-white/5 border border-white/5 rounded-t-xl">
                    <span className={`text-[10px] font-black ${mod === 0 ? 'text-white' : 'text-gray-500'}`}>
                      {mod > 0 ? '+' : ''}{mod}%
                    </span>
                  </div>
                ))}

                {/* Matrix Rows */}
                {[-20, -10, 0, 10, 20].map(priceMod => {
                  return (
                    <React.Fragment key={priceMod}>
                      {/* Price Header (Left) */}
                      <div className="p-2 flex items-center justify-end bg-white/5 border border-white/5 rounded-l-xl">
                        <span className={`text-[12px] font-black ${priceMod === 0 ? 'text-white' : 'text-gray-500'}`}>
                          {priceMod > 0 ? '+' : ''}{priceMod}%
                        </span>
                      </div>
                      
                      {/* Cells */}
                      {[-20, -10, 0, 10, 20].map(costMod => {
                        const adjPrice = store.unitPrice * (1 + priceMod / 100);
                        const adjCost = store.unitCost * (1 + costMod / 100);
                        
                        const cellResults = runSimulation({
                          ...store,
                          unitPrice: adjPrice,
                          unitCost: adjCost
                        } as any, store.activeScenario);
                        
                        const cellRoi = cellResults.roi;
                        const isCenter = priceMod === 0 && costMod === 0;
                        
                        // Dynamic color mapping based on ROI health
                        let cellClass = "bg-[#111827] text-gray-500 grayscale opacity-60";
                        if (isCenter) {
                          cellClass = "bg-[#7C5CFF]/20 text-white font-black ring-2 ring-[#7C5CFF] z-10 shadow-[0_0_15px_rgba(124,92,255,0.3)]";
                        } else if (cellRoi > 100) {
                          cellClass = "bg-emerald-500/20 text-emerald-400 font-bold border-emerald-500/20 shadow-inner";
                        } else if (cellRoi > 30) {
                          cellClass = "bg-emerald-500/10 text-emerald-500/70 border-emerald-500/10";
                        } else if (cellRoi > 0) {
                          cellClass = "bg-amber-500/10 text-amber-500/70 border-amber-500/10";
                        } else {
                          cellClass = "bg-rose-500/10 text-rose-500/70 border-rose-500/10";
                        }

                        return (
                          <motion.div 
                            key={`${priceMod}-${costMod}`} 
                            whileHover={{ scale: 1.08, zIndex: 20, grayscale: 0, opacity: 1 }}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-300 cursor-help ${cellClass}`}
                          >
                            <span className="text-[11px] font-mono tracking-tight font-black">{Math.round(cellRoi)}%</span>
                          </motion.div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Zone de Profit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]"></div>
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Zone de Risque</span>
              </div>
            </div>
            <div className="text-[9px] text-gray-500 italic bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
              Conseil : Maintenez un <span className="text-white">ROI {'>'} 30%</span> pour absorber les imprévus.
            </div>
          </div>
        </div>
      </Card>

      {/* Sticky Bottom Bar for Simulation Results */}
      <div className="fixed bottom-[5.5rem] left-0 right-0 p-4 z-40 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/90 to-transparent pointer-events-none flex justify-center">
         <div className="bg-[#111827] border border-[#7C5CFF]/30 shadow-[0_0_30px_rgba(124,92,255,0.15)] rounded-2xl p-4 flex items-center justify-between w-full max-w-lg pointer-events-auto">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">ROI</p>
              <div className="flex items-center gap-1">
                 <span className="text-lg font-bold text-white tabular-nums">{results.roi.toFixed(1)}%</span>
              </div>
            </div>
            <div className="w-px h-10 bg-white/10 mx-1"></div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">MARGE</p>
              <div className="flex items-center gap-1">
                 <span className="text-lg font-bold text-[#10B981] tabular-nums">{results.margin.toFixed(1)}%</span>
              </div>
            </div>
            <div className="w-px h-10 bg-white/10 mx-1"></div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">PROFIT</p>
              <p className="text-lg font-bold text-[#7C5CFF] tabular-nums">{formatCurrency(results.netProfit)}</p>
            </div>
         </div>
      </div>

      <div className="fixed bottom-[11rem] right-6 z-40">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            store.saveToHistory();
            alert("Analyse sauvegardée dans l'historique !");
          }}
          className="bg-emerald-500 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 font-bold text-sm"
        >
          <CheckCircle size={20} /> <span className="hidden sm:inline text-xs uppercase tracking-widest">Enregistrer</span>
        </motion.button>
      </div>

    </motion.div>
  );
}


const ScenariosView = () => {
  const store = useSimulationStore();
  const scenarios = generateScenarios(store as any);
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [compareWith, setCompareWith] = useState<ScenarioType | null>(null);

  const exportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      const doc = new jsPDF();
      
      // En-tête
      doc.setFontSize(22);
      doc.setTextColor(124, 92, 255); // Roiva violet
      doc.text(`ROÏVA - ${store.productName}`, 14, 20);
      
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text(`Analyse : ${store.productName} - ${store.activeScenario}`, 14, 30);
      
      // Paramètres
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.text(`Produit: ${store.productName}`, 14, 45);
      doc.text(`Capital Initial: ${formatCurrency(store.initialCapital)}`, 14, 52);
      doc.text(`Prix Unitaire: ${store.unitPrice} €`, 14, 59);
      doc.text(`Volume: ${store.volume.toLocaleString()} unités`, 14, 66);
      doc.text(`Cout Unitaire: ${store.unitCost} €`, 85, 52);
      doc.text(`Croissance Annuelle: ${store.annualGrowth}%`, 85, 59);
      
      // Tableau des Scénarios
      autoTable(doc, {
        startY: 75,
        headStyles: { fillColor: [124, 92, 255] },
        head: [['Scenario', 'Revenus', 'Couts', 'Benefice Net', 'ROI']],
        body: (["Optimiste", "Réaliste", "Pessimiste"] as ScenarioType[]).map(s => {
          const res = scenarios[s];
          return [
            s,
            formatCurrency(res.revenue),
            formatCurrency(res.totalCosts),
            formatCurrency(res.netProfit),
            `${res.roi.toFixed(1)}%`
          ]
        }),
      });

      doc.save(`roiva_${store.productName.replace(/\s+/g, '_').toLowerCase()}.pdf`);
      setIsExporting(false);
    }, 100);
  };
  
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
                 <span className="text-2xl font-bold text-white">{formatCurrency(scenarios[store.activeScenario].netProfit)}</span>
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
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
              />
              <Area type="monotone" dataKey="Optimiste" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" fill="none" opacity={0.5} />
              <Area type="monotone" dataKey="Réaliste" stroke="#7C5CFF" strokeWidth={3} fillOpacity={1} fill="url(#colorRealiste)" />
              <Area type="monotone" dataKey="Pessimiste" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" fill="none" opacity={0.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest text-gray-400">Comparaison Directe</h3>
          <div className="flex gap-2">
            {(["Optimiste", "Réaliste", "Pessimiste"] as ScenarioType[]).map((type) => (
              <button 
                key={type}
                onClick={() => setCompareWith(compareWith === type ? null : type)}
                disabled={store.activeScenario === type}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                  compareWith === type 
                    ? "bg-[#7C5CFF]/20 text-[#7C5CFF] border border-[#7C5CFF]" 
                    : store.activeScenario === type
                      ? "opacity-30 cursor-not-allowed bg-gray-800 text-gray-500 border border-transparent"
                      : "bg-white/5 text-gray-400 border border-transparent hover:bg-white/10"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {compareWith ? (
            <motion.div 
              key="comparison"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6 overflow-hidden"
            >
              {[
                { label: 'Revenu Annuel', key: 'revenue', format: (v: number) => formatCurrency(v) },
                { label: 'Bénéfice Net', key: 'netProfit', format: (v: number) => formatCurrency(v) },
                { label: 'ROI', key: 'roi', format: (v: number) => `${v.toFixed(1)}%` },
                { label: 'Score ROÏVA', key: 'roivaScore', format: (v: number) => `${v}/100` },
              ].map((metric) => {
                const val1 = scenarios[store.activeScenario][metric.key as keyof typeof scenarios["Réaliste"]];
                const val2 = scenarios[compareWith][metric.key as keyof typeof scenarios["Réaliste"]];
                const diff = (val1 as number) - (val2 as number);
                const percDiff = (diff / (val2 as number)) * 100;

                return (
                  <div key={metric.key} className="border-b border-white/5 last:border-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-xs text-gray-400 font-medium">{metric.label}</span>
                       <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${diff >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {diff >= 0 ? '+' : ''}{metric.format(diff)} ({percDiff > 0 ? '+' : ''}{percDiff.toFixed(1)}%)
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                        <p className="text-[8px] text-gray-500 uppercase font-bold tracking-tighter mb-1">{store.activeScenario}</p>
                        <p className="text-sm font-bold text-white">{metric.format(val1 as number)}</p>
                      </div>
                      <div className="bg-[#7C5CFF]/5 rounded-lg p-2 border border-[#7C5CFF]/20">
                        <p className="text-[8px] text-[#7C5CFF] uppercase font-bold tracking-tighter mb-1">{compareWith}</p>
                        <p className="text-sm font-bold text-white">{metric.format(val2 as number)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-8 text-center"
            >
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                 <Scale className="text-gray-600" size={20} />
              </div>
              <p className="text-xs text-gray-500 italic">Sélectionnez un deuxième scénario pour comparer les indicateurs clés.</p>
            </motion.div>
          )}
        </AnimatePresence>
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
                   {formatCurrency(scenarios[type].netProfit)}
                </span>
             </div>
          ))}
        </div>
      </Card>

      <div className="space-y-4 mt-6">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Rapport & Bon de Commande</h3>
        <div className="grid grid-cols-2 gap-3">
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            <button 
              onClick={() => setShowPreview(true)}
              className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all border border-white/10 group"
            >
              <Eye size={16} className="text-[#7C5CFF] group-hover:scale-110 transition-transform" />
              <span className="text-xs">Prévisualiser</span>
            </button>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            <button 
              onClick={exportPDF}
              disabled={isExporting}
              className={`w-full flex items-center justify-center gap-2 bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#7C5CFF]/10 ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Download size={16} />
              )}
              <span className="text-xs">{isExporting ? '...' : 'PDF'}</span>
            </button>
          </motion.div>
        </div>

        <Button icon={CheckCircle} onClick={() => {
           const name = prompt("Nom de la sauvegarde :");
           if (name) store.saveSnapshot(name);
        }}>
          Enregistrer Snapshot (Comparatif)
        </Button>
        
        {store.snapshots.length > 0 && (
          <div className="mt-8 space-y-4">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Historique & Comparaison</h3>
             <div className="space-y-2">
                {store.snapshots.map(s => (
                  <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center group">
                     <div>
                       <p className="text-sm font-bold text-white">{s.name}</p>
                       <p className="text-[10px] text-gray-500">{s.date}</p>
                     </div>
                     <button onClick={() => store.deleteSnapshot(s.id)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 transition-all">
                       <Zap size={14} />
                     </button>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreview(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0B0F1A] border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 relative"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#7C5CFF]/20 rounded-xl flex items-center justify-center">
                    <FileText className="text-[#7C5CFF]" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white leading-tight">Bon de Commande</h2>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-0.5">Visualisation avant export</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Document Container */}
              <div className="flex-1 overflow-y-auto p-4 md:p-12 bg-gray-100">
                <div className="max-w-3xl mx-auto bg-white shadow-2xl p-8 md:p-16 text-black font-sans min-h-[1000px] flex flex-col">
                  {/* Document Header */}
                  <div className="flex justify-between items-start pb-12 border-b-2 border-black/5 mb-12">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-[#7C5CFF]">
                        <Activity size={32} />
                        <h1 className="text-3xl font-black tracking-tighter">ROÏVA</h1>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Émetteur</p>
                        <p className="font-bold text-sm">ROÏVA Financial Systems</p>
                        <p className="text-xs text-gray-500">Analytics & Simulation Dashboard</p>
                      </div>
                    </div>
                    <div className="text-right space-y-4">
                      <div className="inline-block px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded">
                        Bon de Commande
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Référence</p>
                        <p className="font-bold text-sm">BC-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                        <p className="text-xs text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 space-y-10">
                    <div className="grid grid-cols-2 gap-12">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Objet de la simulation</p>
                        <p className="font-bold text-2xl tracking-tight">{store.productName}</p>
                        <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-[#7C5CFF]/10 text-[#7C5CFF] rounded text-[10px] font-bold">
                           Scénario {store.activeScenario}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Prix Unitaire</p>
                          <p className="font-bold text-lg">€{store.unitPrice}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Volume</p>
                          <p className="font-bold text-lg">{store.volume.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Récapitulatif Financier Annuel</p>
                      <div className="space-y-4">
                        <div className="flex justify-between items-end pb-3 border-b border-gray-200">
                          <span className="text-sm font-bold text-gray-600">Revenu Total Estimé</span>
                          <span className="text-xl font-black">{formatCurrency(scenarios[store.activeScenario].revenue)}</span>
                        </div>
                        <div className="flex justify-between items-end pb-3 border-b border-gray-200">
                          <span className="text-sm font-bold text-gray-600">Bénéfice Net</span>
                          <span className="text-xl font-black">{formatCurrency(scenarios[store.activeScenario].netProfit)}</span>
                        </div>
                        <div className="flex justify-between items-end">
                          <span className="text-sm font-bold text-[#7C5CFF]">Performance ROI</span>
                          <span className="text-3xl font-black text-[#7C5CFF]">{scenarios[store.activeScenario].roi.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Confirmation du Score</p>
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-full border-4 border-[#7C5CFF] flex items-center justify-center">
                           <span className="text-xl font-black">{scenarios[store.activeScenario].roivaScore}</span>
                        </div>
                        <div className="flex-1 text-xs text-gray-500 font-medium italic">
                          Le score ROÏVA de {scenarios[store.activeScenario].roivaScore}/100 indique une viabilité {scenarios[store.activeScenario].roivaScore > 70 ? 'excellente' : scenarios[store.activeScenario].roivaScore > 40 ? 'modérée' : 'critique'} pour ce projet dans les conditions actuelles.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Document Footer */}
                  <div className="mt-20 pt-8 border-t-2 border-black/5 text-center">
                    <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.3em] mb-4">Document de Simulation Officiel</p>
                    <div className="flex justify-center gap-12 opacity-30 grayscale mb-6">
                       <Activity size={24} />
                       <Shield size={24} />
                       <Target size={24} />
                    </div>
                    <p className="text-[8px] text-gray-300 max-w-sm mx-auto leading-relaxed">
                      Ce document est généré dynamiquement et ne peut être utilisé comme preuve fiscale. 
                      Les données sont fournies à titre indicatif selon les algorithmes de ROÏVA Systems V2.0.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-6 border-t border-white/5 bg-[#0B0F1A] flex gap-4">
                <button 
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10 text-sm"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => {
                    setShowPreview(false);
                    exportPDF();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white font-bold py-3 rounded-xl transition-all shadow-lg text-sm"
                >
                  <Download size={16} />
                  Confirmer & Télécharger le PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


const PeriodToggle = ({ value, setValue }: { value: PeriodType, setValue: (val: PeriodType) => void }) => {
  const options: PeriodType[] = ["Semaine", "Mois", "Trimestre", "Année"];
  return (
    <div className="flex bg-[#111827] border border-white/10 rounded-xl p-1 relative shadow-inner">
      {options.map((opt) => {
        const isActive = value === opt;
        return (
          <button
            key={opt}
            onClick={() => setValue(opt)}
            className={`flex-1 py-1 lg:py-2 text-[10px] lg:text-xs font-semibold rounded-lg z-10 transition-all ${
              isActive ? "text-white" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {opt}
          </button>
        );
      })}
      <div 
        className="absolute top-1 bottom-1 w-[calc(25%-4px)] bg-[#7C5CFF] rounded-lg transition-transform duration-300 ease-out shadow-lg"
        style={{ transform: `translateX(${options.indexOf(value) * 100}%)` }}
      />
    </div>
  );
};

const SalesVelocityToggle = ({ value, setValue }: { value: "Semaine" | "Mois", setValue: (val: "Semaine" | "Mois") => void }) => {
  const options: ("Semaine" | "Mois")[] = ["Semaine", "Mois"];
  return (
    <div className="flex bg-[#111827] border border-white/10 rounded-xl p-1 relative shadow-inner w-full max-w-[200px]">
      {options.map((opt) => {
        const isActive = value === opt;
        return (
          <button
            key={opt}
            onClick={() => setValue(opt)}
            className={`flex-1 py-1 text-[10px] font-semibold rounded-lg z-10 transition-all ${
              isActive ? "text-white" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {opt}
          </button>
        );
      })}
      <div 
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#7C5CFF] rounded-lg transition-transform duration-300 ease-out shadow-lg"
        style={{ transform: `translateX(${options.indexOf(value) * 100}%)` }}
      />
    </div>
  );
};

const StockView = () => {
  const store = useSimulationStore();
  const results = runSimulation(store as any, store.activeScenario);
  
  const isSafetyStockCritical = results.averageStock < (results.recommendedMinStock * store.safetyStockAlertThreshold / 100);
  const isCoverageCritical = results.stockDurationDays < store.lowCoverageThreshold;
  const isCritical = isSafetyStockCritical || isCoverageCritical;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="space-y-6 pb-28 max-w-lg mx-auto w-full pt-20 px-6"
    >
      <header>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {store.analysisMode === 'Product' ? 'Analyse des Stocks' : 'Analyse de Capacité'}
          </p>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={store.productName} 
              onChange={(e) => store.setProductName(e.target.value)}
              className="bg-[#7C5CFF]/10 text-[#7C5CFF] text-[10px] font-bold px-2 py-1 rounded border border-[#7C5CFF]/30 outline-none focus:ring-1 focus:ring-[#7C5CFF] w-32"
              placeholder={store.analysisMode === 'Product' ? "Nom du produit..." : "Nom du projet..."}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">Gestion des Niveaux</h1>
          {isCritical && (
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase rounded border border-rose-500/30 flex items-center gap-1"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Alerte
            </motion.div>
          )}
        </div>
        <PeriodToggle value={store.periodType} setValue={store.setPeriodType} />
      </header>

      <AnimatePresence>
        {(isSafetyStockCritical || isCoverageCritical) && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2">
              {isSafetyStockCritical && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-start gap-3">
                  <AlertTriangle size={16} className="text-rose-500 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wide">Stock de sécurité rompu</p>
                    <p className="text-[10px] text-rose-300 opacity-80">Le stock moyen est inférieur à {store.safetyStockAlertThreshold}% du minimum recommandé ({ (results.recommendedMinStock * store.safetyStockAlertThreshold / 100).toFixed(0) } u.).</p>
                  </div>
                </div>
              )}
              {isCoverageCritical && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-3">
                  <Zap size={16} className="text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wide">Couverture Faible</p>
                    <p className="text-[10px] text-amber-300 opacity-80">Vous avez moins de {store.lowCoverageThreshold} jours de stock ({results.stockDurationDays.toFixed(0)} j.). Risque d'interruption.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="text-[#10B981]" size={16} /> 
            {store.analysisMode === 'Product' ? 'Vitesse de Vente' : 'Cadence de Projet'}
          </h3>
          <SalesVelocityToggle value={store.targetSalesPeriod} setValue={store.setTargetSalesPeriod} />
        </div>
        
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="bg-[#0f172a] border border-white/5 rounded-2xl p-6 shadow-inner">
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {store.analysisMode === 'Product' ? 'Nombre de ventes' : 'Nombre de projets / étapes'} ({store.targetSalesPeriod.toLowerCase()})
              </label>
              <div className="relative group">
                <input 
                  type="number"
                  value={store.targetSales}
                  onChange={(e) => store.setTargetSales(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#111827] border border-[#7C5CFF]/30 rounded-xl px-4 py-4 text-white font-bold text-2xl outline-none focus:border-[#7C5CFF] focus:ring-1 focus:ring-[#7C5CFF]/30 transition-all shadow-inner"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500 pointer-events-none uppercase">
                  {store.analysisMode === 'Product' ? 'Unités' : 'Projets'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5">
          <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
            <Boxes className="text-[#7C5CFF]" size={16} /> 
            {store.analysisMode === 'Product' ? 'Niveaux de Stock' : 'Disponibilité Ressources'}
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                {store.analysisMode === 'Product' ? 'Stock Initial' : 'Capacité Initiale'} ({store.periodType})
              </label>
              <div className="relative">
                <input 
                  type="number"
                  value={store.initialStock}
                  onChange={(e) => store.setInitialStock(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-lg outline-none focus:border-[#7C5CFF]/50 focus:ring-1 focus:ring-[#7C5CFF]/30 transition-all shadow-inner"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs uppercase">
                  {store.analysisMode === 'Product' ? 'u.' : 'pr.'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                {store.analysisMode === 'Product' ? 'Stock Final' : 'Capacité Finale'} ({store.periodType})
              </label>
              <div className="relative">
                <input 
                  type="number"
                  value={store.finalStock}
                  onChange={(e) => store.setFinalStock(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-lg outline-none focus:border-[#7C5CFF]/50 focus:ring-1 focus:ring-[#7C5CFF]/30 transition-all shadow-inner"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs uppercase">
                  {store.analysisMode === 'Product' ? 'u.' : 'pr.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5">
          <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
            <Settings className="text-gray-400" size={16} /> 
            Configuration des Alertes
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                Seuil Couverture (Jours)
              </label>
              <input 
                type="number"
                value={store.lowCoverageThreshold}
                onChange={(e) => store.setLowCoverageThreshold(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2 text-white font-bold text-sm outline-none focus:border-amber-500/50 transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                Seuil Sécurité (%)
              </label>
              <input 
                type="number"
                value={store.safetyStockAlertThreshold}
                onChange={(e) => store.setSafetyStockAlertThreshold(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2 text-white font-bold text-sm outline-none focus:border-rose-500/50 transition-all"
              />
            </div>
          </div>
          <p className="text-[8px] text-gray-500 italic mt-2">Définit quand les badges d'alerte s'affichent sur le tableau de bord.</p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <KPICard 
          title={store.analysisMode === 'Product' ? "Stock Recommandé" : "Besoins Estimés"} 
          value={results.recommendedMinStock} 
          trend={store.analysisMode === 'Product' ? `Basé sur ${store.safetyStock} jours de sécurité` : "Marge de manœuvre"}
          icon={Shield}
          suffix={store.analysisMode === 'Product' ? " u." : " pr."}
          colorClass="text-[#10B981]"
        />
        <KPICard 
          title={store.analysisMode === 'Product' ? "Stock Moyen" : "Volume Moyen"} 
          value={results.averageStock} 
          trend={`(Initial + Final) / 2`}
          icon={Boxes}
          suffix={store.analysisMode === 'Product' ? " u." : " pr."}
          colorClass={isSafetyStockCritical ? "text-rose-400" : "text-[#7C5CFF]"}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard 
          title="Ratio Stock" 
          value={results.stockTurnover} 
          trend="Stock Consommé / Moyen"
          icon={Activity}
          suffix="x"
          colorClass="text-[#3B82F6]"
        />
        <KPICard 
          title="Couverture (Jours)" 
          value={results.stockDurationDays} 
          trend="Jours restants"
          icon={Zap}
          suffix=" j."
          colorClass={isCoverageCritical ? "text-rose-400" : "text-amber-400"}
        />
        <KPICard 
          title="Semaine" 
          value={results.stockDurationWeeks} 
          trend="Semaines de vente"
          icon={Target}
          suffix=" sem."
          colorClass="text-indigo-400"
        />
      </div>

      {isSafetyStockCritical || isCoverageCritical ? (
        <Card className={`border-${isSafetyStockCritical ? 'rose' : 'amber'}-500/30 bg-${isSafetyStockCritical ? 'rose' : 'amber'}-500/5`}>
          <div className="flex gap-4">
            <div className={`w-12 h-12 rounded-2xl bg-${isSafetyStockCritical ? 'rose' : 'amber'}-500/20 flex items-center justify-center shrink-0`}>
              <AlertTriangle className={isSafetyStockCritical ? 'text-rose-400' : 'text-amber-400'} size={24} />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isSafetyStockCritical ? 'text-rose-400' : 'text-amber-400'} mb-1`}>
                {isSafetyStockCritical ? "Risque de Rupture" : "Alerte de Stock Bas"}
              </h3>
              <p className={`text-xs ${isSafetyStockCritical ? 'text-rose-400/80' : 'text-amber-400/80'} leading-relaxed`}>
                {isSafetyStockCritical 
                  ? `Votre stock moyen (${results.averageStock.toFixed(0)} u.) est inférieur au seuil d'alerte défini (${store.safetyStockAlertThreshold}% du recommandé).`
                  : `Attention : votre couverture de stock est inférieure à votre seuil personnalisé (${store.lowCoverageThreshold} jours).`
                }
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle className="text-emerald-400" size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-400 mb-1">Niveaux Optimaux</h3>
              <p className="text-xs text-emerald-400/80 leading-relaxed">
                Vos niveaux de stock couvrent vos {store.safetyStock} jours de sécurité. Votre chaîne logistique est résiliente face aux variations de demande.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="pt-4">
        <Button 
          icon={Download} 
          onClick={() => {
            const doc = new jsPDF();
            doc.setFontSize(22);
            doc.setTextColor(124, 92, 255);
            doc.text(`PLAN D'ACHAT - ${store.productName}`, 14, 20);
            
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text(`Généré le ${new Date().toLocaleDateString()}`, 14, 30);
            
            autoTable(doc, {
              startY: 40,
              headStyles: { fillColor: [124, 92, 255] },
              head: [['Indicateur', 'Valeur']],
              body: [
                ['Produit', store.productName],
                ['Vitesse de Vente', `${store.targetSales} u. / ${store.targetSalesPeriod.toLowerCase()}`],
                ['Stock de Sécurité', `${store.safetyStock} jours`],
                ['Stock Actuel (Moyen)', `${results.averageStock.toFixed(0)} u.`],
                ['Stock Recommandé', `${results.recommendedMinStock.toFixed(0)} u.`],
                ['Quantité à commander', `${Math.max(0, results.recommendedMinStock - results.averageStock).toFixed(0)} u.`],
                ['Coût estimé', `${(Math.max(0, results.recommendedMinStock - results.averageStock) * store.unitCost).toFixed(2)} €`]
              ],
            });

            doc.save(`plan_achat_${store.productName.toLowerCase()}.pdf`);
          }}
        >
          Générer Plan d'Achat
        </Button>
      </div>
    </motion.div>
  );
};

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

// --- Support View ---

const SupportView = () => {
  const [activeSection, setActiveSection] = useState<'guide' | 'faq' | 'contact' | 'legal'>('guide');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const guideSteps = [
    {
      title: "Étape 1 : Créer votre Produit",
      desc: "Cliquez sur le bouton '+' ou 'Ajouter un Produit' sur le Dashboard. Renseignez votre prix d'achat et choisissez un coefficient (x3 recommandé).",
      icon: Plus,
      color: "bg-emerald-500/20 text-emerald-400"
    },
    {
      title: "Étape 2 : Simuler les Ventes",
      desc: "Dans l'onglet 'Stock', ajustez vos prévisions de ventes hebdomadaires pour voir l'impact sur vos besoins de trésorerie.",
      icon: TrendingUp,
      color: "bg-[#7C5CFF]/20 text-[#7C5CFF]"
    },
    {
      title: "Étape 3 : Analyser la Rentabilité",
      desc: "Consultez l'onglet 'Analyses' pour voir votre ROI et votre Score Roïva. Ajustez vos coûts si le score est trop bas.",
      icon: Target,
      color: "bg-amber-500/20 text-amber-400"
    }
  ];

  const glossary = [
    { 
      term: "Stock Initial / Final", 
      def: "Le stock initial est ce que vous possédez en début de période. Le stock final est ce qui reste après les ventes prévues." 
    },
    { 
      term: "Stock Moyen & Ratio", 
      def: "La moyenne de votre stock sur la période. Le ratio mesure la vitesse à laquelle vous vendez et renouvelez votre stock." 
    },
    { 
      term: "Couverture (Jours)", 
      def: "Combien de jours votre stock actuel peut durer face à la demande. Une couverture de 14-30 jours est souvent idéale." 
    },
    { 
      term: "ROI (Retour sur Investissement)", 
      def: "Le bénéfice généré divisé par le coût total investi. Il mesure l'efficacité de chaque euro dépensé." 
    },
    { 
      term: "Marge vs Profit", 
      def: "La marge est le pourcentage de gain sur le prix de vente. Le profit est la somme réelle d'argent qui reste après tous les frais." 
    }
  ];

  const faqs = [
    { q: "Comment est calculé le Score Roïva ?", a: "Le score est basé sur la rentabilité, la croissance et la solidité de votre structure de coûts." },
    { q: "Puis-je exporter mes simulations ?", a: "Oui, un bouton d'export PDF est disponible dans la vue Analyses." },
    { q: "Mes données sont-elles sécurisées ?", a: "Toutes vos simulations sont stockées localement sur votre appareil (Standards RGPD/CNIL)." },
    { q: "Comment optimiser ma marge ?", a: "Réduisez vos coûts fixes ou augmentez votre coefficient de vente via le menu Ajouter Produit." }
  ];

  const legalDocs = [
    { icon: Gavel, title: "Mentions Légales (France)", content: "Conformément à la loi n° 2004-575 du 21 juin 2004 (LCEN), Roïva est édité par l'Équipe Roïva. Hébergement : Google Cloud Platform (Région Europe)." },
    { icon: ShieldCheck, title: "RGPD & Confidentialité (UE)", content: "Application 100% conforme au RGPD. Vos données de simulation ne quittent jamais votre navigateur (Stockage local uniquement). Aucun profilage publicitaire." },
    { icon: Globe, title: "Standards Européens", content: "Respect des directives e-Privacy (2002/58/CE) et du règlement (UE) 2016/679. Transparence totale sur les algorithmes de calcul financier utilisés." },
    { icon: FileText, title: "Protection CNIL", content: "Conformément à la loi 'Informatique et Libertés', vous disposez d'un droit d'accès, de rectification et d'effacement de vos données locales via les paramètres." }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="space-y-6 pb-28 max-w-lg mx-auto w-full pt-20 px-6"
    >
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <LifeBuoy className="text-[#7C5CFF]" size={18} />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Centre d'Assistance</p>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tighter">Support & Guide</h1>
      </header>

      {/* Navigation Interne */}
      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 mb-8 overflow-x-auto no-scrollbar gap-1">
        {(['guide', 'faq', 'contact', 'legal'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`min-w-[70px] flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${
              activeSection === s ? "bg-[#7C5CFF] text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {s === 'guide' ? 'Guide' : s === 'faq' ? 'FAQ' : s === 'contact' ? 'Contact' : 'Légal'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSection === 'guide' && (
          <motion.div 
            key="guide" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
            className="space-y-8"
          >
            {/* Steps Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <MousePointer2 size={16} className="text-[#7C5CFF]" /> Premiers Pas
              </h3>
              {guideSteps.map((step, i) => (
                <div key={i} className="relative flex gap-4 p-5 bg-white/5 rounded-2xl border border-white/5">
                  <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${step.color}`}>
                    <step.icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">{step.title}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Glossary Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <BookOpen size={16} className="text-[#7C5CFF]" /> Lexique & Concepts
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {glossary.map((item, i) => (
                  <div key={i} className="p-4 bg-[#7C5CFF]/5 rounded-xl border border-[#7C5CFF]/10">
                    <p className="text-[10px] font-black text-[#7C5CFF] uppercase mb-1 tracking-tighter">{item.term}</p>
                    <p className="text-xs text-gray-300 leading-tight">{item.def}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-[#7C5CFF]/10 to-blue-500/10 rounded-3xl border border-white/10 text-center">
              <Lightbulb className="text-amber-400 mx-auto mb-3" size={32} />
              <h4 className="text-sm font-bold text-white mb-2">Conseil d'Expert</h4>
              <p className="text-xs text-gray-400 italic">
                "Un bon stock est un stock qui tourne. Si votre couverture dépasse 60 jours, vous immobilisez trop de trésorerie qui pourrait être utilisée pour la publicité."
              </p>
            </div>
          </motion.div>
        )}

        {activeSection === 'faq' && (
          <motion.div 
            key="faq" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            {faqs.map((f, i) => (
              <Card key={i} className="p-4 cursor-pointer" onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}>
                <div className="flex justify-between items-center bg-transparent">
                  <h4 className="text-sm font-bold text-white pr-4">{f.q}</h4>
                  {expandedFaq === i ? <ChevronUp size={16} className="text-[#7C5CFF]" /> : <ChevronDown size={16} className="text-gray-500" />}
                </div>
                <AnimatePresence>
                  {expandedFaq === i && (
                    <motion.p 
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="text-xs text-gray-400 mt-3 pt-3 border-t border-white/5 leading-relaxed"
                    >
                      {f.a}
                    </motion.p>
                  )}
                </AnimatePresence>
              </Card>
            ))}
          </motion.div>
        )}

        {activeSection === 'contact' && (
          <motion.div 
            key="contact" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-[#7C5CFF]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-[#7C5CFF]" size={28} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Besoin d'aide ?</h3>
              <p className="text-xs text-gray-400 mb-6 px-4">
                Notre équipe est disponible pour répondre à toutes vos questions techniques ou financières.
              </p>
              
              <div className="space-y-3">
                <button className="w-full bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                  <Mail size={18} /> Nous contacter par Email
                </button>
                
                <button 
                  onClick={() => alert("Un email de récupération a été généré (Simulation)")}
                  className="w-full bg-white/10 hover:bg-white/15 text-white font-bold py-4 rounded-2xl transition-all border border-white/5 flex items-center justify-center gap-2"
                >
                  <Sparkles size={18} className="text- amber-400" /> Générer un email de récupération
                </button>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Délai de réponse</p>
                <p className="text-sm font-bold text-white">&lt; 24 heures</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Satisfaction</p>
                <p className="text-sm font-bold text-[#10B981]">98% Positive</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'legal' && (
          <motion.div 
            key="legal" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            {legalDocs.map((doc, i) => (
              <Card key={i} className="p-5">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <doc.icon className="text-[#7C5CFF]" size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider mb-2">{doc.title}</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed italic">
                      "{doc.content}"
                    </p>
                    <button className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-[#7C5CFF] hover:underline uppercase tracking-widest">
                      Voir les détails <ExternalLink size={10} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};


// --- History View ---

const HistoryView: React.FC<{ onRestore: () => void }> = ({ onRestore }) => {
  const { history, loadFromHistory, deleteHistoryItem } = useSimulationStore();

  if (history.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center p-12 text-center space-y-4 pt-40"
      >
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <History size={40} className="text-gray-600" />
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">Aucun historique</h3>
        <p className="text-sm text-gray-400 max-w-xs">Les produits que vous analysez apparaîtront ici pour une consultation ultérieure.</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="space-y-6 pb-28 max-w-lg mx-auto w-full pt-20 px-6"
    >
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <History className="text-[#7C5CFF]" size={18} />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Archive des Analyses</p>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tighter">Historique</h1>
      </header>

      <div className="space-y-4">
        {history.map((item) => (
          <Card key={item.id} className="p-5 group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-bold text-white mb-1 group-hover:text-[#7C5CFF] transition-colors">{item.productName}</h4>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  <Clock size={10} /> {item.date}
                </div>
              </div>
              <button 
                onClick={() => deleteHistoryItem(item.id)}
                className="p-2 bg-white/5 hover:bg-rose-500/10 text-gray-500 hover:text-rose-500 rounded-xl transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <p className="text-[9px] font-black text-gray-500 uppercase mb-1">Prix de Vente</p>
                <p className="text-sm font-bold text-white">{item.data.unitPrice} €</p>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <p className="text-[9px] font-black text-gray-500 uppercase mb-1">Volume</p>
                <p className="text-sm font-bold text-white">{item.data.volume} u.</p>
              </div>
            </div>

            <button 
              onClick={() => {
                loadFromHistory(item);
                onRestore();
              }}
              className="w-full bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 text-xs"
            >
              <RotateCcw size={14} /> Restaurer cette Simulation
            </button>
          </Card>
        ))}
      </div>
    </motion.div>
  );
};


const SmartInfoBar = ({ visible }: { visible: boolean }) => {
  const [now, setNow] = useState(new Date());
  const [data, setData] = useState<{
    temp: string;
    condition: string;
    pollen: string;
    air: string;
    city: string;
    forecast: any[];
  }>({
    temp: "--°C",
    condition: "Chargement...",
    pollen: "--",
    air: "--",
    city: "Localisation...",
    forecast: []
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;

    const fetchData = async () => {
      try {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Fetch Weather
            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=weather_code&timezone=auto`);
            const weatherJson = await weatherRes.json();

            // Fetch Air Quality
            const airRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm2_5,pollen_grain_grass&daily=pm2_5,pollen_grain_grass&timezone=auto`);
            const airJson = await airRes.json();

            const weatherCodes: Record<number, string> = {
              0: "Calme", 1: "Clair", 2: "Nuageux", 3: "Couvert",
              45: "Brouillard", 48: "Givre", 51: "Bruine", 61: "Pluie",
              71: "Neige", 80: "Averses", 95: "Orage"
            };

            const airQuality = (val: number) => val < 10 ? "Bon" : val < 25 ? "Moyen" : "Mauvais";
            const pollenLevel = (val: number) => val < 10 ? "Faible" : val < 50 ? "Modéré" : "Élevé";

            // Construct Forecast
            const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
            const dailyTime = airJson?.daily?.time || [];
            const forecastData = dailyTime.map((time: string, i: number) => {
              const date = new Date(time);
              return {
                day: days[date.getDay()],
                air: airJson?.daily?.pm2_5?.[i] !== undefined ? airQuality(airJson.daily.pm2_5[i]) : "--",
                pol: airJson?.daily?.pollen_grain_grass?.[i] !== undefined ? pollenLevel(airJson.daily.pollen_grain_grass[i]) : "--"
              };
            }).slice(0, 7);

            setData({
              temp: weatherJson?.current?.temperature_2m !== undefined ? `${Math.round(weatherJson.current.temperature_2m)}°C` : "--°C",
              condition: weatherCodes[weatherJson?.current?.weather_code] || "Variable",
              pollen: airJson?.current?.pollen_grain_grass !== undefined ? pollenLevel(airJson.current.pollen_grain_grass) : "--",
              air: airJson?.current?.pm2_5 !== undefined ? airQuality(airJson.current.pm2_5) : "--",
              city: `Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`,
              forecast: forecastData
            });
          } catch (apiError) {
            console.error("API Error", apiError);
            setData(prev => ({ ...prev, condition: "Erreur API" }));
          }
        }, (geoError) => {
          console.error("Geo Error", geoError);
          setData(prev => ({ ...prev, city: "Localisation refusée", condition: "--" }));
        });
      } catch (error) {
        console.error("Error fetching geo data", error);
      }
    };

    fetchData();
  }, [visible]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="fixed top-0 w-full z-[70] bg-[#0F172A]/95 backdrop-blur-3xl border-b border-[#7C5CFF]/30 overflow-hidden shadow-2xl max-w-lg mx-auto left-0 right-0 rounded-b-2xl px-4"
        >
          <div className="py-4 px-2 flex flex-col gap-4 text-white">
            {/* Time, Date & Geo Info */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-[#7C5CFF]" />
                  <span className="text-sm font-black font-mono tracking-wider tabular-nums">{formatTime(now)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#7C5CFF]" />
                  <span className="text-[10px] font-bold uppercase tracking-tight text-gray-400">{formatDate(now)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 justify-center py-1 bg-white/5 rounded-lg border border-white/5">
                <Globe size={10} className="text-[#7C5CFF]" />
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{data.city}</span>
              </div>
            </div>

            {/* Weather & Vitals */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col items-center">
                <Sun size={14} className="text-amber-400 mb-1" />
                <span className="text-xs font-bold">{data.temp}</span>
                <span className="text-[8px] text-gray-500 uppercase font-bold">{data.condition}</span>
              </div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col items-center">
                <Wind size={14} className="text-cyan-400 mb-1" />
                <span className="text-[8px] text-gray-500 font-black uppercase">Pollution</span>
                <span className={`text-[10px] font-bold ${data.air === 'Bon' ? 'text-emerald-400' : 'text-amber-400'}`}>{data.air}</span>
              </div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex flex-col items-center">
                <Thermometer size={14} className="text-rose-400 mb-1" />
                <span className="text-[8px] text-gray-500 font-black uppercase">Pollen</span>
                <span className={`text-[10px] font-bold ${data.pollen === 'Faible' ? 'text-emerald-400' : 'text-rose-400'}`}>{data.pollen}</span>
              </div>
            </div>

            {/* Forecast Mini Grid */}
            <div className="flex justify-between gap-1 overflow-x-auto no-scrollbar">
              {data.forecast.map((f, i) => (
                <div key={i} className="flex flex-col items-center p-2 rounded-xl bg-white/5 border border-white/5 min-w-[45px]">
                  <span className="text-[7px] font-black text-gray-500 uppercase">{f.day}</span>
                  <div className="flex gap-1 mt-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${f.air === 'Bon' ? 'bg-emerald-500' : f.air === 'Moyen' ? 'bg-amber-500' : 'bg-rose-500'}`} title={`Air: ${f.air}`}></div>
                    <div className={`w-1.5 h-1.5 rounded-full ${f.pol === 'Faible' ? 'bg-emerald-500' : f.pol === 'Modéré' ? 'bg-amber-500' : 'bg-rose-500'}`} title={`Pollen: ${f.pol}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


// --- App ---
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showSmartBar, setShowSmartBar] = useState(false);
  const store = useSimulationStore();
  const { updateLastSaved, lastSaved } = store;

  useEffect(() => {
    if (showSmartBar) {
      const timer = setTimeout(() => setShowSmartBar(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSmartBar]);

  useEffect(() => {
    const interval = setInterval(() => {
      updateLastSaved();
    }, 30000);
    return () => clearInterval(interval);
  }, [updateLastSaved]);

  return (
    <div className="min-h-screen bg-[#0F172A] font-sans text-gray-200 selection:bg-[#7C5CFF]/30 relative overflow-x-hidden">
      
      {/* Background Ambient Glow */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#7C5CFF]/10 blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#2563EB]/10 blur-[120px] pointer-events-none"></div>

      <SmartInfoBar visible={showSmartBar} />

      {/* TopNav */}
      <header 
        onClick={() => setShowSmartBar(true)}
        className="fixed top-0 w-full z-50 bg-[#0F172A]/80 backdrop-blur-xl border-b border-white/5 flex justify-between items-center px-6 h-16 w-full cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7C5CFF] to-[#2563EB] flex items-center justify-center overflow-hidden border border-white/20 shadow-lg shadow-[#7C5CFF]/20">
            <span className="text-white font-bold text-xs tracking-tighter">RV</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-display">Roïva</span>
        </div>
        
        <div className="hidden sm:block">
          <AnalysisModeToggle value={store.analysisMode} setValue={store.setAnalysisMode} />
        </div>

        <div className="flex items-center gap-4">
          {lastSaved && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              key={lastSaved}
              className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-gray-500 font-medium bg-white/5 px-2 py-1 rounded-md border border-white/5"
            >
              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="hidden xs:inline">Sauvegardé à</span> {lastSaved}
            </motion.div>
          )}
          <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden bg-white/5 shadow-sm">
            <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === "dashboard" && <DashboardView key="dashboard" />}
        {activeTab === "simulation" && <SimulationView key="simulation" />}
        {activeTab === "stocks" && <StockView key="stocks" />}
        {activeTab === "scenarios" && <ScenariosView key="scenarios" />}
        {activeTab === "analyses" && <InsightsView key="analyses" />}
        {activeTab === "support" && <SupportView key="support" />}
        {activeTab === "history" && <HistoryView key="history" onRestore={() => setActiveTab("dashboard")} />}
      </AnimatePresence>

      {/* BottomNav */}
      <nav className="fixed bottom-0 w-full z-50 bg-[#0F172A]/90 backdrop-blur-2xl border-t border-white/5 shadow-2xl flex justify-around items-center h-[5.5rem] px-1 pb-6 max-w-lg mx-auto left-0 right-0 rounded-t-3xl">
        <NavItem 
          icon={Home} 
          label="Dash" 
          active={activeTab === "dashboard"} 
          onClick={() => setActiveTab("dashboard")} 
        />
        <NavItem 
          icon={Activity} 
          label="Simu" 
          active={activeTab === "simulation"} 
          onClick={() => setActiveTab("simulation")} 
        />
        <NavItem 
          icon={Boxes} 
          label="Stocks" 
          active={activeTab === "stocks"} 
          onClick={() => setActiveTab("stocks")} 
        />
        <NavItem 
          icon={Layers} 
          label="Scéna" 
          active={activeTab === "scenarios"} 
          onClick={() => setActiveTab("scenarios")} 
        />
        <NavItem 
          icon={Sparkles} 
          label="IA" 
          active={activeTab === "analyses"} 
          onClick={() => setActiveTab("analyses")} 
          highlight={true}
        />
        <NavItem 
          icon={History} 
          label="Hist." 
          active={activeTab === "history"} 
          onClick={() => setActiveTab("history")} 
        />
        <NavItem 
          icon={LifeBuoy} 
          label="Aide" 
          active={activeTab === "support"} 
          onClick={() => setActiveTab("support")} 
        />
      </nav>
    </div>
  );
}

const NavItem = ({ icon: Icon, label, active, onClick, highlight = false }: any) => {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-1 w-[16%] group transition-all duration-300 ${active ? 'scale-105' : 'hover:scale-105'}`}
    >
      <div className={`relative flex items-center justify-center w-10 h-8 rounded-full overflow-hidden transition-all duration-300 ${active ? (highlight ? 'bg-gradient-to-r from-[#7C5CFF] to-[#2563EB] shadow-[0_0_15px_rgba(124,92,255,0.4)] text-white' : 'bg-white/10 text-white') : 'bg-transparent text-gray-500 group-hover:text-gray-300 group-hover:bg-white/5'}`}>
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
