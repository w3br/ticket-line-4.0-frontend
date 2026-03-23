import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { EventsService } from '../../../services/events.service';
import { PerformanceService } from '../../../services/performence.service';
import { EventDetailDto } from '../../../dtos/event-detail';
import { PerformanceSearchResult } from '../../../dtos/performance-search-result';
import { Router } from '@angular/router';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './event-details.component.html',
  styleUrl: './event-details.component.scss'
})
export class EventDetailsComponent implements OnInit {
  event: EventDetailDto | undefined;
  performances: PerformanceSearchResult[] = [];
  isLoading = true;
  error: string | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventsService: EventsService,
    private performanceService: PerformanceService,
    private location: Location
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchEventDetails(+id);
    } else {
      this.error = 'No event ID provided';
      this.isLoading = false;
    }
  }

  goBack(): void {
    this.location.back();
  }

  goToSeatingPlan(performanceId: number): void {
    this.router.navigate([
      '/performances',
      performanceId,
      'seating-plan'
    ]);
  }

  fetchEventDetails(id: number): void {
    this.isLoading = true;
    this.eventsService.getEventById(id).subscribe({
      next: (event) => {
        this.event = event;
        this.fetchPerformances(id);
      },
      error: (err) => {
        console.error('Error fetching event details', err);
        this.error = 'Could not load event details. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  fetchPerformances(eventId: number): void {
    this.performanceService.searchPerformances({ eventId }).subscribe({
      next: (performances) => {
        this.performances = performances;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching performances', err);
        this.error = 'Could not load performances. Please try again later.';
        this.isLoading = false;
      }
    });
  }
}
