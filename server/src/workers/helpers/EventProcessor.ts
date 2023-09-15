import { isDefined } from "remeda";
import { WorkerContext } from "../../context";
import { PetitionEventType, PetitionEventTypeValues, SystemEventType } from "../../db/__types";
import { PetitionEvent } from "../../db/events/PetitionEvent";
import { SystemEvent } from "../../db/events/SystemEvent";
import { EventProcessorPayload, EventType } from "../event-processor";
import { Prettify } from "../../util/types";

type EventListener<T extends PetitionEventType | SystemEventType> = (
  payload: Prettify<
    T extends PetitionEventType ? PetitionEvent & { type: T } : SystemEvent & { type: T }
  >,
  ctx: WorkerContext,
) => Promise<void>;

interface Listener {
  types: (PetitionEventType | SystemEventType)[] | "*";
  handle: EventListener<PetitionEventType | SystemEventType>;
}

export function listener<
  T extends PetitionEventType | SystemEventType = PetitionEventType | SystemEventType,
>(types: T[] | "*", handle: EventListener<T>) {
  return { types, handle } as Listener;
}

export class EventProcessor {
  private listeners = new Map<EventType, EventListener<any>[]>();

  register({ types, handle }: Listener) {
    for (const type of types === "*" ? PetitionEventTypeValues : types) {
      if (this.listeners.has(type)) {
        this.listeners.get(type)!.push(handle);
      } else {
        this.listeners.set(type, [handle]);
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
          payload.created_at,
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
