import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Settings, FileBarChart2, GitCompare,
  TrendingUp, ChevronLeft, ChevronRight, Activity
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { fmt, fmtB } from '../engine/calculator';
import { SCENARIOS } from '../models/dataModel';

const NAV_ITEMS = [
  { path: '/',           label: '대시보드',   icon: LayoutDashboard },
  { path: '/input',      label: '입력설정',   icon: Settings },
  { path: '/result',     label: '결과리포트', icon: FileBarChart2 },
  { path: '/scenario',   label: '시나리오',   icon: GitCompare },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const { kpis, activeScenario, setScenario, config } = useStore();
  const location = useLocation();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#040d21' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: collapsed ? 64 : 220,
        minHeight: '100vh',
        background: '#0a1628',
        borderRight: '1px solid #162a52',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '1.25rem 0' : '1.25rem 1.25rem',
          borderBottom: '1px solid #162a52',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: '0.5rem',
        }}>
          {!collapsed && (
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#c9a84c', letterSpacing: '0.05em' }}>
                DQUANT 9.0
              </div>
              <div style={{ fontSize: '0.625rem', color: '#475569', letterSpacing: '0.1em', marginTop: 2 }}>
                VALUENCORE GROUP
              </div>
            </div>
          )}
          {collapsed && (
            <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#c9a84c' }}>DQ</div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'transparent', border: '1px solid #162a52',
              borderRadius: 4, padding: '0.2rem', cursor: 'pointer',
              color: '#475569', display: 'flex', alignItems: 'center',
            }}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Status Badge */}
        {!collapsed && (
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #0f2040' }}>
            <div style={{ fontSize: '0.6875rem', color: '#475569', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              활성 시나리오
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
              {Object.entries(SCENARIOS).map(([key, sc]) => (
                <button
                  key={key}
                  onClick={() => setScenario(key)}
                  style={{
                    padding: '0.125rem 0.5rem',
                    borderRadius: 9999,
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: activeScenario === key ? 'rgba(201,168,76,0.15)' : 'transparent',
                    color: activeScenario === key ? sc.color : '#475569',
                    border: activeScenario === key ? `1px solid ${sc.color}` : '1px solid #162a52',
                    transition: 'all 0.15s',
                  }}
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem 0.625rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive = path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path);
            return (
              <NavLink
                key={path}
                to={path}
                className={`nav-link ${isActive ? 'active' : ''}`}
                style={collapsed ? { justifyContent: 'center', padding: '0.625rem' } : {}}
                title={collapsed ? label : undefined}
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Mini KPI Footer */}
        {!collapsed && kpis && (
          <div style={{
            padding: '0.875rem 1rem',
            borderTop: '1px solid #162a52',
            fontSize: '0.6875rem',
          }}>
            <div style={{ color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              현재 잔액
            </div>
            <div style={{ color: '#c9a84c', fontWeight: 700, fontSize: '1rem', fontVariantNumeric: 'tabular-nums' }}>
              {fmtB(kpis.currentBalance)}
            </div>
            <div style={{ color: '#34d399', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              ROI {(kpis.totalROI * 100).toFixed(1)}%
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.375rem', color: '#475569' }}>
              <Activity size={10} className="pulse-gold" />
              <span>{config.startMonth} ~ {config.endMonth}</span>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main Content ── */}
      <main style={{
        flex: 1,
        marginLeft: collapsed ? 64 : 220,
        transition: 'margin-left 0.25s',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Top bar */}
        <header style={{
          height: 52,
          background: '#0a1628',
          borderBottom: '1px solid #162a52',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1.5rem',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={14} color="#c9a84c" />
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              밸류앤코어스그룹 · 재무전략 워크테이블
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: '#475569' }}>
            {kpis && (
              <>
                <span>기간 <span style={{ color: '#94a3b8' }}>{config.startMonth} ~ {config.endMonth}</span></span>
                <span>수익률 <span style={{ color: '#34d399', fontWeight: 600 }}>{(config.baseReturnRate * 100).toFixed(0)}%/월</span></span>
                <span>원금 <span style={{ color: '#c9a84c', fontWeight: 600 }}>{fmtB(kpis.totalPrincipal)}</span></span>
              </>
            )}
          </div>
        </header>

        <div style={{ flex: 1, padding: '1.5rem', overflow: 'auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
