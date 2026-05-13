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

  // 일반사업 시드 (밸류앤코어스 월별 투자금)
  // 1차년: 2026-06~2027-03  → 월 4,000,000원
  // 2차년: 2027-04~2028-03  → 월 7,000,000원
  // 3차년: 2028-04~2029-03  → 월 10,000,000원
  generalSeeds: [
    { startMonth: '2026-06', endMonth: '2027-03', amount: 4000000 },
    { startMonth: '2027-04', endMonth: '2028-03', amount: 7000000 },
    { startMonth: '2028-04', endMonth: '2029-03', amount: 10000000 },
  ],

  // ── 투자파트너 자금 (전면 수정) ──────────────────────────────
  //
  // [1차년 2026-06~2027-03]
  //   김현수: 2026-07  90,000,000 / 2027-06 100,000,000
  //   나성수: 2026-06  40,000,000 / 2026-11 100,000,000
  //   김한님: 2026-09  30,000,000 / 2026-10 30,000,000 / 2026-11 20,000,000
  //
  // [2차년 2027-04~2028-03]
  //   임현:   2027-03 100,000,000 / 2027-09 180,000,000
  //   김한님: 2027-03 100,000,000 / 2027-07 100,000,000
  //   김현수: 2027-04 100,000,000
  // ─────────────────────────────────────────────────────────
  partnerInflows: [
    // ── 1차년 파트너 ──
    { id: 'p_kh1', participantId: 'kimhyunsu', name: '김현수', month: '2026-07', amount: 90000000 },
    { id: 'p_kh2', participantId: 'kimhyunsu', name: '김현수', month: '2027-06', amount: 100000000 },

    { id: 'p_ns1', participantId: 'nasungsu',  name: '나성수', month: '2026-06', amount: 40000000 },
    { id: 'p_ns2', participantId: 'nasungsu',  name: '나성수', month: '2026-11', amount: 100000000 },

    { id: 'p_khn1', participantId: 'kimhannim', name: '김한님', month: '2026-09', amount: 30000000 },
    { id: 'p_khn2', participantId: 'kimhannim', name: '김한님', month: '2026-10', amount: 30000000 },
    { id: 'p_khn3', participantId: 'kimhannim', name: '김한님', month: '2026-11', amount: 20000000 },

    // ── 2차년 파트너 ──
    { id: 'p_ih1',  participantId: 'imhyun',    name: '임현',   month: '2027-03', amount: 100000000 },
    { id: 'p_ih2',  participantId: 'imhyun',    name: '임현',   month: '2027-09', amount: 180000000 },

    { id: 'p_khn4', participantId: 'kimhannim', name: '김한님', month: '2027-03', amount: 100000000 },
    { id: 'p_khn5', participantId: 'kimhannim', name: '김한님', month: '2027-07', amount: 100000000 },

    { id: 'p_kh3',  participantId: 'kimhyunsu', name: '김현수', month: '2027-04', amount: 100000000 },
  ],

  // 보험연계 자금
  insurance: {
    salesStartMonth: '2026-06',
    salesEndMonth: '2027-02',
    allowanceStartMonth: '2026-07',
    allowanceEndMonth: '2027-03',
    slots: 5,
    monthlyPremiumPerSlot: 3000000,    // 슬롯당 월납보험료
    monthlyAllowancePerSlot: 27000000, // 슬롯당 월 수당수익
    get totalMonthlyPremium()  { return this.slots * this.monthlyPremiumPerSlot; },
    get totalMonthlyAllowance(){ return this.slots * this.monthlyAllowancePerSlot; },
  },

  // 설계사 정착수당 (명칭 변경: 정착수당 → 설계사정착수당)
  // 나상수 1천, 임현 1천, 박승훈 1천, 나성수 1천 → 총 4천만원
  settlementAllowance: [
    { month: '2026-07', amount: 10000000, label: '나상수 설계사정착수당' },
    { month: '2026-07', amount: 10000000, label: '임현 설계사정착수당' },
    { month: '2026-07', amount: 10000000, label: '박승훈 설계사정착수당' },
    { month: '2026-07', amount: 10000000, label: '나성수 설계사정착수당' },
  ],

  // 보험 해약환급
  insuranceRefund: {
    maintenanceMonths: 24,
    refundMonth: 25,
    refundRate: 0.30,
    reinvest: true,
  },

  // 비용 구조 (3개 구간) — 기존 유지
  costPhases: [
    {
      id: 'phase1',
      label: '1차 구간',
      startMonth: '2026-07',
      endMonth: '2027-01',
      items: [
        { id: 'c1_1', name: '나상수',       amount: 2300000 },
        { id: 'c1_2', name: '임현',         amount: 2200000 },
        { id: 'c1_3', name: '박승훈',       amount: 2100000 },
        { id: 'c1_4', name: '나성수',       amount: 3000000 },
        { id: 'c1_5', name: '김현수',       amount: 3000000 },
        { id: 'c1_6', name: '회사 운영비',  amount: 3000000 },
        { id: 'c1_7', name: '고객 수익분배금', amount: 8000000 },
      ],
    },
    {
      id: 'phase2',
      label: '2차 구간',
      startMonth: '2027-02',
      endMonth: '2028-02',
      items: [
        { id: 'c2_1', name: '나상수',       amount: 2500000 },
        { id: 'c2_2', name: '임현',         amount: 3000000 },
        { id: 'c2_3', name: '박승훈',       amount: 2200000 },
        { id: 'c2_4', name: '나성수',       amount: 4000000 },
        { id: 'c2_5', name: '김현수',       amount: 4000000 },
        { id: 'c2_6', name: '회사 운영비',  amount: 4000000 },
        { id: 'c2_7', name: '김한님',       amount: 3000000 },
        { id: 'c2_8', name: '고객 수익분배금', amount: 13000000 },
      ],
    },
    {
      id: 'phase3',
      label: '3차 구간',
      startMonth: '2028-03',
      endMonth: '2029-02',
      items: [
        { id: 'c3_1', name: '나상수',       amount: 3000000 },
        { id: 'c3_2', name: '임현',         amount: 4000000 },
        { id: 'c3_3', name: '박승훈',       amount: 4000000 },
        { id: 'c3_4', name: '나성수',       amount: 5000000 },
        { id: 'c3_5', name: '김현수',       amount: 5000000 },
        { id: 'c3_6', name: '회사 운영비',  amount: 10000000 },
        { id: 'c3_7', name: '김한님',       amount: 3500000 },
        { id: 'c3_8', name: '고객 수익분배금', amount: 20000000 },
      ],
    },
  ],

  // 결산 시점
  settlementDates: [
    '2027-03', // 1차년 결산
    '2028-03', // 2차년 결산 → 33.2% 과세
    '2029-03', // 3차년 결산 → 33.2% 과세
  ],

  // 과세 설정
  // 2차년(2028-03) & 3차년(2029-03) 결산 시 33.2% 세율 적용
  // taxConfig.mode = 'settlement_from_2nd':
  //   - 1차 결산(2027-03): 과세 없음
  //   - 2차 결산(2028-03): 33.2%
  //   - 3차 결산(2029-03): 33.2%
  taxConfig: {
    mode: 'settlement_from_2nd', // 'none' | 'simple' | 'detailed' | 'settlement_from_2nd'
    flatRate: 0.332,              // 2차년부터 적용 단일 세율 33.2%
    firstSettlementTaxFree: true, // 1차 결산은 비과세
    individual: {
      incomeTaxRate: 0.38,
      dividendTaxRate: 0.154,
      localTaxIncluded: true,
    },
    corporate: {
      corporateTaxRate: 0.22,
      localTaxIncluded: true,
    },
  },

  // 참여자 과세 프로파일 (총 투입 원금 업데이트)
  // 김현수:  90M+100M+100M = 290M
  // 나성수:  40M+100M      = 140M
  // 임현:   100M+180M      = 280M
  // 김한님:  30M+30M+20M+100M+100M = 280M
  participantProfiles: [
    { id: 'kimhyunsu', name: '김현수', entityType: 'individual', principal: 290000000, distributionRatio: 0.20, taxProfile: 'individual', incomeType: 'investment', priorityReturn: true },
    { id: 'nasungsu',  name: '나성수', entityType: 'individual', principal: 140000000, distributionRatio: 0.12, taxProfile: 'individual', incomeType: 'investment', priorityReturn: true },
    { id: 'imhyun',    name: '임현',   entityType: 'individual', principal: 280000000, distributionRatio: 0.28, taxProfile: 'individual', incomeType: 'investment', priorityReturn: true },
    { id: 'kimhannim', name: '김한님', entityType: 'individual', principal: 280000000, distributionRatio: 0.22, taxProfile: 'individual', incomeType: 'investment', priorityReturn: false },
    { id: 'company',   name: '법인',   entityType: 'corporate',  principal: 0,         distributionRatio: 0.18, taxProfile: 'corporate',  incomeType: 'dividend',    priorityReturn: false },
  ],
};

