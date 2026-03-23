import {Component, OnInit} from '@angular/core';
import {OrderDetailDto} from "../../dtos/order-detail-dto";
import {TicketInfo} from '../../dtos/ticket';
import {AuthService} from "../../services/auth.service";
import {ReservationService} from "../../services/reservation.service";
import {Router} from "@angular/router";
import {OrderService} from "../../services/order.service";
import {ToastrService} from "ngx-toastr";
import {CartService} from "../../services/cart.service";

@Component({
  selector: 'app-order-overview',
  standalone: false,
  templateUrl: './order-overview.component.html',
  styleUrl: './order-overview.component.scss',
})
export class OrderOverviewComponent implements OnInit {

  loading = true;
  orders: OrderDetailDto[] = [];
  upcomingTicketOrders: OrderDetailDto[] = [];

  // pagination
  pagedUpcomingTicketOrders: OrderDetailDto[] = [];
  currentUpcomingTicketPage = 1;
  totalUpcomingTicketPages = 0;
  visibleUpcomingTicketPages: Array<number | "..."> = [];
  entriesPerPageUpcoming = 5;

  pagedOrders: OrderDetailDto[] = [];
  currentOrderPage = 1;
  totalOrderPages = 0;
  visibleOrderPages: Array<number | "..."> = [];
  entriesPerPage: number = 10;

  // cancellation
  orderToCancel: OrderDetailDto | null = null;

  // purchase reservation modal
  showTicketModal = false;
  reservationTickets: TicketInfo[] = [];
  selectedTicketIds: number[] = [];
  reservationCode: string = '';

  //error handling
  error = false;
  errorMessage = '';

