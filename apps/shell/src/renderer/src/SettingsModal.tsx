import { useEffect, useState } from 'react'
import { Dropdown } from '@alternateoffice/ui'
import type { DocTheme, UiTheme } from '../../shared/home-api'
import { useI18n, type StringKey } from './locale'
import './settings.css'

export type SectionId = 'general' | 'about'
export type SettingsTarget = { section: SectionId }

const SECTIONS: readonly { id: SectionId; labelKey: StringKey }[] = [
  { id: 'general', labelKey: 'setSecGeneral' },
  { id: 'about', labelKey: 'setSecAbout' },
]

export interface SettingsModalProps {
  [key: string]: unknown
  onClose: () => void
  target?: SettingsTarget | null
}

export function SettingsModal({ onClose, target }: SettingsModalProps) {
  const { t, lang, setLang } = useI18n()
  const [section, setSection] = useState<SectionId>(target?.section ?? 'general')
  const [theme, setTheme] = useState<UiTheme>('system')
  const [docTheme, setDocTheme] = useState<DocTheme>('follow')
  const [saveDir, setSaveDir] = useState('')
  const [appVersion, setAppVersion] = useState('')

  useEffect(() => {
    void window.aiOffice.getTheme().then(setTheme)
    void window.aiOffice.getDocumentTheme().then(setDocTheme)
    void window.aiOffice.getDefaultSaveDir().then(setSaveDir)
    void window.aiOffice.getAppVersion().then((version) => setAppVersion(version ?? ''))
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="set-overlay" role="presentation" onMouseDown={onClose}>
      <div
        className="set-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={t('settings')}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="set-header">
          <h2 className="set-title">{t('settings')}</h2>
          <button className="set-close" aria-label={t('cancel')} onClick={onClose}>
            ×
          </button>
        </header>
        <div className="set-body">
          <nav className="set-nav" aria-label={t('settings')}>
            {SECTIONS.map((item) => (
              <button
                key={item.id}
                className={`set-nav-item${section === item.id ? ' active' : ''}`}
                onClick={() => setSection(item.id)}
              >
                {t(item.labelKey)}
              </button>
            ))}
          </nav>
          <div className="set-pane">
            {section === 'general' ? (
              <>
                <h3 className="set-pane-title">{t('setSecGeneral')}</h3>
                <div className="set-field">
                  <label className="set-field-label">{t('language')}</label>
                  <Dropdown
                    className="set-dd"
                    value={lang}
                    ariaLabel={t('language')}
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'id', label: 'Bahasa Indonesia' },
                      { value: 'zh', label: '简体中文' },
                    ]}
                    onPick={(value) => setLang(value as typeof lang)}
                  />
                </div>
                <div className="set-field">
                  <label className="set-field-label">{t('theme')}</label>
                  <Dropdown
                    className="set-dd"
                    value={theme}
                    ariaLabel={t('theme')}
                    options={[
                      { value: 'system', label: t('themeSystem') },
                      { value: 'light', label: t('themeLight') },
                      { value: 'dark', label: t('themeDark') },
                    ]}
                    onPick={(value) => {
                      const next = value as UiTheme
                      setTheme(next)
                      void window.aiOffice.setTheme(next)
                    }}
                  />
                </div>
                <div className="set-field">
                  <label className="set-field-label">{t('documentTheme')}</label>
                  <Dropdown
                    className="set-dd"
                    value={docTheme}
                    ariaLabel={t('documentTheme')}
                    options={[
                      { value: 'follow', label: t('docThemeFollowApp') },
                      { value: 'light', label: t('themeLight') },
                      { value: 'dark', label: t('themeDark') },
                    ]}
                    onPick={(value) => {
                      const next = value as DocTheme
                      setDocTheme(next)
                      void window.aiOffice.setDocumentTheme(next)
                    }}
                  />
                </div>
                <div className="set-field">
                  <div className="set-field-text">
                    <div className="set-field-label">{t('pickSaveDir')}</div>
                    <div className="set-field-desc">{saveDir || '—'}</div>
                  </div>
                  <button
                    className="set-btn"
                    onClick={() =>
                      void window.aiOffice
                        .pickDefaultSaveDir()
                        .then((dir) => dir && setSaveDir(dir))
                    }
                  >
                    {t('pickSaveDir')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="set-pane-title">{t('setSecAbout')}</h3>
                <p className="set-field-desc">AlternateOffice</p>
                {appVersion && (
                  <p className="set-field-desc">
                    {t('versionLabel')}: {appVersion}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
