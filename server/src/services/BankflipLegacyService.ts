import { inject, injectable } from "inversify";
import { isDefined } from "remeda";
import { CONFIG, Config } from "../config";
import { getBaseWebhookUrl } from "../util/getBaseWebhookUrl";
import { sign } from "../util/jwt";
import { FETCH_SERVICE, IFetchService } from "./FetchService";

export const BANKFLIP_LEGACY_SERVICE = Symbol.for("BANKFLIP_LEGACY_SERVICE");

export interface IBankflipLegacyService {
  createUserRequest(payload: {
    petitionId: string;
    fieldId: string;
    userId: string;
  }): Promise<{ type: string; url: string }>;
  createContactRequest(payload: {
    accessId: string;
    fieldId: string;
    keycode: string;
  }): Promise<{ type: string; url: string }>;
}

@injectable()
export class BankflipLegacyService implements IBankflipLegacyService {
  constructor(
    @inject(FETCH_SERVICE) private fetch: IFetchService,
    @inject(CONFIG) private config: Config
  ) {}

  async createUserRequest(payload: { petitionId: string; fieldId: string; userId: string }) {
    const token = await sign(payload, this.config.security.jwtSecret, { expiresIn: "1d" });

    const baseWebhookUrl = await getBaseWebhookUrl(this.config.misc.webhooksUrl);

    const res = await this.fetch.fetch(`https://api.bankflip.io/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        webhookUrl: `${baseWebhookUrl}/api/webhooks/bankflip?token=${token}`,
        userId: payload.userId,
        metadata: {
          ...payload,
          petitionId: payload.petitionId,
        },
      }),
    });
    const result = await res.json();

    if (!isDefined(result.id)) {
      throw new Error("BAD_REQUEST");
    }

    return {
      type: "WINDOW",
      url: `https://app.bankflip.io?${new URLSearchParams({
        userId: payload.userId,
        requestId: result.id,
        companyName: "Parallel",
      })}`,
    };
  }

  async createContactRequest(payload: { accessId: string; fieldId: string; keycode: string }) {
    const token = await sign(payload, this.config.security.jwtSecret, {
      expiresIn: "1d",
    });

    const baseWebhookUrl = await getBaseWebhookUrl(this.config.misc.webhooksUrl);

    const res = await this.fetch.fetch(`https://api.bankflip.io/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        webhookUrl: `${baseWebhookUrl}/api/webhooks/bankflip?token=${token}`,
        userId: payload.keycode,
        metadata: payload,
      }),
    });
    const result = await res.json();

    if (!isDefined(result.id)) {
      throw new Error("BAD_REQUEST");
    }

    return {
      type: "WINDOW",
      url: `https://app.bankflip.io?${new URLSearchParams({
        userId: payload.keycode,
        requestId: result.id,
        companyName: "Parallel",
      })}`,
    };
  }
}
