export type SubscriptionStatus = 'trial' | 'active' | 'suspended' | 'cancelled';
export type BoardPattern = 'cbse' | 'icse' | 'state' | 'ib';

export interface SchoolAttributes {
  name: string;
  subdomain: string;
  board: BoardPattern;
  phone: string | null;
  address: string | null;
  timezone: string;
  subscription_status: SubscriptionStatus;
}
