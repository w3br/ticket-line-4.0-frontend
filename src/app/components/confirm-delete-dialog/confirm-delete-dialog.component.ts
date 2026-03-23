import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-delete-dialog.component.html',
  styleUrls: ['./confirm-delete-dialog.component.scss']
})
export class ConfirmDeleteDialogComponent {
  @Output() confirm = new EventEmitter<void>();

  visible = false;
  title = 'Confirm Deletion';
  message = 'Are you sure you want to delete this item? This action cannot be undone.';
  confirmButtonText = 'Delete';

  open(title?: string, message?: string, confirmButtonText?: string) {
    if (title) {
      this.title = title;
    }
    if (message) {
      this.message = message;
    }
    if (confirmButtonText) {
      this.confirmButtonText = confirmButtonText;
    }
    this.visible = true;
  }

  close() {
    this.visible = false;
  }

  onConfirmClick() {
    this.confirm.emit();
    this.close();
  }
}
