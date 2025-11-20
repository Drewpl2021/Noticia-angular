// src/app/core/models/producto.model.ts
export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  tipo: 'SUSCRIPCION' | 'OTRO' | string;
  estado: 'ACTIVO' | 'INACTIVO' | string;
  creadoEn: string;
  actualizadoEn: string;
}
