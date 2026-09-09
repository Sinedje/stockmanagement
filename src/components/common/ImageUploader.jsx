import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Trash2, Link as LinkIcon, Sparkles } from 'lucide-react';
import { compressImage } from '../../utils/excelImport';
import { message } from 'antd';

const ImageUploader = ({ value, onChange, label = "Image du Produit" }) => {
  const [mode, setMode] = useState('upload'); // 'upload' | 'url'
  const [urlInput, setUrlInput] = useState('');
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      message.error('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).');
      return;
    }

    setCompressing(true);
    try {
      const compressedDataUrl = await compressImage(file, 400, 400, 0.85);
      onChange(compressedDataUrl);
      message.success('Image chargée et optimisée avec succès');
    } catch (err) {
      console.error(err);
      message.error('Erreur lors de la compression de l\'image.');
    } finally {
      setCompressing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;
    onChange(urlInput.trim());
    setUrlInput('');
    setMode('upload');
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-text-heading">{label}</label>
        <div className="flex gap-2 text-[0.7rem] font-bold">
          <button
            type="button"
            className={`px-2 py-0.5 rounded transition-all ${mode === 'upload' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text-primary'}`}
            onClick={() => setMode('upload')}
          >
            Fichier / Glisser-Déposer
          </button>
          <button
            type="button"
            className={`px-2 py-0.5 rounded transition-all ${mode === 'url' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text-primary'}`}
            onClick={() => setMode('url')}
          >
            Lien URL
          </button>
        </div>
      </div>

      {value ? (
        <div className="relative group w-full h-36 rounded-xl border border-black/10 dark:border-white/10 overflow-hidden bg-black/5 dark:bg-white/5 flex items-center justify-center">
          <img src={value} alt="Aperçu produit" className="w-full h-full object-contain p-2" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-primary text-black font-bold text-xs hover:scale-105 transition-transform flex items-center gap-1"
            >
              <Upload size={14} /> Modifier
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white font-bold text-xs hover:scale-105 transition-transform"
              title="Supprimer l'image"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ) : mode === 'upload' ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full h-36 rounded-xl border-2 border-dashed border-black/20 dark:border-white/20 hover:border-primary/60 dark:hover:border-primary/60 bg-black/5 dark:bg-white/5 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center p-4 text-center ${compressing ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {compressing ? (
            <div className="flex flex-col items-center gap-2">
              <Sparkles className="animate-spin text-primary" size={24} />
              <span className="text-xs font-semibold text-primary">Optimisation de l'image...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                <Upload size={20} />
              </div>
              <span className="text-xs font-bold text-text-heading">Glissez une image ici ou cliquez pour choisir</span>
              <span className="text-[0.65rem] text-text-muted mt-1">Formats acceptés: PNG, JPG, WebP (auto-compressé)</span>
            </>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-text-heading focus:outline-none focus:border-primary"
            placeholder="https://exemple.com/image.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlSubmit())}
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="px-4 py-2 bg-primary text-black rounded-xl font-bold text-xs hover:opacity-90 flex items-center gap-1"
          >
            <LinkIcon size={14} /> Valider
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
      />
    </div>
  );
};

export default ImageUploader;
