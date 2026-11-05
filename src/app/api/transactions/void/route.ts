import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function POST(req: Request) {
  const pool = getPool()
  const client = await pool.connect()

  try {
    const { transactionId, reason } = await req.json() as {
      transactionId: string
      reason?: string
    }

    if (!transactionId) {
      return NextResponse.json({ error: 'ID Transaksi wajib diberikan' }, { status: 400 })
    }

    await client.query('BEGIN')

    // 1. Check current transaction status
    const txnCheck = await client.query(
      `SELECT id, ticket_number, status FROM transactions WHERE id = $1 FOR UPDATE`,
      [transactionId]
    )

    if (txnCheck.rows.length === 0) {
      throw new Error('Transaksi tidak ditemukan')
    }

    const currentTxn = txnCheck.rows[0]
    if (currentTxn.status === 'Void') {
      throw new Error(`Transaksi ${currentTxn.ticket_number} sudah pernah dibatalkan (Void) sebelumnya.`)
    }

    // 2. Fetch items to restore stock
    const itemsRes = await client.query(
      `SELECT product_id, quantity, title FROM transaction_items WHERE transaction_id = $1`,
      [transactionId]
    )

    for (const item of itemsRes.rows) {
      if (item.product_id) {
        await client.query(
          `UPDATE products SET stock = stock + $1 WHERE id = $2`,
          [item.quantity, item.product_id]
        )
      }
    }

    // 3. Mark transaction as Void
    const updatedTxnRes = await client.query(
      `UPDATE transactions 
       SET status = 'Void'
       WHERE id = $1
       RETURNING id, ticket_number, status, total_amount`,
      [transactionId]
    )

    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      message: `Transaksi ${currentTxn.ticket_number} berhasil di-void dan stok telah dikembalikan.`,
      transaction: updatedTxnRes.rows[0],
      reason: reason || null
    })
  } catch (err: unknown) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // rollback error suppressed
    }
    const errorMsg = err instanceof Error ? err.message : 'Gagal membatalkan transaksi'
    return NextResponse.json({ error: errorMsg }, { status: 400 })
  } finally {
    client.release()
  }
}
