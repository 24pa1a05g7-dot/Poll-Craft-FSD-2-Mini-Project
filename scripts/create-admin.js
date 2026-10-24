require('dotenv').config();
const { User, sequelize } = require('../src/models');

async function createAdmin() {
  const args = process.argv.slice(2);
  const email = (args[0] || process.env.ADMIN_INITIAL_EMAIL || 'admin@pollcraft.io').trim().toLowerCase();
  const password = args[1] || process.env.ADMIN_INITIAL_PASSWORD || 'AdminPassword123!';
  const name = args[2] || process.env.ADMIN_INITIAL_NAME || 'System Administrator';

  if (!email || !password) {
    console.error('Usage: node scripts/create-admin.js <email> <password> [name]');
    process.exit(1);
  }

  try {
    await sequelize.authenticate();
    await User.sync();
    
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      existing.role = 'admin';
      existing.isActive = true;
      existing.password = password; // triggers beforeUpdate bcrypt hook
      await existing.save();
      console.log(`[ADMIN SETUP] Existing user ${email} successfully promoted to Administrator.`);
    } else {
      await User.create({
        name,
        email,
        password,
        role: 'admin',
        isActive: true
      });
      console.log(`[ADMIN SETUP] New Administrator account created: ${email}`);
    }
  } catch (error) {
    console.error('[ADMIN SETUP ERROR]:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

createAdmin();
