
import React, { useState } from 'react';
import { User } from '../types';

interface RegistrationScreenProps {
  onRegister: (newUser: User) => void;
  goToLogin: () => void;
  showLoginLink: boolean;
  existingUsers: User[];
}

const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ onRegister, goToLogin, showLoginLink, existingUsers }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password) {
      setError('Usuário e senha não podem estar em branco.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (existingUsers.find(user => user.username.toLowerCase() === trimmedUsername.toLowerCase())) {
      setError('Este nome de usuário já existe.');
      return;
    }

    const newUser: User = { 
      username: trimmedUsername, 
      password,
      role: showLoginLink ? 'organizer' : 'admin'
    };
    onRegister(newUser);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-xl shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-yellow-400">Registrar Organizador</h2>
          <p className="mt-2 text-gray-400">
            {showLoginLink ? 'Crie uma nova conta de organizador.' : 'Crie a primeira conta de administrador para o app.'}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-900 placeholder-gray-500 text-white rounded-t-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                placeholder="Usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-900 placeholder-gray-500 text-white focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-900 placeholder-gray-500 text-white rounded-b-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                placeholder="Confirmar Senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-gray-900 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-yellow-500 transition-colors duration-300"
            >
              Registrar
            </button>
          </div>
          {showLoginLink && (
             <p className="text-center text-sm text-gray-400 mt-4">
                Já tem uma conta?{' '}
                <button type="button" onClick={goToLogin} className="font-medium text-yellow-500 hover:text-yellow-400">
                    Faça login
                </button>
             </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default RegistrationScreen;
