import type { Permission } from '@/lib/access-api'

type Props = {
  permissions: Permission[]
  selected: number[]
  onChange: (ids: number[]) => void
}

export function PermissionChecklist({ permissions, selected, onChange }: Props) {
  return permissions.map((permission) => (
    <label key={permission.id} className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="size-4 accent-primary"
        checked={selected.includes(permission.id)}
        onChange={(event) => onChange(event.target.checked
          ? [...selected, permission.id]
          : selected.filter((id) => id !== permission.id))}
      />
      {permission.name}
    </label>
  ))
}
