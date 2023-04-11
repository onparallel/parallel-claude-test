import { inject, injectable } from "inversify";
import { ProfileRepository } from "../db/repositories/ProfileRepository";
import { ProfileType } from "../db/__types";
import { LocalizableUserText } from "../graphql";
import { I18N_SERVICE, II18nService } from "./I18nService";

export const PROFILES_SETUP_SERVICE = Symbol.for("PROFILES_SETUP_SERVICE");
export interface IProfilesSetupService {
  createDefaultProfileType(
    orgId: number,
    userId: number,
    name: LocalizableUserText
  ): Promise<ProfileType>;
}

@injectable()
export class ProfilesSetupService implements IProfilesSetupService {
  constructor(
    @inject(I18N_SERVICE) private intl: II18nService,
    private profiles: ProfileRepository
  ) {}

  async createDefaultProfileType(orgId: number, userId: number, name: LocalizableUserText) {
    const fieldName = await this.intl.getLocalizableUserText({
      id: "profiles.default-field-name",
      defaultMessage: "Name",
    });
    return await this.profiles.withTransaction(async (t) => {
      const profileType = await this.profiles.createProfileType(
        { name, org_id: orgId },
        `User:${userId}`,
        t
      );
      const field = await this.profiles.createProfileTypeField(
        profileType.id,
        {
          type: "SHORT_TEXT",
          name: fieldName,
        },
        `User:${userId}`,
        t
      );
      await this.profiles.updateProfileTypeProfileNamePattern(
        profileType.id,
        [field.id],
        `User:${userId}`,
        t
      );
      return profileType;
    });
  }
}
