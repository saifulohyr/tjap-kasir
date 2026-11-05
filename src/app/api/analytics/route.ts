import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

// GET /api/analytics?date=YYYY-MM-DD
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get('date') || new Date().toISOString().slice(0, 10)

    const start = new Date(dateStr)
    start.setHours(0, 0, 0, 0)

    const end = new Date(dateStr)
    end.setHours(23, 59, 59, 999)

    const txns = await sql`
      SELECT id, ticket_number, total_amount::numeric as total_amount, payment_method, status, order_type, created_at
      FROM transactions
      WHERE created_at >= ${start.toISOString()} AND created_at <= ${end.toISOString()}
      ORDER BY created_at DESC
    `

    const items = await sql`
      SELECT ti.id, ti.product_id, ti.title, ti.quantity, ti.price_at_time::numeric as price_at_time, p.category
      FROM transaction_items ti
      LEFT JOIN products p ON ti.product_id = p.id
      WHERE ti.created_at >= ${start.toISOString()} AND ti.created_at <= ${end.toISOString()}
    `

    return NextResponse.json({ txns, items })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
