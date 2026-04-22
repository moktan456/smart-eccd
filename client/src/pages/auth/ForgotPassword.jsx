// SMART ECCD – Forgot Password Page

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: email, 2: otp+new password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ email: '', otp: '', newPassword: '' });

  const handleChange = (e) => {
    setError('');
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(form.email);
      setStep(2);
      setSuccess('OTP sent! Check your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.resetPassword(form);
      setSuccess('Password reset successfully. You can now log in.');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Reset Password</h2>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1 ? "Enter your email to receive a one-time code." : step === 2 ? "Enter the OTP and your new password." : "All done!"}
          </p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>}

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
            <Button type="submit" className="w-full" loading={loading}>Send OTP</Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleReset} className="space-y-4">
            <Input label="OTP Code" name="otp" value={form.otp} onChange={handleChange} placeholder="6-digit code" required maxLength={6} />
            <Input label="New Password" name="newPassword" type="password" value={form.newPassword} onChange={handleChange} required minLength={8} />
            <Button type="submit" className="w-full" loading={loading}>Reset Password</Button>
          </form>
        )}

        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
