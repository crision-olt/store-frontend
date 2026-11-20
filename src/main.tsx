import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { activateLocale, detectLocale } from './i18n'
import { SessionQueryProvider } from './providers/session-query-provider'

await activateLocale(detectLocale())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider i18n={i18n}>
      <BrowserRouter>
        <SessionQueryProvider>
          <App />
        </SessionQueryProvider>
      </BrowserRouter>
    </I18nProvider>
  </StrictMode>,
)
