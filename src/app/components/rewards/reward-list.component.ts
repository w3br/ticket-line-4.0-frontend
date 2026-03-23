import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RewardService } from '../../services/reward.service';
import { RewardDto } from '../../dtos/reward';
import { ToastrService } from 'ngx-toastr';
import { ProfileService } from '../../services/profile.service';
import { CartService } from "../../services/cart.service";
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reward-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './reward-list.component.html',
  styleUrl: './rewards-list.component.scss'
})
export class RewardListComponent implements OnInit {
  rewards: RewardDto[] = [];
  loading = true;
  rewardPoints: number | null = null;

  pagedRewards: RewardDto[] = [];
  currentRewardPage = 1;
  totalRewardPages = 0;
  visibleRewardPages: Array<number | "..."> = [];
  entriesPerPage: number = 10;

  rewardForDeletion: RewardDto | null = null;
  isDeleting = false;

  constructor(
    private rewardService: RewardService,
    private profileService: ProfileService,
    private cartService: CartService,
    private toastr: ToastrService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loading = true;

    this.profileService.getProfile().subscribe({
      next: profile => (this.rewardPoints = profile?.rewardPoints ?? 0),
      error: () => {
        this.rewardPoints = null;
        this.toastr.warning('Could not load your reward points.', 'Rewards');
      }
    });

    this.rewardService.getRewards().subscribe({
      next: data => {
        this.rewards = data ?? [];
        this.loading = false;
        this.applyFilters();
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Failed to load rewards.', 'Rewards');
      }
    });
  }

  applyFilters(): void {
    this.totalRewardPages = Math.max(1, Math.ceil(this.rewards.length / this.entriesPerPage));
    this.currentRewardPage = Math.min(this.currentRewardPage, this.totalRewardPages);
    const start = (this.currentRewardPage - 1) * this.entriesPerPage;
    this.pagedRewards = this.rewards.slice(start, start + this.entriesPerPage);
    this.visibleRewardPages = this.getCompactPages(this.currentRewardPage, this.totalRewardPages);
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



  goToPage(page: number): void {
    this.currentRewardPage = page;
    this.applyFilters();
  }

  prevPage(): void {
    if (this.currentRewardPage > 1) {
      this.currentRewardPage--;
      this.applyFilters();
    }
  }

  nextPage(): void {
    if (this.currentRewardPage < this.totalRewardPages) {
      this.currentRewardPage++;
      this.applyFilters();
    }
  }

  isAdmin(): boolean {
    return this.authService.getUserRole() === 'ADMIN';
  }

  confirmDelete(): void {
    if (!this.rewardForDeletion || this.isDeleting) {
      return;
    }

    const id = this.rewardForDeletion.id;
    this.isDeleting = true;

    this.rewardService.deleteReward(id).subscribe({
      next: () => {
        this.rewards = this.rewards.filter(r => r.id !== id);
        this.applyFilters();
        this.toastr.success('Reward deleted.', 'Rewards');
        this.rewardForDeletion = null;
        this.isDeleting = false;
      },

      error: () => {
        this.toastr.error('Failed to delete reward.', 'Rewards');
        this.isDeleting = false;
      }
    });
  }

  getImageUrl(imagePath: string): string {
    return this.rewardService.getImageUrl(imagePath);
  }

  addToCart(reward: RewardDto, payWithPoints: boolean): void {
    this.cartService.add({
      ticketPurchase: false,
      performanceId: null,
      performanceName: null,
      seatIds: null,
      seatLabels: null,
      standingSelected: null,
      reservationCodes: null,
      merchandise: reward,
      paidWithRewardPoints: payWithPoints,
      totalPrice: reward.price,
    });
    this.toastr.success(`Added "${reward.description}" to cart.`, 'Added to Cart');
  }

}

