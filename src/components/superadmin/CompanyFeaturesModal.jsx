import React, { useState } from 'react';
import { Switch, message } from 'antd';
import { Modal } from '../ui';
import { FEATURES, isFeatureEnabled } from '../../config/features';
import { setCompanyFeatures } from '../../services/companyService';

/**
 * Modules activés pour UNE entreprise.
 *
 * Couper un module masque les sections correspondantes dans son menu ; les
 * données déjà saisies restent intactes, elles redeviennent visibles si le
 * module est réactivé.
 */
const CompanyFeaturesModal = ({ company, onClose, onSaved }) => {
  const [features, setFeatures] = useState(company.features || {});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await setCompanyFeatures(company.id, features);
      message.success(`Modules mis à jour pour ${company.name}.`);
      onSaved?.();
      onClose();
    } catch (err) {
      message.error(err.message);
    } finally { setSaving(false); }
  };

  return (
    <Modal title={`Modules — ${company.name}`} onClose={onClose} onOk={save}
           okText="Enregistrer" confirmLoading={saving} width={520}>
      <p className="text-[0.8rem] text-text-muted mb-3">
        Couper un module retire les écrans correspondants du menu de cette entreprise.
        Les données existantes sont conservées.
      </p>
      <ul className="divide-y divide-black/5 dark:divide-white/10 -my-2">
        {FEATURES.map(f => (
          <li key={f.key} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <div className="text-[0.84rem] font-medium text-text-heading">{f.label}</div>
              <div className="text-[0.74rem] text-text-muted">{f.description}</div>
            </div>
            <Switch
              checked={isFeatureEnabled(features, f.key)}
              onChange={(v) => setFeatures(prev => ({ ...prev, [f.key]: v }))}
            />
          </li>
        ))}
      </ul>
    </Modal>
  );
};

export default CompanyFeaturesModal;
