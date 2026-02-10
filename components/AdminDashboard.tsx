import React, { useState } from 'react';
import { User } from '../types';
import { SYSTEM_CONFIG } from '../data/users';

interface AdminDashboardProps {
  users: User[];
  onAddUser: (user: User) => void;
  onDeleteUser: (username: string) => void;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, onAddUser, onDeleteUser, onLogout }) => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  
  // State to simulate the toggle before generating code
  const [tempSystemActive, setTempSystemActive] = useState(SYSTEM_CONFIG.active);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newUsername.trim() || !newPassword.trim()) {
      setError('Usuário e senha são obrigatórios.');
      return;
    }

    if (users.find(u => u.username.toLowerCase() === newUsername.trim().toLowerCase())) {
      setError('Este nome de usuário já está em uso.');
      return;
    }

    onAddUser({
      username: newUsername.trim(),
      password: newPassword.trim(),
      role: 'organizer'
    });

    setNewUsername('');
    setNewPassword('');
    setSuccess(`Organizador "${newUsername}" cadastrado com sucesso! Atualize o código abaixo.`);
    setTimeout(() => setSuccess(''), 5000);
  };

  const organizers = users.filter(u => u.role !== 'admin');

  const generateConfigCode = () => {
      const usersJson = JSON.stringify(users, null, 2);
      return `import { User } from '../types';\n\n// Configuração Global do Sistema\nexport const SYSTEM_CONFIG = {\n  active: ${tempSystemActive}\n};\n\nexport const INITIAL_USERS: User[] = ${usersJson};`;
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(generateConfigCode()).then(() => {
          alert("Código copiado! Cole no arquivo 'data/users.ts' e publique o site para aplicar as alterações.");
      });
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-red-600">
          <div>
            <h1 className="text-3xl font-bold text-white">Painel do Administrador</h1>
            <p className="text-gray-400">Gerenciamento Exclusivo de Organizadores</p>
          </div>
          <button 
            onClick={onLogout}
            className="px-6 py-2 bg-red-800 hover:bg-red-700 text-white rounded font-bold transition"
          >
            Sair do Sistema
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create Organizer Form */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">Cadastrar Novo Organizador</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Login do Organizador</label>
                <input 
                  type="text" 
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="mt-1 w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Ex: Rodeio2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Senha de Acesso</label>
                <input 
                  type="text" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Defina uma senha"
                />
              </div>
              
              {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
              {success && <p className="text-green-500 text-sm font-bold">{success}</p>}

              <button 
                type="submit"
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded transition shadow-lg"
              >
                Criar Acesso Local
              </button>
            </form>
          </div>

          {/* List of Organizers */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col">
            <h2 className="text-2xl font-bold text-white mb-6">Organizadores Ativos ({organizers.length})</h2>
            <div className="space-y-3 flex-grow overflow-y-auto max-h-[300px] mb-4">
              {organizers.length === 0 ? (
                <p className="text-gray-500 italic">Nenhum organizador cadastrado.</p>
              ) : (
                organizers.map((org, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-700 p-3 rounded border border-gray-600">
                    <div>
                      <p className="font-bold text-white">{org.username}</p>
                      <p className="text-xs text-gray-400">Senha: {org.password}</p>
                    </div>
                    <button 
                      onClick={() => onDeleteUser(org.username)}
                      className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-600/50 hover:bg-red-600 hover:text-white rounded text-sm transition"
                      title="Excluir apenas usuários locais"
                    >
                      Excluir
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <button 
                onClick={() => setShowConfig(true)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded transition animate-pulse"
            >
                ⚙️ Gerar Código de Acesso
            </button>
          </div>
        </div>

        {/* Configuration Export Section */}
        {showConfig && (
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border-2 border-indigo-500 animate-fadeIn relative">
                <button 
                  onClick={() => setShowConfig(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                  ✕ Fechar
                </button>

                <h3 className="text-xl font-bold text-indigo-400 mb-4">Sincronização com o APP Remoto</h3>
                
                {/* System Control Switch */}
                <div className="mb-6 p-4 bg-black/40 rounded border border-gray-600">
                   <h4 className="text-white font-bold mb-2">Controle de Acesso Global</h4>
                   <p className="text-sm text-gray-400 mb-4">Escolha se o sistema deve estar liberado ou bloqueado para os organizadores.</p>
                   
                   <div className="flex gap-4">
                      <button
                        onClick={() => setTempSystemActive(true)}
                        className={`flex-1 py-3 px-4 rounded font-bold transition flex items-center justify-center gap-2 ${
                          tempSystemActive 
                            ? 'bg-green-600 text-white shadow-[0_0_15px_rgba(22,163,74,0.6)] ring-2 ring-green-400' 
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                      >
                        🟢 Liberar Acesso
                      </button>
                      <button
                        onClick={() => setTempSystemActive(false)}
                        className={`flex-1 py-3 px-4 rounded font-bold transition flex items-center justify-center gap-2 ${
                          !tempSystemActive 
                            ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.6)] ring-2 ring-red-400' 
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                      >
                        🔴 Suspender Acesso
                      </button>
                   </div>
                   <p className="mt-2 text-xs text-center text-gray-500">
                      Status atual da geração: <strong className={tempSystemActive ? "text-green-400" : "text-red-400"}>
                        {tempSystemActive ? "ACESSO LIBERADO" : "ACESSO SUSPENSO"}
                      </strong>
                   </p>
                </div>

                <div className="bg-black p-4 rounded text-xs font-mono text-green-400 overflow-x-auto border border-gray-700 mb-4 max-h-64 overflow-y-auto">
                    <pre>{generateConfigCode()}</pre>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 items-center bg-gray-700/30 p-4 rounded">
                    <div className="flex-grow">
                        <p className="text-sm text-white font-bold mb-1">Passo Único:</p>
                        <p className="text-xs text-gray-300">
                           Copie o código acima, cole no arquivo <strong>data/users.ts</strong> e atualize o site.
                           O bloqueio/liberação só funcionará após esta atualização.
                        </p>
                    </div>
                    <button 
                        onClick={copyToClipboard}
                        className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded transition shadow-lg whitespace-nowrap"
                    >
                        Copiar Código
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;