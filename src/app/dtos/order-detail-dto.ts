/**
 * Class representing detailed information about an order.
 */
export class OrderDetailDto {
  id?: number;
  userId?: number;
  total?: number;
  reservation = false;
  cancelled = false;
  reservationCode?: string;
  // ISO-String für Datum/Zeit
  timeOfOrder?: string;
  invoiceId?: number;
  location?: string;
  event?: string;
  timeOfEvent?: string;
  isMerchandise: boolean;
  purchasedViaReservation: boolean;
  artistId?: number;
  venueId?: number;
}
