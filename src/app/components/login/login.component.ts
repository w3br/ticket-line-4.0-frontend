import {Component, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {PasswordResetRequest, PasswordReset} from '../../dtos/password-reset';
import {PasswordResetService} from '../../services/password-reset.service';
import {AuthRequest} from '../../dtos/auth-request';
import {ToastrService} from 'ngx-toastr';
import {CartService} from '../../services/cart.service';


@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone: false
})
export class LoginComponent implements OnInit {

  loginForm: UntypedFormGroup;
  // After first submission attempt, form validation will start
  submitted = false;
  // Error flag
  error = false;
  errorMessage = '';

  constructor(private formBuilder: UntypedFormBuilder, private authService: AuthService, private resetService: PasswordResetService, private router: Router, private notification: ToastrService, private cartService: CartService) {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  /**
   * Form validation will start after the method is called, additionally an AuthRequest will be sent
   */
  loginUser() {
    this.submitted = true;
    if (this.loginForm.valid) {
      const authRequest: AuthRequest = new AuthRequest(this.loginForm.controls.username.value, this.loginForm.controls.password.value);
      this.authenticateUser(authRequest);
    } else {
      console.log('Invalid input');
    }
  }

  /**
   * Send authentication data to the authService. If the authentication was successfully, the user will be forwarded to the message page
   *
   * @param authRequest authentication data from the user login form
   */
  authenticateUser(authRequest: AuthRequest) {
    console.log('Try to authenticate user: ' + authRequest.email);
    this.authService.loginUser(authRequest).subscribe({
      next: () => {
        this.cartService.reload();
        console.log('Successfully logged in user: ' + authRequest.email);
        this.notification.success('Welcome!');
        this.router.navigate(['/news']);
        },
      error: error => {
        console.log('Could not log in due to:');
        console.log(error);
        this.error = true;
        let message = 'Authentication failed. Please try again.';
        if (typeof error.error === 'object') {
          message = error.error.detail || error.error.title || message;
        } else {
          try {
            const errorObj = JSON.parse(error.error);
            message = errorObj.detail || errorObj.title || message;
          } catch (exception) {
            message = error.error;
          }
        }
        this.errorMessage = message;
        this.notification.error(message);
      }
    });
  }

  ngOnInit() {
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  goToLanding() {
    this.router.navigate(['/']);
  }

  resetPassword() {
    const email = this.loginForm.controls.username.value;
    if (!email) {
      this.notification.error('Please enter your email address to reset your password.');
      return;
    }
    const resetRequest: PasswordResetRequest = new PasswordResetRequest();
    resetRequest.email = email;
    this.resetService.requestPasswordReset(resetRequest).subscribe({
      next: () => {
        this.notification.success('If an account exists for this email, you’ll receive a reset link shortly.');
      },
      error: error => {
        console.log('Password reset request failed due to:');
        console.log(error);
        let message = 'Password reset request failed. Please try again later.';
        if (typeof error.error === 'object') {
          message = error.error.detail || error.error.title || message;
        } else {
          try {
            const errorObj = JSON.parse(error.error);
            message = errorObj.detail || errorObj.title || message;
          } catch (exception) {
            message = error.error;
          }
        }
        this.notification.error(message);
      }
    });
  }
}
