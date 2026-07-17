import { IRestaurantRepository } from '../../domain/repositories/IRestaurantRepository';
import { Restaurant } from '../../domain/entities/Restaurant';

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export type UpdateRestaurantInput = Partial<Omit<Restaurant, 'id' | 'ownerId' | 'createdAt'>>;

export class UpdateRestaurant {
  constructor(private restaurantRepository: IRestaurantRepository) {}

  async execute(current: Restaurant, changes: UpdateRestaurantInput): Promise<void> {
    if (changes.name !== undefined && !changes.name.trim()) {
      throw new Error('Nome do restaurante e obrigatorio');
    }

    if (changes.deliveryFee !== undefined && changes.deliveryFee < 0) {
      throw new Error('Taxa de entrega nao pode ser negativa');
    }

    if (changes.slug !== undefined && changes.slug !== current.slug) {
      if (!SLUG_REGEX.test(changes.slug)) {
        throw new Error('Slug invalido: use apenas letras minusculas, numeros e hifen');
      }
      const available = await this.restaurantRepository.isSlugAvailable(changes.slug);
      if (!available) {
        throw new Error('Este slug ja esta em uso, escolha outro');
      }
    }

    if (changes.openingHours !== undefined) {
      for (const oh of changes.openingHours) {
        if (oh.day < 0 || oh.day > 6) {
          throw new Error('Dia da semana invalido');
        }
        if (oh.opensAt >= oh.closesAt) {
          throw new Error('Horario de abertura precisa ser antes do horario de fechamento');
        }
      }
    }

    await this.restaurantRepository.update(current.id, changes);
  }
}
