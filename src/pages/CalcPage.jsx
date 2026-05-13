import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  Calculator, TrendingUp, DollarSign, Calendar, RefreshCw,
  Plus, Minus, ChevronDown, ChevronUp, Info, Copy, Check
} from 'lucide-react';

// ── 숫자 포맷 ─────────────────────────────────────────────────
const fmt  = (n) => new Intl.NumberFormat('ko-KR').format(Math.round(n));
const fmtB = (n) => new Intl.NumberFormat('ko-KR').format(Math.round(n));

function axisTickFmt(v) {
  const abs = Math.abs(v);
  if (abs >= 100000000) return `${(v / 100000000).toFixed(1)}억`;
  if (abs >= 10000000)  return `${(v / 10000000).toFixed(0)}천만`;
  if (abs >= 10000)     return `${(v / 10000).toFixed(0)}만`;
  return fmtB(v);
}

// ── 슬라이더 + 숫자 입력 복합 컴포넌트 ───────────────────────
function SliderInput({ label, value, onChange, min, max, step, unit, format, tip }) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw]         = useState('');

  const display = format ? format(value) : String(value);

  const handleTextChange = (e) => {
    const v = e.target.value.replace(/[^0-9.]/g, '');
    setRaw(v);
    const n = parseFloat(v);
    if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </span>
          {tip && (
            <span style={{ fontSize: '0.625rem', color: '#475569' }} title={tip}>
              <Info size={10} color="#475569" />
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {focused ? (
            <input
              autoFocus
              value={raw}
              onChange={handleTextChange}
              onBlur={() => setFocused(false)}
              style={{
                background: '#040d21', border: '1px solid #c9a84c', color: '#c9a84c',
                borderRadius: 4, padding: '0.125rem 0.375rem',
                fontSize: '0.875rem', fontWeight: 800, width: 90, textAlign: 'right',
                fontVariantNumeric: 'tabular-nums', outline: 'none',
              }}
            />
          ) : (
            <span
              onClick={() => { setFocused(true); setRaw(String(value)); }}
              style={{
                fontSize: '0.875rem', fontWeight: 800, color: '#c9a84c',
                fontVariantNumeric: 'tabular-nums', cursor: 'text',
                padding: '0.125rem 0.375rem',
                borderRadius: 4, border: '1px solid transparent',
                transition: 'border-color 0.15s',
              }}
              title="클릭하여 직접 입력"
            >
              {display}
            </span>
          )}
          {unit && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#c9a84c', cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5625rem', color: '#334155', marginTop: '0.125rem' }}>
        <span>{format ? format(min) : min}{unit}</span>
        <span>{format ? format(max) : max}{unit}</span>
      </div>
    </div>
  );
}

// ── 추가 입금 항목 ─────────────────────────────────────────────
function AdditionRow({ item, onChange, onRemove }) {
  return (
    <div style={{
      display: 'flex', gap: '0.5rem', alignItems: 'center',
      padding: '0.5rem 0.625rem',
      background: '#040d21', borderRadius: 6, border: '1px solid #162a52',
      marginBottom: '0.375rem',
    }}>
      <input
        type="number"
        placeholder="시작 월"
        value={item.startMonth}
        min={1}
        onChange={e => onChange({ ...item, startMonth: Math.max(1, parseInt(e.target.value) || 1) })}
        style={{
          width: 60, background: 'transparent', border: '1px solid #162a52',
          color: '#e2e8f0', borderRadius: 4, padding: '0.25rem 0.375rem',
          fontSize: '0.75rem', textAlign: 'center',
        }}
      />
      <span style={{ fontSize: '0.625rem', color: '#475569' }}>월~</span>
      <input
        type="number"
        placeholder="종료 월"
        value={item.endMonth}
        min={1}
        onChange={e => onChange({ ...item, endMonth: Math.max(1, parseInt(e.target.value) || 1) })}
        style={{
          width: 60, background: 'transparent', border: '1px solid #162a52',
          color: '#e2e8f0', borderRadius: 4, padding: '0.25rem 0.375rem',
          fontSize: '0.75rem', textAlign: 'center',
        }}
      />
      <span style={{ fontSize: '0.625rem', color: '#475569' }}>월</span>
      <input
        type="text"
        placeholder="월 추가금"
        value={item.amount === 0 ? '' : fmt(item.amount)}
        onChange={e => {
          const n = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
          onChange({ ...item, amount: n });
        }}
        style={{
          flex: 1, background: 'transparent', border: '1px solid #162a52',
          color: '#34d399', borderRadius: 4, padding: '0.25rem 0.375rem',
          fontSize: '0.75rem', textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}
      />
      <span style={{ fontSize: '0.625rem', color: '#475569' }}>원</span>
      <button
        onClick={onRemove}
        style={{
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: 4, cursor: 'pointer', padding: '0.25rem',
          display: 'flex', alignItems: 'center',
        }}
      >
        <Minus size={11} color="#f87171" />
      </button>
    </div>
  );
}

// ── 복리 계산 엔진 ─────────────────────────────────────────────
function calcCompound({ principal, monthlyRate, months, additions }) {
  const rows = [];
  let balance = principal;
  let totalAdded = principal;

  for (let m = 1; m <= months; m++) {
    const openingBalance = balance;
    // 이달 추가 입금
    let added = 0;
    additions.forEach(a => {
      if (m >= a.startMonth && m <= a.endMonth) added += a.amount;
    });
    // 복리 수익 (기초잔액 + 추가금 기준)
    const gain = (openingBalance + added) * monthlyRate;
    balance = openingBalance + added + gain;
    totalAdded += added;

    rows.push({
      month: m,
      label: `${m}M`,
      balance:    Math.round(balance),
      principal:  Math.round(totalAdded),
      gain:       Math.round(gain),
      added:      Math.round(added),
      cumGain:    Math.round(balance - totalAdded),
      roi:        totalAdded > 0 ? (balance - totalAdded) / totalAdded : 0,
    });
  }
  return rows;
}

// ── 복리 비교 (여러 수익률) ────────────────────────────────────
function calcMultiRate({ principal, months, rates, additions }) {
  return rates.map(r => {
    const rows = calcCompound({ principal, monthlyRate: r / 100, months, additions });
    const last = rows[rows.length - 1];
    return {
      rate: r,
      label: `${r}%`,
      finalBalance: last?.balance ?? 0,
      totalGain:    last ? last.balance - principal : 0,
      roi:          last?.roi ?? 0,
    };
  });
}

// ── Tooltip ────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0f2040', border: '1px solid #2a4f8a', borderRadius: 8,
      padding: '0.75rem 1rem', fontSize: '0.75rem', minWidth: 180,
    }}>
      <div style={{ color: '#c9a84c', fontWeight: 700, marginBottom: '0.5rem' }}>{label}개월</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.2rem' }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ color: '#e2e8f0', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {fmtB(p.value)}원
          </span>
        </div>
      ))}
    </div>
  );
};

