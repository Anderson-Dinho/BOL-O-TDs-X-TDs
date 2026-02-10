import React, { useState, useEffect } from 'react';
import { useCompetition } from '../context/CompetitionContext';
import { Pair, RunTime } from '../types';

interface CompetitionScreenProps {
  goToResults: () => void;
  goToSetup: () => void;
}

const getAverageTime = (pair: Pair): number | null => {
    // Averages only qualifying runs for pre-final sorting
    const times = pair.qualifyingRuns.filter(t => typeof t === 'number') as number[];
    if (times.length === 0 || times.length < pair.qualifyingRuns.length) return null;
    const totalTime = times.reduce((acc, time) => acc + time, 0);
    return totalTime / times.length;
}

// Logic duplicated locally for the print-view report
const calculateFinalAverageForReport = (pair: Pair): number | null => {
    if (pair.disqualified || pair.finalRun === null || typeof pair.finalRun === 'string') {
        return null;
    }
    const qualifyingTimes = pair.qualifyingRuns.filter(t => typeof t === 'number') as number[];
    if (qualifyingTimes.length !== pair.qualifyingRuns.length) {
        return null;
    }
    const allTimes = [...qualifyingTimes, pair.finalRun];
    const totalTime = allTimes.reduce((sum, time) => sum + time, 0);
    const totalRuns = pair.qualifyingRuns.length + 1;
    return totalTime / totalRuns;
};

