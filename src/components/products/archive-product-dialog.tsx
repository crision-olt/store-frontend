import { Dialog } from '@base-ui/react/dialog'
import { useLingui } from '@lingui/react/macro'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Navigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { localizedName } from '@/lib/localized-name'
import { archiveProduct, ProductsApiError, type Product } from '@/lib/products-api'
import { buildLinkWithRedirect } from '@/lib/redirect'

export function ArchiveProductDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const { t, i18n } = useLingui()
  const location = useLocation()
  const queryClient = useQueryClient()
  const archive = useMutation({
    mutationFn: () => archiveProduct(product.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      onClose()
    },
  })

  if (archive.error instanceof ProductsApiError && archive.error.status === 401) {
    return <Navigate to={buildLinkWithRedirect('/login', location.pathname + location.search)} replace />
  }

  return (
    <Dialog.Root open onOpenChange={(open) => {
      if (!open && !archive.isPending) onClose()
    }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background p-6 text-foreground shadow-lg outline-none">
          <Dialog.Title className="text-lg font-semibold">{t`Archive product`}</Dialog.Title>
          <Dialog.Description className="mt-2 break-words text-sm text-muted-foreground">
            {t`Archive ${localizedName(product.name, product.nameEs, i18n.locale)}? It will be hidden from the catalog, but its data will be kept.`}
          </Dialog.Description>
          {archive.error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {archive.error instanceof ProductsApiError && archive.error.status === 404
                ? t`This product no longer exists.`
                : t`Could not archive the product. Please try again.`}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close render={<Button type="button" variant="outline" disabled={archive.isPending} />}>{t`Cancel`}</Dialog.Close>
            <Button type="button" variant="destructive" disabled={archive.isPending} aria-busy={archive.isPending}
              onClick={() => archive.mutate()}>
              {archive.isPending ? t`Archiving…` : t`Archive`}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
