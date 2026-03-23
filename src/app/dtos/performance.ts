/**
 * Interface representing performance details for an event.
 */
export interface Performance {
  eventId: number;
  hallId: number;
  startTime: string;
  endTime?: string;
}

export interface PerformanceCreate {
  hallId: number;
  startTime: string;
  endTime?: string;
}
