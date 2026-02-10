
import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Competitor, EventSettings, Pair, RunTime, Modality } from '../types';

interface CompetitionContextType {
  settings: EventSettings;
  updateSettings: (newSettings: Partial<EventSettings>) => void;
  competitors: Competitor[];
  addCompetitor: (competitor: Omit<Competitor, 'id'>) => void;
  updateCompetitor: (id: string, updates: Partial<Competitor>) => void; // Nova função
  removeCompetitors: (ids: string[]) => void;
  pairs: Pair[];
  generatePairs: () => void;
  updatePairsPreservingData: () => void;
  updateRunTime: (pairId: string, runIndex: number, time: RunTime) => void;
  updateFinalRunTime: (pairId: string, time: RunTime) => void;
  resetCompetition: () => void;
  // New locking capabilities
  lockedRounds: number[];
  isFinalLocked: boolean;
  toggleRoundLock: (roundIndex: number) => void;
  toggleFinalLock: () => void;
  exportData: () => void;
  importData: (jsonContent: string) => boolean;
}

const CompetitionContext = createContext<CompetitionContextType | undefined>(undefined);

const initialSettings: EventSettings = { 
  eventName: 'Bolão Amigos do Laço', 
  eventDate: new Date().toISOString().split('T')[0], 
  timeLimit: 15, 
  maxHc: 7 
};

// Helper para gerar IDs compatível com todos os navegadores/ambientes
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Algoritmo para organizar as duplas evitando repetições consecutivas de competidores
const organizePairs = (pairs: Pair[]): Pair[] => {
    if (pairs.length === 0) return [];
    
    // 1. Embaralhar aleatoriamente primeiro
    let pool = [...pairs];
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const organized: Pair[] = [];
    
    while (pool.length > 0) {
        if (organized.length === 0) {
            organized.push(pool.pop()!);
            continue;
        }

        const lastPair = organized[organized.length - 1];
        
        // 2. Tentar encontrar uma dupla onde NENHUM dos competidores participou da anterior
        let nextIndex = pool.findIndex(p => 
            p.cabeceiro.id !== lastPair.cabeceiro.id && 
            p.pezeiro.id !== lastPair.pezeiro.id &&
            // Verifica cruzamento (ex: Fulano foi cabeceiro na anterior, não deve ser pezeiro agora se possível)
            p.cabeceiro.id !== lastPair.pezeiro.id &&
            p.pezeiro.id !== lastPair.cabeceiro.id
        );

        // 3. Se não achar perfeito, tenta achar uma onde pelo menos o CABECEIRO é diferente (descanso do cavalo)
        if (nextIndex === -1) {
             nextIndex = pool.findIndex(p => p.cabeceiro.id !== lastPair.cabeceiro.id);
        }

        // 4. Se não achar, pega a primeira disponível (conflito inevitável)
        if (nextIndex === -1) {
            nextIndex = 0;
        }

        organized.push(pool.splice(nextIndex, 1)[0]);
    }

    return organized;
};

