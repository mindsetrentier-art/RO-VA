import { ScenarioType } from "../store";

const multipliers: Record<ScenarioType, { rev: number; cost: number }> = {
  Pessimiste: { rev: 0.85, cost: 1.15 },
  Réaliste: { rev: 1.0, cost: 1.0 },
  Optimiste: { rev: 1.25, cost: 0.9 },
};

export interface SalaryEstimation {
  net_salary: number;
  brut_salary: number;
  employer_charges: number;
  total_cost: number;
  charges_percentage: number;
  retirement_contribution: number;
}

/**
 * Estimate employer cost from net salary in France (2026 approximation)
 * Returns strict calculation based on user-provided rules.
 */
export function estimateSalaryCostFrance(
  netSalary: number,
  customChargeRatePercentage?: number,
): SalaryEstimation {
  let netToBrutRatio: number;
  let employerChargeRate: number;

  if (netSalary <= 1400) {
    netToBrutRatio = 1.26;
    employerChargeRate = 0.12;
  } else if (netSalary <= 2500) {
    netToBrutRatio = 1.28;
    employerChargeRate = 0.4;
  } else {
    netToBrutRatio = 1.28;
    employerChargeRate = 0.44;
  }

  if (
    customChargeRatePercentage !== undefined &&
    customChargeRatePercentage !== null
  ) {
    employerChargeRate = customChargeRatePercentage / 100;
  }

  const brutSalary = netSalary * netToBrutRatio;
  const employerCharges = brutSalary * employerChargeRate;
  const totalCost = brutSalary + employerCharges;
  const chargesPercentage = (employerCharges / totalCost) * 100;

  // Cotisation retraite patronale is generally around 16.5% of brut salary
  const retirement_contribution = brutSalary * 0.165;

  return {
    net_salary: Number(netSalary.toFixed(2)),
    brut_salary: Number(brutSalary.toFixed(2)),
    employer_charges: Number(employerCharges.toFixed(2)),
    total_cost: Number(totalCost.toFixed(2)),
    charges_percentage: Number(chargesPercentage.toFixed(2)),
    retirement_contribution: Number(retirement_contribution.toFixed(2)),
  };
}

