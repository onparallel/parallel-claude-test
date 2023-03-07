import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { isDefined } from "remeda";
import { CONFIG, Config } from "../config";
import {
  EnhancedCreateOrgIntegration,
  EnhancedOrgIntegration,
  IntegrationRepository,
  IntegrationSettings,
} from "../db/repositories/IntegrationRepository";
import { ContactLocale, ContactLocaleValues } from "../db/__types";
import { Tone } from "../emails/utils/types";
import { GenericIntegration } from "./GenericIntegration";

export type SignaturitBrandingIdKey = `${Uppercase<ContactLocale>}_${Tone}_BRANDING_ID`;

export type SignaturitEnvironment = IntegrationSettings<"SIGNATURE", "SIGNATURIT">["ENVIRONMENT"];

export interface SignaturitIntegrationContext {
  isParallelManaged: boolean;
  apiKeyHint: string;
  showCsv: boolean;
  brandings: {
    locale: ContactLocale;
    tone: Tone;
    brandingId: string;
  }[];
  environment: SignaturitEnvironment;
  onUpdateBrandingId(key: SignaturitBrandingIdKey, id: string): Promise<void>;
}

@injectable()
export class SignaturitIntegration extends GenericIntegration<
  "SIGNATURE",
  "SIGNATURIT",
  SignaturitIntegrationContext
> {
  protected type = "SIGNATURE" as const;
  protected provider = "SIGNATURIT" as const;

  constructor(
    @inject(CONFIG) config: Config,
    @inject(IntegrationRepository) integrations: IntegrationRepository
  ) {
    super(config, integrations);
  }

  public async withApiKey<TResult>(
    orgIntegrationId: number,
    handler: (apiKey: string, context: SignaturitIntegrationContext) => Promise<TResult>
  ): Promise<TResult> {
    return await this.withCredentials(orgIntegrationId, async (credentials, context) => {
      return await handler(credentials.API_KEY, context);
    });
  }

  protected override getContext(
    integration: EnhancedOrgIntegration<"SIGNATURE", "SIGNATURIT", false>
  ): SignaturitIntegrationContext {
    const settings = integration.settings;
    const brandings = ContactLocaleValues.flatMap((locale) =>
      (["FORMAL", "INFORMAL"] as Tone[]).map((tone) => {
        const key =
          `${locale.toUpperCase()}_${tone}_BRANDING_ID` as Uppercase<`${ContactLocale}_${Tone}_BRANDING_ID`>;
        if (key in settings) {
          return { locale, tone, brandingId: settings[key]! };
        }
      })
    ).filter(isDefined);
    const apiKey = settings.CREDENTIALS.API_KEY;
    return {
      apiKeyHint: apiKey.slice(0, 10),
      isParallelManaged: settings.IS_PARALLEL_MANAGED,
      showCsv: settings.SHOW_CSV ?? false,
      brandings,
      environment: settings.ENVIRONMENT,
      onUpdateBrandingId: async (key, id) => {
        await this.updateOrgIntegration(integration.id, { settings: { [key]: id } });
      },
    };
  }

  public override createOrgIntegration(
    data: Omit<
      EnhancedCreateOrgIntegration<"SIGNATURE", "SIGNATURIT", false>,
      "type" | "provider" | "is_enabled"
    >,
    createdBy: string,
    t?: Knex.Transaction
  ): Promise<EnhancedOrgIntegration<"SIGNATURE", "SIGNATURIT", true>> {
    return super.createOrgIntegration(data, createdBy, t);
  }
}
