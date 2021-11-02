import { WorkerContext } from "../../context";
import { EventType, EventListener, Event } from "../event-processor";

export class EventProcessor {
  private listeners = new Map<EventType, EventListener[]>();

  register(types: EventType[], listener: EventListener<any>) {
    for (const type of types) {
      if (this.listeners.has(type)) {
        this.listeners.get(type)!.push(listener);
      } else {
        this.listeners.set(type, [listener]);
      }
    }
    return this;
  }

  listen() {
    return async (event: Event, ctx: WorkerContext) => {
      if (this.listeners.has(event.type)) {
        for (const listener of this.listeners.get(event.type)!) {
          try {
            await listener(event, ctx);
          } catch (error: any) {
            // log error and continue to other listeners
            ctx.logger.error(error.message, { stack: error.stack });
          }
        }
      }
    };
  }
}
