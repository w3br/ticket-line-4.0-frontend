import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable, of, reduce, concatMap, from, catchError} from 'rxjs';
import { CartItemDto, CartCleanupResult } from '../dtos/cart-item-dto';
import { AuthService } from './auth.service';
import { CartApiService } from './cart-api.service';

@Injectable({ providedIn: 'root' })
export class CartService {

  private readonly STORAGE_PREFIX = 'ticket_cart_user_';

  private readonly _items$ = new BehaviorSubject<CartItemDto[]>(this.load());

  constructor(private authService: AuthService, private cartApi: CartApiService) {}

  reload(): void {
    this._items$.next(this.load());
  }

  add(item: Omit<CartItemDto, 'id'>): void {
    const newItem: CartItemDto = {
      ...item,
      id: this.newId(),
    };

    this.set([newItem, ...this.snapshot]);
  }

  remove(id: string): void {
    this.set(this.snapshot.filter(i => i.id !== id));
  }

  clear(): void {
    this.set([]);
  }

  total(): number {
    return this.snapshot.reduce((sum, i) => {
      if (i.paidWithRewardPoints) return sum;   // ignore
      return sum + (i.totalPrice ?? 0);
    }, 0);
  }

  get snapshot(): CartItemDto[] {
    return this._items$.value;
  }

  private set(items: CartItemDto[]): void {
    this._items$.next(items);
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  private load(): CartItemDto[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      const items: CartItemDto[] = raw ? JSON.parse(raw) : [];
      return items.map(i => ({
        ...i,
        totalPrice: i.paidWithRewardPoints ? 0 : (i.totalPrice ?? 0),
      }));
    } catch {
      return [];
    }
  }

  // storage key depends on user id (or anonymous), each user has separate cart
  private get storageKey(): string {
    const userId = this.authService.getUserId();
    if (userId == null) return `${this.STORAGE_PREFIX}anonymous`;
    return `${this.STORAGE_PREFIX}${userId}`;
  }

  private newId(): string {
    const c: any = globalThis.crypto;
    return c?.randomUUID ? c.randomUUID() : this.fallbackId();
  }

  private fallbackId(): string {
    return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  }

  // returns list of seat IDs that are already in cart for given performance
  getSeatConflicts(performanceId: number, seatIds: number[]): number[] {
    const used = new Set<number>();
    for (const it of this.snapshot) {
      if (it.performanceId !== performanceId) continue;
      for (const s of it.seatIds ?? []) used.add(s);
    }
    return seatIds.filter(id => used.has(id));
  }

  update(item: CartItemDto): void {
    const next = this.snapshot.map(i => (i.id === item.id ? item : i));
    this.set(next);
  }

  validateAndCleanupCart(): Observable<CartCleanupResult> {
    const items = [...this.snapshot];
    if (items.length === 0) {
      return of({ removedSeats: 0, removedStanding: 0, removedItems: 0, performanceIdsTouched: [] });
    }

    return from(items).pipe(
      concatMap(item => {
        if (item.ticketPurchase !== true) {
          return of({
            removedSeats: 0,
            removedStanding: 0,
            removedItems: 0,
            performanceId: item.performanceId
          });
        }

        return this.cartApi.validateCart(item.performanceId, {
          seatIds: item.seatIds ?? [],
          standingSelected: item.standingSelected ?? {},
          reservationCodes: item.reservationCodes ?? [],
        }).pipe(
          // if endpoint fails, ignore that item
          catchError(err => {
            console.error('validateCart failed', err);
            return of(null);
          }),
          concatMap(res => {
            if (!res) {
              return of({
                removedSeats: 0,
                removedStanding: 0,
                removedItems: 0,
                performanceId: item.performanceId
              });
            }

            // apply changes
            if (res.itemEmptyAfterAdjust) {
              this.remove(item.id);
              return of({
                removedSeats: res.removedSeatCount ?? 0,
                removedStanding: res.removedStandingCount ?? 0,
                removedItems: 1,
                performanceId: item.performanceId
              });
            }

            const newSeatIds = res.validSeatIds ?? [];

            // keep existing labels best-effort
            const oldSeatIds = item.seatIds ?? [];
            const oldLabels = item.seatLabels ?? [];
            const idToLabel = new Map<number, string>();
            oldSeatIds.forEach((sid, idx) => idToLabel.set(sid, oldLabels[idx]));

            const newLabels = newSeatIds.map(sid => idToLabel.get(sid) ?? `Seat ${sid}`);
            this.update({
              ...item,
              seatIds: newSeatIds,
              seatLabels: newLabels,
              standingSelected: res.adjustedStandingSelected ?? {},
              reservationCodes: res.validReservationCodes ?? [],
              totalPrice: res.updatedTotalPrice,
            });

            return of({
              removedSeats: res.removedSeatCount ?? 0,
              removedStanding: res.removedStandingCount ?? 0,
              removedItems: 0,
              performanceId: item.performanceId
            });
          })
        );
      }),
      reduce((acc, x) => {
        acc.removedSeats += x.removedSeats;
        acc.removedStanding += x.removedStanding;
        acc.removedItems += x.removedItems;
        acc.performanceIdsTouched.push(x.performanceId);
        return acc;
      }, { removedSeats: 0, removedStanding: 0, removedItems: 0, performanceIdsTouched: [] } as CartCleanupResult)
    );
  }

}
