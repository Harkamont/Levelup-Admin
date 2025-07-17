import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const INITIAL_FORM = {
  username: '',
  name: '',
  role: 'student',
  group: '',
  grade: '',
  gender: '',
  church: '',
};

const ROLE_OPTIONS = [
  { value: 'admin', label: '관리자' },
  { value: 'teacher', label: '교사' },
  { value: 'student', label: '학생' },
];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(INITIAL_FORM);

  // 학생 필터 상태
  const [studentFilters, setStudentFilters] = useState({ group: '', grade: '', gender: '', church: '' });

  // 학생 고유값 추출
  const studentList = users.filter(u => u.role === 'student');
  const uniqueOptions = {
    group: Array.from(new Set(studentList.map(s => s.group).filter(Boolean))).sort(),
    grade: Array.from(new Set(studentList.map(s => s.grade).filter(Boolean))).sort(),
    gender: Array.from(new Set(studentList.map(s => s.gender).filter(Boolean))).sort(),
    church: Array.from(new Set(studentList.map(s => s.church).filter(Boolean))).sort(),
  };

  // 학생 필터링 함수
  function filterStudents(students) {
    return students.filter(s => {
      return (
        (!studentFilters.group || s.group === studentFilters.group) &&
        (!studentFilters.grade || s.grade === studentFilters.grade) &&
        (!studentFilters.gender || s.gender === studentFilters.gender) &&
        (!studentFilters.church || s.church === studentFilters.church)
      );
    });
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('role', { ascending: true })
      .order('username', { ascending: true });
    if (error) setError(error.message);
    else setUsers(data);
    setLoading(false);
  }

  // 새 사용자 추가
  function handleAddChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }
  async function handleAddUser(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from('users')
      .insert([{ ...form }]);
    if (error) setError(error.message);
    else {
      setForm(INITIAL_FORM);
      setShowAddModal(false);
      fetchUsers();
    }
    setSaving(false);
  }

  // 수정
  function startEdit(user) {
    setEditingId(user.id);
    setEditForm({ ...user });
  }
  function handleEditChange(e) {
    setEditForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }
  async function handleEditSave(id) {
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from('users')
      .update({ ...editForm })
      .eq('id', id);
    if (error) setError(error.message);
    setEditingId(null);
    setEditForm(INITIAL_FORM);
    fetchUsers();
    setSaving(false);
  }
  function handleEditCancel() {
    setEditingId(null);
    setEditForm(INITIAL_FORM);
  }

  // role별 그룹핑
  const grouped = ROLE_OPTIONS.reduce((acc, role) => {
    acc[role.value] = users.filter(u => u.role === role.value);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-4">사용자 관리</h2>
      <div className="flex justify-end mb-2">
        <button className="btn-main" onClick={() => setShowAddModal(true)}>
          새 사용자 추가
        </button>
      </div>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {/* role별 그룹핑 테이블 */}
      {ROLE_OPTIONS.map(role => (
        <div key={role.value} className="mb-8">
          <h3 className="text-xl font-semibold mb-2">{role.label}</h3>
          {/* 학생 필터 UI */}
          {role.value === 'student' && (
            <div className="flex flex-wrap gap-2 mb-2">
              <select
                className="border px-2 py-1 rounded"
                value={studentFilters.group}
                onChange={e => setStudentFilters(f => ({ ...f, group: e.target.value }))}
                style={{ width: 100 }}
              >
                <option value="">전체 조</option>
                {uniqueOptions.group.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <select
                className="border px-2 py-1 rounded"
                value={studentFilters.grade}
                onChange={e => setStudentFilters(f => ({ ...f, grade: e.target.value }))}
                style={{ width: 100 }}
              >
                <option value="">전체 학년</option>
                {uniqueOptions.grade.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <select
                className="border px-2 py-1 rounded"
                value={studentFilters.gender}
                onChange={e => setStudentFilters(f => ({ ...f, gender: e.target.value }))}
                style={{ width: 100 }}
              >
                <option value="">전체 성별</option>
                {uniqueOptions.gender.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <select
                className="border px-2 py-1 rounded"
                value={studentFilters.church}
                onChange={e => setStudentFilters(f => ({ ...f, church: e.target.value }))}
                style={{ width: 120 }}
              >
                <option value="">전체 교회</option>
                {uniqueOptions.church.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <button
                className="btn-main"
                onClick={() => setStudentFilters({ group: '', grade: '', gender: '', church: '' })}
                type="button"
              >
                초기화
              </button>
            </div>
          )}
          <div className="overflow-x-auto rounded-box p-2">
            <table className="min-w-full table-box">
              <thead>
                <tr>
                  <th className="px-2 py-1 border">아이디</th>
                  <th className="px-2 py-1 border">이름</th>
                  <th className="px-2 py-1 border">조</th>
                  <th className="px-2 py-1 border">학년</th>
                  <th className="px-2 py-1 border">성별</th>
                  <th className="px-2 py-1 border">교회</th>
                  <th className="px-2 py-1 border">수정</th>
                </tr>
              </thead>
              <tbody>
                {(role.value === 'student'
                  ? filterStudents(grouped[role.value])
                  : grouped[role.value]
                ).length === 0 ? (
                  <tr><td colSpan={7} className="text-center">{role.label}이 없습니다.</td></tr>
                ) : (role.value === 'student'
                  ? filterStudents(grouped[role.value])
                  : grouped[role.value]
                ).map(user => (
                  <tr key={user.id}>
                    <td className="px-2 py-1 border">{user.username}</td>
                    <td className="px-2 py-1 border">
                      {editingId === user.id ? (
                        <input
                          name="name"
                          value={editForm.name}
                          onChange={handleEditChange}
                          className="border px-1 py-0.5 rounded w-20"
                          autoFocus
                        />
                      ) : (
                        user.name
                      )}
                    </td>
                    <td className="px-2 py-1 border">
                      {editingId === user.id ? (
                        <input
                          name="group"
                          value={editForm.group}
                          onChange={handleEditChange}
                          className="border px-1 py-0.5 rounded w-16"
                        />
                      ) : (
                        user.group
                      )}
                    </td>
                    <td className="px-2 py-1 border">
                      {editingId === user.id ? (
                        <input
                          name="grade"
                          value={editForm.grade}
                          onChange={handleEditChange}
                          className="border px-1 py-0.5 rounded w-16"
                        />
                      ) : (
                        user.grade
                      )}
                    </td>
                    <td className="px-2 py-1 border">
                      {editingId === user.id ? (
                        <input
                          name="gender"
                          value={editForm.gender}
                          onChange={handleEditChange}
                          className="border px-1 py-0.5 rounded w-12"
                        />
                      ) : (
                        user.gender
                      )}
                    </td>
                    <td className="px-2 py-1 border">
                      {editingId === user.id ? (
                        <input
                          name="church"
                          value={editForm.church}
                          onChange={handleEditChange}
                          className="border px-1 py-0.5 rounded w-20"
                        />
                      ) : (
                        user.church
                      )}
                    </td>
                    <td className="px-2 py-1 border">
                      {editingId === user.id ? (
                        <>
                          <button className="bg-green-500 text-white px-2 py-1 rounded mr-1" onClick={() => handleEditSave(user.id)} disabled={saving}>저장</button>
                          <button className="bg-gray-300 px-2 py-1 rounded" onClick={handleEditCancel}>취소</button>
                        </>
                      ) : (
                        <button
                          style={{ background: '#23b0e6', color: '#fff', borderRadius: '999px', padding: '0.5rem 1.2rem', fontWeight: 600 }}
                          onClick={() => startEdit(user)}
                        >
                          수정
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      {/* 새 사용자 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="rounded-box p-8 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-500" onClick={() => setShowAddModal(false)}>&times;</button>
            <h3 className="text-xl font-bold mb-4">새 사용자 추가</h3>
            <form onSubmit={handleAddUser} className="flex flex-col gap-2">
              <input name="username" value={form.username} onChange={handleAddChange} placeholder="아이디" className="input-main" required />
              <input name="name" value={form.name} onChange={handleAddChange} placeholder="이름" className="input-main" required />
              <select name="role" value={form.role} onChange={handleAddChange} className="select-main">
                {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <input name="group" value={form.group} onChange={handleAddChange} placeholder="조" className="input-main" />
              <input name="grade" value={form.grade} onChange={handleAddChange} placeholder="학년" className="input-main" />
              <input name="gender" value={form.gender} onChange={handleAddChange} placeholder="성별" className="input-main" />
              <input name="church" value={form.church} onChange={handleAddChange} placeholder="교회" className="input-main" />
              <button type="submit" className="btn-main mt-2" disabled={saving}>
                {saving ? '저장 중...' : '추가'}
              </button>
            </form>
            {error && <div className="text-red-500 mt-2">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
} 