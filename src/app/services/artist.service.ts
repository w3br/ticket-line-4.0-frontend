import {Injectable} from "@angular/core";
import {HttpClient, HttpParams} from "@angular/common/http";
import {Observable, of} from "rxjs";
import {ArtistSuggestion} from "../dtos/artist-suggestion";

@Injectable({ providedIn: 'root' })
export class ArtistService {

  private readonly baseUrl = '/api/v1/artists';

  constructor(private http: HttpClient) {}

  suggestArtists(query: string): Observable<ArtistSuggestion[]> {
    if (!query || query.trim().length === 0) {
      return of([]);
    }

    return this.http.get<ArtistSuggestion[]>(
      `${this.baseUrl}/suggest`,
      { params: new HttpParams().set('query', query) }
    );
  }
}
