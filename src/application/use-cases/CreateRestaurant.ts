import { IRestaurantRepository } from '../../domain/repositories/IRestaurantRepository';
import { Restaurant } from '../../domain/entities/Restaurant';

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export type CreateRestaurantInput = Omit<Restaurant, 'id' | 'createdAt'>;

export class CreateRestaurant {
  constructor(private restaurantRepository: IRestaurantRepository) {}

  async execute(input: CreateRestaurantInput): Promise<Restaurant> {
    if (!input.name.trim()) {
      throw new Error('Nome do restaurante e obrigatorio');
    }
    if (!SLUG_REGEX.test(input.slug)) {
      throw new Error('Slug invalido: use apenas letras minusculas, numeros e hifen');
    }
    if (input.deliveryFee < 0) {
      throw new Error('Taxa de entrega nao pode ser negativa');
    }

    const existing = await this.restaurantRepository.findByOwnerId(input.ownerId);
    if (existing) {
      throw new Error('Este usuario ja possui um restaurante cadastrado');
    }

    const slugAvailable = await this.restaurantRepository.isSlugAvailable(input.slug);
    if (!slugAvailable) {
      throw new Error('Este slug ja esta em uso, escolha outro');
    }

    return this.restaurantRepository.create(input);
  }
}
