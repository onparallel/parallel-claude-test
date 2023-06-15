import { isDefined } from "remeda";
import { WorkerContext } from "../../context";
import { PetitionEventTypeValues } from "../../db/__types";
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
        const event = await ctx.petitions.pickEventToProcess(
          payload.id,
          payload.table_name,
          payload.created_at
        );

        if (isDefined(event)) {
          for (const listener of this.listeners.get(event.type)!) {
            try {
              await listener(event, ctx);
              if (payload.table_name === "petition_event") {
                await ctx.petitions.markEventAsProcessed(event.id, ctx.config.instanceName);
              } else if (payload.table_name === "system_event") {
                await ctx.system.markEventAsProcessed(event.id, ctx.config.instanceName);
              }
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
