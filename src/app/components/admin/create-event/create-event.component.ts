import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from "ngx-toastr";
import { NgbModal, NgbTypeahead } from "@ng-bootstrap/ng-bootstrap";
import { Event as EventDto } from "../../../dtos/event";
import { EventsService } from "../../../services/events.service";
import { EventEnums } from "../../../dtos/event-enums";
import { CommonModule } from "@angular/common";
import { HallService } from "../../../services/hall.service";
import { HallSuggestion } from "../../../dtos/hall-suggestion";
import { PerformanceCreate } from "../../../dtos/performance";
import { ArtistService } from "../../../services/artist.service";
import { Observable, OperatorFunction, Subject, merge } from "rxjs";
import { debounceTime, distinctUntilChanged, switchMap, catchError, map, filter } from "rxjs/operators";


export enum NewsCreateEditMode {
  create
}

@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    NgbTypeahead
  ]
})
export class CreateEventComponent implements OnInit {

  private readonly MAX_IMAGE_SIZE_BYTES = 1024 * 1024; // 1 MB

  event: EventDto = {
    title: '',
    description: '',
    image: '',
    performances: null,
    artistId: null,
    category: null,
    type: null,
  }

  eventTypes: EventEnums[] = [];
  eventCategories: EventEnums[] = [];
  halls: HallSuggestion[] = [];
  performances: PerformanceCreate[] = [];
  selectedArtists: string[] = [];
  artistInputModel: any;

  selectedFiles: File[] | null = null;
  selectedFilesPreview: string[] = [];

  isSubmitting = false;
  mode: NewsCreateEditMode = NewsCreateEditMode.create;
  eventId: number | undefined;

  @ViewChild('instance', { static: true }) instance: NgbTypeahead;
  focus$ = new Subject<string>();
  click$ = new Subject<string>();

  constructor(private eventsService: EventsService,
    private modalService: NgbModal,
    private cd: ChangeDetectorRef,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private notification: ToastrService,
    private hallService: HallService,
    private artistService: ArtistService) {
  }

