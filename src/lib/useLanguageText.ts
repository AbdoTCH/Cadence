import { translate } from './i18n'
import { useUIStore } from '../stores/uiStore'

export function useLanguageText() {
  const language = useUIStore((state) => state.language)
  return {
    language,
    t: (key: Parameters<typeof translate>[1]) => translate(language, key),
  }
}