import {eventTypesMock} from './event-type.mock';
import {ReservationType} from '../../app/service/model/reservation-type.enum';
import {categoriesMock} from './category.mock';
import { Service } from '../../app/service/model/service.model';
import { Status } from '../../app/category/model/status-enum-ts';

export const mockServiceWithFixedDuration: Service = {
  id: 1,
  name: 'Test Service 1',
  category: categoriesMock[0],
  price: 200,
  rating: 4.5,
  eventTypes: [eventTypesMock[0]],
  provider: null,
  minDuration: 2,
  maxDuration: 2,
  description: 'Test description of service.',
  specialties: 'Food, Drinks',
  reservationDeadline: 48,
  cancellationDeadline: 24,
  discount: 10,
  visible: true,
  available: true,
  type: ReservationType.MANUAL,
  status: Status.ACCEPTED,
  images: null,
  company: null
};

export const mockServiceWithRangeDuration: Service = {
    id: 2,
    name: 'Test Service 2',
    category: null,
    price: 300,
    rating: 4.5,
    eventTypes: [eventTypesMock[0]],
    provider: null,
    minDuration: 2,
    maxDuration: 4,
    description: 'Test description of service.',
    specialties: 'Food, Drinks',
    reservationDeadline: 48,
    cancellationDeadline: 24,
    discount: 10,
    visible: true,
    available: true,
    type: ReservationType.AUTOMATIC,
    status: Status.ACCEPTED,
    images: null,
    company: null
  }
