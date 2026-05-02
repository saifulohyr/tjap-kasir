import Image from 'next/image'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export interface ReceiptData {
  ticketNumber: string
  items: Array<{ title: string; quantity: number; price: number }>
  total: number
  cashReceived: number
  changeDue: number
  date: string
  cashierName: string
}

interface PrintReceiptProps {
  data: ReceiptData | null
}

/**
 * PrintReceipt — Hidden receipt component that becomes visible ONLY during `window.print()`.
 *
 * KEY ARCHITECTURE:
 * - This component must be mounted at the PAGE level (not inside a modal) so it persists in the DOM.
 * - Uses the `.receipt-print-area` CSS class which is shown only in @media print.
 * - All styling uses inline styles to guarantee they survive Tailwind purging / print rendering.
 */
export default function PrintReceipt({ data }: PrintReceiptProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!data || !mounted) return null

  const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

  const receiptContent = (
    <div
      className="receipt-print-area"
      style={{
        display: 'none', // hidden on screen; CSS @media print overrides this
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '10px',
        lineHeight: '1.3',
        color: '#000',
        background: '#fff',
        width: '58mm',
        padding: '2mm',
        boxSizing: 'border-box',
        margin: 0,
      }}
    >
      {/* ── Header ── */}
      <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '6px', marginBottom: '4px' }}>
        <div style={{ margin: '0 auto 4px auto' }}>
          <img
            src="/images/icontjap.jpeg"
            alt="Logo Tjap Chacoh"
            width={56}
            height={56}
            className="receipt-logo"
            style={{ objectFit: 'contain', filter: 'grayscale(100%)', display: 'inline-block' }}
          />
        </div>
        <div style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
          Tjap Chacoh
        </div>
        <div style={{ fontSize: '9px', marginTop: '2px', opacity: 0.9 }}>
          Ciguling, Gang Bima No.20C<br />
          Majenang
        </div>
      </div>

      {/* ── Transaction Info ── */}
      <div style={{ fontSize: '9px', marginBottom: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>TX ID:</span>
          <span style={{ fontWeight: 'bold' }}>{data.ticketNumber}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Waktu:</span>
          <span>{data.date}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Kasir:</span>
          <span>{data.cashierName}</span>
        </div>
      </div>

      {/* ── Items ── */}
      <div style={{ borderTop: '1px dashed #000', paddingTop: '4px', paddingBottom: '2px', marginBottom: '4px' }}>
        {data.items.map((item, idx) => (
          <div key={idx} style={{ marginBottom: '4px', wordBreak: 'break-word' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px' }}>{item.title}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginTop: '2px' }}>
              <span>{item.quantity}x @ {item.price.toLocaleString('id-ID')}</span>
              <span>{(item.quantity * item.price).toLocaleString('id-ID')}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Totals ── */}
      <div style={{ borderTop: '1px dashed #000', paddingTop: '4px', fontSize: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11px', marginTop: '2px' }}>
          <span>TOTAL</span>
          <span>{fmt(data.total)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span>TUNAI</span>
          <span>{fmt(data.cashReceived)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
          <span>KEMBALI</span>
          <span>{fmt(data.changeDue)}</span>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ borderTop: '1px dashed #000', marginTop: '8px', paddingTop: '8px', textAlign: 'center', fontSize: '9px' }}>
        <p style={{ fontWeight: 'bold', margin: '0 0 4px 0', fontSize: '10px', fontStyle: 'italic' }}>
          "Kopi yang baik adalah kopi yang dihabiskan bersama."
        </p>
        <p style={{ margin: '0 0 8px 0' }}>Terima kasih atas kunjungannya!</p>
        
        <div style={{ borderTop: '1px dotted #000', borderBottom: '1px dotted #000', padding: '6px 0', margin: '6px 0', backgroundColor: '#f9f9f9' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 2px 0', fontSize: '9px', letterSpacing: '1px' }}>📶 FREE WIFI</p>
          <p style={{ margin: '2px 0', fontSize: '10px' }}>SSID: <span style={{ fontWeight: 'bold' }}>WIFIOJI</span></p>
          <p style={{ margin: '2px 0', fontSize: '10px' }}>PASS: <span style={{ fontWeight: 'bold' }}>CACA1968</span></p>
        </div>
        
        <div style={{ marginTop: '8px', fontSize: '10px', letterSpacing: '2px' }}>
           - - - - - - - - -
        </div>
      </div>
    </div>
  )

  return createPortal(receiptContent, document.body)
}
