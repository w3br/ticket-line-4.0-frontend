import { Component, OnInit } from '@angular/core';
import { UserCreateDto } from '../../../dtos/user-create-dto';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from "@angular/forms";
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register-user',
  templateUrl: './create-user.component.html',
  imports: [
    FormsModule,
    CommonModule
  ],
  styleUrls: ['./create-user.component.scss']
})
export class CreateUserComponent implements OnInit {

  submitted = false;
  error = false;
  passwordRepeat = '';

  // ISO 3166-1
  countries: { code: string; name: string }[] = [];

  newUser: UserCreateDto = {
    name: '',
    email: '',
    password: '',
    street: '',
    city: '',
    country: '',
    admin: false
  };


  constructor(
    private userService: UserService,
    private http: HttpClient,
    private router: Router,
    private notification: ToastrService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.http.get<{code: string, name: string}[]>('/assets/countries.json')
      .subscribe({
        next: data => this.countries = data,
        error: err => console.error('Failed to load countries.json', err)
      });
  }

  createUser() {
    this.submitted = true;

    if (!this.newUser.name || !this.newUser.email || !this.newUser.password) {
      this.notification.error('Please fill in all required fields!', 'Error');
      return;
    }

    if (this.newUser.password !== this.passwordRepeat) {
      this.notification.error('Passwords do not match!', 'Error');
      return;
    }

    this.userService.createUser(this.newUser).subscribe({
      next: () => {
        this.notification.success('Successfully created User!', 'Success');

        this.newUser = {
          name: '',
          email: '',
          password: '',
          street: '',
          city: '',
          country: '',
          admin: false
        };
        this.passwordRepeat = '';
        this.submitted = false;

        this.router.navigate(['/admin']);
      },
      error: err => {
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
          "Error Creating User"
        );
      }
    });
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
