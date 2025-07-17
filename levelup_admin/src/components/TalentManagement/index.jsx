import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function TalentManagement({ user }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [amounts, setAmounts] = useState({});
  const [reasons, setReasons] = useState({});
  const [processing, setProcessing] = useState({});
  // 필터 상태
  const [filters, setFilters] = useState({ group: '', grade: '', gender: '', church: '', studentName: '' });
  // 조별 지급 상태
  const [groupGive, setGroupGive] = useState({ group: '', amount: '' });
  const [groupProcessing, setGroupProcessing] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('users')
      .select('id, username, name, group, grade, gender, current_talent')
      .eq('role', 'student')
      .order('name', { ascending: true });
    if (error) setError(error.message);
    else setStudents(data);
    setLoading(false);
  }

  // 필터 옵션 추출
  const uniqueOptions = {
    group: Array.from(new Set(students.map(s => s.group).filter(Boolean))).sort(),
    grade: Array.from(new Set(students.map(s => s.grade).filter(Boolean))).sort(),
    gender: Array.from(new Set(students.map(s => s.gender).filter(Boolean))).sort(),
    church: Array.from(new Set(students.map(s => s.church).filter(Boolean))).sort(),
  };

  // 필터링 함수
  function filterStudents(list) {
    return list.filter(s => (
      (!filters.group || s.group === filters.group) &&
      (!filters.grade || s.grade === filters.grade) &&
      (!filters.gender || s.gender === filters.gender) &&
      (!filters.church || s.church === filters.church) &&
      (!filters.studentName || (s.name || '').includes(filters.studentName))
    ));
  }

  function handleAmountChange(id, value) {
    setAmounts(a => ({ ...a, [id]: value }));
  }
  function handleReasonChange(id, value) {
    setReasons(r => ({ ...r, [id]: value }));
  }

  // 개별 지급/회수
  async function handleTalent(id, type) {
    setProcessing(p => ({ ...p, [id]: true }));
    setError(null);
    const amount = parseInt(amounts[id], 10);
    if (!amount || isNaN(amount)) {
      setError('금액을 입력하세요.');
      setProcessing(p => ({ ...p, [id]: false }));
      return;
    }
    const reason = reasons[id] || '';
    // 1. 트랜잭션 기록 (process_talent_transaction)
    const { error: txError } = await supabase.rpc('process_talent_transaction', {
      p_student_id: id,
      p_teacher_id: user?.id || null,
      p_amount: type === 'give' ? amount : -amount,
      p_reason: reason,
      p_transaction_type: type === 'give' ? 'individual_give' : 'individual_take',
    });
    if (txError) {
      setError(txError.message);
      setProcessing(p => ({ ...p, [id]: false }));
      return;
    }
    // 2. 지급/회수 처리
    if (type === 'give') {
      // 현재 값 fetch 후 update
      const { data: userData, error: userError } = await supabase.from('users').select('current_talent, max_talent').eq('id', id).single();
      if (!userError && userData) {
        await supabase.from('users').update({
          current_talent: userData.current_talent + amount,
          max_talent: userData.max_talent + amount
        }).eq('id', id);
      }
    } else {
      const { data: userData, error: userError } = await supabase.from('users').select('current_talent').eq('id', id).single();
      if (!userError && userData) {
        await supabase.from('users').update({
          current_talent: userData.current_talent - amount
        }).eq('id', id);
      }
    }
    setAmounts(a => ({ ...a, [id]: '' }));
    setReasons(r => ({ ...r, [id]: '' }));
    setProcessing(p => ({ ...p, [id]: false }));
    fetchStudents();
  }

  // 조별 지급
  async function handleGroupGive() {
    setGroupProcessing(true);
    setError(null);
    const group = groupGive.group;
    const amount = parseInt(groupGive.amount, 10);
    if (!group || !amount || isNaN(amount)) {
      setError('조와 금액을 모두 입력하세요.');
      setGroupProcessing(false);
      return;
    }
    const groupStudents = students.filter(s => s.group === group);
    if (groupStudents.length === 0) {
      setError('해당 조에 학생이 없습니다.');
      setGroupProcessing(false);
      return;
    }
    const base = Math.floor(amount / groupStudents.length);
    let remain = amount % groupStudents.length;
    // 1. 트랜잭션 기록 (process_talent_transaction)
    for (let idx = 0; idx < groupStudents.length; idx++) {
      const stu = groupStudents[idx];
      const giveAmount = base + (idx < remain ? 1 : 0);
      const { error: txError } = await supabase.rpc('process_talent_transaction', {
        p_student_id: stu.id,
        p_teacher_id: user?.id || null,
        p_amount: giveAmount,
        p_reason: `조별 지급 (${group})`,
        p_transaction_type: 'group_give',
      });
      if (!txError) {
        // 2. 지급 처리: 현재 값 fetch 후 update
        const { data: userData, error: userError } = await supabase.from('users').select('current_talent, max_talent').eq('id', stu.id).single();
        if (!userError && userData) {
          await supabase.from('users').update({
            current_talent: userData.current_talent + giveAmount,
            max_talent: userData.max_talent + giveAmount
          }).eq('id', stu.id);
        }
      }
    }
    setGroupGive({ group: '', amount: '' });
    setGroupProcessing(false);
    fetchStudents();
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-4">달란트 관리</h2>
      <div className="rounded-box p-4 mb-4 flex flex-wrap gap-2 items-end">
        <select className="select-main" value={groupGive.group} onChange={e => setGroupGive(g => ({ ...g, group: e.target.value }))} style={{ width: 120 }}>
          <option value="">조 선택</option>
          {uniqueOptions.group.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <input type="number" className="input-main w-24" value={groupGive.amount} onChange={e => setGroupGive(g => ({ ...g, amount: e.target.value }))} placeholder="금액" min={1} />
        <button className="btn-main" onClick={handleGroupGive} disabled={groupProcessing}>조별 지급</button>
      </div>
      <div className="rounded-box p-4 mb-2 flex flex-wrap gap-2">
        <select className="select-main" value={filters.group} onChange={e => setFilters(f => ({ ...f, group: e.target.value }))} style={{ width: 100 }}>
          <option value="">전체 조</option>
          {uniqueOptions.group.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select className="select-main" value={filters.grade} onChange={e => setFilters(f => ({ ...f, grade: e.target.value }))} style={{ width: 100 }}>
          <option value="">전체 학년</option>
          {uniqueOptions.grade.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select className="select-main" value={filters.gender} onChange={e => setFilters(f => ({ ...f, gender: e.target.value }))} style={{ width: 100 }}>
          <option value="">전체 성별</option>
          {uniqueOptions.gender.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select className="select-main" value={filters.church} onChange={e => setFilters(f => ({ ...f, church: e.target.value }))} style={{ width: 120 }}>
          <option value="">전체 교회</option>
          {uniqueOptions.church.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <input type="text" className="input-main w-32" placeholder="학생 이름 검색" value={filters.studentName} onChange={e => setFilters(f => ({ ...f, studentName: e.target.value }))} />
        <button className="btn-main" onClick={() => setFilters({ group: '', grade: '', gender: '', church: '', studentName: '' })} type="button">초기화</button>
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="overflow-x-auto rounded-box p-2">
        <table className="min-w-full table-box">
          <thead>
            <tr>
              <th className="px-2 py-1 border">이름</th>
              <th className="px-2 py-1 border">아이디</th>
              <th className="px-2 py-1 border">조</th>
              <th className="px-2 py-1 border">학년</th>
              <th className="px-2 py-1 border">성별</th>
              <th className="px-2 py-1 border">현재 달란트</th>
              <th className="px-2 py-1 border">금액</th>
              <th className="px-2 py-1 border">사유</th>
              <th className="px-2 py-1 border">지급</th>
              <th className="px-2 py-1 border">차감</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center">로딩 중...</td></tr>
            ) : filterStudents(students).length === 0 ? (
              <tr><td colSpan={10} className="text-center">학생이 없습니다.</td></tr>
            ) : filterStudents(students).map(stu => (
              <tr key={stu.id}>
                <td className="px-2 py-1 border">{stu.name}</td>
                <td className="px-2 py-1 border">{stu.username}</td>
                <td className="px-2 py-1 border">{stu.group}</td>
                <td className="px-2 py-1 border">{stu.grade}</td>
                <td className="px-2 py-1 border">{stu.gender}</td>
                <td className="px-2 py-1 border">{stu.current_talent}</td>
                <td className="px-2 py-1 border">
                  <input
                    type="number"
                    className="border px-2 py-1 rounded w-20"
                    value={amounts[stu.id] || ''}
                    onChange={e => handleAmountChange(stu.id, e.target.value)}
                    min={1}
                  />
                </td>
                <td className="px-2 py-1 border">
                  <input
                    type="text"
                    className="border px-2 py-1 rounded w-32"
                    value={reasons[stu.id] || ''}
                    onChange={e => handleReasonChange(stu.id, e.target.value)}
                    placeholder="사유(선택)"
                  />
                </td>
                <td className="px-2 py-1 border">
                  <button
                    className="btn-give"
                    onClick={() => handleTalent(stu.id, 'give')}
                    disabled={processing[stu.id]}
                  >
                    지급
                  </button>
                </td>
                <td className="px-2 py-1 border">
                  <button
                    className="btn-take"
                    onClick={() => handleTalent(stu.id, 'take')}
                    disabled={processing[stu.id]}
                  >
                    차감
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 