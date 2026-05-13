// ============================================================
// DATA MODELS — Dquant9.0 Financial Strategy Dashboard
// ============================================================

export const PARTICIPANTS = [
  { id: 'kimhyunsu', name: '김현수', type: 'individual' },
  { id: 'nasungsu', name: '나성수', type: 'individual' },
  { id: 'imhyun', name: '임현', type: 'individual' },
  { id: 'kimhannim', name: '김한님', type: 'individual' },
  { id: 'nasangsu', name: '나상수', type: 'individual' },
  { id: 'parksunghun', name: '박승훈', type: 'individual' },
  { id: 'company', name: '법인(회사)', type: 'corporate' },
];

// 기본 사업조건 초기값
export const DEFAULT_CONFIG = {
  startMonth: '2026-06',
  endMonth: '2029-03',
  baseReturnRate: 0.15, // 월 15%

  // 일반사업 시드 (월별)
  generalSeeds: [
    { startMonth: '2026-07', endMonth: '2026-12', amount: 4000000 },
    { startMonth: '2027-01', endMonth: '2027-12', amount: 5000000 },
    { startMonth: '2028-01', endMonth: '2029-03', amount: 7000000 },
  ],

  // 투자파트너 자금
  partnerInflows: [
    { id: 'p1', participantId: 'kimhyunsu',  name: '김현수',  month: '2026-06', amount: 90000000 },
    { id: 'p2', participantId: 'nasungsu',   name: '나성수',  month: '2026-11', amount: 100000000 },
    { id: 'p3', participantId: 'imhyun',     name: '임현',    month: '2027-07', amount: 30000000 },
    { id: 'p4', participantId: 'imhyun',     name: '임현',    month: '2027-12', amount: 50000000 },
    { id: 'p5', participantId: 'imhyun',     name: '임현(상반기)', month: '2027-03', amount: 100000000 },
    { id: 'p6', participantId: 'imhyun',     name: '임현(하반기)', month: '2027-09', amount: 200000000 },
    // 김한님: 2027-08~2027-12 100M 분할 (20M/월)
    { id: 'p7', participantId: 'kimhannim',  name: '김한님', month: '2027-08', amount: 20000000 },
    { id: 'p8', participantId: 'kimhannim',  name: '김한님', month: '2027-09', amount: 20000000 },
    { id: 'p9', participantId: 'kimhannim',  name: '김한님', month: '2027-10', amount: 20000000 },
    { id: 'p10', participantId: 'kimhannim', name: '김한님', month: '2027-11', amount: 20000000 },
    { id: 'p11', participantId: 'kimhannim', name: '김한님', month: '2027-12', amount: 20000000 },
    { id: 'p12', participantId: 'kimhannim', name: '김한님(상반기)', month: '2027-03', amount: 100000000 },
    { id: 'p13', participantId: 'kimhannim', name: '김한님(하반기)', month: '2027-09', amount: 100000000 },
  ],

  // 보험연계 자금
  insurance: {
    salesStartMonth: '2026-06',
    salesEndMonth: '2027-02',
    allowanceStartMonth: '2026-07',
    allowanceEndMonth: '2027-03',
    slots: 5,
    monthlyPremiumPerSlot: 3000000,   // 슬롯당 월납보험료
    monthlyAllowancePerSlot: 27000000, // 슬롯당 월 수당수익
    get totalMonthlyPremium() { return this.slots * this.monthlyPremiumPerSlot; },
    get totalMonthlyAllowance() { return this.slots * this.monthlyAllowancePerSlot; },
  },

  // 정착수당
  settlementAllowance: [
    { month: '2026-07', amount: 4000000 },
    { month: '2026-08', amount: 3000000 },
    { month: '2026-09', amount: 3000000 },
  ],

  // 보험 해약환급
  insuranceRefund: {
    maintenanceMonths: 24,  // 유지기간
    refundMonth: 25,         // 25차월
    refundRate: 0.30,        // 총납입보험료의 30%
    reinvest: true,
  },

  // 비용 구조 (3개 구간)
  costPhases: [
    {
      id: 'phase1',
      label: '1차 구간',
      startMonth: '2026-07',
      endMonth: '2027-01',
      items: [
        { id: 'c1_1', name: '나상수', amount: 2300000 },
        { id: 'c1_2', name: '임현',   amount: 2200000 },
        { id: 'c1_3', name: '박승훈', amount: 2100000 },
        { id: 'c1_4', name: '나성수', amount: 3000000 },
        { id: 'c1_5', name: '김현수', amount: 3000000 },
        { id: 'c1_6', name: '회사 운영비', amount: 3000000 },
        { id: 'c1_7', name: '고객 수익분배금', amount: 8000000 },
      ],
    },
    {
      id: 'phase2',
      label: '2차 구간',
      startMonth: '2027-02',
      endMonth: '2028-02',
      items: [
        { id: 'c2_1', name: '나상수', amount: 2500000 },
        { id: 'c2_2', name: '임현',   amount: 3000000 },
        { id: 'c2_3', name: '박승훈', amount: 2200000 },
        { id: 'c2_4', name: '나성수', amount: 4000000 },
        { id: 'c2_5', name: '김현수', amount: 4000000 },
        { id: 'c2_6', name: '회사 운영비', amount: 4000000 },
        { id: 'c2_7', name: '김한님',  amount: 3000000 },
        { id: 'c2_8', name: '고객 수익분배금', amount: 13000000 },
      ],
    },
    {
      id: 'phase3',
      label: '3차 구간',
      startMonth: '2028-03',
      endMonth: '2029-02',
      items: [
        { id: 'c3_1', name: '나상수', amount: 3000000 },
        { id: 'c3_2', name: '임현',   amount: 4000000 },
        { id: 'c3_3', name: '박승훈', amount: 4000000 },
        { id: 'c3_4', name: '나성수', amount: 5000000 },
        { id: 'c3_5', name: '김현수', amount: 5000000 },
        { id: 'c3_6', name: '회사 운영비', amount: 10000000 },
        { id: 'c3_7', name: '김한님',  amount: 3500000 },
        { id: 'c3_8', name: '고객 수익분배금', amount: 20000000 },
      ],
    },
  ],

  // 결산 시점
  settlementDates: [
    '2027-03',
    '2028-03',
    '2029-03',
  ],

  // 과세 설정
  taxConfig: {
    mode: 'none', // 'none' | 'simple' | 'detailed'
    individual: {
      incomeTaxRate: 0.38,     // 종합소득세(가정)
      dividendTaxRate: 0.154,  // 배당소득세(원천징수 포함)
      localTaxIncluded: true,
    },
    corporate: {
      corporateTaxRate: 0.22,  // 법인세
      localTaxIncluded: true,
    },
  },

  // 참여자 과세 프로파일
  participantProfiles: [
    { id: 'kimhyunsu',  name: '김현수', entityType: 'individual', principal: 90000000,  distributionRatio: 0.15, taxProfile: 'individual', incomeType: 'investment', priorityReturn: true },
    { id: 'nasungsu',   name: '나성수', entityType: 'individual', principal: 100000000, distributionRatio: 0.17, taxProfile: 'individual', incomeType: 'investment', priorityReturn: true },
    { id: 'imhyun',     name: '임현',   entityType: 'individual', principal: 380000000, distributionRatio: 0.30, taxProfile: 'individual', incomeType: 'investment', priorityReturn: true },
    { id: 'kimhannim',  name: '김한님', entityType: 'individual', principal: 220000000, distributionRatio: 0.20, taxProfile: 'individual', incomeType: 'investment', priorityReturn: false },
    { id: 'company',    name: '법인',   entityType: 'corporate',  principal: 0,         distributionRatio: 0.18, taxProfile: 'corporate',  incomeType: 'dividend',    priorityReturn: false },
  ],
};

