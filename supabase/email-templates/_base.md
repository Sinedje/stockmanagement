# Modèles d'e-mails Supabase

À coller dans **Authentication → Emails**, un modèle par onglet.

Contraintes propres à l'e-mail, qui expliquent le HTML employé :

- **Mise en page en tableaux** et **styles en ligne** : Outlook et plusieurs
  webmails ignorent `flex`, `grid` et les feuilles de style externes.
- **Largeur fixe à 560 px**, lisible sans zoom sur mobile.
- **Aucune image distante** : la plupart des clients les bloquent par défaut,
  et un logo invisible laisse un cadre vide. Le repère visuel est donc un bloc
  coloré construit en HTML.
- **Lien en clair sous le bouton** : les boutons stylés sont parfois dépouillés
  de leur mise en forme, ou le lien n'est pas cliquable.

Variables disponibles : `{{ .ConfirmationURL }}`, `{{ .Token }}`,
`{{ .TokenHash }}`, `{{ .SiteURL }}`, `{{ .Email }}`, `{{ .NewEmail }}`.

| Fichier | Onglet Supabase |
|---|---|
| `confirm-signup.html` | Confirm signup |
| `reset-password.html` | Reset password |
| `invite-user.html` | Invite user |
| `change-email.html` | Change Email Address |
| `magic-link.html` | Magic Link |
