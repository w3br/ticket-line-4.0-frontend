import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfileDto } from '../dtos/profile';
import {Globals} from '../global/globals';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private baseUrl = this.globals.backendUri+ '/profile';

  constructor(private http: HttpClient, private globals: Globals) {}

  /**
   * Loads the user profile data from the backend.
   */
  getProfile(): Observable<UserProfileDto> {
    return this.http.get<UserProfileDto>(this.baseUrl);
  }

  /**
   * saves the updated user profile data to the backend.
   */
  updateProfile(profile: UserProfileDto): Observable<UserProfileDto> {
    return this.http.put<UserProfileDto>(this.baseUrl, profile);
  }

  /**
   * Deletes the user profile from the backend.
   */
  deleteProfile(): Observable<void> {
    return this.http.delete<void>(this.baseUrl);
  }
}
