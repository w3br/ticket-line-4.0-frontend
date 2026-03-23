import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {map, Observable} from 'rxjs';
import { PerformanceSearchResult } from '../dtos/performance-search-result';
import {PerformanceSearchQuery} from "../dtos/performance-search-query";
import {EventsService} from "./events.service";

@Injectable({
  providedIn: 'root',
})
export class PerformanceService {

  private readonly baseUrl = '/api/v1/performances';

  constructor(private http: HttpClient,
              private eventService: EventsService) {}

  searchPerformances(filters: PerformanceSearchQuery): Observable<PerformanceSearchResult[]> {

    let params = new HttpParams();

    if (filters.search && filters.search.trim().length > 0) {
      params = params.set('search', filters.search.trim());
    }

    if (filters.venueId !== undefined) {
      params = params.set('venueId', filters.venueId.toString());
    } else if (filters.venueLabel && filters.venueLabel.trim().length > 0) {
      params = params.set('venueLabel', filters.venueLabel);
    }

    if (filters.artistId !== undefined) {
      params = params.set('artistId', filters.artistId.toString());
    } else if (filters.artistName && filters.artistName.trim().length > 0) {
      params = params.set('artistName', filters.artistName);
    }

    if (filters.from) {
      params = params.set('from', filters.from);
    }

    if (filters.to) {
      params = params.set('to', filters.to);
    }

    if(filters.minPrice !== undefined) {
      params = params.set(
        'minPrice',
        filters.minPrice.toString()
      )
    }

    if(filters.maxPrice !== undefined) {
      params = params.set(
        'maxPrice',
        filters.maxPrice.toString()
      )
    }

    if (filters.eventId !== undefined) {
      params = params.set('eventId', filters.eventId.toString());
    }

    return this.http.get<PerformanceSearchResult[]>(
      `${this.baseUrl}/search`,
      { params }
    ).pipe(
      map(performances => {
        return performances.map(p => {
          if (p.eventImageUrl) {
            // Reuse the logic from EventsService to get the full URL
            p.eventImageUrl = this.eventService.getImageUrl(p.eventImageUrl);
          }
          return p;
        });
      })
    );
  }
}
