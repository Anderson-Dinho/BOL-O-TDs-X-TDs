import { User } from '../types';

// Configuração Global do Sistema
// active: true = Sistema liberado para todos
// active: false = Apenas Admin pode acessar
export const SYSTEM_CONFIG = {
  active: true
};

export const INITIAL_USERS: User[] = [
  {
    "username": "AndersonSilva",
    "password": "admin",
    "role": "admin"
  },
  {
    "username": "tiao",
    "password": "tiao",
    "role": "organizer"
  }
];