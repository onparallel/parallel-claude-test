import { inject, injectable } from "inversify";
import { isDefined } from "remeda";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { Petition } from "../db/__types";
import { Maybe } from "../util/types";

export const ORGANIZATION_CREDITS_SERVICE = Symbol.for("ORGANIZATION_CREDITS_SERVICE");

export interface IOrganizationCreditsService {
  consumePetitionSendCredits(
    petitionId: Maybe<number>,
    orgId: number,
    amount: number,
    updatedBy: string
  ): Promise<void>;
}

@injectable()
export class OrganizationCreditsService implements IOrganizationCreditsService {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(OrganizationRepository) private organizations: OrganizationRepository
  ) {}

  async consumePetitionSendCredits(
    petitionId: Maybe<number>,
    orgId: number,
    amount: number,
    updatedBy: string
  ) {
    let petition: Maybe<Petition> = null;
    if (isDefined(petitionId)) {
      petition = await this.petitions.loadPetition(petitionId);
      if (!petition) {
        throw new Error(`Petition:${petitionId} not found`);
      }
    }

    try {
      const consumed = await this.organizations.updateOrganizationCurrentUsageLimitCredits(
        orgId,
        "PETITION_SEND",
        amount - (petition?.credits_used ?? 0)
      );
      if (consumed > 0 && petition) {
        await this.petitions.updatePetition(petition.id, { credits_used: 1 }, updatedBy);
      }
    } catch (error: any) {
      if (error.constraint === "organization_usage_limit__used__limit__check") {
        throw new Error("PETITION_SEND_LIMIT_REACHED");
      }
      throw error;
    }
  }
}
