import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    if (onLogin) onLogin(data.user);
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#23b0e6' }}>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-box shadow-md w-96 flex flex-col items-center" style={{ boxShadow: '0 2px 16px 0 rgba(0,0,0,0.10)' }}>
        <img src="/logo.png" alt="Logo" style={{ height: 80, marginBottom: 24, borderRadius: 12 }} />
        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#23b0e6' }}>관리자 로그인</h2>
        <div className="mb-4 w-full">
          <label className="block mb-1 font-medium text-gray-700">이메일</label>
          <input
            type="email"
            className="input-main w-full"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ background: '#f8fafc' }}
          />
        </div>
        <div className="mb-4 w-full">
          <label className="block mb-1 font-medium text-gray-700">비밀번호</label>
          <input
            type="password"
            className="input-main w-full"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ background: '#f8fafc' }}
          />
        </div>
        {error && <div className="text-red-500 mb-4 text-center w-full">{error}</div>}
        <button
          type="submit"
          className="btn-main w-full mt-2"
          style={{ background: '#23b0e6', color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}
          disabled={loading}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
} 
