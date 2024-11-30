export interface User {
  username: string;
  email: string;
  accountId: string;
  address?: Address;
}

export interface Address {
  addressFormatted: string;
  latitude: number;
  longitude: number;
}
