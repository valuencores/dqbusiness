import React, { useState, useRef } from 'react';
import {
  FileBarChart2, Download, Printer, TrendingUp,
  Users, DollarSign, BarChart2, ChevronDown, ChevronUp, Calendar
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useStore } from '../store/useStore';
import { fmt, fmtB, fmtPct } from '../engine/calculator';

// ── CSV 내보내기 ─────────────────────────────────────────────
function exportCSV(rows) {
  const headers = ['월', '기초잔액', '총유입', '투자수익', '총유출', '세전잔액', '세후잔액', '누적원금', '세전이익', 'ROI(%)', '결산여부'];
  const lines = [headers.join(',')];
  rows.forEach(r => {
    lines.push([
      r.month,
      r.openingBalance,
      r.totalInflow,
      r.investmentReturn,
      r.totalOutflow,
      r.preTaxBalance,
      r.afterTaxBalance,
      r.cumulativePrincipal,
      r.preTaxProfit,
      (r.roi * 100).toFixed(2),
      r.isSettlement ? 'Y' : '',
    ].join(','));
  });
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'dquant9_worktable.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ── 자동 문장 요약 ───────────────────────────────────────────
function generateSummary(kpis, settlements, config, participants) {
  if (!kpis || !settlements) return [];
  const lines = [];

  // 가장 성장이 큰 결산 시점
  if (settlements.length > 0) {
    const best = settlements.reduce((a, b) => a.roi > b.roi ? a : b);
    lines.push(`📈 가장 높은 ROI는 ${best.month} 결산 시점으로, 세전 기준 ${(best.roi * 100).toFixed(1)}%의 수익률을 기록합니다.`);
  }

  // 월 수익률 영향
  lines.push(`💡 월 수익률 ${(config.baseReturnRate * 100).toFixed(0)}% 기준으로 ${config.startMonth} ~ ${config.endMonth} (총 ${kpis.totalMonths}개월) 운용 시, 누적원금 ${fmtB(kpis.totalPrincipal)} 대비 세전 잔액 ${fmtB(kpis.currentBalance)}이 예상됩니다.`);

  // 세전/세후 비교
  if (config.taxConfig.mode !== 'none') {
    const diff = kpis.currentBalance - kpis.afterTaxBalance;
    lines.push(`🧾 과세 반영 시 세전 잔액 대비 세후 잔액이 ${fmtB(diff)} 감소합니다. (세후 ROI: ${(kpis.afterTaxROI * 100).toFixed(1)}%)`);
  } else {
    lines.push(`🧾 현재 과세 미반영 상태입니다. 과세 설정에서 세율을 입력하면 세후 성과를 비교할 수 있습니다.`);
  }

  // 개인 vs 법인 구조
  const indiv = participants?.filter(p => p.entityType === 'individual') || [];
  const corp = participants?.filter(p => p.entityType === 'corporate') || [];
  if (indiv.length > 0 && corp.length > 0) {
    lines.push(`🏢 참여 구조상 개인 참여자 ${indiv.length}명과 법인 참여자 ${corp.length}개가 있습니다. 법인 구조는 법인세율 적용으로 세부담이 달라질 수 있습니다.`);
  }

  // 최대 유입월
  lines.push(`💰 총 유입금 ${fmtB(kpis.cumulativeInflow)} 중 투자수익 기여분이 ${fmtB(kpis.cumulativeReturn)}으로, 복리 효과가 자산 성장의 핵심 동력입니다.`);

  return lines;
}

// ── 섹션 토글 ─────────────────────────────────────────────
function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        marginBottom: open ? '1rem' : 0,
      }}>
        <div className="section-header" style={{ margin: 0, border: 'none', paddingBottom: 0 }}>
          {Icon && <Icon size={14} />} {title}
        </div>
        {open ? <ChevronUp size={16} color="#475569" /> : <ChevronDown size={16} color="#475569" />}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

// ── Custom Tooltip ─────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f2040', border: '1px solid #2a4f8a', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.75rem' }}>
      <div style={{ color: '#c9a84c', fontWeight: 700, marginBottom: '0.5rem' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: '0.2rem' }}>
          {p.name}: <strong>{fmtB(p.value)}</strong>
        </div>
      ))}
    </div>
  );
};

