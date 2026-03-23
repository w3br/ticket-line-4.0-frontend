import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-reset-password.component.html',
  styleUrls: ['./admin-reset-password.component.scss']
})
export class AdminResetPasswordComponent implements OnInit {

  token: string | null = null;

  email = '';
  loading = true;

  newPassword = '';
  repeatPassword = '';

  submitting = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.loading = false;
      this.toastr.error('Invalid or missing reset token.');
      return;
    }

    this.http.get<{ email: string }>(`/api/v1/password-reset/${this.token}`).subscribe({
      next: (res) => {
        this.email = res.email;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Invalid or expired reset link.');
      }
    });
  }

  onSubmit(form: NgForm): void {
    if (!this.token) {
      this.toastr.error('Invalid reset link.');
      return;
    }

    if (!form.valid) {
      this.toastr.warning('Please fill out the form correctly.');
      return;
    }

    if (this.newPassword !== this.repeatPassword) {
      this.toastr.error('Passwords do not match.');
      return;
    }

    this.submitting = true;

    this.http.post<void>('/api/v1/password-reset/confirm', {
      token: this.token,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.toastr.success('Password successfully reset. Please log in.');
      },
      error: () => {
        this.submitting = false;
        this.toastr.error('Password reset failed. The link may be invalid or expired.');
      }
    });
  }

}
