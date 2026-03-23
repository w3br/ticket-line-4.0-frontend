import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventsGridComponent } from '../events-grid/events-grid.component';
import { EventsService } from '../../../services/events.service';


import { EventSearchResult } from '../../../dtos/event-search-result';

import {EventSearchQueryDto} from "../../../dtos/event-search-query";
import {PerformanceSearchResult} from "../../../dtos/performance-search-result";
import {PerformanceService} from "../../../services/performence.service";
import {ActivatedRoute, Router} from "@angular/router";
import {PerformanceCardComponent} from "../performance-card/performance-card.component";
import {EventCardComponent} from "../event-card/event-card.component";


@Component({
  selector: 'app-events-search-results',
  standalone: true,
  imports: [CommonModule, EventsGridComponent, PerformanceCardComponent],
  templateUrl: './events-search-results.component.html',
  styleUrls: ['./events-search-results.component.scss']
})
export class EventsSearchResultsComponent implements OnInit {

  events: EventSearchResult[] = [];
  performances: PerformanceSearchResult[] = [];

  pagedEvents: EventSearchResult[] = [];
  currentEventPage = 1;
  totalEventPages = 0;
  visibleEventPages: Array<number | "..."> = [];

  pagedPerformances: PerformanceSearchResult[] = [];
  currentPerformancePage = 1;
  totalPerformancePages = 0;
  visiblePerformancePages: Array<number | "..."> = [];

  entriesPerPage: number = 9;

  search = '';
  artistId?: number;
  activeEventFilters: EventSearchQueryDto = {};

  activePerformanceFilters: {
    search?: string;
    venueId?: number;
    venueLabel?: string;
    artistId?: number;
    artistName?: string;
    from?: string;
    to?: string;
    minPrice?: number;
    maxPrice?: number;
  } = {};

  isLoading = false;
  hasSearched = false;
  isPerformanceMode = false;


