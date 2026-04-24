import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const STEPS = ['lookup', 'register', 'done'];

const Register = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState('lookup');

  // Step 1 – Student ID lookup
  const [studentId, setStudentId] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [child, setChild] = useState(null);

  // Step 2 – Account creation
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [regError, setRegError] = useState('');

  const handleLookup = async (e) => {
    e.preventDefault();
    setLookupLoading(true);
    setLookupError('');
    try {
      const { data } = await api.get('/auth/verify-student', { params: { studentId } });
      setChild(data.data);
      setStep('register');
    } catch (err) {
      setLookupError(
        err.response?.status === 404
          ? 'Student ID not found. Please check with the center manager.'
          : err.response?.data?.message || 'Lookup failed. Please try again.'
      );
    } finally {
      setLookupLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setRegError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setRegError('Password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    setRegError('');
    try {
      const { data } = await api.post('/auth/register-parent', {
        studentId,
        name:     form.name,
        email:    form.email,
        password: form.password,
      });
      setAuth(data.data.user, data.data.accessToken);
      navigate('/parent/dashboard');
    } catch (err) {
      setRegError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-white text-2xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SMART ECCD</h1>
          <p className="text-gray-500 text-sm mt-1">Parent Registration</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[
            { id: 'lookup',   label: '1. Find Child' },
            { id: 'register', label: '2. Create Account' },
          ].map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              {i > 0 && <div className="w-8 h-px bg-gray-300" />}
              <div className={`flex items-center gap-1.5 text-xs font-medium ${step === s.id || (step === 'done' && s.id === 'register') ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === s.id ? 'bg-primary-600 text-white' : step !== 'lookup' && s.id === 'lookup' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {step !== 'lookup' && s.id === 'lookup' ? '✓' : i + 1}
                </div>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {/* ── Step 1: Student ID Lookup ── */}
          {step === 'lookup' && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Find Your Child</h2>
              <p className="text-sm text-gray-500 mb-5">
                Enter the Student ID provided by the ECCD center to verify your child's enrollment.
              </p>
              <form onSubmit={handleLookup} className="space-y-4">
                {lookupError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{lookupError}</div>
                )}
                <Input
                  label="Student ID"
                  value={studentId}
                  onChange={e => setStudentId(e.target.value.toUpperCase())}
                  placeholder="e.g. STU-2024-001"
                  required
                />
                <Button type="submit" className="w-full" loading={lookupLoading}>
                  Look Up Student
                </Button>
              </form>
            </>
          )}

          {/* ── Step 2: Child confirmed + account form ── */}
          {step === 'register' && child && (
            <>
              {/* Child info banner */}
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl mb-5">
                <div className="w-10 h-10 rounded-xl bg-green-200 flex items-center justify-center text-green-800 font-bold text-lg">
                  {child.firstName?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{child.firstName} {child.lastName}</p>
                  <p className="text-xs text-gray-500">ID: {child.studentId} · {child.class?.name || 'No class assigned'}</p>
                </div>
                <span className="ml-auto text-green-600 text-lg">✓</span>
              </div>

              <h2 className="text-lg font-semibold text-gray-900 mb-1">Create Your Account</h2>
              <p className="text-sm text-gray-500 mb-4">Set up your parent login to track {child.firstName}'s progress.</p>

              <form onSubmit={handleRegister} className="space-y-4">
                {regError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{regError}</div>
                )}
                <Input
                  label="Your Full Name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Maria Santos"
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="your@email.com"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Minimum 8 characters"
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  required
                />
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setStep('lookup')} type="button" className="flex-1">
                    Back
                  </Button>
                  <Button type="submit" loading={saving} className="flex-1">
                    Create Account
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
