// ============================================================
// CALCULATION ENGINE — Dquant9.0
// ============================================================

/**
 * 월 문자열(YYYY-MM) 유틸리티
 */
export function parseMonth(str) {
  const [y, m] = str.split('-').map(Number);
  return { year: y, month: m };
}

export function monthToIndex(str) {
  const { year, month } = parseMonth(str);
  return year * 12 + month;
}

export function indexToMonth(idx) {
  const year = Math.floor(idx / 12);
  const month = idx % 12;
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function addMonths(str, n) {
  const idx = monthToIndex(str);
  return indexToMonth(idx + n);
}

export function monthsBetween(start, end) {
  return monthToIndex(end) - monthToIndex(start);
}

export function isMonthInRange(month, start, end) {
  const m = monthToIndex(month);
  return m >= monthToIndex(start) && m <= monthToIndex(end);
}

export function generateMonthRange(start, end) {
  const months = [];
  let cur = monthToIndex(start);
  const endIdx = monthToIndex(end);
  while (cur <= endIdx) {
    months.push(indexToMonth(cur));
    cur++;
  }
  return months;
}

/**
 * 숫자 포맷
 */
export function fmt(n, decimals = 0) {
  if (n === undefined || n === null || isNaN(n)) return '-';
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

// fmtB: 천단위 쉼표 + 원 단위 (억/만 축약 없음)
export function fmtB(n) {
  if (n === undefined || n === null || isNaN(n)) return '-';
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

export function fmtPct(n, decimals = 1) {
  return `${(n * 100).toFixed(decimals)}%`;
}

// ============================================================
// 핵심 계산 엔진
// ============================================================

/**
 * config에서 월별 유입금 맵 생성
 */
function buildInflowMap(config) {
  const map = {}; // month -> { general, partner, insuranceAllowance, settlementAllowance, insuranceRefund, other }

  const init = (m) => {
    if (!map[m]) map[m] = {
      general: 0,
      partner: 0,
      insuranceAllowance: 0,
      settlementAllowance: 0,
      insuranceRefund: 0,
      other: 0,
    };
  };

  // 일반사업 시드
  config.generalSeeds.forEach(seed => {
    generateMonthRange(seed.startMonth, seed.endMonth).forEach(m => {
      init(m); map[m].general += seed.amount;
    });
  });

  // 투자파트너 자금
  config.partnerInflows.forEach(p => {
    init(p.month); map[p.month].partner += p.amount;
  });

  // 보험 수당 유입
  const ins = config.insurance;
  generateMonthRange(ins.allowanceStartMonth, ins.allowanceEndMonth).forEach(m => {
    init(m); map[m].insuranceAllowance += ins.totalMonthlyAllowance || (ins.slots * ins.monthlyAllowancePerSlot);
  });

  // 정착수당
  config.settlementAllowance.forEach(sa => {
    init(sa.month); map[sa.month].settlementAllowance += sa.amount;
  });

  // 보험 해약환급금
  // 유지기간 후 25차월에 총납입보험료의 30% 환급
  const { maintenanceMonths, refundRate, reinvest } = config.insuranceRefund;
  if (reinvest) {
    // 보험료 납입 시작: allowanceStartMonth 기준 계산
    const premiumStart = ins.allowanceStartMonth;
    const totalPremiumPaid = ins.totalMonthlyPremium * monthsBetween(ins.allowanceStartMonth, ins.allowanceEndMonth);
    const refundMonth = addMonths(premiumStart, maintenanceMonths + 1);
    const refundAmt = totalPremiumPaid * refundRate;
    init(refundMonth);
    map[refundMonth].insuranceRefund += refundAmt;
  }

  return map;
}

/**
 * config에서 월별 유출금 맵 생성
 */
function buildOutflowMap(config) {
  const map = {}; // month -> { insurance, cost, other }

  const init = (m) => {
    if (!map[m]) map[m] = { insurance: 0, cost: 0, other: 0 };
  };

  // 보험료 납입: salesStartMonth ~ salesEndMonth
  const ins = config.insurance;
  const totalMonthlyPremium = ins.totalMonthlyPremium || (ins.slots * ins.monthlyPremiumPerSlot);
  generateMonthRange(ins.salesStartMonth, ins.salesEndMonth).forEach(m => {
    init(m); map[m].insurance += totalMonthlyPremium;
  });

  // 비용 구간별
  config.costPhases.forEach(phase => {
    const months = generateMonthRange(phase.startMonth, phase.endMonth);
    const totalCost = phase.items.reduce((s, i) => s + i.amount, 0);
    months.forEach(m => {
      init(m); map[m].cost += totalCost;
    });
  });

  return map;
}

/**
 * 세금 계산
 */
function calcTax(profit, taxConfig, entityType = 'individual') {
  if (!taxConfig || taxConfig.mode === 'none') return 0;

  if (taxConfig.mode === 'simple') {
    // 간이 세율
    return entityType === 'corporate'
      ? profit * taxConfig.corporate.corporateTaxRate
      : profit * taxConfig.individual.dividendTaxRate;
  }

  if (taxConfig.mode === 'detailed') {
    if (entityType === 'corporate') {
      let rate = taxConfig.corporate.corporateTaxRate;
      if (taxConfig.corporate.localTaxIncluded) rate *= 1.1;
      return profit * rate;
    } else {
      // 개인: 금융소득 분리과세 가정
      let rate = taxConfig.individual.dividendTaxRate;
      if (taxConfig.individual.localTaxIncluded) rate = Math.min(rate, 0.154);
      return profit * rate;
    }
  }
  return 0;
}

/**
 * 메인 계산 엔진: 월별 워크테이블 생성
 */
export function calculateWorkTable(config) {
  const months = generateMonthRange(config.startMonth, config.endMonth);
  const inflowMap = buildInflowMap(config);
  const outflowMap = buildOutflowMap(config);
  const settlementSet = new Set(config.settlementDates || []);

  const rows = [];
  let prevBalance = 0;
  let cumulativePrincipal = 0;
  let cumulativeInflow = 0;
  let cumulativeOutflow = 0;
  let cumulativeReturn = 0;
  let cumulativeTax = 0;
  let settlementIndex = 0; // 결산 순서 추적 (0-based)

  months.forEach((month, idx) => {
    const inflow = inflowMap[month] || { general: 0, partner: 0, insuranceAllowance: 0, settlementAllowance: 0, insuranceRefund: 0, other: 0 };
    const outflow = outflowMap[month] || { insurance: 0, cost: 0, other: 0 };

    const totalInflow = Object.values(inflow).reduce((s, v) => s + v, 0);
    const totalOutflow = Object.values(outflow).reduce((s, v) => s + v, 0);

    // 투자수익 = 전월말잔액 × 월수익률
    const investmentReturn = prevBalance * config.baseReturnRate;

    // 당월 세전 잔액
    const preTaxBalance = prevBalance + totalInflow + investmentReturn - totalOutflow;

    // 당월 세후 잔액 (결산 시점에만 차감, 아니면 세전과 동일)
    const isSettlement = settlementSet.has(month);

    // 누적 원금 = 유입된 시드 + 파트너 자금
    const principalInflow = inflow.general + inflow.partner;
    cumulativePrincipal += principalInflow;
    cumulativeInflow += totalInflow;
    cumulativeOutflow += totalOutflow;
    cumulativeReturn += investmentReturn;

    // 세전 이익 = 결산시점잔액 - 누적원금
    const preTaxProfit = preTaxBalance - cumulativePrincipal;

    // 세후 계산 (결산 시점)
    let taxAmount = 0;
    let afterTaxBalance = preTaxBalance;
    let afterTaxProfit = preTaxProfit;

    if (isSettlement) {
      const mode = config.taxConfig?.mode;
      if (mode === 'settlement_from_2nd') {
        // 1차 결산(index=0): 비과세 / 2차·3차(index>=1): flatRate 적용
        if (settlementIndex >= 1) {
          const rate = config.taxConfig.flatRate ?? 0.332;
          taxAmount = Math.max(0, preTaxProfit) * rate;
          afterTaxBalance = preTaxBalance - taxAmount;
          afterTaxProfit = preTaxProfit - taxAmount;
        }
        settlementIndex++;
      } else if (mode !== 'none' && mode != null) {
        taxAmount = calcTax(preTaxProfit, config.taxConfig, 'individual');
        afterTaxBalance = preTaxBalance - taxAmount;
        afterTaxProfit = preTaxProfit - taxAmount;
        settlementIndex++;
      } else {
        settlementIndex++;
      }
    }

    cumulativeTax += taxAmount;

    const roi = cumulativePrincipal > 0
      ? (preTaxBalance - cumulativePrincipal) / cumulativePrincipal
      : 0;

    const afterTaxRoi = cumulativePrincipal > 0
      ? (afterTaxBalance - cumulativePrincipal) / cumulativePrincipal
      : 0;

    const row = {
      month,
      idx,
      isSettlement,

      // 유입 상세
      inflow,
      totalInflow,
      principalInflow,

      // 유출 상세
      outflow,
      totalOutflow,

      // 수익
      investmentReturn,
      cumulativeReturn,

      // 잔액
      openingBalance: prevBalance,
      closingBalance: preTaxBalance,
      preTaxBalance,
      afterTaxBalance,

      // 이익
      preTaxProfit,
      afterTaxProfit,
      taxAmount,
      cumulativeTax,

      // 누적
      cumulativePrincipal,
      cumulativeInflow,
      cumulativeOutflow,

      // ROI
      roi,
      afterTaxRoi,
    };

    rows.push(row);
    prevBalance = preTaxBalance; // 다음 월 기초잔액
  });

  return rows;
}

/**
 * 결산 시점 요약 계산
 */
export function calculateSettlementSummary(rows, config) {
  const settlementRows = rows.filter(r => r.isSettlement);

  return settlementRows.map(row => {
    const distributables = calcDistributableAmount(row, config);
    return {
      month: row.month,
      cumulativePrincipal: row.cumulativePrincipal,
      closingBalance: row.closingBalance,
      preTaxProfit: row.preTaxProfit,
      afterTaxProfit: row.afterTaxProfit,
      taxAmount: row.taxAmount,
      roi: row.roi,
      afterTaxRoi: row.afterTaxRoi,
      distributables,
    };
  });
}

/**
 * 분배 가능 이익 계산
 */
function calcDistributableAmount(row, config) {
  const distributable = Math.max(0, row.afterTaxProfit);
  return config.participantProfiles.map(p => ({
    ...p,
    preTaxShare: row.preTaxProfit * p.distributionRatio,
    afterTaxShare: distributable * p.distributionRatio,
    principalReturn: p.priorityReturn ? Math.min(p.principal, row.closingBalance * p.distributionRatio) : 0,
  }));
}

/**
 * 참여자별 결과 계산
 */
export function calculateParticipantResults(rows, config) {
  const lastRow = rows[rows.length - 1];
  if (!lastRow) return [];

  return config.participantProfiles.map(p => {
    const preTaxShare = lastRow.preTaxProfit * p.distributionRatio;
    const afterTaxShare = lastRow.afterTaxProfit * p.distributionRatio;
    const taxOnShare = calcTax(preTaxShare, config.taxConfig, p.entityType);
    const netProfit = preTaxShare - taxOnShare;
    const totalReturn = p.principal + netProfit;

    return {
      ...p,
      totalPrincipal: p.principal,
      preTaxShare,
      afterTaxShare,
      estimatedTax: taxOnShare,
      netProfit,
      totalReturn,
      principalRecovered: p.principal > 0 && lastRow.closingBalance > 0,
      roi: p.principal > 0 ? netProfit / p.principal : 0,
    };
  });
}

/**
 * 시나리오 오버라이드 적용
 */
export function applyScenarioOverrides(baseConfig, overrides) {
  if (!overrides || Object.keys(overrides).length === 0) return baseConfig;

  const merged = JSON.parse(JSON.stringify(baseConfig));

  if (overrides.baseReturnRate !== undefined) {
    merged.baseReturnRate = overrides.baseReturnRate;
  }
  if (overrides.insuranceRefund) {
    merged.insuranceRefund = { ...merged.insuranceRefund, ...overrides.insuranceRefund };
  }
  if (overrides.taxConfig) {
    merged.taxConfig = { ...merged.taxConfig, ...overrides.taxConfig };
  }

  return merged;
}

/**
 * KPI 요약 계산
 */
export function calculateKPIs(rows) {
  if (!rows || rows.length === 0) return null;

  const lastRow = rows[rows.length - 1];
  const nextSettlement = rows.find(r => r.isSettlement && monthToIndex(r.month) >= monthToIndex(lastRow.month));
  const settlements = rows.filter(r => r.isSettlement);

  return {
    totalPrincipal: lastRow.cumulativePrincipal,
    currentBalance: lastRow.closingBalance,
    afterTaxBalance: lastRow.afterTaxBalance,
    totalROI: lastRow.roi,
    afterTaxROI: lastRow.afterTaxRoi,
    cumulativeInflow: lastRow.cumulativeInflow,
    cumulativeOutflow: lastRow.cumulativeOutflow,
    cumulativeReturn: lastRow.cumulativeReturn,
    preTaxProfit: lastRow.preTaxProfit,
    afterTaxProfit: lastRow.afterTaxProfit,
    cumulativeTax: lastRow.cumulativeTax,
    nextSettlementBalance: nextSettlement?.closingBalance ?? lastRow.closingBalance,
    nextSettlementMonth: nextSettlement?.month ?? lastRow.month,
    totalMonths: rows.length,
    settlements,
  };
}
