import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {Observable, map} from "rxjs";
import {EventSearchResult} from "../dtos/event-search-result";
import {EventSearchQueryDto} from "../dtos/event-search-query";
import {Globals} from "../global/globals";
import {EventCreate} from "../dtos/event";
import {EventEnums} from "../dtos/event-enums";
import {EventTopDto} from "../dtos/event-top";
import {EventDetailDto} from "../dtos/event-detail";

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private baseUrl: string = this.globals.backendUri + '/events';

  constructor(private http: HttpClient, private globals: Globals) {
  }

  getTopEvents(month: string, category: string): Observable<EventTopDto[]> {
    let params = new HttpParams().set('month', month);
    if (category && category !== 'ALL') {
      params = params.set('category', category);
    }
    return this.http.get<EventTopDto[]>(`${this.baseUrl}/top`, { params }).pipe(
      map(events => {
        return events.map(event => {
          if (event.imageUrl) {
            event.imageUrl = this.getImageUrl(event.imageUrl);
          }
          return event;
        });
      })
    );
  }

  searchEvents(filters: EventSearchQueryDto): Observable<EventSearchResult[]> {
    let params = new HttpParams();

    if (filters.text && filters.text.trim().length > 0) {
      params = params.set('search', filters.text);
    }

    if (filters.artistId !== undefined) {
      params = params.set('artistId', filters.artistId.toString());
    } else if (filters.artistName && filters.artistName.trim().length > 0) {
      params = params.set('artistName', filters.artistName);
    }

    return this.http.get<EventSearchResult[]>(
      `${this.baseUrl}/search`,
      { params }
    ).pipe(
      map(events => {
        return events.map(event => {
          if (!event.id && event.eventId) {
            event.id = event.eventId;
          }
          if (event.imageUrl) {
            event.imageUrl = this.getImageUrl(event.imageUrl);
          }
          return event;
        });
      })
    );
  }

  /**
   * Gets the full URL for an image path
   */
  getImageUrl(imagePath: string): string {
    if (!imagePath) {
      return '';
    }

    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    if (imagePath.includes('/images') || imagePath.includes('images')) {
      const baseUrl = this.globals.backendUri.replace('/api/v1', '');

      if (!imagePath.startsWith('/')) {
        imagePath = '/' + imagePath;
      }

      return baseUrl + imagePath;
    }

    return this.globals.backendUri + imagePath;
  }

  /**
   * Create event with optional images (multipart/form-data).
   */
  create(event: EventCreate, images?: FileList | File[]): Observable<Event> {
    console.log('Create event with title ' + event.title);
    const formData = this.buildFormData(event, images);
    return this.http.post<Event>(this.baseUrl, formData);
  }

  /**
   * Update event with optional images (multipart/form-data).
   */
  update(id: number, event: EventCreate, images?: FileList | File[]): Observable<Event> {
    console.log('Update event ' + id + ' with title ' + event.title);
    const formData = this.buildFormData(event, images);
    return this.http.post<Event>(`${this.baseUrl}/${id}`, formData);
  }

  /**
   * Get event types.
   */
  getEventTypes(): Observable<EventEnums[]> {
    return this.http.get<EventEnums[]>(`${this.baseUrl}/event-types`);
  }

  /**
   * Get event categories.
   */
  getEventCategories(): Observable<EventEnums[]> {
    return this.http.get<EventEnums[]>(`${this.baseUrl}/event-categories`);
  }

  /**
   * Builds FormData object for event creation or update.
   *
   * @param event event data
   * @param images optional images to include
   * @private
   */
  private buildFormData(event: EventCreate, images?: FileList | File[]): FormData {
    const fd = new FormData();
    // JSON part
    fd.append(
      'event',
      new Blob([JSON.stringify(event)], { type: 'application/json' })
    );

    if (images) {
      const files = images instanceof FileList ? Array.from(images) : images;
      files.forEach(file => fd.append('images', file));
    }
    return fd;
  }

  getEventById(id: number): Observable<EventDetailDto> {
    return this.http.get<EventDetailDto>(`${this.baseUrl}/${id}`).pipe(
      map(event => {
        if (event.imageUrl) {
          event.imageUrl = this.getImageUrl(event.imageUrl);
        }
        return event;
      })
    );
  }

  deleteEvent(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
