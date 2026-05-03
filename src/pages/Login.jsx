import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import Input from '../components/common/Input';
import AuthLayout from '../components/layouts/AuthLayout';
import { Button, Alert } from 'antd';

const Login = () => {
  const { login } = useStore();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (login(username, password)) {
      navigate('/');
    } else {
      setError('Identifiants incorrects');
    }
  };

  return (
    <AuthLayout subtitle="Connexion à votre espace">
      {error && (
        <Alert
          message={error}
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
          style={{ height: '50px', fontWeight: 'bold' }}
        >
          Se Connecter
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Login;
