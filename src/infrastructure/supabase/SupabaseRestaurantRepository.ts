import type { SupabaseClient } from '@supabase/supabase-js';
import { IRestaurantRepository } from '../../domain/repositories/IRestaurantRepository';
import { Restaurant } from '../../domain/entities/Restaurant';

type RestaurantRow = {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  address: string;
  phone: string;
  delivery_fee: number;
  opening_hours: Restaurant['openingHours'];
  created_at: string;
};

function toEntity(row: RestaurantRow): Restaurant {
  return {
    id: row.id,
    ownerId: row.owner_id,
    slug: row.slug,
    name: row.name,
    address: row.address,
    phone: row.phone,
    deliveryFee: row.delivery_fee,
    openingHours: row.opening_hours,
    createdAt: row.created_at,
  };
}

export class SupabaseRestaurantRepository implements IRestaurantRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByOwnerId(ownerId: string): Promise<Restaurant | null> {
    const { data, error } = await this.supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', ownerId)
      .maybeSingle();
    if (error) throw error;
    return data ? toEntity(data as RestaurantRow) : null;
  }

  async findBySlug(slug: string): Promise<Restaurant | null> {
    const { data, error } = await this.supabase
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    return data ? toEntity(data as RestaurantRow) : null;
  }

  async create(restaurant: Omit<Restaurant, 'id' | 'createdAt'>): Promise<Restaurant> {
    const { data, error } = await this.supabase
      .from('restaurants')
      .insert({
        owner_id: restaurant.ownerId,
        slug: restaurant.slug,
        name: restaurant.name,
        address: restaurant.address,
        phone: restaurant.phone,
        delivery_fee: restaurant.deliveryFee,
        opening_hours: restaurant.openingHours,
      })
      .select('*')
      .single();
    if (error) throw error;
    return toEntity(data as RestaurantRow);
  }

  async update(
    id: string,
    data: Partial<Omit<Restaurant, 'id' | 'ownerId' | 'createdAt'>>
  ): Promise<void> {
    const payload: Record<string, unknown> = {};
    if (data.slug !== undefined) payload.slug = data.slug;
    if (data.name !== undefined) payload.name = data.name;
    if (data.address !== undefined) payload.address = data.address;
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.deliveryFee !== undefined) payload.delivery_fee = data.deliveryFee;
    if (data.openingHours !== undefined) payload.opening_hours = data.openingHours;

    const { error } = await this.supabase.from('restaurants').update(payload).eq('id', id);
    if (error) throw error;
  }

  async isSlugAvailable(slug: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('restaurants')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    return data === null;
  }
}
