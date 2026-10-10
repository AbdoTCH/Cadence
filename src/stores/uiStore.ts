import { create } from 'zustand'

export type UITheme = 'light' | 'dark' | 'system'
export type UILanguage = 'en' | 'fr' | 'ar'

export type UIState = {
  theme: UITheme
  language: UILanguage
  resolvedTheme: 'light' | 'dark'
  sidebarCollapsed: boolean
  mobileNavOpen: boolean
  contextPanelOpen: boolean
  commandPaletteOpen: boolean
  modalStack: string[]
  openModal: (id: string) => void
  closeModal: (id?: string) => void
  closeAllModals: () => void
  setTheme: (t: UITheme) => void
  setLanguage: (language: UILanguage) => void
  toggleSidebar: () => void
  toggleContextPanel: () => void
}

const getInitialTheme = (): UITheme => {
  const saved = localStorage.getItem('just-theme')
  return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system'
}

const getInitialLanguage = (): UILanguage => {
  const saved = localStorage.getItem('cadence-language')
  return saved === 'fr' || saved === 'ar' || saved === 'en' ? saved : 'en'
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useUIStore = create<UIState>((set) => ({
  theme: getInitialTheme(),
  language: getInitialLanguage(),
  resolvedTheme: getSystemTheme(),
  sidebarCollapsed: false,
  mobileNavOpen: false,
  contextPanelOpen: true,
  commandPaletteOpen: false,
  modalStack: [],
  openModal: (id) => set((state) => ({ modalStack: [...state.modalStack, id] })),
  closeModal: (id) =>
    set((state) => ({
      modalStack: id ? state.modalStack.filter((item) => item !== id) : state.modalStack.slice(0, -1),
    })),
  closeAllModals: () => set({ modalStack: [] }),
  setTheme: (theme) => {
    localStorage.setItem('just-theme', theme)
    set({ theme, resolvedTheme: theme === 'system' ? getSystemTheme() : theme })
  },
  setLanguage: (language) => {
    localStorage.setItem('cadence-language', language)
    set({ language })
  },
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleContextPanel: () => set((state) => ({ contextPanelOpen: !state.contextPanelOpen })),
}))

export function applyTheme(theme: UITheme): 'light' | 'dark' {
  const resolved = theme === 'system' ? getSystemTheme() : theme
  document.documentElement.dataset.theme = resolved
  return resolved
}

export function applyLanguage(language: UILanguage): void {
  document.documentElement.lang = language
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
}

export function initializeTheme(): void {
  const theme = getInitialTheme()
  const resolvedTheme = applyTheme(theme)
  useUIStore.setState({ theme, resolvedTheme })

  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const listener = () => {
    const nextTheme = useUIStore.getState().theme
    if (nextTheme === 'system') {
      useUIStore.setState({ resolvedTheme: getSystemTheme() })
      document.documentElement.dataset.theme = getSystemTheme()
    }
  }

  media.addEventListener('change', listener)
}
