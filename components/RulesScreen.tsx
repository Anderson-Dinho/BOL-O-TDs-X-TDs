import React, { useState } from 'react';
import { useCompetition } from '../context/CompetitionContext';
import { HandicapRule } from '../types';

interface RulesScreenProps {
  goToSetup: () => void;
  onLogout: () => void;
}

const RulesScreen: React.FC<RulesScreenProps> = ({ goToSetup, onLogout }) => {
  const { handicapRules, updateHandicapRules, settings, updateSettings } = useCompetition();
  const [newRule, setNewRule] = useState<HandicapRule>({ maxHc: 1, runCount: 1 });
  const [error, setError] = useState('');

  // Ordena regras para exibição
  const sortedRules = [...handicapRules].sort((a, b) => a.maxHc - b.maxHc);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações básicas
    if (newRule.maxHc <= 0 || newRule.runCount <= 0) {
      setError('A soma do HC e a quantidade de bois devem ser maiores que zero.');
      return;
    }

    if (handicapRules.some(r => r.maxHc === newRule.maxHc)) {
      setError('Já existe uma regra para esta soma de HC.');
      return;
    }

    const updatedRules = [...handicapRules, newRule];
    updateHandicapRules(updatedRules);
    
    // Incrementa sugestão para próxima regra
    setNewRule({ maxHc: newRule.maxHc + 1, runCount: newRule.runCount });
  };

  const handleRemoveRule = (indexToRemove: number) => {
      // Pega o HC da regra que está sendo removida para encontrar no array original
      // (pois sortedRules pode ter indice diferente do handicapRules state)
      const ruleToRemove = sortedRules[indexToRemove];
      const updatedRules = handicapRules.filter(r => r.maxHc !== ruleToRemove.maxHc);
      updateHandicapRules(updatedRules);
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateSettings({ ...settings, [name]: Number(value) || 0 });
  };

  // Garante que há pelo menos uma regra para cobrir o HC máximo
  const hasCoverage = sortedRules.length > 0 && sortedRules[sortedRules.length - 1].maxHc >= settings.maxHc;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-yellow-400">
        <div>
          <h2 className="text-2xl font-bold text-white">Configuração de Regras (Defesas)</h2>
          <p className="text-gray-400 text-sm mt-1">
            Defina quantos bois classificatórios cada faixa de soma de HC irá correr.
          </p>
        </div>
        <button onClick={onLogout} className="px-4 py-2 bg-red-900/50 hover:bg-red-800 text-red-200 rounded text-sm font-bold transition">
            Sair
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Formulário de Configuração Geral */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-fit">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Parâmetros Gerais</h3>
             <div className="space-y-4">
                <div>
                    <label htmlFor="eventName" className="block text-sm font-medium text-gray-300">Nome do Evento</label>
                    <input type="text" value={settings.eventName} onChange={(e) => updateSettings({...settings, eventName: e.target.value})} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white" />
                </div>
                 <div>
                    <label htmlFor="maxHc" className="block text-sm font-medium text-gray-300">HC Máximo Permitido (Soma)</label>
                    <input 
                        type="number" 
                        name="maxHc" 
                        id="maxHc" 
                        value={settings.maxHc} 
                        onChange={handleSettingsChange} 
                        className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white font-bold text-lg" 
                    />
                    <p className="text-xs text-gray-500 mt-1">A soma do HC da dupla não pode ultrapassar este valor.</p>
                </div>
                <div>
                     <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-300">Tempo Limite (segundos)</label>
                    <input type="number" name="timeLimit" id="timeLimit" value={settings.timeLimit} onChange={handleSettingsChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white" />
                </div>
            </div>
        </div>

        {/* Adicionar Regras */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Adicionar Regra de Bois</h3>
            <form onSubmit={handleAddRule} className="space-y-4">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-300">Soma HC até:</label>
                        <input 
                            type="number" 
                            step="0.5"
                            value={newRule.maxHc}
                            onChange={(e) => setNewRule({...newRule, maxHc: parseFloat(e.target.value)})}
                            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-300">Qtde. Bois (Classif.):</label>
                        <input 
                            type="number" 
                            value={newRule.runCount}
                            onChange={(e) => setNewRule({...newRule, runCount: parseInt(e.target.value)})}
                            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md p-2 text-white"
                        />
                    </div>
                </div>
                
                {error && <p className="text-red-400 text-sm font-bold">{error}</p>}

                <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition">
                    + Adicionar Faixa
                </button>
            </form>

            <div className="mt-6 border-t border-gray-700 pt-4">
                <h4 className="font-bold text-white mb-2">Regras Ativas</h4>
                <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-700 text-gray-300 uppercase font-medium">
                            <tr>
                                <th className="p-3">Soma HC (Até)</th>
                                <th className="p-3 text-center">Bois / CL</th>
                                <th className="p-3 text-center">Boi da Final</th>
                                <th className="p-3 text-center">Total</th>
                                <th className="p-3 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {sortedRules.map((rule, idx) => (
                                <tr key={idx} className="hover:bg-gray-800 transition">
                                    <td className="p-3 font-bold text-white">{rule.maxHc.toFixed(1)}</td>
                                    <td className="p-3 text-center text-yellow-400 font-bold">{rule.runCount}</td>
                                    <td className="p-3 text-center text-green-400 font-bold">1</td>
                                    <td className="p-3 text-center font-bold text-white">{rule.runCount + 1}</td>
                                    <td className="p-3 text-right">
                                        <button 
                                            onClick={() => handleRemoveRule(idx)}
                                            className="text-red-500 hover:text-red-400 font-bold px-2"
                                            title="Remover regra"
                                        >
                                            ✕
                                        </button>
                                    </td>
                                </tr>
                            ))}
                             {sortedRules.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-gray-500 italic">Nenhuma regra definida.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {!hasCoverage && sortedRules.length > 0 && (
                    <div className="mt-3 p-2 bg-orange-900/30 border border-orange-500/50 rounded text-xs text-orange-200">
                        ⚠ Atenção: O HC Máximo configurado ({settings.maxHc}) é maior que a sua maior regra ({sortedRules[sortedRules.length-1].maxHc}). HCs acima da regra usarão {sortedRules[sortedRules.length-1].runCount} bois.
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-700">
          <button 
            onClick={goToSetup} 
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg flex items-center gap-2 text-lg transition transform hover:scale-105"
          >
              Continuar para Cadastro de Competidores ➡
          </button>
      </div>
    </div>
  );
};

export default RulesScreen;