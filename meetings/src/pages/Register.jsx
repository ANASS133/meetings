import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Already logged in → redirect
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      showToast(t('auth.fill_fields'), 'warning');
      return;
    }
    if (password.length < 6) {
      showToast(t('auth.password_length'), 'warning');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      showToast(t('auth.register_success'), 'success');
      navigate('/login');
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        t('auth.register_failed');
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{t('auth.register_title')}</h1>
          <p>{t('auth.register_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="name">{t('auth.full_name')}</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.password_min')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">{t('auth.role')}</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="ADMIN">{t('auth.role_admin')}</option>
              <option value="PHOTOGRAPHER">{t('auth.role_photographer')}</option>
            </select>
          </div>

          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading ? t('auth.creating_account') : t('auth.create_account')}
          </button>
        </form>

        <p className="auth-footer">
          {t('auth.has_account')}{' '}
          <Link to="/login">{t('auth.sign_in')}</Link>
        </p>
      </div>
    </div>
  );
}
