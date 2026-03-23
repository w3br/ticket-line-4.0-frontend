/**
 * Class representing an order request.
 */
export class OrderRequest {
  performanceId?: number;
  seatIdsToBeOrdered!: number[];
  numberOfStandingTicketsToBeOrdered!: Record<number, number>;
  reservationCodes!: string[];
  merchandiseId!: number;
  quantity?: number;
  purchasedWithPoints!: boolean;
}
