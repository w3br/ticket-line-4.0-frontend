/**
 * Class representing information about a ticket.
 */
export class TicketInfo {
  id: number;
  performanceInfo: string;
  placeInfo: string;
  price: number;
  reservationExpiration: string | null;
  seatId: number | null;
  sectorId: number | null;
  isStanding: boolean;
  performanceId: number;
  startTime: string | null;
}

