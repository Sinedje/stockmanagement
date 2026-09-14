import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Input } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/layouts/AuthLayout';
import { isSupabaseConfigured } from '../lib/supabase';
import { internalEmail } from '../services/memberService';

/**
 * Écran de connexion.
 *
 * Sans entreprise, l'identifiant accepte deux formes : une adresse e-mail pour
 * un compte Supabase, un pseudonyme pour un compte historique. Le champ le dit
 * explicitement, faute de quoi la saisie part vers le mauvais système.
 *
 * Ouvert depuis le lien d'une entreprise (/feu-flamenco), l'écran ne demande
 * plus qu'un nom d'utilisateur : l'adresse interne est composée ici et n'est
 * jamais montrée à l'employé, qui n'en a pas d'autre.
 */
const Login = ({ company = null }) => {
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
      const credential = company
        ? internalEmail(identifier, company.slug)
        : identifier.trim();
      const result = await login(credential, password);
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
    <AuthLayout subtitle={company ? company.name : 'Connexion à votre espace'}>
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
            {company ? "Nom d'utilisateur" : "E-mail ou nom d'utilisateur"}
          </label>
          <Input
            id="login-identifier"
            ref={identifierRef}
            size="large"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode={company ? 'text' : 'email'}
            prefix={<UserOutlined className="text-text-muted" />}
            placeholder={company ? 'votre nom d\'utilisateur' : 'vous@exemple.com'}
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
