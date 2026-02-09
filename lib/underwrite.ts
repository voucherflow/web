export type Deal = {
    zip?: string;
    bedrooms?: number;
    purchasePrice?: number;
    rehabCost?: number;
    arv?: number;
    hudRent?: number;
    assumptions?: any;
    loan?: any;
  };
  
  export function underwrite(deal: Deal) {
    const purchase = Number(deal.purchasePrice || 0);
    const rehab = Number(deal.rehabCost || 0);
    const totalCost = purchase + rehab;
  
    const rent = Number(deal.hudRent || 0);
    const annualRent = rent * 12;
  
    const a = deal.assumptions || {};
    const loan = deal.loan || {};
  
    const vacancyPct = Number(a.vacancyPct || 0);
    const repairsPct = Number(a.repairsPct || 0);
    const managementPct = Number(a.managementPct || 0);
    const capexPct = Number(a.capexPct || 0);
  
    const taxesMonthly = Number(a.taxesMonthly || 0);
    const insuranceMonthly = Number(a.insuranceMonthly || 0);
    const hoaMonthly = Number(a.hoaMonthly || 0);
    const debtServiceMonthly = Number(a.debtServiceMonthly || 0);
  
    const vacancy = annualRent * (vacancyPct / 100);
    const repairs = annualRent * (repairsPct / 100);
    const management = annualRent * (managementPct / 100);
    const capex = annualRent * (capexPct / 100);
  
    const fixed = (taxesMonthly + insuranceMonthly + hoaMonthly) * 12;
    const opEx = vacancy + repairs + management + capex + fixed;
  
    const noi = annualRent - opEx;
    const capRate = totalCost > 0 ? (noi / totalCost) * 100 : 0;
  
    const debtAnnual = debtServiceMonthly * 12;
    const cashflowAnnual = noi - debtAnnual;
    const cashflowMonthly = cashflowAnnual / 12;
  
    const arv = Number(deal.arv || 0);
    const equity = arv - totalCost;
    const roi = totalCost > 0 ? (equity / totalCost) * 100 : 0;
  
    return {
      purchase,
      rehab,
      totalCost,
      rent,
      annualRent,
      opEx,
      noi,
      capRate,
      debtServiceMonthly,
      cashflowMonthly,
      arv,
      equity,
      roi,
    };
  }
  