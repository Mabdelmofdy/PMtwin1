import type { Recommendation } from '../types/recommendation.ts'

export type RecommendationServiceInput = Readonly<Record<string, unknown>>

export interface RecommendationService {
  forProfile(
    entityId: string,
    input: RecommendationServiceInput,
  ): readonly Recommendation[]

  forVetting(
    entityId: string,
    input: RecommendationServiceInput,
  ): readonly Recommendation[]

  forOpportunity(
    entityId: string,
    input: RecommendationServiceInput,
  ): readonly Recommendation[]

  forMatching(
    entityId: string,
    input: RecommendationServiceInput,
  ): readonly Recommendation[]

  forNegotiation(
    entityId: string,
    input: RecommendationServiceInput,
  ): readonly Recommendation[]

  forAgreement(
    entityId: string,
    input: RecommendationServiceInput,
  ): readonly Recommendation[]

  forContract(
    entityId: string,
    input: RecommendationServiceInput,
  ): readonly Recommendation[]
}
