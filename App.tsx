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
  // Usuários locais (armazenados no navegador do Admin para testes antes do deploy)
  const [localUsers, setLocalUsers] = useLocalStorage<User[]>('competition-local-users', []);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('setup');
  
  // Mescla usuários do código (Deploy) com locais (Admin)
  const users = useMemo(() => {
      // Prioridade: Users no código sobrescrevem configurações antigas se necessário
      const combined = [...localUsers];
      
      INITIAL_USERS.forEach(initUser => {
          const localIndex = combined.findIndex(u => u.username.toLowerCase() === initUser.username.toLowerCase());
          
          if (localIndex === -1) {
              // Se não existe localmente, adiciona
              combined.push(initUser);
          } else {
              // Se existe localmente, verificamos se o código é "mais autoritativo" (ex: status isActive mudou no código)
              // Para garantir que o deploy funcione, o estado do INITIAL_USERS deve ter peso.
              // Mas precisamos manter o 'lastLogin' local.
              combined[localIndex] = {
                  ...combined[localIndex],
                  role: initUser.role, // Função é definida pelo código
                  isActive: initUser.isActive, // Status é definido pelo código (Remoto)
                  password: initUser.password // Senha definida pelo código
              };
          }
      });
      return combined;
  }, [localUsers]);

  // Checagem de Segurança Contínua
  useEffect(() => {
    if (isLoggedIn && currentUser) {
        // 1. Bloqueio Global (Maintenance Mode)
        if (!SYSTEM_CONFIG.active && currentUser.role !== 'admin') {
            setIsLoggedIn(false);
            setCurrentUser(null);
            alert("O sistema foi colocado em modo de manutenção pelo Administrador.");
            return;
        }

        // 2. Suspensão Individual
        const updatedUserRecord = users.find(u => u.username.toLowerCase() === currentUser.username.toLowerCase());
        if (updatedUserRecord && updatedUserRecord.isActive === false) {
             setIsLoggedIn(false);
             setCurrentUser(null);
             alert("Sua conta foi suspensa remotamente pelo administrador.");
        }
    }
  }, [isLoggedIn, currentUser, users]);

  const handleLoginSuccess = (username: string) => {
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (user) {
        // Validações de segurança no login
        if (!SYSTEM_CONFIG.active && user.role !== 'admin') return;
        if (user.isActive === false) return;

        // Atualiza timestamp de login
        const now = new Date().toISOString();
        const updatedUser = { ...user, lastLogin: now };
        
        // Salva localmente (apenas neste dispositivo)
        setLocalUsers(prev => {
            const exists = prev.some(u => u.username.toLowerCase() === user.username.toLowerCase());
            if (exists) {
                return prev.map(u => u.username.toLowerCase() === user.username.toLowerCase() ? { ...u, lastLogin: now } : u);
            } else {
                return [...prev, updatedUser];
            }
        });

        setIsLoggedIn(true);
        setCurrentUser(updatedUser);
        
        // Redirecionamento inicial
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

  // Funções Administrativas
  const handleUpdateUser = (updatedUser: User) => {
    setLocalUsers(prev => {
        const index = prev.findIndex(u => u.username.toLowerCase() === updatedUser.username.toLowerCase());
        if (index !== -1) {
            const newArr = [...prev];
            // Preserva lastLogin se não vier no update
            newArr[index] = { ...newArr[index], ...updatedUser }; 
            return newArr;
        } else {
            return [...prev, updatedUser];
        }
    });
  };

  const handleDeleteUser = (usernameToDelete: string) => {
    setLocalUsers(prev => prev.filter(u => u.username !== usernameToDelete));
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

  // Roteamento
  if (currentPage === 'admin-dashboard') {
      // Proteção extra: apenas admin vê dashboard
      if (currentUser?.role === 'admin') {
        return (
            <AdminDashboard 
                users={users}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                onLogout={handleLogout}
            />
        );
      } else {
          setCurrentPage('setup'); // Redireciona organizadores perdidos
      }
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
        {/* Faixa de Aviso (Modo Manutenção) */}
        {!SYSTEM_CONFIG.active && currentUser?.role === 'admin' && (
            <div className="bg-red-600 text-white text-center py-2 text-xs font-bold uppercase tracking-widest shadow-lg animate-pulse">
                Modo de Manutenção Ativo (Organizadores Bloqueados)
            </div>
        )}

        <header className="bg-gray-800 shadow-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 border-b border-gray-700">
          <div className="hidden md:block md:w-1/3">
             {/* Admin pode voltar ao dashboard se estiver navegando no app */}
             {currentUser?.role === 'admin' && (
                 <button onClick={() => setCurrentPage('admin-dashboard')} className="text-gray-400 hover:text-white text-sm flex items-center gap-1">
                     ⚙️ Voltar ao Painel
                 </button>
             )}
          </div>
          
          <h1 className="text-xl md:text-2xl font-bold text-yellow-400 tracking-wider text-center md:w-1/3 whitespace-nowrap">
            TODOS x TODOS
          </h1>
          
          <div className="flex items-center gap-4 w-full md:w-1/3 justify-center md:justify-end">
            <div className="text-right">
                <div className="text-xs text-gray-400 uppercase">Logado como</div>
                <div className="text-sm font-bold text-white leading-tight">{currentUser?.username}</div>
            </div>
            <button onClick={handleLogout} className="text-xs bg-gray-700 hover:bg-red-600 text-white px-3 py-2 rounded transition border border-gray-600">
                Sair
            </button>
          </div>
        </header>

        <main className="p-4 md:p-6 flex-grow max-w-7xl mx-auto w-full">
          {renderPage()}
        </main>
        
        <footer className="text-center p-4 text-gray-600 text-xs border-t border-gray-800">
          <p>Sistema de Gerenciamento de Competição &copy; 2024</p>
        </footer>
      </div>
    </CompetitionProvider>
  );
}

export default App;