import { pMapChunk } from "../../util/promises/pMapChunk";
import { TaskRunner } from "../helpers/TaskRunner";

export class ClosePetitionsRunner extends TaskRunner<"CLOSE_PETITIONS"> {
  protected override async run() {
    try {
      const { template_id: templateId } = this.task.input;

      if (!this.task.user_id) {
        throw new Error(`Task ${this.task.id} is missing user_id`);
      }

      // only for superadmins, for now
      const permissions = await this.ctx.users.loadUserPermissions(this.task.user_id);
      if (!permissions.find((p) => p === "SUPERADMIN")) {
        throw new Error(`User ${this.task.user_id} is not a SUPERADMIN`);
      }
      const user = await this.ctx.users.loadUser(this.task.user_id);
      if (!user) {
        throw new Error(`User ${this.task.user_id} not found`);
      }
      const organization = await this.ctx.organizations.loadOrg(user.org_id);
      if (!organization || organization.status !== "ROOT") {
        throw new Error("User's organization is not ROOT");
      }

      this.ctx.logger.info(`Closing petitions for template ${templateId}...`);
      const petitionIds =
        await this.ctx.petitions.getPetitionIdsFromTemplateReadyToClose(templateId);

      const totalCount = await petitionIds.length;
      this.ctx.logger.info(`Found ${totalCount} petitions...`);

      let closedCount = 0;
      const CHUNK_SIZE = 100;
      await pMapChunk(
        petitionIds,
        async (idsChunk) => {
          this.ctx.logger.info(
            `Closing petitions ${closedCount + 1}-${Math.min(closedCount + CHUNK_SIZE, totalCount)}...`,
          );
          await this.closePetitions(idsChunk, this.task.user_id!);
          closedCount += idsChunk.length;
        },
        { chunkSize: CHUNK_SIZE, concurrency: 1 },
      );

      return {
        success: true,
      };
    } catch (error) {
      this.ctx.logger.error(error);
      return {
        success: false,
        error,
      };
    }
  }

  private async closePetitions(ids: number[], userId: number) {
    if (ids.length === 0) {
      return;
    }
    await this.ctx.petitions.closePetitions(ids, `User:${userId}`);
    await this.ctx.petitions.updateRemindersForPetitions(ids, null);
    await this.ctx.petitions.createEvent(
      ids.map((id) => ({
        petition_id: id,
        type: "PETITION_CLOSED",
        data: {
          user_id: userId,
        },
      })),
    );
  }
}
