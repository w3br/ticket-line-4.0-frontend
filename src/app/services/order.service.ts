import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderDetailDto } from '../dtos/order-detail-dto';
import {Globals} from "../global/globals";
import { TicketInfo } from '../dtos/ticket';
import { OrderRequest } from "../dtos/order-request";
import {OrderPurchaseResponseDto} from "../dtos/order-purchase-response-dto";
import {CombinedOrderRequest} from "../dtos/combined-order-request";

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private ordersBaseUri: string = this.globals.backendUri + '/orders';

  constructor(private httpClient: HttpClient, private globals: Globals) {
  }


  getAllOrders(): Observable<OrderDetailDto[]> {
    return this.httpClient.get<OrderDetailDto[]>(this.ordersBaseUri);
  }

  getInvoicePdf(orderId: number): Observable<Blob> {
    return this.httpClient.get(`${this.ordersBaseUri}/${orderId}/invoice`, {
      responseType: 'blob'
    });
  }

  getCancellationPdf(orderId: number): Observable<Blob> {
    return this.httpClient.get(`${this.ordersBaseUri}/${orderId}/cancellation-invoice`, {
      responseType: 'blob'
    });
  }

  cancelPurchase(orderId: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.ordersBaseUri}/${orderId}/purchases/cancellations`);
  }


  cancelReservation(orderId: number): Observable<void> {
    return this.httpClient.delete<void>(
      `${this.ordersBaseUri}/${orderId}/reservations/cancellations`
    );
  }

  getTicketInfo(orderId: number): Observable<TicketInfo[]> {
    return this.httpClient.get<TicketInfo[]>(
      `${this.ordersBaseUri}/${orderId}/tickets`
    );
  }

  purchaseMerchandise(req: OrderRequest): Observable<OrderPurchaseResponseDto> {
    return this.httpClient.post<OrderPurchaseResponseDto>(
      `${this.ordersBaseUri}/purchases`,
      req
    );
  }

  purchaseCombined(req: CombinedOrderRequest): Observable<OrderPurchaseResponseDto> {
    return this.httpClient.post<OrderPurchaseResponseDto>(
      `${this.ordersBaseUri}/purchases/combined`,
      req
    );
  }
}
