import { Component } from '@angular/core';
import {News, NewsImage} from "../../../dtos/news";
import {ActivatedRoute, Router} from "@angular/router";
import {NewsService} from "../../../services/news.service";

@Component({
  selector: 'app-news-detail',
  templateUrl: './news-detail.component.html',
  styleUrl: './news-detail.component.scss',
  standalone: false,
})
export class NewsDetailComponent {
    news: News;
    error: string;

  constructor(
    private route: ActivatedRoute,
    private newsService: NewsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      this.error = 'Invalid news ID.';
      return;
    }

    const id = Number(idParam);

    this.newsService.getNewsById(id).subscribe({
      next: (data) => {
        this.news = data;
      },
      error: () => {
        this.error = 'News item not found.';
      }
    });
  }

  /**
   * Gets the full URL for an image path
   */
  getImageUrl(imagePath: string): string {
    return this.newsService.getImageUrl(imagePath);
  }

  goBack(): void {
    this.router.navigate(['/news']);
  }

}
