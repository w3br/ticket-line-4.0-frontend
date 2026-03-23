import { EventEnums } from "./event-enums";
import { PerformanceCreate } from "./performance";

/**
 * Interface representing an event.
 */
export interface Event {
  id?: number;
  title: string;
  description: string;
  image: string;
  performances?: Performance[];
  artistId: string | number;
  type: EventEnums;
  category: EventEnums;
}

/**
 * Interface representing an event creation request.
 */
export interface EventCreate {
  title: string;
  description: string;
  image: string;
  performances?: PerformanceCreate[];
  artistIds?: number[];
  artistNames?: string[];
  type: EventEnums;
  category: EventEnums;
}
