import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Globals} from "../global/globals";

export interface MerchandiseCreate {
  description: string;
  price: number;          // or string if you prefer
  pointCost: number;
}

export interface MerchandiseDto {
  id: number;
  description: string;
  imagePath?: string | null;
  price: number;
  pointCost: number;
}

@Injectable({ providedIn: 'root' })
export class MerchandiseService {
  private readonly baseUri: string;

  constructor(private http: HttpClient, private globals: Globals) {
    this.baseUri = this.globals.backendUri + '/merchandise';
  }

  createMerchandise(payload: MerchandiseCreate, image?: File | null): Observable<MerchandiseDto> {
    const fd = new FormData();

    fd.append('merchandise', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

    if (image) {
      fd.append('image', image);
    }

    return this.http.post<MerchandiseDto>(this.baseUri, fd);
  }

  updateMerchandise(id: number, payload: MerchandiseCreate, image?: File | null): Observable<MerchandiseDto> {
    const fd = new FormData();
    fd.append('merchandise', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

    if (image) {
      fd.append('image', image);
    }

    return this.http.put<MerchandiseDto>(`${this.baseUri}/${id}`, fd);
  }

}
