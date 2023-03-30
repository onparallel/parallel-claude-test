import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { PetitionRepository } from "../db/repositories/PetitionRepository";

export const ORGANIZATION_CREDITS_SERVICE = Symbol.for("ORGANIZATION_CREDITS_SERVICE");

export interface IOrganizationCreditsService {
  consumePetitionSendCredits(orgId: number, amount: number, t?: Knex.Transaction): Promise<void>;
  consumeSignaturitApiKeyCredits(orgId: number, amount: number): Promise<void>;
  ensurePetitionHasConsumedCredit(petitionId: number, updatedBy: string): Promise<void>;
}

@injectable()
export class OrganizationCreditsService implements IOrganizationCreditsService {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(OrganizationRepository) private organizations: OrganizationRepository
  ) {}

  async consumePetitionSendCredits(orgId: number, amount: number, t?: Knex.Transaction) {
    if (amount <= 0) {
      return;
    }
    try {
      await this.organizations.updateOrganizationCurrentUsageLimitCredits(
        orgId,
        "PETITION_SEND",
        amount,
        t
      );
    } catch (error: any) {
      if (
        error.message === "ORGANIZATION_USAGE_LIMIT_EXPIRED" ||
        error.constraint === "organization_usage_limit__used__limit__check"
      ) {
        throw new Error("PETITION_SEND_LIMIT_REACHED");
      }
      throw error;
    }
  }

  async consumeSignaturitApiKeyCredits(orgId: number, amount: number) {
    try {
      await this.organizations.updateOrganizationCurrentUsageLimitCredits(
        orgId,
        "SIGNATURIT_SHARED_APIKEY",
        amount
      );
    } catch (error: any) {
      if (
        error.message === "ORGANIZATION_USAGE_LIMIT_EXPIRED" ||
        error.constraint === "organization_usage_limit__used__limit__check"
      ) {
        throw new Error("INSUFFICIENT_SIGNATURE_CREDITS");
      }
      throw error;
    }
  }

  async ensurePetitionHasConsumedCredit(petitionId: number, updatedBy: string) {
    await this.petitions.withTransaction(async (t) => {
      const petition = await this.petitions.loadPetition.raw(petitionId, t);
      if (petition!.credits_used === 0) {
        await this.consumePetitionSendCredits(petition!.org_id, 1, t);
        await this.petitions.updatePetition(petitionId, { credits_used: 1 }, updatedBy, t);
      }
    });
  }
}
