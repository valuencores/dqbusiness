import React, { useState, useEffect } from 'react';

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
  Target, TrendingUp, Shield, Users, DollarSign, Calendar,
  ChevronDown, ChevronUp, CheckCircle, AlertCircle, Zap,
  BarChart2, BookOpen, ArrowRight, Star, Clock, Layers
} from 'lucide-react';

// ── 섹션 토글 컴포넌트 ───────────────────────────────────────
function Section({ title, icon: Icon, color = '#c9a84c', children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      marginBottom: '1.25rem',
      borderRadius: 12,
      background: '#0a1628',
      border: `1px solid ${color}33`,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem', gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `${color}18`,
            border: `1px solid ${color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon size={15} color={color} />
          </div>
          <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#e2e8f0' }}>{title}</span>
          {badge && (
            <span style={{
              fontSize: '0.625rem', fontWeight: 700, padding: '0.125rem 0.5rem',
              borderRadius: 9999, background: `${color}22`, color, border: `1px solid ${color}44`,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>{badge}</span>
          )}
        </div>
        {open ? <ChevronUp size={16} color="#475569" /> : <ChevronDown size={16} color="#475569" />}
      </button>
      {open && (
        <div style={{ padding: '0 1.25rem 1.25rem' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── 항목 박스 ────────────────────────────────────────────────
function InfoBox({ label, value, sub, color = '#c9a84c', wide = false }) {
  return (
    <div style={{
      padding: '0.875rem 1rem',
      background: '#040d21',
      borderRadius: 8,
      border: `1px solid ${color}22`,
      gridColumn: wide ? 'span 2' : undefined, // handled via CSS on mobile
    }}>
      <div style={{ fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem' }}>{label}</div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.6875rem', color: '#475569', marginTop: '0.25rem', lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
}

// ── 단계 타임라인 항목 ───────────────────────────────────────
function TimelineItem({ period, label, items, color, isLast }) {
  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: `${color}18`, border: `2px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.6875rem', fontWeight: 800, color,
        }}>{label}</div>
        {!isLast && <div style={{ width: 2, flex: 1, background: '#162a52', marginTop: 4, minHeight: 24 }} />}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : '1.5rem', flex: 1 }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 700, color, marginBottom: '0.5rem' }}>{period}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8125rem', color: '#94a3b8', lineHeight: 1.6 }}>
              <ArrowRight size={12} color={color} style={{ marginTop: 4, flexShrink: 0 }} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 체크리스트 항목 ──────────────────────────────────────────
function CheckItem({ text, done = true, color = '#34d399' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
      {done
        ? <CheckCircle size={14} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
        : <AlertCircle size={14} color="#f87171" style={{ marginTop: 2, flexShrink: 0 }} />}
      <span style={{ fontSize: '0.8125rem', color: '#94a3b8', lineHeight: 1.6 }}>{text}</span>
    </div>
  );
}

