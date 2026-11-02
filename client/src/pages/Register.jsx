import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { InteractiveHoverButton } from '../components/ui/interactive-hover-button';
import { Mail, Lock, User, GraduationCap, Calendar, Hash, ArrowRight } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: 'Computer Science & Engineering',
    semester: 1,
    studentId: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const departments = [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Electrical & Electronics',
    'Mechanical Engineering',
    'Civil Engineering',
    'Data Science & AI',
    'Biotechnology',
    'Other',
  ];

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    if (!formData.department) errs.department = 'Department is required';
    if (!formData.semester || formData.semester < 1 || formData.semester > 12) {
      errs.semester = 'Semester must be between 1 and 12';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'semester' ? Number(value) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const result = await register(formData);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create Student Account</h2>
        <p className="text-xs text-slate-500 mt-1">
          Join lostLecture to access and share resources with your peers
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Alex Johnson"
              className={`block w-full pl-9 pr-3 py-2 text-sm rounded-lg border ${
                errors.name ? 'border-red-400 focus:ring-red-400' : 'border-slate-300 focus:ring-blue-500'
              } focus:outline-none focus:ring-2 focus:border-transparent transition`}
            />
          </div>
          {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="alex@university.edu"
              className={`block w-full pl-9 pr-3 py-2 text-sm rounded-lg border ${
                errors.email ? 'border-red-400 focus:ring-red-400' : 'border-slate-300 focus:ring-blue-500'
              } focus:outline-none focus:ring-2 focus:border-transparent transition`}
            />
          </div>
          {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <GraduationCap className="w-4 h-4" />
              </div>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="block w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Semester (1-12)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className="block w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
              >
                {Array.from({ length: 8 }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Student ID <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Hash className="w-4 h-4" />
            </div>
            <input
              type="text"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              placeholder="e.g. 2024CS042"
              className="block w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`block w-full pl-9 pr-3 py-2 text-sm rounded-lg border ${
                  errors.password ? 'border-red-400' : 'border-slate-300 focus:ring-blue-500'
                } focus:outline-none focus:ring-2 focus:border-transparent transition`}
              />
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-0.5">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className={`block w-full pl-9 pr-3 py-2 text-sm rounded-lg border ${
                  errors.confirmPassword ? 'border-red-400' : 'border-slate-300 focus:ring-blue-500'
                } focus:outline-none focus:ring-2 focus:border-transparent transition`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-0.5">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        <div className="pt-2">
          <InteractiveHoverButton
            type="submit"
            disabled={loading}
            loading={loading}
            variant="primary"
            size="lg"
            className="w-full justify-center"
            text="Create Academic Account"
          />
        </div>
      </form>

      <div className="mt-6 text-center border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

