import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule, DatePipe} from "@angular/common";
import {PerformanceSearchResult} from "../../../dtos/performance-search-result";
import {Router} from "@angular/router";

@Component({
  selector: 'app-performance-card',
  imports: [CommonModule, DatePipe],
  templateUrl: './performance-card.component.html',
  styleUrl: './performance-card.component.scss',
})
export class PerformanceCardComponent {

  @Input() performance!: PerformanceSearchResult;
  @Input() isDetailView = false;
  @Output() deleted = new EventEmitter<number>();

  constructor(private router: Router) {}

  goToSeatingPlan(): void {
    this.router.navigate([
      '/performances',
      this.performance.performanceId,
      'seating-plan'
    ]);
  }

  goToEvent(): void {
    this.router.navigate([
      '/events',
      this.performance.eventId
    ]);
  }

}
