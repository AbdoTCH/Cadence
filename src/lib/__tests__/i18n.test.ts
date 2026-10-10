import { describe, expect, it } from 'vitest'

import { localeFor, translate } from '../i18n'

describe('planner translations', () => {
  it('translates the main navigation in English, French, and Arabic', () => {
    expect(translate('en', 'Dashboard')).toBe('Dashboard')
    expect(translate('fr', 'Dashboard')).toBe('Tableau de bord')
    expect(translate('ar', 'Dashboard')).toBe('لوحة التحكم')
  })

  it('selects locale formatting for each supported language', () => {
    expect(localeFor('en')).toBe('en-US')
    expect(localeFor('fr')).toBe('fr-FR')
    expect(localeFor('ar')).toBe('ar')
  })
})