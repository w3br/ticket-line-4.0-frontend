/**
 * Class representing user profile information.
 */
export class UserProfileDto {
  id!: number;
  email!: string;
  name!: string;

  street: string = '';
  city: string = '';
  country: string = '';

  rewardPoints!: number;
}
