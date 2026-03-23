import { Component, OnInit } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderRequest } from '../../dtos/order-request';
import {ToastrService} from 'ngx-toastr';
import { SeatingPlan, Seat, Sector } from '../../dtos/seating-plan.dto';
import { SeatingPlanService } from '../../services/seating-plan.service';
import { AuthService } from '../../services/auth.service';
import {ReservationService} from "../../services/reservation.service";
import {CartService} from "../../services/cart.service";
import { Router } from '@angular/router';


interface SeatRow {
  rowNumber: number;
  seats: Seat[];
}

type SeatingPlanLayoutType = 'CINEMA' | 'THEATER' | 'OPERA' | 'CONCERT' | 'STADIUM' | 'GENERIC';

@Component({
  selector: 'app-seating-plan',
  standalone: true,
  templateUrl: './seating-plan.component.html',
  imports: [
    DecimalPipe,
    NgClass,
    FormsModule
  ],
  styleUrls: ['./seating-plan.component.scss']
})
export class SeatingPlanComponent implements OnInit {

  readonly MAX_TICKETS_PER_USER = 6;

  performanceId!: number;

  plan: SeatingPlan | null = null;
  seatRows: SeatRow[] = [];

  selectedSeatIds = new Set<number>();
  selectedSectorId = 'ALL';

  // standing selected per sectorId
  standingSelected: Record<number, number> = {};

  layoutType: SeatingPlanLayoutType = 'GENERIC';

