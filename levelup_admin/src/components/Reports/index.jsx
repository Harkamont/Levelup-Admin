import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Reports() {
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // 필터 상태
  const [filters, setFilters] = useState({
    start: '',
    end: '',
    group: '',
    student: '',
    studentName: '',
    teacher: '',
    type: '',
    gender: '', // 추가
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    // 트랜잭션 fetch
    const { data: txs, error: txError } = await supabase
      .from('talent_transactions')
      .select('*')
      .order('created_at', { ascending: false });
    // 사용자 fetch (id, name, group)
    const { data: userList, error: userError } = await supabase
      .from('users')
      .select('id, name, username, group, role, max_talent, current_talent, gender');
    if (txError || userError) setError((txError || userError).message);
    else {
      setTransactions(txs);
      setUsers(userList);
    }
    setLoading(false);
  }

  // users lookup
  const userMap = users.reduce((acc, u) => { acc[u.id] = u; return acc; }, {});
  const groupOptions = Array.from(new Set(users.map(u => u.group).filter(Boolean))).sort();
  const studentOptions = users.filter(u => u.role === 'student').map(u => ({ id: u.id, username: u.username, name: u.name })).sort((a, b) => a.username.localeCompare(b.username));
  const teacherOptions = users.filter(u => u.role === 'teacher' || u.role === 'admin').map(u => ({ id: u.id, username: u.username })).sort((a, b) => a.username.localeCompare(b.username));
  const typeOptions = [
    { value: '', label: '전체' },
    { value: 'individual_give', label: '개인 지급' },
    { value: 'individual_take', label: '개인 회수' },
    { value: 'group_give', label: '조별 지급' },
  ];
  const genderOptions = [
    { value: '', label: '전체 성별' },
    { value: '여', label: '여' },
    { value: '남', label: '남' },
  ];

  // 필터링 함수
  function filterTxs(list) {
    return list.filter(tx => {
      const created = new Date(tx.created_at);
      const studentUser = userMap[tx.student_id];
      return (
        (!filters.start || created >= new Date(filters.start)) &&
        (!filters.end || created <= new Date(filters.end + 'T23:59:59')) &&
        (!filters.group || studentUser?.group === filters.group) &&
        (!filters.student || tx.student_id === filters.student) &&
        (!filters.studentName || (studentUser?.name || '').includes(filters.studentName)) &&
        (!filters.teacher || tx.teacher_id === filters.teacher) &&
        (!filters.type || tx.transaction_type === filters.type) &&
        (!filters.gender || tx.gender === filters.gender) // 필터링 로직에 gender 조건 추가
      );
    });
  }

  // 통계 계산
  const students = users.filter(u => u.role === 'student');
  const totalMaxTalent = students.reduce((sum, s) => sum + (s.max_talent || 0), 0);
  const totalCurrentTalent = students.reduce((sum, s) => sum + (s.current_talent || 0), 0);
  // 조별 집계
  const groupStats = {};
  students.forEach(s => {
    if (!groupStats[s.group]) groupStats[s.group] = { max: 0, current: 0, count: 0 };
    groupStats[s.group].max += s.max_talent || 0;
    groupStats[s.group].current += s.current_talent || 0;
    groupStats[s.group].count += 1;
  });
  const groupList = Object.entries(groupStats).sort((a, b) => (a[0] || '').localeCompare(b[0] || ''));

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-4">Level Up 전체 달란트 현황</h2>
      {/* 상단 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="rounded-box p-4">
          <div className="font-semibold mb-1">전체 학생 레벨업(최대) 달란트 합</div>
          <div className="text-2xl font-bold">{totalMaxTalent.toLocaleString()}점</div>
        </div>
        <div className="rounded-box p-4">
          <div className="font-semibold mb-1">전체 학생 현재 달란트 합</div>
          <div className="text-2xl font-bold">{totalCurrentTalent.toLocaleString()}점</div>
        </div>
      </div>
      <div className="overflow-x-auto mb-4 rounded-box p-2">
        <table className="min-w-full table-box">
          <thead>
            <tr>
              <th className="px-2 py-1 border">조</th>
              <th className="px-2 py-1 border">인원수</th>
              <th className="px-2 py-1 border">조별 레벨업 달란트 합</th>
              <th className="px-2 py-1 border">조별 현재 달란트 합</th>
            </tr>
          </thead>
          <tbody>
            {groupList.length === 0 ? (
              <tr><td colSpan={4} className="text-center">조별 학생이 없습니다.</td></tr>
            ) : groupList.map(([group, stat]) => (
              <tr key={group}>
                <td className="px-2 py-1 border">{group || '미지정'}</td>
                <td className="px-2 py-1 border">{stat.count}</td>
                <td className="px-2 py-1 border">{stat.max.toLocaleString()}점</td>
                <td className="px-2 py-1 border">{stat.current.toLocaleString()}점</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="text-2xl font-bold mb-4">Level Up 달란트 지급 내역</h2>
      {/* 필터 UI */}
      <div className="grid grid-cols-1 md:grid-cols-9 gap-2 mb-4 items-end rounded-box p-4">
        <input type="date" value={filters.start} onChange={e => setFilters(f => ({ ...f, start: e.target.value }))} className="h-10 px-3 py-2 rounded-md border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-blue-400" style={{ minWidth: 120, maxWidth: 160 }} />
        <span className="text-center" style={{ minWidth: 20 }}>~</span>
        <input type="date" value={filters.end} onChange={e => setFilters(f => ({ ...f, end: e.target.value }))} className="h-10 px-3 py-2 rounded-md border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-blue-400" style={{ minWidth: 120, maxWidth: 160 }} />
        <select className="h-10 px-3 py-2 rounded-md border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-blue-400" value={filters.group} onChange={e => setFilters(f => ({ ...f, group: e.target.value }))} style={{ minWidth: 120, maxWidth: 160 }}>
          <option value="">전체 조</option>
          {groupOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select className="h-10 px-3 py-2 rounded-md border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-blue-400" value={filters.gender} onChange={e => setFilters(f => ({ ...f, gender: e.target.value }))} style={{ minWidth: 120, maxWidth: 160 }}>
          {genderOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <select className="h-10 px-3 py-2 rounded-md border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-blue-400" value={filters.student} onChange={e => setFilters(f => ({ ...f, student: e.target.value }))} style={{ minWidth: 120, maxWidth: 160 }}>
          <option value="">전체 학생</option>
          {studentOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.username}</option>)}
        </select>
        <input type="text" className="h-10 px-3 py-2 rounded-md border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="학생 이름 검색" value={filters.studentName || ''} onChange={e => setFilters(f => ({ ...f, studentName: e.target.value }))} style={{ minWidth: 120, maxWidth: 160 }} />
        <select className="h-10 px-3 py-2 rounded-md border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-blue-400" value={filters.teacher} onChange={e => setFilters(f => ({ ...f, teacher: e.target.value }))} style={{ minWidth: 120, maxWidth: 160 }}>
          <option value="">전체 교사/관리자</option>
          {teacherOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.username}</option>)}
        </select>
        <select className="h-10 px-3 py-2 rounded-md border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-blue-400" value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))} style={{ minWidth: 120, maxWidth: 160 }}>
          {typeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <button className="h-10 px-3 py-2 rounded-md text-white font-bold col-span-1 md:col-span-9" style={{ minWidth: 120, backgroundColor: '#ec6034' }} onClick={() => setFilters({ start: '', end: '', group: '', student: '', studentName: '', teacher: '', type: '', gender: '' })} type="button">초기화</button>
      </div>
      {/* 트랜잭션 테이블 */}
      <div className="overflow-x-auto rounded-box p-2">
        <table className="min-w-full table-box">
          <thead>
            <tr>
              <th className="px-2 py-1 border">일시</th>
              <th className="px-2 py-1 border">유형</th>
              <th className="px-2 py-1 border">금액</th>
              <th className="px-2 py-1 border">사유</th>
              <th className="px-2 py-1 border">학생</th>
              <th className="px-2 py-1 border">조</th>
              <th className="px-2 py-1 border">교사/관리자</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center">로딩 중...</td></tr>
            ) : filterTxs(transactions).length === 0 ? (
              <tr><td colSpan={7} className="text-center">트랜잭션이 없습니다.</td></tr>
            ) : filterTxs(transactions).map(tx => (
              <tr key={tx.id}>
                <td className="px-2 py-1 border">{new Date(tx.created_at).toLocaleString()}</td>
                <td className="px-2 py-1 border">{typeOptions.find(opt => opt.value === tx.transaction_type)?.label || tx.transaction_type}</td>
                <td className="px-2 py-1 border">{tx.amount}</td>
                <td className="px-2 py-1 border">{tx.reason || '-'}</td>
                <td className="px-2 py-1 border">{userMap[tx.student_id]?.name || tx.student_id}</td>
                <td className="px-2 py-1 border">{userMap[tx.student_id]?.group || '-'}</td>
                <td className="px-2 py-1 border">{userMap[tx.teacher_id]?.name || tx.teacher_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 