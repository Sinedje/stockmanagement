import mongoose from 'mongoose';

const companySettingsSchema = new mongoose.Schema({
  name: { type: String, required: true, default: 'FEU FLAMENCO' },
  activity: { type: String, required: true, default: 'VENTE DE MATERIELS SECURITE INCENDIE ET ACCESSOIRES' },
  phones: { type: String, required: true, default: '+225 07 48 48 55 90 / +225 05 05 57 26 01' },
  ncc: { type: String, required: true, default: '1947852 B' },
  rccm: { type: String, required: true, default: 'CI-ABJ-03-2019-B13-17654' }
}, {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      delete ret._id;
      delete ret.__v;
    }
  }
});

export default mongoose.model('CompanySettings', companySettingsSchema);
