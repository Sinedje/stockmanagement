import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import Input from '../components/common/Input';
import AuthLayout from '../components/layouts/AuthLayout';
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
          label="Nom d'utilisateur"
          icon={User}
          placeholder="admin, compta..."
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
      </form>
    </AuthLayout>
  );
};

export default Login;
