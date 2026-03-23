import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Globals } from '../global/globals';
import { RewardDto } from '../dtos/reward';

@Injectable({ providedIn: 'root' })
export class RewardService {

  private rewardBaseUri: string = this.globals.backendUri + '/rewards';

  constructor(private http: HttpClient, private globals: Globals) {}

  getRewards(): Observable<RewardDto[]> {
    return this.http.get<RewardDto[]>(this.rewardBaseUri);
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

    // static images served by backend
    if (imagePath.includes('/images') || imagePath.includes('images')) {
      const baseUrl = this.globals.backendUri.replace('/api/v1', '');

      if (!imagePath.startsWith('/')) {
        imagePath = '/' + imagePath;
      }

      return baseUrl + imagePath;
    }

    // fallback: treat as API-relative
    return this.globals.backendUri + imagePath;
  }

  createMerchandise(merch: RewardDto, image?: File) {
    const fd = new FormData();
    fd.append('merchandise', new Blob([JSON.stringify(merch)], { type: 'application/json' }));

    if (image) {
      fd.append('image', image, image.name);
    }

    return this.http.post<RewardDto>(this.rewardBaseUri, fd);
  }

  deleteReward(id: number) {
    return this.http.delete<void>(`${this.rewardBaseUri}/${id}`);
  }

}

