import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { MerchandiseCreate, MerchandiseService } from '../../../services/merchandise.service';
import {Subscription} from "rxjs";
import {RewardService} from "../../../services/reward.service";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-create-merchandise',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-merchandise.component.html',
  styleUrls: ['./create-merchandise.component.scss']
})
export class CreateMerchandiseComponent {

  //same as backend
  private readonly DESCRIPTION_MAX_LEN = 100;  //IR2
  private readonly PRICE_MIN = 0.01;
  private readonly PRICE_MAX = 99999999.99;
  private readonly POINT_COST_MIN = 1;
  private readonly POINT_COST_MAX = 1_000_000;

  model: MerchandiseCreate = {
    description: '',
    price: 0,
    pointCost: 0
  };

  isSubmitting = false;

  selectedImage: File | null = null;
  previewUrl: string | null = null;


  editId: number | null = null;
  existingImageUrl: string | null = null;
  private sub?: Subscription;

  constructor(
    private merchandiseService: MerchandiseService,
    private rewardService: RewardService,
    private route: ActivatedRoute,
    private router: Router,
    private notification: ToastrService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : null;

    if (id && Number.isFinite(id)) {
      this.editId = id;

      // Prefill via rewards endpoint (frontend-only, kein neuer backend endpoint nötig)
      this.sub = this.rewardService.getRewards().subscribe({
        next: rewards => {
          const r = (rewards ?? []).find(x => x.id === id);
          if (!r) {
            this.notification.error('Reward not found.', 'Edit');
            this.router.navigate(['/rewards']);
            return;
          }

          this.model = {
            description: r.description ?? '',
            price: Number(r.price ?? 0),
            pointCost: Number(r.pointCost ?? 0)
          };

          this.existingImageUrl = r.imagePath ? this.rewardService.getImageUrl(r.imagePath) : null;
        },
        error: () => {
          this.notification.error('Could not load reward for editing.', 'Edit');
          this.router.navigate(['/rewards']);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedImage = file;

    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
    if (file) {
      this.previewUrl = URL.createObjectURL(file);
    }
  }

  onSubmit(form: NgForm): void {
    if (this.isSubmitting) {
      return;
    }
    const desc = (this.model.description ?? '').trim();
    if (!desc) {
      this.notification.warning('Description is required.', 'Invalid input');
      return;
    }
    if (desc.length > this.DESCRIPTION_MAX_LEN) {
      this.notification.error(
        `Description must be at most ${this.DESCRIPTION_MAX_LEN} characters.`,
        'Invalid input'
      );
      return;
    }

    const price = Number(this.model.price);
    if (!Number.isFinite(price)) {
      this.notification.warning('Price is required.', 'Invalid input');
      return;
    }
    if (price < this.PRICE_MIN) {
      this.notification.error(`Price must be at least ${this.PRICE_MIN}.`, 'Invalid input');
      return;
    }
    if (price > this.PRICE_MAX) {
      this.notification.error(`Price must be at most ${this.PRICE_MAX}.`, 'Invalid input');
      return;
    }
    if (!this.hasMaxTwoDecimals(price)) {
      this.notification.error('Price must have at most 2 decimal places.', 'Invalid input');
      return;
    }

    const pointCost = Number(this.model.pointCost);
    if (!Number.isFinite(pointCost)) {
      this.notification.warning('Point cost is required.', 'Invalid input');
      return;
    }
    if (pointCost < this.POINT_COST_MIN) {
      this.notification.error('Point cost must be > 0.', 'Invalid input');
      return;
    }
    if (pointCost > this.POINT_COST_MAX) {
      this.notification.error(`Point cost must be <= ${this.POINT_COST_MAX}.`, 'Invalid input');
      return;
    }

    this.model.description = desc;
    this.model.price = price;
    this.model.pointCost = Math.trunc(pointCost);

    this.isSubmitting = true;

    const req$ = this.isEditMode
      ? this.merchandiseService.updateMerchandise(this.editId!, this.model, this.selectedImage)
      : this.merchandiseService.createMerchandise(this.model, this.selectedImage);

    req$.subscribe({
      next: () => {
        this.notification.success(
          this.isEditMode ? 'Merchandise updated successfully.' : 'Merchandise created successfully.',
          this.isEditMode ? 'Updated' : 'Created'
        );

        this.isSubmitting = false;

        if (!this.isEditMode) {
          form.resetForm();
          this.model = { description: '', price: 0, pointCost: 0 };
          this.selectedImage = null;
          if (this.previewUrl) {
            URL.revokeObjectURL(this.previewUrl);
            this.previewUrl = null;
          }
        } else {
          this.router.navigate(['/rewards']);
        }
      },
      error: err => {
        this.notification.error('Failed to save merchandise.', 'Error');
        this.isSubmitting = false;
      }
    });
  }

  private hasMaxTwoDecimals(value: number): boolean {
    return Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;
  }



  get isEditMode(): boolean {
    return this.editId !== null;
  }

}
