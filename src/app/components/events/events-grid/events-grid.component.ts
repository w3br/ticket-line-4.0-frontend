import {Component, EventEmitter, Input, Output} from '@angular/core';
import {EventSearchResult} from "../../../dtos/event-search-result";
import {EventCardComponent} from "../event-card/event-card.component";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-events-grid',
  imports: [
    EventCardComponent, CommonModule
  ],
  templateUrl: './events-grid.component.html',
  styleUrl: './events-grid.component.scss',
  standalone: true
})
export class EventsGridComponent {

  @Input() events: EventSearchResult[] = [];
  @Output() eventDeleted = new EventEmitter<number>();

}
