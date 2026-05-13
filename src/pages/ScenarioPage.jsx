import React, { useMemo, useState, useEffect } from 'react';

function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';
import { GitCompare, TrendingUp, DollarSign, Users, Settings2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fmt, fmtB, fmtPct, applyScenarioOverrides, calculateWorkTable, calculateSettlementSummary, calculateParticipantResults, calculateKPIs } from '../engine/calculator';
import { SCENARIOS } from '../models/dataModel';

const SCENARIO_COLORS = {
  base: '#c9a84c',
  conservative: '#60a5fa',
  aggressive: '#34d399',
  taxHeavy: '#f87171',
  taxOptimized: '#a78bfa',
};

// ── Y축 약식 포매터 (차트 전용) ──────────────────────────────
function axisTickFmt(v) {
  const abs = Math.abs(v);
  if (abs >= 100000000) return `${(v / 100000000).toFixed(0)}억`;
  if (abs >= 10000000)  return `${(v / 10000000).toFixed(0)}천만`;
  if (abs >= 10000)     return `${(v / 10000).toFixed(0)}만`;
  return fmtB(v);
}

// ── Custom Tooltip ─────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f2040', border: '1px solid #2a4f8a', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.75rem' }}>
      <div style={{ color: '#c9a84c', fontWeight: 700, marginBottom: '0.5rem' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.2rem' }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: '#e2e8f0' }}>
            {typeof p.value === 'number' && p.value > 1000 ? `${fmtB(p.value)}원` : (p.value != null ? p.value.toFixed(1) + '%' : '-')}
          </span>
        </div>
      ))}
    </div>
  );
};

const BalTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f2040', border: '1px solid #2a4f8a', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.75rem' }}>
      <div style={{ color: '#c9a84c', fontWeight: 700, marginBottom: '0.5rem' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: '0.2rem' }}>
          {p.name}: <strong>{fmtB(p.value)}원</strong>
        </div>
      ))}
    </div>
  );
};

