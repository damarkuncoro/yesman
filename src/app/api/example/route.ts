import { API } from "@/lib/api";

/**
 * Contoh implementasi App Router menggunakan utility API
 * Handler GET untuk mengambil data contoh
 */
export const GET = API.handle(async () => {
  // Simulasi data (dalam implementasi nyata, ambil dari database)
  const data = [
    { id: 1, name: "Damar", role: "Admin" },
    { id: 2, name: "User", role: "Member" },
    { id: 3, name: "Guest", role: "Visitor" }
  ];
  
  // Contoh dengan metadata tambahan
  const meta = {
    total: data.length,
    timestamp: new Date().toISOString()
  };
  
  return API.success(data, 200, meta);
});

/**
 * Handler POST untuk membuat data baru
 * Mendemonstrasikan validasi dan error handling otomatis
 */
export const POST = API.handle(async (req: Request) => {
  const body = await req.json();
  
  // Validasi input - error akan ditangkap otomatis oleh API.handle
  if (!body.name) {
    throw new Error("Nama wajib diisi");
  }
  
  if (!body.role) {
    throw new Error("Role wajib diisi");
  }
  
  // Simulasi pembuatan data baru
  const newData = {
    id: Date.now(),
    name: body.name,
    role: body.role,
    createdAt: new Date().toISOString()
  };
  
  // Return dengan status 201 (Created)
  return API.success(newData, 201);
});

/**
 * Handler PUT untuk update data
 * Mendemonstrasikan berbagai jenis error handling
 */
export const PUT = API.handle(async (req: Request) => {
  const body = await req.json();
  
  if (!body.id) {
    throw new Error("ID wajib diisi untuk update");
  }
  
  // Simulasi data tidak ditemukan
  if (body.id === 999) {
    return API.error("Data tidak ditemukan", 404);
  }
  
  // Simulasi update berhasil
  const updatedData = {
    id: body.id,
    name: body.name || "Updated Name",
    role: body.role || "Updated Role",
    updatedAt: new Date().toISOString()
  };
  
  return API.success(updatedData);
});

/**
 * Handler DELETE untuk menghapus data
 * Mendemonstrasikan response tanpa data
 */
export const DELETE = API.handle(async (req: Request) => {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  
  if (!id) {
    throw new Error("ID wajib diisi untuk delete");
  }
  
  // Simulasi penghapusan berhasil
  return API.success({ message: `Data dengan ID ${id} berhasil dihapus` });
});