/**
 * Interface representing the top event information.
 */
export interface EventTopDto {
  eventId: number;
  title: string;
  category: string;
  soldTickets: number;
  imageUrl?: string;
  performanceCount?: number;
}
