import React, { useState } from 'react';
import {
  Settings, PlusCircle, Trash2, Save, RefreshCw,
  ChevronDown, ChevronUp, DollarSign, Calendar,
  Users, Shield, TrendingUp, Layers, AlertCircle
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { fmt, generateMonthRange } from '../engine/calculator';

// ── 섹션 래퍼 ───────────────────────────────────────────────
function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: 0, marginBottom: open ? '1rem' : 0,
        }}
      >
        <div className="section-header" style={{ margin: 0, border: 'none', paddingBottom: 0 }}>
          {Icon && <Icon size={14} />} {title}
        </div>
        {open ? <ChevronUp size={16} color="#475569" /> : <ChevronDown size={16} color="#475569" />}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

// ── 입력 그리드 ─────────────────────────────────────────────
function FormRow({ label, children, hint }) {
  return (
    <div style={{ marginBottom: '0.875rem' }}>
      <label className="label">{label}</label>
      {children}
      {hint && <div style={{ fontSize: '0.6875rem', color: '#475569', marginTop: '0.25rem' }}>{hint}</div>}
    </div>
  );
}

function Grid({ cols = 2, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '0.875rem' }}>
      {children}
    </div>
  );
}

// ── 숫자 입력 ───────────────────────────────────────────────
function NumInput({ value, onChange, placeholder, prefix, suffix }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
      {prefix && <span style={{ color: '#64748b', fontSize: '0.8125rem', flexShrink: 0 }}>{prefix}</span>}
      <input
        type="number"
        className="input-field"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        placeholder={placeholder}
      />
      {suffix && <span style={{ color: '#64748b', fontSize: '0.8125rem', flexShrink: 0 }}>{suffix}</span>}
    </div>
  );
}

