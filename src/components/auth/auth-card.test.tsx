import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { AuthCard } from './auth-card'

describe('auth card', () => {
  it('does not render a theme switcher', () => {
    i18n.activate('en')
    const markup = renderToStaticMarkup(
      <I18nProvider i18n={i18n}>
        <MemoryRouter>
          <AuthCard
            title="Sign in"
            description="Access your account"
            footerText="New here?"
            footerLink="/register"
            footerLabel="Create an account"
          >
            <button type="submit">Sign in</button>
          </AuthCard>
        </MemoryRouter>
      </I18nProvider>,
    )

    expect(markup).not.toContain('Switch to light mode')
    expect(markup).not.toContain('Switch to dark mode')
  })
})
