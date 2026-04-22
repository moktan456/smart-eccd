// SMART ECCD – Login Page

import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const Login = () => {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    clearError();
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(form);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">SE</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SMART ECCD</h1>
          <p className="text-gray-500 text-sm mt-1">Child Care Center Management Platform</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          <Button type="submit" className="w-full" loading={isLoading}>
            Sign In
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
            Forgot your password?
          </Link>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
          <p className="font-medium mb-1">Demo accounts:</p>
          <p>Super Admin: superadmin@smart-eccd.com / Admin@1234</p>
          <p>Manager: manager@brightstart.com / Manager@1234</p>
          <p>Teacher: teacher@brightstart.com / Teacher@1234</p>
          <p>Parent: parent@example.com / Parent@1234</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
