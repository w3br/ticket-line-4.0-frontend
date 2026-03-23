import { Component, OnInit } from '@angular/core';
import {EventSearchResult} from "../../../dtos/event-search-result";
import {EventsService} from "../../../services/events.service";
import {FormsModule} from "@angular/forms";
import {ActivatedRoute, Router, RouterModule} from "@angular/router";
import {CommonModule} from "@angular/common";
import {EventCardComponent} from "../event-card/event-card.component";
import {ArtistService} from "../../../services/artist.service";
import { ArtistSuggestion } from '../../../dtos/artist-suggestion';
import {VenueSuggestion} from "../../../dtos/venue-suggestion";
import {VenueService} from "../../../services/venue.service";
import {ToastrService} from "ngx-toastr";
import {EventEnums} from "../../../dtos/event-enums";

@Component({
  selector: 'app-events',
  imports: [
    FormsModule,
    CommonModule,
    RouterModule,
    EventCardComponent,
  ],
  templateUrl: './events-search.component.html',
  styleUrl: './events-search.component.scss',
})
export class EventsSearchComponent implements OnInit {

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private artistService: ArtistService,
    private venueService: VenueService,
    private eventsService: EventsService,
    private toastr: ToastrService) {}

  ngOnInit(): void {
    this.initTopEventsDefaults();
    this.loadTopEvents();
    this.loadCategories();
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchText = params['search'];
      }
      if (params['artistId']) {
        this.selectedArtistId = Number(params['artistId']);
      }
      if (params['artistName']) {
        this.artistInput = params['artistName'];
        this.selectedArtistName = params['artistName'];
      }
      if (params['venueId']) {
        this.selectedVenueId = Number(params['venueId']);
      }
      if (params['venueLabel']) {
        this.venueInput = params['venueLabel'];
        this.selectedVenueLabel = params['venueLabel'];
      }
      if (params['from']) {
        this.dateFrom = params['from'];
      }
      if (params['dateFrom']) { // For Event search compatibility
        this.dateFrom = params['dateFrom'];
      }
      if (params['to']) {
        this.dateTo = params['to'];
      }
      if (params['dateTo']) { // For Event search compatibility
        this.dateTo = params['dateTo'];
      }
      if (params['minPrice']) {
        this.minPrice = Number(params['minPrice']);
      }
      if (params['maxPrice']) {
        this.maxPrice = Number(params['maxPrice']);
      }
    });
  }

  searchText = '';

  artistInput = '';
  artistSuggestions: ArtistSuggestion[] = [];
  selectedArtistId?: number;
  selectedArtistName?: string;

  venueInput = '';
  venueSuggestions: VenueSuggestion[] = [];
  selectedVenueId?: number;
  selectedVenueLabel?: string;

  dateFrom?: any;
  dateTo?: any;

  minPrice?: number;
  maxPrice?: number;

  artistDropdownOpen = false;
  venueDropdownOpen = false;

  topMonth = '';
  maxMonth = '';
  topCategory = 'ALL';
  topEvents: EventSearchResult[] = [];
  topEventsLoading = false;
  categories: EventEnums[] = [];

  readonly TOP_EVENTS_SIZE = 10;

  private initTopEventsDefaults(): void {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    this.topMonth = `${year}-${month.toString().padStart(2, '0')}`;
    this.maxMonth = this.topMonth;
  }

  loadTopEvents(): void {
    if (this.topMonth > this.maxMonth) {
      this.toastr.error('Cannot select a future month for top events.', 'Error');
      this.topMonth = this.maxMonth;
      return;
    }
    this.topEventsLoading = true;
    const monthToSend = this.topMonth || '';
    this.eventsService.getTopEvents(monthToSend, this.topCategory).subscribe({
      next: (events) => {
        this.topEvents = events.map(e => ({
          id: e.eventId,
          eventId: e.eventId,
          title: e.title,
          description: '',
          type: e.category,
          imageUrl: e.imageUrl,
          performanceCount: e.performanceCount || 0
        }));
        this.topEventsLoading = false;
      },
      error: (err) => {
        console.error('Error loading top events', err);
        this.topEvents = [];
        this.topEventsLoading = false;
      }
    });
  }

  loadCategories(): void {
    this.eventsService.getEventCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => {
        console.error('Error loading categories', err);
      }
    });
  }

  onTopFilterChange(): void {
    this.loadTopEvents();
  }

  onSearch(): void {

    this.syncArtistSelectionFromInput();
    this.syncVenueSelectionFromInput();

    const venueLabelToSend = this.selectedVenueId
      ? this.selectedVenueLabel
      : (this.venueInput.trim() || null);

    const artistNameToSend = this.selectedArtistId
      ? this.selectedArtistName
      : (this.artistInput.trim() || null);

    const MAX_LENGTH = 100;
    const MIN_LENGTH = 2;

    if (this.searchText) {
      if (this.searchText.length > MAX_LENGTH) {
        this.toastr.error('Search text is too long (max ' + MAX_LENGTH + ' characters).', 'Search Error');
        return;
      }
      if (this.searchText.length > 0 && this.searchText.length < MIN_LENGTH) {
        this.toastr.error('Search text is too short (min ' + MIN_LENGTH + ' characters).', 'Search Error');
        return;
      }
    }

    if (artistNameToSend) {
      if (artistNameToSend.length > MAX_LENGTH) {
        this.toastr.error('Artist name is too long (max ' + MAX_LENGTH + ' characters).', 'Search Error');
        return;
      }
      if (artistNameToSend.length > 0 && artistNameToSend.length < MIN_LENGTH) {
        this.toastr.error('Artist name is too short (min ' + MIN_LENGTH + ' characters).', 'Search Error');
        return;
      }
    }

    if (venueLabelToSend) {
      if (venueLabelToSend.length > MAX_LENGTH) {
        this.toastr.error('Venue name is too long (max ' + MAX_LENGTH + ' characters).', 'Search Error');
        return;
      }
      if (venueLabelToSend.length > 0 && venueLabelToSend.length < MIN_LENGTH) {
        this.toastr.error('Venue name is too short (min ' + MIN_LENGTH + ' characters).', 'Search Error');
        return;
      }
    }

    const hasVenueFilter = !!(this.selectedVenueId || (venueLabelToSend && venueLabelToSend.trim().length > 0));
    const hasPriceFilter = (this.minPrice !== undefined && this.minPrice !== null) || (this.maxPrice !== undefined && this.maxPrice !== null);
    const hasDateFilter =
      !!(this.dateFrom || this.dateTo);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (this.dateFrom) {
      const fromDate = new Date(this.dateFrom);
      if (fromDate < today) {
        this.toastr.error('"From" date cannot be in the past.', 'Search Error');
        return;
      }
    }

    if (this.dateTo) {
      const toDate = new Date(this.dateTo);
      if (toDate < today) {
        this.toastr.error('"To" date cannot be in the past.', 'Search Error');
        return;
      }
    }

    if (this.dateFrom && this.dateTo && new Date(this.dateFrom) > new Date(this.dateTo)) {
      this.toastr.error('"From" date must be before or equal to "To" date.', 'Search Error');
      return;
    }

    if (this.minPrice !== undefined && this.minPrice !== null && isNaN(this.minPrice)) {
      this.toastr.error('Min Price must be a valid number.', 'Search Error');
      return;
    }

    if (this.maxPrice !== undefined && this.maxPrice !== null && isNaN(this.maxPrice)) {
      this.toastr.error('Max Price must be a valid number.', 'Search Error');
      return;
    }

    if (this.minPrice !== undefined && this.minPrice !== null && this.minPrice < 0) {
      this.toastr.error('Min Price cannot be negative.', 'Search Error');
      return;
    }

    if (this.maxPrice !== undefined && this.maxPrice !== null && this.maxPrice < 0) {
      this.toastr.error('Max Price cannot be negative.', 'Search Error');
      return;
    }

    if (this.minPrice !== undefined && this.minPrice !== null && this.maxPrice !== undefined && this.maxPrice !== null && this.minPrice > this.maxPrice) {
      this.toastr.error('Min Price must be less than or equal to Max Price.', 'Search Error');
      return;
    }

    const shouldSearchPerformances = hasVenueFilter || hasDateFilter || hasPriceFilter;


    if (shouldSearchPerformances) {
      this.router.navigate(['/events/search-results'], {
        queryParams: {
          search: this.searchText || null,

          venueId: this.selectedVenueId || null,
          venueLabel: venueLabelToSend,

          artistId: this.selectedArtistId || null,
          artistName: artistNameToSend,

          from: this.dateFrom || null,
          to: this.dateTo || null,
          dateFrom: this.dateFrom || null,
          dateTo: this.dateTo || null,

          minPrice: (this.minPrice !== undefined && this.minPrice !== null) ? this.minPrice : null,
          maxPrice: (this.maxPrice !== undefined && this.maxPrice !== null) ? this.maxPrice : null,
        }
      });
      return;
    }


    this.router.navigate(['/events/search-results'], {
      queryParams: {
        search: this.searchText || null,
        artistId: this.selectedArtistId || null,
        artistName: (this.selectedArtistId ? this.selectedArtistName : (this.artistInput.trim() || null)),
        dateFrom: this.dateFrom || null, // Added for consistency
        dateTo: this.dateTo || null      // Added for consistency
      }
    });
  }


  onArtistInputChange(value: string): void {
    this.artistInput = value;

    this.selectedArtistId = undefined;
    this.selectedArtistName = undefined;

    if (!value || value.trim().length === 0) {
      this.artistSuggestions = [];
      this.artistDropdownOpen = false;
      return;
    }

    this.artistDropdownOpen = true;
    this.artistService.suggestArtists(value).subscribe(suggestions => {
      this.artistSuggestions = suggestions;
    });
  }

  onArtistBlur(): void {
    const match = this.artistSuggestions.find(
      a => a.name.toLowerCase() === this.artistInput.toLowerCase()
    );

    this.selectedArtistId = match?.id;
    this.selectedArtistName = match?.name;
    console.log('artist blur:', this.selectedArtistId, this.selectedArtistName);
  }

  onVenueInputChange(value: string): void {
    this.venueInput = value;
    this.selectedVenueId = undefined;
    this.selectedVenueLabel = undefined;

    if (!value || value.trim().length === 0) {
      this.venueSuggestions = [];
      this.venueDropdownOpen = false;
      return;
    }

    this.venueDropdownOpen = true;
    this.venueService.suggestVenues(value).subscribe(suggestions => {
      this.venueSuggestions = suggestions;
    });
  }


  onVenueBlur(): void {
    const match = this.venueSuggestions.find(
      v => v.label.toLowerCase() === this.venueInput.toLowerCase()
    );

    this.selectedVenueId = match?.id;
    this.selectedVenueLabel = match?.label;
  }


  private syncArtistSelectionFromInput(): void {
    if (this.artistSuggestions.length > 0) {
      const match = this.artistSuggestions.find(
        a => a.name.toLowerCase() === this.artistInput.toLowerCase()
      );

      this.selectedArtistId = match?.id;
      this.selectedArtistName = match?.name;
    }
  }

  private syncVenueSelectionFromInput(): void {
    // Only sync if we actually have suggestions to sync from.
    // If the list is empty (e.g. after back-navigation), don't sync.
    if(this.venueSuggestions.length > 0) {
      const match = this.venueSuggestions.find(
        v => v.label.toLowerCase() === this.venueInput.toLowerCase()
      );

      this.selectedVenueId = match?.id;
      this.selectedVenueLabel = match?.label;
    }
  }

