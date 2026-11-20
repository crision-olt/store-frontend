import { createOfferUseCases } from '@/features/offers/application/offers'
import { OffersApiAdapter } from '@/features/offers/infrastructure/offers-api-adapter'

const useCases = createOfferUseCases(new OffersApiAdapter())

export const listOffersUseCase = useCases.listOffers
export const saveOfferUseCase = useCases.saveOffer