const RunInput: React.FC<{ 
    value: RunTime | null, 
    onChange: (value: RunTime | null) => void, 
    timeLimit: number,
    locked?: boolean,
    alwaysAuthorized?: boolean,
    label?: string
}> = ({ value, onChange, timeLimit, locked = false, alwaysAuthorized = false, label }) => {
    const [inputValue, setInputValue] = useState(value === 'SAT' ? '' : (value || ''));
    const [allowOverLimit, setAllowOverLimit] = useState(false);

    const isAuthorized = allowOverLimit || alwaysAuthorized;

    useEffect(() => {
        setInputValue(value === 'SAT' ? '' : (value || ''));
        if (typeof value === 'number' && value > timeLimit && !alwaysAuthorized) {
            setAllowOverLimit(true);
        }
    }, [value, timeLimit, alwaysAuthorized]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const strValue = e.target.value;
        setInputValue(strValue);
        
        if (strValue === '') {
            onChange(null);
            return;
        }

        const numValue = parseFloat(strValue);
        if (!isNaN(numValue)) {
            if (numValue > timeLimit && !isAuthorized) {
                onChange('SAT');
            } else {
                onChange(numValue);
            }
        }
    };
    
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const numValue = parseFloat(e.target.value);
        if (e.target.value === '' || isNaN(numValue)) {
            onChange(null);
        } else {
             onChange((numValue > timeLimit && !isAuthorized) ? 'SAT' : numValue);
        }
    }

    const handleSatClick = () => {
        onChange('SAT');
    }

    const handleResetClick = () => {
        onChange(null);
        if (!alwaysAuthorized) {
            setAllowOverLimit(false);
        }
    }

    const toggleOverLimit = () => {
        if (!alwaysAuthorized && !locked) {
            setAllowOverLimit(prev => !prev);
        }
    }

    const isSat = value === 'SAT';
    const isDisabled = isSat || locked;
    const isOverLimitValue = typeof value === 'number' && value > timeLimit;

    return (
        <div className="flex items-end space-x-1">
            <div className="flex flex-col items-center">
                {label && <span className="text-xs font-bold text-gray-400 mb-1 whitespace-nowrap">{label}</span>}
                <input
                    type="number"
                    step="0.001"
                    value={inputValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="0.00"
                    className={`w-24 p-2 rounded text-center text-white transition-colors
                        ${isSat ? 'border-red-500 bg-red-900/50' : ''} 
                        ${isOverLimitValue ? 'border-orange-500 text-orange-300' : ''}
                        ${locked && !isSat ? 'bg-gray-800 border-gray-600 text-gray-400' : (!isSat && !isOverLimitValue ? 'bg-gray-700 border-gray-600 focus:ring-yellow-500 focus:border-yellow-500' : '')} 
                        ${isOverLimitValue && !locked ? 'bg-gray-700' : ''}
                        ${isDisabled ? 'opacity-70 cursor-not-allowed' : ''}
                    `}
                    disabled={isDisabled}
                />
            </div>
            <button 
                onClick={handleSatClick} 
                className={`px-3 py-2 rounded text-xs font-bold transition notranslate ${isSat ? 'bg-red-500 text-white' : 'bg-gray-600 hover:bg-red-500'} disabled:opacity-50 disabled:cursor-not-allowed`}
                title={"Marcar como S.A.T. (Sem Aproveitamento Técnico)"}
                disabled={isDisabled}
                translate="no"
            >
                S.A.T.
            </button>
            <button 
                onClick={handleResetClick} 
                className={`w-9 h-9 flex items-center justify-center rounded text-lg font-bold transition bg-gray-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Limpar tempo / Desfazer S.A.T."
                disabled={value === null || locked}
            >
                🔄
            </button>
             <button 
                onClick={toggleOverLimit}
                className={`w-9 h-9 flex items-center justify-center rounded text-lg font-bold transition 
                    ${isAuthorized ? 'bg-orange-600 text-white shadow-[0_0_10px_rgba(234,88,12,0.5)]' : 'bg-gray-700 text-gray-500 hover:bg-orange-500 hover:text-white'} 
                    ${locked ? 'opacity-50 cursor-not-allowed' : ''}
                    ${alwaysAuthorized && !locked ? 'cursor-default' : ''}
                `}
                title={isAuthorized ? "Estouro de tempo AUTORIZADO" : "Autorizar tempo acima do limite"}
                disabled={locked}
                type="button"
            >
                ⚠️
            </button>
        </div>
    );
};


const CompetitionScreen: React.FC<CompetitionScreenProps> = ({ goToResults, goToSetup }) => {
  const { 
      pairs, 
      updateRunTime, 
      updateFinalRunTime, 
      settings,
      lockedRounds,
      isFinalLocked,
      toggleRoundLock,
      toggleFinalLock,
      exportData
  } = useCompetition();
  const [activeTab, setActiveTab] = useState<'qualifying' | 'final'>('qualifying');
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  if (pairs.length === 0) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-yellow-400">Nenhuma dupla foi gerada.</h2>
        <p className="text-gray-400 mt-2">Vá para a tela de configuração para adicionar competidores e iniciar a competição.</p>
        <button onClick={goToSetup} className="mt-6 px-6 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-md hover:bg-yellow-500 transition">
          Ir para Cadastros
        </button>
      </div>
    );
  }

  const handleGeneratePDF = () => {
      setIsPdfGenerating(true);
      // Aguarda um ciclo de renderização para que o conteúdo oculto seja exibido
      setTimeout(() => {
          const element = document.getElementById('pdf-competition-container');
          const opt = {
              margin: [10, 10, 10, 10], // top, left, bottom, right
              filename: `relatorio_competicao_${settings.eventName.replace(/\s+/g, '_')}.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true, letterRendering: true },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
          };

          // @ts-ignore
          if (window.html2pdf) {
              // @ts-ignore
              window.html2pdf().set(opt).from(element).save().then(() => {
                  setIsPdfGenerating(false);
              }).catch((err: any) => {
                  console.error("Erro ao gerar PDF", err);
                  setIsPdfGenerating(false);
              });
          } else {
              alert('Erro: Biblioteca de PDF não carregada. Tente recarregar a página.');
              setIsPdfGenerating(false);
          }
      }, 500);
  };

  const maxQualifyingRuns = Math.max(...pairs.map(p => p.qualifyingRuns.length), 0);
  const qualifyingRounds = Array.from({ length: maxQualifyingRuns }, (_, i) => i);
  
  const allQualifyingDone = pairs.every(p => p.disqualified || p.qualifyingRuns.every(run => run !== null));
  
  const qualifiedPairsForFinal = pairs.filter(p => !p.disqualified && p.qualifyingRuns.every(run => run !== null));
  const finalPairsSorted = [...qualifiedPairsForFinal].sort((a, b) => {
    const avgA = getAverageTime(a) ?? Infinity;
    const avgB = getAverageTime(b) ?? Infinity;
    return avgB - avgA; 
  });

  // Calculate ranks for the print report
  const reportRankedPairs = pairs
    .map(pair => ({
      ...pair,
      finalAverage: calculateFinalAverageForReport(pair),
    }))
    .filter(pair => pair.finalAverage !== null)
    .sort((a, b) => (a.finalAverage as number) - (b.finalAverage as number));

  // Format date for display
  const formattedDate = settings.eventDate ? settings.eventDate.split('-').reverse().join('/') : '';

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center flex-wrap gap-4 no-print">
        <h2 className="text-3xl font-bold text-yellow-400">Baterias da Competição</h2>
         <div className="flex gap-4 flex-wrap justify-end">
          <button 
            type="button" 
            onClick={handleGeneratePDF}
            disabled={isPdfGenerating}
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
          >
            {isPdfGenerating ? 'Gerando...' : '📄 Relatório PDF'}
          </button>
          <button onClick={exportData} className="px-4 py-2 bg-gray-700 text-gray-300 font-semibold rounded-md hover:bg-gray-600 transition flex items-center gap-2 text-sm">
            💾 Salvar Backup
          </button>
          <button onClick={goToSetup} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition">
            ⬅ Voltar para Cadastros
          </button>
          <button onClick={goToResults} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition">
            Ver Resultados
          </button>
        </div>
      </div>
      
      <div className="flex border-b border-gray-700 no-print">
        <button onClick={() => setActiveTab('qualifying')} className={`py-2 px-4 text-lg font-semibold ${activeTab === 'qualifying' ? 'border-b-2 border-yellow-400 text-yellow-400' : 'text-gray-400'}`}>
          Classificatórias
        </button>
        <button onClick={() => setActiveTab('final')} className={`py-2 px-4 text-lg font-semibold ${activeTab === 'final' ? 'border-b-2 border-yellow-400 text-yellow-400' : 'text-gray-400'}`} disabled={!allQualifyingDone}>
          Final { !allQualifyingDone && "🔒"}
        </button>
      </div>

      <div id="pdf-competition-container">
          <div className={`${activeTab === 'qualifying' || isPdfGenerating ? 'block' : 'hidden'} print:block space-y-4`}>
              {/* Header for PDF */}
              <div className={`hidden ${isPdfGenerating ? 'block' : ''} print:block border-b border-gray-500 mb-4 pb-2`}>
                  <h3 className="text-2xl font-bold text-yellow-500">
                      Relatório Geral - {settings.eventName}
                  </h3>
                  {formattedDate && <p className="text-black text-sm mt-1">Data: {formattedDate}</p>}
              </div>
              <h3 className={`hidden ${isPdfGenerating ? 'block' : ''} print:block text-xl font-bold text-white mt-4 mb-2`}>Classificatórias</h3>
              
              {qualifyingRounds.map(roundIndex => {
                  const isLocked = lockedRounds.includes(roundIndex);
                  return (
                      <div key={roundIndex} className="bg-gray-800 p-4 rounded-lg break-inside-avoid mb-4">
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="text-xl font-bold text-yellow-300">Classificatória {roundIndex + 1}</h3>
                              <button
                                  onClick={() => toggleRoundLock(roundIndex)}
                                  className={`px-4 py-1 rounded text-sm font-bold flex items-center gap-2 transition no-print ${isLocked ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-green-600 text-white hover:bg-green-700'}`}
                              >
                                  {isLocked ? (
                                      <>🔓 Editar Tempos</>
                                  ) : (
                                      <>🔒 Salvar Tempos</>
                                  )}
                              </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {pairs.map(pair => (
                                  pair.qualifyingRuns.length > roundIndex && (
                                      <div key={pair.id} className={`p-3 rounded-md transition duration-300 break-inside-avoid ${pair.disqualified ? 'bg-red-900/50 opacity-60' : (isLocked ? 'bg-gray-800 border border-gray-700' : 'bg-gray-700')}`}>
                                          <div className="flex justify-between items-center">
                                              <div>
                                                  <p className="font-bold text-white leading-tight">{pair.cabeceiro.fullName} & {pair.pezeiro.fullName}</p>
                                                  <p className="text-xs text-gray-400 leading-tight">({pair.cabeceiro.nickname} & {pair.pezeiro.nickname})</p>
                                                  <p className="text-xs text-gray-500 mt-1">HC: {pair.combinedHc}</p>
                                              </div>
                                              <RunInput
                                                  value={pair.qualifyingRuns[roundIndex]}
                                                  onChange={(time) => updateRunTime(pair.id, roundIndex, time)}
                                                  timeLimit={settings.timeLimit}
                                                  locked={isLocked}
                                                  label="Tempo / Cl."
                                              />
                                          </div>
                                      </div>
                                  )
                              ))}
                          </div>
                      </div>
                  );
              })}
          </div>
          
          {allQualifyingDone && (
            <div className={`${activeTab === 'final' || isPdfGenerating ? 'block' : 'hidden'} print:block bg-gray-800 p-4 rounded-lg break-inside-avoid mt-6`}>
              <h3 className={`hidden ${isPdfGenerating ? 'block' : ''} print:block text-xl font-bold text-white mt-6 mb-2`}>Final</h3>

              <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-xl font-bold text-yellow-300">Boi da Final</h3>
                    <p className="text-sm text-gray-400">As duplas são chamadas da maior média para a menor para correr o boi final.</p>
                </div>
                <button
                    onClick={toggleFinalLock}
                    className={`px-4 py-1 rounded text-sm font-bold flex items-center gap-2 transition no-print ${isFinalLocked ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                    {isFinalLocked ? (
                        <>🔓 Editar Tempos</>
                    ) : (
                        <>🔒 Salvar Tempos</>
                    )}
                </button>
              </div>
              <div className="space-y-3">
                {finalPairsSorted.map(pair => (
                    <div key={pair.id} className={`p-3 rounded-md grid grid-cols-3 items-center gap-4 break-inside-avoid ${pair.disqualified ? 'bg-red-900/50 opacity-60' : (isFinalLocked ? 'bg-gray-800 border border-gray-700' : 'bg-gray-700')}`}>
                        <div>
                          <p className="font-bold text-white leading-tight">{pair.cabeceiro.fullName} & {pair.pezeiro.fullName}</p>
                          <p className="text-xs text-gray-400 leading-tight">({pair.cabeceiro.nickname} & {pair.pezeiro.nickname})</p>
                          <p className="text-xs text-gray-500 mt-1">HC: {pair.combinedHc}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-300">Média Classif.</p>
                            <p className="font-mono text-lg">{getAverageTime(pair)?.toFixed(3) || 'N/A'}</p>
                        </div>
                        <div className="flex justify-end">
                           <RunInput
                                value={pair.finalRun}
                                onChange={(time) => updateFinalRunTime(pair.id, time)}
                                timeLimit={settings.timeLimit}
                                locked={isFinalLocked}
                                alwaysAuthorized={true}
                                label="Tempo / Final"
                            />
                        </div>
                    </div>
                ))}
              </div>
            </div>
          )}

          {/* Hidden section that only appears in print/PDF to show the Final Results Table */}
          {reportRankedPairs.length > 0 && (
              <div className={`hidden ${isPdfGenerating ? 'block' : ''} print:block mt-8 break-before-page p-4 bg-gray-100 text-black rounded`}>
                   <h3 className="text-2xl font-bold text-black border-b border-black mb-4 pb-2">Resultados Finais (Ranking)</h3>
                   {formattedDate && <p className="text-black text-sm mb-2">Data: {formattedDate}</p>}
                   <table className="min-w-full border border-black text-xs text-black">
                        <thead>
                            <tr className="bg-gray-300">
                                <th className="border border-black px-2 py-1 text-black">Pos.</th>
                                <th className="border border-black px-2 py-1 text-black">Dupla</th>
                                <th className="border border-black px-2 py-1 text-black">HC</th>
                                <th className="border border-black px-2 py-1 text-black">Tempos</th>
                                <th className="border border-black px-2 py-1 text-black">Média</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportRankedPairs.map((pair, index) => (
                                 <tr key={pair.id}>
                                    <td className="border border-black px-2 py-1 text-center font-bold text-black">{index + 1}º</td>
                                    <td className="border border-black px-2 py-1 text-black">
                                        {pair.cabeceiro.fullName} ({pair.cabeceiro.nickname}) & {pair.pezeiro.fullName} ({pair.pezeiro.nickname})
                                    </td>
                                    <td className="border border-black px-2 py-1 text-center text-black">{pair.combinedHc}</td>
                                    <td className="border border-black px-2 py-1 text-center text-black">
                                        {[...pair.qualifyingRuns, pair.finalRun].map(t => typeof t === 'number' ? t.toFixed(3) : t).join(' / ')}
                                    </td>
                                    <td className="border border-black px-2 py-1 text-center font-bold text-black">{pair.finalAverage?.toFixed(3)}</td>
                                 </tr>
                            ))}
                        </tbody>
                   </table>
              </div>
          )}
      </div>
    </div>
  );
};

export default CompetitionScreen;