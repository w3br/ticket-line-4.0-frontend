/**
 * Interface representing a reward.
 */
export interface RewardDto {
  id: number;
  description: string;
  imagePath?: string | null;
  price: number;
  pointCost: number;
}