// ── MAIN RESULT PAGE ───────────────────────────────────────
export default function ResultPage() {
  const { rows, settlements, participants, kpis, config } = useStore();
  const [filter, setFilter] = useState('all'); // all | settlement
  const printRef = useRef();

  if (!kpis) return <div style={{ color: '#64748b', padding: '2rem' }}>계산 중...</div>;

  const summaryLines = generateSummary(kpis, settlements, config, participants);

  const displayRows = filter === 'settlement'
    ? rows.filter(r => r.isSettlement)
    : rows;

  const handlePrint = () => window.print();

  const settlementCompareData = settlements.map(s => ({
    month: s.month,
    balance: s.closingBalance,
    preTax: s.preTaxProfit,
    afterTax: s.afterTaxProfit,
    tax: s.taxAmount,
  }));

  return (
    <div ref={printRef}>
      {/* ── 헤더 ── */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#e2e8f0', margin: 0 }}>
            결과 리포트
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#475569', margin: '0.25rem 0 0' }}>
            Dquant 9.0 재무결산 · {config.startMonth} ~ {config.endMonth}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-ghost" onClick={handlePrint}><Printer size={13} /> 인쇄/PDF</button>
          <button className="btn-primary" onClick={() => exportCSV(rows)}><Download size={13} /> CSV 내보내기</button>
        </div>
      </div>

      {/* ── ① 핵심 결과 카드 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.875rem', marginBottom: '1.25rem' }}>
        {[
          { label: '누적 투자원금', value: fmtB(kpis.totalPrincipal), color: '#60a5fa', sub: fmt(kpis.totalPrincipal) + '원' },
          { label: '최종 세전 잔액', value: fmtB(kpis.currentBalance), color: '#c9a84c', sub: fmt(kpis.currentBalance) + '원' },
          { label: '총투자 ROI', value: fmtPct(kpis.totalROI), color: '#34d399', sub: '세전 기준' },
          { label: '세전 사업이익', value: fmtB(kpis.preTaxProfit), color: '#34d399', sub: '수익 - 원금' },
          { label: '세후 사업이익', value: fmtB(kpis.afterTaxProfit), color: '#a78bfa', sub: config.taxConfig.mode === 'none' ? '과세 미반영' : `세금 ${fmtB(kpis.cumulativeTax)}` },
          { label: '누적 세금', value: kpis.cumulativeTax > 0 ? fmtB(kpis.cumulativeTax) : '-', color: '#f87171', sub: config.taxConfig.mode === 'none' ? '미계산' : '추정치' },
          { label: '총 운용기간', value: `${kpis.totalMonths}개월`, color: '#60a5fa', sub: `${config.startMonth} ~ ${config.endMonth}` },
          { label: '세후 ROI', value: fmtPct(kpis.afterTaxROI), color: '#a78bfa', sub: '세후 기준' },
        ].map((k, i) => (
          <div key={i} className="kpi-card">
            <div style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>{k.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: k.color, fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
            <div style={{ fontSize: '0.6875rem', color: '#475569', marginTop: '0.25rem' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── ② 결산 시점 요약표 ── */}
      <Section title="결산 시점 요약" icon={Calendar}>
        {settlements.length === 0 ? (
          <div style={{ color: '#475569', fontSize: '0.8125rem', padding: '1rem 0', textAlign: 'center' }}>
            결산 시점이 없습니다. 입력설정에서 결산월을 추가하세요.
          </div>
        ) : (
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
                  <th>분배가능이익</th>
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
                    <td className="num" style={{ color: config.taxConfig.mode !== 'none' ? '#34d399' : '#64748b' }}>
                      {fmt(s.afterTaxProfit)}
                    </td>
                    <td className="num gold">{fmtPct(s.roi)}</td>
                    <td className="num" style={{ color: '#a78bfa' }}>{fmtPct(s.afterTaxRoi)}</td>
                    <td className="num positive">{fmt(Math.max(0, s.afterTaxProfit))}</td>
                    <td className="num negative">{s.taxAmount > 0 ? fmt(s.taxAmount) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ── ③ 참여자별 결과표 ── */}
      <Section title="참여자별 결과" icon={Users}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>참여자</th>
                <th style={{ textAlign: 'left' }}>구분</th>
                <th>분배비율</th>
                <th>총투입원금</th>
                <th>세전귀속액</th>
                <th>세후귀속액</th>
                <th>예상세금</th>
                <th>최종순이익</th>
                <th>ROI</th>
              </tr>
            </thead>
            <tbody>
              {participants?.map((p, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{p.name}</div>
                  </td>
                  <td>
                    <span className={`badge ${p.entityType === 'corporate' ? 'badge-blue' : 'badge-gold'}`}>
                      {p.entityType === 'corporate' ? '법인' : '개인'}
                    </span>
                  </td>
                  <td className="num">{(p.distributionRatio * 100).toFixed(1)}%</td>
                  <td className="num">{fmt(p.totalPrincipal)}</td>
                  <td className="num positive">{fmt(p.preTaxShare)}</td>
                  <td className="num" style={{ color: config.taxConfig.mode !== 'none' ? '#34d399' : '#64748b' }}>
                    {fmt(p.afterTaxShare)}
                  </td>
                  <td className="num negative">{p.estimatedTax > 0 ? fmt(p.estimatedTax) : '-'}</td>
                  <td className="num positive">{fmt(p.netProfit)}</td>
                  <td className="num gold">{p.principal > 0 ? fmtPct(p.roi) : '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #2a4f8a' }}>
                <td colSpan={3} style={{ color: '#c9a84c', fontWeight: 700 }}>합계</td>
                <td className="num" style={{ color: '#e2e8f0', fontWeight: 700 }}>{fmt(participants?.reduce((s, p) => s + p.totalPrincipal, 0) || 0)}</td>
                <td className="num positive" style={{ fontWeight: 700 }}>{fmt(participants?.reduce((s, p) => s + p.preTaxShare, 0) || 0)}</td>
                <td className="num" style={{ color: '#34d399', fontWeight: 700 }}>{fmt(participants?.reduce((s, p) => s + p.afterTaxShare, 0) || 0)}</td>
                <td className="num negative" style={{ fontWeight: 700 }}>{fmt(participants?.reduce((s, p) => s + p.estimatedTax, 0) || 0)}</td>
                <td className="num positive" style={{ fontWeight: 700 }}>{fmt(participants?.reduce((s, p) => s + p.netProfit, 0) || 0)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Section>

      {/* ── ④ 세금 비교 리포트 ── */}
      <Section title="과세 반영 전후 비교" icon={BarChart2} defaultOpen={false}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.875rem', marginBottom: '1rem' }}>
          {[
            { label: '세금 미반영', profit: kpis.preTaxProfit, roi: kpis.totalROI, color: '#64748b', tag: '기준' },
            { label: '개인 과세 (배당소득세)', profit: kpis.preTaxProfit * (1 - (config.taxConfig.individual?.dividendTaxRate || 0.154)), roi: kpis.totalROI * (1 - (config.taxConfig.individual?.dividendTaxRate || 0.154)), color: '#c9a84c', tag: `${((config.taxConfig.individual?.dividendTaxRate || 0.154) * 100).toFixed(1)}%` },
            { label: '법인 과세 적용', profit: kpis.preTaxProfit * (1 - (config.taxConfig.corporate?.corporateTaxRate || 0.22)), roi: kpis.totalROI * (1 - (config.taxConfig.corporate?.corporateTaxRate || 0.22)), color: '#60a5fa', tag: `${((config.taxConfig.corporate?.corporateTaxRate || 0.22) * 100).toFixed(1)}%` },
            { label: '종합소득세 (개인 최고)', profit: kpis.preTaxProfit * (1 - (config.taxConfig.individual?.incomeTaxRate || 0.38)), roi: kpis.totalROI * (1 - (config.taxConfig.individual?.incomeTaxRate || 0.38)), color: '#f87171', tag: `${((config.taxConfig.individual?.incomeTaxRate || 0.38) * 100).toFixed(1)}%` },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '1rem', background: '#040d21', borderRadius: 8,
              border: `1px solid ${item.color}33`,
            }}>
              <div style={{ fontSize: '0.6875rem', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {item.label}
                <span className="badge badge-blue" style={{ marginLeft: '0.5rem', color: item.color }}>{item.tag}</span>
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, color: item.color, fontVariantNumeric: 'tabular-nums' }}>
                {fmtB(item.profit)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                ROI {(item.roi * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>

        {settlementCompareData.length > 0 && (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={settlementCompareData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#162a52" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis tickFormatter={v => fmtB(v)} tick={{ fill: '#475569', fontSize: 10 }} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              <Bar dataKey="balance" name="결산잔액" fill="#c9a84c" radius={[3, 3, 0, 0]} />
              <Bar dataKey="preTax" name="세전이익" fill="#34d399" radius={[3, 3, 0, 0]} />
              <Bar dataKey="afterTax" name="세후이익" fill="#60a5fa" radius={[3, 3, 0, 0]} />
              <Bar dataKey="tax" name="세금" fill="#f87171" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Section>

      {/* ── ⑤ 월별 재무 워크테이블 ── */}
      <Section title="월별 재무 워크테이블" icon={TrendingUp} defaultOpen={false}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem' }}>
          <button className={`btn-ghost ${filter === 'all' ? 'active' : ''}`} style={filter === 'all' ? { color: '#c9a84c', borderColor: '#c9a84c' } : {}} onClick={() => setFilter('all')}>전체</button>
          <button className={`btn-ghost ${filter === 'settlement' ? 'active' : ''}`} style={filter === 'settlement' ? { color: '#c9a84c', borderColor: '#c9a84c' } : {}} onClick={() => setFilter('settlement')}>결산월만</button>
          <button className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => exportCSV(rows)}>
            <Download size={12} /> CSV
          </button>
        </div>
        <div className="table-container" style={{ maxHeight: 480, overflowY: 'auto' }}>
          <table className="data-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
              <tr>
                <th style={{ textAlign: 'left', background: '#0a1628' }}>월</th>
                <th style={{ background: '#0a1628' }}>기초잔액</th>
                <th style={{ background: '#0a1628' }}>총유입</th>
                <th style={{ background: '#0a1628' }}>투자수익</th>
                <th style={{ background: '#0a1628' }}>총유출</th>
                <th style={{ background: '#0a1628' }}>세전잔액</th>
                <th style={{ background: '#0a1628' }}>세후잔액</th>
                <th style={{ background: '#0a1628' }}>누적원금</th>
                <th style={{ background: '#0a1628' }}>세전이익</th>
                <th style={{ background: '#0a1628' }}>ROI</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((r, i) => (
                <tr key={i} className={r.isSettlement ? 'settlement-row' : ''}>
                  <td>
                    {r.isSettlement
                      ? <span className="badge badge-gold">{r.month}</span>
                      : <span style={{ color: '#94a3b8' }}>{r.month}</span>
                    }
                  </td>
                  <td className="num">{fmt(r.openingBalance)}</td>
                  <td className="num positive">{r.totalInflow > 0 ? fmt(r.totalInflow) : '-'}</td>
                  <td className="num positive">{fmt(r.investmentReturn)}</td>
                  <td className="num negative">{r.totalOutflow > 0 ? fmt(r.totalOutflow) : '-'}</td>
                  <td className="num gold">{fmt(r.preTaxBalance)}</td>
                  <td className="num" style={{ color: r.afterTaxBalance !== r.preTaxBalance ? '#34d399' : '#64748b' }}>
                    {fmt(r.afterTaxBalance)}
                  </td>
                  <td className="num">{fmt(r.cumulativePrincipal)}</td>
                  <td className="num" style={{ color: r.preTaxProfit >= 0 ? '#34d399' : '#f87171' }}>
                    {fmt(r.preTaxProfit)}
                  </td>
                  <td className="num gold">{(r.roi * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── ⑥ 유입/유출 상세 워크테이블 ── */}
      <Section title="유입·유출 상세 워크테이블" icon={DollarSign} defaultOpen={false}>
        <div className="table-container" style={{ maxHeight: 400, overflowY: 'auto' }}>
          <table className="data-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
              <tr>
                <th style={{ textAlign: 'left', background: '#0a1628' }}>월</th>
                <th style={{ background: '#0a1628' }}>일반시드</th>
                <th style={{ background: '#0a1628' }}>파트너</th>
                <th style={{ background: '#0a1628' }}>보험수당</th>
                <th style={{ background: '#0a1628' }}>정착수당</th>
                <th style={{ background: '#0a1628' }}>해약환급</th>
                <th style={{ background: '#0a1628' }}>보험료납입</th>
                <th style={{ background: '#0a1628' }}>비용</th>
                <th style={{ background: '#0a1628' }}>순현금흐름</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const netCF = r.totalInflow - r.totalOutflow;
                const hasActivity = r.totalInflow > 0 || r.totalOutflow > 0;
                if (!hasActivity && !r.isSettlement) return null;
                return (
                  <tr key={i} className={r.isSettlement ? 'settlement-row' : ''}>
                    <td>{r.isSettlement ? <span className="badge badge-gold">{r.month}</span> : <span style={{ color: '#94a3b8' }}>{r.month}</span>}</td>
                    <td className="num positive">{r.inflow.general > 0 ? fmt(r.inflow.general) : '-'}</td>
                    <td className="num positive">{r.inflow.partner > 0 ? fmt(r.inflow.partner) : '-'}</td>
                    <td className="num positive">{r.inflow.insuranceAllowance > 0 ? fmt(r.inflow.insuranceAllowance) : '-'}</td>
                    <td className="num positive">{r.inflow.settlementAllowance > 0 ? fmt(r.inflow.settlementAllowance) : '-'}</td>
                    <td className="num positive">{r.inflow.insuranceRefund > 0 ? fmt(r.inflow.insuranceRefund) : '-'}</td>
                    <td className="num negative">{r.outflow.insurance > 0 ? fmt(r.outflow.insurance) : '-'}</td>
                    <td className="num negative">{r.outflow.cost > 0 ? fmt(r.outflow.cost) : '-'}</td>
                    <td className="num" style={{ color: netCF >= 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>
                      {netCF !== 0 ? fmt(netCF) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── ⑦ 자동 요약 문장 ── */}
      <div className="card" style={{ borderColor: 'rgba(201,168,76,0.3)' }}>
        <div className="section-header">
          <FileBarChart2 size={14} /> 분석 요약
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {summaryLines.map((line, i) => (
            <div key={i} style={{
              padding: '0.75rem 1rem',
              background: '#040d21',
              borderRadius: 8,
              border: '1px solid #162a52',
              fontSize: '0.875rem',
              color: '#cbd5e1',
              lineHeight: 1.6,
            }}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
