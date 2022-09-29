import { isDefined } from "remeda";
import { WorkerContext } from "../../context";
import { PetitionEventTypeValues, SystemEventTypeValues } from "../../db/__types";
import { EventListener, EventProcessorPayload, EventType } from "../event-processor";

export class EventProcessor {
  private listeners = new Map<EventType, EventListener[]>();

  register(types: EventType[] | "*", listener: EventListener<any>) {
    for (const type of types === "*" ? PetitionEventTypeValues : types) {
      if (this.listeners.has(type)) {
        this.listeners.get(type)!.push(listener);
      } else {
        this.listeners.set(type, [listener]);
      }
    }
    return this;
  }

  listen(): (payload: EventProcessorPayload, ctx: WorkerContext) => Promise<void> {
    return async (payload, ctx) => {
      if (this.listeners.has(payload.type)) {
        // this is for retrocompatibility on release with older payload, where tableName is not defined.
        // in the next iteration, tableName will be obtained from payload
        const tableName = payload.type in SystemEventTypeValues ? "system_event" : "petition_event";

        const event = await ctx.petitions.pickEventToProcess(
          payload.id,
          tableName,
          payload.created_at
        );

        if (isDefined(event)) {
          for (const listener of this.listeners.get(event.type)!) {
            try {
              await listener(event, ctx);
            } catch (error: any) {
              // log error and continue to other listeners
              ctx.logger.error(error.message, { stack: error.stack });
            }
          }
        }
      }
    };
  }
}
