/**
 * Interface representing a news entity.
 */
export interface News {
  id?: number;
  title: string;
  summary: string;
  fullText: string;
  publishedAt?: string;
  images?: NewsImage[];
}

/**
 * Interface representing a news creation request.
 */
export interface NewsCreate {
  title: string;
  summary: string;
  fullText: string;
}

/**
 * Interface representing a news image entity.
 */
export interface NewsImage {
  id?: number;
  path?: string;
  orderIndex?: number;
  createdAt?: string;
  news_id: number;
}
