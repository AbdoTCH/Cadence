import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, MoonStar, SunMedium } from 'lucide-react'
import { BrowserRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom'

import { ensureSeedData } from './db/seed'
import { useLanguageText } from './lib/useLanguageText'
import { navItems, routes } from './routes'
import { applyLanguage, applyTheme, initializeTheme, useUIStore } from './stores/uiStore'

function App() {
  const theme = useUIStore((state) => state.theme)
  const language = useUIStore((state) => state.language)
  const resolvedTheme = useUIStore((state) => state.resolvedTheme)

  useEffect(() => {
    initializeTheme()
    void ensureSeedData()
  }, [])

  useEffect(() => {
    applyLanguage(language)
  }, [language])

  useEffect(() => {
    applyTheme(theme)
    useUIStore.setState({ resolvedTheme: theme === 'system' ? resolvedTheme : theme })
  }, [theme, resolvedTheme])

  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

function AppShell() {
  const { language, t } = useLanguageText()
  const location = useLocation()
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed)
  const theme = useUIStore((state) => state.theme)
  const resolvedTheme = useUIStore((state) => state.resolvedTheme)
  const activeItem = navItems.find(({ to }) =>
    location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(`${to}/`)),
  )
  const pageTitle = activeItem ? t(activeItem.label) : 'Cadence'
  const expandIcon = language === 'ar' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />
  const collapseIcon = language === 'ar' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />

  useEffect(() => {
    document.title = `${pageTitle} | Cadence`
  }, [pageTitle])

  const cycleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    useUIStore.getState().setTheme(nextTheme)
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="brand-row">
          {sidebarCollapsed ? <span className="brand-mark" aria-label="Cadence">C</span> : <span className="brand-name">Cadence</span>}
        </div>
        <nav className="nav-list" aria-label={t('Primary navigation')}>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} aria-label={sidebarCollapsed ? t(label) : undefined} title={sidebarCollapsed ? t(label) : undefined} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              {!sidebarCollapsed && <span>{t(label)}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button type="button" className="ghost-button sidebar-toggle" aria-label={sidebarCollapsed ? t('Expand') : t('Collapse')} title={sidebarCollapsed ? t('Expand') : t('Collapse')} onClick={() => useUIStore.getState().toggleSidebar()}>
            {sidebarCollapsed ? expandIcon : collapseIcon}
            {!sidebarCollapsed && <span>{t('Collapse')}</span>}
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="topbar-title">{pageTitle}</div>
          <div className="topbar-spacer" />
          <button type="button" className="icon-button" aria-label={t('Toggle theme')} onClick={cycleTheme}>
            {resolvedTheme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
          </button>
        </header>

        <main className="main-content">
          <Routes>
            {routes.map((route) => (
              <Route key={route.path ?? 'default'} path={route.path} element={route.element} />
            ))}
          </Routes>
        </main>
        <nav className="mobile-nav" aria-label={t('Primary navigation')}>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} aria-hidden="true" />
              <span>{t(label)}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default App
