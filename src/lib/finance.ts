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
    
    const totalCosts = rawCosts + marketingCosts + logisticCosts;
    const netProfit = revenue - totalCosts;
    const roi = (netProfit / data.initialCapital) * 100;
    
    // Make up IRR for MVP based on ROI
    const irr = roi * 0.75; 
    
    return { revenue, totalCosts, netProfit, roi, irr, marketingCosts, logisticCosts, rawCosts };
}

export const generateScenarios = (data: any) => {
    return {
        "Pessimiste": runSimulation(data, "Pessimiste"),
        "Réaliste": runSimulation(data, "Réaliste"),
        "Optimiste": runSimulation(data, "Optimiste")
    }
}