export const CompetitionProvider: React.FC<{ children: ReactNode; currentUser: string }> = ({ children, currentUser }) => {
  // Use keys that include the currentUser to segregate data
  const settingsKey = `competition-settings-${currentUser}`;
  const competitorsKey = `competition-competitors-${currentUser}`;
  const pairsKey = `competition-pairs-${currentUser}`;
  const lockedRoundsKey = `competition-locked-rounds-${currentUser}`;
  const finalLockedKey = `competition-final-locked-${currentUser}`;

  const [settings, setSettings] = useLocalStorage<EventSettings>(settingsKey, initialSettings);
  const [competitors, setCompetitors] = useLocalStorage<Competitor[]>(competitorsKey, []);
  const [pairs, setPairs] = useLocalStorage<Pair[]>(pairsKey, []);
  
  // States for locking rounds
  const [lockedRounds, setLockedRounds] = useLocalStorage<number[]>(lockedRoundsKey, []);
  const [isFinalLocked, setIsFinalLocked] = useLocalStorage<boolean>(finalLockedKey, false);

  const updateSettings = useCallback((newSettings: Partial<EventSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, [setSettings]);

  const addCompetitor = useCallback((competitor: Omit<Competitor, 'id'>) => {
    const newCompetitor = { ...competitor, id: generateId() };
    setCompetitors(prev => [...prev, newCompetitor]);
  }, [setCompetitors]);

  const updateCompetitor = useCallback((id: string, updates: Partial<Competitor>) => {
    // 1. Atualiza a lista de competidores
    setCompetitors(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

    // 2. Atualiza as duplas existentes para refletir a mudança (ex: novo HC)
    setPairs(prev => prev.map(p => {
        if (p.cabeceiro.id === id || p.pezeiro.id === id) {
            const newCabeceiro = p.cabeceiro.id === id ? { ...p.cabeceiro, ...updates } : p.cabeceiro;
            const newPezeiro = p.pezeiro.id === id ? { ...p.pezeiro, ...updates } : p.pezeiro;
            return {
                ...p,
                cabeceiro: newCabeceiro,
                pezeiro: newPezeiro,
                combinedHc: newCabeceiro.hc + newPezeiro.hc
            };
        }
        return p;
    }));
  }, [setCompetitors, setPairs]);
  
  const removeCompetitors = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setCompetitors(prev => prev.filter(c => !ids.includes(c.id)));
    // Ao remover competidores, as duplas existentes perdem a validade (reset total)
    setPairs([]); 
    setLockedRounds([]);
    setIsFinalLocked(false);
  }, [setCompetitors, setPairs, setLockedRounds, setIsFinalLocked]);

  const getNumberOfQualifyingRuns = (combinedHc: number): number => {
    // Retorna APENAS o número de corridas classificatórias (sem contar a final)
    if (combinedHc <= 3.5) return 1;
    if (combinedHc <= 4.5) return 2;
    if (combinedHc <= 6.5) return 3;
    return 4;
  };

  const generatePairs = useCallback(() => {
    const cabeceiros = competitors.filter(c => c.modality === Modality.Cabeca || c.modality === Modality.Ambas);
    const pezeiros = competitors.filter(c => c.modality === Modality.Pe || c.modality === Modality.Ambas);
    const newPairs: Pair[] = [];

    cabeceiros.forEach(cabeceiro => {
      pezeiros.forEach(pezeiro => {
        if (cabeceiro.id === pezeiro.id) return;

        const combinedHc = cabeceiro.hc + pezeiro.hc;
        if (combinedHc <= settings.maxHc) {
          const numRuns = getNumberOfQualifyingRuns(combinedHc);
          newPairs.push({
            id: generateId(),
            cabeceiro,
            pezeiro,
            combinedHc,
            qualifyingRuns: Array(numRuns).fill(null),
            finalRun: null,
            disqualified: false,
          });
        }
      });
    });
    
    const interleavedPairs = organizePairs(newPairs);
    setPairs(interleavedPairs);
    setLockedRounds([]);
    setIsFinalLocked(false);
  }, [competitors, settings.maxHc, setPairs, setLockedRounds, setIsFinalLocked]);

  // Nova função para atualizar duplas mantendo dados existentes
  const updatePairsPreservingData = useCallback(() => {
    const currentPairsMap = new Map<string, Pair>();
    // Cria uma chave única baseada nos IDs dos competidores para identificar a dupla
    pairs.forEach(p => {
        // Ordena para garantir consistência (CabeceiroID-PezeiroID)
        // Nota: no nosso app, a ordem cabeceiro/pezeiro é fixa na estrutura, mas a chave composta ajuda.
        const key = `${p.cabeceiro.id}-${p.pezeiro.id}`;
        currentPairsMap.set(key, p);
    });

    const cabeceiros = competitors.filter(c => c.modality === Modality.Cabeca || c.modality === Modality.Ambas);
    const pezeiros = competitors.filter(c => c.modality === Modality.Pe || c.modality === Modality.Ambas);
    const updatedPairsList: Pair[] = [];

    cabeceiros.forEach(cabeceiro => {
      pezeiros.forEach(pezeiro => {
        if (cabeceiro.id === pezeiro.id) return;

        const combinedHc = cabeceiro.hc + pezeiro.hc;
        if (combinedHc <= settings.maxHc) {
             const key = `${cabeceiro.id}-${pezeiro.id}`;
             const existingPair = currentPairsMap.get(key);

             if (existingPair) {
                 // ATUALIZAR: Mantém ID, tempos e status. Atualiza ref de nomes/HC se mudaram.
                 updatedPairsList.push({
                     ...existingPair,
                     cabeceiro, // Atualiza objeto do competidor (caso nome tenha mudado)
                     pezeiro,
                     combinedHc // Recalcula HC
                 });
             } else {
                 // NOVO: Cria nova dupla zerada
                 const numRuns = getNumberOfQualifyingRuns(combinedHc);
                 updatedPairsList.push({
                    id: generateId(),
                    cabeceiro,
                    pezeiro,
                    combinedHc,
                    qualifyingRuns: Array(numRuns).fill(null),
                    finalRun: null,
                    disqualified: false,
                  });
             }
        }
      });
    });

    // Reorganiza o sorteio com a lista atualizada
    const interleavedPairs = organizePairs(updatedPairsList);
    setPairs(interleavedPairs);
    // Nota: Não resetamos lockedRounds aqui, pois queremos manter o estado dos tempos já lançados
  }, [competitors, pairs, settings.maxHc, setPairs]);

  const updateRunTime = useCallback((pairId: string, runIndex: number, time: RunTime) => {
    setPairs(prevPairs =>
      prevPairs.map(p => {
        if (p.id === pairId) {
          const newQualifyingRuns = [...p.qualifyingRuns];
          newQualifyingRuns[runIndex] = time;
          const isDisqualified = newQualifyingRuns.includes('SAT') || time === 'SAT';
          return { ...p, qualifyingRuns: newQualifyingRuns, disqualified: isDisqualified };
        }
        return p;
      })
    );
  }, [setPairs]);
  
  const updateFinalRunTime = useCallback((pairId: string, time: RunTime) => {
    setPairs(prevPairs =>
        prevPairs.map(p => {
            if (p.id === pairId) {
                const isDisqualified = p.disqualified || time === 'SAT';
                return { ...p, finalRun: time, disqualified: isDisqualified };
            }
            return p;
        })
    );
  }, [setPairs]);

  const resetCompetition = useCallback(() => {
    setPairs([]);
    setCompetitors([]);
    setSettings(initialSettings);
    setLockedRounds([]);
    setIsFinalLocked(false);
  }, [setCompetitors, setPairs, setSettings, setLockedRounds, setIsFinalLocked]);

  const toggleRoundLock = useCallback((roundIndex: number) => {
    setLockedRounds(prev => {
        if (prev.includes(roundIndex)) {
            return prev.filter(r => r !== roundIndex);
        } else {
            return [...prev, roundIndex];
        }
    });
  }, [setLockedRounds]);

  const toggleFinalLock = useCallback(() => {
    setIsFinalLocked(prev => !prev);
  }, [setIsFinalLocked]);

  const exportData = useCallback(() => {
    const data = {
        settings,
        competitors,
        pairs,
        lockedRounds,
        isFinalLocked,
        exportDate: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_competicao_${settings.eventName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [settings, competitors, pairs, lockedRounds, isFinalLocked]);

  const importData = useCallback((jsonContent: string) => {
    try {
        const parsed = JSON.parse(jsonContent);
        if (!parsed.settings || !Array.isArray(parsed.competitors)) {
            throw new Error("Formato de arquivo inválido");
        }
        setSettings(parsed.settings);
        setCompetitors(parsed.competitors);
        setPairs(parsed.pairs || []);
        setLockedRounds(parsed.lockedRounds || []);
        setIsFinalLocked(!!parsed.isFinalLocked);
        return true;
    } catch (error) {
        console.error("Erro ao importar dados:", error);
        return false;
    }
  }, [setSettings, setCompetitors, setPairs, setLockedRounds, setIsFinalLocked]);

  const value = {
    settings,
    updateSettings,
    competitors,
    addCompetitor,
    updateCompetitor, // Exported
    removeCompetitors,
    pairs,
    generatePairs,
    updatePairsPreservingData,
    updateRunTime,
    updateFinalRunTime,
    resetCompetition,
    lockedRounds,
    isFinalLocked,
    toggleRoundLock,
    toggleFinalLock,
    exportData,
    importData,
  };

  return <CompetitionContext.Provider value={value}>{children}</CompetitionContext.Provider>;
};

export const useCompetition = () => {
  const context = useContext(CompetitionContext);
  if (context === undefined) {
    throw new Error('useCompetition must be used within a CompetitionProvider');
  }
  return context;
};
