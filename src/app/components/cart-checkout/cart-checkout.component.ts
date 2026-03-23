import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { CartService } from '../../services/cart.service';
import { CartItemDto } from '../../dtos/cart-item-dto';

import { ProfileService } from '../../services/profile.service';
import { UserProfileDto } from '../../dtos/profile';

import { SeatingPlanService } from '../../services/seating-plan.service';
import { OrderRequest } from '../../dtos/order-request';
import { CombinedOrderRequest } from '../../dtos/combined-order-request';
import { Router } from '@angular/router';

import { ToastrService } from 'ngx-toastr';
import {OrderService} from "../../services/order.service";

@Component({
  selector: 'app-cart-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart-checkout.component.html',
  styleUrl: './cart-checkout.component.scss',
})
export class CartCheckoutComponent implements OnInit {

  countries: { code: string; name: string }[] = [];

  loading = true;
  purchaseInProgress = false;

  // required only if profile is incomplete
  requireFields = true;

  profile: UserProfileDto = new UserProfileDto();

  constructor(
    private cartService: CartService,
    private profileService: ProfileService,
    private seatingPlanService: SeatingPlanService,
    private orderService: OrderService,
    private http: HttpClient,
    private notification: ToastrService,
    private router: Router
  ) {}

  // expose items snapshot for @for rendering without async pipe complexity
  get items(): CartItemDto[] {
    return this.cartService.snapshot;
  }

  ngOnInit(): void {
    // load countries
    this.http.get<{ code: string; name: string }[]>('/assets/countries.json').subscribe({
      next: data => (this.countries = data),
      error: err => console.error('Failed to load countries.json', err)
    });

    // load profile (prefill)
    this.profileService.getProfile().subscribe({
      next: (p) => {
        this.profile = p;
        this.requireFields = !this.isComplete(p);
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        // fallback: user must fill
        this.profile = new UserProfileDto();
        this.requireFields = true;
        this.loading = false;
      }
    });

    // validate cart (remove unavailable items)
    this.cartService.validateAndCleanupCart().subscribe(res => {
      if (res.removedSeats || res.removedStanding || res.removedItems) {
        const parts: string[] = [];
        if (res.removedSeats) parts.push(`${res.removedSeats} seat(s) removed`);
        if (res.removedStanding) parts.push(`${res.removedStanding} standing ticket(s) reduced/removed`);
        if (res.removedItems) parts.push(`${res.removedItems} cart item(s) removed`);
        this.notification.warning(
          `Some tickets in your cart are not available anymore: ${parts.join(', ')}.`,
          'Cart updated'
        );
      }
    });

  }

  // helpers

  remove(itemId: string): void {
    this.cartService.remove(itemId);
  }

  clearCart(): void {
    this.cartService.clear();
  }

  total(): number {
    return this.cartService.total();
  }

  standingSummary(item: CartItemDto): string {
    const entries = Object.entries(item.standingSelected ?? {})
      .map(([sectorId, count]) => ({ sectorId: Number(sectorId), count: Number(count) }))
      .filter(e => e.count > 0);

    if (!entries.length) return '';
    return entries.map(e => `Sector ${e.sectorId} x${e.count}`).join(', ');
  }

  private hasAnyStanding(map: Record<number, number> | undefined): boolean {
    if (!map) return false;
    return Object.values(map).some(v => Number(v) > 0);
  }

  private isComplete(p: UserProfileDto): boolean {
    return !!p.name?.trim()
      && !!p.street?.trim()
      && !!p.city?.trim()
      && !!p.country?.trim();
  }

  async onBuy(form: NgForm): Promise<void> {
    if (this.purchaseInProgress) return;

    const items = this.items;

    if (items.length === 0) {
      this.notification.warning('Your cart is empty.');
      return;
    }

    // address required only when profile incomplete
    if (this.requireFields && form.invalid) {
      form.control.markAllAsTouched();
      this.notification.warning('Please fill in your address information.');
      return;
    }

    // If profile incomplete, persist address before purchasing, else 500 error from backend
    if (this.requireFields) {
      try {
        const updated = await firstValueFrom(this.profileService.updateProfile(this.profile));
        this.profile = Object.assign(new UserProfileDto(), updated);
        this.requireFields = !this.isComplete(this.profile); // should become false
      } catch (err: any) {
        console.error(err);
        const msg = err?.error?.message ?? 'Failed to save profile.';
        const details: string[] = err?.error?.details ?? [];
        this.notification.error(details.length ? details.join('\n') : msg, 'Profile not saved');
        return;
      }
    }


    this.purchaseInProgress = true;

    try {
      const orderRequests: OrderRequest[] = [];

      for (const item of items) {
        const seatIds = item.seatIds ?? [];
        const hasStanding = this.hasAnyStanding(item.standingSelected);

        if (seatIds.length === 0 && !hasStanding && !item.merchandise) {
          // remove empty/invalid items
          this.cartService.remove(item.id);
          continue;
        }

        // prepare order request
        const req: OrderRequest = {
          performanceId: item.performanceId,
          seatIdsToBeOrdered: seatIds,
          numberOfStandingTicketsToBeOrdered: item.standingSelected ?? {},
          reservationCodes: item.reservationCodes ?? [],
          merchandiseId: item.merchandise?.id,
          quantity: 1, // rewards are added one by one in current frontend logic
          purchasedWithPoints: item.paidWithRewardPoints
        };
        orderRequests.push(req);
      }

      if (orderRequests.length === 0) {
        this.purchaseInProgress = false;
        return;
      }

      const combinedReq: CombinedOrderRequest = {
        items: orderRequests
      };

      console.log('Purchasing combined order', combinedReq);
      const res = await firstValueFrom(this.orderService.purchaseCombined(combinedReq));

      this.notification.success(
        `Order #${res.orderId} • Total: ${res.total} €`,
        'Purchase successful'
      );

      this.cartService.clear();
      this.notification.success('All cart items purchased.', 'Done');
      this.router.navigate(['/orders']);

    } catch (err: any) {
      const msg = err?.error?.message ?? 'Purchase failed.';
      const details: string[] = err?.error?.details ?? [];
      console.error(err);

      if (err.status === 409) {
        this.notification.error(details.length ? details.join('\n') : msg, 'Not available');
      } else if (err.status === 400) {
        this.notification.error(details.length ? details.join('\n') : msg, 'Invalid request');
      } else if (err.status === 401) {
        this.notification.error('Please log in again.', 'Unauthorized');
      } else if (err.status === 404) {
        this.notification.error(msg, 'Not found');
      } else {
        this.notification.error(msg, 'Error');
      }
    } finally {
      this.purchaseInProgress = false;
    }
  }
}