  constructor(
    private seatingPlanService: SeatingPlanService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private reservationService: ReservationService,
    private notification: ToastrService,
    private cartService: CartService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.notification.error('Please log in to view and book seats.');
      return;
    }

    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('performanceId'));
      if (!Number.isNaN(id)) {
        this.performanceId = id;
        this.loadPlan();
      } else {
        this.notification.error('Invalid performance id.');
      }
    });
  }

  private loadPlan(): void {
    this.plan = null;

    this.seatingPlanService.getSeatingPlan(this.performanceId).subscribe({
      next: (plan) => {
        this.plan = plan;
        this.computeSeatCounts(plan);
        this.layoutType = this.detectLayoutType(plan);

        this.selectedSectorId = 'ALL';
        this.selectedSeatIds.clear();
        this.standingSelected = {};

        this.buildSeatRows(plan);
      },
      error: (err) => {
        console.error(err);
        this.notification.error('Failed to load seating plan.');
      },
    });
  }


  private detectLayoutType(plan: SeatingPlan): SeatingPlanLayoutType {
    const name = plan.hallName.toLowerCase();
    if (name.includes('cinema')||(name.includes('apollo'))) return 'CINEMA';
    if (name.includes('theater')) return 'THEATER';
    if (name.includes('oper')) return 'OPERA';
    if (name.includes('concert')||(name.includes('club'))||(name.includes('musical'))||(name.includes('arena'))) return 'CONCERT';
    if (name.includes('stadium')) return 'STADIUM';
    return 'GENERIC';
  }

  get stageLabel(): string {
    switch (this.layoutType) {
      case 'CINEMA':
        return 'Screen';
      case 'STADIUM':
        return 'Pitch';
      default:
        return 'Stage';
    }
  }

  get layoutClass(): string {
    return `layout-${this.layoutType.toLowerCase()}`;
  }

  get showStage(): boolean {
    return this.layoutType !== 'GENERIC';
  }

  onSectorChange(value: string): void {
    this.selectedSectorId = value;
    if (this.plan) this.buildSeatRows(this.plan);
  }

  sectorOverviewMeta(sector: Sector): string {
    if (sector.type === 'STANDING') {
      return `Free ${sector.standingFree ?? 0}/${sector.standingCapacity ?? '-'}`;
    }

    const c = this.seatCountsBySectorId[sector.id];
    if (!c) return 'Seats';
    return `Free ${c.free}/${c.total}`;
  }


  private buildSeatRows(plan: SeatingPlan): void {
    const grouped = new Map<number, Seat[]>();

    const sectorFilter =
      this.selectedSectorId === 'ALL' ? null : Number(this.selectedSectorId);

    for (const seat of plan.seats) {
      if (sectorFilter !== null && seat.sectorId !== sectorFilter) continue;

      if (!grouped.has(seat.row)) grouped.set(seat.row, []);
      grouped.get(seat.row)!.push(seat);
    }

    this.seatRows = Array.from(grouped.entries())
      .sort(([a], [b]) => a - b)
      .map(([rowNumber, seats]) => ({
        rowNumber,
        seats: seats.sort((a, b) => a.number - b.number),
      }));
  }

  // ---- sector overview counts (for seated sectors) ----
  seatCountsBySectorId: Record<number, { free: number; reserved: number; sold: number; total: number }> = {};

  private computeSeatCounts(plan: SeatingPlan): void {
    const counts: SeatingPlanComponent['seatCountsBySectorId'] = {};

    for (const seat of plan.seats) {
      const sId = seat.sectorId;
      if (!counts[sId]) counts[sId] = { free: 0, reserved: 0, sold: 0, total: 0 };
      counts[sId].total++;

      if (seat.status === 'FREE') counts[sId].free++;
      else if (seat.status === 'RESERVED') counts[sId].reserved++;
      else if (seat.status === 'SOLD') counts[sId].sold++;
    }

    this.seatCountsBySectorId = counts;
  }

  isAccessibleSeat(seat: Seat): boolean {
    const anySeat = seat as any;
    return anySeat.accessible === true || anySeat.isAccessible === true;
  }



  // ---------- Standing ----------



  get totalStandingSelected(): number {
    return Object.values(this.standingSelected).reduce((a, b) => a + b, 0);
  }

  getStandingSelected(sector: Sector): number {
    return this.standingSelected[sector.id] ?? 0;
  }

  changeStandingSelection(sector: Sector, delta: number, event?: MouseEvent): void {
    event?.stopPropagation();
    if (sector.type !== 'STANDING') return;

    if (delta > 0 && this.totalTicketsSelected >= this.MAX_TICKETS_PER_USER) {
      return;
    }

    const current = this.getStandingSelected(sector);
    let next = current + delta;
    if (next < 0) next = 0;

    const free = sector.standingFree ?? 0;

    // global ticket limit (seats + standing combined)
    const totalWithoutThisSector = this.selectedSeatIds.size + (this.totalStandingSelected - current);
    const remaining = this.MAX_TICKETS_PER_USER - totalWithoutThisSector;
    const maxForThisSectorGivenGlobal = current + Math.max(0, remaining);

    const allowedMax = Math.min(free, maxForThisSectorGivenGlobal);
    if (next > allowedMax) {
      next = allowedMax;
      if (delta > 0 && totalWithoutThisSector >= this.MAX_TICKETS_PER_USER) {
        this.notification.error(`You can select at most ${this.MAX_TICKETS_PER_USER} tickets in total.`);
      }
    }

    if (next === 0) delete this.standingSelected[sector.id];
    else this.standingSelected[sector.id] = next;
  }

  // ---------- Standing ----------

  private isVipStandingSector(sector: Sector): boolean {
    const n = (sector.name ?? '').toLowerCase();
    return sector.type === 'STANDING' && (n.includes('vip') || n.includes('front'));
  }

  get standingSectorsFiltered(): Sector[] {
    if (!this.plan) return [];
    const allStanding = this.plan.sectors.filter((s) => s.type === 'STANDING');

    if (this.selectedSectorId === 'ALL') return allStanding;

    const selectedId = Number(this.selectedSectorId);
    return allStanding.filter((s) => s.id === selectedId);
  }

  get standingVipSectors(): Sector[] {
    return this.standingSectorsFiltered.filter((s) => this.isVipStandingSector(s));
  }

  get standingRegularSectors(): Sector[] {
    return this.standingSectorsFiltered.filter((s) => !this.isVipStandingSector(s));
  }

  getStandingDisplayTitle(sector: Sector): string {
    const n = (sector.name ?? '').toLowerCase();
    if (this.isVipStandingSector(sector) && !n.includes('vip')) return 'VIP';
    if (!this.isVipStandingSector(sector) && (n.includes('back') || n.includes('rear') || n.includes('regular'))) {
      return 'Standing';
    }
    return sector.name;
  }

  // ---------- Seats ----------

  isSelected(seat: Seat): boolean {
    return this.selectedSeatIds.has(seat.id);
  }

  canSelect(seat: Seat): boolean {
    return seat.status === 'FREE';
  }

  get totalTicketsSelected(): number {
    return this.selectedSeatIds.size + this.totalStandingSelected;
  }

  get isAtTicketLimit(): boolean {
    return this.totalTicketsSelected >= this.MAX_TICKETS_PER_USER;
  }

  /** Whether the user can increase standing tickets for the given sector by at least 1 (global max respected). */
  canIncreaseStanding(sector: Sector): boolean {
    if (sector.type !== 'STANDING') return false;

    const current = this.getStandingSelected(sector);
    const free = sector.standingFree ?? 0;
    if (current >= free) return false;

    // Remaining capacity when keeping current selection for this sector.
    const totalWithoutThisSector = this.selectedSeatIds.size + (this.totalStandingSelected - current);
    const remaining = this.MAX_TICKETS_PER_USER - totalWithoutThisSector;
    return remaining > 0;
  }

  toggleSeat(seat: Seat): void {
    if (!this.canSelect(seat)) return;

    // unselect always allowed
    if (this.selectedSeatIds.has(seat.id)) {
      this.selectedSeatIds.delete(seat.id);
      return;
    }

    // select only up to max (seats + standing)
    if (this.isAtTicketLimit) {
      this.notification.error(`You can select at most ${this.MAX_TICKETS_PER_USER} tickets in total.`);
      return;
    }

    this.selectedSeatIds.add(seat.id);
  }


  // ---------- Summary + Price ----------

  get totalPrice(): number {
    if (!this.plan) return 0;

    const seatedTotal = this.plan.seats
      .filter((s) => this.selectedSeatIds.has(s.id))
      .reduce((sum, s) => sum + (s.price ?? 0), 0);

    const standingTotal = Object.entries(this.standingSelected).reduce(
      (sum, [sectorIdStr, count]) => {
        const sectorId = Number(sectorIdStr);
        const sector = this.plan!.sectors.find((s) => s.id === sectorId);
        return sum + count * (sector?.price ?? 0);
      },
      0
    );

    return seatedTotal + standingTotal;
  }

  get selectedSeatLabels(): string[] {
    const labels: string[] = [];
    for (const row of this.seatRows) {
      for (const seat of row.seats) {
        if (this.selectedSeatIds.has(seat.id)) {
          labels.push(`Row ${row.rowNumber} Seat ${seat.number}`);
        }
      }
    }
    return labels;
  }

  get standingSelectionSummary(): string {
    if (!this.plan) return '';

    const entries = Object.entries(this.standingSelected)
      .map(([sectorId, count]) => ({sectorId: Number(sectorId), count}))
      .filter((e) => e.count > 0);

    if (entries.length === 0) return '';

    const nameById = new Map(this.plan.sectors.map((s) => [s.id, s.name]));
    return entries
      .map((e) => `${nameById.get(e.sectorId) ?? 'Standing'} x${e.count}`)
      .join(', ');
  }

  get selectionSummary(): string {
    const parts: string[] = [];

    const seatLabels = this.selectedSeatLabels;
    if (seatLabels.length > 0) parts.push(`Seats: ${seatLabels.join(', ')}`);

    if (this.totalStandingSelected > 0) {
      parts.push(`Standing: ${this.standingSelectionSummary || this.totalStandingSelected}`);
    }

    return parts.join(' · ');
  }

  // ---------- Actions ----------

  onReserveClicked(): void {
    const seatIds = Array.from(this.selectedSeatIds);
    const hasStandingTickets = Object.values(this.standingSelected).some(k => Number(k) > 0);
    if (seatIds.length === 0 && !hasStandingTickets) {
      this.notification.warning('Please select at least one seat.');
      return;
    }

    const req: OrderRequest = {
      seatIdsToBeOrdered: seatIds,
      numberOfStandingTicketsToBeOrdered: this.standingSelected,
      reservationCodes: [],
      merchandiseId: null,
      purchasedWithPoints: false
    };

    this.reservationService.reserveSeats(this.performanceId, req).subscribe({
      next: res => {
        this.notification.success(` Reservation ${res.reservationCode} successful. Please make sure to purchase your tickets 30 minutes before the event.`);
        this.selectedSeatIds.clear();
        this.router.navigate(['/orders']);
      },
      error: err => {
        const msg = err?.error?.message;
        const details: string[] = err?.error?.details ?? [];
        console.error(err);
        this.notification.error(details.length ? details.join('\n') : msg, msg);
      }
    });
  }

  get hasSelection(): boolean {
    const seatCount = this.selectedSeatIds.size;
    const standingCount = Object.values(this.standingSelected)
      .reduce((sum, v) => sum + (Number(v) || 0), 0);

    return seatCount > 0 || standingCount > 0;
  }

  onAddToCartClicked(): void {

    //check if user has selected at least one seat or standing ticket, else return
    if (!this.hasSelection) {
      this.notification.warning('Please select at least one seat or standing ticket.');
      return;
    }

    const seatIds = Array.from(this.selectedSeatIds);

    const conflicts = this.cartService.getSeatConflicts(
      this.performanceId,
      seatIds
    );

    if (conflicts.length > 0) {
      this.notification.error(
        'Some selected seats are already in your cart.'
      );
      return;
    }

    this.cartService.add({
      ticketPurchase: true,
      performanceId: this.performanceId,
      performanceName: this.plan.eventTitle,
      seatIds,
      seatLabels: this.labelsForSeatIds(seatIds),
      standingSelected: { ...this.standingSelected },
      totalPrice: this.totalPrice,
      reservationCodes: [],
      merchandise: null,
      paidWithRewardPoints: false
    });

    this.notification.success('Added to cart.');
    this.router.navigate(['/cart-checkout']);
    this.selectedSeatIds.clear();
    this.standingSelected = {};
    this.loadPlan();
  }

  // convert seat IDs to human-readable labels
  private labelsForSeatIds(seatIds: number[]): string[] {
    if (!this.plan) return seatIds.map(id => `Seat ${id}`);

    const byId = new Map<number, Seat>();
    for (const s of this.plan.seats) byId.set(s.id, s);

    return seatIds.map(id => {
      const s = byId.get(id);
      if (!s) return `Seat ${id}`;
      return `Row ${s.row} Seat ${s.number}`;
    });
  }
  protected readonly String = String;
}
