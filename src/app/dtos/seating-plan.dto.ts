export type SeatStatus = 'FREE' | 'RESERVED' | 'SOLD';

/**
 * Interface representing a seat in a seating plan.
 */
export interface Seat {
  id: number;
  row: number;
  number: number;
  sectorId: number;
  sectorName: string;
  priceCategory: string;
  price: number;
  status: SeatStatus;
  accessible?: boolean;
}

/**
 * Interface representing a sector in a seating plan.
 */
export interface Sector {
  id: number;
  name: string;
  type: 'WITH_SEATS' | 'STANDING';
  priceCategory: string;
  price: number;

  totalSeats?: number;
  freeSeats?: number;
  reservedSeats?: number;
  soldSeats?: number;

  standingCapacity?: number;
  standingFree?: number;
}

/**
 * Interface representing a seating plan for a performance.
 */
export interface SeatingPlan {
  performanceId: number;
  eventTitle: string;
  hallName: string;
  sectors: Sector[];
  seats: Seat[];
}

/**
 * Interface representing a request for seat selection.
 */
export interface SeatSelectionRequest {
  seatIds: number[];
}

/**
 * Interface representing a response for seat selection.
 */
export interface ReservationResponse {
  reservationId: number;
  reservationCode: string;
  seats: Seat[];
  totalPrice: number;
  message: string;
}
