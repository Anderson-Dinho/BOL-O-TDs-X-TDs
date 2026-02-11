
import React, { useState, useRef } from 'react';
import { useCompetition } from '../context/CompetitionContext';
import { Competitor, Modality } from '../types';

interface SetupScreenProps {
  goToCompetition: () => void;
  goToRules: () => void; // Nova prop
  onLogout: () => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ goToCompetition, goToRules, onLogout }) => {
  const { settings, updateSettings, competitors, addCompetitor, updateCompetitor, removeCompetitors, generatePairs, updatePairsPreservingData, resetCompetition, pairs, exportData, importData } = useCompetition();
  const [newCompetitor, setNewCompetitor] = useState<Omit<Competitor, 'id'>>({
    fullName: '',
    nickname: '',
    modality: Modality.Cabeca,
    hc: 1,
  });
  const [selectedCompetitorIds, setSelectedCompetitorIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false); // New modal state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isNumeric = name === 'timeLimit' || name === 'maxHc';
    updateSettings({ ...settings, [name]: isNumeric ? Number(value) || 0 : value });
  };

  const handleCompetitorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewCompetitor(prev => ({ ...prev, [name]: name === 'hc' ? parseFloat(value) || 0 : value }));
  };

  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCompetitor.fullName.trim() && newCompetitor.hc >= 0) {
      addCompetitor({
        ...newCompetitor,
        fullName: newCompetitor.fullName.trim(),
        nickname: newCompetitor.nickname.trim() || newCompetitor.fullName.trim(),
      });
      setNewCompetitor({ fullName: '', nickname: '', modality: Modality.Cabeca, hc: 1 });
    }
  };
  
  const handleContinueOrStart = () => {
    if (pairs.length === 0) {
      if (competitors.length < 2) {
        alert('É necessário ter pelo menos 2 competidores para gerar as duplas.');
        return;
      }
      generatePairs();
    }
    goToCompetition();
  }

  const handleRegenerateClick = () => {
    setShowRegenerateConfirm(true);
  }

  const handleUpdateClick = () => {
    setShowUpdateConfirm(true);
  }

  const confirmRegenerate = () => {
    generatePairs();
    setShowRegenerateConfirm(false);
    goToCompetition();
  };

  const confirmUpdate = () => {
    updatePairsPreservingData();
    setShowUpdateConfirm(false);
    goToCompetition();
  };

  const handleResetClick = () => {
    setShowResetConfirm(true);
  }

  const confirmReset = () => {
    resetCompetition();
    setShowResetConfirm(false);
  };

  const handleSelectionChange = (id: string) => {
    setSelectedCompetitorIds(prev =>
        prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
    );
  };

  const handleDeleteClick = () => {
    if (selectedCompetitorIds.length > 0) {
        setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = () => {
    removeCompetitors(selectedCompetitorIds);
    setSelectedCompetitorIds([]);
    setShowDeleteConfirm(false);
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target?.result as string;
        if (importData(content)) {
            setSaveMessage('✅ Backup carregado com sucesso!');
            setTimeout(() => setSaveMessage(''), 3000);
        } else {
            alert('Erro ao carregar o arquivo. Verifique se é um arquivo JSON válido.');
        }
    };
    reader.readAsText(file);
    // Limpa o input para permitir selecionar o mesmo arquivo novamente se necessário
    event.target.value = '';
  };
  
  const handleHcChange = (e: React.MouseEvent, id: string, currentHc: number, delta: number) => {
    e.stopPropagation(); // Previne a seleção do checkbox
    e.preventDefault();
    const newHc = currentHc + delta;
    if (newHc < 0.5) return; // Mínimo
    // Arredonda para 1 casa decimal para evitar erros de ponto flutuante
    const roundedHc = Math.round(newHc * 2) / 2;
    updateCompetitor(id, { hc: roundedHc });
  };

  const cabeceiros = competitors.filter(c => c.modality === Modality.Cabeca || c.modality === Modality.Ambas);
  const pezeiros = competitors.filter(c => c.modality === Modality.Pe || c.modality === Modality.Ambas);

  const hcValues = [];
  for (let i = 1; i <= 8; i += 0.5) {
      hcValues.push(i);
  }

  return (
    <div className="space-y-8 relative pb-20">
      <div className="flex justify-between items-center mb-6">
          <button 
            onClick={goToRules}
            className="text-gray-400 hover:text-white flex items-center gap-1 transition"
          >
              ⬅ Voltar para Regras
          </button>
      </div>

      {/* Info Rápida de Configuração */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-wrap gap-4 items-center justify-between border-l-4 border-blue-500">
        <div>
            <h2 className="text-xl font-bold text-white">{settings.eventName}</h2>
            <p className="text-gray-400 text-sm">Data: {settings.eventDate} | Limite: {settings.timeLimit}s | HC Máx: {settings.maxHc}</p>
        </div>
        <button onClick={goToRules} className="text-blue-400 hover:text-blue-300 text-sm underline">
            Editar Configurações
        </button>
      </div>

      {/* Add Competitor Section */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">Adicionar Competidor</h2>
        <form onSubmit={handleAddCompetitor} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">Nome Completo</label>
              <input id="fullName" type="text" name="fullName" value={newCompetitor.fullName} onChange={handleCompetitorChange} required className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md p-2 shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-300">Apelido (Opcional)</label>
              <input id="nickname" type="text" name="nickname" value={newCompetitor.nickname} onChange={handleCompetitorChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md p-2 shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="modality" className="block text-sm font-medium text-gray-300">Modalidade</label>
              <select id="modality" name="modality" value={newCompetitor.modality} onChange={handleCompetitorChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md p-2 shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm">
                {Object.values(Modality).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="hc" className="block text-sm font-medium text-gray-300">HC</label>
              <select id="hc" name="hc" value={newCompetitor.hc} onChange={handleCompetitorChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md p-2 shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm">
                {hcValues.map(val => (
                  <option key={val} value={val}>{val.toFixed(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="w-full md:w-auto px-6 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-md hover:bg-yellow-500 transition">Adicionar</button>
        </form>
      </div>

      {/* Competitors List Section */}
      <div className="bg-gray-900 border border-gray-700 p-4 rounded-xl">
        <h3 className="text-xl font-bold text-white mb-2 text-center">
            Total de Competidores Cadastrados: <span className="text-yellow-400 text-2xl">{competitors.length}</span>
        </h3>
        <p className="text-center text-sm text-gray-400 mb-6">Verifique abaixo se todos estão na lista antes de gerar as duplas.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col h-full">
                <h3 className="text-xl font-bold text-yellow-400 mb-3 flex justify-between">
                    <span>Cabeceiros</span>
                    <span className="text-sm bg-gray-700 px-2 py-1 rounded text-white">{cabeceiros.length}</span>
                </h3>
                <div className="bg-gray-700/50 rounded p-2 flex-grow overflow-y-auto min-h-[300px] max-h-[500px] border border-gray-600">
                    {cabeceiros.length === 0 ? (
                        <p className="text-gray-400 text-center italic mt-4">Nenhum cabeceiro cadastrado.</p>
                    ) : (
                        <ul className="space-y-2">
                            {cabeceiros.map(c => (
                                <li key={c.id} className="flex items-center bg-gray-700 p-2 rounded gap-3 hover:bg-gray-600 transition">
                                    <input
                                        type="checkbox"
                                        id={`competitor-c-${c.id}`}
                                        checked={selectedCompetitorIds.includes(c.id)}
                                        onChange={() => handleSelectionChange(c.id)}
                                        className="form-checkbox h-5 w-5 bg-gray-600 border-gray-500 rounded text-yellow-500 focus:ring-yellow-600 cursor-pointer"
                                    />
                                    <label htmlFor={`competitor-c-${c.id}`} className="flex-grow flex items-center justify-between cursor-pointer select-none">
                                        <div className="flex-grow">
                                            <span className="font-semibold text-white">{c.fullName}</span>
                                            <span className="text-yellow-400 ml-1">({c.nickname})</span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-gray-800 rounded px-2 py-1 ml-2 border border-gray-600" onClick={(e) => e.preventDefault()}>
                                            <button 
                                                onClick={(e) => handleHcChange(e, c.id, c.hc, -0.5)}
                                                className="w-6 h-6 flex items-center justify-center bg-gray-700 text-white rounded hover:bg-red-500 transition font-bold text-xs"
                                                title="Diminuir HC"
                                            >
                                                ▼
                                            </button>
                                            <span className="text-gray-200 text-sm font-mono font-bold w-12 text-center">HC: {c.hc.toFixed(1)}</span>
                                            <button 
                                                onClick={(e) => handleHcChange(e, c.id, c.hc, 0.5)}
                                                className="w-6 h-6 flex items-center justify-center bg-gray-700 text-white rounded hover:bg-green-500 transition font-bold text-xs"
                                                title="Aumentar HC"
                                            >
                                                ▲
                                            </button>
                                        </div>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col h-full">
                <h3 className="text-xl font-bold text-yellow-400 mb-3 flex justify-between">
                    <span>Pezeiros</span>
                    <span className="text-sm bg-gray-700 px-2 py-1 rounded text-white">{pezeiros.length}</span>
                </h3>
                <div className="bg-gray-700/50 rounded p-2 flex-grow overflow-y-auto min-h-[300px] max-h-[500px] border border-gray-600">
                    {pezeiros.length === 0 ? (
                        <p className="text-gray-400 text-center italic mt-4">Nenhum pezeiro cadastrado.</p>
                    ) : (
                        <ul className="space-y-2">
                            {pezeiros.map(c => (
                                <li key={c.id} className="flex items-center bg-gray-700 p-2 rounded gap-3 hover:bg-gray-600 transition">
                                    <input
                                        type="checkbox"
                                        id={`competitor-p-${c.id}`}
                                        checked={selectedCompetitorIds.includes(c.id)}
                                        onChange={() => handleSelectionChange(c.id)}
                                         className="form-checkbox h-5 w-5 bg-gray-600 border-gray-500 rounded text-yellow-500 focus:ring-yellow-600 cursor-pointer"
                                    />
                                    <label htmlFor={`competitor-p-${c.id}`} className="flex-grow flex items-center justify-between cursor-pointer select-none">
                                        <div className="flex-grow">
                                            <span className="font-semibold text-white">{c.fullName}</span>
                                            <span className="text-yellow-400 ml-1">({c.nickname})</span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-gray-800 rounded px-2 py-1 ml-2 border border-gray-600" onClick={(e) => e.preventDefault()}>
                                            <button 
                                                onClick={(e) => handleHcChange(e, c.id, c.hc, -0.5)}
                                                className="w-6 h-6 flex items-center justify-center bg-gray-700 text-white rounded hover:bg-red-500 transition font-bold text-xs"
                                                title="Diminuir HC"
                                            >
                                                ▼
                                            </button>
                                            <span className="text-gray-200 text-sm font-mono font-bold w-12 text-center">HC: {c.hc.toFixed(1)}</span>
                                            <button 
                                                onClick={(e) => handleHcChange(e, c.id, c.hc, 0.5)}
                                                className="w-6 h-6 flex items-center justify-center bg-gray-700 text-white rounded hover:bg-green-500 transition font-bold text-xs"
                                                title="Aumentar HC"
                                            >
                                                ▲
                                            </button>
                                        </div>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
      </div>
        
      {/* Actions */}
      <div className="space-y-4 pt-4">
        {saveMessage && (
            <div className="w-full bg-green-800/80 text-green-100 p-3 rounded text-center font-bold animate-pulse">
                {saveMessage}
            </div>
        )}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div className="flex gap-2">
                    <button 
                        type="button"
                        onClick={exportData} 
                        className="px-4 py-2 bg-gray-700 text-gray-300 font-semibold rounded-md hover:bg-gray-600 transition text-sm"
                    >
                        💾 Salvar Backup
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleImportFile}
                        accept=".json"
                        className="hidden" 
                        style={{ display: 'none' }}
                    />
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()} 
                        className="px-4 py-2 bg-teal-700 text-white font-semibold rounded-md hover:bg-teal-600 transition text-sm flex items-center gap-1"
                    >
                        📂 Abrir Backup
                    </button>
                </div>
                 <button 
                    type="button"
                    onClick={handleDeleteClick} 
                    className="px-6 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
                    disabled={selectedCompetitorIds.length === 0}
                >
                    Excluir ({selectedCompetitorIds.length})
                </button>
                <button type="button" onClick={handleResetClick} className="px-6 py-2 bg-gray-700 text-gray-300 font-semibold rounded-md hover:bg-gray-600 transition">
                    Resetar Tudo
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <button type="button" onClick={onLogout} className="px-4 py-3 bg-red-900/50 text-red-200 border border-red-800 font-bold rounded-lg hover:bg-red-900 transition shadow-lg text-sm">
                    Sair
                </button>
                 {pairs.length > 0 && (
                    <div className="flex flex-col md:flex-row gap-2">
                         <button type="button" onClick={handleUpdateClick} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-lg text-lg">
                            Atualizar Sorteio
                        </button>
                        <button type="button" onClick={handleRegenerateClick} className="px-6 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition shadow-lg text-lg">
                            Regerar TUDO
                        </button>
                    </div>
                )}
                <button type="button" onClick={handleContinueOrStart} className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition shadow-lg text-lg" disabled={competitors.length < 2}>
                   {pairs.length > 0 ? 'Continuar' : 'Gerar Duplas'}
                </button>
            </div>
        </div>
      </div>
      {/* ... Modals ... */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full border border-gray-700 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-2">Confirmar Exclusão</h3>
                <p className="text-gray-300 mb-6">
                    Tem certeza que deseja remover {selectedCompetitorIds.length} competidor(es)? 
                    Isso irá resetar as duplas geradas.
                </p>
                <div className="flex justify-end gap-3">
                    <button 
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="button"
                        onClick={confirmDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-bold"
                    >
                        Sim, Excluir
                    </button>
                </div>
            </div>
        </div>
      )}

       {/* Modal de Confirmação de Atualização (Preservar Tempos) */}
       {showUpdateConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full border border-gray-700 shadow-2xl border-l-4 border-indigo-500">
                <h3 className="text-xl font-bold text-white mb-2">Atualizar Sorteio?</h3>
                <p className="text-gray-300 mb-6">
                    Esta ação irá adicionar as novas combinações de duplas baseadas nos novos competidores.
                    <br/><br/>
                    <strong className="text-green-400">✅ Os tempos já lançados serão MANTIDOS.</strong>
                    <br/>
                    <span className="text-sm text-gray-400">A ordem das duplas será reorganizada.</span>
                </p>
                <div className="flex justify-end gap-3">
                    <button 
                        type="button"
                        onClick={() => setShowUpdateConfirm(false)}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="button"
                        onClick={confirmUpdate}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition font-bold shadow-lg"
                    >
                        Sim, Atualizar
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Modal de Confirmação de Regeração (Apagar Tudo) */}
      {showRegenerateConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full border border-gray-700 shadow-2xl border-l-4 border-orange-500">
                <h3 className="text-xl font-bold text-white mb-2">Regerar TUDO?</h3>
                <p className="text-gray-300 mb-6">
                    <strong className="text-red-500">⚠ ATENÇÃO:</strong>
                    <br/>
                    Isso irá APAGAR <strong>todos os tempos</strong> e resultados da competição atual e criar novas baterias do zero.
                    <br/><br/>
                    Use isso apenas se quiser começar a competição novamente.
                </p>
                <div className="flex justify-end gap-3">
                    <button 
                        type="button"
                        onClick={() => setShowRegenerateConfirm(false)}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="button"
                        onClick={confirmRegenerate}
                        className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition font-bold"
                    >
                        Sim, Apagar e Regerar
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Modal de Confirmação de Reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full border border-gray-700 shadow-2xl border-l-4 border-red-600">
                <h3 className="text-xl font-bold text-white mb-2">Resetar Tudo?</h3>
                <p className="text-gray-300 mb-6">
                    Tem certeza que deseja apagar <strong>TODA</strong> a competição?
                    <br/><br/>
                    Isso removerá todos os competidores, duplas e resultados. Essa ação é irreversível.
                </p>
                <div className="flex justify-end gap-3">
                    <button 
                        type="button"
                        onClick={() => setShowResetConfirm(false)}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="button"
                        onClick={confirmReset}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-bold"
                    >
                        Sim, Resetar
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SetupScreen;
