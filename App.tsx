import React, { useState, useEffect } from 'react';
import { CompetitionProvider } from './context/CompetitionContext';
import LoginScreen from './components/LoginScreen';
import SetupScreen from './components/SetupScreen';
import CompetitionScreen from './components/CompetitionScreen';
import ResultsScreen from './components/ResultsScreen';
import AdminDashboard from './components/AdminDashboard';
import { Page, User } from './types';
import useLocalStorage from './hooks/useLocalStorage';

function App() {
  const [users, setUsers] = useLocalStorage<User[]>('competition-users', []);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('setup');
  
  // Seed the Super Admin user on initialization
  useEffect(() => {
    const adminUser = users.find(u => u.username === 'AndersonSilva');
    if (!adminUser) {
        const newAdmin: User = {
            username: 'AndersonSilva',
            password: 'admin',
            role: 'admin'
        };
        // Add admin while preserving existing users (if any, though in this flow we control them)
        setUsers(prev => [...prev, newAdmin]);
    }
  }, [users, setUsers]);

  const handleLoginSuccess = (username: string) => {
    const user = users.find(u => u.username === username);
    if (user) {
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
    setUsers(prev => [...prev, newUser]);
  };

  const handleDeleteUser = (usernameToDelete: string) => {
    if (usernameToDelete === 'AndersonSilva') return; // Protect admin
    setUsers(prev => prev.filter(u => u.username !== usernameToDelete));
  };

  if (!isLoggedIn) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        users={users}
      />
    );
  }

  // Admin Dashboard View (No CompetitionContext needed ideally, but kept separate)
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