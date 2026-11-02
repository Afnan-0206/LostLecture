import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import SearchBar from '../../components/filters/SearchBar';
import toast from 'react-hot-toast';
import { Users, Shield, User, CheckCircle2, XCircle } from 'lucide-react';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      toast.error('Failed to load user roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s) ||
      u.department?.toLowerCase().includes(s) ||
      u.studentId?.toLowerCase().includes(s)
    );
  });

  const handleToggleStatus = async (user) => {
    try {
      const res = await api.patch(`/admin/users/${user._id}/status`, {
        isActive: !user.isActive,
      });
      if (res.success) {
        toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, isActive: !u.isActive } : u))
        );
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update user status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Department Students & Faculty</h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered accounts, active enrollments, and permission controls
          </p>
        </div>

        <div className="text-xs text-slate-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          Total Users: <span className="font-bold text-slate-800">{users.length}</span>
        </div>
      </div>

      <div className="max-w-md">
        <SearchBar
          value={search}
          onChange={(term) => setSearch(term)}
          placeholder="Search by student name, email, department, or student ID..."
        />
      </div>

      {loading ? (
        <LoadingSkeleton count={4} type="table" />
      ) : filteredUsers.length > 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Department & Sem
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Student ID
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Toggle Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{u.department}</div>
                      <div className="text-[11px] text-slate-500">Semester {u.semester}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">{u.studentId || '—'}</td>
                    <td className="px-6 py-4">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          <Shield className="w-3 h-3 text-amber-600" />
                          Admin
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          Student
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          u.isActive
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                            : 'text-red-700 bg-red-50 border border-red-200'
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-red-600" />
                            Deactivated
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                          u.isActive
                            ? 'text-red-600 hover:bg-red-50 border border-red-200'
                            : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
                        }`}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState icon={Users} title="No Users Found" description="No users match your search." />
      )}
    </div>
  );
};

export default ManageUsers;