// ── Scenario Card ─────────────────────────────────────────
function ScenarioCard({ scenarioKey, scenario, kpis, active, onToggle }) {
  const color = SCENARIO_COLORS[scenarioKey];
  return (
    <div
      onClick={() => onToggle(scenarioKey)}
      style={{
        cursor: 'pointer',
        padding: '1rem 1.25rem',
        borderRadius: 10,
        background: active ? 'rgba(15,32,64,0.9)' : '#0a1628',
        border: `1.5px solid ${active ? color : '#162a52'}`,
        transition: 'all 0.2s',
        boxShadow: active ? `0 0 18px ${color}22` : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color }}>
          {scenario.label}
        </span>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: active ? color : '#162a52',
          boxShadow: active ? `0 0 8px ${color}` : 'none',
        }} />
      </div>
      <div style={{ fontSize: '0.6875rem', color: '#64748b', marginBottom: '0.75rem', lineHeight: 1.5 }}>
        {scenario.description}
      </div>
      {kpis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span style={{ color: '#64748b' }}>최종잔액</span>
            <span style={{ color, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtB(kpis.currentBalance)}원</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span style={{ color: '#64748b' }}>총ROI</span>
            <span style={{ color: '#34d399', fontWeight: 600 }}>{(kpis.totalROI * 100).toFixed(1)}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span style={{ color: '#64748b' }}>사업이익</span>
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{fmtB(kpis.preTaxProfit)}원</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span style={{ color: '#64748b' }}>수익률</span>
            <span style={{ color: '#a78bfa', fontWeight: 600 }}>
              {((Object.values(SCENARIOS).find((_, i) => Object.keys(SCENARIOS)[i] === scenarioKey)?.overrides?.baseReturnRate ?? 0.15) * 100).toFixed(0)}%/월
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Custom Return Rate Overrides ──────────────────────────
function CustomOverridePanel({ config, onChange }) {
  return (
    <div style={{ padding: '1rem', background: '#040d21', borderRadius: 8, border: '1px solid rgba(201,168,76,0.2)' }}>
      <div style={{ fontSize: '0.75rem', color: '#c9a84c', fontWeight: 700, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Custom 시나리오 변수 조정
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
        <div>
          <label style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block', marginBottom: '0.375rem', textTransform: 'uppercase' }}>월 수익률</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <input type="range" min="0.01" max="0.30" step="0.01"
              value={config.baseReturnRate}
              onChange={e => onChange({ baseReturnRate: parseFloat(e.target.value) })}
              style={{ flex: 1, accentColor: '#c9a84c' }} />
            <span style={{ color: '#c9a84c', fontWeight: 700, fontSize: '0.875rem', minWidth: 40 }}>
              {(config.baseReturnRate * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        <div>
          <label style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block', marginBottom: '0.375rem', textTransform: 'uppercase' }}>해약환급률</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <input type="range" min="0" max="0.8" step="0.01"
              value={config.insuranceRefund.refundRate}
              onChange={e => onChange({ insuranceRefund: { ...config.insuranceRefund, refundRate: parseFloat(e.target.value) } })}
              style={{ flex: 1, accentColor: '#c9a84c' }} />
            <span style={{ color: '#c9a84c', fontWeight: 700, fontSize: '0.875rem', minWidth: 40 }}>
              {(config.insuranceRefund.refundRate * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        <div>
          <label style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block', marginBottom: '0.375rem', textTransform: 'uppercase' }}>보험 슬롯 수</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <input type="range" min="1" max="15" step="1"
              value={config.insurance.slots}
              onChange={e => onChange({ insurance: { ...config.insurance, slots: parseInt(e.target.value) } })}
              style={{ flex: 1, accentColor: '#c9a84c' }} />
            <span style={{ color: '#c9a84c', fontWeight: 700, fontSize: '0.875rem', minWidth: 30 }}>
              {config.insurance.slots}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Scenario Page ─────────────────────────────────────
export default function ScenarioPage() {
  const { config, getScenarioResults } = useStore();
  const [activeScenarios, setActiveScenarios] = useState(new Set(['base', 'conservative', 'aggressive']));
  const [customOverrides, setCustomOverrides] = useState({});

  // 모든 시나리오 결과 계산
  const allResults = useMemo(() => {
    const results = {};
    Object.entries(SCENARIOS).forEach(([key, scenario]) => {
      let overrides = scenario.overrides;
      if (key === 'custom') overrides = customOverrides;
      const merged = applyScenarioOverrides(config, overrides || {});
      const rows = calculateWorkTable(merged);
      const settlements = calculateSettlementSummary(rows, merged);
      const participants = calculateParticipantResults(rows, merged);
      const kpis = calculateKPIs(rows);
      results[key] = { rows, settlements, participants, kpis, config: merged };
    });
    return results;
  }, [config, customOverrides]);

  const toggleScenario = (key) => {
    setActiveScenarios(prev => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > 1) next.delete(key); }
      else next.add(key);
      return next;
    });
  };

  // 월별 잔액 비교 차트 데이터
  const balanceChartData = useMemo(() => {
    const baseRows = allResults.base?.rows || [];
    return baseRows.map((r, i) => {
      const point = { month: r.month.slice(2) };
      Object.entries(allResults).forEach(([key, res]) => {
        if (activeScenarios.has(key)) {
          point[key] = res.rows[i]?.closingBalance ?? 0;
        }
      });
      return point;
    });
  }, [allResults, activeScenarios]);

  // ROI 비교 차트 데이터
  const roiChartData = useMemo(() => {
    const baseRows = allResults.base?.rows || [];
    return baseRows.map((r, i) => {
      const point = { month: r.month.slice(2) };
      Object.entries(allResults).forEach(([key, res]) => {
        if (activeScenarios.has(key)) {
          point[key] = (res.rows[i]?.roi || 0) * 100;
        }
      });
      return point;
    });
  }, [allResults, activeScenarios]);

  // 결산 시점별 비교 막대 차트
  const settlementCompare = useMemo(() => {
    const settlementMonths = config.settlementDates || [];
    return settlementMonths.map(month => {
      const point = { month };
      Object.entries(allResults).forEach(([key, res]) => {
        if (activeScenarios.has(key)) {
          const s = res.settlements?.find(s => s.month === month);
          point[key] = s?.closingBalance ?? 0;
        }
      });
      return point;
    });
  }, [allResults, activeScenarios, config.settlementDates]);

  // 참여자별 비교 (Base vs Aggressive)
  const participantCompare = useMemo(() => {
    const baseP = allResults.base?.participants || [];
    const aggrP = allResults.aggressive?.participants || [];
    return baseP.map((p, i) => ({
      name: p.name,
      base: p.netProfit,
      aggressive: aggrP[i]?.netProfit || 0,
      conservative: allResults.conservative?.participants[i]?.netProfit || 0,
    }));
  }, [allResults]);

  // 비교 표 데이터
  const comparisonTable = useMemo(() => {
    return Object.entries(SCENARIOS).map(([key, scenario]) => {
      const res = allResults[key];
      const kpis = res?.kpis;
      const lastSettlement = res?.settlements?.[res.settlements.length - 1];
      return {
        key,
        label: scenario.label,
        color: SCENARIO_COLORS[key],
        description: scenario.description,
        finalBalance: kpis?.currentBalance ?? 0,
        totalROI: kpis?.totalROI ?? 0,
        afterTaxBalance: kpis?.afterTaxBalance ?? 0,
        preTaxProfit: kpis?.preTaxProfit ?? 0,
        afterTaxProfit: kpis?.afterTaxProfit ?? 0,
        cumulativeTax: kpis?.cumulativeTax ?? 0,
        lastSettlementBalance: lastSettlement?.closingBalance ?? 0,
        lastSettlementROI: lastSettlement?.roi ?? 0,
        returnRate: key === 'custom'
          ? customOverrides.baseReturnRate ?? config.baseReturnRate
          : (SCENARIOS[key].overrides?.baseReturnRate ?? config.baseReturnRate),
      };
    });
  }, [allResults, config.baseReturnRate, customOverrides]);

  // 레이더 차트 데이터 (Base 대비 비율)
  const baseKpis = allResults.base?.kpis;
  const radarData = useMemo(() => {
    if (!baseKpis) return [];
    const metrics = ['finalBalance', 'totalROI', 'preTaxProfit', 'afterTaxProfit'];
    const labels = ['최종잔액', 'ROI', '세전이익', '세후이익'];
    return metrics.map((m, mi) => {
      const point = { metric: labels[mi] };
      Object.entries(SCENARIOS).forEach(([key]) => {
        if (!activeScenarios.has(key)) return;
        const val = comparisonTable.find(c => c.key === key)?.[m] ?? 0;
        const base = comparisonTable.find(c => c.key === 'base')?.[m] ?? 1;
        point[key] = base !== 0 ? Math.min((val / Math.abs(base)) * 100, 200) : 0;
      });
      return point;
    });
  }, [comparisonTable, activeScenarios, baseKpis]);

  const windowWidth = useWindowWidth();
  const isMobile    = windowWidth <= 768;
  const cols2       = isMobile ? '1fr' : '1fr 1fr';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '1.5rem' }}>

      {/* ── 헤더 ── */}
      <div>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
          시나리오 비교
        </h1>
        <p style={{ fontSize: '0.8125rem', color: '#475569', margin: '0.25rem 0 0' }}>
          5개 시나리오를 동시 계산하여 결산잔액, ROI, 세후이익, 참여자별 순이익을 비교합니다.
        </p>
      </div>

      {/* ── 시나리오 카드 그리드 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: isMobile ? '0.625rem' : '0.875rem' }}>
        {Object.entries(SCENARIOS).map(([key, scenario]) => (
          <ScenarioCard
            key={key}
            scenarioKey={key}
            scenario={scenario}
            kpis={allResults[key]?.kpis}
            active={activeScenarios.has(key)}
            onToggle={toggleScenario}
          />
        ))}
      </div>

      {/* ── Custom 조정 패널 ── */}
      {activeScenarios.has('custom') && (
        <CustomOverridePanel
          config={{ ...config, ...customOverrides }}
          onChange={(overrides) => setCustomOverrides(prev => ({ ...prev, ...overrides }))}
        />
      )}

      {/* ── 비교 표 ── */}
      <div className="card">
        <div className="section-header"><GitCompare size={14} /> 시나리오별 핵심 지표 비교</div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>시나리오</th>
                <th>월수익률</th>
                <th>최종잔액</th>
                <th>총ROI</th>
                <th>세전이익</th>
                <th>세후이익</th>
                <th>최종결산잔액</th>
                <th>최종결산ROI</th>
                <th>누적세금</th>
              </tr>
            </thead>
            <tbody>
              {comparisonTable.map((row) => (
                <tr key={row.key} style={{ opacity: activeScenarios.has(row.key) ? 1 : 0.45 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: row.color }} />
                      <span style={{ color: row.color, fontWeight: 700 }}>{row.label}</span>
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#475569', marginTop: '0.2rem' }}>{row.description}</div>
                  </td>
                  <td className="num" style={{ color: '#a78bfa', fontWeight: 700 }}>
                    {(row.returnRate * 100).toFixed(0)}%
                  </td>
                  <td className="num" style={{ color: row.color, fontWeight: 700 }}>{fmtB(row.finalBalance)}원</td>
                  <td className="num gold">{(row.totalROI * 100).toFixed(1)}%</td>
                  <td className="num positive">{fmtB(row.preTaxProfit)}원</td>
                  <td className="num" style={{ color: '#34d399' }}>{fmtB(row.afterTaxProfit)}원</td>
                  <td className="num" style={{ color: row.color }}>{fmtB(row.lastSettlementBalance)}원</td>
                  <td className="num gold">{(row.lastSettlementROI * 100).toFixed(1)}%</td>
                  <td className="num negative">{row.cumulativeTax > 0 ? `${fmtB(row.cumulativeTax)}원` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 차트 1: 월별 잔액 비교 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: cols2, gap: '1.25rem' }}>
        <div className="card">
          <div className="section-header"><TrendingUp size={14} /> 월별 잔액 비교</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={balanceChartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#162a52" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} interval={4} />
              <YAxis tickFormatter={axisTickFmt} tick={{ fill: '#475569', fontSize: 10 }} width={65} />
              <Tooltip content={<BalTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              {Object.entries(SCENARIOS).map(([key, sc]) =>
                activeScenarios.has(key) ? (
                  <Line key={key} type="monotone" dataKey={key} name={sc.label}
                    stroke={SCENARIO_COLORS[key]} strokeWidth={key === 'base' ? 2.5 : 1.5}
                    dot={false}
                    strokeDasharray={key === 'conservative' ? '5 3' : key === 'taxHeavy' ? '3 3' : undefined}
                  />
                ) : null
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-header"><TrendingUp size={14} /> ROI 비교 추이</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={roiChartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#162a52" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} interval={4} />
              <YAxis tickFormatter={v => `${v.toFixed(0)}%`} tick={{ fill: '#475569', fontSize: 10 }} width={50} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              {Object.entries(SCENARIOS).map(([key, sc]) =>
                activeScenarios.has(key) ? (
                  <Line key={key} type="monotone" dataKey={key} name={sc.label}
                    stroke={SCENARIO_COLORS[key]} strokeWidth={key === 'base' ? 2.5 : 1.5}
                    dot={false}
                  />
                ) : null
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 차트 2: 결산 시점 비교 + 참여자별 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: cols2, gap: '1.25rem' }}>
        {settlementCompare.length > 0 && (
          <div className="card">
            <div className="section-header"><DollarSign size={14} /> 결산 시점별 잔액 비교</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={settlementCompare} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#162a52" />
                <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} />
                <YAxis tickFormatter={axisTickFmt} tick={{ fill: '#475569', fontSize: 10 }} width={62} />
                <Tooltip content={<BalTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {Object.entries(SCENARIOS).map(([key, sc]) =>
                  activeScenarios.has(key) ? (
                    <Bar key={key} dataKey={key} name={sc.label}
                      fill={SCENARIO_COLORS[key]} radius={[3, 3, 0, 0]} maxBarSize={20} />
                  ) : null
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="card">
          <div className="section-header"><Users size={14} /> 참여자별 순이익 비교 (Base vs Aggressive vs Conservative)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={participantCompare} layout="vertical" margin={{ top: 5, right: 10, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#162a52" horizontal={false} />
              <XAxis type="number" tickFormatter={axisTickFmt} tick={{ fill: '#475569', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={55} />
              <Tooltip content={<BalTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="base" name="Base" fill="#c9a84c" radius={[0, 3, 3, 0]} maxBarSize={10} />
              <Bar dataKey="aggressive" name="Aggressive" fill="#34d399" radius={[0, 3, 3, 0]} maxBarSize={10} />
              <Bar dataKey="conservative" name="Conservative" fill="#60a5fa" radius={[0, 3, 3, 0]} maxBarSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 레이더 차트 ── */}
      {radarData.length > 0 && (
        <div className="card">
          <div className="section-header"><Settings2 size={14} /> 시나리오 상대 성과 비교 (Base = 100)</div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#162a52" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 200]} tick={{ fill: '#475569', fontSize: 9 }} tickCount={5} />
              {Object.entries(SCENARIOS).map(([key, sc]) =>
                activeScenarios.has(key) && key !== 'base' ? (
                  <Radar key={key} name={sc.label} dataKey={key}
                    stroke={SCENARIO_COLORS[key]} fill={SCENARIO_COLORS[key]} fillOpacity={0.12}
                    strokeWidth={1.5}
                  />
                ) : null
              )}
              {activeScenarios.has('base') && (
                <Radar name="Base" dataKey="base" stroke="#c9a84c" fill="#c9a84c" fillOpacity={0.2} strokeWidth={2} />
              )}
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#0f2040', border: '1px solid #2a4f8a', borderRadius: 8, fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── 민감도 분석 (수익률 변화) ── */}
      <div className="card">
        <div className="section-header"><TrendingUp size={14} /> 수익률 민감도 분석</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
          {[0.05, 0.08, 0.10, 0.12, 0.15, 0.18, 0.20, 0.25].map(rate => {
            const testConfig = applyScenarioOverrides(config, { baseReturnRate: rate });
            const testRows = calculateWorkTable(testConfig);
            const testKpis = calculateKPIs(testRows);
            const isBase = Math.abs(rate - config.baseReturnRate) < 0.001;
            return (
              <div key={rate} style={{
                padding: '0.875rem', borderRadius: 8, textAlign: 'center',
                background: isBase ? 'rgba(201,168,76,0.1)' : '#040d21',
                border: `1px solid ${isBase ? 'rgba(201,168,76,0.4)' : '#162a52'}`,
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: isBase ? '#c9a84c' : '#e2e8f0', marginBottom: '0.375rem' }}>
                  {(rate * 100).toFixed(0)}%/월
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#64748b', marginBottom: '0.375rem' }}>최종잔액</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#34d399', fontVariantNumeric: 'tabular-nums' }}>
                  {fmtB(testKpis?.currentBalance || 0)}원
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#a78bfa', marginTop: '0.25rem' }}>
                  ROI {((testKpis?.totalROI || 0) * 100).toFixed(0)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
