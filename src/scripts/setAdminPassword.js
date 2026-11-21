'use strict';
const config = require('../config');
const db = require('../models/V1');
const { encrypt } = require('../utils/tokens');

async function main() {
  if (!config.adminPassword) throw new Error('ADMIN_PASSWORD must be set.');
  if (config.adminPassword.length < 6 || config.adminPassword.length > 20) {
    throw new Error('ADMIN_PASSWORD must be between 6 and 20 characters.');
  }
  const { hash, salt } = encrypt(config.adminPassword);
  await db.sequelize.transaction(async transaction => {
    const users = await db.sequelize.query(
      'SELECT id FROM users WHERE email = :email AND deletedAt IS NULL FOR UPDATE',
      { replacements: { email: 'kamaracomputers@gmail.com' }, type: db.Sequelize.QueryTypes.SELECT, transaction, logging: false },
    );
    if (users.length !== 1) throw new Error('The active administrator was not found. Run the administrator seeder first.');
    await db.sequelize.query(
      'UPDATE users SET password = :hash, passwordSalt = :salt, updatedAt = CURRENT_TIMESTAMP WHERE id = :id',
      { replacements: { hash, salt, id: users[0].id }, transaction, logging: false },
    );
    await db.sequelize.query(
      'UPDATE userTokens SET expiresAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE usersId = :id AND deletedAt IS NULL',
      { replacements: { id: users[0].id }, transaction, logging: false },
    );
  });
  console.log('Administrator password updated; existing sessions revoked.');
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => db.sequelize.close());
