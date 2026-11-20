import type { Offer, OfferInput } from '@/features/offers/domain/offer'

export interface OfferRepository {
  listOffers(signal: AbortSignal): Promise<Offer[]>
  saveOffer(input: OfferInput, id?: number): Promise<Offer>
}
