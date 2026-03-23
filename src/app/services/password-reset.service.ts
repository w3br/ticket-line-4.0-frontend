import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Globals} from '../global/globals';
import {PasswordReset, PasswordResetRequest} from "../dtos/password-reset";



@Injectable({
  providedIn: 'root'
})
export class PasswordResetService {
  private passwordResetBaseUri: string = this.globals.backendUri + '/resets';
  constructor(private http: HttpClient, private globals: Globals) {}

  requestPasswordReset(passwordResetRequest: PasswordResetRequest): Observable<void> {
    return this.http.post<void>(`${this.passwordResetBaseUri}`, passwordResetRequest);
  }

  resetPassword(token: string, passwordReset: PasswordReset): Observable<void>{
    return this.http.put<void>(`${this.passwordResetBaseUri}/${token}`, passwordReset);
  }
}
