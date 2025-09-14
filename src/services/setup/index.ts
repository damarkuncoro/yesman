/**
 * Service untuk menjalankan setup aplikasi saat startup
 * Mengikuti prinsip Single Responsibility Principle (SRP)
 * 
 * Note: Setup service ini dipanggil dari next.config.ts saat build time,
 * sehingga tidak bisa menggunakan dependency yang kompleks.
 * Route discovery akan dijalankan saat runtime melalui middleware atau API.
 */
class SetupService {
  /**
   * Menjalankan setup aplikasi basic
   * @returns Promise<void>
   */
  async setup(): Promise<void> {
    console.log('🔧 Setup service loaded');
    
    try {
      // Setup basic configuration
      console.log('⚙️ Initializing basic configuration...');
      
      // Note: Route discovery akan dijalankan saat runtime
      // karena membutuhkan database connection dan dependency injection
      console.log('📝 Route discovery akan dijalankan saat runtime');
      
    } catch (error: unknown) {
      console.error('❌ Error dalam setup service:', error);
      // Tidak throw error agar aplikasi tetap bisa jalan
    }
    
    console.log('🚀 Setup service completed');
  }
  
  /**
   * Menjalankan route discovery saat runtime
   * Method ini akan dipanggil dari middleware atau API endpoint
   * @returns Promise<void>
   */
  async runRouteDiscovery(): Promise<void> {
    try {
      // Dynamic import untuk menghindari dependency issues di build time
      const { routeDiscovery } = await import('@/services');
      
      console.log('🔍 Memulai route discovery...');
      const discoveryResult = await routeDiscovery.runFullDiscovery();
      
      console.log(`✅ Route discovery selesai:`);
      console.log(`   - ${discoveryResult.registered} route terdaftar`);
      console.log(`   - ${discoveryResult.skipped} route dilewati`);
      
      if (discoveryResult.errors.length > 0) {
        console.log(`❌ ${discoveryResult.errors.length} error terjadi:`);
        discoveryResult.errors.forEach(error => console.log(`   - ${error}`));
      }
      
    } catch (error: unknown) {
      console.error('❌ Error dalam route discovery:', error);
    }
  }
}

export default new SetupService();