  constructor(
    private orderService: OrderService,
    private reservationService: ReservationService,
    private notification: ToastrService,
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {
  }


  ngOnInit(): void {
    this.loadOrders();
  }


  loadOrders(): void {
    this.orderService.getAllOrders().subscribe({
      next: orders => {
        this.orders = orders;
        this.applyFilters();
        this.loading = false;
      },
      error: err => {
        this.error = true;
        this.errorMessage = 'Failed to load orders';
        console.error(err);
      }
    });
  }

  applyFilters(): void {
    const now = new Date();

    this.upcomingTicketOrders = this.orders
      .filter(o => {
        if (!o.timeOfEvent) return false;
        const d = new Date(o.timeOfEvent);
        return !isNaN(d.getTime()) && d >= now;
      })
      .sort((a, b) => new Date(a.timeOfEvent!).getTime() - new Date(b.timeOfEvent!).getTime());

    this.orders = this.orders
      .sort((a, b) => new Date(b.timeOfOrder!).getTime() - new Date(a.timeOfOrder!).getTime());

    this.totalUpcomingTicketPages = Math.max(1, Math.ceil(this.upcomingTicketOrders.length / this.entriesPerPageUpcoming));
    this.currentUpcomingTicketPage = Math.min(this.currentUpcomingTicketPage, this.totalUpcomingTicketPages);
    const start = (this.currentUpcomingTicketPage - 1) * this.entriesPerPageUpcoming;
    this.pagedUpcomingTicketOrders = this.upcomingTicketOrders.slice(start, start + this.entriesPerPageUpcoming);
    this.visibleUpcomingTicketPages = this.getCompactPages(this.currentUpcomingTicketPage, this.totalUpcomingTicketPages);
    this.totalOrderPages = Math.max(1, Math.ceil(this.orders.length / this.entriesPerPage));
    this.currentOrderPage = Math.min(this.currentOrderPage, this.totalOrderPages);
    const orderStart = (this.currentOrderPage - 1) * this.entriesPerPage;
    this.pagedOrders = this.orders.slice(orderStart, orderStart + this.entriesPerPage);
    this.visibleOrderPages = this.getCompactPages(this.currentOrderPage, this.totalOrderPages);

  }


  goToPage(page: number): void {
    this.currentOrderPage = page;
    this.applyFilters();
  }

  prevPage(): void {
    if (this.currentOrderPage > 1) {
      this.currentOrderPage--;
      this.applyFilters();
    }
  }

  nextPage(): void {
    if (this.currentOrderPage < this.totalOrderPages) {
      this.currentOrderPage++;
      this.applyFilters();
    }
  }

  goToPageUpcoming(page: number): void {
    this.currentUpcomingTicketPage = page;
    this.applyFilters();
  }

  prevPageUpcoming(): void {
    if (this.currentUpcomingTicketPage > 1) {
      this.currentUpcomingTicketPage--;
      this.applyFilters();
    }
  }

  nextPageUpcoming(): void {
    if (this.currentUpcomingTicketPage < this.totalUpcomingTicketPages) {
      this.currentUpcomingTicketPage++;
      this.applyFilters();
    }
  }

  getCompactPages(current: number, total: number): Array<number | '...'> {
    if (total <= 1) return [1];

    const pages: Array<number | '...'> = [1];

    const start = Math.max(2, current - 1);
    const end   = Math.min(total - 1, current + 1);

    if (start > 2) pages.push('...');

    for (let p = start; p <= end; p++) pages.push(p);

    if (end < total - 1) pages.push('...');

    if (total > 1) pages.push(total);

    return pages;
  }

  /*
  viewDetails(orderId?: number): void {
    if (orderId) {
      this.router.navigate(['/orders', orderId]);
    }
  }
   */

  setOrderToCancel(order: OrderDetailDto | null): void {
    this.orderToCancel = order;
  }

  confirmCancel(): void {
    if (this.orderToCancel) {
      if (this.orderToCancel.reservation) {
        this.cancelReservation();
      } else {
        this.cancelPurchase();
      }
    }
  }

  cancelReservation(): void {
    this.orderService.cancelReservation(this.orderToCancel.id).subscribe({
      next: () => {
        this.loadOrders();
        this.notification.success('Reservation cancelled successfully');
      },
      error: (err) => {
        const msg = err?.error?.message;
        const details: string[] = err?.error?.details ?? [];
        console.error(err);
        this.notification.error(details.length ? details.join('\n') : msg, msg);
      }
    });
  }

  cancelPurchase(): void {
    this.orderService.cancelPurchase(this.orderToCancel.id).subscribe({
      next: () => {
        this.loadOrders();
        this.notification.success('Purchase cancelled successfully');
      },
      error: (err) => {
        const msg = err?.error?.message;
        const details: string[] = err?.error?.details ?? [];
        console.error(err);
        this.notification.error(details.length ? details.join('\n') : msg, msg);
      }
    });
  }

  purchaseReservation(orderId: number, reservationCode: string): void {
    this.selectedTicketIds = [];
    this.reservationTickets = [];

    this.orderService.getTicketInfo(orderId).subscribe({
      next: (tickets: any[]) => {
        this.reservationTickets = tickets; // no ticketStatus filter
        this.showTicketModal = true;
        this.reservationCode = reservationCode;
      },
      error: (err) => {
        const msg = err?.error?.message;
        const details: string[] = err?.error?.details ?? [];
        console.error(err);
        this.notification.error(details.length ? details.join('\n') : msg, msg);
      }
    });
  }

  onTicketChange(ticketId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.toggleTicket(ticketId, checked);
  }

  closeTicketModal(): void {
    this.showTicketModal = false;
  }

  addSelectedToCart(): void {

    const selectedTickets = this.reservationTickets
      .filter(t => this.selectedTicketIds.includes(t.id));

    if (selectedTickets.length === 0) {
      this.notification.warning('No valid tickets selected.');
      return;
    }

    const selectedSeatIds: number[] = [];
    const standingSelected: Record<number, number> = {};

    // split selected tickets into seat and standing tickets
    for (const ticket of selectedTickets) {
      if (ticket.seatId != null) {
        selectedSeatIds.push(ticket.seatId);
      } else if (ticket.sectorId != null) {
        standingSelected[ticket.sectorId] = (standingSelected[ticket.sectorId] || 0) + 1;
      }
    }

    // Ensure all selected tickets belong to the same performance
    const performanceId = selectedTickets[0].performanceId;
    if (selectedTickets.some(t => t.performanceId !== performanceId)) {
      this.notification.error('Please select tickets from the same performance.');
      return;
    }

    // NEW: skip seats already in cart (instead of blocking)
    const conflicts = this.cartService.getSeatConflicts(performanceId, selectedSeatIds);

    // conflicts could be number[] or objects; handle both safely
    const conflictSeatIds = new Set<number>(
      conflicts.map((c: any) => typeof c === 'number' ? c : c.seatId)
    );

    const seatIdsToAdd = selectedSeatIds.filter(id => !conflictSeatIds.has(id));

    // Build seatLabels only for the seats we're actually adding
    const seatLabelsToAdd = selectedTickets
      .filter(t => t.seatId != null && seatIdsToAdd.includes(t.seatId))
      .map(t => t.placeInfo);

    const hasStanding = Object.keys(standingSelected).length > 0;

    if (seatIdsToAdd.length === 0 && !hasStanding) {
      this.notification.info('All selected seats are already in your cart.');
      return;
    }

    if (seatIdsToAdd.length < selectedSeatIds.length) {
      this.notification.info('Some selected seats were already in your cart and were skipped.');
    }

    const totalPrice = selectedTickets.reduce((sum, t) => {
      const isSeatToAdd = t.seatId != null && seatIdsToAdd.includes(t.seatId);
      const isStanding = t.sectorId != null;
      return sum + ((isSeatToAdd || isStanding) ? (t.price ?? 0) : 0);
    }, 0);

    console.log("ReservationCode:" + this.reservationCode);

    this.cartService.add({
      ticketPurchase: true,
      performanceId,
      performanceName: selectedTickets[0].performanceInfo,
      seatIds: seatIdsToAdd,
      seatLabels: seatLabelsToAdd,
      standingSelected: standingSelected,
      totalPrice,
      reservationCodes: [this.reservationCode],
      merchandise: null,
      paidWithRewardPoints: false
    });

    this.notification.success('Added to cart.');
    this.router.navigate(['/cart-checkout']);

    // reset modal state
    this.selectedTicketIds = [];
    this.reservationTickets = [];
    this.reservationCode = '';
    this.showTicketModal = false;
  }

  toggleTicket(ticketId: number, checked: boolean): void {
    if (checked) {
      if (!this.selectedTicketIds.includes(ticketId)) {
        this.selectedTicketIds = [...this.selectedTicketIds, ticketId];
      }
    } else {
      this.selectedTicketIds = this.selectedTicketIds.filter(id => id !== ticketId);
    }
  }

  downloadInvoice(orderId?: number): void {
    if (!orderId) return;

    this.orderService.getInvoicePdf(orderId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-order-${orderId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error(err);
        const msg = err?.error?.message ?? 'Failed to download invoice';
        this.notification.error(msg);
      }
    });
  }

  downloadCancellationInvoice(orderId: number | string) {
    this.orderService.getCancellationPdf(Number(orderId)).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cancellation-invoice-order-${orderId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error(err);
        const msg = err?.error?.message ?? 'Failed to download cancellation invoice';
        this.notification.error(msg);
      }
    });
  }
}