// 시나리오 정의
export const SCENARIOS = {
  base: {
    id: 'base',
    label: 'Base',
    color: '#c9a84c',
    description: '월 15% 수익률, 현재 입력값 기준 (2·3차년 33.2% 과세)',
    overrides: {},
  },
  conservative: {
    id: 'conservative',
    label: 'Conservative',
    color: '#60a5fa',
    description: '월 8% 수익률, 보수적 환급률',
    overrides: {
      baseReturnRate: 0.08,
      insuranceRefund: { refundRate: 0.20 },
    },
  },
  aggressive: {
    id: 'aggressive',
    label: 'Aggressive',
    color: '#34d399',
    description: '월 18% 수익률, 환급금 즉시 재투자',
    overrides: {
      baseReturnRate: 0.18,
      insuranceRefund: { refundRate: 0.35, reinvest: true },
    },
  },
  taxHeavy: {
    id: 'taxHeavy',
    label: 'Tax-Heavy',
    color: '#f87171',
    description: '모든 결산에 33.2% 과세 적용',
    overrides: {
      taxConfig: { mode: 'detailed', flatRate: 0.332 },
    },
  },
  taxOptimized: {
    id: 'taxOptimized',
    label: 'Tax-Optimized',
    color: '#a78bfa',
    description: '법인/개인 구조 최적화, 과세 최소화',
    overrides: {
      taxConfig: { mode: 'settlement_from_2nd', flatRate: 0.22 },
    },
  },
};
