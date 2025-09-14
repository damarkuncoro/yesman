/**
 * Script untuk mengatur grants_all pada role tertentu
 * Usage: node scripts/set-grants-all.js <role_name> <true|false>
 * Example: node scripts/set-grants-all.js admin true
 */

const { Pool } = require('pg');

// Konfigurasi database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://yesman_user:yesman_password@localhost:5432/yesman_db'
});

/**
 * Fungsi untuk mengatur grants_all pada role
 * @param {string} roleName - Nama role yang akan diupdate
 * @param {boolean} grantsAll - Status grants_all (true/false)
 */
async function setGrantsAll(roleName, grantsAll) {
  try {
    console.log(`=== Setting grants_all = ${grantsAll} for role '${roleName}' ===`);
    
    // Cek apakah role exists
    const roleCheck = await pool.query(
      'SELECT id, name, grants_all FROM roles WHERE name = $1',
      [roleName]
    );
    
    if (roleCheck.rows.length === 0) {
      console.error(`❌ Role '${roleName}' tidak ditemukan!`);
      return false;
    }
    
    const currentRole = roleCheck.rows[0];
    console.log(`📋 Role saat ini:`, currentRole);
    
    if (currentRole.grants_all === grantsAll) {
      console.log(`ℹ️  Role '${roleName}' sudah memiliki grants_all = ${grantsAll}`);
      return true;
    }
    
    // Update grants_all
    const updateResult = await pool.query(
      'UPDATE roles SET grants_all = $1 WHERE name = $2 RETURNING *',
      [grantsAll, roleName]
    );
    
    console.log(`✅ Role '${roleName}' berhasil diupdate:`, updateResult.rows[0]);
    
    // Tampilkan users yang terpengaruh
    const affectedUsers = await pool.query(`
      SELECT u.id, u.name, u.email, r.name as role_name, r.grants_all
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = $1
    `, [roleName]);
    
    console.log(`\n👥 Users yang terpengaruh (${affectedUsers.rows.length}):`);
    affectedUsers.rows.forEach(user => {
      console.log(`   - ${user.name} (${user.email})`);
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

/**
 * Fungsi untuk menampilkan semua roles dengan status grants_all
 */
async function listRolesWithGrantsAll() {
  try {
    console.log('=== Daftar Roles dengan Grants All Status ===');
    
    const roles = await pool.query(
      'SELECT id, name, grants_all FROM roles ORDER BY name'
    );
    
    console.log('\n📋 Roles:');
    roles.rows.forEach(role => {
      const status = role.grants_all ? '✅ FULL ACCESS' : '❌ LIMITED';
      console.log(`   ${role.id}. ${role.name} - ${status}`);
    });
    
    return roles.rows;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return [];
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📖 Usage: node scripts/set-grants-all.js <command> [options]');
    console.log('\nCommands:');
    console.log('  set <role_name> <true|false>  - Set grants_all untuk role tertentu');
    console.log('  list                          - Tampilkan semua roles dengan status grants_all');
    console.log('\nExamples:');
    console.log('  node scripts/set-grants-all.js set admin true');
    console.log('  node scripts/set-grants-all.js set user false');
    console.log('  node scripts/set-grants-all.js list');
    process.exit(1);
  }
  
  const command = args[0];
  
  try {
    if (command === 'list') {
      await listRolesWithGrantsAll();
    } else if (command === 'set') {
      if (args.length !== 3) {
        console.error('❌ Usage: node scripts/set-grants-all.js set <role_name> <true|false>');
        process.exit(1);
      }
      
      const roleName = args[1];
      const grantsAllStr = args[2].toLowerCase();
      
      if (grantsAllStr !== 'true' && grantsAllStr !== 'false') {
        console.error('❌ Parameter grants_all harus "true" atau "false"');
        process.exit(1);
      }
      
      const grantsAll = grantsAllStr === 'true';
      const success = await setGrantsAll(roleName, grantsAll);
      
      if (!success) {
        process.exit(1);
      }
    } else {
      console.error(`❌ Command '${command}' tidak dikenal. Gunakan 'set' atau 'list'.`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Jalankan script jika dipanggil langsung
if (require.main === module) {
  main();
}

module.exports = {
  setGrantsAll,
  listRolesWithGrantsAll
};