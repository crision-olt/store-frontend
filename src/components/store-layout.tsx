import { useLingui } from '@lingui/react/macro'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Boxes, FolderTree, Layers, LogOut, Percent, ShieldCheck, Store, Table, Tags, Users, Wheat } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useSessionGuard } from '@/hooks/use-session-guard'
import { Button } from '@/components/ui/button'
import { authUseCases } from '@/features/auth/auth'
import { cn } from '@/lib/utils'

export function StoreLayout({ children }: { children: ReactNode }) {
  const { t } = useLingui()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  useSessionGuard()
  const logoutMutation = useMutation({
    mutationFn: authUseCases.logout,
    onSuccess: () => {
      queryClient.clear()
      navigate('/login')
    },
  })

  const links = [
    { to: '/products', label: t`Products`, icon: Boxes },
    { to: '/categories', label: t`Categories`, icon: FolderTree },
    { to: '/allergens', label: t`Allergens`, icon: Wheat },
    { to: '/offers', label: t`Menus and promotions`, icon: Tags },
    { to: '/discounts', label: t`Discounts`, icon: Percent },
    { to: '/tables', label: t`Tables`, icon: Table },
    { to: '/zones', label: t`Zones`, icon: Layers },
    { to: '/users', label: t`Users`, icon: Users },
    { to: '/access', label: t`Roles and permissions`, icon: ShieldCheck },
  ]

  return (
    <div className="min-h-svh bg-background md:flex">
      <aside className="border-b bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:flex md:h-svh md:w-60 md:shrink-0 md:flex-col md:border-r md:border-b-0">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Store aria-hidden="true" className="size-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">{t`Store`}</span>
        </div>
        <nav aria-label={t`Store`} className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex min-h-10 shrink-0 items-center gap-3 whitespace-nowrap rounded-md px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden flex-1 md:block" />
        <div className="flex flex-wrap items-center gap-2 border-t border-sidebar-border px-3 py-3">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            className="justify-start text-muted-foreground md:w-full"
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut aria-hidden="true" className="size-4" />
            {t`Sign out`}
          </Button>
          {logoutMutation.isError && (
            <p role="alert" className="px-2 text-sm text-destructive">
              {t`Could not sign out. Please try again.`}
            </p>
          )}
        </div>
      </aside>
      <main className="min-w-0 flex-1 bg-muted/30">
        {children}
      </main>
    </div>
  )
}
