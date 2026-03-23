import {Component, EventEmitter, Input, Output} from '@angular/core';
import {EventSearchResult} from "../../../dtos/event-search-result";
import {CommonModule} from "@angular/common";
import {Router, RouterLink} from "@angular/router";
import {AuthService} from "../../../services/auth.service";
import {EventsService} from "../../../services/events.service";
import {ToastrService} from "ngx-toastr";

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.scss',
})

export class EventCardComponent {
  @Input() event!: EventSearchResult;
  @Output() deleted = new EventEmitter<number>();

  eventForDeletion: EventSearchResult | undefined;
  isDeleting = false;


  constructor(private router: Router,
              private authService: AuthService,
              private toastr: ToastrService,
              private eventService: EventsService) {
  }

  goToEventDetails(): void {
    this.router.navigate([
      '/events',
      this.event.id
    ]);
  }

  isAdmin(): boolean {
    return this.authService.getUserRole() === 'ADMIN';
  }

  confirmDelete(event: EventSearchResult | undefined): void {
    if (!event || this.isDeleting) return;

    this.isDeleting = true;

    this.eventService.deleteEvent(event.id).subscribe({
      next: () => {
        this.toastr.success('Event deleted.', 'Events');
        this.eventForDeletion = undefined;
        this.isDeleting = false;

        this.deleted.emit(event.id);
      },
      error: () => {
        this.toastr.error('Failed to delete event.', 'Events');
        this.isDeleting = false;
      }
    });
  }
}
