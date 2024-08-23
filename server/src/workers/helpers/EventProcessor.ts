import { isNonNullish } from "remeda";
import { WorkerContext } from "../../context";
import { PetitionEventType, ProfileEventType, SystemEventType } from "../../db/__types";
import { PetitionEvent } from "../../db/events/PetitionEvent";
import { ProfileEvent } from "../../db/events/ProfileEvent";
import { SystemEvent } from "../../db/events/SystemEvent";
import { Prettify } from "../../util/types";

export type EventType = PetitionEventType | SystemEventType | ProfileEventType;

export interface EventProcessorPayload {
  id: number;
  type: EventType;
  created_at: Date; // this helps with content-based deduplication and is used to check if the event should be processed or not
  table_name: "petition_event" | "system_event" | "profile_event";
}

type EventListener<T extends EventType> = (
  payload: Prettify<
    T extends PetitionEventType
      ? PetitionEvent & { type: T }
      : T extends SystemEventType
        ? SystemEvent & { type: T }
        : ProfileEvent & { type: T }
  >,
  ctx: WorkerContext,
) => Promise<void>;

interface Listener {
  types: EventType[];
  handle: EventListener<EventType>;
}

export function listener<T extends EventType>(types: T[], handle: EventListener<T>) {
  return { types, handle } as unknown as Listener;
}

export class EventProcessor {
  private listeners = new Map<EventType, EventListener<any>[]>();

  register({ types, handle }: Listener) {
    for (const type of types) {
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
        const event = await ctx.events.pickEventToProcess(
          payload.id,
          payload.table_name,
          payload.created_at,
          ctx.config.instanceName,
        );

        if (isNonNullish(event)) {
          for (const listener of this.listeners.get(event.type)!) {
            try {
              await listener(event, ctx);
            } catch (error) {
              // log error and continue to other listeners
              if (error instanceof Error) {
                ctx.logger.error(error.message, { stack: error.stack });
              } else {
                ctx.logger.error(error);
              }
            }
          }

          await ctx.events.markEventAsProcessed(event.id, payload.table_name);
        }
      }
    };
  }
}
