import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ScenarioType = "Pessimiste" | "Réaliste" | "Optimiste";

export type PeriodType = "Semaine" | "Mois" | "Trimestre" | "Année";

interface Snapshot {
  id: string;
  name: string;
  date: string;
  score: number;
  profit: number;
  roi: number;
}

interface SimulationState {
  // Inputs
  initialCapital: number;
  unitPrice: number;
  volume: number;
  annualGrowth: number;
  unitCost: number;
  fixedCosts: number;
  marketingExpense: number; // %
  logisticsOps: number; // %
  safetyStock: number; // days
  
  // Stock Inputs
  initialStock: number;
  finalStock: number;
  periodType: PeriodType;
  targetSales: number;
  targetSalesPeriod: "Semaine" | "Mois";
  productName: string;
  analysisMode: 'Product' | 'Project';
  
  // App State
  activeScenario: ScenarioType;
  lastSaved: string | null;
  snapshots: Snapshot[];
  
  // Actions
  setInitialCapital: (val: number) => void;
  setUnitPrice: (val: number) => void;
  setVolume: (val: number) => void;
  setAnnualGrowth: (val: number) => void;
  setUnitCost: (val: number) => void;
  setFixedCosts: (val: number) => void;
  setMarketingExpense: (val: number) => void;
  setLogisticsOps: (val: number) => void;
  setSafetyStock: (val: number) => void;
  setInitialStock: (val: number) => void;
  setFinalStock: (val: number) => void;
  setPeriodType: (val: PeriodType) => void;
  setTargetSales: (val: number) => void;
  setTargetSalesPeriod: (val: "Semaine" | "Mois") => void;
  setProductName: (val: string) => void;
  setAnalysisMode: (val: 'Product' | 'Project') => void;
  setActiveScenario: (val: ScenarioType) => void;
  updateLastSaved: () => void;
  saveSnapshot: (name: string) => void;
  deleteSnapshot: (id: string) => void;
}

export const useSimulationStore = create<SimulationState>()(
  persist(
    (set, get) => ({
      initialCapital: 2500000,
      unitPrice: 450,
      volume: 1200,
      annualGrowth: 12.5,
      unitCost: 185,
      fixedCosts: 15000,
      marketingExpense: 15,
      logisticsOps: 8,
      safetyStock: 45,

      initialStock: 2000,
      finalStock: 1500,
      periodType: "Année",
      targetSales: 25,
      targetSalesPeriod: "Semaine",
      productName: "Produit Alpha",
      analysisMode: 'Product',
      
      activeScenario: "Réaliste",
      lastSaved: null,
      snapshots: [],
      
      setInitialCapital: (val) => set({ initialCapital: val }),
      setUnitPrice: (val) => set({ unitPrice: val }),
      setVolume: (val) => set({ volume: val }),
      setAnnualGrowth: (val) => set({ annualGrowth: val }),
      setUnitCost: (val) => set({ unitCost: val }),
      setFixedCosts: (val) => set({ fixedCosts: val }),
      setMarketingExpense: (val) => set({ marketingExpense: val }),
      setLogisticsOps: (val) => set({ logisticsOps: val }),
      setSafetyStock: (val) => set({ safetyStock: val }),
      setInitialStock: (val) => set({ initialStock: val }),
      setFinalStock: (val) => set({ finalStock: val }),
      setPeriodType: (val) => set({ periodType: val }),
      setTargetSales: (val) => set({ targetSales: val }),
      setTargetSalesPeriod: (val) => set({ targetSalesPeriod: val }),
      setProductName: (val) => set({ productName: val }),
      setAnalysisMode: (val) => set({ analysisMode: val }),
      setActiveScenario: (val) => set({ activeScenario: val }),
      updateLastSaved: () => set({ lastSaved: new Date().toLocaleTimeString() }),
      saveSnapshot: (name) => {
         const state = get();
         // runSimulation logic would be imported or computed here
         // For the store, we just save the current "essential" findings
         // In a real app we'd compute this properly.
         const newSnapshot: Snapshot = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            date: new Date().toLocaleDateString(),
            score: 0, // Computed by component layer call
            profit: 0,
            roi: 0
         };
         set({ snapshots: [newSnapshot, ...state.snapshots].slice(0, 5) });
      },
      deleteSnapshot: (id) => set({ snapshots: get().snapshots.filter(s => s.id !== id) })
    }),
    {
      name: 'roiva-simulation-storage',
    }
  )
);
