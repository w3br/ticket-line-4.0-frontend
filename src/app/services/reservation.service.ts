import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {OrderRequest} from "../dtos/order-request";
import {OrderDetailDto} from "../dtos/order-detail-dto";
import {Globals} from '../global/globals';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {

  private reservationBaseUri: string = this.globals.backendUri + '/performances';

  constructor(private httpClient: HttpClient, private globals: Globals) {
  }

  reserveSeats(performanceId: number, req: OrderRequest): Observable<OrderDetailDto> {
    return this.httpClient.post<OrderDetailDto>(
      `${this.reservationBaseUri}/${performanceId}/reservations`,
      req
    );
  }
}
