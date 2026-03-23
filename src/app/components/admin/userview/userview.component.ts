import {Component, OnInit} from '@angular/core';
import {UserListDto} from '../../../dtos/user-list-dto';
import {UserService} from '../../../services/user.service';
import {AuthService} from '../../../services/auth.service';
import {ToastrService} from 'ngx-toastr';
import {NgClass} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {PasswordResetRequest} from "../../../dtos/password-reset";
import {PasswordResetService} from '../../../services/password-reset.service';

type UserFilter = 'all' | 'admin' | 'user';
type lockedFilter = 'all' | 'locked' | 'unlocked';
@Component({
  selector: 'app-userview',
  templateUrl: './userview.component.html',

  imports: [
    NgClass,
    FormsModule
  ],
  styleUrls: ['./userview.component.scss']
})
export class UserviewComponent implements OnInit {

  users: UserListDto[] = [];
  selectedFilter: UserFilter = 'all';
  selectedFilterlock: lockedFilter = 'all';
  error = false;
  errorMessage = '';
  selectedUserId?: number;
  selectedUserLocked?: boolean;
  emailUser?: string;
  pageSize = 10;
  currentPage = 1;
  totalPages  = 1;
  searchName = '';
  searchEmail = '';
  isCurrentUserLocked = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private toastr: ToastrService,
    private resetService: PasswordResetService
  ) {}

  ngOnInit(): void {
    this.loadPage();
  }


  /**
   * Returns true if the authenticated user is an admin
   */
  isAdmin(): boolean {
    return this.authService.getUserRole() === 'ADMIN';
  }

  openConfirmDialog(userId: number, locked: boolean, email: string) {
    this.selectedUserId = userId;
    this.selectedUserLocked = locked;
    this.emailUser = email;
  }

  openConfirmDelete(userId: number, email: string) {
    this.selectedUserId = userId;
    this.emailUser = email;
  }

  openConfirmResetDialog(userId: number, email: string) {
    this.selectedUserId = userId;
    this.emailUser = email;
  }

  confirmToggleLock() {
    if (this.selectedUserId !== undefined) {
      this.toggleLock(this.selectedUserId);
    }
  }

  confirmDelete(){
    if (this.selectedUserId !== undefined) {
      this.toggleDelete(this.selectedUserId);
    }
  }

  confirmToggleReset() {
    if (this.selectedUserId !== undefined) {
      this.toggleReset(this.selectedUserId);
    }
  }

  getUserIdforAdmin() {
    return this.authService.getUserId();
  }

  onFiltersChanged(): void {
    this.currentPage = 1;
    this.loadPage();
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
    this.loadPage();
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  private loadPage(): void {
    this.userService.getUsersPage(
      this.currentPage - 1,
      this.pageSize,
      this.searchName,
      this.searchEmail,
      this.selectedFilterlock,
      this.selectedFilter,
      this.getUserIdforAdmin()
    ).subscribe({
      next: res => {
        this.users = res.content;
        this.totalPages = Math.max(1, res.totalPages);

        if (this.currentPage > this.totalPages) {
          this.currentPage = this.totalPages;
          this.loadPage();
        }
      },
      error: err => {
        this.defaultServiceErrorHandling(err);
      }
    });
  }


  private defaultServiceErrorHandling(error: any): void {
    console.log(error);
    this.error = true;
    if (typeof error.error === 'object') {
      this.errorMessage = error.error.error;
    } else {
      this.errorMessage = error.error;
    }
  }

  toggleLock(id: number): void {
    this.userService.updateLockedUser(id).subscribe({
      next: updated => {
        this.loadPage();
        this.toastr.success(updated.locked ? 'User locked' : 'User unlocked');
      },
      error: err => {
        const msg = err?.error?.detail ?? 'Update failed';
        this.toastr.error(msg);
      }
    });
  }

  toggleDelete(id: number): void {
    this.userService.deleteLockedUser(id).subscribe({
      next: () => {
        this.loadPage();
        this.toastr.success('User deleted');
      },
      error: err => {
        const msg = err?.error?.detail ?? 'Delete failed';
        this.toastr.error(msg);
      }
    })
  }

  toggleReset(id: number): void {
    const resetRequest: PasswordResetRequest = new PasswordResetRequest();
    resetRequest.email = this.emailUser || '';

    this.resetService.requestPasswordReset(resetRequest).subscribe({
      next: () => {
        this.toastr.success('If an account exists for this email, the user will get a reset link.');
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
        this.toastr.error(message);
      }
    })
  }

  goToFirstPage(): void {
    if (this.currentPage !== 1) {
      this.currentPage = 1;
      this.loadPage();
    }
  }

  goToLastPage(): void {
    if (this.currentPage !== this.totalPages) {
      this.currentPage = this.totalPages;
      this.loadPage();
    }
  }

}
