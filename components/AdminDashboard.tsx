import React, { useState } from 'react';
import { User } from '../types';

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
    setSuccess(`Organizador "${newUsername}" cadastrado com sucesso! Lembre-se de atualizar o código para liberar acesso remoto.`);
    setTimeout(() => setSuccess(''), 5000);
  };

  const organizers = users.filter(u => u.role !== 'admin');

  const generateConfigCode = () => {
      const usersJson = JSON.stringify(users, null, 2);
      return `import { User } from '../types';\n\nexport const INITIAL_USERS: User[] = ${usersJson};`;
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(generateConfigCode()).then(() => {
          alert("Código copiado! Cole no arquivo 'data/users.ts' e publique o site.");
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
            <div className="mt-4 p-3 bg-blue-900/30 border border-blue-800 rounded text-xs text-blue-200">
                <p>ℹ️ <strong>Nota:</strong> Usuários criados aqui funcionam apenas neste navegador. Para habilitar acesso em outros dispositivos, use a opção "Liberar Acesso Remoto" abaixo.</p>
            </div>
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
                onClick={() => setShowConfig(!showConfig)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded transition"
            >
                {showConfig ? 'Ocultar Configuração' : '🔓 Liberar Acesso Remoto'}
            </button>
          </div>
        </div>

        {/* Configuration Export Section */}
        {showConfig && (
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-indigo-500 animate-fadeIn">
                <h3 className="text-xl font-bold text-indigo-400 mb-2">Sincronização com o APP Final</h3>
                <p className="text-gray-300 mb-4 text-sm">
                    Para que os usuários que você criou acima consigam acessar o sistema de outros computadores ou celulares, 
                    você precisa atualizar o código do aplicativo.
                </p>
                <div className="bg-black p-4 rounded text-xs font-mono text-green-400 overflow-x-auto border border-gray-700 mb-4">
                    <pre>{generateConfigCode()}</pre>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={copyToClipboard}
                        className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded transition"
                    >
                        Copiar Código
                    </button>
                    <div className="text-xs text-gray-400 flex items-center">
                        <span>Cole este código no arquivo <strong>data/users.ts</strong> e publique o site.</span>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;