import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserListDto } from '../dtos/user-list-dto';
import {Globals} from '../global/globals';
import {UserCreateDto} from "../dtos/user-create-dto";
import { PageResponse } from '../dtos/PageRespnse';



@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userBaseUri: string = this.globals.backendUri + '/users';
  constructor(private http: HttpClient, private globals: Globals) {}

  createUser(user: UserCreateDto): Observable<UserListDto> {
    return this.http.post<UserListDto>(`${this.userBaseUri}`, user);
  }

  updateLockedUser(id: number): Observable<UserListDto>{
    return this.http.put<UserListDto>(`${this.userBaseUri}/${id}/lock`, {})
  }

  resetUserPassword(id: number): Observable<UserListDto>{
    return this.http.post<UserListDto>(`${this.userBaseUri}/${id}/password-reset`, {})
  }

  deleteLockedUser(id: number): Observable<UserListDto>{
    return this.http.delete<UserListDto>(`${this.userBaseUri}/${id}`, {})
  }

  getUsersPage(
    page: number,
    size: number,
    name?: string,
    email?: string,
    status: 'all' | 'locked' | 'unlocked' = 'all',
    role: 'all' | 'admin' | 'user' = 'all',
    excludeUserId?: number
  ) {
    const params: any = { page, size };

    if (name?.trim()) params.name = name.trim();
    if (email?.trim()) params.email = email.trim();

    params.status = status.toUpperCase(); // ALL/LOCKED/UNLOCKED
    params.role = role.toUpperCase();     // ALL/ADMIN/USER
    params.excludeUserId = excludeUserId;

    return this.http.get<any>('/api/v1/users', { params });
  }
}
