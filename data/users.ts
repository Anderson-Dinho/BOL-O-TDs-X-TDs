import { User } from '../types';

// MUDANÇA DE CONFIGURAÇÃO DE ACESSO
// Data da geração: 10/02/2026, 14:53:03

export const SYSTEM_CONFIG = {
  active: true // SISTEMA LIBERADO
};

export const INITIAL_USERS: User[] = [
  {
    "username": "AndersonSilva",
    "password": "admin",
    "role": "admin",
    "isActive": true
  },
  {
    "username": "teste01",
    "password": "123",
    "role": "organizer",
    "isActive": true
  }
];