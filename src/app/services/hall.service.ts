import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {HallSuggestion} from "../dtos/hall-suggestion";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root',
})
export class HallService {

  private readonly baseUrl = '/api/v1/venues';

  constructor(private http: HttpClient) {}

  getAllHalls(): Observable<HallSuggestion[]> {
    return this.http.get<HallSuggestion[]>(`${this.baseUrl}/halls/all`);
  }

}
