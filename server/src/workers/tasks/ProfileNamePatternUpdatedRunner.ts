import stringify from "fast-safe-stringify";
import { pick } from "remeda";
import { TaskRunner } from "../helpers/TaskRunner";

export class ProfileNamePatternUpdatedRunner extends TaskRunner<"PROFILE_NAME_PATTERN_UPDATED"> {
  async run() {
    try {
      const { profile_type_id: profileTypeId } = this.task.input;

      const profileType = await this.ctx.profiles.loadProfileType(profileTypeId);

      if (!profileType) {
        throw new Error(`ProfileType:${profileTypeId} not found`);
      }

      if (!this.task.user_id) {
        throw new Error(`Task ${this.task.id} is missing user_id`);
      }

      await this.ctx.profiles.updateProfileNamesByProfileTypePattern(
        profileType.id,
        profileType.profile_name_pattern,
        `User:${this.task.user_id}`,
      );

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? pick(error, ["message", "stack"]) : stringify(error),
      };
    }
  }
}
