import { IRestaurantRepository } from '../../domain/repositories/IRestaurantRepository';
import { Restaurant } from '../../domain/entities/Restaurant';

export class GetOwnRestaurant {
  constructor(private restaurantRepository: IRestaurantRepository) {}

  async execute(ownerId: string): Promise<Restaurant | null> {
    return this.restaurantRepository.findByOwnerId(ownerId);
  }
}
