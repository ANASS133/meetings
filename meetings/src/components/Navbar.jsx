import './Navbar.css';
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';

// navItems array will be defined inside the component to use the `t` function



/* ── inline SVG icons ─────────────────────────────────────────── */
const Icon = ({ name, size = 18 }) => {
  const d = {
    grid: 'M3 3h7v7H3V3zm0 10h7v7H3v-7zm10-10h7v7h-7V3zm0 10h7v7h-7v-7z',
    list: 'M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z',
    'plus-circle': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z',
    calendar: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .89-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.11-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z',
    users: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    'file-text': 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm2-6h8v2H8v-2zm0-4h8v2H8v-2z',
    'chevron-down': 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z',
    'log-out': 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z',
    menu: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
    x: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z',
    shield: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z',
    archive: 'M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM6.24 5h11.52l.83 1H5.41l.83-1zM5 19V8h14v11H5zm3-5h8v-2H8v2z',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={d[name]} />
    </svg>
  );
};

/* ── component ─────────────────────────────────────────────────── */
export default function Navbar() {
  const { user, logout, isAuthenticated, isAdmin, isPhotographer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const navItems = [
    { path: '/dashboard', label: t('navbar.dashboard'), icon: 'grid' },
    { path: '/meetings', label: t('navbar.meetings'), icon: 'list' },
    { path: '/meetings/new', label: t('navbar.new_meeting'), icon: 'plus-circle' },
    { path: '/calendar', label: t('navbar.calendar'), icon: 'calendar' },
    { path: '/historique', label: t('navbar.historique'), icon: 'archive' },
  ];

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  const filteredNavItems = isPhotographer ? [] : navItems;

  const handleLogout = () => {
    setUserMenuOpen(false);
    setMobileOpen(false);
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'ar' : 'fr';
    i18n.changeLanguage(newLang);
  };

  /* click outside closes menus ───────────────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* close mobile menu on route change ─────────────────────────── */
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  /* lock body scroll when mobile menu open ────────────────────── */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  if (!isAuthenticated) return null;

  const userInitial = user?.email?.charAt(0).toUpperCase() || '?';

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-inner">
        {/* ── brand ──────────────────────────────────────────── */}
        <Link to="/dashboard" className="navbar-brand">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="2" y="3" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" fill="none" />
            <path d="M2 9h20" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="12" cy="14" r="1.5" fill="currentColor" />
            <path d="M8 19h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span>MeetingApp</span>
        </Link>

        {/* ── desktop links ──────────────────────────────────── */}
        <div className="navbar-links" role="menubar">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`navbar-link${isActive(item.path) ? ' active' : ''}`}
              role="menuitem"
            >
              <Icon name={item.icon} size={16} />
              <span>{item.label}</span>
            </Link>
          ))}


        </div>

        {/* ── right section ──────────────────────────────────── */}
        <div className="navbar-actions">
          {/* language switcher */}
          <button
            className="lang-switcher"
            onClick={toggleLanguage}
            title="Switch Language"
            style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
          >
            {i18n.language === 'fr' ? 'AR' : 'FR'}
          </button>

          {/* user dropdown trigger */}
          <div className="user-menu" ref={userMenuRef}>
            <button
              className="user-menu-trigger"
              onClick={() => setUserMenuOpen((v) => !v)}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <span className="user-avatar" aria-hidden="true">{userInitial}</span>
              <span className="user-name">{user?.email}</span>
              {isAdmin && (
                <span className="admin-chip" title={t('navbar.admin')}>
                  <Icon name="shield" size={12} />
                </span>
              )}
              <Icon name="chevron-down" size={16} />
            </button>

            {/* dropdown */}
            {userMenuOpen && (
              <div className="user-dropdown" role="menu">
                <div className="dropdown-header">
                  <span className="dropdown-avatar">{userInitial}</span>
                  <div>
                    <div className="dropdown-email">{user?.email}</div>
                    <div className="dropdown-role">{user?.role === 'ADMIN' ? t('navbar.admin') : t('navbar.user')}</div>
                  </div>
                </div>
                <div className="dropdown-divider" />
                <button
                  className="dropdown-item logout"
                  onClick={handleLogout}
                  role="menuitem"
                >
                  <Icon name="log-out" size={16} />
                  {t('navbar.sign_out')}
                </button>
              </div>
            )}
          </div>

          {/* hamburger */}
          <button
            className="hamburger"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? t('navbar.close_menu') : t('navbar.open_menu')}
          >
            <Icon name={mobileOpen ? 'x' : 'menu'} size={22} />
          </button>
        </div>
      </div>

      {/* ── mobile overlay ───────────────────────────────────── */}
      <div
        className={`mobile-overlay${mobileOpen ? ' open' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* ── mobile drawer ────────────────────────────────────── */}
      <div
        className={`mobile-menu${mobileOpen ? ' open' : ''}`}
        ref={mobileMenuRef}
        role="menu"
        aria-label="Mobile navigation"
      >
        <div className="mobile-menu-header">
          <span className="mobile-menu-title">{t('navbar.menu')}</span>
          <button
            className="mobile-menu-close"
            onClick={() => setMobileOpen(false)}
            aria-label={t('navbar.close_menu')}
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="mobile-menu-links">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-link${isActive(item.path) ? ' active' : ''}`}
              role="menuitem"
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </Link>
          ))}

        </div>

        <div className="mobile-menu-footer">
          <div className="mobile-user-info">
            <span className="mobile-avatar">{userInitial}</span>
            <div>
              <div className="mobile-email">{user?.email}</div>
              <div className="mobile-role">{user?.role === 'ADMIN' ? t('navbar.admin') : t('navbar.user')}</div>
            </div>
          </div>
          <button className="mobile-logout" onClick={handleLogout}>
            <Icon name="log-out" size={16} />
            {t('navbar.sign_out')}
          </button>
        </div>
      </div>
    </nav>
  );
}