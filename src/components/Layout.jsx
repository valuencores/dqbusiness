import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Settings, FileBarChart2, GitCompare,
  TrendingUp, ChevronLeft, ChevronRight, Activity, BookOpen, Menu, X
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { fmt, fmtB } from '../engine/calculator';
import { SCENARIOS } from '../models/dataModel';

const NAV_ITEMS = [
  { path: '/',           label: '대시보드',   icon: LayoutDashboard },
  { path: '/strategy',   label: '사업전략',   icon: BookOpen },
  { path: '/input',      label: '입력설정',   icon: Settings },
  { path: '/result',     label: '결과리포트', icon: FileBarChart2 },
  { path: '/scenario',   label: '시나리오',   icon: GitCompare },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

function useIsTablet() {
  const [isTablet, setIsTablet] = useState(() => window.innerWidth <= 1024);
  useEffect(() => {
    const handler = () => setIsTablet(window.innerWidth <= 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isTablet;
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { kpis, activeScenario, setScenario, config } = useStore();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Auto-collapse sidebar on tablet, auto-close mobile overlay on resize to desktop
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    } else if (isTablet && !isMobile) {
      setCollapsed(true);
    }
  }, [isMobile, isTablet]);

  // Close mobile sidebar when navigating
  const handleNavClick = useCallback(() => {
    if (isMobile) setMobileOpen(false);
  }, [isMobile]);

  // Close on ESC key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    if (mobileOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, mobileOpen]);

  // On mobile: sidebar is overlay (no push). On desktop: sidebar pushes content.
  const sidebarWidth = isMobile ? 260 : (collapsed ? 64 : 220);
  const mainMargin   = isMobile ? 0 : (collapsed ? 64 : 220);
  const showSidebar  = isMobile ? mobileOpen : true;

  const SidebarContent = () => (
    <>
      {/* Logo / Header */}
      <div style={{
        padding: (!isMobile && collapsed) ? '1.25rem 0' : '1.25rem 1.25rem',
        borderBottom: '1px solid #162a52',
        display: 'flex',
        alignItems: 'center',
        justifyContent: (!isMobile && collapsed) ? 'center' : 'space-between',
        gap: '0.5rem',
        minHeight: 52,
      }}>
        {(isMobile || !collapsed) && (
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#c9a84c', letterSpacing: '0.05em' }}>
              DQUANT 9.0
            </div>
            <div style={{ fontSize: '0.625rem', color: '#475569', letterSpacing: '0.1em', marginTop: 2 }}>
              VALUENCORE GROUP
            </div>
          </div>
        )}
        {!isMobile && collapsed && (
          <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#c9a84c' }}>DQ</div>
        )}
        {/* On mobile: X button to close. On desktop: collapse toggle */}
        {isMobile ? (
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              background: 'transparent', border: '1px solid #162a52',
              borderRadius: 4, padding: '0.25rem', cursor: 'pointer',
              color: '#94a3b8', display: 'flex', alignItems: 'center',
            }}
            aria-label="메뉴 닫기"
          >
            <X size={16} />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'transparent', border: '1px solid #162a52',
              borderRadius: 4, padding: '0.2rem', cursor: 'pointer',
              color: '#475569', display: 'flex', alignItems: 'center',
            }}
            aria-label={collapsed ? '메뉴 펼치기' : '메뉴 접기'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>

      {/* Scenario Badge */}
      {(isMobile || !collapsed) && (
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

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '0.75rem 0.625rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path);
          return (
            <NavLink
              key={path}
              to={path}
              onClick={handleNavClick}
              className={`nav-link ${isActive ? 'active' : ''}`}
              style={(!isMobile && collapsed) ? { justifyContent: 'center', padding: '0.625rem' } : {}}
              title={(!isMobile && collapsed) ? label : undefined}
            >
              <Icon size={isMobile ? 18 : 16} />
              {(isMobile || !collapsed) && (
                <span style={isMobile ? { fontSize: '0.9375rem' } : {}}>{label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Mini KPI Footer */}
      {(isMobile || !collapsed) && kpis && (
        <div style={{
          padding: '0.875rem 1rem',
          borderTop: '1px solid #162a52',
          fontSize: '0.6875rem',
        }}>
          <div style={{ color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            현재 잔액
          </div>
          <div style={{ color: '#c9a84c', fontWeight: 700, fontSize: '1rem', fontVariantNumeric: 'tabular-nums' }}>
            {fmtB(kpis.currentBalance)}원
          </div>
          <div style={{ color: '#34d399', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            ROI {(kpis.totalROI * 100).toFixed(1)}%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.375rem', color: '#475569' }}>
            <Activity size={10} className="pulse-gold" />
            <span style={{ fontSize: '0.625rem' }}>{config.startMonth} ~ {config.endMonth}</span>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#040d21' }}>

      {/* ── Mobile backdrop overlay ── */}
      {isMobile && mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      {showSidebar && (
        <aside style={{
          width: sidebarWidth,
          minHeight: '100vh',
          background: '#0a1628',
          borderRight: '1px solid #162a52',
          display: 'flex',
          flexDirection: 'column',
          transition: isMobile ? 'transform 0.25s' : 'width 0.25s',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 50,
          // On mobile: slide in from left
          transform: isMobile ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          <SidebarContent />
        </aside>
      )}

      {/* On mobile when closed, still render sidebar but off-screen for animation */}
      {isMobile && !mobileOpen && (
        <aside style={{
          width: sidebarWidth,
          minHeight: '100vh',
          background: '#0a1628',
          borderRight: '1px solid #162a52',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.25s',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 50,
          transform: 'translateX(-100%)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          <SidebarContent />
        </aside>
      )}

      {/* ── Main Content ── */}
      <main style={{
        flex: 1,
        marginLeft: mainMargin,
        transition: 'margin-left 0.25s',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0, // prevent flex overflow
      }}>
        {/* Top bar */}
        <header style={{
          height: 52,
          background: '#0a1628',
          borderBottom: '1px solid #162a52',
          display: 'flex',
          alignItems: 'center',
          padding: isMobile ? '0 0.875rem' : '0 1.5rem',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          gap: '0.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            {/* Hamburger — mobile only */}
            {isMobile && (
              <button
                onClick={() => setMobileOpen(true)}
                style={{
                  background: 'transparent',
                  border: '1px solid #162a52',
                  borderRadius: 6,
                  padding: '0.3rem',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
                aria-label="메뉴 열기"
              >
                <Menu size={18} />
              </button>
            )}
            <TrendingUp size={14} color="#c9a84c" style={{ flexShrink: 0 }} />
            <span style={{
              fontSize: isMobile ? '0.6875rem' : '0.75rem',
              color: '#64748b',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {isMobile ? 'DQUANT 9.0' : '밸류앤코어스그룹 · 재무전략 워크테이블'}
            </span>
          </div>

          {/* Right-side KPI info — hidden on mobile via CSS class */}
          {kpis && (
            <div className="topbar-secondary" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              fontSize: '0.75rem',
              color: '#475569',
              flexShrink: 0,
            }}>
              <span>기간 <span style={{ color: '#94a3b8' }}>{config.startMonth} ~ {config.endMonth}</span></span>
              <span>수익률 <span style={{ color: '#34d399', fontWeight: 600 }}>{(config.baseReturnRate * 100).toFixed(0)}%/월</span></span>
              <span>원금 <span style={{ color: '#c9a84c', fontWeight: 600 }}>{fmtB(kpis.totalPrincipal)}원</span></span>
            </div>
          )}

          {/* Mobile: compact ROI badge */}
          {isMobile && kpis && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.6875rem',
              flexShrink: 0,
            }}>
              <span style={{ color: '#34d399', fontWeight: 700 }}>
                ROI {(kpis.totalROI * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </header>

        {/* Page content */}
        <div
          className="main-content-pad"
          style={{ flex: 1, padding: isMobile ? '0.875rem' : '1.5rem', overflow: 'auto' }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
