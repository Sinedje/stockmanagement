import CompanySettings from '../models/CompanySettings.model.js';

export const getCompanySettings = async (req, res, next) => {
  try {
    let settings = await CompanySettings.findOne({});
    if (!settings) {
      // Create default settings if they don't exist
      settings = await CompanySettings.create({});
    }
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

export const updateCompanySettings = async (req, res, next) => {
  try {
    let settings = await CompanySettings.findOne({});
    if (!settings) {
      settings = await CompanySettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    next(error);
  }
};
