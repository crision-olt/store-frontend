import { zodResolver } from '@hookform/resolvers/zod'
import { useLingui } from '@lingui/react/macro'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate, useLocation } from 'react-router-dom'
import { useRevalidateOnLocale } from '@/hooks/use-revalidate-on-locale'
import { AuthCard } from '@/components/auth/auth-card'
import { TextField } from '@/components/auth/text-field'
import { Button } from '@/components/ui/button'
import { FieldError, FieldGroup } from '@/components/ui/field'
import { authUseCases } from '@/features/auth/auth'
import { getRegisterSchema, type RegisterValues } from '@/lib/auth-schemas'
import { getRedirectParam, buildLinkWithRedirect } from '@/lib/redirect'

export function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { i18n, t } = useLingui()
  const redirect = getRedirectParam(location)
  const schema = getRegisterSchema(i18n)
  const registerMutation = useMutation({ mutationFn: authUseCases.registerUser })
  const { control, handleSubmit, setError, trigger, formState } = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  })

  useRevalidateOnLocale({ formState, trigger })

  const onSubmit = async (values: RegisterValues) => {
    try {
      await registerMutation.mutateAsync({
        email: values.email,
        password: values.password,
      })
      navigate(redirect || '/')
    } catch (error) {
      console.error('Registration request failed', error)
      setError('root', { type: 'server' })
    }
  }

  return (
    <AuthCard
      title={t`Create an account`}
      description={t`Enter your details to get started`}
      footerText={t`Already have an account?`}
      footerLink={buildLinkWithRedirect('/login', redirect)}
      footerLabel={t`Sign in`}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <TextField control={control} name="email" label={t`Email`} type="email" autoComplete="email" />
          <TextField control={control} name="password" label={t`Password`} type="password" autoComplete="new-password" />
          <TextField control={control} name="confirmPassword" label={t`Confirm password`} type="password" autoComplete="new-password" />
          {formState.errors.root && <FieldError>{t`Could not create the account`}</FieldError>}
          <Button type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? t`Creating account…` : t`Create account`}
          </Button>
        </FieldGroup>
      </form>
    </AuthCard>
  )
}
