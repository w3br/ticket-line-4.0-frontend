import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Globals } from '../global/globals';
import { Observable } from 'rxjs';

export interface CartValidationResponse {
  validSeatIds: number[];
  removedSeatIds: number[];
  adjustedStandingSelected: Record<number, number>;
  removedSeatCount: number;
  removedStandingCount: number;
  removedReservationCodes: string[];
  validReservationCodes: string[];
  itemEmptyAfterAdjust: boolean;
  messages: string[];
  updatedTotalPrice: number;
}

@Injectable({ providedIn: 'root' })
export class CartApiService {
  private readonly baseUrl = this.globals.backendUri + '/performances';

  constructor(private http: HttpClient, private globals: Globals) {}

  validateCart(performanceId: number, payload: { seatIds: number[]; standingSelected: Record<number, number>; reservationCodes: string[] })
    : Observable<CartValidationResponse> {
    return this.http.post<CartValidationResponse>(
      `${this.baseUrl}/${performanceId}/cart/validate`,
      payload
    );
  }
}
