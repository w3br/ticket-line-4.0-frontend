/**
 * Interface representing data for creating a new user.
 */
export interface UserCreateDto {
  name: string;
  email: string;
  password: string;
  street: string;
  city: string;
  country: string;
  admin: boolean;
}
