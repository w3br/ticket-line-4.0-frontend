import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {FormsModule, NgForm, UntypedFormBuilder} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {AuthService} from '../../../services/auth.service';
import { NewsService } from '../../../services/news.service';
import { News, NewsCreate, NewsImage } from '../../../dtos/news'
import {ToastrService} from "ngx-toastr";
import {NgbModal, NgbPaginationConfig} from "@ng-bootstrap/ng-bootstrap";


export enum NewsCreateEditMode {
  create
}

@Component({
  selector: 'app-news-create-edit',
  templateUrl: './news-create-edit.component.html',
  styleUrls: ['./news-create-edit.component.scss'],
  standalone: false
})
export class NewsCreateEditComponent implements OnInit {

  mode: NewsCreateEditMode = NewsCreateEditMode.create;
  NewsCreateEditMode = NewsCreateEditMode;
  private readonly MAX_IMAGE_SIZE_BYTES = 1024 * 1024; // 1 MB

  news: News = {
    title: '',
    summary: '',
    fullText: ''
  };

  selectedFiles: File[] | null = null;
  selectedFilesPreview: string[] = [];

  isSubmitting = false;

  constructor(private newsService: NewsService,
              private ngbPaginationConfig: NgbPaginationConfig,
              private formBuilder: UntypedFormBuilder,
              private cd: ChangeDetectorRef,
              private modalService: NgbModal,
              private authService: AuthService,
              private route: ActivatedRoute,
              private router: Router,
              private notification: ToastrService) {
  }

  isAdmin(): boolean {
    return this.authService.getUserRole() === 'ADMIN';
  }

  ngOnInit(): void {
    if (!this.isAdmin()) {
      this.router.navigate(['/news']);
      return;
    }
    this.mode = NewsCreateEditMode.create;
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.selectedFiles = null;
      this.selectedFilesPreview = [];
      return;
    }

    const allFiles = Array.from(input.files);
    const validFiles: File[] = [];
    const rejectedFiles: string[] = [];

    for (const file of allFiles) {
      if (file.size > this.MAX_IMAGE_SIZE_BYTES) {
        rejectedFiles.push(
          `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
        );
      } else {
        validFiles.push(file);
      }
    }

    if (rejectedFiles.length > 0) {
      this.notification.error(
        `The following files are larger than 1 MB and were ignored:\n${rejectedFiles.join('\n')}`,
        'File too large'
      );
    }

    if (validFiles.length === 0) {
      this.selectedFiles = null;
      this.selectedFilesPreview = [];
      input.value = '';
      return;
    }

    this.selectedFiles = validFiles;
    this.selectedFilesPreview = [];

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        this.selectedFilesPreview.push((e.target as FileReader).result as string);
        this.cd.detectChanges();
      };
      reader.readAsDataURL(file);
    });
  }

  onSubmit(form: NgForm): void {
    if (form.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    const files = this.selectedFiles ?? undefined;

    const request$ = this.newsService.create(this.news, files);

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.notification.success(
          this.mode === NewsCreateEditMode.create ? 'News created.' : 'News updated.',
          'Success'
        );
        this.router.navigate(['/news']);
      },
      error: err => {
        const msg = err?.error?.message;
        const details: string[] = err?.error?.details ?? [];
        console.error(err);
        this.notification.error(details.length ? details.join('\n') : msg, msg);
        this.isSubmitting = false;
      }
    });
  }

  removeSelectedImage(index: number): void {
    this.selectedFilesPreview.splice(index, 1);

    if (this.selectedFiles) {
      const files = [...this.selectedFiles];
      files.splice(index, 1);
      this.selectedFiles = files.length ? files : null;
    }

    if (!this.selectedFilesPreview.length) {
      this.selectedFiles = null;
    }

    this.cd.detectChanges();
  }
}
