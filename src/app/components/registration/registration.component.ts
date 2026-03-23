import {Component} from '@angular/core';
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {AuthService} from "../../services/auth.service";
import {Router, RouterLink} from "@angular/router";
import {ToastrService} from 'ngx-toastr';
import {HttpErrorResponse} from "@angular/common/http";

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.scss',
})
export class RegistrationComponent {

  firstName: string = '';
  lastName: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';


  constructor(private authService: AuthService,
              private router: Router,
              private notification: ToastrService) {
  }

  onSubmit() {

    if (this.password !== this.confirmPassword) {
      const errorMsg = 'Passwords do not match.';
      this.notification.error(errorMsg, 'Validation Error');
      return;
    }

    const request = {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      password: this.password,
      confirmPassword: this.confirmPassword
    };

    this.authService.registerUser(request).subscribe({
      next: () => {
        this.notification.success('Successfully registered!', 'Success');
        this.router.navigate(['/login']);
      },
      error: (err: HttpErrorResponse) => {
        let payload: any = err.error;

        // If backend sent JSON but with wrong content-type, Angular may give you a string
        if (typeof payload === 'string') {
          try {
            payload = JSON.parse(payload);
          } catch {
            /* ignore */
          }
        }

        const msg = payload?.message ?? 'Registration failed';

        const detailsArr: string[] =
          Array.isArray(payload?.details) ? payload.details :
            typeof payload?.details === 'string' ? [payload.details] :
              [];

        console.log(detailsArr);

        this.notification.error(
          detailsArr.length ? detailsArr.map(d => `• ${d}`).join('\n') : msg,
          msg
        );
      }

    });
  }

  goToLanding(){
    this.router.navigate(['/']);
  }

  hasUppercase(value: string): boolean {
    return /[A-Z]/.test(value);
  }

  hasDigit(value: string): boolean {
    return /\d/.test(value);
  }

  hasSpecial(value: string): boolean {
    return /[!@#$%^&*()]/.test(value);
  }

}
