import { create } from "zustand";
import { persist } from "zustand/middleware";
import { db, auth } from "./firebase";
import { collection, addDoc, deleteDoc, doc, setDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "./lib/firebaseUtils";

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

export interface HistoryItem {
  id: string;
  productName: string;
  date: string;
  timestamp: number;
  data: {
    initialCapital: number;
    unitPrice: number;
    volume: number;
    annualGrowth: number;
    unitCost: number;
    fixedCosts: number;
    marketingExpense: number;
    logisticsOps: number;
    safetyStock: number;
    initialStock: number;
    finalStock: number;
    periodType: PeriodType;
    targetSales: number;
    targetSalesPeriod: "Semaine" | "Mois";
    analysisMode: "Product" | "Project" | "Boutique";
    businessType: "Retail" | "CHR";
    lowCoverageThreshold: number;
    safetyStockAlertThreshold: number;
    themeMode: "light" | "dark";
    primaryColor: string;
    secondaryColor: string;

    // Boutique specific
    employees: Array<{
      id: string;
      name: string;
      salary: number;
      charges: number;
    }>;
    rent: number;
    utilities: number;
    taxCharges: number;
    insurance: number;
    maintenance: number;
    otherMiscExpenses: number;
    marginCoefficient: number;
    monthlyTaxes: number;

    otherExpenses: Array<{ id: string; name: string; amount: number }>;
    boutiqueProducts: Array<{
      id: string;
      name: string;
      unitCost: number;
      marginCoefficient: number;
      expectedVolume: number;
    }>;

    // New Detailed Expenses
    loanAmount: number;
    loanInterestRate: number;
    loanDurationMonths: number;
    loanPaymentsMade: number;
    loanPayment: number;
    vatPayment: number;
    ursafGlobal: number;
    mutualInsurancePerEmployee: number;

    inventoryHoldTimeDays: number;
    supplierPaymentDays: number;
    customerPaymentDays: number;
  };
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
  establishmentName: string;
  analysisMode: "Product" | "Project" | "Boutique";
  businessType: "Retail" | "CHR";
  lowCoverageThreshold: number;
  safetyStockAlertThreshold: number;

  // Boutique Fields
  employees: Array<{
    id: string;
    name: string;
    salary: number;
    charges: number;
  }>;
  rent: number;
  utilities: number;
  taxCharges: number;
  insurance: number;
  maintenance: number;
  otherMiscExpenses: number;
  marginCoefficient: number;
  monthlyTaxes: number;

  otherExpenses: Array<{ id: string; name: string; amount: number }>;
  boutiqueProducts: Array<{
    id: string;
    name: string;
    unitCost: number;
    marginCoefficient: number;
    expectedVolume: number;
  }>;

  // New Detailed Expenses
  loanAmount: number;
  loanInterestRate: number;
  loanDurationMonths: number;
  loanPaymentsMade: number;
  loanPayment: number;
  vatPayment: number;
  ursafGlobal: number;
  mutualInsurancePerEmployee: number;

  inventoryHoldTimeDays: number;
  supplierPaymentDays: number;
  customerPaymentDays: number;

  // Theme State
  themeMode: "light" | "dark";
  primaryColor: string;
  secondaryColor: string;

  // App State
  activeScenario: ScenarioType;
  lastSaved: string | null;
  snapshots: Snapshot[];
  history: HistoryItem[];
  comparisonIds: string[];

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
  setEstablishmentName: (val: string) => void;
  setAnalysisMode: (val: "Product" | "Project" | "Boutique") => void;
  setBusinessType: (val: "Retail" | "CHR") => void;
  setLowCoverageThreshold: (val: number) => void;
  setSafetyStockAlertThreshold: (val: number) => void;

  // Boutique methods
  addEmployee: (isOwner?: boolean) => void;
  removeEmployee: (id: string) => void;
  updateEmployee: (
    id: string,
    field: "salary" | "charges" | "name",
    val: any,
  ) => void;
  setRent: (val: number) => void;
  setUtilities: (val: number) => void;
  setTaxCharges: (val: number) => void;
  setInsurance: (val: number) => void;
  setMaintenance: (val: number) => void;
  setOtherMiscExpenses: (val: number) => void;
  setMarginCoefficient: (val: number) => void;
  setMonthlyTaxes: (val: number) => void;

  addOtherExpense: () => void;
  removeOtherExpense: (id: string) => void;
  updateOtherExpense: (id: string, field: "name" | "amount", val: any) => void;

  addBoutiqueProduct: (product?: { name: string; unitCost: number; marginCoefficient: number; expectedVolume: number }) => void;
  removeBoutiqueProduct: (id: string) => void;
  updateBoutiqueProduct: (
    id: string,
    field: "name" | "unitCost" | "marginCoefficient" | "expectedVolume",
    val: any,
  ) => void;

  setLoanAmount: (val: number) => void;
  setLoanInterestRate: (val: number) => void;
  setLoanDurationMonths: (val: number) => void;
  setLoanPaymentsMade: (val: number) => void;
  setLoanPayment: (val: number) => void;
  setVatPayment: (val: number) => void;
  setUrsafGlobal: (val: number) => void;
  setMutualInsurancePerEmployee: (val: number) => void;

  setInventoryHoldTimeDays: (val: number) => void;
  setSupplierPaymentDays: (val: number) => void;
  setCustomerPaymentDays: (val: number) => void;

  setThemeMode: (mode: "light" | "dark") => void;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  setActiveScenario: (val: ScenarioType) => void;
  toggleComparison: (id: string) => void;
  clearComparison: () => void;
  updateLastSaved: () => void;
  saveSnapshot: (name: string) => Promise<void>;
  deleteSnapshot: (id: string) => Promise<void>;
  saveToHistory: () => Promise<void>;
  loadFromHistory: (item: HistoryItem) => void;
  deleteHistoryItem: (id: string) => Promise<void>;
  setAll: (data: Partial<SimulationState>) => void;
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
      establishmentName: "Mon Établissement",
      analysisMode: "Product",
      businessType: "Retail",
      lowCoverageThreshold: 15,
      safetyStockAlertThreshold: 100,

      // Boutique Defaults
      employees: [],
      rent: 2500,
      utilities: 450,
      taxCharges: 300,
      insurance: 150,
      maintenance: 200,
      otherMiscExpenses: 100,
      marginCoefficient: 3,
      monthlyTaxes: 500,
      otherExpenses: [],
      boutiqueProducts: [
        {
          id: "initial-prod-1",
          name: "Produit A",
          unitCost: 20,
          marginCoefficient: 3,
          expectedVolume: 1000,
        },
      ],

      loanAmount: 0,
      loanInterestRate: 0,
      loanDurationMonths: 60,
      loanPaymentsMade: 0,
      loanPayment: 0,
      vatPayment: 0,
      ursafGlobal: 0,
      mutualInsurancePerEmployee: 50,

      inventoryHoldTimeDays: 30,
      supplierPaymentDays: 30,
      customerPaymentDays: 30,

      themeMode: "dark",
      primaryColor: "#7C5CFF",
      secondaryColor: "#2563EB",

      activeScenario: "Réaliste",
      lastSaved: null,
      snapshots: [],
      history: [],
      comparisonIds: [],

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
      setEstablishmentName: (val) => set({ establishmentName: val }),
      setAnalysisMode: (val) => set({ analysisMode: val }),
      setBusinessType: (val) => set({ businessType: val }),
      setLowCoverageThreshold: (val) => set({ lowCoverageThreshold: val }),
      setSafetyStockAlertThreshold: (val) =>
        set({ safetyStockAlertThreshold: val }),

      addEmployee: (isOwner?: boolean) =>
        set((state) => ({
          employees: [
            ...state.employees,
            {
              id: Math.random().toString(36).substr(2, 9),
              name: isOwner ? "Mindset Rentier (Dirigeant)" : "",
              salary: isOwner ? 2500 : 1800,
              charges: 45,
            },
          ],
        })),
      removeEmployee: (id) =>
        set((state) => ({
          employees: state.employees.filter((e) => e.id !== id),
        })),
      updateEmployee: (id, field, val) =>
        set((state) => ({
          employees: state.employees.map((e) =>
            e.id === id ? { ...e, [field]: val } : e,
          ),
        })),
      setRent: (val) => set({ rent: val }),
      setUtilities: (val) => set({ utilities: val }),
      setTaxCharges: (val) => set({ taxCharges: val }),
      setInsurance: (val) => set({ insurance: val }),
      setMaintenance: (val) => set({ maintenance: val }),
      setOtherMiscExpenses: (val) => set({ otherMiscExpenses: val }),
      setMarginCoefficient: (val) => set({ marginCoefficient: val }),
      setMonthlyTaxes: (val) => set({ monthlyTaxes: val }),

      addOtherExpense: () =>
        set((state) => ({
          otherExpenses: [
            ...state.otherExpenses,
            {
              id: Math.random().toString(36).substr(2, 9),
              name: "",
              amount: 100,
            },
          ],
        })),
      removeOtherExpense: (id) =>
        set((state) => ({
          otherExpenses: state.otherExpenses.filter((oe) => oe.id !== id),
        })),
      updateOtherExpense: (id, field, val) =>
        set((state) => ({
          otherExpenses: state.otherExpenses.map((oe) =>
            oe.id === id ? { ...oe, [field]: val } : oe,
          ),
        })),

      addBoutiqueProduct: (product) =>
        set((state) => ({
          boutiqueProducts: [
            ...state.boutiqueProducts,
            {
              id: Math.random().toString(36).substr(2, 9),
              name: product?.name || `Produit ${String.fromCharCode(65 + state.boutiqueProducts.length)}`,
              unitCost: product?.unitCost || 15,
              marginCoefficient: product?.marginCoefficient || state.marginCoefficient || 2.5,
              expectedVolume: product?.expectedVolume || 500,
            },
          ],
        })),
      removeBoutiqueProduct: (id) =>
        set((state) => ({
          boutiqueProducts: state.boutiqueProducts.filter((p) => p.id !== id),
        })),
      updateBoutiqueProduct: (id, field, val) =>
        set((state) => ({
          boutiqueProducts: state.boutiqueProducts.map((p) =>
            p.id === id ? { ...p, [field]: val } : p,
          ),
        })),

      setLoanAmount: (val) => set({ loanAmount: val }),
      setLoanInterestRate: (val) => set({ loanInterestRate: val }),
      setLoanDurationMonths: (val) => set({ loanDurationMonths: val }),
      setLoanPaymentsMade: (val) => set({ loanPaymentsMade: val }),
      setLoanPayment: (val) => set({ loanPayment: val }),
      setVatPayment: (val) => set({ vatPayment: val }),
      setUrsafGlobal: (val) => set({ ursafGlobal: val }),
      setMutualInsurancePerEmployee: (val) =>
        set({ mutualInsurancePerEmployee: val }),

      setInventoryHoldTimeDays: (val) => set({ inventoryHoldTimeDays: val }),
      setSupplierPaymentDays: (val) => set({ supplierPaymentDays: val }),
      setCustomerPaymentDays: (val) => set({ customerPaymentDays: val }),

      setThemeMode: (mode) => set({ themeMode: mode }),
      setPrimaryColor: (color) => set({ primaryColor: color }),
      setSecondaryColor: (color) => set({ secondaryColor: color }),
      setActiveScenario: (val) => set({ activeScenario: val }),
      toggleComparison: (id) =>
        set((state) => ({
          comparisonIds: state.comparisonIds.includes(id)
            ? state.comparisonIds.filter((cid) => cid !== id)
            : [...state.comparisonIds, id],
        })),
      clearComparison: () => set({ comparisonIds: [] }),
      updateLastSaved: () =>
        set({ lastSaved: new Date().toLocaleTimeString() }),

      saveToHistory: async () => {
        const state = get();
        const user = auth.currentUser;

        const newItemData = {
          productName: state.productName,
          date: new Date().toLocaleString("fr-FR"),
          timestamp: Date.now(),
          data: {
            initialCapital: state.initialCapital,
            unitPrice: state.unitPrice,
            volume: state.volume,
            annualGrowth: state.annualGrowth,
            unitCost: state.unitCost,
            fixedCosts: state.fixedCosts,
            marketingExpense: state.marketingExpense,
            logisticsOps: state.logisticsOps,
            safetyStock: state.safetyStock,
            initialStock: state.initialStock,
            finalStock: state.finalStock,
            periodType: state.periodType,
            targetSales: state.targetSales,
            targetSalesPeriod: state.targetSalesPeriod,
            analysisMode: state.analysisMode,
            lowCoverageThreshold: state.lowCoverageThreshold,
            safetyStockAlertThreshold: state.safetyStockAlertThreshold,
            themeMode: state.themeMode,
            primaryColor: state.primaryColor,
            secondaryColor: state.secondaryColor,
            businessType: state.businessType,
            employees: state.employees,
            rent: state.rent,
            utilities: state.utilities,
            taxCharges: state.taxCharges,
            insurance: state.insurance,
            maintenance: state.maintenance,
            otherMiscExpenses: state.otherMiscExpenses,
            marginCoefficient: state.marginCoefficient,
            monthlyTaxes: state.monthlyTaxes,
            otherExpenses: state.otherExpenses,
            boutiqueProducts: state.boutiqueProducts,
            loanAmount: state.loanAmount,
            loanInterestRate: state.loanInterestRate,
            loanDurationMonths: state.loanDurationMonths,
            loanPaymentsMade: state.loanPaymentsMade,
            loanPayment: state.loanPayment,
            vatPayment: state.vatPayment,
            ursafGlobal: state.ursafGlobal,
            mutualInsurancePerEmployee: state.mutualInsurancePerEmployee,
            inventoryHoldTimeDays: state.inventoryHoldTimeDays,
            supplierPaymentDays: state.supplierPaymentDays,
            customerPaymentDays: state.customerPaymentDays,
          },
        };

        if (user) {
          try {
            await addDoc(
              collection(db, "users", user.uid, "history"),
              newItemData,
            );
          } catch (error) {
            handleFirestoreError(
              error,
              OperationType.WRITE,
              `users/${user.uid}/history`,
            );
          }
        } else {
          const newItem: HistoryItem = {
            id: Math.random().toString(36).substr(2, 9),
            ...newItemData,
          };
          set({ history: [newItem, ...state.history].slice(0, 20) });
        }
      },

      loadFromHistory: (item) => {
        set({
          ...item.data,
          productName: item.productName,
          activeScenario: "Réaliste", // Reset to default
        });
      },

      deleteHistoryItem: async (id) => {
        const user = auth.currentUser;
        if (user) {
          try {
            await deleteDoc(doc(db, "users", user.uid, "history", id));
          } catch (error) {
            handleFirestoreError(
              error,
              OperationType.DELETE,
              `users/${user.uid}/history/${id}`,
            );
          }
        } else {
          set({ history: get().history.filter((h) => h.id !== id) });
        }
      },

      saveSnapshot: async (name) => {
        const state = get();
        const user = auth.currentUser;

        const newSnapshotData = {
          name,
          date: new Date().toLocaleDateString(),
          score: 0, // Computed by component layer call
          profit: 0,
          roi: 0,
        };

        if (user) {
          try {
            await addDoc(
              collection(db, "users", user.uid, "snapshots"),
              newSnapshotData,
            );
          } catch (error) {
            handleFirestoreError(
              error,
              OperationType.WRITE,
              `users/${user.uid}/snapshots`,
            );
          }
        } else {
          const newSnapshot: Snapshot = {
            id: Math.random().toString(36).substr(2, 9),
            ...newSnapshotData,
          };
          set({ snapshots: [newSnapshot, ...state.snapshots].slice(0, 5) });
        }
      },
      deleteSnapshot: async (id) => {
        const user = auth.currentUser;
        if (user) {
          try {
            await deleteDoc(doc(db, "users", user.uid, "snapshots", id));
          } catch (error) {
            handleFirestoreError(
              error,
              OperationType.DELETE,
              `users/${user.uid}/snapshots/${id}`,
            );
          }
        } else {
          set({ snapshots: get().snapshots.filter((s) => s.id !== id) });
        }
      },
      setAll: (data) => set((state) => ({ ...state, ...data })),
    }),
    {
      name: "roiva-simulation-storage",
    },
  ),
);
