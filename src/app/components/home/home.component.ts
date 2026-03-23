import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { animate, style, transition, trigger, keyframes } from '@angular/animations';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [CommonModule, RouterLink],
  standalone: true,
  animations: [
    trigger('introAnim', [
      transition(':enter', [
        animate(
          '2500ms ease-in-out',
          keyframes([
            style({ opacity: 0, transform: 'translateY(8px)', offset: 0 }),
            style({ opacity: 1, transform: 'translateY(0)', offset: 0.25 }),
            style({ opacity: 1, transform: 'translateY(0)', offset: 0.75 }),
            style({ opacity: 0, transform: 'translateY(-6px)', offset: 1 }),
          ])
        ),
      ]),
    ]),

    // Hero: fade in after intro
    trigger('heroAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('1500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class HomeComponent implements OnInit {
  showIntro = true;
  showHero = false;

  ngOnInit(): void {
    setTimeout(() => {
      this.showIntro = false;
      this.showHero = true;
    }, 2500);
  }
}
