/**
 * Interface representing the result of a search for events.
 */
export class EventSearchResult {
  id: number;
  eventId: number;
  title: string;
  description: string;
  type: string;
  imageUrl?: string;
  artistName?: string;
  performanceCount?: number;
}
