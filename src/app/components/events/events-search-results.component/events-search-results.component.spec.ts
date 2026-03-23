import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventsSearchResultsComponent } from './events-search-results.component';

describe('EventsSearchResultsComponent', () => {
  let component: EventsSearchResultsComponent;
  let fixture: ComponentFixture<EventsSearchResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventsSearchResultsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventsSearchResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
