import { listOffers, saveOffer } from '@/lib/offers-api'
import type { OfferRepository } from '@/features/offers/domain/offer-repository'

export class OffersApiAdapter implements OfferRepository {
  listOffers = listOffers
  saveOffer = saveOffer
}
