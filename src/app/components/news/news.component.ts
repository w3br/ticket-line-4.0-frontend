import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { News } from '../../dtos/news';
import { NewsService } from '../../services/news.service';
import { AuthService } from '../../services/auth.service'; // falls vorhanden

type NewsMode = 'read' | 'unread';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss'],
  standalone: false
})
export class NewsComponent implements OnInit {
  error = false;
  errorMessage = '';

  private news: News[] = [];

  // pagination
  pageSize = 10;
  currentPage = 1;

  // mode
  mode: NewsMode = 'unread';

  // read state
  private readIds = new Set<number>();
  private storageKey = 'readNewsIds:anonymous';

  constructor(
    private newsService: NewsService,
    private route: ActivatedRoute,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.mode = (this.route.snapshot.data['mode'] as NewsMode) ?? 'unread';

    // pro-user storage key
    const userId = this.authService?.getUserId?.();
    this.storageKey = `readNewsIds:${userId ?? 'anonymous'}`;

    this.loadReadIds();
    this.loadNews();
  }

  // filtering
  get filteredNews(): News[] {
    const all = this.news ?? [];
    if (this.mode === 'unread') {
      return all.filter(n => !this.readIds.has(n.id));
    }
    return all.filter(n => this.readIds.has(n.id));
  }

  //pagination
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredNews.length / this.pageSize));
  }

  get pagedNews(): News[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredNews.slice(start, start + this.pageSize);
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const maxButtons = 5;

    if (total <= maxButtons) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const half = Math.floor(maxButtons / 2);
    let start = current - half;
    let end = current + half;

    if (start < 1) {
      start = 1; end = maxButtons;
    }

    if (end > total) {
      end = total; start = total - maxButtons + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(1, page), this.totalPages);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }
  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  // --- read marking ---
  markAsRead(id: number): void {
    this.readIds.add(id);
    this.persistReadIds();

    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
  }

  markAsUnread(id: number): void {
    this.readIds.delete(id);
    this.persistReadIds();
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
  }

  getImageUrl(imagePath: string): string {
    return this.newsService.getImageUrl(imagePath);
  }

  // loading and persistence
  private loadNews(): void {
    this.newsService.getNews().subscribe({
      next: (news: News[]) => {
        this.news = news;
        if (this.currentPage > this.totalPages) this.currentPage = 1;
      },
      error: err => this.defaultServiceErrorHandling(err)
    });
  }

  private loadReadIds(): void {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return;
    try {
      this.readIds = new Set<number>(JSON.parse(raw));
    } catch {
      this.readIds = new Set<number>();
    }
  }

  private persistReadIds(): void {
    localStorage.setItem(this.storageKey, JSON.stringify([...this.readIds]));
  }

  private defaultServiceErrorHandling(error: any): void {
    console.log(error);
    this.error = true;
    this.errorMessage = typeof error.error === 'object' ? error.error.error : error.error;
  }
}
