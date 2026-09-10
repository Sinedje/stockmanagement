import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

/**
 * Identité affichée dans la barre latérale.
 *
 * Trois cas, dans cet ordre :
 *  - superadmin  : il n'appartient à aucune entreprise, on montre le produit ;
 *  - compte Supabase : nom et logo viennent de SON entreprise ;
 *  - compte historique : on retombe sur les réglages MongoDB existants.
 *
 * La RLS garantit qu'un utilisateur ne peut lire que sa propre entreprise :
 * la requête ci-dessous ne peut pas renvoyer celle d'un autre client.
 */
export const useCompanyBranding = () => {
  const { currentUser } = useAuth();
  const { companySettings } = useStore();
  const [company, setCompany] = useState(null);

  const companyId = currentUser?.companyId;

  useEffect(() => {
    if (!isSupabaseConfigured || !companyId) { setCompany(null); return; }
    let cancelled = false;
    supabase
      .from('companies')
      .select('name, logo_url, features')
      .eq('id', companyId)
      .single()
      .then(({ data }) => { if (!cancelled) setCompany(data || null); });
    return () => { cancelled = true; };
  }, [companyId]);

  if (currentUser?.role === 'superadmin') {
    return { name: 'STOCK EXPERT', tagline: 'PLATEFORME', logoUrl: null, features: {} };
  }

  return {
    name: company?.name || companySettings?.name || 'STOCK EXPERT',
    tagline: 'STOCK EXPERT',
    logoUrl: company?.logo_url || null,
    features: company?.features || {},
  };
};

export default useCompanyBranding;
