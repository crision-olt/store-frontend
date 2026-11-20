export type OfferKind = 'menu' | 'promotion'

export type Offer = {
  id: number
  name: string
  nameEs: string | null
  kind: OfferKind
  amount: number
  productIds: number[]
  minimumDistinctProducts?: number
}

export type OfferInput = Omit<Offer, 'id' | 'nameEs'> & { nameEs: string }
