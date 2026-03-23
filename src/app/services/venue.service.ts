import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { VenueSuggestion } from "../dtos/venue-suggestion";

@Injectable({ providedIn: 'root' })
export class VenueService {

  private readonly baseUrl = '/api/v1/venues';

  constructor(private http: HttpClient) {}

  suggestVenues(query: string): Observable<VenueSuggestion[]> {
    if (!query || query.trim().length === 0) {
      return of([]);
    }

    return this.http.get<VenueSuggestion[]>(
      `${this.baseUrl}/suggest`,
      { params: new HttpParams().set('query', query) }
    );
  }
}
