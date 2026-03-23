import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {News, NewsCreate} from '../dtos/news';
import {Observable, map} from 'rxjs';
import {Globals} from '../global/globals';

@Injectable({
  providedIn: 'root'
})
export class NewsService {

  private newsBaseUri: string = this.globals.backendUri + '/news';

  constructor(private httpClient: HttpClient, private globals: Globals) {
  }


  /**
   * Create news with optional images (multipart/form-data).
   */
  create(news: NewsCreate, images?: FileList | File[]): Observable<News> {
    console.log('Create news with title ' + news.title);
    const formData = this.buildFormData(news, images);
    return this.httpClient.post<News>(this.newsBaseUri, formData);
  }

  /**
   * Loads all news from the backend
   */
  getNews(): Observable<News[]> {
    return this.httpClient.get<News[]>(this.newsBaseUri).pipe(
      map(news => {
        return news.map(item => {
          if (item.images && item.images.length > 0) {
            item.images = item.images.map(image => {
              if (!image.path.startsWith('http')) {
                image.path = this.getImageUrl(image.path);
              }
              return image;
            });
          }
          return item;
        });
      })
    );
  }

  /**
   * Get a News with the given id stored in the system
   *
   * @param id id of the news to be fetched
   * @return observable list of found news.
   */
  getNewsById(id: number): Observable<News> {
    return this.httpClient.get<News>(
        `${this.newsBaseUri}/${id}`
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
   * Builds FormData object for news creation or update.
   *
   * @param news news data
   * @param images optional images to include
   * @private
   */
  private buildFormData(news: NewsCreate, images?: FileList | File[]): FormData {
    const fd = new FormData();
    // JSON part
    fd.append(
      'news',
      new Blob([JSON.stringify(news)], {type: 'application/json'})
    );

    if (images) {
      const files = images instanceof FileList ? Array.from(images) : images;
      files.forEach(file => fd.append('images', file), {type: 'application/form-data'});
    }
    return fd;
  }
}
