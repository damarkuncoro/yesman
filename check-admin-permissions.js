const { userService, roleFeatureService } = require('./src/services');

/**
 * Script untuk memeriksa permission user admin
 * Mengecek apakah user admin memiliki permission 'feature_management' dengan action 'read'
 */
async function checkAdminPermissions() {
  try {
    console.log('=== Checking Admin Permissions ===');
    
    // Ambil user admin
    const user = await userService.getUserByEmail('admin@example.com');
    console.log('User found:', {
      id: user.id,
      email: user.email,
      name: user.name
    });
    
    // Ambil roles user
    const userRoles = await userService.getUserRoles(user.id);
    console.log('\nUser roles:', userRoles.map(r => ({ id: r.id, name: r.name })));
    
    // Cek permission untuk setiap role
    for (const role of userRoles) {
      console.log(`\n--- Role: ${role.name} (ID: ${role.id}) ---`);
      
      const permissions = await roleFeatureService.getRolePermissions(role.id);
      console.log(`Total permissions: ${permissions.length}`);
      
      // Cari permission feature_management
      const featureManagementPerms = permissions.filter(p => 
        p.feature && p.feature.name === 'feature_management'
      );
      
      if (featureManagementPerms.length > 0) {
        console.log('✅ Feature management permissions found:');
        featureManagementPerms.forEach(perm => {
          console.log(`  - Feature: ${perm.feature.name}`);
          console.log(`  - Can Create: ${perm.canCreate}`);
          console.log(`  - Can Read: ${perm.canRead}`);
          console.log(`  - Can Update: ${perm.canUpdate}`);
          console.log(`  - Can Delete: ${perm.canDelete}`);
        });
      } else {
        console.log('❌ No feature_management permissions found');
      }
      
      // Tampilkan semua permissions untuk debugging
      console.log('\nAll permissions for this role:');
      permissions.forEach(perm => {
        if (perm.feature) {
          console.log(`  - ${perm.feature.name}: [C:${perm.canCreate}, R:${perm.canRead}, U:${perm.canUpdate}, D:${perm.canDelete}]`);
        }
      });
    }
    
    console.log('\n=== Permission Check Complete ===');
    
  } catch (error) {
    console.error('Error checking admin permissions:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Jalankan check
checkAdminPermissions().then(() => {
  console.log('\nScript completed');
  process.exit(0);
}).catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});