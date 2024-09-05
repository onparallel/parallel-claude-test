import { inject, injectable } from "inversify";
import { isNonNullish } from "remeda";
import { ContactLocale, ContactLocaleValues } from "../../db/__types";
import {
  EnhancedOrgIntegration,
  IntegrationRepository,
  IntegrationSettings,
} from "../../db/repositories/IntegrationRepository";
import { Tone } from "../../emails/utils/types";
import { ENCRYPTION_SERVICE, EncryptionService } from "../../services/EncryptionService";
import { FETCH_SERVICE, IFetchService } from "../../services/FetchService";
import { GenericIntegration } from "../helpers/GenericIntegration";

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
    @inject(ENCRYPTION_SERVICE) encryption: EncryptionService,
    @inject(FETCH_SERVICE) private fetch: IFetchService,
    @inject(IntegrationRepository) integrations: IntegrationRepository,
  ) {
    super(encryption, integrations);
  }

  async authenticateApiKey(apiKey: string) {
    return await Promise.any(
      Object.entries({
        sandbox: "https://api.sandbox.signaturit.com",
        production: "https://api.signaturit.com",
      }).map(([environment, url]) =>
        this.fetch
          .fetch(`${url}/v3/team/users.json`, {
            headers: { authorization: `Bearer ${apiKey}` },
            timeout: 5_000,
          })
          .then(({ status }) => {
            if (status === 200) {
              return { environment: environment as SignaturitEnvironment };
            } else {
              throw new Error();
            }
          }),
      ),
    );
  }

  public async withApiKey<TResult>(
    orgIntegrationId: number,
    handler: (apiKey: string, context: SignaturitIntegrationContext) => Promise<TResult>,
  ): Promise<TResult> {
    return await this.withCredentials(orgIntegrationId, async (credentials, context) => {
      return await handler(credentials.API_KEY, context);
    });
  }

  protected override getContext(
    integration: EnhancedOrgIntegration<"SIGNATURE", "SIGNATURIT", false>,
  ): SignaturitIntegrationContext {
    const settings = integration.settings;
    const brandings = ContactLocaleValues.flatMap((locale) =>
      (["FORMAL", "INFORMAL"] as Tone[]).map((tone) => {
        const key = `${locale.toUpperCase()}_${tone}_BRANDING_ID` as SignaturitBrandingIdKey;
        if (key in settings) {
          return { locale, tone, brandingId: settings[key]! };
        }
      }),
    ).filter(isNonNullish);
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
}
