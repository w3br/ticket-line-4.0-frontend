import {RewardDto} from "./reward";

/**
 * Interface representing a cart item.
 */
export interface CartItemDto {
  ticketPurchase: boolean;
  id: string;
  performanceId: number;
  performanceName?: string | null; // Optional for merchandise items

  seatIds: number[];
  seatLabels: string[];

  standingSelected: Record<number, number>;
  reservationCodes: string[];

  merchandise: RewardDto;
  paidWithRewardPoints: boolean;

  totalPrice: number;
}

export interface CartCleanupResult {
  removedSeats: number;
  removedStanding: number;
  removedItems: number;
  performanceIdsTouched: number[];
}

