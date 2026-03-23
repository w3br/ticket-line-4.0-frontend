/**
 * Class representing an authentication request for user login.
 */
export class AuthRequest {
  constructor(
    public email: string,
    public password: string
  ) {}
}
