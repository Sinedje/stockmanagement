import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import Input from '../components/common/Input';
import AuthLayout from '../components/layouts/AuthLayout';
import { isSupabaseConfigured } from '../lib/supabase';
import { Button, Alert } from 'antd';

const Login = () => {
  // useAuth — this is the only component that should trigger login
  const { login, authError } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setLoading(true);

    const result = await login(username, password);

    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setLocalError(result.error || 'Identifiants incorrects');
    }
  };

  const displayError = localError || authError;

  return (
    <AuthLayout subtitle="Connexion à votre espace">
      {displayError && (
        <Alert
          message={displayError}
          type="error"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      )}

      <form onSubmit={handleSubmit} className="login-form">
        <Input
          label="E-mail ou nom d'utilisateur"
          icon={User}
          placeholder="vous@exemple.com ou admin"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <Input
          label="Mot de passe"
          icon={Lock}
          type="password"
          placeholder="••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={loading}
          style={{ height: '50px', fontWeight: 'bold' }}
        >
          Se Connecter
        </Button>

        {/* Sans ce lien, un mot de passe perdu enfermerait dehors le seul
            superadmin : /setup se ferme définitivement après l'installation. */}
        {isSupabaseConfigured && (
          <div style={{ textAlign: 'center', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => navigate('/reset-password')}
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                       font: 'inherit', fontSize: '13px', color: 'var(--color-primary)' }}
            >
              Mot de passe oublié ?
            </button>
          </div>
        )}

        <div style={{ marginTop: '16px', fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
          💡 <strong>Comptes par défaut :</strong> <code>admin</code>, <code>manager</code>, <code>caisse1</code>, <code>comptable</code> (Mot de passe: <code>1234</code>)
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;
