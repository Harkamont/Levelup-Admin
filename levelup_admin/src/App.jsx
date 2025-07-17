import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import LoginPage from './pages/LoginPage';
import { isAdmin } from './lib/adminUtils';
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import UserManagement from './components/UserManagement';
import TalentManagement from './components/TalentManagement';
import Reports from './components/Reports';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    let ignore = false;
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!ignore) {
          if (session?.user) {
            setUser(session.user);
            const admin = await isAdmin(session.user.id);
            setIsAdminUser(admin);
          } else {
            setUser(null);
            setIsAdminUser(false);
          }
          setChecking(false);
        }
      } catch (err) {
        if (!ignore) {
          setUser(null);
          setIsAdminUser(false);
          setChecking(false);
        }
      }
    };
    checkSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!ignore) {
        if (session?.user) {
          setUser(session.user);
          isAdmin(session.user.id).then(setIsAdminUser);
        } else {
          setUser(null);
          setIsAdminUser(false);
        }
      }
    });
    return () => {
      ignore = true;
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (checking) return <div>로딩 중...</div>;
  if (!user) return <LoginPage onLogin={setUser} />;
  if (!isAdminUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-96 text-center">
          <h2 className="text-xl font-bold mb-4 text-red-600">관리자 권한이 없습니다</h2>
          <button
            className="mt-4 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            onClick={async () => {
              await supabase.auth.signOut();
              setUser(null);
              setIsAdminUser(false);
            }}
          >
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdminUser(false);
  };

  return (
    <Router>
      <div className="flex items-center gap-6 p-4">
        <img src="/logo.png" alt="Logo" style={{ height: 100, borderRadius: '12px', padding: 4 }} />
        <nav className="flex gap-4">
          <Link to="/users" className="btn-main" style={{ background: '#ec6034', color: '#fff', textDecoration: 'none' }}>사용자 관리</Link>
          <Link to="/talent" className="btn-main" style={{ background: '#ec6034', color: '#fff', textDecoration: 'none' }}>달란트 관리</Link>
          <Link to="/reports" className="btn-main" style={{ background: '#ec6034', color: '#fff', textDecoration: 'none' }}>통계/리포트</Link>
        </nav>
        <div className="flex-1" />
        <button className="btn-main" onClick={handleLogout}>로그아웃</button>
      </div>
      <div className="px-8">
        <Routes>
          <Route path="/users" element={<UserManagement />} />
          <Route path="/talent" element={<TalentManagement user={user} />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/users" replace />} />
        </Routes>
      </div>
    </Router>
  );
}
