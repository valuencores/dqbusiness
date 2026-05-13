import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import {
  Calculator, TrendingUp, DollarSign, Calendar,
  RefreshCw, ChevronDown, ChevronUp, Info,
  BarChart2, PiggyBank, Layers, ArrowRight,
  CheckCircle, Zap
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────────────────────
const fmtN = (n) => new Intl.NumberFormat('ko-KR').format(Math.round(n));

function axisTickFmt(v) {
  const abs = Math.abs(v);
  if (abs >= 100000000) return `${(v / 100000000).toFixed(1)}억`;
  if (abs >= 10000000)  return `${(v / 10000000).toFixed(0)}천만`;
  if (abs >= 10000)     return `${(v / 10000).toFixed(0)}만`;
  return fmtN(v);
}

function useWindowWidth() {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

// ─────────────────────────────────────────────────────────────
// 계산 엔진
// ─────────────────────────────────────────────────────────────

/** 고정식 단리/복리 월별 rows */
function calcFixed({ principal, monthlyRate, months, mode }) {
  const r = monthlyRate / 100;
  const rows = [];
  for (let m = 1; m <= months; m++) {
    const compound = principal * Math.pow(1 + r, m);
    const simple   = principal * (1 + r * m);
    const balance  = mode === 'compound' ? compound : simple;
    const gain     = balance - principal;
    rows.push({
      month:    m,
      balance:  Math.round(balance),
      gain:     Math.round(gain),
      compound: Math.round(compound),
      simple:   Math.round(simple),
      roi:      gain / principal,
    });
  }
  return rows;
}

/** 적립식 복리/단리 월별 rows */
function calcAccum({ monthlyDeposit, monthlyRate, months, mode }) {
  const r = monthlyRate / 100;
  const rows = [];
  let balance = 0;
  let totalDeposit = 0;

  for (let m = 1; m <= months; m++) {
    totalDeposit += monthlyDeposit;
    if (mode === 'compound') {
      // 기초 잔액 복리 후 이달 납입
      balance = balance * (1 + r) + monthlyDeposit;
    } else {
      // 단리: 각 납입금은 남은 기간만큼 단리 이자
      // 누적 계산: 이달까지 총 balance = 전달 balance + 이달 납입 + 전달 balance * r
      balance = balance + balance * r + monthlyDeposit;
    }
    const gain = balance - totalDeposit;
    rows.push({
      month:        m,
      balance:      Math.round(balance),
      totalDeposit: Math.round(totalDeposit),
      gain:         Math.round(gain),
      roi:          totalDeposit > 0 ? gain / totalDeposit : 0,
    });
  }
  return rows;
}

/** 단리 vs 복리 비교 rows (고정식) */
function calcCompare({ principal, monthlyRate, months }) {
  const r = monthlyRate / 100;
  const rows = [];
  for (let m = 1; m <= months; m++) {
    const compound = Math.round(principal * Math.pow(1 + r, m));
    const simple   = Math.round(principal * (1 + r * m));
    rows.push({ month: m, compound, simple, diff: compound - simple });
  }
  return rows;
}

/** 적립식 단리 vs 복리 비교 rows */
function calcAccumCompare({ monthlyDeposit, monthlyRate, months }) {
  const r = monthlyRate / 100;
  const rowsC = calcAccum({ monthlyDeposit, monthlyRate, months, mode: 'compound' });
  const rowsS = calcAccum({ monthlyDeposit, monthlyRate, months, mode: 'simple' });
  return rowsC.map((c, i) => ({
    month:    c.month,
    compound: c.balance,
    simple:   rowsS[i].balance,
    diff:     c.balance - rowsS[i].balance,
  }));
}

// ─────────────────────────────────────────────────────────────
// 분석 코멘트 생성 (300자 이내)
// ─────────────────────────────────────────────────────────────
function generateFixedComment({ principal, monthlyRate, months, mode, finalBalance, totalGain, roi }) {
  const modeLabel = mode === 'compound' ? '복리' : '단리';
  const annualEq  = mode === 'compound'
    ? ((Math.pow(1 + monthlyRate / 100, 12) - 1) * 100).toFixed(1)
    : (monthlyRate * 12).toFixed(1);
  const doublingMonths = mode === 'compound'
    ? Math.ceil(Math.log(2) / Math.log(1 + monthlyRate / 100))
    : Math.ceil(100 / monthlyRate);

  let comment = `월 ${monthlyRate}% ${modeLabel} 기준, ${fmtN(principal)}원을 ${months}개월 운용 시 최종 ${fmtN(finalBalance)}원이 됩니다. `;
  comment += `총 수익 ${fmtN(totalGain)}원, ROI ${(roi * 100).toFixed(1)}% 달성. `;
  if (mode === 'compound') {
    comment += `연 환산 복리 수익률은 약 ${annualEq}%이며, 원금 2배 달성까지 약 ${doublingMonths}개월이 소요됩니다. `;
    comment += `복리 효과는 시간이 지날수록 기하급수적으로 커지므로, 장기 운용일수록 유리합니다.`;
  } else {
    comment += `단리는 원금에만 이자가 붙어 연 ${annualEq}%의 고정 수익 구조입니다. `;
    comment += `원금 2배까지 약 ${doublingMonths}개월 소요. 복리 전환 시 수익 차이가 크게 벌어집니다.`;
  }
  return comment.length > 300 ? comment.slice(0, 297) + '...' : comment;
}

function generateAccumComment({ monthlyDeposit, monthlyRate, months, mode, finalBalance, totalDeposit, totalGain, roi }) {
  const modeLabel = mode === 'compound' ? '복리' : '단리';
  const years     = (months / 12).toFixed(1);
  let comment = `월 ${fmtN(monthlyDeposit)}원씩 ${months}개월(${years}년) 적립, 월 ${monthlyRate}% ${modeLabel} 기준. `;
  comment += `총 납입 ${fmtN(totalDeposit)}원 → 최종 ${fmtN(finalBalance)}원 달성. `;
  comment += `수익 ${fmtN(totalGain)}원, ROI ${(roi * 100).toFixed(1)}%. `;
  if (mode === 'compound') {
    comment += `복리 적립식은 납입 초기에는 이자가 작지만 기간이 길어질수록 눈덩이처럼 증가합니다. `;
    comment += `월 납입액을 늘리거나 기간을 연장하면 최종 잔액이 비선형적으로 성장합니다.`;
  } else {
    comment += `단리 적립식은 매월 납입원금에 대해서만 단순 이자가 발생합니다. `;
    comment += `복리 전환 시 동일 조건 대비 최종 잔액이 크게 증가하므로 복리 운용을 권장합니다.`;
  }
  return comment.length > 300 ? comment.slice(0, 297) + '...' : comment;
}

function generateCompareComment({ principal, monthlyRate, months, compoundFinal, simpleFinal }) {
  const diff       = compoundFinal - simpleFinal;
  const diffPct    = simpleFinal > 0 ? ((diff / simpleFinal) * 100).toFixed(1) : '0';
  const doublingC  = Math.ceil(Math.log(2) / Math.log(1 + monthlyRate / 100));
  let comment = `동일 조건(원금 ${fmtN(principal)}원, 월 ${monthlyRate}%, ${months}개월) 단리 vs 복리 비교. `;
  comment += `복리 ${fmtN(compoundFinal)}원 vs 단리 ${fmtN(simpleFinal)}원 — 차이 ${fmtN(diff)}원(+${diffPct}%). `;
  comment += `복리는 이자에 이자가 붙는 구조로, 기간이 길수록 단리와의 격차가 지수적으로 벌어집니다. `;
  comment += `복리 원금 2배 달성까지 약 ${doublingC}개월, 단리 대비 수익 우위가 뚜렷합니다.`;
  return comment.length > 300 ? comment.slice(0, 297) + '...' : comment;
}

// ─────────────────────────────────────────────────────────────
// 공통 UI 컴포넌트
// ─────────────────────────────────────────────────────────────

/** 탭 버튼 그룹 */
function TabGroup({ tabs, value, onChange, small }) {
  return (
    <div className="tab-bar" style={{ display: 'inline-flex' }}>
      {tabs.map(t => (
        <button
          key={t.value}
          className={`tab-item ${value === t.value ? 'active' : ''}`}
          onClick={() => onChange(t.value)}
          style={{ minWidth: small ? 60 : 80, fontSize: small ? '0.6875rem' : undefined }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** 슬라이더 입력 */
function SliderInput({ label, value, onChange, min, max, step, unit, formatDisplay, tip, presets }) {
  return (
    <div style={{ marginBottom: '0.875rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </span>
          {tip && <Info size={10} color="#475569" title={tip} />}
        </div>
        <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#c9a84c', fontVariantNumeric: 'tabular-nums' }}>
          {formatDisplay ? formatDisplay(value) : value}{unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))}
        style={{ width: '100%', accentColor: '#c9a84c', cursor: 'pointer', height: 4 }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5625rem', color: '#334155', marginTop: '0.125rem' }}>
        <span>{formatDisplay ? formatDisplay(min) : min}{unit}</span>
        <span>{formatDisplay ? formatDisplay(max) : max}{unit}</span>
      </div>
      {presets && (
        <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
          {presets.map(p => (
            <button
              key={p.v}
              onClick={() => onChange(p.v)}
              style={{
                padding: '0.1rem 0.45rem', borderRadius: 4, fontSize: '0.625rem',
                fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
                background: value === p.v ? 'rgba(201,168,76,0.15)' : 'transparent',
                color:      value === p.v ? '#c9a84c' : '#475569',
                border:     value === p.v ? '1px solid rgba(201,168,76,0.4)' : '1px solid #162a52',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** KPI 미니 카드 */
function KpiMini({ label, value, sub, color = '#c9a84c' }) {
  return (
    <div className="kpi-card" style={{ padding: '0.75rem 0.875rem', minWidth: 0 }}>
      <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem' }}>{label}</div>
      <div style={{ fontSize: '0.9375rem', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', wordBreak: 'break-all', lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.5625rem', color: '#475569', marginTop: '0.2rem' }}>{sub}</div>}
    </div>
  );
}

/** 분석 코멘트 블록 */
function AnalysisComment({ comment, icon: Icon = Zap, color = '#c9a84c' }) {
  return (
    <div style={{
      padding: '0.875rem 1.125rem',
      background: `${color}0d`,
      borderRadius: 10,
      borderLeft: `3px solid ${color}`,
      display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
    }}>
      <Icon size={15} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
      <p style={{
        margin: 0, fontSize: '0.8125rem', color: '#cbd5e1', lineHeight: 1.75,
        letterSpacing: '0.01em',
      }}>
        {comment}
      </p>
    </div>
  );
}

/** 차트 툴팁 */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0f2040', border: '1px solid #2a4f8a', borderRadius: 8,
      padding: '0.625rem 0.875rem', fontSize: '0.75rem', minWidth: 170,
    }}>
      <div style={{ color: '#c9a84c', fontWeight: 700, marginBottom: '0.4rem' }}>{label}개월</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.15rem' }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ color: '#e2e8f0', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {fmtN(p.value)}원
          </span>
        </div>
      ))}
    </div>
  );
};

/** 뷰 필터 버튼 (월/분기/연) */
function ViewFilter({ value, onChange }) {
  return (
    <TabGroup
      tabs={[
        { value: 'monthly',   label: '월별' },
        { value: 'quarterly', label: '분기별' },
        { value: 'yearly',    label: '연별' },
      ]}
      value={value}
      onChange={onChange}
      small
    />
  );
}

/** rows 데이터를 뷰 필터에 따라 다운샘플 */
function filterRows(rows, view) {
  if (view === 'monthly')   return rows;
  if (view === 'quarterly') return rows.filter((_, i) => (i + 1) % 3 === 0);
  if (view === 'yearly')    return rows.filter((_, i) => (i + 1) % 12 === 0 || i === rows.length - 1);
  return rows;
}

// ─────────────────────────────────────────────────────────────
// 고정식 섹션
// ─────────────────────────────────────────────────────────────
function FixedSection({ isMobile }) {
  const [principal,  setPrincipal]  = useState(100000000);   // 1억
  const [monthlyRate,setMonthlyRate]= useState(15);           // 15%
  const [months,     setMonths]     = useState(24);           // 24개월
  const [mode,       setMode]       = useState('compound');   // compound | simple
  const [view,       setView]       = useState('monthly');
  const [showTable,  setShowTable]  = useState(false);

  const rows = useMemo(
    () => calcFixed({ principal, monthlyRate, months, mode }),
    [principal, monthlyRate, months, mode]
  );

  const last         = rows[rows.length - 1] ?? {};
  const finalBalance = last.balance  ?? 0;
  const totalGain    = last.gain     ?? 0;
  const roi          = last.roi      ?? 0;
  const annualEq     = mode === 'compound'
    ? ((Math.pow(1 + monthlyRate / 100, 12) - 1) * 100).toFixed(1)
    : (monthlyRate * 12).toFixed(1);

  const chartData = useMemo(() => filterRows(rows, view), [rows, view]);

  const comment = useMemo(() =>
    generateFixedComment({ principal, monthlyRate, months, mode, finalBalance, totalGain, roi }),
    [principal, monthlyRate, months, mode, finalBalance, totalGain, roi]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* ── 입력 패널 + 결과 요약 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>

        {/* 입력 */}
        <div className="card">
          <div className="section-header" style={{ marginBottom: '1.25rem' }}>
            <Calculator size={13} /> 고정식 파라미터 설정
          </div>

          {/* 단리 / 복리 토글 */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              계산 방식
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { v: 'compound', label: '복리 (Compound)', color: '#c9a84c' },
                { v: 'simple',   label: '단리 (Simple)',   color: '#60a5fa' },
              ].map(btn => (
                <button
                  key={btn.v}
                  onClick={() => setMode(btn.v)}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.625rem',
                    borderRadius: 8, cursor: 'pointer',
                    fontWeight: 700, fontSize: '0.8125rem',
                    transition: 'all 0.18s',
                    background: mode === btn.v ? `${btn.color}18` : '#040d21',
                    color:      mode === btn.v ? btn.color : '#475569',
                    border:     mode === btn.v ? `1.5px solid ${btn.color}55` : '1.5px solid #162a52',
                    boxShadow:  mode === btn.v ? `0 0 12px ${btn.color}18` : 'none',
                  }}
                >
                  {mode === btn.v && <CheckCircle size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* 원금 슬라이더: 100만 ~ 5억 */}
          <SliderInput
            label="초기 원금"
            value={principal}
            onChange={setPrincipal}
            min={1000000} max={500000000} step={1000000}
            unit="원"
            formatDisplay={v => fmtN(v)}
            tip="최소 100만원 ~ 최대 5억원"
            presets={[
              { v: 10000000,  label: '1천만' },
              { v: 30000000,  label: '3천만' },
              { v: 50000000,  label: '5천만' },
              { v: 100000000, label: '1억' },
              { v: 200000000, label: '2억' },
              { v: 300000000, label: '3억' },
              { v: 500000000, label: '5억' },
            ]}
          />

          {/* 기간: 6개월 ~ 60개월 */}
          <SliderInput
            label="운용 기간"
            value={months}
            onChange={setMonths}
            min={6} max={60} step={1}
            unit="개월"
            tip="최소 6개월 ~ 최대 60개월(5년)"
            presets={[
              { v: 6,  label: '6M' },
              { v: 12, label: '1년' },
              { v: 24, label: '2년' },
              { v: 36, label: '3년' },
              { v: 48, label: '4년' },
              { v: 60, label: '5년' },
            ]}
          />

          {/* 월 이율: 10% ~ 20% */}
          <SliderInput
            label="월 이율"
            value={monthlyRate}
            onChange={setMonthlyRate}
            min={10} max={20} step={0.5}
            unit="%/월"
            tip="월 10% ~ 20%"
            presets={[
              { v: 10,   label: '10%' },
              { v: 12,   label: '12%' },
              { v: 15,   label: '15%' },
              { v: 18,   label: '18%' },
              { v: 20,   label: '20%' },
            ]}
          />
        </div>

        {/* 결과 요약 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* 최종잔액 하이라이트 */}
          <div style={{
            padding: '1.25rem 1.375rem',
            background: 'linear-gradient(135deg, #0f2040 0%, #0a1628 100%)',
            borderRadius: 12, border: `1px solid ${mode === 'compound' ? 'rgba(201,168,76,0.4)' : 'rgba(96,165,250,0.4)'}`,
            boxShadow: `0 0 24px ${mode === 'compound' ? 'rgba(201,168,76,0.07)' : 'rgba(96,165,250,0.07)'}`,
          }}>
            <div style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
              {months}개월 후 최종 잔액 ({mode === 'compound' ? '복리' : '단리'})
            </div>
            <div style={{
              fontSize: isMobile ? '1.625rem' : '2.125rem', fontWeight: 900,
              color: mode === 'compound' ? '#c9a84c' : '#60a5fa',
              fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
              marginBottom: '0.5rem', wordBreak: 'break-all',
            }}>
              {fmtN(finalBalance)}<span style={{ fontSize: '1rem', fontWeight: 600, marginLeft: '0.25rem' }}>원</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8125rem', color: '#34d399', fontWeight: 700 }}>+{fmtN(totalGain)}원 수익</span>
              <span style={{
                fontSize: '0.75rem', fontWeight: 800, color: '#a78bfa',
                padding: '0.1rem 0.5rem', borderRadius: 4,
                background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)',
              }}>
                ROI {(roi * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* KPI 4칸 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <KpiMini label="초기 원금"    value={`${fmtN(principal)}원`}   color="#60a5fa" />
            <KpiMini label="총 수익금"    value={`${fmtN(totalGain)}원`}    color="#34d399" />
            <KpiMini label="월 이율"      value={`${monthlyRate}%/월`}      color="#c9a84c"
              sub={`연 환산 ~${annualEq}%`} />
            <KpiMini label="운용 기간"    value={`${months}개월`}           color="#a78bfa"
              sub={`${(months / 12).toFixed(1)}년`} />
          </div>

          {/* 분석 코멘트 */}
          <AnalysisComment
            comment={comment}
            icon={mode === 'compound' ? TrendingUp : BarChart2}
            color={mode === 'compound' ? '#c9a84c' : '#60a5fa'}
          />
        </div>
      </div>

      {/* ── 차트 ── */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div className="section-header" style={{ margin: 0, border: 'none', paddingBottom: 0 }}>
            <TrendingUp size={13} /> 성장 추이 ({mode === 'compound' ? '복리' : '단리'})
          </div>
          <ViewFilter value={view} onChange={setView} />
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 8 }}>
            <defs>
              <linearGradient id="fixBalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={mode === 'compound' ? '#c9a84c' : '#60a5fa'} stopOpacity={0.35} />
                <stop offset="95%" stopColor={mode === 'compound' ? '#c9a84c' : '#60a5fa'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#162a52" />
            <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={v => `${v}M`} interval="preserveStartEnd" />
            <YAxis tickFormatter={axisTickFmt} tick={{ fill: '#475569', fontSize: 10 }} width={60} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
            <Area type="monotone" dataKey="balance" name="최종잔액"
              stroke={mode === 'compound' ? '#c9a84c' : '#60a5fa'}
              fill="url(#fixBalGrad)" strokeWidth={2.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── 월별 상세 테이블 ── */}
      <div className="card">
        <button
          onClick={() => setShowTable(v => !v)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <div className="section-header" style={{ margin: 0, border: 'none', paddingBottom: 0 }}>
            <Calendar size={13} /> 상세 내역
          </div>
          {showTable ? <ChevronUp size={14} color="#475569" /> : <ChevronDown size={14} color="#475569" />}
        </button>

        {showTable && (
          <>
            <div style={{ margin: '0.75rem 0 0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <ViewFilter value={view} onChange={setView} />
            </div>
            <div className="table-container" style={{ maxHeight: 360, overflowY: 'auto' }}>
              <table className="data-table">
                <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr>
                    <th style={{ textAlign: 'left', background: '#0a1628' }}>기간</th>
                    <th style={{ background: '#0a1628' }}>잔액</th>
                    <th style={{ background: '#0a1628' }}>수익금</th>
                    <th style={{ background: '#0a1628' }}>ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {filterRows(rows, view).map(r => (
                    <tr key={r.month}>
                      <td style={{ color: '#94a3b8' }}>{r.month}M</td>
                      <td className="num" style={{ color: mode === 'compound' ? '#c9a84c' : '#60a5fa', fontWeight: 700 }}>{fmtN(r.balance)}원</td>
                      <td className="num positive">+{fmtN(r.gain)}원</td>
                      <td className="num" style={{ color: '#a78bfa' }}>{(r.roi * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 적립식 섹션
// ─────────────────────────────────────────────────────────────
function AccumSection({ isMobile }) {
  const [monthlyDeposit, setMonthlyDeposit] = useState(3000000);   // 월 300만
  const [monthlyRate,    setMonthlyRate]    = useState(15);
  const [months,         setMonths]         = useState(24);
  const [mode,           setMode]           = useState('compound');
  const [view,           setView]           = useState('monthly');
  const [showTable,      setShowTable]      = useState(false);

  const rows = useMemo(
    () => calcAccum({ monthlyDeposit, monthlyRate, months, mode }),
    [monthlyDeposit, monthlyRate, months, mode]
  );

  const last          = rows[rows.length - 1] ?? {};
  const finalBalance  = last.balance      ?? 0;
  const totalDeposit  = last.totalDeposit ?? 0;
  const totalGain     = last.gain         ?? 0;
  const roi           = last.roi          ?? 0;

  const chartData = useMemo(() => filterRows(rows, view), [rows, view]);

  const comment = useMemo(() =>
    generateAccumComment({ monthlyDeposit, monthlyRate, months, mode, finalBalance, totalDeposit, totalGain, roi }),
    [monthlyDeposit, monthlyRate, months, mode, finalBalance, totalDeposit, totalGain, roi]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>

        {/* 입력 */}
        <div className="card">
          <div className="section-header" style={{ marginBottom: '1.25rem' }}>
            <PiggyBank size={13} /> 적립식 파라미터 설정
          </div>

          {/* 단리 / 복리 토글 */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              계산 방식
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { v: 'compound', label: '복리', color: '#c9a84c' },
                { v: 'simple',   label: '단리', color: '#60a5fa' },
              ].map(btn => (
                <button
                  key={btn.v}
                  onClick={() => setMode(btn.v)}
                  style={{
                    flex: 1, padding: '0.5rem', borderRadius: 8, cursor: 'pointer',
                    fontWeight: 700, fontSize: '0.8125rem', transition: 'all 0.18s',
                    background: mode === btn.v ? `${btn.color}18` : '#040d21',
                    color:      mode === btn.v ? btn.color : '#475569',
                    border:     mode === btn.v ? `1.5px solid ${btn.color}55` : '1.5px solid #162a52',
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* 월 투자금액: 100만 ~ 1000만 */}
          <SliderInput
            label="월 적립금액"
            value={monthlyDeposit}
            onChange={setMonthlyDeposit}
            min={1000000} max={10000000} step={500000}
            unit="원"
            formatDisplay={v => fmtN(v)}
            tip="월 100만원 ~ 1,000만원"
            presets={[
              { v: 1000000,  label: '100만' },
              { v: 2000000,  label: '200만' },
              { v: 3000000,  label: '300만' },
              { v: 5000000,  label: '500만' },
              { v: 7000000,  label: '700만' },
              { v: 10000000, label: '1천만' },
            ]}
          />

          {/* 기간: 1년(12M) ~ 5년(60M) */}
          <SliderInput
            label="적립 기간"
            value={months}
            onChange={setMonths}
            min={12} max={60} step={1}
            unit="개월"
            tip="최소 1년(12개월) ~ 최대 5년(60개월)"
            presets={[
              { v: 12, label: '1년' },
              { v: 24, label: '2년' },
              { v: 36, label: '3년' },
              { v: 48, label: '4년' },
              { v: 60, label: '5년' },
            ]}
          />

          {/* 월 이율: 10% ~ 20% */}
          <SliderInput
            label="월 이율"
            value={monthlyRate}
            onChange={setMonthlyRate}
            min={10} max={20} step={0.5}
            unit="%/월"
            presets={[
              { v: 10, label: '10%' },
              { v: 12, label: '12%' },
              { v: 15, label: '15%' },
              { v: 18, label: '18%' },
              { v: 20, label: '20%' },
            ]}
          />
        </div>

        {/* 결과 요약 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{
            padding: '1.25rem 1.375rem',
            background: 'linear-gradient(135deg, #0f2040 0%, #0a1628 100%)',
            borderRadius: 12, border: '1px solid rgba(52,211,153,0.35)',
            boxShadow: '0 0 24px rgba(52,211,153,0.06)',
          }}>
            <div style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
              {months}개월 적립 후 최종 잔액
            </div>
            <div style={{
              fontSize: isMobile ? '1.625rem' : '2.125rem', fontWeight: 900,
              color: '#34d399', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
              marginBottom: '0.5rem', wordBreak: 'break-all',
            }}>
              {fmtN(finalBalance)}<span style={{ fontSize: '1rem', fontWeight: 600, marginLeft: '0.25rem' }}>원</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                납입 <span style={{ color: '#60a5fa', fontWeight: 700 }}>{fmtN(totalDeposit)}원</span>
              </span>
              <ArrowRight size={11} color="#475569" />
              <span style={{ fontSize: '0.8125rem', color: '#34d399', fontWeight: 700 }}>+{fmtN(totalGain)}원 수익</span>
              <span style={{
                fontSize: '0.75rem', fontWeight: 800, color: '#a78bfa',
                padding: '0.1rem 0.5rem', borderRadius: 4,
                background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)',
              }}>
                ROI {(roi * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <KpiMini label="월 적립금"    value={`${fmtN(monthlyDeposit)}원`}  color="#60a5fa" />
            <KpiMini label="총 납입금"    value={`${fmtN(totalDeposit)}원`}    color="#60a5fa"
              sub={`${months}개월 × ${fmtN(monthlyDeposit)}`} />
            <KpiMini label="총 수익금"    value={`${fmtN(totalGain)}원`}       color="#34d399" />
            <KpiMini label="운용 ROI"     value={`${(roi * 100).toFixed(1)}%`} color="#a78bfa"
              sub="납입원금 대비" />
          </div>

          <AnalysisComment comment={comment} icon={PiggyBank} color="#34d399" />
        </div>
      </div>

      {/* 차트 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div className="section-header" style={{ margin: 0, border: 'none', paddingBottom: 0 }}>
            <PiggyBank size={13} /> 적립 성장 추이
          </div>
          <ViewFilter value={view} onChange={setView} />
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 8 }}>
            <defs>
              <linearGradient id="accBalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#34d399" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="accDepGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#162a52" />
            <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={v => `${v}M`} interval="preserveStartEnd" />
            <YAxis tickFormatter={axisTickFmt} tick={{ fill: '#475569', fontSize: 10 }} width={60} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
            <Area type="monotone" dataKey="totalDeposit" name="누적납입" stroke="#60a5fa" fill="url(#accDepGrad)" strokeWidth={1.5} dot={false} />
            <Area type="monotone" dataKey="balance"      name="최종잔액" stroke="#34d399" fill="url(#accBalGrad)" strokeWidth={2.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 상세 테이블 */}
      <div className="card">
        <button
          onClick={() => setShowTable(v => !v)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <div className="section-header" style={{ margin: 0, border: 'none', paddingBottom: 0 }}>
            <Calendar size={13} /> 적립 상세 내역
          </div>
          {showTable ? <ChevronUp size={14} color="#475569" /> : <ChevronDown size={14} color="#475569" />}
        </button>

        {showTable && (
          <>
            <div style={{ margin: '0.75rem 0 0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <ViewFilter value={view} onChange={setView} />
            </div>
            <div className="table-container" style={{ maxHeight: 360, overflowY: 'auto' }}>
              <table className="data-table">
                <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr>
                    <th style={{ textAlign: 'left', background: '#0a1628' }}>기간</th>
                    <th style={{ background: '#0a1628' }}>누적납입</th>
                    <th style={{ background: '#0a1628' }}>수익금</th>
                    <th style={{ background: '#0a1628' }}>잔액</th>
                    <th style={{ background: '#0a1628' }}>ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {filterRows(rows, view).map(r => (
                    <tr key={r.month}>
                      <td style={{ color: '#94a3b8' }}>{r.month}M</td>
                      <td className="num" style={{ color: '#60a5fa' }}>{fmtN(r.totalDeposit)}원</td>
                      <td className="num positive">+{fmtN(r.gain)}원</td>
                      <td className="num" style={{ color: '#34d399', fontWeight: 700 }}>{fmtN(r.balance)}원</td>
                      <td className="num" style={{ color: '#a78bfa' }}>{(r.roi * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 비교 분석 섹션
// ─────────────────────────────────────────────────────────────
function CompareSection({ isMobile }) {
  const [compareType, setCompareType] = useState('fixed');   // fixed | accum
  // 공통
  const [monthlyRate, setMonthlyRate] = useState(15);
  const [months,      setMonths]      = useState(24);
  // 고정식
  const [principal, setPrincipal]     = useState(100000000);
  // 적립식
  const [monthlyDeposit, setMonthlyDeposit] = useState(3000000);
  const [view, setView]               = useState('monthly');

  const isFixed = compareType === 'fixed';

  /* 고정식 비교 */
  const fixedRows    = useMemo(() => isFixed ? calcCompare({ principal, monthlyRate, months }) : [], [isFixed, principal, monthlyRate, months]);
  const fixedChart   = useMemo(() => filterRows(fixedRows, view), [fixedRows, view]);
  const fixedLast    = fixedRows[fixedRows.length - 1] ?? {};

  /* 적립식 비교 */
  const accumRows    = useMemo(() => !isFixed ? calcAccumCompare({ monthlyDeposit, monthlyRate, months }) : [], [isFixed, monthlyDeposit, monthlyRate, months]);
  const accumChart   = useMemo(() => filterRows(accumRows, view), [accumRows, view]);
  const accumLast    = accumRows[accumRows.length - 1] ?? {};

  const compoundFinal = isFixed ? (fixedLast.compound ?? 0) : (accumLast.compound ?? 0);
  const simpleFinal   = isFixed ? (fixedLast.simple   ?? 0) : (accumLast.simple   ?? 0);
  const diff          = compoundFinal - simpleFinal;
  const diffPct       = simpleFinal > 0 ? ((diff / simpleFinal) * 100).toFixed(1) : '0';

  const comment = useMemo(() =>
    generateCompareComment({ principal: isFixed ? principal : monthlyDeposit * months, monthlyRate, months, compoundFinal, simpleFinal }),
    [isFixed, principal, monthlyDeposit, monthlyRate, months, compoundFinal, simpleFinal]
  );

  const chartData = isFixed ? fixedChart : accumChart;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* 비교 타입 선택 */}
      <div className="card">
        <div className="section-header" style={{ marginBottom: '1rem' }}>
          <BarChart2 size={13} /> 비교 유형 선택
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
          {[
            { v: 'fixed', label: '고정식 단리 vs 복리', sub: '초기 원금을 한 번에 투입', color: '#c9a84c', icon: Calculator },
            { v: 'accum', label: '적립식 단리 vs 복리', sub: '매월 일정 금액 납입',      color: '#34d399', icon: PiggyBank  },
          ].map(btn => (
            <button
              key={btn.v}
              onClick={() => setCompareType(btn.v)}
              style={{
                padding: '0.875rem 1rem', borderRadius: 10, cursor: 'pointer',
                textAlign: 'left', transition: 'all 0.18s',
                background: compareType === btn.v ? `${btn.color}12` : '#040d21',
                border:     compareType === btn.v ? `1.5px solid ${btn.color}50` : '1.5px solid #162a52',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <btn.icon size={14} color={compareType === btn.v ? btn.color : '#475569'} />
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: compareType === btn.v ? btn.color : '#94a3b8' }}>
                  {btn.label}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#475569' }}>{btn.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 파라미터 입력 */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '1rem' }}>
        <div className="card-sm">
          {isFixed ? (
            <SliderInput
              label="초기 원금"
              value={principal}
              onChange={setPrincipal}
              min={1000000} max={500000000} step={1000000}
              unit="원"
              formatDisplay={v => fmtN(v)}
              presets={[
                { v: 10000000,  label: '1천만' },
                { v: 50000000,  label: '5천만' },
                { v: 100000000, label: '1억' },
                { v: 300000000, label: '3억' },
                { v: 500000000, label: '5억' },
              ]}
            />
          ) : (
            <SliderInput
              label="월 적립금액"
              value={monthlyDeposit}
              onChange={setMonthlyDeposit}
              min={1000000} max={10000000} step={500000}
              unit="원"
              formatDisplay={v => fmtN(v)}
              presets={[
                { v: 1000000,  label: '100만' },
                { v: 3000000,  label: '300만' },
                { v: 5000000,  label: '500만' },
                { v: 10000000, label: '1천만' },
              ]}
            />
          )}
        </div>
        <div className="card-sm">
          <SliderInput
            label="월 이율"
            value={monthlyRate}
            onChange={setMonthlyRate}
            min={10} max={20} step={0.5}
            unit="%/월"
            presets={[
              { v: 10, label: '10%' },
              { v: 12, label: '12%' },
              { v: 15, label: '15%' },
              { v: 18, label: '18%' },
              { v: 20, label: '20%' },
            ]}
          />
        </div>
        <div className="card-sm">
          <SliderInput
            label="운용 기간"
            value={months}
            onChange={setMonths}
            min={isFixed ? 6 : 12} max={60} step={1}
            unit="개월"
            presets={[
              { v: 12, label: '1년' },
              { v: 24, label: '2년' },
              { v: 36, label: '3년' },
              { v: 48, label: '4년' },
              { v: 60, label: '5년' },
            ]}
          />
        </div>
      </div>

      {/* 비교 결과 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
        {/* 복리 */}
        <div style={{
          padding: '1.125rem 1.25rem',
          background: 'rgba(201,168,76,0.07)',
          borderRadius: 12, border: '1.5px solid rgba(201,168,76,0.4)',
        }}>
          <div style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            복리 (Compound Interest)
          </div>
          <div style={{ fontSize: isMobile ? '1.5rem' : '1.875rem', fontWeight: 900, color: '#c9a84c', fontVariantNumeric: 'tabular-nums', wordBreak: 'break-all', lineHeight: 1.1 }}>
            {fmtN(compoundFinal)}<span style={{ fontSize: '0.9rem', marginLeft: '0.2rem' }}>원</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.375rem' }}>
            수익 <span style={{ color: '#34d399', fontWeight: 700 }}>+{fmtN(compoundFinal - (isFixed ? principal : monthlyDeposit * months))}원</span>
          </div>
        </div>
        {/* 단리 */}
        <div style={{
          padding: '1.125rem 1.25rem',
          background: 'rgba(96,165,250,0.07)',
          borderRadius: 12, border: '1.5px solid rgba(96,165,250,0.4)',
        }}>
          <div style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            단리 (Simple Interest)
          </div>
          <div style={{ fontSize: isMobile ? '1.5rem' : '1.875rem', fontWeight: 900, color: '#60a5fa', fontVariantNumeric: 'tabular-nums', wordBreak: 'break-all', lineHeight: 1.1 }}>
            {fmtN(simpleFinal)}<span style={{ fontSize: '0.9rem', marginLeft: '0.2rem' }}>원</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.375rem' }}>
            수익 <span style={{ color: '#60a5fa', fontWeight: 700 }}>+{fmtN(simpleFinal - (isFixed ? principal : monthlyDeposit * months))}원</span>
          </div>
        </div>
      </div>

      {/* 차이 하이라이트 */}
      <div style={{
        padding: '0.875rem 1.25rem',
        background: 'rgba(167,139,250,0.07)',
        borderRadius: 10, border: '1px solid rgba(167,139,250,0.3)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem',
      }}>
        <div>
          <div style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
            복리 - 단리 차이 ({months}개월 기준)
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
            복리가 단리보다 <span style={{ color: '#a78bfa', fontWeight: 700 }}>+{diffPct}%</span> 더 많은 수익
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: isMobile ? '1.25rem' : '1.625rem', fontWeight: 900, color: '#a78bfa', fontVariantNumeric: 'tabular-nums' }}>
            +{fmtN(diff)}원
          </div>
        </div>
      </div>

      {/* 비교 차트 */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div className="section-header" style={{ margin: 0, border: 'none', paddingBottom: 0 }}>
            <BarChart2 size={13} /> 단리 vs 복리 비교 차트
          </div>
          <ViewFilter value={view} onChange={setView} />
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#162a52" />
            <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={v => `${v}M`} interval="preserveStartEnd" />
            <YAxis tickFormatter={axisTickFmt} tick={{ fill: '#475569', fontSize: 10 }} width={60} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
            <Line type="monotone" dataKey="compound" name="복리" stroke="#c9a84c" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="simple"   name="단리" stroke="#60a5fa" strokeWidth={2}   dot={false} strokeDasharray="5 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 차이 바 차트 */}
      <div className="card">
        <div className="section-header" style={{ marginBottom: '0.875rem' }}>
          <Layers size={13} /> 복리 초과 수익 (복리 - 단리)
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#162a52" />
            <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={v => `${v}M`} interval="preserveStartEnd" />
            <YAxis tickFormatter={axisTickFmt} tick={{ fill: '#475569', fontSize: 10 }} width={60} />
            <Tooltip
              formatter={(v) => [`${fmtN(v)}원`, '복리 초과 수익']}
              contentStyle={{ background: '#0f2040', border: '1px solid #2a4f8a', borderRadius: 8, fontSize: 11 }}
            />
            <Bar dataKey="diff" name="복리 초과" fill="#a78bfa" radius={[2, 2, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 분석 코멘트 */}
      <AnalysisComment comment={comment} icon={BarChart2} color="#a78bfa" />

      {/* 이율별 감도 테이블 */}
      <div className="card">
        <div className="section-header" style={{ marginBottom: '0.875rem' }}>
          <DollarSign size={13} /> 이율별 결과 비교표 ({months}개월 기준)
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>월 이율</th>
                <th>복리 최종</th>
                <th>단리 최종</th>
                <th>복리 초과</th>
                <th>복리 ROI</th>
                <th>단리 ROI</th>
              </tr>
            </thead>
            <tbody>
              {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(rate => {
                const base = isFixed ? principal : monthlyDeposit;
                let cFinal, sFinal;
                if (isFixed) {
                  cFinal = Math.round(principal * Math.pow(1 + rate / 100, months));
                  sFinal = Math.round(principal * (1 + (rate / 100) * months));
                } else {
                  const rC = calcAccum({ monthlyDeposit, monthlyRate: rate, months, mode: 'compound' });
                  const rS = calcAccum({ monthlyDeposit, monthlyRate: rate, months, mode: 'simple' });
                  cFinal = rC[rC.length - 1]?.balance ?? 0;
                  sFinal = rS[rS.length - 1]?.balance ?? 0;
                }
                const costBasis = isFixed ? principal : monthlyDeposit * months;
                const cRoi = costBasis > 0 ? ((cFinal - costBasis) / costBasis * 100).toFixed(1) : '0';
                const sRoi = costBasis > 0 ? ((sFinal - costBasis) / costBasis * 100).toFixed(1) : '0';
                const isCurrentRate = rate === monthlyRate;
                return (
                  <tr key={rate} style={{ background: isCurrentRate ? 'rgba(201,168,76,0.07)' : undefined }}>
                    <td style={{ color: isCurrentRate ? '#c9a84c' : '#94a3b8', fontWeight: isCurrentRate ? 700 : 500 }}>
                      {rate}%/월 {isCurrentRate && <span style={{ fontSize: '0.5625rem', color: '#c9a84c' }}>← 현재</span>}
                    </td>
                    <td className="num" style={{ color: '#c9a84c', fontWeight: 700 }}>{fmtN(cFinal)}원</td>
                    <td className="num" style={{ color: '#60a5fa' }}>{fmtN(sFinal)}원</td>
                    <td className="num" style={{ color: '#a78bfa', fontWeight: 600 }}>+{fmtN(cFinal - sFinal)}원</td>
                    <td className="num" style={{ color: '#34d399' }}>{cRoi}%</td>
                    <td className="num" style={{ color: '#64748b' }}>{sRoi}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────────────────────────
export default function CalcPage() {
  const windowWidth = useWindowWidth();
  const isMobile    = windowWidth <= 768;

  const [tab, setTab] = useState('fixed'); // fixed | accum | compare

  const TABS = [
    { value: 'fixed',   label: '고정식',    icon: Calculator },
    { value: 'accum',   label: '적립식',    icon: PiggyBank  },
    { value: 'compare', label: '단리/복리 비교', icon: BarChart2  },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 1080, margin: '0 auto', paddingBottom: '2rem' }}>

      {/* ── 헤더 ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 9,
              background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Calculator size={18} color="#c9a84c" />
            </div>
            <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.375rem', fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
              복리 / 단리 계산기
            </h1>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#475569', margin: 0 }}>
            고정식 · 적립식 · 단리/복리 비교 — 월 이율 10~20%, 기간 6~60개월
          </p>
        </div>
        {/* 범례 배지 */}
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: '복리', color: '#c9a84c' },
            { label: '단리', color: '#60a5fa' },
            { label: '적립식', color: '#34d399' },
          ].map(b => (
            <span key={b.label} style={{
              padding: '0.15rem 0.6rem', borderRadius: 9999,
              fontSize: '0.6875rem', fontWeight: 700,
              background: `${b.color}15`, color: b.color, border: `1px solid ${b.color}35`,
            }}>
              {b.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── 탭 ── */}
      <div style={{ display: 'flex', gap: '0' }}>
        <div className="tab-bar" style={{ width: '100%' }}>
          {TABS.map(t => (
            <button
              key={t.value}
              className={`tab-item ${tab === t.value ? 'active' : ''}`}
              onClick={() => setTab(t.value)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
            >
              <t.icon size={13} />
              {!isMobile && t.label}
              {isMobile && t.label.replace(' 비교', '')}
            </button>
          ))}
        </div>
      </div>

      {/* ── 탭 콘텐츠 ── */}
      {tab === 'fixed'   && <FixedSection   isMobile={isMobile} />}
      {tab === 'accum'   && <AccumSection   isMobile={isMobile} />}
      {tab === 'compare' && <CompareSection isMobile={isMobile} />}

      {/* ── 푸터 저작권 ── */}
      <footer style={{
        marginTop: '1.5rem',
        paddingTop: '1.25rem',
        borderTop: '1px solid #162a52',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.375rem',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 900, color: '#c9a84c' }}>V</span>
          </div>
          <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#c9a84c', letterSpacing: '0.04em' }}>
            Valuencore Group
          </span>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0, lineHeight: 1.6 }}>
          본 계산기는 밸류앤코어스그룹의 재무전략 수립 지원 도구입니다.<br />
          계산 결과는 참고용이며, 실제 투자 수익을 보장하지 않습니다.
        </p>
        <p style={{ fontSize: '0.6875rem', color: '#334155', margin: 0 }}>
          © {new Date().getFullYear()} Valuencore Group. All rights reserved.
        </p>
      </footer>

    </div>
  );
}
