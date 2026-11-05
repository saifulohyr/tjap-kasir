import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

// GET /api/export?date=YYYY-MM-DD
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get('date') || new Date().toISOString().slice(0, 10)

    const start = new Date(dateStr)
    start.setHours(0, 0, 0, 0)

    const end = new Date(dateStr)
    end.setHours(23, 59, 59, 999)

    const items = await sql`
      SELECT 
        ti.id, ti.title, ti.quantity, ti.price_at_time::numeric as price_at_time, ti.created_at, ti.transaction_id,
        t.ticket_number, t.created_at as txn_created_at,
        p.category
      FROM transaction_items ti
      LEFT JOIN transactions t ON ti.transaction_id = t.id
      LEFT JOIN products p ON ti.product_id = p.id
      WHERE ti.created_at >= ${start.toISOString()} AND ti.created_at <= ${end.toISOString()}
      ORDER BY ti.created_at DESC
    `

    return NextResponse.json(items)
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
