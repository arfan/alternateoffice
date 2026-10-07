import { createRoot } from 'react-dom/client'
import { htmlDir, htmlLang, type Lang } from '@alternateoffice/i18n'
import App from './App'
import { LocaleProvider } from './i18n/locale'
import type { DocTheme, UiTheme } from '../shared/ipc'
import '@alternateoffice/ui/tokens.css'
import '@alternateoffice/ui/screentip.css'
import '@alternateoffice/ui/dropdown.css'
import '@alternateoffice/ui/find-panel.css'
import '@alternateoffice/ui/ribbon-collapse.css'
import '@alternateoffice/ui/markdown.css'
import '@alternateoffice/ui/ai-scope-quote.css'
import '@alternateoffice/ui/image-viewer.css'
import 'katex/dist/katex.min.css'
import './styles.css'
import { installScreenTips } from '@alternateoffice/ui'

installScreenTips()

function applyTheme(theme: UiTheme): void {
  if (theme === 'system') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', theme)
}

function applyDocumentTheme(theme: DocTheme): void {
  // data-doc-theme drives the preview paper (#1811); absent means 'follow' the UI theme
  if (theme === 'follow') document.documentElement.removeAttribute('data-doc-theme')
  else document.documentElement.setAttribute('data-doc-theme', theme)
}

void (async () => {
  const [lang, theme, docTheme] = await Promise.all([
    window.markdownApi.getLanguage().catch(() => 'zh' as const),
    window.markdownApi.getTheme().catch(() => 'system' as const),
    window.markdownApi.getDocumentTheme?.().catch(() => 'follow' as const),
  ])
  document.documentElement.lang = htmlLang(lang as Lang)
  document.documentElement.dir = htmlDir(lang)
  applyTheme(theme)
  applyDocumentTheme(docTheme ?? 'follow')
  window.markdownApi.onThemeChanged(applyTheme)
  window.markdownApi.onDocumentThemeChanged?.(applyDocumentTheme)
  createRoot(document.getElementById('root')!).render(
    <LocaleProvider initial={lang}>
      <App />
    </LocaleProvider>,
  )
})()
