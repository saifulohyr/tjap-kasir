import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

// GET /api/kitchen - get today's active orders
export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const transactions = await sql`
      SELECT 
        id, ticket_number, order_type, created_at, kitchen_status,
        customer_name, cashier_name, total_amount::numeric as total_amount, payment_method
      FROM transactions
      WHERE created_at >= ${today.toISOString()} AND status = 'Completed'
      ORDER BY created_at ASC
    `

    if (transactions.length === 0) {
      return NextResponse.json([])
    }

    const txIds = transactions.map(t => t.id)
    
    // Fetch items for these transactions
    const items = await sql`
      SELECT id, transaction_id, title, quantity, note, price_at_time::numeric as price_at_time
      FROM transaction_items
      WHERE transaction_id = ANY(${txIds})
    `

    // Group items by transaction_id
    const itemsByTx: Record<string, typeof items> = {}
    for (const item of items) {
      if (!itemsByTx[item.transaction_id]) itemsByTx[item.transaction_id] = []
      itemsByTx[item.transaction_id].push(item)
    }

    const result = transactions.map(t => ({
      ...t,
      transaction_items: itemsByTx[t.id] || []
    }))

    return NextResponse.json(result)
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

// PATCH /api/kitchen - update kitchen status
export async function PATCH(req: Request) {
  try {
    const { id, status } = await req.json()
    await sql`
      UPDATE transactions
      SET kitchen_status = ${status}
      WHERE id = ${id}
    `
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
