import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, DollarSign, Target, BarChart2,
  ArrowUpRight, ArrowDownRight, Calendar, Layers,
  Users, Shield, Zap, ChevronRight, Activity,
  ChevronDown, ChevronUp, X, Info
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { fmt, fmtB, fmtPct } from '../engine/calculator';
import { SCENARIOS } from '../models/dataModel';

// ── Custom Tooltip ──────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0f2040', border: '1px solid #2a4f8a', borderRadius: 8,
      padding: '0.75rem 1rem', fontSize: '0.75rem', minWidth: 200,
    }}>
      <div style={{ color: '#c9a84c', fontWeight: 700, marginBottom: '0.5rem' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: '#cbd5e1', marginBottom: '0.2rem' }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
            {typeof p.value === 'number' ? `${fmtB(p.value)}원` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const RoiTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0f2040', border: '1px solid #2a4f8a', borderRadius: 8,
      padding: '0.75rem 1rem', fontSize: '0.75rem',
    }}>
      <div style={{ color: '#c9a84c', fontWeight: 700, marginBottom: '0.5rem' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: '0.2rem' }}>
          {p.name}: <strong>{(p.value * 100).toFixed(1)}%</strong>
        </div>
      ))}
    </div>
  );
};

// ── KPI Card ────────────────────────────────────────────────
function KpiCard({ title, value, sub, icon: Icon, color = '#c9a84c', trend, trendLabel }) {
  return (
    <div className="kpi-card" style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          {title}
        </span>
        {Icon && <Icon size={14} color={color} />}
      </div>
      <div style={{ fontSize: '1.0625rem', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2, marginBottom: '0.375rem', wordBreak: 'break-all' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{sub}</div>}
      {trend !== undefined && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.25rem',
          fontSize: '0.6875rem', marginTop: '0.375rem',
          color: trend >= 0 ? '#34d399' : '#f87171',
        }}>
          {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          <span>{trendLabel || `${(trend * 100).toFixed(1)}%`}</span>
        </div>
      )}
    </div>
  );
}

// ── 축 레이블 약식 포매터 ────────────────────────────────────
function axisTickFmt(v) {
  const abs = Math.abs(v);
  if (abs >= 100000000) return `${(v / 100000000).toFixed(0)}억`;
  if (abs >= 10000000)  return `${(v / 10000000).toFixed(0)}천만`;
  if (abs >= 10000)     return `${(v / 10000).toFixed(0)}만`;
  return fmtB(v);
}