// 시나리오 정의
export const SCENARIOS = {
  base: {
    id: 'base',
    label: 'Base',
    color: '#c9a84c',
    description: '월 15% 수익률, 현재 입력값 기준',
    overrides: {},
  },
  conservative: {
    id: 'conservative',
    label: 'Conservative',
    color: '#60a5fa',
    description: '월 8% 수익률, 일부 유입 지연, 보수적 환급률',
    overrides: {
      baseReturnRate: 0.08,
      insuranceRefund: { refundRate: 0.20 },
    },
  },
  aggressive: {
    id: 'aggressive',
    label: 'Aggressive',
    color: '#34d399',
    description: '월 18% 수익률, 유입 자금 100% 반영, 환급금 즉시 재투자',
    overrides: {
      baseReturnRate: 0.18,
      insuranceRefund: { refundRate: 0.35, reinvest: true },
    },
  },
  taxHeavy: {
    id: 'taxHeavy',
    label: 'Tax-Heavy',
    color: '#f87171',
    description: '과세 강하게 반영',
    overrides: {
      taxConfig: { mode: 'detailed' },
    },
  },
  taxOptimized: {
    id: 'taxOptimized',
    label: 'Tax-Optimized',
    color: '#a78bfa',
    description: '법인/개인 구조 최적화 가정',
    overrides: {
      taxConfig: { mode: 'detailed' },
      participantProfiles: [{ id: 'company', distributionRatio: 0.50 }],
    },
  },
};
