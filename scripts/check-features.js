const { Pool } = require('pg');

// Konfigurasi database
const pool = new Pool({
  user: 'yesman_user',
  host: 'localhost',
  database: 'yesman_db',
  password: 'yesman_password',
  port: 5432,
});

async function checkAndSeedFeatures() {
  try {
    console.log('Connecting to database...');
    
    // Cek apakah ada data features
    const featuresResult = await pool.query('SELECT * FROM features ORDER BY id');
    console.log(`Found ${featuresResult.rows.length} features in database:`);
    
    if (featuresResult.rows.length > 0) {
      featuresResult.rows.forEach(feature => {
        console.log(`- ID: ${feature.id}, Name: ${feature.name}, Category: ${feature.category || 'N/A'}, Description: ${feature.description || 'N/A'}`);
      });
    } else {
      console.log('No features found. Adding sample features...');
      
      // Tambahkan sample features
      const sampleFeatures = [
        { name: 'User Management', description: 'Manage users and their profiles', category: 'Administration' },
        { name: 'Role Management', description: 'Manage roles and permissions', category: 'Administration' },
        { name: 'Feature Management', description: 'Manage system features', category: 'Administration' },
        { name: 'Dashboard Access', description: 'Access to main dashboard', category: 'General' },
        { name: 'Reports', description: 'Generate and view reports', category: 'Analytics' },
        { name: 'Settings', description: 'System configuration settings', category: 'Configuration' },
        { name: 'Audit Logs', description: 'View system audit logs', category: 'Security' },
        { name: 'Policy Management', description: 'Manage access policies', category: 'Security' }
      ];
      
      for (const feature of sampleFeatures) {
        await pool.query(
          'INSERT INTO features (name, description, category) VALUES ($1, $2, $3)',
          [feature.name, feature.description, feature.category]
        );
        console.log(`Added feature: ${feature.name}`);
      }
      
      console.log('Sample features added successfully!');
    }
    
    // Cek role_features untuk role pertama
    const roleFeatureResult = await pool.query(`
      SELECT rf.*, f.name as feature_name, r.name as role_name 
      FROM role_features rf 
      JOIN features f ON rf.feature_id = f.id 
      JOIN roles r ON rf.role_id = r.id 
      ORDER BY rf.role_id, rf.feature_id
    `);
    
    console.log(`\nFound ${roleFeatureResult.rows.length} role-feature assignments:`);
    if (roleFeatureResult.rows.length > 0) {
      roleFeatureResult.rows.forEach(rf => {
        console.log(`- Role: ${rf.role_name}, Feature: ${rf.feature_name}, CRUD: [C:${rf.can_create}, R:${rf.can_read}, U:${rf.can_update}, D:${rf.can_delete}]`);
      });
    } else {
      console.log('No role-feature assignments found.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkAndSeedFeatures();