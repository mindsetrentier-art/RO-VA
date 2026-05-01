import { ScenarioType } from '../store';

const multipliers: Record<ScenarioType, { rev: number, cost: number }> = {
  "Pessimiste": { rev: 0.85, cost: 1.15 },
  "Réaliste": { rev: 1.0, cost: 1.0 },
  "Optimiste": { rev: 1.25, cost: 0.90 }
};

export const runSimulation = (data: any, scenario: ScenarioType) => {
    const mult = multipliers[scenario];
    
    // Revenue calc
    const baseRevenue = data.volume * data.unitPrice;
    // apply growth over a faux 12 month period (simple projection)
    const revenue = baseRevenue * (1 + data.annualGrowth/100) * mult.rev;
    
    // Cost calc
    const rawCosts = data.volume * data.unitCost * mult.cost;
    const marketingCosts = revenue * (data.marketingExpense / 100);
    const logisticCosts = revenue * (data.logisticsOps / 100);
    const totalFixedCosts = (data.fixedCosts || 0) * 12; // Annualized
    
    const totalCosts = rawCosts + marketingCosts + logisticCosts + totalFixedCosts;
    const netProfit = revenue - totalCosts;
    
    // Safety check for initialCapital to avoid Infinity
    const roi = data.initialCapital > 0 ? (netProfit / data.initialCapital) * 100 : 0;
    
    // Stock Average Calculation
    const averageStock = (data.initialStock + data.finalStock) / 2;
    const stockTurnover = averageStock > 0 ? (rawCosts / averageStock) : 0;
    
    // New: Stock Duration (Days of inventory)
    // Formula: Stock available / Average sales per day
    const dailyVolume = data.volume / 365;
    const stockDurationDays = dailyVolume > 0 ? (averageStock / dailyVolume) : 0;
    const stockDurationWeeks = stockDurationDays / 7;

    // New: Recommended Minimum Stock (Always be in stock)
    const dailySalesVelocity = data.targetSalesPeriod === "Semaine" ? (data.targetSales / 7) : (data.targetSales / 30);
    const recommendedMinStock = dailySalesVelocity * data.safetyStock;
    
    // Performance Score Logic (Index 0-100)
    const roiScore = isFinite(roi) ? Math.max(0, Math.min(100, (roi / 25) * 100)) * 0.4 : 0;
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const marginScore = isFinite(margin) ? Math.max(0, Math.min(100, (margin / 30) * 100)) * 0.4 : 0;
    const growthScore = isFinite(data.annualGrowth) ? Math.max(0, Math.min(100, (data.annualGrowth / 15) * 100)) * 0.2 : 0;
    const roivaScore = Math.round(roiScore + marginScore + growthScore) || 0;
    
    // Make up IRR for MVP based on ROI
    const irr = roi * 0.75; 
    
    return { revenue, totalCosts, netProfit, roi, irr, margin, marketingCosts, logisticCosts, rawCosts, roivaScore, averageStock, stockTurnover, stockDurationDays, stockDurationWeeks, recommendedMinStock };
}

export const generateScenarios = (data: any) => {
    return {
        "Pessimiste": runSimulation(data, "Pessimiste"),
        "Réaliste": runSimulation(data, "Réaliste"),
        "Optimiste": runSimulation(data, "Optimiste")
    }
}
