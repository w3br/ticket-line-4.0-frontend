/**
 * Interface representing the response after purchasing an order.
 */
export interface OrderPurchaseResponseDto {
  orderId: number;
  total: string;
  timeOfOrder: string;
  reservation: boolean;
}
