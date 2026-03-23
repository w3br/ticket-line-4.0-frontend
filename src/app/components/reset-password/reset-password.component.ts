import {Component, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {PasswordResetRequest, PasswordReset} from '../../dtos/password-reset';
import {PasswordResetService} from '../../services/password-reset.service';
import {ToastrService} from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import {ReactiveFormsModule} from "@angular/forms";

@Component({
  selector: 'app-reset-password',
  imports: [
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent  implements OnInit {

  loginForm: UntypedFormGroup;
  // After first submission attempt, form validation will start
  submitted = false;
  // Error flag
  error = false;
  errorMessage = '';
  token!: string;

  constructor(private route: ActivatedRoute, private formBuilder: UntypedFormBuilder, private resetService: PasswordResetService, private router: Router, private notification: ToastrService) {
    this.loginForm = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      passwordConfirm: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  /**
   * Form validation will start after the method is called, additionally an AuthRequest will be sent
   */
  resetPassword() {
    this.submitted = true;
    if (this.loginForm.valid) {
      const passwordReset: PasswordReset = new PasswordReset();
      passwordReset.password = this.loginForm.controls.password.value;
      passwordReset.passwordConfirm = this.loginForm.controls.passwordConfirm.value;
      if (passwordReset.password !== passwordReset.passwordConfirm) {
        this.error = true;
        this.errorMessage = 'Passwords do not match';
        this.notification.error(this.errorMessage);
        return;
      }
      this.resetService.resetPassword(this.token, passwordReset).subscribe({
        next: () => {
          console.log('Successfully reset password');
          this.notification.success('Password reset successfully!');
          this.router.navigate(['/login']);
        },
        error: err => {
          const msg = err?.error?.message;
          const details: string[] = err?.error?.details ?? [];
          console.error(err);
          this.notification.error(details.length ? details.join('\n') : msg, msg);
        }
      });
    } else {
      console.log('Invalid input');
    }
  }

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token');
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  hasUppercase(value: string | null | undefined): boolean {
    return !!value && /[A-Z]/.test(value);
  }

  hasDigit(value: string | null | undefined): boolean {
    return !!value && /\d/.test(value);
  }

  hasSpecial(value: string | null | undefined): boolean {
    return !!value && /[!@#$%^&*()]/.test(value);
  }

}
