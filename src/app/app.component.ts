import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent {
  title = 'Ticketline';
  hideHeader = false;
  isFullBleed = false;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const url = e.urlAfterRedirects || e.url;
        this.hideHeader = ['/', '/login', '/register'].includes(url) || url.startsWith('/reset/');
        this.isFullBleed = url === '/' || url.startsWith('/home');        this.isFullBleed = e.urlAfterRedirects === '/' || e.urlAfterRedirects.startsWith('/home');
      });
  }
}
