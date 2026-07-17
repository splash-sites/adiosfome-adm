import { Restaurant } from '../entities/Restaurant';

export interface IRestaurantRepository {
  findByOwnerId(ownerId: string): Promise<Restaurant | null>;
  findBySlug(slug: string): Promise<Restaurant | null>;
  create(restaurant: Omit<Restaurant, 'id' | 'createdAt'>): Promise<Restaurant>;
  update(id: string, data: Partial<Omit<Restaurant, 'id' | 'ownerId' | 'createdAt'>>): Promise<void>;
  isSlugAvailable(slug: string): Promise<boolean>;
}
