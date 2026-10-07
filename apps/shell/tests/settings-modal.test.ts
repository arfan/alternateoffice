// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { SettingsModal } from '../src/renderer/src/SettingsModal'
import { LocaleProvider } from '../src/renderer/src/locale'

const host = document.createElement('div')
document.body.append(host)
const root = createRoot(host)
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
afterEach(async () => {
  await act(async () => root.render(null))
})

it('shows General controls, switches to About, and updates the save directory', async () => {
  Object.assign(window, {
    aiOffice: {
      getTheme: async () => 'light',
      getDocumentTheme: async () => 'follow',
      getDefaultSaveDir: async () => 'C:/Documents',
      getAppVersion: async () => '0.11.0',
      pickDefaultSaveDir: vi.fn(async () => 'C:/Office'),
    },
  })
  await act(async () =>
    root.render(
      createElement(LocaleProvider, {
        initial: 'en',
        children: createElement(SettingsModal, { onClose: vi.fn() }),
      }),
    ),
  )
  const pane = () => host.querySelector('.set-pane')!
  expect(host.querySelector('.set-overlay .set-dialog')).not.toBeNull()
  expect(pane().textContent).toContain('Language')
  expect(pane().textContent).toContain('C:/Documents')
  await act(async () => (pane().querySelector('.set-btn') as HTMLButtonElement).click())
  expect(pane().textContent).toContain('C:/Office')
  const tabs = host.querySelectorAll<HTMLButtonElement>('.set-nav-item')
  await act(async () => tabs[1].click())
  expect(pane().textContent).toContain('AlternateOffice')
  expect(pane().textContent).toContain('0.11.0')
  await act(async () => tabs[0].click())
  expect(pane().textContent).toContain('Language')
})
