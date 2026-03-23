import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { UserProfileDto } from '../../dtos/profile';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDeleteDialogComponent } from '../confirm-delete-dialog/confirm-delete-dialog.component';

type ApiErrorLike =
  | { message?: string; details?: string[]; error?: string; errors?: string[] }
  | string
  | null
  | undefined;

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  imports: [FormsModule, CommonModule, ConfirmDeleteDialogComponent]
})
export class ProfileComponent implements OnInit {
  profile: UserProfileDto = new UserProfileDto();

  loading = true;
  saving = false;
  saved = false;

  deleting = false;
  deleted = false;
  deleteError: string | null = null;

  countries: { code: string; name: string }[] = [];

  constructor(
    private profileService: ProfileService,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private notification: ToastrService
  ) {}

  ngOnInit(): void {
    this.http.get<{ code: string; name: string }[]>('/assets/countries.json').subscribe({
      next: data => (this.countries = data),
      error: err => console.error('Failed to load countries.json', err)
    });

    this.profileService.getProfile().subscribe({
      next: data => {
        this.profile = Object.assign(new UserProfileDto(), data);
        this.loading = false;
      },
      error: err => {
        console.error('Error loading profile', err);
        this.loading = false;
        this.showHttpError(err, 'Failed to load profile');
      }
    });
  }

  onSubmit(form: NgForm): void {
    if (!form.valid) {
      this.notification.warning('Please fix the errors in the form first.', 'Invalid form');
      return;
    }

    this.saving = true;
    this.saved = false;

    this.profileService.updateProfile(this.profile).subscribe({
      next: updated => {
        this.notification.success('Profile updated successfully', 'Saved');
        this.profile = Object.assign(new UserProfileDto(), updated);
        this.saving = false;
        this.saved = true;
      },
      error: err => {
        console.error('Error saving profile', err);
        this.saving = false;
        this.showHttpError(err, 'Profile update failed');
      }
    });
  }

  onDelete(): void {
    this.deleting = true;
    this.deleteError = null;
    this.deleted = false;

    this.profileService.deleteProfile().subscribe({
      next: () => {
        this.notification.success('Successfully deleted profile', 'Deleted');
        this.deleting = false;
        this.deleted = true;

        this.authService.logoutUser();
        this.router.navigate(['']);
      },
      error: err => {
        const msg = err?.error?.detail ?? 'Delete failed';
        this.notification.error(msg);
        /*
        console.error('Error deleting profile', err);
        this.deleting = false;
        this.deleteError = 'Failed to delete profile. Please try again.';
        this.showHttpError(err, 'Delete failed');
        */

      }
    });
  }

  onLogout(): void {
    this.authService.logoutUser();
    this.notification.success("Logged out successfully", "Logged out");
    this.router.navigate(['/login']);
  }

  // Helpers:

  private showHttpError(err: unknown, fallbackTitle: string): void {
    const httpErr = err as HttpErrorResponse;

    if (httpErr?.status === 401) {
      this.notification.error('Please log in again.', 'Unauthorized');
      this.authService.logoutUser();
      this.router.navigate(['/login']);
      return;
    }

    const { message, details } = this.extractApiError(httpErr);

    const title =
      httpErr?.status === 400 ? 'Bad request'
        : httpErr?.status === 409 ? 'Conflict'
          : httpErr?.status === 404 ? 'Not found'
            : httpErr?.status === 0   ? 'Network error'
              : fallbackTitle;

    if (details.length > 0) {
      this.notification.error(
        [message, ...details].join('\n'),
        title,
        { enableHtml: false }
      );
      return;
    }

    this.notification.error(message, title);
  }

  private extractApiError(httpErr: HttpErrorResponse | undefined): { message: string; details: string[] } {
    let message = 'An error occurred.';
    let details: string[] = [];

    if (!httpErr) {
      return { message, details };
    }

    if (httpErr.status === 0) {
      return { message: 'Could not reach server. Please try again.', details: [] };
    }

    const payload: ApiErrorLike = httpErr.error;

    if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload);
        return this.extractFromObject(parsed);
      } catch {
        return { message: payload || httpErr.message || message, details: [] };
      }
    }

    if (payload && typeof payload === 'object') {
      return this.extractFromObject(payload);
    }

    message = httpErr.message || message;
    return { message, details };
  }

  private extractFromObject(obj: any): { message: string; details: string[] } {
    // - { message, details }
    // - { error }
    // - { errors: [...] }
    // - { "Validation errors": [...] }
    const message =
      obj?.message ??
      obj?.error ??
      'An error occurred.';

    let details: string[] = [];

    if (Array.isArray(obj?.details)) details = obj.details;
    else if (Array.isArray(obj?.errors)) details = obj.errors;
    else if (Array.isArray(obj?.['Validation errors'])) details = obj['Validation errors'];

    return { message, details };
  }
}