// ── 운영비용 모달 ────────────────────────────────────────────
function CostModal({ phaseData, yearLabel, onClose }) {
  // ESC 키로 닫기
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!phaseData || phaseData.length === 0) return null;

  // 전체 최대 항목 금액 (바 너비 기준)
  const allItems = phaseData.flatMap(p => p.items);
  const maxAmt   = Math.max(...allItems.map(i => i.amount));

  // 항목별 색상 매핑
  const itemColors = {
    '나상수':         '#60a5fa',
    '임현':           '#34d399',
    '박승훈':         '#a78bfa',
    '나성수':         '#f472b6',
    '김현수':         '#c9a84c',
    '김한님':         '#fb923c',
    '회사 운영비':    '#94a3b8',
    '고객 수익분배금':'#f87171',
  };
  const getColor = (name) => itemColors[name] || '#64748b';

  const phaseColors = ['#c9a84c', '#60a5fa', '#34d399'];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(4,13,33,0.85)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0a1628',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 16,
          width: '100%', maxWidth: 740,
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* 모달 헤더 */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #162a52',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0f2040 0%, #0a1628 100%)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BarChart2 size={15} color="#f87171" />
            </div>
            <div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#e2e8f0' }}>
                운영 비용 구조 상세 — {yearLabel}
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#475569', marginTop: '0.1rem' }}>
                인건비 · 운영비 · 고객수익분배금 · 구간별 비교
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: 8, cursor: 'pointer', padding: '0.375rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
          >
            <X size={16} color="#f87171" />
          </button>
        </div>

        {/* 모달 본문 (스크롤) */}
        <div style={{ overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* 구간별 요약 카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${phaseData.length}, 1fr)`, gap: '0.75rem' }}>
            {phaseData.map((phase, pi) => (
              <div key={pi} style={{
                padding: '0.875rem 1rem',
                background: '#040d21', borderRadius: 10,
                border: `1px solid ${phaseColors[pi]}30`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: phaseColors[pi], flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: phaseColors[pi] }}>{phase.label}</span>
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#475569', marginBottom: '0.625rem' }}>
                  {phase.startMonth} ~ {phase.endMonth}
                  <span style={{ marginLeft: '0.375rem', color: '#334155' }}>({phase.months}개월)</span>
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#64748b', marginBottom: '0.2rem' }}>월 총 비용</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: phaseColors[pi], fontVariantNumeric: 'tabular-nums' }}>
                  {fmtB(phase.monthlyTotal)}원
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#475569', marginTop: '0.25rem' }}>
                  구간 합계: <span style={{ color: '#94a3b8', fontWeight: 600 }}>{fmtB(phase.periodTotal)}원</span>
                </div>
              </div>
            ))}
          </div>

          {/* 구간별 항목 상세 — 각 구간 탭 */}
          {phaseData.map((phase, pi) => (
            <div key={pi}>
              {/* 구간 헤더 */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                marginBottom: '0.75rem',
              }}>
                <div style={{
                  fontSize: '0.6875rem', fontWeight: 700,
                  padding: '0.2rem 0.75rem', borderRadius: 9999,
                  background: `${phaseColors[pi]}15`, color: phaseColors[pi],
                  border: `1px solid ${phaseColors[pi]}30`,
                }}>{phase.label}</div>
                <span style={{ fontSize: '0.75rem', color: '#475569' }}>
                  {phase.startMonth} ~ {phase.endMonth} · 월 {fmtB(phase.monthlyTotal)}원
                </span>
                <div style={{ flex: 1, height: 1, background: '#162a52' }} />
              </div>

              {/* 항목별 바 차트 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {phase.items.map((item, ii) => {
                  const ratio = maxAmt > 0 ? item.amount / maxAmt : 0;
                  const color = getColor(item.name);
                  return (
                    <div key={ii} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      {/* 이름 */}
                      <div style={{
                        width: 90, fontSize: '0.75rem', color: '#94a3b8',
                        textAlign: 'right', flexShrink: 0, fontWeight: item.name === '고객 수익분배금' ? 600 : 400,
                      }}>
                        {item.name}
                      </div>
                      {/* 바 + 금액 */}
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          flex: 1, height: 20, background: '#0f2040',
                          borderRadius: 4, overflow: 'hidden', position: 'relative',
                        }}>
                          <div style={{
                            width: `${ratio * 100}%`, height: '100%',
                            background: `linear-gradient(90deg, ${color}cc, ${color}88)`,
                            borderRadius: 4,
                            transition: 'width 0.4s ease',
                          }} />
                        </div>
                        <span style={{
                          fontSize: '0.75rem', fontWeight: 700, color,
                          fontVariantNumeric: 'tabular-nums', minWidth: 90, textAlign: 'right',
                        }}>
                          {fmtB(item.amount)}원/월
                        </span>
                        <span style={{
                          fontSize: '0.6875rem', color: '#475569',
                          fontVariantNumeric: 'tabular-nums', minWidth: 80, textAlign: 'right',
                        }}>
                          ({fmtB(item.amount * phase.months)}원)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 소계 */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: '0.625rem', paddingTop: '0.625rem',
                borderTop: `1px solid ${phaseColors[pi]}22`,
              }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  소계 ({phase.months}개월 × {fmtB(phase.monthlyTotal)}원)
                </span>
                <span style={{
                  fontSize: '0.875rem', fontWeight: 800, color: phaseColors[pi],
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  = {fmtB(phase.periodTotal)}원
                </span>
              </div>
            </div>
          ))}

          {/* 전체 합계 */}
          <div style={{
            padding: '1rem 1.25rem',
            background: 'rgba(248,113,113,0.06)',
            borderRadius: 10, border: '1px solid rgba(248,113,113,0.2)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>전체 운영 비용 합계</div>
              <div style={{ fontSize: '0.6875rem', color: '#475569' }}>
                {phaseData.map(p => `${p.label} ${fmtB(p.periodTotal)}원`).join(' + ')}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171', fontVariantNumeric: 'tabular-nums' }}>
                {fmtB(phaseData.reduce((s, p) => s + p.periodTotal, 0))}원
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#475569', marginTop: '0.125rem' }}>총 지출 (전 구간)</div>
            </div>
          </div>

        </div>{/* /스크롤 영역 */}
      </div>
    </div>
  );
}

// ── 운영비용 인라인 확장 컴포넌트 ───────────────────────────
function CostInlineDetail({ phases, yrStart, yrEnd }) {
  const itemColors = {
    '나상수':         '#60a5fa',
    '임현':           '#34d399',
    '박승훈':         '#a78bfa',
    '나성수':         '#f472b6',
    '김현수':         '#c9a84c',
    '김한님':         '#fb923c',
    '회사 운영비':    '#94a3b8',
    '고객 수익분배금':'#f87171',
  };
  const phaseColors = ['#c9a84c', '#60a5fa', '#34d399'];

  // 해당 연차에 겹치는 구간만 표시
  const relevantPhases = phases.filter(p => {
    const s = [p.startMonth, yrStart].sort().pop();
    const e = [p.endMonth,   yrEnd  ].sort()[0];
    return s <= e;
  });

  return (
    <div style={{
      marginTop: '0.5rem',
      padding: '0.625rem 0.75rem',
      background: '#040d21',
      borderRadius: 8,
      border: '1px solid rgba(248,113,113,0.15)',
      display: 'flex', flexDirection: 'column', gap: '0.75rem',
    }}>
      {relevantPhases.map((phase, pi) => {
        const phaseIdx = phases.indexOf(phase);
        const color = phaseColors[phaseIdx] || '#64748b';
        const maxAmt = Math.max(...phase.items.map(i => i.amount));
        return (
          <div key={pi}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '0.375rem',
            }}>
              <span style={{
                fontSize: '0.625rem', fontWeight: 700,
                padding: '0.125rem 0.5rem', borderRadius: 4,
                background: `${color}15`, color, border: `1px solid ${color}30`,
              }}>{phase.label}</span>
              <span style={{ fontSize: '0.625rem', color: '#475569' }}>
                {phase.startMonth}~{phase.endMonth} · 월 {fmtB(phase.monthlyTotal)}원
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {phase.items.map((item, ii) => {
                const ratio = maxAmt > 0 ? item.amount / maxAmt : 0;
                const ic = itemColors[item.name] || '#64748b';
                return (
                  <div key={ii} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#64748b', width: 72, textAlign: 'right', flexShrink: 0 }}>
                      {item.name}
                    </span>
                    <div style={{ flex: 1, height: 14, background: '#0a1628', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        width: `${ratio * 100}%`, height: '100%',
                        background: `linear-gradient(90deg, ${ic}bb, ${ic}66)`,
                        borderRadius: 3,
                      }} />
                    </div>
                    <span style={{
                      fontSize: '0.6875rem', fontWeight: 600, color: ic,
                      fontVariantNumeric: 'tabular-nums', minWidth: 72, textAlign: 'right',
                    }}>
                      {fmtB(item.amount)}원
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}


function buildInflowPieData(rows) {
  let general = 0, partner = 0, insurance = 0, settle = 0, refund = 0, other = 0;
  rows.forEach(r => {
    general   += r.inflow.general            || 0;
    partner   += r.inflow.partner            || 0;
    insurance += r.inflow.insuranceAllowance || 0;
    settle    += r.inflow.settlementAllowance|| 0;
    refund    += r.inflow.insuranceRefund    || 0;
    other     += r.inflow.other              || 0;
  });
  return [
    { name: '파트너 자금',       value: partner,   color: '#c9a84c' },
    { name: '보험 수당',         value: insurance, color: '#60a5fa' },
    { name: '일반 시드',         value: general,   color: '#34d399' },
    { name: '설계사정착수당',    value: settle,    color: '#a78bfa' },
    { name: '해약환급',          value: refund,    color: '#f472b6' },
    { name: '기타',              value: other,     color: '#64748b' },
  ].filter(d => d.value > 0);
}

// ── 연차별 자금 구조 계산 ────────────────────────────────────
function buildYearlyFundData(config) {
  const years = [
    { label: '1차년', start: '2026-06', end: '2027-03', color: '#c9a84c' },
    { label: '2차년', start: '2027-04', end: '2028-03', color: '#60a5fa' },
    { label: '3차년', start: '2028-04', end: '2029-03', color: '#34d399' },
  ];

  return years.map(yr => {
    // 투자 파트너 자금 — 해당 연차 구간에 투입된 금액
    const partnerInflows = (config.partnerInflows || [])
      .filter(p => p.month >= yr.start && p.month <= yr.end);

    const partnerMap = {};
    partnerInflows.forEach(p => {
      const key = p.participantId;
      if (!partnerMap[key]) partnerMap[key] = { name: p.name.replace(/\(.*\)/, ''), amount: 0 };
      partnerMap[key].amount += p.amount;
    });
    const partners = Object.values(partnerMap);
    const totalPartner = partners.reduce((s, p) => s + p.amount, 0);

    // 보험 수당 수익
    const ins = config.insurance;
    const allowMonths = countMonthsInRange(
      ins.allowanceStartMonth, ins.allowanceEndMonth,
      yr.start, yr.end
    );
    const totalInsurance = allowMonths * (ins.totalMonthlyAllowance || ins.slots * ins.monthlyAllowancePerSlot);
    const totalPremium   = allowMonths * (ins.totalMonthlyPremium  || ins.slots * ins.monthlyPremiumPerSlot);
    const netInsurance   = totalInsurance - totalPremium;

    // 설계사정착수당
    const settle = (config.settlementAllowance || [])
      .filter(s => s.month >= yr.start && s.month <= yr.end)
      .reduce((s, x) => s + x.amount, 0);

    // 일반 시드
    const generalTotal = (config.generalSeeds || []).reduce((acc, seg) => {
      const months = countMonthsInRange(seg.startMonth, seg.endMonth, yr.start, yr.end);
      return acc + months * seg.amount;
    }, 0);

    // 비용 — 상세 포함
    const costPhaseDetails = (config.costPhases || []).map(phase => {
      const months = countMonthsInRange(phase.startMonth, phase.endMonth, yr.start, yr.end);
      const monthlyTotal = (phase.items || []).reduce((s, item) => s + item.amount, 0);
      return {
        ...phase,
        months,
        monthlyTotal,
        periodTotal: months * monthlyTotal,
      };
    }).filter(p => p.months > 0);

    const totalCost = costPhaseDetails.reduce((s, p) => s + p.periodTotal, 0);

    return {
      ...yr,
      partners,
      totalPartner,
      totalInsurance,
      totalPremium,
      netInsurance,
      settle,
      generalTotal,
      totalCost,
      costPhaseDetails,
      totalInflow: totalPartner + totalInsurance + settle + generalTotal,
    };
  });
}

// 두 기간 구간의 겹치는 월 수 계산
function countMonthsInRange(segStart, segEnd, rangeStart, rangeEnd) {
  const s = [segStart, rangeStart].sort().pop();
  const e = [segEnd, rangeEnd].sort()[0];
  if (s > e) return 0;
  const [sy, sm] = s.split('-').map(Number);
  const [ey, em] = e.split('-').map(Number);
  return (ey - sy) * 12 + (em - sm) + 1;
}

// ── 연차별 성과 영향성 데이터 계산 ──────────────────────────
function buildYearlyImpactData(config, rows) {
  const years = [
    { label: '1차년', start: '2026-06', end: '2027-03', settlementMonth: '2027-03', color: '#c9a84c' },
    { label: '2차년', start: '2027-04', end: '2028-03', settlementMonth: '2028-03', color: '#60a5fa' },
    { label: '3차년', start: '2028-04', end: '2029-03', settlementMonth: '2029-03', color: '#34d399' },
  ];

  return years.map(yr => {
    // ① 투자파트너 자금 투입액 (해당 연차 내 투입)
    const partnerAmount = (config.partnerInflows || [])
      .filter(p => p.month >= yr.start && p.month <= yr.end)
      .reduce((s, p) => s + p.amount, 0);

    // 누적 파트너 자금 (이전 연차 포함 — 복리 운용 기반)
    const partnerCumulative = (config.partnerInflows || [])
      .filter(p => p.month <= yr.end)
      .reduce((s, p) => s + p.amount, 0);

    // ② 보험연계 수당 수익 (해당 연차 내 순수당수익)
    const ins = config.insurance;
    const allowMonths = countMonthsInRange(
      ins.allowanceStartMonth, ins.allowanceEndMonth,
      yr.start, yr.end
    );
    const insGross  = allowMonths * (ins.totalMonthlyAllowance || ins.slots * ins.monthlyAllowancePerSlot);
    const insPremium= allowMonths * (ins.totalMonthlyPremium   || ins.slots * ins.monthlyPremiumPerSlot);
    const insNet    = insGross - insPremium;

    // ③ 일반사업시드 (해당 연차 내 누적 투입)
    const seedAmount = (config.generalSeeds || []).reduce((acc, seg) => {
      const months = countMonthsInRange(seg.startMonth, seg.endMonth, yr.start, yr.end);
      return acc + months * seg.amount;
    }, 0);

    // ④ 결산 시점 실제 잔액/이익 (rows에서 추출)
    const settlementRow = rows ? rows.find(r => r.month === yr.settlementMonth) : null;
    const settlementBalance = settlementRow?.closingBalance ?? 0;
    const preTaxProfit      = settlementRow?.preTaxProfit  ?? 0;
    const afterTaxProfit    = settlementRow?.afterTaxProfit?? 0;
    const taxAmount         = settlementRow?.taxAmount     ?? 0;

    // ⑤ 각 요소의 기여 비중 (투입금액 기준)
    const totalInput = partnerCumulative + seedAmount; // 누적 원금 기준
    const partnerRatio = totalInput > 0 ? partnerCumulative / totalInput : 0;
    const seedRatio    = totalInput > 0 ? seedAmount / totalInput : 0;

    return {
      ...yr,
      // 투자파트너
      partnerAmount,
      partnerCumulative,
      partnerRatio,
      // 보험연계
      insGross,
      insPremium,
      insNet,
      insMonths: allowMonths,
      // 일반시드
      seedAmount,
      seedRatio,
      // 결산 실적
      settlementBalance,
      preTaxProfit,
      afterTaxProfit,
      taxAmount,
      totalInput,
    };
  });
}

// ════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ════════════════════════════════════════════════════════════
export default function Dashboard() {
  const { rows, settlements, participants, kpis, config, activeScenario, setScenario } = useStore();

  // 운영비용 인라인 확장 상태 (연차별 인덱스)
  const [costExpanded, setCostExpanded] = useState([false, false, false]);
  // 운영비용 모달 상태 { open: bool, yi: number }
  const [costModal, setCostModal] = useState({ open: false, yi: 0 });

  const toggleCostExpand = useCallback((yi) => {
    setCostExpanded(prev => prev.map((v, i) => i === yi ? !v : v));
  }, []);
  const openCostModal  = useCallback((yi) => setCostModal({ open: true,  yi }), []);
  const closeCostModal = useCallback(()    => setCostModal({ open: false, yi: 0 }), []);

  const chartData = useMemo(() => {
    if (!rows) return [];
    return rows.map(r => ({
      month:        r.month.slice(2),
      fullMonth:    r.month,
      balance:      r.closingBalance,
      afterTax:     r.afterTaxBalance,
      inflow:       r.totalInflow,
      outflow:      r.totalOutflow,
      returnAmt:    r.investmentReturn,
      roi:          r.roi,
      isSettlement: r.isSettlement,
      principal:    r.cumulativePrincipal,
    }));
  }, [rows]);

  const settlementChartData = useMemo(() => {
    if (!settlements) return [];
    return settlements.map(s => ({
      month:   s.month,
      balance: s.closingBalance,
      preTax:  s.preTaxProfit,
      afterTax:s.afterTaxProfit,
      roi:     s.roi * 100,
    }));
  }, [settlements]);

  const inflowPieData        = useMemo(() => buildInflowPieData(rows || []), [rows]);
  const yearlyFundData       = useMemo(() => buildYearlyFundData(config), [config]);
  const yearlyImpactData     = useMemo(() => buildYearlyImpactData(config, rows), [config, rows]);
  const participantChartData = useMemo(() => {
    if (!participants) return [];
    return participants.map(p => ({
      name:      p.name,
      preTax:    p.preTaxShare,
      afterTax:  p.afterTaxShare,
      principal: p.totalPrincipal,
    }));
  }, [participants]);

  if (!kpis) return <div style={{ color: '#64748b', padding: '2rem' }}>계산 중...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── 운영비용 모달 (포탈) ── */}
      {costModal.open && (
        <CostModal
          phaseData={yearlyFundData[costModal.yi]?.costPhaseDetails || []}
          yearLabel={yearlyFundData[costModal.yi]?.label || ''}
          onClose={closeCostModal}
        />
      )}

      {/* ══════════════════════════════════════════════════════
          ① 결산 시점 요약 테이블 (최상단)
      ══════════════════════════════════════════════════════ */}
      {settlements && settlements.length > 0 && (
        <div className="card">
          <div className="section-header">
            <Calendar size={14} /> 결산 시점 요약
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>결산월</th>
                  <th>누적원금</th>
                  <th>결산잔액</th>
                  <th>세전이익</th>
                  <th>세후이익</th>
                  <th>총투자ROI</th>
                  <th>세후ROI</th>
                  <th>납부세금</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s, i) => (
                  <tr key={i} className="settlement-row">
                    <td>
                      <span className="badge badge-gold">{s.month}</span>
                      {i === 0 && (
                        <span style={{ marginLeft: '0.375rem', fontSize: '0.625rem', color: '#34d399', fontWeight: 700 }}>
                          비과세
                        </span>
                      )}
                      {i >= 1 && (
                        <span style={{ marginLeft: '0.375rem', fontSize: '0.625rem', color: '#f87171', fontWeight: 700 }}>
                          33.2%
                        </span>
                      )}
                    </td>
                    <td className="num">{fmtB(s.cumulativePrincipal)}원</td>
                    <td className="num positive">{fmtB(s.closingBalance)}원</td>
                    <td className="num positive">{fmtB(s.preTaxProfit)}원</td>
                    <td className="num" style={{ color: config.taxConfig.mode !== 'none' ? '#34d399' : '#64748b' }}>
                      {fmtB(s.afterTaxProfit)}원
                    </td>
                    <td className="num gold">{fmtPct(s.roi)}</td>
                    <td className="num" style={{ color: '#a78bfa' }}>{fmtPct(s.afterTaxRoi)}</td>
                    <td className="num negative">{s.taxAmount > 0 ? `${fmtB(s.taxAmount)}원` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 헤더 + 시나리오 토글 ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
            재무전략 대시보드
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#475569', margin: '0.25rem 0 0' }}>
            Dquant 9.0 · {config.startMonth} ~ {config.endMonth} · 월 수익률 {(config.baseReturnRate * 100).toFixed(0)}%
          </p>
        </div>
        <div className="tab-bar" style={{ flexShrink: 0 }}>
          {Object.entries(SCENARIOS).map(([key, sc]) => (
            <button
              key={key}
              className={`tab-item ${activeScenario === key ? 'active' : ''}`}
              onClick={() => setScenario(key)}
              style={{ color: activeScenario === key ? sc.color : undefined, minWidth: 80 }}
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          ② 사업 개요 메시지 배너
      ══════════════════════════════════════════════════════ */}
      <div style={{
        padding: '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, #0a1628 0%, #091424 50%, #0a1628 100%)',
        borderRadius: 12,
        border: '1px solid rgba(201,168,76,0.25)',
        boxShadow: '0 0 30px rgba(201,168,76,0.04)',
      }}>
        {/* 슬로건 */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.6875rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
            Valuencore Group · 사업 추진 전략 요약
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#c9a84c', lineHeight: 1.6 }}>
            보험 연계 수당 수익 + 투자 파트너 자금 복리 운용
            <span style={{ color: '#64748b', fontWeight: 400, fontSize: '0.875rem', marginLeft: '0.5rem' }}>
              → 3개년 안정적 현금흐름 구조
            </span>
          </div>
        </div>

        {/* 3대 수익 축 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
          {[
            { icon: Shield, color: '#60a5fa', title: '① 보험 연계 수당', lines: ['5슬롯 × 27,000,000원/월', '월 135,000,000원 수당 수익', '2026-07 ~ 2027-03 발생'] },
            { icon: TrendingUp, color: '#c9a84c', title: '② 투자 복리 운용', lines: ['월 15% 복리 수익률', '총 790,000,000원 원금', '33개월 복리 성장'] },
            { icon: DollarSign, color: '#34d399', title: '③ 보험 해약 환급', lines: ['24개월 유지 후 25차월', '납입 보험료 30% 환급', '즉시 재투자 구조'] },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '0.875rem 1rem', background: '#040d21',
              borderRadius: 10, border: `1px solid ${item.color}22`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <item.icon size={14} color={item.color} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: item.color }}>{item.title}</span>
              </div>
              {item.lines.map((l, li) => (
                <div key={li} style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.7 }}>
                  {li === 0 ? <span style={{ color: '#94a3b8' }}>{l}</span> : l}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* 결산 시점 타임라인 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'nowrap', overflowX: 'auto' }}>
          {[
            { label: '사업 개시',    month: '2026-06', color: '#475569', isKey: false },
            { label: '보험수당 시작', month: '2026-07', color: '#60a5fa', isKey: true  },
            { label: '1차 결산',    month: '2027-03', color: '#c9a84c', isKey: true  },
            { label: '2차 결산',    month: '2028-03', color: '#60a5fa', isKey: true  },
            { label: '최종 결산',   month: '2029-03', color: '#34d399', isKey: true  },
          ].map((item, i, arr) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: item.isKey ? 10 : 7, height: item.isKey ? 10 : 7,
                  borderRadius: '50%', background: item.color,
                  boxShadow: item.isKey ? `0 0 8px ${item.color}` : 'none',
                  marginBottom: '0.375rem',
                }} />
                <div style={{ fontSize: '0.625rem', color: item.color, fontWeight: item.isKey ? 700 : 400, whiteSpace: 'nowrap' }}>{item.label}</div>
                <div style={{ fontSize: '0.5625rem', color: '#475569', whiteSpace: 'nowrap' }}>{item.month}</div>
              </div>
              {i < arr.length - 1 && (
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #162a52, #162a52)', minWidth: 20 }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* 전략 페이지 링크 */}
        <div style={{ marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid #162a52', display: 'flex', justifyContent: 'flex-end' }}>
          <NavLink to="/strategy" style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            fontSize: '0.75rem', color: '#c9a84c', fontWeight: 600,
            textDecoration: 'none', padding: '0.375rem 0.75rem',
            borderRadius: 6, border: '1px solid rgba(201,168,76,0.25)',
            background: 'rgba(201,168,76,0.06)',
          }}>
            사업 추진 전략 전문 보기 <ChevronRight size={13} />
          </NavLink>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          ③ 연차별 자금 투입 구조
      ══════════════════════════════════════════════════════ */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={14} color="#c9a84c" />
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0' }}>연차별 자금 투입 구조</span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#475569' }}>투입원금 · 보험수당 · 비용 구분</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {yearlyFundData.map((yr, yi) => (
            <div key={yi} style={{
              background: '#0a1628', borderRadius: 12,
              border: `1px solid ${yr.color}30`,
              overflow: 'hidden',
            }}>
              {/* 연차 헤더 */}
              <div style={{
                padding: '0.875rem 1.125rem',
                background: `linear-gradient(135deg, ${yr.color}12 0%, transparent 100%)`,
                borderBottom: `1px solid ${yr.color}20`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800, color: yr.color }}>{yr.label}</div>
                  <div style={{ fontSize: '0.6875rem', color: '#475569', marginTop: '0.1rem' }}>{yr.start} ~ {yr.end}</div>
                </div>
                <div style={{
                  fontSize: '0.6875rem', fontWeight: 700,
                  padding: '0.2rem 0.5rem', borderRadius: 6,
                  background: `${yr.color}15`, color: yr.color,
                  border: `1px solid ${yr.color}30`,
                }}>
                  총 유입 {axisTickFmt(yr.totalInflow)}
                </div>
              </div>

              <div style={{ padding: '0.875rem 1.125rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>

                {/* 투자 파트너 자금 */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                    <Users size={11} color="#c9a84c" />
                    <span style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                      투자 파트너
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 700, color: '#c9a84c', fontVariantNumeric: 'tabular-nums' }}>
                      {yr.totalPartner > 0 ? `${fmtB(yr.totalPartner)}원` : '—'}
                    </span>
                  </div>
                  {yr.partners.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {yr.partners.map((p, pi) => (
                        <div key={pi} style={{
                          display: 'flex', justifyContent: 'space-between',
                          padding: '0.3rem 0.625rem',
                          background: '#040d21', borderRadius: 6,
                          border: '1px solid rgba(201,168,76,0.12)',
                        }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.name}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#c9a84c', fontVariantNumeric: 'tabular-nums' }}>
                            {fmtB(p.amount)}원
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: '#334155', padding: '0.25rem 0.5rem' }}>신규 투입 없음</div>
                  )}
                </div>

                {/* 구분선 */}
                <div style={{ height: 1, background: '#162a52' }} />

                {/* 보험 연계 수익 */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                    <Shield size={11} color="#60a5fa" />
                    <span style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                      보험 연계 수당
                    </span>
                  </div>
                  {yr.totalInsurance > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0.625rem', background: '#040d21', borderRadius: 6, border: '1px solid rgba(96,165,250,0.12)' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>수당 수익 (총)</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#60a5fa', fontVariantNumeric: 'tabular-nums' }}>{fmtB(yr.totalInsurance)}원</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0.625rem', background: '#040d21', borderRadius: 6, border: '1px solid rgba(248,113,113,0.12)' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>보험료 납입 (총)</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f87171', fontVariantNumeric: 'tabular-nums' }}>-{fmtB(yr.totalPremium)}원</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0.625rem', background: 'rgba(52,211,153,0.06)', borderRadius: 6, border: '1px solid rgba(52,211,153,0.2)' }}>
                        <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>순 수당 수익</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', fontVariantNumeric: 'tabular-nums' }}>{fmtB(yr.netInsurance)}원</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: '#334155', padding: '0.25rem 0.5rem' }}>해당 연차 수당 없음</div>
                  )}
                </div>

                {/* 설계사정착수당 */}
                {yr.settle > 0 && (
                  <>
                    <div style={{ height: 1, background: '#162a52' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0.625rem', background: '#040d21', borderRadius: 6, border: '1px solid rgba(167,139,250,0.15)' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Zap size={10} color="#a78bfa" /> 설계사정착수당
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a78bfa', fontVariantNumeric: 'tabular-nums' }}>{fmtB(yr.settle)}원</span>
                    </div>
                  </>
                )}

                {/* 구분선 */}
                <div style={{ height: 1, background: '#162a52' }} />

                {/* ── 운영 비용 — 클릭 확장 + 모달 버튼 ── */}
                <div>
                  {/* 헤더 행 (클릭하면 인라인 확장) */}
                  <div
                    onClick={() => toggleCostExpand(yi)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      cursor: 'pointer', borderRadius: 6,
                      padding: '0.3rem 0.5rem',
                      margin: '-0.3rem -0.5rem',
                      transition: 'background 0.15s',
                      userSelect: 'none',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <BarChart2 size={10} color="#f87171" />
                      운영 비용 (총)
                      <span style={{
                        fontSize: '0.5625rem', color: '#f87171', fontWeight: 600,
                        padding: '0.05rem 0.35rem', borderRadius: 3,
                        background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
                        marginLeft: '0.25rem',
                      }}>
                        {costExpanded[yi] ? '접기' : '상세'}
                      </span>
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f87171', fontVariantNumeric: 'tabular-nums' }}>
                        -{fmtB(yr.totalCost)}원
                      </span>
                      {costExpanded[yi]
                        ? <ChevronUp size={12} color="#f87171" />
                        : <ChevronDown size={12} color="#64748b" />
                      }
                    </div>
                  </div>

                  {/* 인라인 확장: 구간별 항목 바 차트 */}
                  {costExpanded[yi] && (
                    <CostInlineDetail
                      phases={config.costPhases || []}
                      yrStart={yr.start}
                      yrEnd={yr.end}
                    />
                  )}

                  {/* 모달 상세보기 버튼 */}
                  <button
                    onClick={() => openCostModal(yi)}
                    style={{
                      marginTop: '0.5rem', width: '100%',
                      padding: '0.35rem 0.625rem',
                      background: 'rgba(248,113,113,0.06)',
                      border: '1px solid rgba(248,113,113,0.18)',
                      borderRadius: 6, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                      fontSize: '0.6875rem', fontWeight: 600, color: '#f87171',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.06)'}
                  >
                    <Info size={11} color="#f87171" />
                    비용 구조 전체 상세보기
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          ④ 연차별 성과 영향성 분석
      ══════════════════════════════════════════════════════ */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={14} color="#a78bfa" />
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0' }}>연차별 성과 영향성 분석</span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: '#475569' }}>투자파트너 · 보험연계 · 일반시드 기여도</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {yearlyImpactData.map((yr, yi) => {
            // 각 요소의 기여 비율 (투입금액 기준 간이 계산)
            const totalInputFunds = yr.partnerCumulative + yr.seedAmount;
            const totalCashInflow = yr.partnerAmount + yr.insNet + yr.seedAmount;

            return (
              <div key={yi} style={{
                background: '#0a1628', borderRadius: 12,
                border: `1px solid ${yr.color}30`,
                overflow: 'hidden',
              }}>
                {/* 연차 헤더 */}
                <div style={{
                  padding: '0.75rem 1.125rem',
                  background: `linear-gradient(135deg, ${yr.color}10 0%, transparent 100%)`,
                  borderBottom: `1px solid ${yr.color}18`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 800, color: yr.color }}>{yr.label}</span>
                    <span style={{ fontSize: '0.6875rem', color: '#475569', marginLeft: '0.5rem' }}>성과 영향성</span>
                  </div>
                  <div style={{
                    fontSize: '0.6875rem', fontWeight: 700,
                    padding: '0.2rem 0.5rem', borderRadius: 6,
                    background: `${yr.color}15`, color: yr.color,
                    border: `1px solid ${yr.color}30`,
                  }}>
                    결산 {yr.settlementMonth}
                  </div>
                </div>

                <div style={{ padding: '0.875rem 1.125rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>

                  {/* ① 투자파트너 영향성 */}
                  <div style={{ padding: '0.625rem 0.875rem', background: '#040d21', borderRadius: 8, border: '1px solid rgba(201,168,76,0.18)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                      <Users size={11} color="#c9a84c" />
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        투자파트너 자금 영향성
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ color: '#64748b' }}>당해 투입액</span>
                        <span style={{ color: '#c9a84c', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                          {yr.partnerAmount > 0 ? `${fmtB(yr.partnerAmount)}원` : '신규 없음'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ color: '#64748b' }}>누적 운용원금</span>
                        <span style={{ color: '#e2e8f0', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {fmtB(yr.partnerCumulative)}원
                        </span>
                      </div>
                      {/* 기여 비중 바 */}
                      {totalInputFunds > 0 && (
                        <div style={{ marginTop: '0.25rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: '#475569', marginBottom: '0.25rem' }}>
                            <span>원금 기여도</span>
                            <span style={{ color: '#c9a84c', fontWeight: 700 }}>
                              {(yr.partnerRatio * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div style={{ height: 4, background: '#162a52', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${yr.partnerRatio * 100}%`, background: '#c9a84c', borderRadius: 2, transition: 'width 0.5s' }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ② 보험연계 영향성 */}
                  <div style={{ padding: '0.625rem 0.875rem', background: '#040d21', borderRadius: 8, border: '1px solid rgba(96,165,250,0.18)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                      <Shield size={11} color="#60a5fa" />
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        보험연계 활동 영향성
                      </span>
                    </div>
                    {yr.insGross > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span style={{ color: '#64748b' }}>수당 수익 ({yr.insMonths}개월)</span>
                          <span style={{ color: '#60a5fa', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtB(yr.insGross)}원</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span style={{ color: '#64748b' }}>보험료 비용</span>
                          <span style={{ color: '#f87171', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>-{fmtB(yr.insPremium)}원</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', paddingTop: '0.25rem', borderTop: '1px solid #162a52' }}>
                          <span style={{ color: '#34d399', fontWeight: 600 }}>순 현금 기여</span>
                          <span style={{ color: '#34d399', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtB(yr.insNet)}원</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: '#334155' }}>
                        해당 연차 보험 수당 없음
                        <div style={{ fontSize: '0.6875rem', color: '#475569', marginTop: '0.2rem' }}>
                          (1차년 보험 활동 수익이 이후 복리 성장의 기초 자산으로 계속 운용됨)
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ③ 일반사업시드 영향성 */}
                  <div style={{ padding: '0.625rem 0.875rem', background: '#040d21', borderRadius: 8, border: '1px solid rgba(52,211,153,0.18)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                      <DollarSign size={11} color="#34d399" />
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        일반사업시드 영향성
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ color: '#64748b' }}>해당 연차 투입</span>
                        <span style={{ color: '#34d399', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtB(yr.seedAmount)}원</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ color: '#64748b' }}>전체 원금 기여도</span>
                        <span style={{ color: '#34d399', fontWeight: 700 }}>
                          {totalInputFunds > 0 ? `${(yr.seedRatio * 100).toFixed(1)}%` : '—'}
                        </span>
                      </div>
                      {totalInputFunds > 0 && (
                        <div style={{ marginTop: '0.125rem' }}>
                          <div style={{ height: 4, background: '#162a52', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${yr.seedRatio * 100}%`, background: '#34d399', borderRadius: 2 }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 결산 실적 요약 */}
                  <div style={{ height: 1, background: '#162a52' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ fontSize: '0.625rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.125rem' }}>
                      {yr.settlementMonth} 결산 실적
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: '#64748b' }}>결산 잔액</span>
                      <span style={{ color: yr.color, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {yr.settlementBalance > 0 ? `${fmtB(yr.settlementBalance)}원` : '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: '#64748b' }}>세전 이익</span>
                      <span style={{ color: '#c9a84c', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {yr.preTaxProfit > 0 ? `${fmtB(yr.preTaxProfit)}원` : '—'}
                      </span>
                    </div>
                    {yr.taxAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ color: '#64748b' }}>납부 세금 (33.2%)</span>
                        <span style={{ color: '#f87171', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                          -{fmtB(yr.taxAmount)}원
                        </span>
                      </div>
                    )}
                    {yi === 0 && (
                      <div style={{ fontSize: '0.6875rem', color: '#34d399', marginTop: '0.125rem' }}>
                        ✓ 1차 결산 비과세
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        <KpiCard
          title="누적 투자원금"
          value={`${fmtB(kpis.totalPrincipal)}원`}
          sub="총 투자 원금 합계"
          icon={DollarSign}
          color="#60a5fa"
        />
        <KpiCard
          title="현재 세전 잔액"
          value={`${fmtB(kpis.currentBalance)}원`}
          sub={`원금 대비 +${fmtB(kpis.preTaxProfit)}원`}
          icon={TrendingUp}
          color="#c9a84c"
          trend={kpis.totalROI}
          trendLabel={`ROI ${(kpis.totalROI * 100).toFixed(1)}%`}
        />
        <KpiCard
          title="세후 잔액"
          value={`${fmtB(kpis.afterTaxBalance)}원`}
          sub={config.taxConfig.mode === 'none' ? '과세 미반영' : `세금 -${fmtB(kpis.cumulativeTax)}원`}
          icon={Target}
          color="#34d399"
        />
        <KpiCard
          title="총투자 ROI"
          value={`${(kpis.totalROI * 100).toFixed(1)}%`}
          sub={`세후 ROI ${(kpis.afterTaxROI * 100).toFixed(1)}%`}
          icon={BarChart2}
          color="#a78bfa"
        />
        <KpiCard
          title="세전 사업이익"
          value={`${fmtB(kpis.preTaxProfit)}원`}
          sub={`누적수익 ${fmtB(kpis.cumulativeReturn)}원`}
          icon={ArrowUpRight}
          color="#34d399"
        />
        <KpiCard
          title="누적 유입금"
          value={`${fmtB(kpis.cumulativeInflow)}원`}
          sub={`유출 ${fmtB(kpis.cumulativeOutflow)}원`}
          icon={Layers}
          color="#60a5fa"
        />
        <KpiCard
          title="다음 결산 예상잔액"
          value={`${fmtB(kpis.nextSettlementBalance)}원`}
          sub={`결산 ${kpis.nextSettlementMonth}`}
          icon={Calendar}
          color="#f472b6"
        />
        <KpiCard
          title="최종 사업이익"
          value={`${fmtB(kpis.afterTaxProfit)}원`}
          sub={config.taxConfig.mode === 'none' ? '세전 기준' : '세후 기준'}
          icon={TrendingUp}
          color="#c9a84c"
          trend={kpis.afterTaxROI}
          trendLabel={`세후ROI ${(kpis.afterTaxROI * 100).toFixed(1)}%`}
        />
      </div>

      {/* ── 차트 1: 월별 잔액 성장 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        <div className="card">
          <div className="section-header">
            <TrendingUp size={14} /> 월별 자산 성장 추이
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 15 }}>
              <defs>
                <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#c9a84c" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c9a84c" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="afGrad"  x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#34d399" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="prGrad"  x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#162a52" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} interval={2} />
              <YAxis tickFormatter={axisTickFmt} tick={{ fill: '#475569', fontSize: 10 }} width={62} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              {settlements?.map(s => (
                <ReferenceLine key={s.month} x={s.month.slice(2)} stroke="#c9a84c"
                  strokeDasharray="4 4" strokeWidth={1.5}
                  label={{ value: '결산', fill: '#c9a84c', fontSize: 9 }} />
              ))}
              <Area type="monotone" dataKey="principal" name="누적원금"  stroke="#60a5fa" fill="url(#prGrad)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="balance"   name="세전잔액"  stroke="#c9a84c" fill="url(#balGrad)" strokeWidth={2} dot={false} />
              {config.taxConfig.mode !== 'none' && (
                <Area type="monotone" dataKey="afterTax" name="세후잔액" stroke="#34d399" fill="url(#afGrad)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 유입원별 파이 */}
        <div className="card">
          <div className="section-header">
            <Layers size={14} /> 유입원별 구성
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={inflowPieData}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {inflowPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip
                formatter={(v) => [`${fmtB(v)}원`, '']}
                contentStyle={{ background: '#0f2040', border: '1px solid #2a4f8a', borderRadius: 8, fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.5rem' }}>
            {inflowPieData.map((d, i) => {
              const total = inflowPieData.reduce((s, x) => s + x.value, 0);
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                    <span style={{ color: '#94a3b8' }}>{d.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', color: '#64748b' }}>
                    <span style={{ color: d.color, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtB(d.value)}원</span>
                    <span>({((d.value / total) * 100).toFixed(1)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 차트 2: 월별 유입/유출 + ROI ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div className="card">
          <div className="section-header">
            <BarChart2 size={14} /> 월별 유입 / 유출
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#162a52" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} interval={2} />
              <YAxis tickFormatter={axisTickFmt} tick={{ fill: '#475569', fontSize: 10 }} width={62} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              <Bar dataKey="inflow"    name="유입"    fill="#34d399" radius={[2,2,0,0]} maxBarSize={18} />
              <Bar dataKey="outflow"   name="유출"    fill="#f87171" radius={[2,2,0,0]} maxBarSize={18} />
              <Bar dataKey="returnAmt" name="투자수익" fill="#c9a84c" radius={[2,2,0,0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-header">
            <TrendingUp size={14} /> ROI 추이
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#162a52" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} interval={2} />
              <YAxis tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fill: '#475569', fontSize: 10 }} width={50} />
              <Tooltip content={<RoiTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              {settlements?.map(s => (
                <ReferenceLine key={s.month} x={s.month.slice(2)} stroke="#c9a84c" strokeDasharray="4 4" strokeWidth={1} />
              ))}
              <Line type="monotone" dataKey="roi" name="세전 ROI" stroke="#c9a84c" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 차트 3: 결산 시점별 + 참여자 분배 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div className="card">
          <div className="section-header">
            <Calendar size={14} /> 결산 시점별 성과
          </div>
          {settlementChartData.length === 0 ? (
            <div style={{ color: '#475569', fontSize: '0.8125rem', padding: '2rem 0', textAlign: 'center' }}>
              결산 시점이 없습니다. 입력설정에서 추가하세요.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={settlementChartData} margin={{ top: 5, right: 10, bottom: 5, left: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#162a52" />
                <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} />
                <YAxis tickFormatter={axisTickFmt} tick={{ fill: '#475569', fontSize: 10 }} width={62} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
                <Bar dataKey="balance" name="결산잔액" fill="#c9a84c" radius={[3,3,0,0]} />
                <Bar dataKey="preTax"  name="세전이익" fill="#34d399" radius={[3,3,0,0]} />
                {config.taxConfig.mode !== 'none' && (
                  <Bar dataKey="afterTax" name="세후이익" fill="#60a5fa" radius={[3,3,0,0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="section-header">
            <Target size={14} /> 참여자별 분배 예상
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={participantChartData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#162a52" horizontal={false} />
              <XAxis type="number" tickFormatter={axisTickFmt} tick={{ fill: '#475569', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={55} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              <Bar dataKey="preTax"    name="세전귀속" fill="#c9a84c" radius={[0,3,3,0]} maxBarSize={14} />
              <Bar dataKey="afterTax"  name="세후귀속" fill="#34d399" radius={[0,3,3,0]} maxBarSize={14} />
              <Bar dataKey="principal" name="투입원금" fill="#2a4f8a" radius={[0,3,3,0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
