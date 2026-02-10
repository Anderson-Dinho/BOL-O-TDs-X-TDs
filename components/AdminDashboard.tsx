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
    setSuccess(`Organizador "${newUsername}" cadastrado com sucesso!`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const organizers = users.filter(u => u.role !== 'admin');

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
                Criar Acesso
              </button>
            </form>
          </div>

          {/* List of Organizers */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-6">Organizadores Ativos ({organizers.length})</h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
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
                    >
                      Excluir Acesso
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
