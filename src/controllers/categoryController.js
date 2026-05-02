const CategoryModel = require('../models/categoryModel');

const CategoryController = {
  async getAll(req, res, next) {
    try {
      const categories = await CategoryModel.findAll();
      res.json({ error: false, data: categories });
    } catch (err) { next(err); }
  },
};

module.exports = CategoryController;
