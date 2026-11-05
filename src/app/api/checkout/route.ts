import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

interface CartItem {
  id: string
  title: string
  quantity: number
  price: number
  note?: string | null
}

export async function POST(req: Request) {
  const pool = getPool()
  const client = await pool.connect()

  try {
    const { items, total, paymentMethod, orderType, customerName, cashierName } = await req.json() as {
      items: CartItem[]
      total: number
      paymentMethod: string
      orderType?: string
      customerName?: string | null
      cashierName?: string | null
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Keranjang belanja kosong' }, { status: 400 })
    }

    await client.query('BEGIN')

    // 1. Atomic check & deduct stock with race-condition prevention
    for (const item of items) {
      const updateRes = await client.query(
        `UPDATE products 
         SET stock = stock - $1 
         WHERE id = $2 AND stock >= $1 
         RETURNING id, stock, title`,
        [item.quantity, item.id]
      )

      if ((updateRes.rowCount ?? 0) === 0) {
        const currentRes = await client.query(
          `SELECT stock, title FROM products WHERE id = $1`,
          [item.id]
        )
        const currentStock = currentRes.rows[0]?.stock ?? 0
        const title = currentRes.rows[0]?.title ?? item.title
        throw new Error(`Stok "${title}" tidak mencukupi (sisa: ${currentStock}, diminta: ${item.quantity})`)
      }
    }

    // 2. Generate daily sequence & ticket number
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const countRes = await client.query(
      `SELECT count(*) as count FROM transactions WHERE created_at >= $1`,
      [today.toISOString()]
    )
    const dailySequence = parseInt(countRes.rows[0]?.count || '0', 10) + 1
    const ticketNumber = `TX-${Math.floor(10000 + Math.random() * 90000)}`

    // 3. Insert transaction record
    const txnRes = await client.query(
      `INSERT INTO transactions (
        ticket_number, total_amount, payment_method, status,
        order_type, customer_name, cashier_name
      ) VALUES ($1, $2, $3, 'Completed', $4, $5, $6)
      RETURNING id, ticket_number, total_amount, payment_method, status, order_type, customer_name, cashier_name, created_at`,
      [ticketNumber, total, paymentMethod, orderType || 'Dine In', customerName || null, cashierName || 'Kasir']
    )
    const txn = txnRes.rows[0]

    // 4. Insert transaction items
    for (const item of items) {
      await client.query(
        `INSERT INTO transaction_items (transaction_id, product_id, title, quantity, price_at_time, note)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [txn.id, item.id, item.title, item.quantity, item.price, item.note || null]
      )
    }

    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      transaction: txn,
      ticketNumber,
      dailySequence
    })
  } catch (err: unknown) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // rollback error suppressed
    }
    const errorMsg = err instanceof Error ? err.message : 'Database transaction failed'
    return NextResponse.json({ error: errorMsg }, { status: 400 })
  } finally {
    client.release()
  }
}
