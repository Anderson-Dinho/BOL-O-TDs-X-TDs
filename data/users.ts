import { User } from '../types';

// MUDANÇA DE CONFIGURAÇÃO DE ACESSO
// Data da geração: 10/02/2026, 14:16:04

export const SYSTEM_CONFIG = {
  active: true // SISTEMA LIBERADO
};

export const INITIAL_USERS: User[] = [
  {
    "username": "tiao",
    "password": "tiao",
    "role": "organizer",
    "isActive": true
  },
  {
    "username": "mano",
    "password": "mano",
    "role": "organizer",
    "isActive": true
  },
  {
    "username": "AndersonSilva",
    "password": "admin",
    "role": "admin",
    "isActive": true
  }
];