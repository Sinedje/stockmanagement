import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Input } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/layouts/AuthLayout';
import { isSupabaseConfigured } from '../lib/supabase';

/**
 * Écran de connexion.
 *
 * L'identifiant accepte deux formes : une adresse e-mail pour un compte
 * Supabase, un pseudonyme pour un compte historique. Le champ le dit
 * explicitement, faute de quoi la saisie part vers le mauvais système.
 */
const Login = () => {
  const { login, authError } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const identifierRef = useRef(null);

  // Le curseur se place seul : l'écran n'a qu'un seul point d'entrée.
  useEffect(() => { identifierRef.current?.focus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setLoading(true);
    try {
      const result = await login(identifier.trim(), password);
      if (result.success) {
        navigate('/', { replace: true });
      } else {
        // Message volontairement identique quel que soit le champ fautif :
        // préciser « ce compte n'existe pas » permettrait de deviner quelles
        // adresses sont enregistrées.
        setError(result.error || 'Identifiants incorrects.');
        setPassword('');
      }
    } catch (err) {
      setError(err?.message || 'Connexion impossible. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const displayError = error || authError;

  return (
    <AuthLayout subtitle="Connexion à votre espace">
      {displayError && (
        <Alert
          title={displayError}
          type="error"
          showIcon
          role="alert"
          style={{ marginBottom: 18 }}
        />
      )}

      <form onSubmit={handleSubmit} className="login-form" noValidate>
        <div className="login-field">
          <label className="custom-input-label" htmlFor="login-identifier">
            E-mail ou nom d'utilisateur
          </label>
          <Input
            id="login-identifier"
            ref={identifierRef}
            size="large"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="email"
            prefix={<UserOutlined className="text-text-muted" />}
            placeholder="vous@exemple.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="login-field">
          <label className="custom-input-label" htmlFor="login-password">
            Mot de passe
          </label>
          {/* Input.Password : l'œil permet de vérifier une saisie longue,
              ce qui évite bien des échecs de connexion sur mobile. */}
          <Input.Password
            id="login-password"
            size="large"
            autoComplete="current-password"
            prefix={<LockOutlined className="text-text-muted" />}
            placeholder="Votre mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={loading}
          disabled={!identifier.trim() || !password}
          className="login-submit"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </Button>

        {isSupabaseConfigured && (
          <button
            type="button"
            className="login-link"
            onClick={() => navigate('/reset-password')}
          >
            Mot de passe oublié ?
          </button>
        )}
      </form>
    </AuthLayout>
  );
};

export default Login;
