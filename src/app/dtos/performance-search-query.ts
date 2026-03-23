/**
 * Interface representing a query for searching performances.
 */
export interface PerformanceSearchQuery {
  venueId?: number;
  venueLabel?: string;
  search?: string;
  artistId?: number;
  artistName?: string;
  from?: string;
  to?: string;
  minPrice?: number;
  maxPrice?: number;
  eventId?: number;
}
