/**
 * Interface representing the result of a search for performances.
 */
export interface PerformanceSearchResult {
  performanceId: number;
  eventId: number;
  eventTitle: string;
  eventImageUrl?: string;
  startTime: string;
  endTime?: string;
  venueName: string;
  hallName: string;
  minPrice?: number;
  maxPrice?: number;
}
