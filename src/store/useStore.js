// ============================================================
// ZUSTAND STORE — Dquant9.0
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_CONFIG, SCENARIOS } from '../models/dataModel';
import {
  calculateWorkTable,
  calculateSettlementSummary,
  calculateParticipantResults,
  calculateKPIs,
  applyScenarioOverrides,
} from '../engine/calculator';

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function runCalc(config) {
  const rows = calculateWorkTable(config);
  const settlements = calculateSettlementSummary(rows, config);
  const participants = calculateParticipantResults(rows, config);
  const kpis = calculateKPIs(rows);
  return { rows, settlements, participants, kpis };
}

export const useStore = create(
  persist(
    (set, get) => ({
      // ── Config ──────────────────────────────────────────────
      config: deepClone(DEFAULT_CONFIG),
      activeScenario: 'base',

      // ── Computed (재계산 결과) ────────────────────────────────
      ...runCalc(deepClone(DEFAULT_CONFIG)),

      // ── Actions ─────────────────────────────────────────────

      /** config 전체 교체 */
      setConfig: (newConfig) => {
        const calc = runCalc(newConfig);
        set({ config: newConfig, ...calc });
      },

      /** config 부분 업데이트 */
      updateConfig: (partial) => {
        const prev = get().config;
        const next = { ...prev, ...partial };
        const calc = runCalc(next);
        set({ config: next, ...calc });
      },

      /** 필드 단위 업데이트 */
      updateField: (path, value) => {
        const config = deepClone(get().config);
        const keys = path.split('.');
        let obj = config;
        for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
        obj[keys[keys.length - 1]] = value;
        const calc = runCalc(config);
        set({ config, ...calc });
      },

      /** 시나리오 변경 */
      setScenario: (scenarioId) => {
        const scenario = SCENARIOS[scenarioId];
        if (!scenario) return;
        const base = deepClone(DEFAULT_CONFIG);
        // 현재 config 기반으로 오버라이드
        const merged = applyScenarioOverrides(get().config, scenario.overrides);
        const calc = runCalc(merged);
        set({ activeScenario: scenarioId, ...calc });
      },

      /** 초기화 */
      resetConfig: () => {
        const config = deepClone(DEFAULT_CONFIG);
        const calc = runCalc(config);
        set({ config, activeScenario: 'base', ...calc });
      },

      // ── Partner Inflows CRUD ─────────────────────────────────
      addPartnerInflow: (item) => {
        const config = deepClone(get().config);
        config.partnerInflows.push({ ...item, id: `p_${Date.now()}` });
        const calc = runCalc(config);
        set({ config, ...calc });
      },
      updatePartnerInflow: (id, updates) => {
        const config = deepClone(get().config);
        const idx = config.partnerInflows.findIndex(p => p.id === id);
        if (idx !== -1) config.partnerInflows[idx] = { ...config.partnerInflows[idx], ...updates };
        const calc = runCalc(config);
        set({ config, ...calc });
      },
      removePartnerInflow: (id) => {
        const config = deepClone(get().config);
        config.partnerInflows = config.partnerInflows.filter(p => p.id !== id);
        const calc = runCalc(config);
        set({ config, ...calc });
      },

      // ── General Seeds CRUD ────────────────────────────────────
      updateGeneralSeed: (idx, updates) => {
        const config = deepClone(get().config);
        config.generalSeeds[idx] = { ...config.generalSeeds[idx], ...updates };
        const calc = runCalc(config);
        set({ config, ...calc });
      },

      // ── Settlement Dates CRUD ────────────────────────────────
      addSettlementDate: (month) => {
        const config = deepClone(get().config);
        if (!config.settlementDates.includes(month)) {
          config.settlementDates = [...config.settlementDates, month].sort();
        }
        const calc = runCalc(config);
        set({ config, ...calc });
      },
      removeSettlementDate: (month) => {
        const config = deepClone(get().config);
        config.settlementDates = config.settlementDates.filter(d => d !== month);
        const calc = runCalc(config);
        set({ config, ...calc });
      },

      // ── Cost Phase CRUD ──────────────────────────────────────
      updateCostItem: (phaseId, itemId, updates) => {
        const config = deepClone(get().config);
        const phase = config.costPhases.find(p => p.id === phaseId);
        if (phase) {
          const item = phase.items.find(i => i.id === itemId);
          if (item) Object.assign(item, updates);
        }
        const calc = runCalc(config);
        set({ config, ...calc });
      },
      addCostItem: (phaseId, item) => {
        const config = deepClone(get().config);
        const phase = config.costPhases.find(p => p.id === phaseId);
        if (phase) phase.items.push({ ...item, id: `ci_${Date.now()}` });
        const calc = runCalc(config);
        set({ config, ...calc });
      },
      removeCostItem: (phaseId, itemId) => {
        const config = deepClone(get().config);
        const phase = config.costPhases.find(p => p.id === phaseId);
        if (phase) phase.items = phase.items.filter(i => i.id !== itemId);
        const calc = runCalc(config);
        set({ config, ...calc });
      },

      // ── Participant Profiles CRUD ────────────────────────────
      updateParticipant: (id, updates) => {
        const config = deepClone(get().config);
        const idx = config.participantProfiles.findIndex(p => p.id === id);
        if (idx !== -1) config.participantProfiles[idx] = { ...config.participantProfiles[idx], ...updates };
        const calc = runCalc(config);
        set({ config, ...calc });
      },
      addParticipant: (profile) => {
        const config = deepClone(get().config);
        config.participantProfiles.push({ ...profile, id: `part_${Date.now()}` });
        const calc = runCalc(config);
        set({ config, ...calc });
      },
      removeParticipant: (id) => {
        const config = deepClone(get().config);
        config.participantProfiles = config.participantProfiles.filter(p => p.id !== id);
        const calc = runCalc(config);
        set({ config, ...calc });
      },

      // ── Tax Config ───────────────────────────────────────────
      updateTaxConfig: (updates) => {
        const config = deepClone(get().config);
        config.taxConfig = { ...config.taxConfig, ...updates };
        const calc = runCalc(config);
        set({ config, ...calc });
      },

      // ── Insurance Config ─────────────────────────────────────
      updateInsurance: (updates) => {
        const config = deepClone(get().config);
        config.insurance = { ...config.insurance, ...updates };
        const calc = runCalc(config);
        set({ config, ...calc });
      },

      // ── Multi-scenario comparison ────────────────────────────
      getScenarioResults: () => {
        const config = get().config;
        const results = {};
        Object.entries(SCENARIOS).forEach(([key, scenario]) => {
          const merged = applyScenarioOverrides(config, scenario.overrides);
          results[key] = runCalc(merged);
        });
        return results;
      },
    }),
    {
      name: 'dquant-storage',
      version: 2, // bump → localStorage 캐시 무효화 (김현수 90M 반영)
      migrate: (_state, _version) => {
        // 버전 불일치 시 DEFAULT_CONFIG 로 완전 초기화
        const config = deepClone(DEFAULT_CONFIG);
        return { config, activeScenario: 'base' };
      },
      partialize: (state) => ({ config: state.config, activeScenario: state.activeScenario }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const calc = runCalc(state.config);
          Object.assign(state, calc);
        }
      },
    }
  )
);
