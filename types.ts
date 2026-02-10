
export enum Modality {
  Cabeca = 'Cabeça',
  Pe = 'Pé',
  Ambas = 'Ambas',
}

export interface Competitor {
  id: string;
  fullName: string;
  nickname: string;
  modality: Modality;
  hc: number;
}

export interface EventSettings {
  eventName: string;
  eventDate: string;
  timeLimit: number;
  maxHc: number;
}

export type RunTime = number | 'SAT';

export interface Pair {
  id: string;
  cabeceiro: Competitor;
  pezeiro: Competitor;
  combinedHc: number;
  qualifyingRuns: RunTime[];
  finalRun: RunTime | null;
  disqualified: boolean;
}

export type Page = 'setup' | 'competition' | 'results' | 'admin-dashboard';

export interface User {
  username: string;
  password: string;
  role: 'admin' | 'organizer';
  isActive?: boolean; // Permite suspender usuários individualmente
  lastLogin?: string; // Data/Hora do último acesso
}