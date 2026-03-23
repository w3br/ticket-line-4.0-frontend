import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { OrderRequest } from '../dtos/order-request';
import { OrderPurchaseResponseDto } from '../dtos/order-purchase-response-dto';
import { SeatingPlan } from '../dtos/seating-plan.dto';
import {Globals} from '../global/globals';

@Injectable({ providedIn: 'root' })
export class SeatingPlanService {

  private readonly baseUrl = this.globals.backendUri + `/performances`;

  constructor(private http: HttpClient, private globals: Globals) {}

  getSeatingPlan(performanceId: number): Observable<SeatingPlan> {
    return this.http.get<SeatingPlan>(`${this.baseUrl}/${performanceId}/seating-plan`);
  }

  purchase(performanceId: number, req: OrderRequest): Observable<OrderPurchaseResponseDto> {
    return this.http.post<OrderPurchaseResponseDto>(
      `${this.baseUrl}/${performanceId}/purchase`,
      req
    );
  }
}
