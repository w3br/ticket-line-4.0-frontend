import {NgModule} from '@angular/core';
import {mapToCanActivate, RouterModule, Routes} from '@angular/router';
import {HomeComponent} from './components/home/home.component';
import {LoginComponent} from './components/login/login.component';
import {AuthGuard} from './guards/auth.guard';
import {RegistrationComponent} from "./components/registration/registration.component";
import {UserviewComponent} from './components/admin/userview/userview.component';
import { CreateUserComponent } from './components/admin/create-user/create-user.component';
import {ProfileComponent} from './components/profile/profile.component';
import {NewsCreateEditComponent, NewsCreateEditMode} from "./components/news/news-create-edit/news-create-edit.component";
import {NewsComponent} from "./components/news/news.component";
import {AdminComponent} from "./components/admin/admin.component";
import {SeatingPlanComponent} from "./components/seating-plan/seating-plan.component";
import {EventsSearchComponent} from "./components/events/events-search/events-search.component";
import {EventsShellComponent} from "./components/events/events-shell/events-shell.component";
import {
  EventsSearchResultsComponent
} from "./components/events/events-search-results.component/events-search-results.component";
import {CreateEventComponent} from "./components/admin/create-event/create-event.component";
import {CartCheckoutComponent} from "./components/cart-checkout/cart-checkout.component";
import {OrderOverviewComponent} from "./components/order-overview/order-overview.component";
import {NewsDetailComponent} from "./components/news/news-detail/news-detail.component";
import {ResetPasswordComponent} from "./components/reset-password/reset-password.component";
import {AdminResetPasswordComponent} from "./components/admin-reset-password/admin-reset-password.component";
import {RewardListComponent} from "./components/rewards/reward-list.component";
import {CreateMerchandiseComponent} from "./components/admin/create-merch/create-merchandise.component";
import {EventDetailsComponent} from "./components/events/event-details/event-details.component";

const routes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'login', component: LoginComponent},
  {path: 'register', component: RegistrationComponent},
  {path: 'reset/:token', component: ResetPasswordComponent},
  {path: 'admin', canActivate: mapToCanActivate([AuthGuard]), component: AdminComponent, children: [
      {path: '', canActivate: mapToCanActivate([AuthGuard]), component: UserviewComponent},
      {path: 'createNews', canActivate: mapToCanActivate([AuthGuard]), component: NewsCreateEditComponent, data: {mode: NewsCreateEditMode.create}},
      {path: 'createUser', canActivate: mapToCanActivate([AuthGuard]), component: CreateUserComponent},
      {path: 'createEvent', canActivate: mapToCanActivate([AuthGuard]), component: CreateEventComponent},
      {path: 'createEvent/:id/edit', canActivate: mapToCanActivate([AuthGuard]), component: CreateEventComponent},
      {path: 'createMerchandise', canActivate: mapToCanActivate([AuthGuard]), component: CreateMerchandiseComponent},
      {path: 'createMerchandise/:id/edit', component: CreateMerchandiseComponent}
    ]
  },
  {path: 'profile', canActivate: mapToCanActivate([AuthGuard]), component: ProfileComponent},
  { path: 'news', canActivate: mapToCanActivate([AuthGuard]), children: [
      { path: '', redirectTo: 'unread', pathMatch: 'full' },

      { path: 'unread', component: NewsComponent, data: { mode: 'unread' } },
      { path: 'read', component: NewsComponent, data: { mode: 'read' } },

      { path: ':id', component: NewsDetailComponent },
    ]},
  {path: 'reset-password', component: AdminResetPasswordComponent},
  {
    path: 'events', canActivate: mapToCanActivate([AuthGuard]), component: EventsShellComponent, children: [
      {path: 'search', canActivate: mapToCanActivate([AuthGuard]), component: EventsSearchComponent},
      {path: 'search-results', canActivate: mapToCanActivate([AuthGuard]), component: EventsSearchResultsComponent},
      {path: ':id', canActivate: mapToCanActivate([AuthGuard]), component: EventDetailsComponent},
      {path: ':eventId', canActivate: mapToCanActivate([AuthGuard]), children: [
          {path: 'performances', canActivate: mapToCanActivate([AuthGuard]) ,children: [

            ]}
        ]}
    ]},
  {path: 'orders', canActivate: mapToCanActivate([AuthGuard]), component: OrderOverviewComponent},
  {path: 'cart-checkout', canActivate: mapToCanActivate([AuthGuard]) ,component: CartCheckoutComponent},
  {path: 'performances/:performanceId/seating-plan', canActivate: mapToCanActivate([AuthGuard]) ,component: SeatingPlanComponent},
  {path: 'rewards', canActivate: mapToCanActivate([AuthGuard]), component: RewardListComponent}


];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
