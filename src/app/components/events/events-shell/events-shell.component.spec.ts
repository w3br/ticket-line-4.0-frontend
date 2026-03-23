import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventsShellComponent } from './events-shell.component';

describe('EventsShellComponent', () => {
  let component: EventsShellComponent;
  let fixture: ComponentFixture<EventsShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventsShellComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventsShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
