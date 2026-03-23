/**
 * Interface representing a user in a list.
 */
export interface UserListDto {
  id: number;
  name: string;
  email: string;
  admin: boolean;
  locked: boolean;
}