  // Typeahead search function
  search: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) => {
    const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
    const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this.instance.isPopupOpen()));
    const inputFocus$ = this.focus$;

    return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
      switchMap(term => {
        if (term.length < 2) {
          return [[]]; // Don't search for short terms
        }
        return this.artistService.suggestArtists(term).pipe(
          map(artists => artists.map(a => a.name)),
          catchError(() => [[]])
        );
      })
    );
  };

  formatter = (x: string) => x;

  onArtistSelect(event: any): void {
    event.preventDefault();
    const artistName = event.item;
    this.addArtist(artistName);
    this.artistInputModel = ''; // Clear input
  }

  addArtist(name: string): void {
    const trimmedName = name.trim();
    if (trimmedName && !this.selectedArtists.includes(trimmedName)) {
      this.selectedArtists.push(trimmedName);
    }
    this.artistInputModel = '';
  }

  removeArtist(index: number): void {
    this.selectedArtists.splice(index, 1);
  }

  onArtistEnter(event: Event): void {
    event.preventDefault();
    if (this.artistInputModel) {
      this.addArtist(this.artistInputModel);
    }
  }

  isAdmin(): boolean {
    return this.authService.getUserRole() === 'ADMIN';
  }

  ngOnInit(): void {
    if (!this.isAdmin()) {
      this.router.navigate(['/events']);
      return;
    }
    this.loadEnums();
    this.hallService.getAllHalls().subscribe(halls => {
      this.halls = halls;
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.eventId = Number(id);
        if (this.eventId) {
          this.loadEventForEdit(this.eventId);
        }
      }
    });
  }

  loadEventForEdit(id: number): void {
    this.eventsService.getEventById(id).subscribe({
      next: (event) => {
        this.event.title = event.title;
        this.event.description = event.description;
        this.event.type = event.type as any;
        this.event.category = event.category as any;
        this.selectedFilesPreview = event.imageUrl ? [event.imageUrl] : [];

        if (event.artists) {
          this.selectedArtists = event.artists.map(a => a.name);
        }
      },
      error: err => {
        this.notification.error('Failed to load event details', 'Error');
        this.router.navigate(['/admin']);
      }
    });
  }


  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.selectedFiles = null;
      this.selectedFilesPreview = [];
      return;
    }

    const allFiles = Array.from(input.files);
    const validFiles: File[] = [];
    const rejectedFiles: string[] = [];

    for (const file of allFiles) {
      if (file.size > this.MAX_IMAGE_SIZE_BYTES) {
        rejectedFiles.push(
          `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
        );
      } else {
        validFiles.push(file);
      }
    }

    if (rejectedFiles.length > 0) {
      this.notification.error(
        `The following files are larger than 1 MB and were ignored:\n${rejectedFiles.join('\n')}`,
        'File too large'
      );
    }

    if (validFiles.length === 0) {
      this.selectedFiles = null;
      this.selectedFilesPreview = [];
      input.value = '';
      return;
    }

    this.selectedFiles = validFiles;
    this.selectedFilesPreview = [];

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        this.selectedFilesPreview.push((e.target as FileReader).result as string);
        this.cd.detectChanges();
      };
      reader.readAsDataURL(file);
    });
  }

  onSubmit(form: NgForm): void {
    if (form.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    const files = this.selectedFiles ?? undefined;

    // Filter and validate performances - only include valid ones
    const validPerformances: PerformanceCreate[] = this.performances
      .filter(p => {
        const hallId = Number(p.hallId);
        return hallId && hallId > 0 && p.startTime && p.startTime.trim() !== '';
      })
      .map((p): PerformanceCreate | null => {
        // Ensure date format is ISO-compliant (add seconds if missing)
        let startTime = p.startTime.trim();
        // datetime-local produces "YYYY-MM-DDTHH:mm", but Spring might need "YYYY-MM-DDTHH:mm:ss"
        if (!startTime.includes(':')) {
          // Invalid format - skip this performance
          return null;
        }
        // If format is "YYYY-MM-DDTHH:mm", add ":00" for seconds
        if (startTime.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
          startTime = startTime + ':00';
        }

        let endTime: string | undefined = p.endTime && p.endTime.trim() !== '' ? p.endTime.trim() : undefined;
        if (endTime && endTime.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
          endTime = endTime + ':00';
        }

        const result: PerformanceCreate = {
          hallId: Number(p.hallId),
          startTime: startTime
        };
        if (endTime) {
          result.endTime = endTime;
        }
        return result;
      })
      .filter((p): p is PerformanceCreate => p !== null);

    // Use selectedArtists array directly
    let artistNames: string[] | undefined = undefined;
    if (this.selectedArtists.length > 0) {
      artistNames = this.selectedArtists;
    }


    // Create event data with performances
    const eventCreate: any = {
      title: this.event.title,
      description: this.event.description,
      type: this.event.type,
      category: this.event.category,
      performances: validPerformances.length > 0 ? validPerformances : undefined,
      artistNames: artistNames
    };

    // Only include image if it's not empty
    if (this.event.image && this.event.image.trim() !== '') {
      eventCreate.image = this.event.image;
    }

    let request$;
    if (this.eventId) {
      request$ = this.eventsService.update(this.eventId, eventCreate, files);
    } else {
      request$ = this.eventsService.create(eventCreate, files);
    }

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.notification.success(
          'Success'
        );
        this.router.navigate(['/admin']);
      },
      error: err => {
        const msg = err?.error?.message;
        const details: string[] = err?.error?.details ?? [];
        console.error('Event creation error:', err);
        console.error('Error response:', err?.error);
        console.error('Event data sent:', eventCreate);
        this.notification.error(details.length ? details.join('\n') : msg || 'Failed to create event', msg || 'Error');
        this.isSubmitting = false;
      }
    });
  }

  addPerformance(): void {
    this.performances.push({
      hallId: 0,
      startTime: '',
      endTime: ''
    });
  }

  removePerformance(index: number): void {
    this.performances.splice(index, 1);
  }

  removeSelectedImage(index: number): void {
    this.selectedFilesPreview.splice(index, 1);

    if (this.selectedFiles) {
      const files = [...this.selectedFiles];
      files.splice(index, 1);
      this.selectedFiles = files.length ? files : null;
    }

    if (!this.selectedFilesPreview.length) {
      this.selectedFiles = null;
    }

    this.cd.detectChanges();
  }

  private loadEnums(): void {
    this.eventsService.getEventTypes().subscribe({
      next: types => this.eventTypes = types,
      error: err => console.error('Failed to load event types', err)
    });

    this.eventsService.getEventCategories().subscribe({
      next: categories => this.eventCategories = categories,
      error: err => console.error('Failed to load event categories', err)
    });
  }

}
