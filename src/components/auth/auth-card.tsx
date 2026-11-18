import type { ReactNode } from 'react'
import { LanguageSwitcher } from '@/components/language-switcher'
import { Link } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type Props = {
  title: string
  description: string
  footerText: string
  footerLink: string
  footerLabel: string
  children: ReactNode
}

export function AuthCard({
  title,
  description,
  footerText,
  footerLink,
  footerLabel,
  children,
}: Props) {
  return (
    <main className="relative flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <div className="absolute top-4 right-4 flex gap-2">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {children}
          <p className="text-center text-sm text-muted-foreground">
            {footerText}{' '}
            <Link to={footerLink} className="underline underline-offset-4">
              {footerLabel}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
