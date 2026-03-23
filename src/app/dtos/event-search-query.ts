/**
 * Class representing a query for searching events.
 */
export class EventSearchQueryDto {
  text?: string;
  artistId?: number;
  artistName?: string;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
}
