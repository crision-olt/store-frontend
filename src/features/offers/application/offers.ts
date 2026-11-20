import type { OfferInput } from '@/features/offers/domain/offer'
import type { OfferRepository } from '@/features/offers/domain/offer-repository'

export function createOfferUseCases(repository: OfferRepository) {
  return {
    listOffers: (signal: AbortSignal) => repository.listOffers(signal),
    saveOffer: (input: OfferInput, id?: number) => repository.saveOffer(input, id),
  }
}
