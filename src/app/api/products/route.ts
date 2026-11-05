import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

// GET /api/products - list all products
export async function GET() {
  try {
    const products = await sql`
      SELECT id, title, sku, category, price::numeric as price, stock, stock_status, image_url, created_at
      FROM products
      ORDER BY created_at DESC
    `
    return NextResponse.json(products)
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

// POST /api/products - create new product
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, sku, category, price, stock, stock_status, image_url } = body
    
    const [inserted] = await sql`
      INSERT INTO products (title, sku, category, price, stock, stock_status, image_url)
      VALUES (${title}, ${sku}, ${category}, ${price}, ${stock}, ${stock_status}, ${image_url || null})
      RETURNING id, title, sku, category, price::numeric as price, stock, stock_status, image_url, created_at
    `
    return NextResponse.json(inserted)
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

// PUT /api/products - update product
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, title, sku, category, price, stock, stock_status, image_url } = body

    const [updated] = await sql`
      UPDATE products
      SET title = ${title}, sku = ${sku}, category = ${category}, price = ${price}, stock = ${stock}, stock_status = ${stock_status}, image_url = ${image_url || null}
      WHERE id = ${id}
      RETURNING id, title, sku, category, price::numeric as price, stock, stock_status, image_url, created_at
    `
    return NextResponse.json(updated)
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

// DELETE /api/products?id=xxx - delete product
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    await sql`DELETE FROM products WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Database error'
    // 23503 is Postgres foreign key violation
    return NextResponse.json({ error: errorMsg, code: (err as { code?: string })?.code }, { status: 500 })
  }
}