// ── Main Input Page ─────────────────────────────────────────
export default function InputPage() {
  const {
    config, updateField, updateConfig, resetConfig,
    addPartnerInflow, updatePartnerInflow, removePartnerInflow,
    addSettlementDate, removeSettlementDate,
    updateCostItem, addCostItem, removeCostItem,
    updateParticipant, addParticipant, removeParticipant,
    updateTaxConfig, updateInsurance,
  } = useStore();

  const [newSettlementMonth, setNewSettlementMonth] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  const handleSave = () => {
    setSavedMsg('저장되었습니다 (로컬스토리지)');
    setTimeout(() => setSavedMsg(''), 2500);
  };

  const handleReset = () => {
    if (window.confirm('모든 설정을 초기값으로 되돌립니까?')) resetConfig();
  };

  // 새 파트너 유입 추가
  const [newPartner, setNewPartner] = useState({ name: '', participantId: '', month: '', amount: 0 });

  // 새 참여자 추가
  const [newPart, setNewPart] = useState({ name: '', entityType: 'individual', principal: 0, distributionRatio: 0, taxProfile: 'individual', incomeType: 'investment', priorityReturn: false });

  const quarterlyTemplate = () => {
    const months = generateMonthRange(config.startMonth, config.endMonth);
    const quarters = months.filter(m => {
      const mo = parseInt(m.split('-')[1]);
      return mo === 3 || mo === 6 || mo === 9 || mo === 12;
    });
    quarters.forEach(m => addSettlementDate(m));
  };

  const annualTemplate = () => {
    const months = generateMonthRange(config.startMonth, config.endMonth);
    const annuals = months.filter(m => m.split('-')[1] === '12');
    annuals.forEach(m => addSettlementDate(m));
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#e2e8f0', margin: 0 }}>입력 설정</h1>
          <p style={{ fontSize: '0.8125rem', color: '#475569', margin: '0.25rem 0 0' }}>
            재무전략 워크테이블 편집기 — 모든 값 실시간 반영
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {savedMsg && <span style={{ fontSize: '0.75rem', color: '#34d399' }}>{savedMsg}</span>}
          <button className="btn-ghost" onClick={handleReset}><RefreshCw size={13} /> 초기화</button>
          <button className="btn-primary" onClick={handleSave}><Save size={13} /> 저장</button>
        </div>
      </div>

      {/* ① 기본정보 */}
      <Section title="기본 정보" icon={Settings}>
        <Grid cols={3}>
          <FormRow label="시작월">
            <input type="month" className="input-field"
              value={config.startMonth}
              onChange={e => updateField('startMonth', e.target.value)} />
          </FormRow>
          <FormRow label="종료월">
            <input type="month" className="input-field"
              value={config.endMonth}
              onChange={e => updateField('endMonth', e.target.value)} />
          </FormRow>
          <FormRow label="기본 월 수익률" hint="예: 0.15 = 15%/월">
            <NumInput
              value={config.baseReturnRate}
              onChange={v => updateField('baseReturnRate', v)}
              suffix="%"
              placeholder="0.15"
            />
            <div style={{ fontSize: '0.75rem', color: '#c9a84c', marginTop: '0.25rem', fontWeight: 600 }}>
              = 월 {(config.baseReturnRate * 100).toFixed(1)}%
            </div>
          </FormRow>
        </Grid>
      </Section>

      {/* ② 일반사업 시드 */}
      <Section title="일반사업 시드" icon={DollarSign}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {config.generalSeeds.map((seed, idx) => (
            <div key={idx} style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.75rem',
              alignItems: 'flex-end', padding: '0.75rem', background: '#040d21', borderRadius: 8,
              border: '1px solid #162a52',
            }}>
              <FormRow label="시작월" hint="">
                <input type="month" className="input-field" value={seed.startMonth}
                  onChange={e => {
                    const seeds = [...config.generalSeeds];
                    seeds[idx] = { ...seeds[idx], startMonth: e.target.value };
                    updateField('generalSeeds', seeds);
                  }} />
              </FormRow>
              <FormRow label="종료월">
                <input type="month" className="input-field" value={seed.endMonth}
                  onChange={e => {
                    const seeds = [...config.generalSeeds];
                    seeds[idx] = { ...seeds[idx], endMonth: e.target.value };
                    updateField('generalSeeds', seeds);
                  }} />
              </FormRow>
              <FormRow label="월 금액(원)">
                <input type="number" className="input-field" value={seed.amount}
                  onChange={e => {
                    const seeds = [...config.generalSeeds];
                    seeds[idx] = { ...seeds[idx], amount: parseInt(e.target.value) || 0 };
                    updateField('generalSeeds', seeds);
                  }} />
              </FormRow>
              <button className="btn-danger" style={{ marginBottom: '0.875rem' }}
                onClick={() => {
                  const seeds = config.generalSeeds.filter((_, i) => i !== idx);
                  updateField('generalSeeds', seeds);
                }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button className="btn-ghost" onClick={() => {
            updateField('generalSeeds', [...config.generalSeeds, { startMonth: '2026-07', endMonth: '2026-12', amount: 0 }]);
          }}>
            <PlusCircle size={13} /> 구간 추가
          </button>
        </div>
      </Section>

      {/* ③ 투자파트너 자금 */}
      <Section title="투자파트너 자금 유입" icon={Users}>
        <div style={{ marginBottom: '0.875rem' }}>
          <table className="data-table" style={{ marginBottom: '0.75rem' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>이름</th>
                <th>유입월</th>
                <th>금액(원)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {config.partnerInflows.map(p => (
                <tr key={p.id}>
                  <td>
                    <input className="input-field" value={p.name}
                      onChange={e => updatePartnerInflow(p.id, { name: e.target.value })}
                      style={{ minWidth: 100 }} />
                  </td>
                  <td>
                    <input type="month" className="input-field" value={p.month}
                      onChange={e => updatePartnerInflow(p.id, { month: e.target.value })}
                      style={{ minWidth: 120 }} />
                  </td>
                  <td>
                    <input type="number" className="input-field" value={p.amount}
                      onChange={e => updatePartnerInflow(p.id, { amount: parseInt(e.target.value) || 0 })}
                      style={{ minWidth: 130, textAlign: 'right' }} />
                  </td>
                  <td>
                    <button className="btn-danger" onClick={() => removePartnerInflow(p.id)}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* 새 파트너 추가 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.625rem', padding: '0.75rem', background: 'rgba(201,168,76,0.04)', borderRadius: 8, border: '1px dashed rgba(201,168,76,0.2)' }}>
            <input className="input-field" placeholder="이름" value={newPartner.name}
              onChange={e => setNewPartner({ ...newPartner, name: e.target.value })} />
            <input type="month" className="input-field" value={newPartner.month}
              onChange={e => setNewPartner({ ...newPartner, month: e.target.value })} />
            <input type="number" className="input-field" placeholder="금액" value={newPartner.amount || ''}
              onChange={e => setNewPartner({ ...newPartner, amount: parseInt(e.target.value) || 0 })} />
            <button className="btn-primary" onClick={() => {
              if (!newPartner.name || !newPartner.month) return;
              addPartnerInflow(newPartner);
              setNewPartner({ name: '', participantId: '', month: '', amount: 0 });
            }}>
              <PlusCircle size={13} /> 추가
            </button>
          </div>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#475569' }}>
          총 파트너 유입: <span style={{ color: '#c9a84c', fontWeight: 700 }}>
            {fmt(config.partnerInflows.reduce((s, p) => s + p.amount, 0))}원
          </span>
        </div>
      </Section>

      {/* ④ 보험연계 설정 */}
      <Section title="보험연계 자금" icon={Shield} defaultOpen={false}>
        <Grid cols={2}>
          <FormRow label="영업 활동 기간 시작">
            <input type="month" className="input-field" value={config.insurance.salesStartMonth}
              onChange={e => updateInsurance({ salesStartMonth: e.target.value })} />
          </FormRow>
          <FormRow label="영업 활동 기간 종료">
            <input type="month" className="input-field" value={config.insurance.salesEndMonth}
              onChange={e => updateInsurance({ salesEndMonth: e.target.value })} />
          </FormRow>
          <FormRow label="수당 지급 시작">
            <input type="month" className="input-field" value={config.insurance.allowanceStartMonth}
              onChange={e => updateInsurance({ allowanceStartMonth: e.target.value })} />
          </FormRow>
          <FormRow label="수당 지급 종료">
            <input type="month" className="input-field" value={config.insurance.allowanceEndMonth}
              onChange={e => updateInsurance({ allowanceEndMonth: e.target.value })} />
          </FormRow>
          <FormRow label="영업 슬롯 수">
            <NumInput value={config.insurance.slots}
              onChange={v => updateInsurance({ slots: v })} suffix="개" />
          </FormRow>
          <FormRow label="슬롯당 월납보험료">
            <NumInput value={config.insurance.monthlyPremiumPerSlot}
              onChange={v => updateInsurance({ monthlyPremiumPerSlot: v })} suffix="원/슬롯" />
          </FormRow>
          <FormRow label="슬롯당 월 수당수익">
            <NumInput value={config.insurance.monthlyAllowancePerSlot}
              onChange={v => updateInsurance({ monthlyAllowancePerSlot: v })} suffix="원/슬롯" />
          </FormRow>
        </Grid>
        <div style={{ padding: '0.75rem', background: '#040d21', borderRadius: 8, border: '1px solid #162a52', fontSize: '0.8125rem' }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div>총 월납보험료: <span className="gold" style={{ fontWeight: 700 }}>
              {fmt(config.insurance.slots * config.insurance.monthlyPremiumPerSlot)}원/월
            </span></div>
            <div>총 월 수당수익: <span className="positive" style={{ fontWeight: 700 }}>
              {fmt(config.insurance.slots * config.insurance.monthlyAllowancePerSlot)}원/월
            </span></div>
          </div>
        </div>

        {/* 해약환급 */}
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #162a52' }}>
          <div className="section-header" style={{ fontSize: '0.75rem', marginBottom: '0.75rem' }}>
            해약환급 설정
          </div>
          <Grid cols={3}>
            <FormRow label="유지기간(월)">
              <NumInput value={config.insuranceRefund.maintenanceMonths}
                onChange={v => updateField('insuranceRefund.maintenanceMonths', v)} suffix="개월" />
            </FormRow>
            <FormRow label="환급률" hint="납입보험료 대비">
              <NumInput value={config.insuranceRefund.refundRate}
                onChange={v => updateField('insuranceRefund.refundRate', v)} suffix="%" />
            </FormRow>
            <FormRow label="환급금 즉시 재투자">
              <select className="input-field"
                value={config.insuranceRefund.reinvest ? 'true' : 'false'}
                onChange={e => updateField('insuranceRefund.reinvest', e.target.value === 'true')}>
                <option value="true">예 (즉시 재투자)</option>
                <option value="false">아니오</option>
              </select>
            </FormRow>
          </Grid>
        </div>
      </Section>

      {/* ⑤ 비용 설정 */}
      <Section title="비용 및 지출 설정" icon={TrendingUp} defaultOpen={false}>
        {config.costPhases.map(phase => (
          <div key={phase.id} style={{ marginBottom: '1.25rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              marginBottom: '0.625rem', padding: '0.5rem 0.75rem',
              background: '#040d21', borderRadius: 6, border: '1px solid #162a52',
            }}>
              <span style={{ color: '#c9a84c', fontWeight: 700, fontSize: '0.8125rem' }}>{phase.label}</span>
              <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{phase.startMonth} ~ {phase.endMonth}</span>
              <span style={{ color: '#34d399', fontSize: '0.75rem', marginLeft: 'auto' }}>
                월 총: {fmt(phase.items.reduce((s, i) => s + i.amount, 0))}원
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {phase.items.map(item => (
                <div key={item.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'center',
                }}>
                  <input className="input-field" value={item.name}
                    onChange={e => updateCostItem(phase.id, item.id, { name: e.target.value })}
                    style={{ fontSize: '0.8125rem' }} />
                  <input type="number" className="input-field" value={item.amount}
                    onChange={e => updateCostItem(phase.id, item.id, { amount: parseInt(e.target.value) || 0 })}
                    style={{ textAlign: 'right', fontSize: '0.8125rem' }} />
                  <button className="btn-danger" onClick={() => removeCostItem(phase.id, item.id)}>
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
              <button className="btn-ghost" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}
                onClick={() => addCostItem(phase.id, { name: '신규 항목', amount: 0 })}>
                <PlusCircle size={12} /> 항목 추가
              </button>
            </div>
          </div>
        ))}
      </Section>

      {/* ⑥ 결산 주기 설정 */}
      <Section title="결산 주기 설정" icon={Calendar}>
        <div style={{ marginBottom: '0.875rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', alignSelf: 'center' }}>템플릿:</span>
            <button className="btn-ghost" style={{ fontSize: '0.75rem' }} onClick={quarterlyTemplate}>분기별</button>
            <button className="btn-ghost" style={{ fontSize: '0.75rem' }} onClick={annualTemplate}>연간</button>
            <button className="btn-ghost" style={{ fontSize: '0.75rem' }} onClick={() => {
              ['2027-03', '2028-03', '2029-03'].forEach(m => addSettlementDate(m));
            }}>기본(3회)</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.875rem' }}>
            {config.settlementDates.sort().map(m => (
              <div key={m} style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.25rem 0.625rem', borderRadius: 9999,
                background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)',
              }}>
                <span style={{ fontSize: '0.8125rem', color: '#c9a84c', fontWeight: 600 }}>{m}</span>
                <button onClick={() => removeSettlementDate(m)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c9a84c', lineHeight: 1, padding: 0 }}>
                  ×
                </button>
              </div>
            ))}
            {config.settlementDates.length === 0 && (
              <span style={{ fontSize: '0.8125rem', color: '#475569' }}>결산 시점이 없습니다.</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="month" className="input-field" style={{ maxWidth: 180 }}
              value={newSettlementMonth}
              onChange={e => setNewSettlementMonth(e.target.value)} />
            <button className="btn-primary" onClick={() => {
              if (newSettlementMonth) { addSettlementDate(newSettlementMonth); setNewSettlementMonth(''); }
            }}>
              <PlusCircle size={13} /> 추가
            </button>
          </div>
        </div>
      </Section>

      {/* ⑦ 과세 설정 */}
      <Section title="과세 설정" icon={AlertCircle} defaultOpen={false}>
        <Grid cols={1}>
          <FormRow label="과세 반영 모드">
            <select className="input-field"
              value={config.taxConfig.mode}
              onChange={e => updateTaxConfig({ mode: e.target.value })}>
              <option value="none">과세 반영 안함</option>
              <option value="simple">간이 세율 적용</option>
              <option value="detailed">개인/법인 분리 적용</option>
            </select>
          </FormRow>
        </Grid>
        {config.taxConfig.mode !== 'none' && (
          <>
            <div style={{ padding: '0.75rem', background: '#040d21', borderRadius: 8, border: '1px solid #162a52', marginBottom: '0.875rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#c9a84c', fontWeight: 600, marginBottom: '0.625rem' }}>개인 과세 가정</div>
              <Grid cols={2}>
                <FormRow label="종합소득세율(가정)" hint="e.g. 0.38">
                  <NumInput value={config.taxConfig.individual.incomeTaxRate}
                    onChange={v => updateTaxConfig({ individual: { ...config.taxConfig.individual, incomeTaxRate: v } })} suffix="%" />
                </FormRow>
                <FormRow label="배당소득세율" hint="원천징수 포함">
                  <NumInput value={config.taxConfig.individual.dividendTaxRate}
                    onChange={v => updateTaxConfig({ individual: { ...config.taxConfig.individual, dividendTaxRate: v } })} suffix="%" />
                </FormRow>
              </Grid>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#94a3b8', cursor: 'pointer' }}>
                <input type="checkbox" checked={config.taxConfig.individual.localTaxIncluded}
                  onChange={e => updateTaxConfig({ individual: { ...config.taxConfig.individual, localTaxIncluded: e.target.checked } })} />
                지방소득세 포함
              </label>
            </div>
            <div style={{ padding: '0.75rem', background: '#040d21', borderRadius: 8, border: '1px solid #162a52' }}>
              <div style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 600, marginBottom: '0.625rem' }}>법인 과세 가정</div>
              <Grid cols={2}>
                <FormRow label="법인세율" hint="e.g. 0.22">
                  <NumInput value={config.taxConfig.corporate.corporateTaxRate}
                    onChange={v => updateTaxConfig({ corporate: { ...config.taxConfig.corporate, corporateTaxRate: v } })} suffix="%" />
                </FormRow>
              </Grid>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#94a3b8', cursor: 'pointer' }}>
                <input type="checkbox" checked={config.taxConfig.corporate.localTaxIncluded}
                  onChange={e => updateTaxConfig({ corporate: { ...config.taxConfig.corporate, localTaxIncluded: e.target.checked } })} />
                지방세 포함
              </label>
            </div>
          </>
        )}
      </Section>

      {/* ⑧ 참여자 프로파일 */}
      <Section title="참여자별 과세 속성" icon={Users} defaultOpen={false}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ marginBottom: '0.875rem' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>이름</th>
                <th style={{ textAlign: 'left' }}>구분</th>
                <th>투자원금</th>
                <th>분배비율</th>
                <th>소득유형</th>
                <th>원금우선회수</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {config.participantProfiles.map(p => (
                <tr key={p.id}>
                  <td>
                    <input className="input-field" value={p.name}
                      onChange={e => updateParticipant(p.id, { name: e.target.value })}
                      style={{ minWidth: 80 }} />
                  </td>
                  <td>
                    <select className="input-field" value={p.entityType}
                      onChange={e => updateParticipant(p.id, { entityType: e.target.value, taxProfile: e.target.value })}>
                      <option value="individual">개인</option>
                      <option value="corporate">법인</option>
                    </select>
                  </td>
                  <td>
                    <input type="number" className="input-field" value={p.principal}
                      onChange={e => updateParticipant(p.id, { principal: parseInt(e.target.value) || 0 })}
                      style={{ minWidth: 120, textAlign: 'right' }} />
                  </td>
                  <td>
                    <input type="number" className="input-field" value={p.distributionRatio}
                      step="0.01" min="0" max="1"
                      onChange={e => updateParticipant(p.id, { distributionRatio: parseFloat(e.target.value) || 0 })}
                      style={{ minWidth: 70 }} />
                  </td>
                  <td>
                    <select className="input-field" value={p.incomeType}
                      onChange={e => updateParticipant(p.id, { incomeType: e.target.value })}>
                      <option value="investment">투자수익형</option>
                      <option value="dividend">배당형</option>
                      <option value="salary">급여형</option>
                    </select>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" checked={p.priorityReturn}
                      onChange={e => updateParticipant(p.id, { priorityReturn: e.target.checked })} />
                  </td>
                  <td>
                    <button className="btn-danger" onClick={() => removeParticipant(p.id)}>
                      <Trash2 size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '0.5rem' }}>
          분배비율 합계: <span style={{
            color: Math.abs(config.participantProfiles.reduce((s, p) => s + p.distributionRatio, 0) - 1) < 0.01 ? '#34d399' : '#f87171',
            fontWeight: 600,
          }}>
            {(config.participantProfiles.reduce((s, p) => s + p.distributionRatio, 0) * 100).toFixed(1)}%
          </span>
          {Math.abs(config.participantProfiles.reduce((s, p) => s + p.distributionRatio, 0) - 1) >= 0.01 && (
            <span style={{ color: '#f87171', marginLeft: '0.5rem' }}> ⚠ 합계가 100%가 아닙니다</span>
          )}
        </div>
        <button className="btn-ghost" style={{ fontSize: '0.75rem' }}
          onClick={() => addParticipant({ name: '신규참여자', entityType: 'individual', principal: 0, distributionRatio: 0, taxProfile: 'individual', incomeType: 'investment', priorityReturn: false })}>
          <PlusCircle size={12} /> 참여자 추가
        </button>
      </Section>
    </div>
  );
}
