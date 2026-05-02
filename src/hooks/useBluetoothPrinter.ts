'use client'

import { useState, useCallback } from 'react'

export interface BluetoothPrinterHook {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  print: (data: Uint8Array) => Promise<void>
}

export function useBluetoothPrinter(): BluetoothPrinterHook {
  const [device, setDevice] = useState<any>(null)
  const [characteristic, setCharacteristic] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDisconnect = useCallback(() => {
    setIsConnected(false)
    setCharacteristic(null)
    setDevice(null)
  }, [])

  const connect = async () => {
    if (typeof navigator === 'undefined' || !(navigator as any).bluetooth) {
      setError('Web Bluetooth is not supported in this browser. Please use Chrome or Edge.')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Request device - accept all devices to ensure POS printers are visible
      // Warning: In production you might want to filter by service UUID if known
      const btDevice = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS Service
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Alternative POS Service
          '49535343-fe7d-4ae5-8fa9-9fafd205e455'  // Another common serial port service
        ]
      })

      btDevice.addEventListener('gattserverdisconnected', handleDisconnect)

      const server = await btDevice.gatt.connect()
      if (!server) throw new Error('Failed to connect to GATT server')

      // Find the writable characteristic
      let foundCharacteristic: any = null
      const services = await server.getPrimaryServices()
      
      for (const service of services) {
        const characteristics = await service.getCharacteristics()
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            foundCharacteristic = char
            break
          }
        }
        if (foundCharacteristic) break
      }

      if (!foundCharacteristic) {
        throw new Error('Write characteristic not found on this device. Make sure it is a supported printer.')
      }

      setDevice(btDevice)
      setCharacteristic(foundCharacteristic)
      setIsConnected(true)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to connect to Bluetooth printer')
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect()
    }
    handleDisconnect()
  }

  const print = async (data: Uint8Array) => {
    if (!characteristic) {
      setError('Not connected to a printer')
      return
    }

    try {
      // BLE typically requires chunking large buffers
      const CHUNK_SIZE = 100
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE)
        // writeValueWithoutResponse is generally faster for printers
        if (characteristic.properties.writeWithoutResponse) {
           await characteristic.writeValueWithoutResponse(chunk)
        } else {
           await characteristic.writeValue(chunk)
        }
      }
    } catch (err: any) {
      console.error('Print Error:', err)
      setError(err.message || 'Failed to print')
    }
  }

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    print
  }
}
