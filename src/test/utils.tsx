import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import type { ReactNode } from 'react'

export const AppWrapper = ({ children }: { children: ReactNode }) => {
  i18n.loadAndActivate({ locale: 'en', messages: {} })
  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}
