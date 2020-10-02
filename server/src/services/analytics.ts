import Analytics from "analytics-node";
import { inject, injectable } from "inversify";
import { Config, CONFIG } from "../config";
import { User } from "../db/__types";
import { fullName } from "../util/fullName";
import { toGlobalId } from "../util/globalId";

type validEvents = "Petition created" | "User data updated";

@injectable()
export class AnalyticsService {
  private analytics: Analytics;
  constructor(@inject(CONFIG) private config: Config) {
    this.analytics = new Analytics(this.config.analytics.writeKey);
  }

  public async identifyUser(user: User) {
    return new Promise((resolve, reject) => {
      this.analytics.identify(
        {
          userId: toGlobalId("User", user.id),
          traits: {
            email: user.email,
            name: fullName(user.first_name, user.last_name),
            createdAt: user.created_at,
          },
        },
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  public async trackEvent(
    eventName: validEvents,
    userId: number,
    properties?: { [key: string]: any }
  ) {
    return new Promise((resolve, reject) => {
      this.analytics.track(
        {
          userId: toGlobalId("User", userId),
          event: eventName,
          properties,
        },
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }
}