/*
Dropdowns
 */

  onArtistFocus(): void {
    this.artistDropdownOpen = true;
  }

  onVenueFocus(): void {
    this.venueDropdownOpen = true;
  }

  selectArtist(a: ArtistSuggestion): void {
    this.artistInput = a.name;
    this.selectedArtistId = a.id;
    this.selectedArtistName = a.name;
    this.artistDropdownOpen = false;
  }

  selectVenue(v: VenueSuggestion): void {
    this.venueInput = v.label;
    this.selectedVenueId = v.id;
    this.selectedVenueLabel = v.label;
    this.venueDropdownOpen = false;
  }

  clearSearchText(): void {
    this.searchText = '';
  }

  clearArtist(): void {
    this.artistInput = '';
    this.selectedArtistId = undefined;
    this.selectedArtistName = undefined;
    this.artistSuggestions = [];
    this.artistDropdownOpen = false;
  }

  clearVenue(): void {
    this.venueInput = '';
    this.selectedVenueId = undefined;
    this.selectedVenueLabel = undefined;
    this.venueSuggestions = [];
    this.venueDropdownOpen = false;
  }

  onArtistSuggestionMouseDown(a: ArtistSuggestion, event: MouseEvent): void {
    event.preventDefault();
    this.selectArtist(a);
  }

  onVenueSuggestionMouseDown(v: VenueSuggestion, event: MouseEvent): void {
    event.preventDefault();
    this.selectVenue(v);
  }

}
