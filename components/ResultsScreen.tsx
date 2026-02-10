import React, { useState } from 'react';
import { useCompetition } from '../context/CompetitionContext';
import { Pair } from '../types';

interface ResultsScreenProps {
  goToSetup: () => void;
  goToCompetition: () => void;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ goToSetup, goToCompetition }) => {
  const { pairs, settings, exportData } = useCompetition();
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  const calculateFinalAverage = (pair: Pair): number | null => {
    if (pair.disqualified || pair.finalRun === null || typeof pair.finalRun === 'string') {
        return null;
    }
    const qualifyingTimes = pair.qualifyingRuns.filter(t => typeof t === 'number') as number[];
    if (qualifyingTimes.length !== pair.qualifyingRuns.length) {
        return null; // In case a qualifying run is missing but not marked SAT
    }
    const allTimes = [...qualifyingTimes, pair.finalRun];
    const totalTime = allTimes.reduce((sum, time) => sum + time, 0);
    const totalRuns = pair.qualifyingRuns.length + 1;
    
    return totalTime / totalRuns;
  };

  const rankedPairs = pairs
    .map(pair => ({
      ...pair,
      finalAverage: calculateFinalAverage(pair),
    }))
    .filter(pair => pair.finalAverage !== null)
    .sort((a, b) => (a.finalAverage as number) - (b.finalAverage as number));

  const getTrophyColor = (rank: number) => {
    if (rank === 0) return 'text-yellow-400';
    if (rank === 1) return 'text-gray-300';
    if (rank === 2) return 'text-yellow-600';
    return 'text-gray-400';
  }

  const handleGeneratePDF = () => {
    setIsPdfGenerating(true);
    // Pequeno atraso para garantir renderização (se necessário)
    setTimeout(() => {
        const element = document.getElementById('results-pdf-container');
        const opt = {
            margin: [10, 10, 10, 10],
            filename: `resultado_final_${settings.eventName.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
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
    }, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <h2 className="text-3xl font-bold text-yellow-400">Resultados Finais - {settings.eventName}</h2>
        <div className="flex flex-wrap gap-3 justify-center">
            <button 
                type="button" 
                onClick={handleGeneratePDF}
                disabled={isPdfGenerating}
                className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
                {isPdfGenerating ? 'Gerando...' : '📄 Relatório PDF'}
            </button>
            <button onClick={exportData} className="px-5 py-2 bg-gray-700 text-gray-300 font-semibold rounded-md hover:bg-gray-600 transition flex items-center gap-2 text-sm">
                💾 Salvar Backup
            </button>
            <button onClick={goToCompetition} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition">
              ⬅ Voltar para Baterias
            </button>
            <button onClick={goToSetup} className="px-5 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500 transition">
              Setup
            </button>
        </div>
      </div>

      <div id="results-pdf-container" className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold text-white mb-4">Classificação dos Campeões - {settings.eventName}</h3>
        {rankedPairs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">Pos.</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">Dupla</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">HC Total</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">Tempos</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-yellow-400 uppercase tracking-wider">Média Final</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {rankedPairs.slice(0, 10).map((pair, index) => (
                  <tr key={pair.id} className="hover:bg-gray-700/50">
                    <td className={`px-6 py-4 whitespace-nowrap text-lg font-bold ${getTrophyColor(index)}`}>{index + 1}º</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                            <span className="font-bold text-white">
                                {pair.cabeceiro.fullName} <span className="text-gray-400 font-normal">({pair.cabeceiro.nickname})</span>
                            </span>
                            <span className="text-gray-500 text-xs my-0.5">&</span>
                            <span className="font-bold text-white">
                                {pair.pezeiro.fullName} <span className="text-gray-400 font-normal">({pair.pezeiro.nickname})</span>
                            </span>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">{pair.combinedHc}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                        {[...pair.qualifyingRuns, pair.finalRun].map(t => typeof t === 'number' ? t.toFixed(3) : t).join(' / ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-lg font-bold font-mono text-green-400">{pair.finalAverage?.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">Nenhuma dupla completou a final ainda. Volte quando os tempos forem registrados.</p>
        )}
      </div>
    </div>
  );
};

export default ResultsScreen;