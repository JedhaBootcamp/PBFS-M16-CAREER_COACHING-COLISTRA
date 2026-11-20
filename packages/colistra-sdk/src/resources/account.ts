import type { HttpClient } from '../http';
import type { Account } from '../types';

export class AccountResource {
  constructor(private readonly http: HttpClient) {}

  /** Retrieves your account and this month's label usage. */
  retrieve(): Promise<Account> {
    return this.http.request('GET', '/account');
  }
}
