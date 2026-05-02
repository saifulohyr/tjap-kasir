import { ReceiptData } from '@/components/pos/PrintReceipt'

// ESC/POS Command Constants
const ESC = 0x1B
const GS = 0x1D
const LF = 0x0A

// Helpers
const encodeText = (text: string): Uint8Array => {
  return new TextEncoder().encode(text)
}

export const convertImageToEscPos = async (imageUrl: string, maxWidth = 384): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas 2D context not available'))

      let width = img.width
      let height = img.height
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }
      
      // Ensure width is a multiple of 8
      width = Math.floor(width / 8) * 8
      canvas.width = width
      canvas.height = height

      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)

      const imageData = ctx.getImageData(0, 0, width, height)
      const data = imageData.data

      const widthBytes = width / 8
      const command = [
        0x1D, 0x76, 0x30, 0x00, // GS v 0
        widthBytes & 0xFF, (widthBytes >> 8) & 0xFF,
        height & 0xFF, (height >> 8) & 0xFF
      ]

      const bitmap = new Uint8Array(widthBytes * height)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]
          
          // Threshold logic (tuned for the yellow/red logo)
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b
          if (luminance < 190) { // Dark enough to be black dot
            const byteIdx = (y * widthBytes) + Math.floor(x / 8)
            const bit = 7 - (x % 8)
            bitmap[byteIdx] |= (1 << bit)
          }
        }
      }

      const finalBuffer = new Uint8Array(command.length + bitmap.length)
      finalBuffer.set(command, 0)
      finalBuffer.set(bitmap, command.length)
      resolve(finalBuffer)
    }
    img.onerror = (err) => reject(err)
    img.src = imageUrl
  })
}

export const generateEscPosReceipt = (data: ReceiptData, storeName: string, address: string, imageBytes?: Uint8Array | null): Uint8Array => {
  const commands: number[] = []

  const add = (bytes: number[] | Uint8Array) => {
    if (bytes instanceof Uint8Array) {
      commands.push(...Array.from(bytes))
    } else {
      commands.push(...bytes)
    }
  }

  const addText = (text: string) => add(encodeText(text))
  const addLine = (text: string = '') => {
    addText(text)
    add([LF])
  }

  // --- ESC/POS COMMANDS ---
  // Initialize printer
  add([ESC, 0x40])

  // Center alignment
  add([ESC, 0x61, 0x01])
  
  if (imageBytes) {
    // Add image buffer
    add(imageBytes)
    addLine()
  } else {
    // Fallback to text header
    add([ESC, 0x45, 0x01])
    add([GS, 0x21, 0x11])
    addLine(storeName)
  }
  
  // Reset formatting for address
  add([ESC, 0x45, 0x00])
  add([GS, 0x21, 0x00])
  addLine(address)
  addLine()
  
  // Left alignment
  add([ESC, 0x61, 0x00])
  
  // Separator
  addLine('-'.repeat(32))
  
  // Meta details
  addLine(`TX ID:  ${data.ticketNumber}`)
  addLine(`Waktu:  ${data.date}`)
  addLine(`Kasir:   ${data.cashierName}`)
  addLine(`Pesanan: ${data.orderType.toUpperCase()}`)
  addLine('-'.repeat(32))
  
  // Items
  data.items.forEach(item => {
    addLine(`${item.title}`)
    const qtyPrice = `${item.quantity}x @ ${item.price.toLocaleString('id-ID')}`
    const totalItem = (item.quantity * item.price).toLocaleString('id-ID')
    
    // Calculate padding
    const padding = 32 - qtyPrice.length - totalItem.length
    const spaces = padding > 0 ? ' '.repeat(padding) : ' '
    addLine(`${qtyPrice}${spaces}${totalItem}`)
  })
  
  addLine('-'.repeat(32))
  
  // Totals
  add([ESC, 0x45, 0x01]) // Bold on
  
  const totalLabel = "TOTAL"
  const totalValue = `Rp ${data.total.toLocaleString('id-ID')}`
  const totalPadding = 32 - totalLabel.length - totalValue.length
  addLine(`${totalLabel}${' '.repeat(Math.max(0, totalPadding))}${totalValue}`)
  
  add([ESC, 0x45, 0x00]) // Bold off
  
  if (data.paymentMethod === 'QRIS') {
    const qrisLabel = "METODE"
    const qrisValue = "QRIS"
    const qrisPadding = 32 - qrisLabel.length - qrisValue.length
    addLine(`${qrisLabel}${' '.repeat(Math.max(0, qrisPadding))}${qrisValue}`)
  } else {
    const cashLabel = "TUNAI"
    const cashValue = `Rp ${data.cashReceived.toLocaleString('id-ID')}`
    const cashPadding = 32 - cashLabel.length - cashValue.length
    addLine(`${cashLabel}${' '.repeat(Math.max(0, cashPadding))}${cashValue}`)
    
    const changeLabel = "KEMBALI"
    const changeValue = `Rp ${data.changeDue.toLocaleString('id-ID')}`
    const changePadding = 32 - changeLabel.length - changeValue.length
    addLine(`${changeLabel}${' '.repeat(Math.max(0, changePadding))}${changeValue}`)
  }
  
  addLine('-'.repeat(32))
  
  // Center alignment for footer
  add([ESC, 0x61, 0x01])
  
  addLine('"Kopi yang baik adalah')
  addLine('kopi yang dihabiskan bersama."')
  addLine('Terima kasih atas kunjungannya!')
  addLine()
  addLine('FREE WIFI')
  addLine('SSID: WIFIOJI')
  addLine('PASS: CACA1968')
  
  // Feed paper (push out of printer)
  addLine()
  addLine()
  addLine()
  addLine()

  return new Uint8Array(commands)
}
