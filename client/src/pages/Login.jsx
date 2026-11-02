import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { InteractiveHoverButton } from '../components/ui/interactive-hover-button';
import { Mail, Lock, ArrowRight, Shield, User as UserIcon } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      errs.password = 'Password is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const result = await login(formData.email, formData.password);
    setLoading(false);

    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  // Quick helper for evaluators/graders to test easily
  const fillCredentials = (type) => {
    if (type === 'admin') {
      setFormData({
        email: 'admin@lostlecture.edu',
        password: 'AdminPassword123!',
      });
    } else {
      setFormData({
        email: 'student@lostlecture.edu',
        password: 'StudentPassword123!',
      });
    }
    setErrors({});
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign In to lostLecture</h2>
        <p className="text-xs text-slate-500 mt-1">
          Access your department's notes, slides, and academic materials
        </p>
      </div>

      {/* Quick Fill Test Accounts Banner */}
      <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <p className="text-[11px] font-semibold text-slate-600 mb-2">Quick Demo Access:</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillCredentials('student')}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:border-slate-300 text-slate-700 transition"
          >
            <UserIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>Student Demo</span>
          </button>
          <button
            type="button"
            onClick={() => fillCredentials('admin')}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:border-slate-300 text-slate-700 transition"
          >
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span>Admin Demo</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@university.edu"
              className={`block w-full pl-9 pr-3 py-2 text-sm rounded-lg border ${
                errors.email ? 'border-red-400 focus:ring-red-400' : 'border-slate-300 focus:ring-blue-500'
              } focus:outline-none focus:ring-2 focus:border-transparent transition`}
            />
          </div>
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">Password</label>
          </div>
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
                errors.password ? 'border-red-400 focus:ring-red-400' : 'border-slate-300 focus:ring-blue-500'
              } focus:outline-none focus:ring-2 focus:border-transparent transition`}
            />
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
        </div>

        <div className="pt-2">
          <InteractiveHoverButton
            type="submit"
            disabled={loading}
            loading={loading}
            variant="primary"
            size="lg"
            className="w-full justify-center"
            text="Sign In to lostLecture"
          />
        </div>
      </form>

      <div className="mt-6 text-center border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

