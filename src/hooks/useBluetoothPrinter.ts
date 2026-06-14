'use client'

import { useBluetoothPrinterContext } from '@/providers/BluetoothPrinterProvider'
import type { BluetoothPrinterContextValue } from '@/providers/BluetoothPrinterProvider'

// Re-export tipe interface agar file lama yang import BluetoothPrinterHook tetap kompatibel
export type BluetoothPrinterHook = BluetoothPrinterContextValue

/**
 * Hook wrapper yang mengambil state printer Bluetooth dari context global.
 *
 * Karena context di-mount di dashboard layout, koneksi tetap aktif
 * saat berpindah halaman (POS ↔ Kitchen) tanpa harus reconnect.
 *
 * Saat halaman di-refresh, provider akan mencoba auto-reconnect
 * ke perangkat yang sebelumnya sudah di-pair menggunakan
 * navigator.bluetooth.getDevices().
 */
export function useBluetoothPrinter(): BluetoothPrinterHook {
  return useBluetoothPrinterContext()
}
