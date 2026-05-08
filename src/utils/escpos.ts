import { ReceiptData } from '@/components/pos/PrintReceipt'

// ESC/POS Command Constants
const ESC = 0x1B
const GS = 0x1D
const LF = 0x0A

// Helpers
const encodeText = (text: string): Uint8Array => {
  return new TextEncoder().encode(text)
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
  if (data.customerName) {
    addLine(`Pelanggan: ${data.customerName}`)
  }
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
