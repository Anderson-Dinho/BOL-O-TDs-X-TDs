import React, { useState } from 'react';
import { User } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (username: string) => void;
  users: User[];
  isSystemLocked?: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, users, isSystemLocked = false }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    // Case insensitive username match
    const user = users.find(u => u.username.toLowerCase() === trimmedUsername.toLowerCase());
    
    // Check password exactly
    if (user && user.password === password) {
      if (isSystemLocked && user.role !== 'admin') {
          setError('SISTEMA PAUSADO: Apenas o administrador pode acessar no momento.');
          return;
      }
      setError('');
      onLoginSuccess(user.username);
    } else {
      setError('Acesso negado. Verifique suas credenciais.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 px-4 relative overflow-hidden">
      {/* Background decoration for locked state */}
      {isSystemLocked && (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-10 bg-[repeating-linear-gradient(45deg,yellow,yellow_10px,black_10px,black_20px)]"></div>
      )}

      <div className={`w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-xl shadow-2xl border-t-4 ${isSystemLocked ? 'border-red-600' : 'border-yellow-400'} z-10`}>
        <div className="text-center">
          {isSystemLocked && (
             <div className="mb-4 bg-red-600 text-white py-2 rounded font-bold uppercase tracking-wider animate-pulse">
                ⛔ Acesso Suspenso ⛔
             </div>
          )}
          <h2 className="text-3xl font-extrabold text-white">Acesso ao Sistema</h2>
          <p className="mt-2 text-sm text-gray-400">Sistema Exclusivo de Competição</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="sr-only">Usuário</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-900 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                placeholder="Usuário de Acesso"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-900 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500/50 rounded p-3">
                <p className="text-red-200 text-sm text-center font-bold flex items-center justify-center gap-2">
                   <span>⚠️</span> {error}
                </p>
            </div>
          )}

          <div>
            <button
              type="submit"
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 shadow-lg ${
                  isSystemLocked 
                  ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500' 
                  : 'bg-yellow-400 hover:bg-yellow-500 focus:ring-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.3)]'
              }`}
            >
              {isSystemLocked ? 'ENTRAR COMO ADMINISTRADOR' : 'ENTRAR NO SISTEMA'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 border-t border-gray-700 pt-4 text-center">
            {isSystemLocked ? (
                <p className="text-xs text-red-400 font-semibold">
                    O organizador suspendeu o acesso remoto temporariamente.
                </p>
            ) : (
                <p className="text-xs text-gray-500">
                    Este sistema é privado. O acesso é restrito apenas a organizadores autorizados.
                </p>
            )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;