// ── 구분선 ───────────────────────────────────────────────────
function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.875rem 0' }}>
      <div style={{ flex: 1, height: 1, background: '#162a52' }} />
      {label && <span style={{ fontSize: '0.625rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{label}</span>}
      <div style={{ flex: 1, height: 1, background: '#162a52' }} />
    </div>
  );
}

// ── 강조 텍스트 블록 ─────────────────────────────────────────
function HighlightBlock({ children, color = '#c9a84c' }) {
  return (
    <div style={{
      padding: '0.875rem 1rem',
      background: `${color}0d`,
      borderRadius: 8,
      borderLeft: `3px solid ${color}`,
      margin: '0.75rem 0',
      fontSize: '0.8125rem',
      color: '#cbd5e1',
      lineHeight: 1.7,
    }}>{children}</div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════
export default function StrategyPage() {
  const windowWidth = useWindowWidth();
  const isMobile    = windowWidth <= 768;
  const isTablet    = windowWidth <= 1024;
  const cols3 = isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)';
  const cols2 = isMobile ? '1fr' : '1fr 1fr';

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: '3rem' }}>

      {/* ── 페이지 헤더 ── */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BookOpen size={20} color="#c9a84c" />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
              사업 추진 전략
            </h1>
            <p style={{ fontSize: '0.8125rem', color: '#475569', margin: '0.2rem 0 0' }}>
              Valuencore Group · Dquant 9.0 · 2026.06 ~ 2029.03
            </p>
          </div>
        </div>

        {/* 핵심 슬로건 배너 */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #0a1628 0%, #0f2040 50%, #0a1628 100%)',
          borderRadius: 12,
          border: '1px solid rgba(201,168,76,0.3)',
          boxShadow: '0 0 40px rgba(201,168,76,0.06)',
        }}>
          <div style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
            Core Vision
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#c9a84c', lineHeight: 1.5, marginBottom: '0.75rem' }}>
            "보험 연계 수당 수익 + 투자 파트너 자금 복리 운용으로<br/>
            3개년 안정적 현금흐름 구조 완성"
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {[
              { label: '사업기간', value: '2026.06 ~ 2029.03 (33개월)' },
              { label: '월 목표수익률', value: '15%/월' },
              { label: '총 투자원금', value: '730,000,000원 (파트너 4인)' },
              { label: '결산 시점', value: '1·2·3차년 3월 (연 1회)' },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '0.375rem 0.75rem',
                background: 'rgba(201,168,76,0.08)',
                borderRadius: 6, border: '1px solid rgba(201,168,76,0.2)',
                fontSize: '0.75rem',
              }}>
                <span style={{ color: '#64748b' }}>{item.label}: </span>
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ 1. 사업 구조 개요 ══════════════════════════════════ */}
      <Section title="사업 구조 개요" icon={Layers} color="#c9a84c" badge="Overview" defaultOpen={true}>
        <HighlightBlock color="#c9a84c">
          본 사업은 <strong style={{ color: '#c9a84c' }}>보험 연계 수당 수익</strong>과 <strong style={{ color: '#c9a84c' }}>투자 파트너 자금 복리 운용</strong>이라는
          두 축으로 구성된 하이브리드 재무 전략입니다. 초기 보험 활동을 통한 수당 수익을 운용 초기 현금흐름의 핵심 동력으로 삼고,
          투자 파트너들의 자금이 순차 유입되면서 복리 자산이 기하급수적으로 성장하는 구조를 설계합니다.
        </HighlightBlock>

        <div style={{ display: 'grid', gridTemplateColumns: cols3, gap: '0.75rem', marginTop: '1rem' }}>
          <div style={{ padding: '1rem', background: '#040d21', borderRadius: 10, border: '1px solid rgba(96,165,250,0.25)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>수익원 ①</div>
            <Shield size={22} color="#60a5fa" style={{ margin: '0 auto 0.5rem' }} />
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#60a5fa', marginBottom: '0.375rem' }}>보험 연계 수당</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.6 }}>5슬롯 × 27,000,000원/월<br/>= 135,000,000원/월 수당 수익</div>
          </div>
          <div style={{ padding: '1rem', background: '#040d21', borderRadius: 10, border: '1px solid rgba(201,168,76,0.25)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>수익원 ②</div>
            <TrendingUp size={22} color="#c9a84c" style={{ margin: '0 auto 0.5rem' }} />
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#c9a84c', marginBottom: '0.375rem' }}>투자 복리 운용</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.6 }}>월 15% 복리 수익률<br/>파트너 자금 순차 투입</div>
          </div>
          <div style={{ padding: '1rem', background: '#040d21', borderRadius: 10, border: '1px solid rgba(52,211,153,0.25)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>수익원 ③</div>
            <DollarSign size={22} color="#34d399" style={{ margin: '0 auto 0.5rem' }} />
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#34d399', marginBottom: '0.375rem' }}>보험 해약 환급금</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.6 }}>24개월 유지 후 25차월<br/>납입 보험료의 30% 환급 재투자</div>
          </div>
        </div>
      </Section>

      {/* ══ 2. 수익 구조 & 핵심 수치 ══════════════════════════ */}
      <Section title="수익 구조 및 핵심 수치" icon={BarChart2} color="#34d399" badge="Financials">
        <Divider label="보험 연계 활동 수익" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
          <InfoBox label="보험 슬롯 수" value="5 슬롯" sub="동시 운용 슬롯" color="#60a5fa" />
          <InfoBox label="슬롯당 월 수당" value="27,000,000원" sub="슬롯당 수당 수익" color="#60a5fa" />
          <InfoBox label="월 총 수당 수익" value="135,000,000원" sub="5슬롯 합산" color="#c9a84c" />
          <InfoBox label="슬롯당 월 보험료" value="3,000,000원" sub="납입 비용" color="#f87171" />
          <InfoBox label="월 총 보험료 납입" value="15,000,000원" sub="5슬롯 합산 비용" color="#f87171" />
          <InfoBox label="순 보험 수당 수익" value="120,000,000원" sub="수당 - 보험료" color="#34d399" />
        </div>

        <Divider label="보험 활동 기간 (수당 수익 발생 구간)" />
        <div style={{ display: 'grid', gridTemplateColumns: cols2, gap: '0.75rem' }}>
          <InfoBox label="보험 판매 활동 기간" value="2026-06 ~ 2027-02" sub="9개월간 슬롯 판매/계약" color="#60a5fa" />
          <InfoBox label="수당 수익 발생 기간" value="2026-07 ~ 2027-03" sub="9개월간 수당 수령" color="#34d399" />
        </div>

        <Divider label="해약 환급금 구조" />
        <HighlightBlock color="#a78bfa">
          보험 계약 후 <strong style={{ color: '#a78bfa' }}>24개월 유지</strong>하고, <strong style={{ color: '#a78bfa' }}>25차월</strong>에 해약 시
          총 납입 보험료의 <strong style={{ color: '#a78bfa' }}>30%를 환급</strong>받아 즉시 운용 자산에 재투자합니다.
          이는 보험 비용을 단순 지출이 아닌 '유보 수익'으로 전환하는 구조입니다.
        </HighlightBlock>

        <Divider label="복리 운용 목표" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
          <InfoBox label="기준 월 수익률" value="15%/월" sub="Base 시나리오" color="#c9a84c" />
          <InfoBox label="운용 기간" value="33개월" sub="2026-06 ~ 2029-03" color="#c9a84c" />
          <InfoBox label="연간 환산 수익률" value="~435%" sub="복리 기준 (이론치)" color="#34d399" />
          <InfoBox label="결산 주기" value="연 1회 (3월)" sub="3차년까지 매년 결산" color="#a78bfa" />
        </div>
      </Section>

      {/* ══ 3. 투자 파트너 구성 ══════════════════════════════ */}
      <Section title="투자 파트너 구성" icon={Users} color="#60a5fa" badge="Partners">
        <HighlightBlock color="#60a5fa">
          총 4인의 투자 파트너가 <strong style={{ color: '#60a5fa' }}>730,000,000원</strong>을 순차적으로 투입합니다.
          김현수(290M) · 나성수(140M) · 임현(280M) · 김한님(280M)이
          1~2차년에 걸쳐 단계적으로 참여하는 복리 극대화 구조입니다.
        </HighlightBlock>

        <div style={{ marginTop: '0.75rem' }}>
          {[
            {
              name: '김현수', amount: '290,000,000원', timing: '2026-07 / 2027-04 / 2027-06',
              color: '#c9a84c', ratio: '20%', type: '개인',
              desc: '1차년 초기 최대 선발 투자자. 가장 긴 복리 누적 기간을 보유하여 최대 수익 효과.',
              detail: '1차년: 90M(2026-07) · 2차년: 100M(2027-04) + 100M(2027-06)',
            },
            {
              name: '나성수', amount: '140,000,000원', timing: '2026-06 / 2026-11',
              color: '#60a5fa', ratio: '12%', type: '개인',
              desc: '사업 개시(2026-06) 직후 소액 선투입, 보험 수당 확인 후 1차년 하반기 확대 투입.',
              detail: '1차년: 40M(2026-06) + 100M(2026-11)',
            },
            {
              name: '임현', amount: '280,000,000원', timing: '2027-03 / 2027-09',
              color: '#34d399', ratio: '28%', type: '개인',
              desc: '1차 결산(2027-03) 성과 확인 후 본격 참여. 2차년 두 차례 대규모 분할 투입.',
              detail: '2차년: 100M(2027-03) + 180M(2027-09)',
            },
            {
              name: '김한님', amount: '280,000,000원', timing: '2026-09~11 / 2027-03 / 2027-07',
              color: '#a78bfa', ratio: '22%', type: '개인',
              desc: '1차년 소액 분할 진입 후 1차 결산 직후 및 2차년에 대규모 추가 투입.',
              detail: '1차년: 30M(2026-09)+30M(2026-10)+20M(2026-11) · 2차년: 100M(2027-03)+100M(2027-07)',
            },
          ].map((p, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr auto',
              padding: '1rem 1.125rem', background: '#040d21',
              borderRadius: 10, border: `1px solid ${p.color}22`,
              marginBottom: '0.625rem', gap: '1rem', alignItems: 'start',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: p.color }}>{p.name}</span>
                  <span style={{
                    fontSize: '0.625rem', padding: '0.1rem 0.4rem', borderRadius: 4,
                    background: `${p.color}18`, color: p.color, fontWeight: 700,
                  }}>{p.type}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>분배비율 {p.ratio}</span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.375rem' }}>
                  투입 시기: <span style={{ color: '#94a3b8' }}>{p.timing}</span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#94a3b8', lineHeight: 1.6 }}>{p.desc}</div>
                {p.detail && (
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.375rem', paddingLeft: '0.75rem', borderLeft: `2px solid ${p.color}33` }}>
                    {p.detail}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: p.color, fontVariantNumeric: 'tabular-nums' }}>{p.amount}</div>
                <div style={{ fontSize: '0.6875rem', color: '#475569', marginTop: '0.25rem' }}>투자금</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          padding: '0.875rem 1.125rem', background: '#040d21',
          borderRadius: 10, border: '1px solid rgba(201,168,76,0.3)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem',
          marginTop: '0.75rem',
        }}>
          <span style={{ fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 600 }}>총 투자원금 합계</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#c9a84c', fontVariantNumeric: 'tabular-nums' }}>730,000,000원</span>
          <span style={{ fontSize: '0.75rem', color: '#475569', marginLeft: '0.625rem' }}>김현수 290M · 나성수 140M · 임현 280M · 김한님 280M</span>
        </div>
      </Section>

      {/* ══ 4. 인건비 & 운영 비용 구조 ════════════════════════ */}
      <Section title="운영 인력 및 비용 구조" icon={DollarSign} color="#f87171" badge="Cost Structure">
        <HighlightBlock color="#f87171">
          사업 규모 성장에 따라 비용 구조도 <strong style={{ color: '#f87171' }}>3단계로 확대</strong>됩니다.
          초기에는 핵심 인력 중심의 최소 비용으로 출발하여, 사업이 안정화되는 2·3차년도에
          인건비와 고객 수익분배금을 단계적으로 증액합니다.
        </HighlightBlock>

        {[
          {
            phase: '1차 구간', period: '2026-07 ~ 2027-01', color: '#60a5fa',
            total: 23600000,
            items: [
              { name: '나상수', amount: '2,300,000원' },
              { name: '임현', amount: '2,200,000원' },
              { name: '박승훈', amount: '2,100,000원' },
              { name: '나성수', amount: '3,000,000원' },
              { name: '김현수', amount: '3,000,000원' },
              { name: '회사 운영비', amount: '3,000,000원' },
              { name: '고객 수익분배금', amount: '8,000,000원' },
            ],
          },
          {
            phase: '2차 구간', period: '2027-02 ~ 2028-02', color: '#c9a84c',
            total: 35700000,
            items: [
              { name: '나상수', amount: '2,500,000원' },
              { name: '임현', amount: '3,000,000원' },
              { name: '박승훈', amount: '2,200,000원' },
              { name: '나성수', amount: '4,000,000원' },
              { name: '김현수', amount: '4,000,000원' },
              { name: '회사 운영비', amount: '4,000,000원' },
              { name: '김한님', amount: '3,000,000원' },
              { name: '고객 수익분배금', amount: '13,000,000원' },
            ],
          },
          {
            phase: '3차 구간', period: '2028-03 ~ 2029-02', color: '#34d399',
            total: 54500000,
            items: [
              { name: '나상수', amount: '3,000,000원' },
              { name: '임현', amount: '4,000,000원' },
              { name: '박승훈', amount: '4,000,000원' },
              { name: '나성수', amount: '5,000,000원' },
              { name: '김현수', amount: '5,000,000원' },
              { name: '회사 운영비', amount: '10,000,000원' },
              { name: '김한님', amount: '3,500,000원' },
              { name: '고객 수익분배금', amount: '20,000,000원' },
            ],
          },
        ].map((phase, pi) => (
          <div key={pi} style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
              <div style={{
                fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.625rem',
                borderRadius: 9999, background: `${phase.color}18`,
                color: phase.color, border: `1px solid ${phase.color}33`,
              }}>{phase.phase}</div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{phase.period}</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.875rem', fontWeight: 700, color: phase.color, fontVariantNumeric: 'tabular-nums' }}>
                월 {(phase.total / 10000).toLocaleString('ko-KR')}만원
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.375rem' }}>
              {phase.items.map((item, ii) => (
                <div key={ii} style={{
                  padding: '0.5rem 0.75rem', background: '#040d21',
                  borderRadius: 6, border: `1px solid ${phase.color}18`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem',
                }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.name}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: phase.color, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{item.amount}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Section>

      {/* ══ 5. 연도별 사업 추진 일정 ══════════════════════════ */}
      <Section title="연도별 사업 추진 일정" icon={Calendar} color="#a78bfa" badge="Roadmap">
        <div style={{ marginTop: '0.5rem' }}>
          <TimelineItem
            period="1차년 (2026.06 ~ 2027.03)"
            label="1Y"
            color="#c9a84c"
            items={[
              '2026-06: 사업 개시 — 나성수 4,000만원 초기 투입, 보험 슬롯 판매 활동 시작',
              '2026-07: 김현수 9천만 투입 + 보험 수당 수익 발생 시작 (월 135,000,000원 수당)',
              '2026-07: 설계사정착수당 수령 — 나상수·임현·박승훈·나성수 각 1천만 = 총 4,000만원',
              '2026-09~11: 김한님 분할 투입 8천만 (30M+30M+20M) / 2026-11: 나성수 1억 추가',
              '2027-06~07: 김현수 2차년 추가 투입 (100M+100M)',
              '2027-03: 임현 1억 + 김한님 1억 동시 유입 (1차 결산 전월)',
              '2027-04: 김현수 2차년 1억 추가',
              '2027-07: 김한님 1억 추가',
              '2026-07~2027-01: 1차 비용 구간 (월 2,360만원)',
              '2027-02: 2차 비용 구간 전환 (월 3,570만원) — 사업 확장 대응',
              '2027-03: 1차년 결산 — 성과 확인 및 2차년 파트너 참여 기반 마련',
            ]}
            isLast={false}
          />
          <TimelineItem
            period="2차년 (2027.03 ~ 2028.03)"
            label="2Y"
            color="#60a5fa"
            items={[
              '2027-03: 임현 1억 + 김한님 1억 동시 유입 (1차 결산 시점)',
              '2027-04: 김현수 2차년 1억 투입',
              '2027-06: 김현수 추가 1억 투입',
              '2027-07: 김한님 1억 추가 투입',
              '2027-09: 임현 1억8천 대규모 추가 투입',
              '2027-03~2028-02: 2차 비용 구간 유지 (월 3,570만원)',
              '2028-03: 2차년 결산 — 33.2% 세율 적용 · 파트너 원금 회수 또는 수익 분배 검토',
            ]}
            isLast={false}
          />
          <TimelineItem
            period="3차년 (2028.03 ~ 2029.03)"
            label="3Y"
            color="#34d399"
            items={[
              '2028-03: 3차 비용 구간 전환 (월 5,450만원) — 수익분배금 대폭 증액',
              '2028년: 보험 해약 환급금 수령 및 재투자 (24개월 유지 완료)',
              '운용 자산이 최대 규모에 도달 — 복리 수익 극대화 구간',
              '2029-03: 3차년 최종 결산 — 33.2% 세율 적용 · 전체 사업 마무리 및 최종 수익 분배',
            ]}
            isLast={true}
          />
        </div>
      </Section>

      {/* ══ 6. 결산 구조 & 과세 전략 ══════════════════════════ */}
      <Section title="결산 구조 및 과세 전략" icon={Target} color="#34d399" badge="Settlement & Tax">
        <div style={{ display: 'grid', gridTemplateColumns: cols3, gap: '0.75rem', marginBottom: '1rem' }}>
          <InfoBox label="1차 결산" value="2027-03" sub="비과세 · 1차년 성과 확인 / 파트너 추가 투입 결정" color="#c9a84c" />
          <InfoBox label="2차 결산" value="2028-03" sub="33.2% 세율 적용 · 2차년 누적 성과 분배" color="#60a5fa" />
          <InfoBox label="3차 결산 (최종)" value="2029-03" sub="33.2% 세율 적용 · 최종 수익 완전 분배" color="#34d399" />
        </div>

        <Divider label="과세 구조 선택" />
        <div style={{ display: 'grid', gridTemplateColumns: cols2, gap: '0.75rem' }}>
          <div style={{ padding: '1rem', background: '#040d21', borderRadius: 10, border: '1px solid rgba(201,168,76,0.2)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c9a84c', marginBottom: '0.625rem' }}>📋 개인 과세 (배당소득세)</div>
            <CheckItem text="배당소득세 15.4% (지방세 포함)" />
            <CheckItem text="종합소득세 최고세율 38% 적용 가능" />
            <CheckItem text="개인 투자자 4인 모두 적용 대상" />
          </div>
          <div style={{ padding: '1rem', background: '#040d21', borderRadius: 10, border: '1px solid rgba(96,165,250,0.2)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', marginBottom: '0.625rem' }}>🏢 법인 과세 (법인세)</div>
            <CheckItem text="법인세율 22% 적용" />
            <CheckItem text="법인 구조 분배비율 18% 설정" />
            <CheckItem text="Tax-Optimized 시나리오: 법인 50%로 확대 가능" />
          </div>
        </div>

        <HighlightBlock color="#34d399">
          현재 대시보드 기본 과세 설정은 <strong style={{ color: '#c9a84c' }}>settlement_from_2nd</strong> 모드입니다.
          <strong style={{ color: '#34d399' }}>1차 결산(2027-03): 비과세</strong>,{' '}
          <strong style={{ color: '#f87171' }}>2차(2028-03) · 3차(2029-03) 결산: 33.2% 단일세율</strong> 적용.
          시나리오 페이지의 <strong style={{ color: '#34d399' }}>Tax-Heavy / Tax-Optimized</strong> 시나리오로 과세 영향도를 즉시 비교할 수 있습니다.
        </HighlightBlock>
      </Section>

      {/* ══ 7. 리스크 관리 & 핵심 전제 ════════════════════════ */}
      <Section title="리스크 관리 및 핵심 전제" icon={Shield} color="#f87171" badge="Risk" defaultOpen={false}>
        <div style={{ display: 'grid', gridTemplateColumns: cols2, gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ⚠️ 주요 리스크 요인
            </div>
            <CheckItem text="월 15% 수익률 미달 시 복리 성장 속도 대폭 감소" done={false} />
            <CheckItem text="보험 슬롯 계약 미체결 시 초기 현금흐름 부족" done={false} />
            <CheckItem text="투자 파트너 자금 투입 지연 발생 가능성" done={false} />
            <CheckItem text="보험 24개월 미유지 시 환급금 미발생" done={false} />
            <CheckItem text="과세 정책 변경에 따른 세후 수익 감소" done={false} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ✅ 리스크 대응 방안
            </div>
            <CheckItem text="Conservative(8%)/Aggressive(18%) 시나리오 즉시 비교 가능" />
            <CheckItem text="보험 슬롯 5개 → 최대 15개까지 확장 시나리오 내 설정 가능" />
            <CheckItem text="파트너 자금 투입 월 조정은 입력설정에서 즉시 반영" />
            <CheckItem text="해약 환급률 조정 슬라이더 시나리오 페이지 제공" />
            <CheckItem text="Tax-Optimized 시나리오로 법인 구조 최적화 검토" />
          </div>
        </div>

        <Divider label="핵심 전제 조건" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.625rem' }}>
          {[
            { label: '수익률', value: '월 15% (Base)', note: '복리 적용, 월말 정산' },
            { label: '보험 슬롯', value: '5슬롯 동시 운용', note: '2026-06 ~ 2027-02 판매' },
            { label: '자금 투입', value: '사전 합의 일정 준수', note: '지연 시 수정 즉시 반영' },
            { label: '결산 주기', value: '연 1회 (3월)', note: '3차년도까지 유지' },
            { label: '비용 구조', value: '3단계 확장형', note: '사업 성과 연동 인상' },
            { label: '법인 비율', value: '18% (기본값)', note: '최적화 시 50%까지 조정' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '0.75rem', background: '#040d21', borderRadius: 8, border: '1px solid #162a52',
            }}>
              <div style={{ fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>{item.label}</div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#e2e8f0' }}>{item.value}</div>
              <div style={{ fontSize: '0.6875rem', color: '#475569', marginTop: '0.2rem' }}>{item.note}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ══ 8. 시나리오별 목표 성과 ════════════════════════════ */}
      <Section title="시나리오별 목표 성과 요약" icon={Zap} color="#a78bfa" badge="Targets" defaultOpen={false}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #162a52' }}>
                {['시나리오', '월 수익률', '목표 최종잔액 (추정)', '총 ROI', '특징'].map((h, i) => (
                  <th key={i} style={{ padding: '0.625rem 0.75rem', textAlign: i === 0 ? 'left' : 'center', color: '#64748b', fontWeight: 600, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Base', color: '#c9a84c', rate: '15%', balance: '실시간 계산', roi: '대시보드 확인', note: '기준 시나리오' },
                { label: 'Conservative', color: '#60a5fa', rate: '8%', balance: '복리 성장 둔화', roi: '대폭 감소', note: '최악 대비 안전 마진' },
                { label: 'Aggressive', color: '#34d399', rate: '18%', balance: '기하급수 증가', roi: '최대', note: '최선 달성 시 성과' },
                { label: 'Tax-Heavy', color: '#f87171', rate: '15%', balance: '세금 차감', roi: '세후 감소', note: '과세 최대 적용' },
                { label: 'Tax-Optimized', color: '#a78bfa', rate: '15%', balance: '법인 구조 최적화', roi: '세후 최적화', note: '법인 50% 분배' },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #0f2040' }}>
                  <td style={{ padding: '0.75rem', }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: row.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, color: row.color }}>{row.label}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', color: '#a78bfa', fontWeight: 600 }}>{row.rate}/월</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>{row.balance}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', color: '#34d399', fontWeight: 600 }}>{row.roi}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', color: '#64748b', fontSize: '0.75rem' }}>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <HighlightBlock color="#a78bfa">
          각 시나리오의 <strong style={{ color: '#a78bfa' }}>실제 수치는 시나리오 페이지</strong>에서 실시간으로 확인할 수 있습니다.
          본 전략 문서의 목표 성과와 실제 시나리오 계산값을 비교하여 사업 진행 상황을 모니터링하십시오.
        </HighlightBlock>
      </Section>

      {/* ── 하단 서명 ── */}
      <div style={{
        marginTop: '2rem', padding: '1.25rem 1.5rem',
        background: '#0a1628', borderRadius: 12, border: '1px solid #162a52',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
      }}>
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#c9a84c' }}>Valuencore Group · Dquant 9.0</div>
          <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem' }}>
            본 문서는 내부 재무 전략 수립 목적의 기밀 자료입니다. 외부 유출을 금합니다.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Star size={13} color="#c9a84c" />
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>2026.06 ~ 2029.03</span>
        </div>
      </div>
    </div>
  );
}
