import { useLingui } from '@lingui/react/macro'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Permission } from '@/features/access/domain/access'

type Props = {
  permissions: Permission[]
  selected: number[]
  onChange: (ids: number[]) => void
}

export function PermissionMultiSelect({ permissions, selected, onChange }: Props) {
  const { t } = useLingui()
  const chosen = permissions.filter((permission) => selected.includes(permission.id))

  return (
    <Select
      multiple
      value={selected.map(String)}
      onValueChange={(values) => onChange(values.map(Number))}
    >
      <SelectTrigger aria-label={t`Permissions`} className="w-full data-[size=default]:h-auto data-[size=default]:min-h-8">
        <SelectValue>
          {chosen.length === 0
            ? <span className="text-muted-foreground">{t`Select permissions`}</span>
            : <span className="flex flex-wrap gap-1">
                {chosen.map((permission) => <Badge key={permission.id} variant="secondary">{permission.name}</Badge>)}
              </span>}
        </SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {permissions.map((permission) => (
          <SelectItem key={permission.id} value={String(permission.id)}>{permission.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
