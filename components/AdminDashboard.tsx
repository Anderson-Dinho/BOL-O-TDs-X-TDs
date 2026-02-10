import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { SYSTEM_CONFIG } from '../data/users';

interface AdminDashboardProps {
  users: User[];
  onUpdateUser: (user: User) => void;
  onDeleteUser: (username: string) => void;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, onUpdateUser, onDeleteUser, onLogout }) => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin'|'organizer'>('organizer');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Controle mestre local antes de gerar o código
  const [tempSystemActive, setTempSystemActive] = useState(SYSTEM_CONFIG.active);

  // Monitora alterações locais
  useEffect(() => {
     if (tempSystemActive !== SYSTEM_CONFIG.active) {
         setHasUnsavedChanges(true);
     }
  }, [tempSystemActive]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newUsername.trim() || !newPassword.trim()) {
      setError('Preencha usuário e senha.');
      return;
    }

    if (users.find(u => u.username.toLowerCase() === newUsername.trim().toLowerCase())) {
      setError('Usuário já existe.');
      return;
    }

    onUpdateUser({
      username: newUsername.trim(),
      password: newPassword.trim(),
      role: newRole,
      isActive: true,
      lastLogin: undefined
    });

    setNewUsername('');
    setNewPassword('');
    setSuccess(`Usuário criado. Clique em "Publicar Alterações" para validar.`);
    setHasUnsavedChanges(true);
  };

  const toggleUserStatus = (user: User) => {
      onUpdateUser({ ...user, isActive: !user.isActive });
      setHasUnsavedChanges(true);
  };

  const toggleUserRole = (user: User) => {
      onUpdateUser({ ...user, role: user.role === 'admin' ? 'organizer' : 'admin' });
      setHasUnsavedChanges(true);
  };

  const deleteUserHandler = (e: React.MouseEvent, username: string) => {
      e.stopPropagation(); // Impede propagação para a linha da tabela
      e.preventDefault();
      
      onDeleteUser(username);
      setHasUnsavedChanges(true);
  }

  const generateConfigCode = () => {
      // Removemos o lastLogin para não "sujar" o código fonte com dados voláteis
      const usersForExport = users.map(({ lastLogin, ...u }) => u);
      const usersJson = JSON.stringify(usersForExport, null, 2);
      
      return `import { User } from '../types';\n\n// MUDANÇA DE CONFIGURAÇÃO DE ACESSO\n// Data da geração: ${new Date().toLocaleString()}\n\nexport const SYSTEM_CONFIG = {\n  active: ${tempSystemActive} // ${tempSystemActive ? 'SISTEMA LIBERADO' : 'SISTEMA BLOQUEADO (APENAS ADMIN)'}\n};\n\nexport const INITIAL_USERS: User[] = ${usersJson};`;
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(generateConfigCode()).then(() => {
          alert("✅ Código copiado!\n\nAgora cole este código no arquivo 'data/users.ts' e faça o deploy para aplicar as permissões remotamente.");
          setHasUnsavedChanges(false);
          setShowDeployModal(false);
      });
  };

  const formatDate = (isoString?: string) => {
      if (!isoString) return 'Nunca';
      const date = new Date(isoString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const isRecent = diff < 1000 * 60 * 30; // 30 mins

      return (
          <span className={isRecent ? "text-green-400 font-bold" : "text-gray-400"}>
              {date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}
              {isRecent && " (Online)"}
          </span>
      );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Principal */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-yellow-500 gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Central de Controle</h1>
            <p className="text-gray-400 text-sm mt-1">Gerencie acessos, suspenda usuários e monitore a equipe.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
             <button 
                onClick={() => setShowDeployModal(true)}
                className={`px-6 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 shadow-lg ${hasUnsavedChanges ? 'bg-green-600 hover:bg-green-700 text-white animate-pulse' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}
            >
                {hasUnsavedChanges ? '⚠️ Publicar Alterações Remotas' : '☁️ Ver Configuração Atual'}
            </button>
            <button 
                onClick={onLogout}
                className="px-6 py-3 bg-red-900/50 hover:bg-red-800 border border-red-800 text-red-200 rounded-lg font-bold transition"
            >
                Sair
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Coluna Esquerda: Status Global e Novo Usuário */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* Master Switch */}
                <div className={`p-6 rounded-xl shadow-lg border-2 transition-all ${tempSystemActive ? 'bg-gray-800 border-green-500/50' : 'bg-red-900/20 border-red-500'}`}>
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        {tempSystemActive ? '🟢 Sistema Liberado' : '🔴 Sistema em Manutenção'}
                    </h3>
                    <p className="text-xs text-gray-400 mb-4 h-10">
                        {tempSystemActive 
                            ? 'Todos os organizadores ativos podem acessar e editar.' 
                            : 'Bloqueio total. Apenas Administradores acessam.'}
                    </p>
                    <div className="flex bg-gray-900 rounded-lg p-1">
                        <button
                            onClick={() => setTempSystemActive(true)}
                            className={`flex-1 py-2 rounded font-bold text-sm transition ${tempSystemActive ? 'bg-green-600 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Liberar Acesso
                        </button>
                        <button
                            onClick={() => setTempSystemActive(false)}
                            className={`flex-1 py-2 rounded font-bold text-sm transition ${!tempSystemActive ? 'bg-red-600 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Bloquear Tudo
                        </button>
                    </div>
                </div>

                {/* Card Adicionar Usuário */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Novo Organizador</h3>
                    <form onSubmit={handleCreateUser} className="space-y-3">
                        <input 
                            type="text" 
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white focus:border-yellow-500 outline-none"
                            placeholder="Nome de Usuário"
                        />
                        <input 
                            type="text" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white focus:border-yellow-500 outline-none"
                            placeholder="Senha de Acesso"
                        />
                         <select 
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value as any)}
                            className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white focus:border-yellow-500 outline-none"
                        >
                            <option value="organizer">Organizador (Padrão)</option>
                            <option value="admin">Administrador (Total)</option>
                        </select>
                        
                        {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
                        {success && <p className="text-green-400 text-xs font-bold">{success}</p>}

                        <button 
                            type="submit"
                            className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded shadow transition mt-2"
                        >
                            + Adicionar Equipe
                        </button>
                    </form>
                </div>
            </div>

            {/* Coluna Direita: Lista de Usuários */}
            <div className="lg:col-span-8 bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Equipe Registrada ({users.length})</h2>
                    <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-700">
                       💡 Suspenda o acesso clicando no botão de status
                    </span>
                </div>
                
                <div className="overflow-x-auto flex-grow">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-gray-400 text-xs uppercase border-b border-gray-700">
                                <th className="p-3">Usuário</th>
                                <th className="p-3">Cargo</th>
                                <th className="p-3 text-center">Acesso Remoto</th>
                                <th className="p-3 text-right">Última Conexão</th>
                                <th className="p-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {users.map((user) => {
                                const isMe = user.username === 'AndersonSilva'; // Admin principal
                                return (
                                <tr key={user.username} className={`group transition border-b border-gray-700/50 hover:bg-gray-700/30 ${!user.isActive ? 'bg-red-900/5' : ''}`}>
                                    <td className={`p-3 ${!user.isActive ? 'opacity-50' : ''}`}>
                                        <div className="font-bold text-white text-sm">{user.username}</div>
                                        <div className="text-xs text-gray-500 font-mono select-all">Pwd: {user.password}</div>
                                    </td>
                                    <td className={`p-3 ${!user.isActive ? 'opacity-50' : ''}`}>
                                        <span onClick={() => !isMe && toggleUserRole(user)} className={`cursor-pointer px-2 py-1 rounded text-xs font-bold border ${user.role === 'admin' ? 'bg-purple-900/30 text-purple-300 border-purple-800' : 'bg-blue-900/30 text-blue-300 border-blue-800'}`}>
                                            {user.role === 'admin' ? 'ADMIN' : 'ORG'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center">
                                        <button 
                                            onClick={() => toggleUserStatus(user)}
                                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${user.isActive ? 'bg-green-500' : 'bg-red-600'}`}
                                            title={user.isActive ? "Clique para suspender" : "Clique para ativar"}
                                        >
                                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ml-1 ${user.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                        <div className={`text-[10px] mt-1 font-bold ${!user.isActive ? 'opacity-50' : ''}`}>
                                            {user.isActive ? <span className="text-green-500">ATIVO</span> : <span className="text-red-500">SUSPENSO</span>}
                                        </div>
                                    </td>
                                    <td className={`p-3 text-right text-xs ${!user.isActive ? 'opacity-50' : ''}`}>
                                        {formatDate(user.lastLogin)}
                                    </td>
                                    <td className="p-3 text-right relative z-10">
                                        <button 
                                            type="button"
                                            onClick={(e) => !isMe && deleteUserHandler(e, user.username)}
                                            disabled={isMe}
                                            className={`p-2 rounded transition flex items-center justify-center ml-auto ${
                                                isMe 
                                                ? 'text-gray-600 cursor-not-allowed opacity-20' 
                                                : 'bg-red-600 text-white hover:bg-red-700 hover:scale-110 cursor-pointer shadow-md border border-red-500'
                                            }`}
                                            title={isMe ? "Não é possível excluir o Admin principal" : "Remover permanentemente"}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Modal de Deploy (Onde a mágica acontece) */}
        {showDeployModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                <div className="bg-gray-800 w-full max-w-4xl rounded-xl shadow-2xl border border-gray-600 flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900 rounded-t-xl">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                🚀 Publicar Alterações Remotas
                            </h2>
                            <p className="text-sm text-gray-400">
                                Para que os outros dispositivos recebam as suspensões/ativações, você precisa atualizar o código.
                            </p>
                        </div>
                        <button onClick={() => setShowDeployModal(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-700/30 p-4 rounded border border-gray-600">
                                <span className="block text-2xl mb-2">1️⃣</span>
                                <h4 className="font-bold text-white">Copiar Código</h4>
                                <p className="text-xs text-gray-400">O sistema gerou um novo arquivo de configuração baseado nas suas mudanças.</p>
                            </div>
                            <div className="bg-gray-700/30 p-4 rounded border border-gray-600">
                                <span className="block text-2xl mb-2">2️⃣</span>
                                <h4 className="font-bold text-white">Atualizar Arquivo</h4>
                                <p className="text-xs text-gray-400">Cole o código no arquivo <code>src/data/users.ts</code> do seu projeto.</p>
                            </div>
                            <div className="bg-gray-700/30 p-4 rounded border border-gray-600">
                                <span className="block text-2xl mb-2">3️⃣</span>
                                <h4 className="font-bold text-white">Fazer Deploy</h4>
                                <p className="text-xs text-gray-400">Suba as alterações (Vercel, Netlify, etc). Em segundos, todos serão atualizados.</p>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="absolute -top-3 left-4 bg-gray-800 px-2 text-xs text-yellow-500 font-bold">
                                Código Gerado Automaticamente
                            </div>
                            <pre className="bg-black p-4 rounded-lg text-xs font-mono text-green-400 overflow-x-auto border border-gray-700 h-64 select-all">
                                {generateConfigCode()}
                            </pre>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-700 bg-gray-900 rounded-b-xl flex justify-end">
                        <button 
                            onClick={copyToClipboard}
                            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-lg shadow-lg transform transition hover:scale-105"
                        >
                            📋 Copiar Código e Fechar
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;