export const runSimulation = (data: any, scenario: ScenarioType) => {
  const mult = multipliers[scenario];

  // Boutique Mode Logic
  if (data.analysisMode === "Boutique") {
    const mutualTotal =
      (data.employees || []).length * (data.mutualInsurancePerEmployee || 0);
    const employeeCosts =
      (data.employees || []).reduce((acc: number, emp: any) => {
        const est = estimateSalaryCostFrance(emp.salary || 0, emp.charges);
        return acc + est.total_cost;
      }, 0) + mutualTotal;

    // Loan Calculation
    let activeLoanPayment = data.loanPayment || 0;
    if (data.loanAmount > 0 && data.loanDurationMonths > 0) {
      const monthlyRate = data.loanInterestRate / 100 / 12;
      if (monthlyRate === 0) {
        activeLoanPayment = data.loanAmount / data.loanDurationMonths;
      } else {
        activeLoanPayment =
          (data.loanAmount *
            monthlyRate *
            Math.pow(1 + monthlyRate, data.loanDurationMonths)) /
          (Math.pow(1 + monthlyRate, data.loanDurationMonths) - 1);
      }
    }

    const detailedOtherExpenses = (data.otherExpenses || []).reduce(
      (acc: number, exp: any) => acc + (exp.amount || 0),
      0,
    );
    const monthlyFixedCosts =
      (data.rent || 0) +
      (data.utilities || 0) +
      (data.taxCharges || 0) +
      (data.insurance || 0) +
      (data.maintenance || 0) +
      (data.otherMiscExpenses || 0) +
      (data.monthlyTaxes || 0) +
      activeLoanPayment +
      (data.vatPayment || 0) +
      (data.ursafGlobal || 0) +
      employeeCosts +
      detailedOtherExpenses;

    const annualFixedCosts = monthlyFixedCosts * 12;

    let revenue = 0;
    let totalVariableCosts = 0;
    let marginRatio = 1 - 1 / (data.marginCoefficient || 1);
    let breakEvenTurnover = 0;

    if (data.boutiqueProducts && data.boutiqueProducts.length > 0) {
      // Bottom-up calculation
      data.boutiqueProducts.forEach((p: any) => {
        const sellingPrice = p.unitCost * p.marginCoefficient;
        revenue += sellingPrice * p.expectedVolume;
        totalVariableCosts += p.unitCost * p.expectedVolume;
      });

      // Apply multipliers to variable part
      revenue = revenue * mult.rev;
      totalVariableCosts = totalVariableCosts * mult.cost;

      marginRatio = revenue > 0 ? (revenue - totalVariableCosts) / revenue : 0;
      breakEvenTurnover = marginRatio > 0 ? annualFixedCosts / marginRatio : 0;
    } else {
      // Top-down target calculation
      breakEvenTurnover = marginRatio > 0 ? annualFixedCosts / marginRatio : 0;
      revenue = breakEvenTurnover * 1.2 * mult.rev;
      totalVariableCosts = revenue * (1 - marginRatio) * mult.cost;
    }

    const totalCosts = annualFixedCosts + totalVariableCosts;
    const netProfit = revenue - totalCosts;
    const roi =
      data.initialCapital > 0 ? (netProfit / data.initialCapital) * 100 : 0;
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    const roiScoreB = isFinite(roi)
      ? Math.max(0, Math.min(100, (roi / 20) * 100)) * 0.5
      : 0;
    const marginScoreB = isFinite(margin)
      ? Math.max(0, Math.min(100, (margin / 25) * 100)) * 0.5
      : 0;
    const roivaScore = Math.round(roiScoreB + marginScoreB) || 0;

    // Stock Equivalents for Boutique
    const averageStock = (data.initialStock + data.finalStock) / 2 || 0;
    const stockTurnover = averageStock > 0 ? totalVariableCosts / averageStock : 0;
    const dailySalesVelocity =
      data.targetSalesPeriod === "Semaine"
        ? (data.targetSales || 0) / 7
        : (data.targetSales || 0) / 30;
    const stockDurationDays = dailySalesVelocity > 0 ? averageStock / dailySalesVelocity : 0;
    const stockDurationWeeks = stockDurationDays / 7;
    const recommendedMinStock = dailySalesVelocity * (data.safetyStock || 0);

    return {
      revenue,
      totalCosts,
      netProfit,
      roi,
      margin,
      breakEvenPoint: breakEvenTurnover,
      monthlyFixedCosts,
      annualFixedCosts,
      employeeCosts,
      loanPayment: activeLoanPayment,
      roivaScore,
      averageStock,
      stockTurnover,
      stockDurationDays,
      stockDurationWeeks,
      recommendedMinStock,
    };
  }

  // Revenue calc
  const baseRevenue = data.volume * data.unitPrice;
  // apply growth over a faux 12 month period (simple projection)
  const revenue = baseRevenue * (1 + data.annualGrowth / 100) * mult.rev;

  // Cost calc
  const rawCosts = data.volume * data.unitCost * mult.cost;
  const marketingCosts = revenue * (data.marketingExpense / 100);
  const logisticCosts = revenue * (data.logisticsOps / 100);
  const totalFixedCosts = (data.fixedCosts || 0) * 12; // Annualized

  const totalCosts =
    rawCosts + marketingCosts + logisticCosts + totalFixedCosts;
  const netProfit = revenue - totalCosts;

  // Safety check for initialCapital to avoid Infinity
  const roi =
    data.initialCapital > 0 ? (netProfit / data.initialCapital) * 100 : 0;

  // Stock Average Calculation
  const averageStock = (data.initialStock + data.finalStock) / 2;
  const stockTurnover = averageStock > 0 ? rawCosts / averageStock : 0;

  // New: Stock Duration (Days of inventory)
  // Formula: Stock available / Average sales per day
  const dailyVolume = data.volume / 365;
  const stockDurationDays = dailyVolume > 0 ? averageStock / dailyVolume : 0;
  const stockDurationWeeks = stockDurationDays / 7;

  // New: Recommended Minimum Stock (Always be in stock)
  const dailySalesVelocity =
    data.targetSalesPeriod === "Semaine"
      ? data.targetSales / 7
      : data.targetSales / 30;
  const recommendedMinStock = dailySalesVelocity * data.safetyStock;

  // Performance Score Logic (Index 0-100)
  const roiScore = isFinite(roi)
    ? Math.max(0, Math.min(100, (roi / 25) * 100)) * 0.4
    : 0;
  const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const marginScore = isFinite(margin)
    ? Math.max(0, Math.min(100, (margin / 30) * 100)) * 0.4
    : 0;
  const growthScore = isFinite(data.annualGrowth)
    ? Math.max(0, Math.min(100, (data.annualGrowth / 15) * 100)) * 0.2
    : 0;
  const roivaScore = Math.round(roiScore + marginScore + growthScore) || 0;

  const irr = roi * 0.75;
  const breakEvenPoint = totalFixedCosts / (1 - rawCosts / revenue);

  return {
    revenue,
    totalCosts,
    netProfit,
    roi,
    irr,
    margin,
    marketingCosts,
    logisticCosts,
    rawCosts,
    roivaScore,
    averageStock,
    stockTurnover,
    stockDurationDays,
    stockDurationWeeks,
    recommendedMinStock,
    breakEvenPoint,
  };
};

export const generateScenarios = (data: any) => {
  return {
    Pessimiste: runSimulation(data, "Pessimiste"),
    Réaliste: runSimulation(data, "Réaliste"),
    Optimiste: runSimulation(data, "Optimiste"),
  };
};
