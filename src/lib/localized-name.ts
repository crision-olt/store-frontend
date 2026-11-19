export function localizedName(name: string, nameEs: string | null | undefined, locale: string) {
  return locale === 'es' && nameEs ? nameEs : name
}
