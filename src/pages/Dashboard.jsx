import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart2, ArrowUpRight, ArrowDownRight, Calendar, Layers } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fmt, fmtB, fmtPct } from '../engine/calculator';
import { SCENARIOS } from '../models/dataModel';

// ── Custom Tooltip ──────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0f2040', border: '1px solid #2a4f8a', borderRadius: 8,
      padding: '0.75rem 1rem', fontSize: '0.75rem', minWidth: 180,
    }}>
      <div style={{ color: '#c9a84c', fontWeight: 700, marginBottom: '0.5rem' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: '#cbd5e1', marginBottom: '0.2rem' }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
            {typeof p.value === 'number' ? fmtB(p.value) : p.value}
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
      <div style={{ fontSize: '1.375rem', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2, marginBottom: '0.375rem' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{sub}</div>}
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

// ── 유입원별 파이 차트 데이터 ────────────────────────────────
function buildInflowPieData(rows) {
  let general = 0, partner = 0, insurance = 0, settle = 0, refund = 0, other = 0;
  rows.forEach(r => {
    general += r.inflow.general || 0;
    partner += r.inflow.partner || 0;
    insurance += r.inflow.insuranceAllowance || 0;
    settle += r.inflow.settlementAllowance || 0;
    refund += r.inflow.insuranceRefund || 0;
    other += r.inflow.other || 0;
  });
  return [
    { name: '파트너 자금', value: partner, color: '#c9a84c' },
    { name: '보험 수당', value: insurance, color: '#60a5fa' },
    { name: '일반 시드', value: general, color: '#34d399' },
    { name: '정착수당', value: settle, color: '#a78bfa' },
    { name: '해약환급', value: refund, color: '#f472b6' },
    { name: '기타', value: other, color: '#64748b' },
  ].filter(d => d.value > 0);
}

// ── Main Dashboard ──────────────────────────────────────────
export default function Dashboard() {
  const { rows, settlements, participants, kpis, config, activeScenario, setScenario } = useStore();

  const chartData = useMemo(() => {
    if (!rows) return [];
    return rows.map(r => ({
      month: r.month.slice(2), // YY-MM
      fullMonth: r.month,
      balance: r.closingBalance,
      afterTax: r.afterTaxBalance,
      inflow: r.totalInflow,
      outflow: r.totalOutflow,
      returnAmt: r.investmentReturn,
      roi: r.roi,
      isSettlement: r.isSettlement,
      principal: r.cumulativePrincipal,
    }));
  }, [rows]);

  const settlementChartData = useMemo(() => {
    if (!settlements) return [];
    return settlements.map(s => ({
      month: s.month,
      balance: s.closingBalance,
      preTax: s.preTaxProfit,
      afterTax: s.afterTaxProfit,
      roi: s.roi * 100,
    }));
  }, [settlements]);

  const inflowPieData = useMemo(() => buildInflowPieData(rows || []), [rows]);

  const participantChartData = useMemo(() => {
    if (!participants) return [];
    return participants.map(p => ({
      name: p.name,
      preTax: p.preTaxShare,
      afterTax: p.afterTaxShare,
      principal: p.totalPrincipal,
    }));
  }, [participants]);

  if (!kpis) return <div style={{ color: '#64748b', padding: '2rem' }}>계산 중...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

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

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        <KpiCard
          title="누적 투자원금"
          value={fmtB(kpis.totalPrincipal)}
          sub={`${fmt(kpis.totalPrincipal)}원`}
          icon={DollarSign}
          color="#60a5fa"
        />
        <KpiCard
          title="현재 세전 잔액"
          value={fmtB(kpis.currentBalance)}
          sub={`${fmt(kpis.currentBalance)}원`}
          icon={TrendingUp}
          color="#c9a84c"
          trend={kpis.totalROI}
          trendLabel={`ROI ${(kpis.totalROI * 100).toFixed(1)}%`}
        />
        <KpiCard
          title="세후 잔액"
          value={fmtB(kpis.afterTaxBalance)}
          sub={config.taxConfig.mode === 'none' ? '과세 미반영' : `세금 ${fmtB(kpis.cumulativeTax)}`}
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
          value={fmtB(kpis.preTaxProfit)}
          sub={`누적수익 ${fmtB(kpis.cumulativeReturn)}`}
          icon={ArrowUpRight}
          color="#34d399"
        />
        <KpiCard
          title="누적 유입금"
          value={fmtB(kpis.cumulativeInflow)}
          sub={`유출 ${fmtB(kpis.cumulativeOutflow)}`}
          icon={Layers}
          color="#60a5fa"
        />
        <KpiCard
          title="다음 결산 예상잔액"
          value={fmtB(kpis.nextSettlementBalance)}
          sub={`결산 ${kpis.nextSettlementMonth}`}
          icon={Calendar}
          color="#f472b6"
        />
        <KpiCard
          title="최종 사업이익"
          value={fmtB(kpis.afterTaxProfit)}
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
            <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <defs>
                <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="afGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="prGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#162a52" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} interval={2} />
              <YAxis tickFormatter={v => fmtB(v)} tick={{ fill: '#475569', fontSize: 10 }} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              {settlements?.map(s => (
                <ReferenceLine key={s.month} x={s.month.slice(2)} stroke="#c9a84c" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: '결산', fill: '#c9a84c', fontSize: 9 }} />
              ))}
              <Area type="monotone" dataKey="principal" name="누적원금" stroke="#60a5fa" fill="url(#prGrad)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="balance" name="세전잔액" stroke="#c9a84c" fill="url(#balGrad)" strokeWidth={2} dot={false} />
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
                {inflowPieData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => fmtB(v)} contentStyle={{ background: '#0f2040', border: '1px solid #2a4f8a', borderRadius: 8, fontSize: 11 }} />
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
                    <span style={{ color: d.color, fontWeight: 600 }}>{fmtB(d.value)}</span>
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
            <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#162a52" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} interval={2} />
              <YAxis tickFormatter={v => fmtB(v)} tick={{ fill: '#475569', fontSize: 10 }} width={58} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              <Bar dataKey="inflow" name="유입" fill="#34d399" radius={[2, 2, 0, 0]} maxBarSize={18} />
              <Bar dataKey="outflow" name="유출" fill="#f87171" radius={[2, 2, 0, 0]} maxBarSize={18} />
              <Bar dataKey="returnAmt" name="투자수익" fill="#c9a84c" radius={[2, 2, 0, 0]} maxBarSize={18} />
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
              <BarChart data={settlementChartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#162a52" />
                <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} />
                <YAxis tickFormatter={v => fmtB(v)} tick={{ fill: '#475569', fontSize: 10 }} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
                <Bar dataKey="balance" name="결산잔액" fill="#c9a84c" radius={[3, 3, 0, 0]} />
                <Bar dataKey="preTax" name="세전이익" fill="#34d399" radius={[3, 3, 0, 0]} />
                {config.taxConfig.mode !== 'none' && (
                  <Bar dataKey="afterTax" name="세후이익" fill="#60a5fa" radius={[3, 3, 0, 0]} />
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
              <XAxis type="number" tickFormatter={v => fmtB(v)} tick={{ fill: '#475569', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={55} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              <Bar dataKey="preTax" name="세전귀속" fill="#c9a84c" radius={[0, 3, 3, 0]} maxBarSize={14} />
              <Bar dataKey="afterTax" name="세후귀속" fill="#34d399" radius={[0, 3, 3, 0]} maxBarSize={14} />
              <Bar dataKey="principal" name="투입원금" fill="#2a4f8a" radius={[0, 3, 3, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 결산 요약 테이블 ── */}
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
                  <th>누적세금</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s, i) => (
                  <tr key={i} className="settlement-row">
                    <td><span className="badge badge-gold">{s.month}</span></td>
                    <td className="num">{fmt(s.cumulativePrincipal)}</td>
                    <td className="num positive">{fmt(s.closingBalance)}</td>
                    <td className="num positive">{fmt(s.preTaxProfit)}</td>
                    <td className="num" style={{ color: config.taxConfig.mode !== 'none' ? '#34d399' : '#64748b' }}>{fmt(s.afterTaxProfit)}</td>
                    <td className="num gold">{fmtPct(s.roi)}</td>
                    <td className="num" style={{ color: '#a78bfa' }}>{fmtPct(s.afterTaxRoi)}</td>
                    <td className="num negative">{s.taxAmount > 0 ? fmt(s.taxAmount) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
