import { create } from 'zustand'

export type ScenarioType = "Pessimiste" | "Réaliste" | "Optimiste";

interface SimulationState {
  // Inputs
  initialCapital: number;
  unitPrice: number;
  volume: number;
  annualGrowth: number;
  unitCost: number;
  marketingExpense: number; // %
  logisticsOps: number; // %
  safetyStock: number; // days
  
  // App State
  activeScenario: ScenarioType;
  
  // Actions
  setInitialCapital: (val: number) => void;
  setUnitPrice: (val: number) => void;
  setVolume: (val: number) => void;
  setAnnualGrowth: (val: number) => void;
  setUnitCost: (val: number) => void;
  setMarketingExpense: (val: number) => void;
  setLogisticsOps: (val: number) => void;
  setSafetyStock: (val: number) => void;
  setActiveScenario: (val: ScenarioType) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  initialCapital: 2500000,
  unitPrice: 450,
  volume: 1200,
  annualGrowth: 12.5,
  unitCost: 185,
  marketingExpense: 15,
  logisticsOps: 8,
  safetyStock: 45,
  
  activeScenario: "Réaliste",
  
  setInitialCapital: (val) => set({ initialCapital: val }),
  setUnitPrice: (val) => set({ unitPrice: val }),
  setVolume: (val) => set({ volume: val }),
  setAnnualGrowth: (val) => set({ annualGrowth: val }),
  setUnitCost: (val) => set({ unitCost: val }),
  setMarketingExpense: (val) => set({ marketingExpense: val }),
  setLogisticsOps: (val) => set({ logisticsOps: val }),
  setSafetyStock: (val) => set({ safetyStock: val }),
  setActiveScenario: (val) => set({ activeScenario: val }),
}));