  constructor(private eventService: EventsService,
              private performanceService: PerformanceService,
              private router: Router,
              private route: ActivatedRoute){}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {

      const venueId = params['venueId']
        ? Number(params['venueId'])
        : undefined;

      const venueLabel = params['venueLabel'] ?? undefined;

    const from = params['from'] ?? undefined;
    const to = params['to'] ?? undefined;

    const minPrice = params['minPrice'] ? Number(params['minPrice']) : undefined;
    const maxPrice = params['maxPrice'] ? Number(params['maxPrice']) : undefined;

    const hasVenueFilter = venueId !== undefined || (venueLabel && venueLabel.trim().length > 0);
    const hasDateFilter = (from && from.trim().length > 0) || (to && to.trim().length > 0);
    const hasPriceFilter = minPrice !== undefined || maxPrice !== undefined;
    this.isPerformanceMode = hasVenueFilter || hasDateFilter || hasPriceFilter;

    this.hasSearched = Object.keys(params).length > 0;

    if (this.isPerformanceMode) {
      this.activePerformanceFilters = {
        search: params['search'] ?? undefined,
        venueId: venueId,
        venueLabel: venueLabel,
        artistId: params['artistId']
          ? Number(params['artistId'])
          : undefined,
        artistName: params['artistName'] ?? undefined,
        from: params['from'] ?? undefined,
        to: params['to'] ?? undefined,
        minPrice: minPrice,
        maxPrice: maxPrice
      };

        this.loadPerformances();
      } else {
        this.activeEventFilters = {
          text: params['search'] ?? undefined,
          artistId: params['artistId']
            ? Number(params['artistId'])
            : undefined,
          artistName: params['artistName'] ?? undefined
        };
        this.loadEvents();
      }
    });
  }

  private loadEvents(): void {
    this.isLoading = true;

    this.eventService.searchEvents(this.activeEventFilters).subscribe({
      next: events => {
        this.events = events;
        this.isLoading = false;
        this.applyEventFilters();
      },
      error: () => {
        this.events = [];
        this.isLoading = false;
      }
    });
  }

  applyEventFilters(): void {
    this.totalEventPages = Math.max(1, Math.ceil(this.events.length / this.entriesPerPage));
    this.currentEventPage = Math.min(this.currentEventPage, this.totalEventPages);
    const start = (this.currentEventPage - 1) * this.entriesPerPage;
    this.pagedEvents = this.events.slice(start, start + this.entriesPerPage);
    this.visibleEventPages = this.getCompactPages(this.currentEventPage, this.totalEventPages);
  }

  goToEventPage(page: number): void {
    this.currentEventPage = page;
    this.applyEventFilters();
  }

  prevEventPage(): void {
    if (this.currentEventPage > 1) {
      this.currentEventPage--;
      this.applyEventFilters();
    }
  }

  nextEventPage(): void {
    if (this.currentEventPage < this.totalEventPages) {
      this.currentEventPage++;
      this.applyEventFilters();
    }
  }

  private loadPerformances(): void {
    this.isLoading = true;

    this.performanceService.searchPerformances(this.activePerformanceFilters).subscribe({
      next: performances => {
        this.performances = performances;
        this.events = [];
        this.isLoading = false;
        this.applyPerformanceFilters();
      },
      error: () => {
        this.performances = [];
        this.isLoading = false;
      }
    });
  }

  applyPerformanceFilters(): void {
    this.totalPerformancePages = Math.max(1, Math.ceil(this.performances.length / this.entriesPerPage));
    this.currentPerformancePage = Math.min(this.currentPerformancePage, this.totalPerformancePages);
    const start = (this.currentPerformancePage - 1) * this.entriesPerPage;
    this.pagedPerformances = this.performances.slice(start, start + this.entriesPerPage);
    this.visiblePerformancePages = this.getCompactPages(this.currentPerformancePage, this.totalPerformancePages);
  }

  goToPerformancePage(page: number): void {
    this.currentPerformancePage = page;
    this.applyPerformanceFilters();
  }

  prevPerformancePage(): void {
    if (this.currentPerformancePage > 1) {
      this.currentPerformancePage--;
      this.applyPerformanceFilters();
    }
  }

  nextPerformancePage(): void {
    if (this.currentPerformancePage < this.totalPerformancePages) {
      this.currentPerformancePage++;
      this.applyPerformanceFilters();
    }
  }

  goBackToSearch(): void {
    this.router.navigate(['/events/search'], {
      queryParams: this.route.snapshot.queryParams
    });
  }

  hasAnyFilters(): boolean {
    const filters = this.isPerformanceMode
      ? this.activePerformanceFilters
      : this.activeEventFilters;

    return Object.values(filters).some(v => v !== undefined);
  }

  clearFilters(): void {
    this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams: {},
        queryParamsHandling: 'replace'
      }
    );
  }

  removeFilter(filterKeys: string | string[]): void {
    const queryParams = { ...this.route.snapshot.queryParams };
    const keys = Array.isArray(filterKeys) ? filterKeys : [filterKeys];

    keys.forEach(key => {
      delete queryParams[key];
    });

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'replace'
    });
  }

  get selectedArtistName(): string | undefined {
    if (this.activeEventFilters.artistId !== undefined && this.events.length > 0) {
      return this.events[0]?.artistName ?? undefined;
    }
    return undefined;
  }


  goToPerformance(p: PerformanceSearchResult): void {
    this.router.navigate([
      '/performances',
      p.performanceId,
      'seating-plan'
    ]);
  }

  getCompactPages(current: number, total: number): Array<number | '...'> {
    if (total <= 1) return [1];

    const pages: Array<number | '...'> = [1];

    const start = Math.max(2, current - 1);
    const end   = Math.min(total - 1, current + 1);

    if (start > 2) pages.push('...');

    for (let p = start; p <= end; p++) pages.push(p);

    if (end < total - 1) pages.push('...');

    if (total > 1) pages.push(total);

    return pages;
  }
  onEventDeleted(deletedId: number) {
    this.events = this.events.filter(e => e.id !== deletedId);
    this.applyEventFilters();
  }

}
