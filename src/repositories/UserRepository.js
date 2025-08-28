class UserRepository {
  constructor(database) {
    this.db = database;
  }

  async findAll() {
    const users = await this.db.query(
      'SELECT id, name, email, phone, role, creation_date FROM users ORDER BY creation_date DESC'
    );
    return users;
  }

  async findById(id) {
    const users = await this.db.query(
      'SELECT id, name, email, phone, role, creation_date FROM users WHERE id = ?',
      [id]
    );
    return users[0] || null;
  }

  async findByEmail(email) {
    const users = await this.db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return users[0] || null;
  }

  async emailExists(email, excludeId = null) {
    let query = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
    let params = [email];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const result = await this.db.query(query, params);
    return result[0].count > 0;
  }

  async create(userData) {
    const result = await this.db.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [userData.name, userData.email, userData.password, userData.phone, userData.role || 'user']
    );

    return this.findById(result.insertId);
  }

  async update(id, userData) {
    const setParts = [];
    const params = [];

    if (userData.name !== undefined) {
      setParts.push('name = ?');
      params.push(userData.name);
    }

    if (userData.email !== undefined) {
      setParts.push('email = ?');
      params.push(userData.email);
    }

    if (userData.phone !== undefined) {
      setParts.push('phone = ?');
      params.push(userData.phone);
    }

    if (userData.role !== undefined) {
      setParts.push('role = ?');
      params.push(userData.role);
    }

    if (setParts.length === 0) {
      return this.findById(id);
    }

    params.push(id);

    await this.db.query(
      `UPDATE users SET ${setParts.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    return this.findById(id);
  }

  async delete(id) {
    const result = await this.db.query(
      'DELETE FROM users WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }
}

module.exports = { UserRepository };
