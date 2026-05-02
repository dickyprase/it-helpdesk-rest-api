const pool = require('../config/database');

const CategoryModel = {
  async findAll() {
    const { rows } = await pool.query(`SELECT id, name, description FROM "Category" ORDER BY name ASC`);
    return rows;
  },
};

module.exports = CategoryModel;
