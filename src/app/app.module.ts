import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {HeaderComponent} from './components/header/header.component';
import {FooterComponent} from './components/footer/footer.component';
import {HomeComponent} from './components/home/home.component';
import {LoginComponent} from './components/login/login.component';
import {MessageComponent} from './components/message/message.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {httpInterceptorProviders} from './interceptors';
import {NewsCreateEditComponent} from "./components/news/news-create-edit/news-create-edit.component";
import {ToastrModule} from 'ngx-toastr';
import {NewsComponent} from "./components/news/news.component";
import {RegistrationComponent} from "./components/registration/registration.component";
import {NewsDetailComponent} from "./components/news/news-detail/news-detail.component";
import {OrderOverviewComponent} from "./components/order-overview/order-overview.component";
import {ConfirmDeleteDialogComponent} from "./components/confirm-delete-dialog/confirm-delete-dialog.component";


@NgModule({ declarations: [
        AppComponent,
        HeaderComponent,
        FooterComponent,
        LoginComponent,
        MessageComponent,
        NewsCreateEditComponent,
        NewsComponent,
        NewsDetailComponent,
        OrderOverviewComponent,
    ],
    bootstrap: [AppComponent],
    imports: [BrowserModule,
        AppRoutingModule,
        ReactiveFormsModule,
        NgbModule,
        FormsModule,
        RegistrationComponent,
        HomeComponent,
        BrowserAnimationsModule,
        ToastrModule.forRoot({
            timeOut: 3000,
            positionClass: 'toast-bottom-left',
            preventDuplicates: true
        }), ConfirmDeleteDialogComponent
    ], providers: [httpInterceptorProviders, provideHttpClient(withInterceptorsFromDi())] })
export class AppModule {
}
