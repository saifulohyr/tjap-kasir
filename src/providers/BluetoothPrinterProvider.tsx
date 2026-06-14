'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

// ── Web Bluetooth API types (belum ada di standard TS lib) ──
interface BtCharacteristic {
  properties: { write: boolean; writeWithoutResponse: boolean }
  writeValueWithoutResponse: (data: Uint8Array) => Promise<void>
  writeValue: (data: Uint8Array) => Promise<void>
}
interface BtService {
  getCharacteristics: () => Promise<BtCharacteristic[]>
}
interface BtGATTServer {
  connect: () => Promise<BtGATTServer>
  getPrimaryServices: () => Promise<BtService[]>
  connected?: boolean
  disconnect: () => void
}
interface BtDevice {
  id: string
  name?: string
  gatt: BtGATTServer
  addEventListener: (event: string, handler: () => void) => void
  removeEventListener: (event: string, handler: () => void) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NavigatorBluetooth = Navigator & { bluetooth: any }

// ── LocalStorage key ──
const LS_DEVICE_ID_KEY = 'bt_printer_device_id'

// ── Context shape (sama dengan BluetoothPrinterHook sebelumnya) ──
export interface BluetoothPrinterContextValue {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  print: (data: Uint8Array) => Promise<void>
}

const BluetoothPrinterContext = createContext<BluetoothPrinterContextValue | null>(null)

// ── Hook untuk mengambil context ──
export function useBluetoothPrinterContext(): BluetoothPrinterContextValue {
  const ctx = useContext(BluetoothPrinterContext)
  if (!ctx) {
    throw new Error('useBluetoothPrinterContext harus digunakan di dalam <BluetoothPrinterProvider>')
  }
  return ctx
}

// ── Service UUID yang umum dipakai printer POS ──
const OPTIONAL_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS Service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Alternative POS Service
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Serial port service
]

// ── Provider ──
export default function BluetoothPrinterProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Simpan referensi di useRef supaya tidak hilang saat re-render
  const deviceRef = useRef<BtDevice | null>(null)
  const characteristicRef = useRef<BtCharacteristic | null>(null)
  // Flag supaya auto-reconnect hanya dijalankan sekali
  const autoReconnectAttempted = useRef(false)

  // ── Handler ketika perangkat terputus ──
  const handleDisconnect = useCallback(() => {
    setIsConnected(false)
    characteristicRef.current = null
    // Jangan hapus deviceRef agar bisa reconnect
  }, [])

  // ── Helper: setelah dapat server GATT, cari characteristic yang bisa write ──
  const findWritableCharacteristic = async (server: BtGATTServer): Promise<BtCharacteristic | null> => {
    const services = await server.getPrimaryServices()
    for (const service of services) {
      const characteristics = await service.getCharacteristics()
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          return char
        }
      }
    }
    return null
  }

  // ── Connect: dipanggil oleh user (klik tombol) ──
  const connect = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
      setError('Web Bluetooth tidak didukung di browser ini. Gunakan Chrome atau Edge.')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const nav = navigator as NavigatorBluetooth

      const btDevice: BtDevice = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: OPTIONAL_SERVICES,
      })

      btDevice.addEventListener('gattserverdisconnected', handleDisconnect)

      const server = await btDevice.gatt.connect()
      if (!server) throw new Error('Gagal terhubung ke GATT server')

      const char = await findWritableCharacteristic(server)
      if (!char) {
        throw new Error('Characteristic yang bisa write tidak ditemukan. Pastikan ini printer yang didukung.')
      }

      deviceRef.current = btDevice
      characteristicRef.current = char
      setIsConnected(true)

      // Simpan ID perangkat ke localStorage untuk auto-reconnect
      try {
        localStorage.setItem(LS_DEVICE_ID_KEY, btDevice.id)
      } catch {
        // Kalau localStorage ga bisa ditulis, abaikan saja
      }
    } catch (err: unknown) {
      console.error('[BT] Connect error:', err)
      setError(err instanceof Error ? err.message : 'Gagal menghubungkan ke printer Bluetooth')
    } finally {
      setIsConnecting(false)
    }
  }, [handleDisconnect])

  // ── Disconnect ──
  const disconnect = useCallback(() => {
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect()
    }
    deviceRef.current = null
    characteristicRef.current = null
    setIsConnected(false)

    // Hapus ID dari localStorage agar tidak auto-reconnect lagi
    try {
      localStorage.removeItem(LS_DEVICE_ID_KEY)
    } catch {
      // abaikan
    }
  }, [])

  // ── Print ──
  const print = useCallback(async (data: Uint8Array) => {
    const char = characteristicRef.current
    if (!char) {
      setError('Belum terhubung ke printer')
      return
    }

    try {
      const CHUNK_SIZE = 100
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE)
        if (char.properties.writeWithoutResponse) {
          await char.writeValueWithoutResponse(chunk)
        } else {
          await char.writeValue(chunk)
        }
      }
    } catch (err: unknown) {
      console.error('[BT] Print error:', err)
      setError(err instanceof Error ? err.message : 'Gagal mencetak')
    }
  }, [])

  // ── Auto-reconnect saat halaman dimuat / refresh ──
  useEffect(() => {
    if (autoReconnectAttempted.current) return
    autoReconnectAttempted.current = true

    const attemptAutoReconnect = async () => {
      // Pastikan API tersedia
      if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) return

      const nav = navigator as NavigatorBluetooth

      // getDevices() hanya tersedia di Chromium-based browsers
      if (typeof nav.bluetooth.getDevices !== 'function') return

      // Ambil ID perangkat yang pernah disimpan
      let savedDeviceId: string | null = null
      try {
        savedDeviceId = localStorage.getItem(LS_DEVICE_ID_KEY)
      } catch {
        return
      }
      if (!savedDeviceId) return

      try {
        setIsConnecting(true)
        setError(null)

        const devices: BtDevice[] = await nav.bluetooth.getDevices()
        const target = devices.find((d) => d.id === savedDeviceId)

        if (!target) {
          // Perangkat tidak ditemukan di daftar yang sudah di-grant permission
          setIsConnecting(false)
          return
        }

        target.addEventListener('gattserverdisconnected', handleDisconnect)

        const server = await target.gatt.connect()
        if (!server) throw new Error('Gagal reconnect ke GATT server')

        const char = await findWritableCharacteristic(server)
        if (!char) throw new Error('Writable characteristic tidak ditemukan saat reconnect')

        deviceRef.current = target
        characteristicRef.current = char
        setIsConnected(true)
      } catch (err) {
        console.warn('[BT] Auto-reconnect gagal:', err)
        // Tidak perlu tampilkan error ke UI, biarkan user connect manual
      } finally {
        setIsConnecting(false)
      }
    }

    attemptAutoReconnect()
  }, [handleDisconnect])

  return (
    <BluetoothPrinterContext.Provider value={{ isConnected, isConnecting, error, connect, disconnect, print }}>
      {children}
    </BluetoothPrinterContext.Provider>
  )
}