// ── 결과 복사 훅 ───────────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }, []);
  return [copied, copy];
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function CalcPage() {
  // ── 기본 파라미터 ──────────────────────────────────────────
  const [principal,   setPrincipal]   = useState(100000000);   // 원금 (원)
  const [monthlyRate, setMonthlyRate] = useState(15);           // 월 수익률 (%)
  const [months,      setMonths]      = useState(33);           // 운용 기간 (월)
  const [additions,   setAdditions]   = useState([]);           // 추가 입금 목록

  // ── UI 상태 ────────────────────────────────────────────────
  const [showAdditions, setShowAdditions] = useState(false);
  const [showTable,     setShowTable]     = useState(false);
  const [chartMode,     setChartMode]     = useState('balance'); // balance | gain | bar
  const [copied,        copy]             = useCopy();

  // ── 원금 입력 (직접 텍스트) ────────────────────────────────
  const [principalText, setPrincipalText] = useState('');
  const [principalFocus, setPrincipalFocus] = useState(false);

  // ── 계산 ──────────────────────────────────────────────────
  const rows = useMemo(() =>
    calcCompound({ principal, monthlyRate: monthlyRate / 100, months, additions }),
    [principal, monthlyRate, months, additions]
  );

  const last         = rows[rows.length - 1] ?? {};
  const finalBalance = last.balance    ?? 0;
  const totalGain    = last.cumGain    ?? 0;
  const finalROI     = last.roi        ?? 0;
  const totalAdded   = finalBalance - totalGain;

  // 비교 수익률 목록 (현재 ± 포함)
  const compareRates = useMemo(() => {
    const base = monthlyRate;
    const set = new Set([5, 8, 10, 12, 15, 18, 20, 25, base]);
    return Array.from(set).sort((a, b) => a - b);
  }, [monthlyRate]);

  const multiRateData = useMemo(() =>
    calcMultiRate({ principal, months, rates: compareRates, additions }),
    [principal, months, compareRates, additions]
  );

  // 차트 다운샘플 (최대 40포인트)
  const chartData = useMemo(() => {
    if (rows.length <= 40) return rows;
    const step = Math.ceil(rows.length / 40);
    return rows.filter((_, i) => i % step === 0 || i === rows.length - 1);
  }, [rows]);

  // 추가입금 관리
  const addAddition = useCallback(() =>
    setAdditions(prev => [...prev, { id: Date.now(), startMonth: 1, endMonth: months, amount: 5000000 }]),
    [months]
  );
  const updateAddition = useCallback((id, val) =>
    setAdditions(prev => prev.map(a => a.id === id ? { ...a, ...val } : a)),
    []
  );
  const removeAddition = useCallback((id) =>
    setAdditions(prev => prev.filter(a => a.id !== id)),
    []
  );

  // 결과 텍스트 복사
  const resultText = `[복리 계산 결과]
원금: ${fmtB(principal)}원
월 수익률: ${monthlyRate}%
운용 기간: ${months}개월
최종 잔액: ${fmtB(finalBalance)}원
총 수익: ${fmtB(totalGain)}원
총 ROI: ${(finalROI * 100).toFixed(1)}%`;

  // 반응형
  const [winW, setWinW] = useState(() => window.innerWidth);
  useEffect(() => {
    const h = () => setWinW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  const isMobile = winW <= 768;

  // 리셋
  const reset = useCallback(() => {
    setPrincipal(100000000);
    setMonthlyRate(15);
    setMonths(33);
    setAdditions([]);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 960, margin: '0 auto' }}>

      {/* ── 헤더 ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Calculator size={17} color="#c9a84c" />
            </div>
            <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.375rem', fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
              복리 계산기
            </h1>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#475569', margin: 0 }}>
            원금 · 수익률 · 기간 · 추가입금을 설정하여 복리 성장을 시뮬레이션합니다
          </p>
        </div>
        <button
          onClick={reset}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            background: 'transparent', border: '1px solid #162a52',
            color: '#64748b', borderRadius: 6, padding: '0.375rem 0.75rem',
            cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#c9a84c'; e.currentTarget.style.color = '#c9a84c'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#162a52'; e.currentTarget.style.color = '#64748b'; }}
        >
          <RefreshCw size={13} /> 초기화
        </button>
      </div>

      {/* ══ 메인 레이아웃: 입력 패널 + 결과 요약 ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>

        {/* ── 입력 패널 ── */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <div className="section-header" style={{ marginBottom: '1.25rem' }}>
            <Settings2Icon size={14} /> 계산 파라미터
          </div>

          {/* 원금 */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                초기 원금
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {principalFocus ? (
                  <input
                    autoFocus
                    value={principalText}
                    onChange={e => {
                      const v = e.target.value.replace(/[^0-9]/g, '');
                      setPrincipalText(v);
                      const n = parseInt(v) || 0;
                      if (n >= 0) setPrincipal(n);
                    }}
                    onBlur={() => setPrincipalFocus(false)}
                    style={{
                      background: '#040d21', border: '1px solid #c9a84c', color: '#c9a84c',
                      borderRadius: 4, padding: '0.125rem 0.375rem',
                      fontSize: '0.875rem', fontWeight: 800, width: 120, textAlign: 'right',
                      outline: 'none',
                    }}
                  />
                ) : (
                  <span
                    onClick={() => { setPrincipalFocus(true); setPrincipalText(String(principal)); }}
                    title="클릭하여 직접 입력"
                    style={{ fontSize: '0.875rem', fontWeight: 800, color: '#c9a84c', cursor: 'text', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {fmtB(principal)}
                  </span>
                )}
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>원</span>
              </div>
            </div>
            <input
              type="range" min={1000000} max={2000000000} step={1000000}
              value={principal}
              onChange={e => setPrincipal(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#c9a84c', cursor: 'pointer' }}
            />
            {/* 빠른 선택 버튼 */}
            <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              {[10, 50, 100, 200, 350, 500, 790].map(v => (
                <button
                  key={v}
                  onClick={() => setPrincipal(v * 1000000)}
                  style={{
                    padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.625rem',
                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
                    background: principal === v * 1000000 ? 'rgba(201,168,76,0.18)' : 'transparent',
                    color:      principal === v * 1000000 ? '#c9a84c' : '#475569',
                    border:     principal === v * 1000000 ? '1px solid rgba(201,168,76,0.4)' : '1px solid #162a52',
                  }}
                >
                  {v}M
                </button>
              ))}
            </div>
          </div>

          {/* 월 수익률 */}
          <SliderInput
            label="월 수익률"
            value={monthlyRate}
            onChange={setMonthlyRate}
            min={1} max={50} step={0.5}
            unit="%/월"
            format={v => v % 1 === 0 ? String(v) : v.toFixed(1)}
            tip="월 복리 기준 수익률"
          />

          {/* 운용 기간 */}
          <SliderInput
            label="운용 기간"
            value={months}
            onChange={v => setMonths(Math.round(v))}
            min={1} max={120} step={1}
            unit="개월"
            tip="총 복리 운용 기간 (월 단위)"
          />

          {/* 기간 빠른 선택 */}
          <div style={{ display: 'flex', gap: '0.375rem', marginTop: '-0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {[6, 12, 24, 33, 36, 48, 60].map(v => (
              <button
                key={v}
                onClick={() => setMonths(v)}
                style={{
                  padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.625rem',
                  fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
                  background: months === v ? 'rgba(96,165,250,0.15)' : 'transparent',
                  color:      months === v ? '#60a5fa' : '#475569',
                  border:     months === v ? '1px solid rgba(96,165,250,0.35)' : '1px solid #162a52',
                }}
              >
                {v}M
              </button>
            ))}
          </div>

          {/* 추가 입금 섹션 */}
          <div style={{ borderTop: '1px solid #162a52', paddingTop: '0.875rem' }}>
            <button
              onClick={() => setShowAdditions(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                marginBottom: showAdditions ? '0.75rem' : 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Plus size={12} color="#34d399" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  월별 추가 입금
                </span>
                {additions.length > 0 && (
                  <span style={{
                    fontSize: '0.5625rem', fontWeight: 700, padding: '0.1rem 0.4rem',
                    borderRadius: 9999, background: 'rgba(52,211,153,0.15)', color: '#34d399',
                    border: '1px solid rgba(52,211,153,0.3)',
                  }}>
                    {additions.length}건
                  </span>
                )}
              </div>
              {showAdditions ? <ChevronUp size={13} color="#475569" /> : <ChevronDown size={13} color="#475569" />}
            </button>

            {showAdditions && (
              <div>
                <div style={{ fontSize: '0.6875rem', color: '#475569', marginBottom: '0.5rem' }}>
                  특정 기간 동안 매월 일정 금액을 추가 투입하는 시나리오를 설정합니다.
                </div>
                {additions.map(a => (
                  <AdditionRow
                    key={a.id}
                    item={a}
                    onChange={val => updateAddition(a.id, val)}
                    onRemove={() => removeAddition(a.id)}
                  />
                ))}
                <button
                  onClick={addAddition}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)',
                    borderRadius: 6, padding: '0.375rem 0.75rem', cursor: 'pointer',
                    fontSize: '0.75rem', fontWeight: 600, color: '#34d399', marginTop: '0.375rem',
                    width: '100%', justifyContent: 'center',
                  }}
                >
                  <Plus size={11} /> 추가 입금 구간 추가
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── 결과 요약 패널 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* 최종 잔액 하이라이트 */}
          <div style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #0f2040 0%, #0a1628 100%)',
            borderRadius: 12, border: '1px solid rgba(201,168,76,0.35)',
            boxShadow: '0 0 28px rgba(201,168,76,0.08)',
          }}>
            <div style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
              {months}개월 후 최종 잔액
            </div>
            <div style={{
              fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 900,
              color: '#c9a84c', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
              marginBottom: '0.5rem', wordBreak: 'break-all',
            }}>
              {fmtB(finalBalance)}
              <span style={{ fontSize: '1rem', fontWeight: 600, marginLeft: '0.25rem' }}>원</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8125rem', color: '#34d399', fontWeight: 700 }}>
                +{fmtB(totalGain)}원
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>수익</span>
              <span style={{
                fontSize: '0.75rem', fontWeight: 800, color: '#a78bfa',
                padding: '0.1rem 0.5rem', borderRadius: 4,
                background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)',
              }}>
                ROI {(finalROI * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* KPI 4칸 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
            {[
              { label: '초기 원금',      value: `${fmtB(principal)}원`,       color: '#60a5fa' },
              { label: '총 투입 원금',   value: `${fmtB(totalAdded)}원`,       color: '#60a5fa',
                sub: additions.length > 0 ? `추가입금 포함` : '추가입금 없음' },
              { label: '총 수익금',      value: `${fmtB(totalGain)}원`,        color: '#34d399' },
              { label: `월 평균 수익`,   value: `${fmtB(totalGain / months)}원`, color: '#34d399',
                sub: `${months}개월 평균` },
              { label: '월 수익률',      value: `${monthlyRate}%/월`,           color: '#c9a84c' },
              { label: '연간 환산',      value: `~${((Math.pow(1 + monthlyRate / 100, 12) - 1) * 100).toFixed(0)}%/년`,
                color: '#c9a84c', sub: '복리 환산 (이론치)' },
              { label: '운용 기간',      value: `${months}개월`,               color: '#a78bfa',
                sub: `${(months / 12).toFixed(1)}년` },
              { label: '총 ROI',         value: `${(finalROI * 100).toFixed(1)}%`, color: '#a78bfa',
                sub: '원금 대비 수익률' },
            ].map((k, i) => (
              <div key={i} className="kpi-card" style={{ padding: '0.75rem 0.875rem' }}>
                <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.375rem' }}>
                  {k.label}
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: k.color, fontVariantNumeric: 'tabular-nums', wordBreak: 'break-all' }}>
                  {k.value}
                </div>
                {k.sub && <div style={{ fontSize: '0.6rem', color: '#475569', marginTop: '0.2rem' }}>{k.sub}</div>}
              </div>
            ))}
          </div>

          {/* 결과 복사 버튼 */}
          <button
            onClick={() => copy(resultText)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              background: copied ? 'rgba(52,211,153,0.1)' : 'rgba(201,168,76,0.06)',
              border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(201,168,76,0.2)'}`,
              borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer',
              fontSize: '0.75rem', fontWeight: 600,
              color: copied ? '#34d399' : '#c9a84c',
              transition: 'all 0.2s',
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? '복사 완료!' : '결과 텍스트 복사'}
          </button>
        </div>
      </div>

      {/* ══ 차트 영역 ══ */}
      <div className="card">
        {/* 차트 모드 탭 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div className="section-header" style={{ marginBottom: 0, border: 'none', paddingBottom: 0 }}>
            <TrendingUp size={14} /> 복리 성장 차트
          </div>
          <div className="tab-bar" style={{ flexShrink: 0 }}>
            {[
              { key: 'balance', label: '잔액 추이' },
              { key: 'gain',    label: '수익 성장' },
              { key: 'bar',     label: '월별 수익' },
            ].map(t => (
              <button
                key={t.key}
                className={`tab-item ${chartMode === t.key ? 'active' : ''}`}
                onClick={() => setChartMode(t.key)}
                style={{ minWidth: 70 }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          {chartMode === 'balance' ? (
            <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <defs>
                <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#c9a84c" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#c9a84c" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="prGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#162a52" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={v => `${v}M`} interval="preserveStartEnd" />
              <YAxis tickFormatter={axisTickFmt} tick={{ fill: '#475569', fontSize: 10 }} width={62} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              <Area type="monotone" dataKey="principal" name="투입원금" stroke="#60a5fa" fill="url(#prGrad)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="balance"   name="복리잔액" stroke="#c9a84c" fill="url(#balGrad)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          ) : chartMode === 'gain' ? (
            <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <defs>
                <linearGradient id="gainGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#34d399" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#162a52" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={v => `${v}M`} interval="preserveStartEnd" />
              <YAxis tickFormatter={axisTickFmt} tick={{ fill: '#475569', fontSize: 10 }} width={62} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              <Area type="monotone" dataKey="cumGain" name="누적 수익" stroke="#34d399" fill="url(#gainGrad)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#162a52" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={v => `${v}M`} interval="preserveStartEnd" />
              <YAxis tickFormatter={axisTickFmt} tick={{ fill: '#475569', fontSize: 10 }} width={62} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              <Bar dataKey="gain"  name="월 수익" fill="#c9a84c" radius={[2,2,0,0]} maxBarSize={20} />
              {additions.length > 0 && (
                <Bar dataKey="added" name="추가 입금" fill="#34d399" radius={[2,2,0,0]} maxBarSize={20} />
              )}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* ══ 수익률 민감도 비교 ══ */}
      <div className="card">
        <div className="section-header" style={{ marginBottom: '1rem' }}>
          <DollarSign size={14} /> 수익률별 최종 잔액 비교
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.625rem', marginBottom: '1rem' }}>
          {multiRateData.map((r) => {
            const isBase = r.rate === monthlyRate;
            return (
              <div
                key={r.rate}
                onClick={() => setMonthlyRate(r.rate)}
                style={{
                  padding: '0.75rem 0.625rem', borderRadius: 8, textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: isBase ? 'rgba(201,168,76,0.12)' : '#040d21',
                  border: `1px solid ${isBase ? 'rgba(201,168,76,0.45)' : '#162a52'}`,
                  boxShadow: isBase ? '0 0 14px rgba(201,168,76,0.1)' : 'none',
                }}
              >
                <div style={{ fontSize: isMobile ? '0.75rem' : '0.9375rem', fontWeight: 800, color: isBase ? '#c9a84c' : '#94a3b8', marginBottom: '0.25rem' }}>
                  {r.rate}%
                </div>
                <div style={{ fontSize: isMobile ? '0.5625rem' : '0.6875rem', color: '#64748b', marginBottom: '0.25rem' }}>최종잔액</div>
                <div style={{ fontSize: isMobile ? '0.625rem' : '0.8125rem', fontWeight: 700, color: isBase ? '#c9a84c' : '#34d399', fontVariantNumeric: 'tabular-nums', wordBreak: 'break-all' }}>
                  {fmtB(r.finalBalance)}원
                </div>
                <div style={{ fontSize: '0.5625rem', color: '#a78bfa', marginTop: '0.2rem' }}>
                  ROI {(r.roi * 100).toFixed(0)}%
                </div>
              </div>
            );
          })}
        </div>
        {/* 비교 바 차트 */}
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={multiRateData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#162a52" />
            <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 10 }} />
            <YAxis tickFormatter={axisTickFmt} tick={{ fill: '#475569', fontSize: 10 }} width={62} />
            <Tooltip
              formatter={(v) => [`${fmtB(v)}원`, '최종잔액']}
              contentStyle={{ background: '#0f2040', border: '1px solid #2a4f8a', borderRadius: 8, fontSize: 11 }}
            />
            <Bar dataKey="finalBalance" name="최종잔액" radius={[3,3,0,0]} maxBarSize={32}>
              {multiRateData.map((r, i) => (
                <rect key={i} fill={r.rate === monthlyRate ? '#c9a84c' : '#2a4f8a'} />
              ))}
              {multiRateData.map((r) => (
                <Bar key={r.rate} fill={r.rate === monthlyRate ? '#c9a84c' : '#2a4f8a'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ══ 월별 상세 테이블 (토글) ══ */}
      <div className="card">
        <button
          onClick={() => setShowTable(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          <div className="section-header" style={{ marginBottom: 0, border: 'none', paddingBottom: 0 }}>
            <Calendar size={14} /> 월별 상세 내역
            <span style={{ fontSize: '0.6875rem', color: '#475569', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
              ({months}개월)
            </span>
          </div>
          {showTable ? <ChevronUp size={15} color="#475569" /> : <ChevronDown size={15} color="#475569" />}
        </button>

        {showTable && (
          <div className="table-container" style={{ maxHeight: 400, overflowY: 'auto', marginTop: '1rem' }}>
            <table className="data-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                <tr>
                  <th style={{ textAlign: 'left', background: '#0a1628' }}>월</th>
                  <th style={{ background: '#0a1628' }}>투입원금</th>
                  {additions.length > 0 && <th style={{ background: '#0a1628' }}>추가입금</th>}
                  <th style={{ background: '#0a1628' }}>월 수익</th>
                  <th style={{ background: '#0a1628' }}>누적수익</th>
                  <th style={{ background: '#0a1628' }}>잔액</th>
                  <th style={{ background: '#0a1628' }}>ROI</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.month}>
                    <td style={{ color: '#94a3b8', fontWeight: 500 }}>{r.month}M</td>
                    <td className="num" style={{ color: '#60a5fa' }}>{fmtB(r.principal)}원</td>
                    {additions.length > 0 && (
                      <td className="num" style={{ color: r.added > 0 ? '#34d399' : '#334155' }}>
                        {r.added > 0 ? `+${fmtB(r.added)}원` : '-'}
                      </td>
                    )}
                    <td className="num positive">+{fmtB(r.gain)}원</td>
                    <td className="num" style={{ color: '#34d399' }}>{fmtB(r.cumGain)}원</td>
                    <td className="num gold" style={{ fontWeight: 700 }}>{fmtB(r.balance)}원</td>
                    <td className="num" style={{ color: '#a78bfa' }}>{(r.roi * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

// lucide에 Settings2 없을 수 있으므로 Calculator로 대체 인라인
function Settings2Icon({ size }) {
  return <Calculator size={size} color="#c9a84c" />;
}
