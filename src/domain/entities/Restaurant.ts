export interface OpeningHours {
  day: number; // 0-6 (domingo-sábado)
  opensAt: string; // "HH:mm"
  closesAt: string; // "HH:mm"
}

export interface Restaurant {
  id: string;
  ownerId: string;
  slug: string;
  name: string;
  address: string;
  phone: string;
  deliveryFee: number;
  openingHours: OpeningHours[];
  createdAt: string;
}
