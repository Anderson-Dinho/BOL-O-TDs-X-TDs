import React, { useState, useMemo, useEffect } from 'react';
import { CompetitionProvider } from './context/CompetitionContext';
import LoginScreen from './components/LoginScreen';
import SetupScreen from './components/SetupScreen';
import CompetitionScreen from './components/CompetitionScreen';
import ResultsScreen from './components/ResultsScreen';
import AdminDashboard from './components/AdminDashboard';
import { Page, User } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { INITIAL_USERS, SYSTEM_CONFIG } from './data/users';

function App() {
  // Store only locally added users in localStorage
  const [localUsers, setLocalUsers] = useLocalStorage<User[]>('competition-local-users', []);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('setup');
  
  // Combine INITIAL_USERS (code) with localUsers (localStorage)
  const users = useMemo(() => {
      const combined = [...INITIAL_USERS];
      localUsers.forEach(localUser => {
          if (!combined.some(u => u.username.toLowerCase() === localUser.username.toLowerCase())) {
              combined.push(localUser);
          }
      });
      return combined;
  }, [localUsers]);

  // Security Check: If system is locked and user is not admin, log them out immediately
  // This handles the case where the system is locked WHILE a user is logged in (after refresh/redeploy)
  useEffect(() => {
    if (isLoggedIn && currentUser && !SYSTEM_CONFIG.active && currentUser.role !== 'admin') {
        setIsLoggedIn(false);
        setCurrentUser(null);
        // We do not alert here to avoid double alerts on render, the login screen will show the status
    }
  }, [isLoggedIn, currentUser]);

  const handleLoginSuccess = (username: string) => {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (user) {
        // Double check access (LoginScreen handles the visual error, this is a safety guard)
        if (!SYSTEM_CONFIG.active && user.role !== 'admin') {
            return;
        }

        setIsLoggedIn(true);
        setCurrentUser(user);
        if (user.role === 'admin') {
            setCurrentPage('admin-dashboard');
        } else {
            setCurrentPage('setup');
        }
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  }

  // Admin Actions
  const handleAddUser = (newUser: User) => {
    setLocalUsers(prev => [...prev, newUser]);
  };

  const handleDeleteUser = (usernameToDelete: string) => {
    const isLocal = localUsers.some(u => u.username === usernameToDelete);
    if (isLocal) {
        setLocalUsers(prev => prev.filter(u => u.username !== usernameToDelete));
    } else {
        alert('Este usuário faz parte da configuração fixa do sistema e não pode ser excluído por aqui.');
    }
  };

  if (!isLoggedIn) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        users={users}
        isSystemLocked={!SYSTEM_CONFIG.active}
      />
    );
  }

  // Admin Dashboard View
  if (currentPage === 'admin-dashboard' && currentUser?.role === 'admin') {
      return (
          <AdminDashboard 
            users={users}
            onAddUser={handleAddUser}
            onDeleteUser={handleDeleteUser}
            onLogout={handleLogout}
          />
      );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'setup':
        return <SetupScreen goToCompetition={() => setCurrentPage('competition')} onLogout={handleLogout} />;
      case 'competition':
        return <CompetitionScreen goToResults={() => setCurrentPage('results')} goToSetup={() => setCurrentPage('setup')} />;
      case 'results':
        return <ResultsScreen goToSetup={() => setCurrentPage('setup')} goToCompetition={() => setCurrentPage('competition')} />;
      default:
        return <SetupScreen goToCompetition={() => setCurrentPage('competition')} onLogout={handleLogout} />;
    }
  };

  return (
    <CompetitionProvider currentUser={currentUser?.username || ''}>
      <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
        {/* System Status Banner for Admin */}
        {!SYSTEM_CONFIG.active && currentUser?.role === 'admin' && (
            <div className="bg-red-600 text-white text-center py-2 text-sm font-bold flex justify-center items-center gap-2 shadow-lg">
                <span>⛔ SISTEMA SUSPENSO PARA ORGANIZADORES ⛔</span>
            </div>
        )}

        <header className="bg-gray-800 shadow-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
          <div className="hidden md:block md:w-1/3"></div>
          <h1 className="text-xl md:text-3xl font-bold text-yellow-400 tracking-wider text-center md:w-1/3 whitespace-nowrap">
            Competição TODOS x TODOS
          </h1>
          <div className="flex items-center gap-4 w-full md:w-1/3 justify-center md:justify-end">
            <div className="flex flex-col items-end">
                <span className="text-sm text-gray-400 hidden md:inline">Logado como:</span>
                <span className="text-sm font-bold text-white">{currentUser?.username}</span>
            </div>
            <button onClick={handleLogout} className="text-sm bg-red-900/50 border border-red-800 hover:bg-red-800 px-4 py-2 rounded transition">
                Sair
            </button>
          </div>
        </header>
        <main className="p-4 md:p-8 flex-grow">
          {renderPage()}
        </main>
        <footer className="text-center p-4 text-gray-500 text-sm">
          <p>&copy; 2024 - Sistema Exclusivo de Competição</p>
        </footer>
      </div>
    </CompetitionProvider>
  );
}

export default App;