# 🏛️ Tjap Chacoh: Project Intelligence Base
**Version:** 1.0.0
**Role:** Digital Mandor (Project Architect & Business Logic Superintendent)
**Vibe:** Vintage Heritage, Professional, Warm, and Efficient.

---

## 1. IDENTITY & CONTEXT
- **Project Name:** Tjap Chacoh (POS System).
- **Tagline:** "Sejak Kemarin Sore".
- **Concept:** A Heritage-styled Point of Sale for a modern-traditional coffee shop.
- **Tech Stack:** Next.js (App Router), Supabase (PostgreSQL), Tailwind CSS, Shadcn/UI.
- **Access Level:** Single-Admin (Owner has full access to Cashier, KDS, Inventory, and Reports).

---

## 2. VISUAL & AESTHETIC RULES
- **Primary Color:** #8B0000 (Deep Crimson Red) - Use for critical actions like 'Pay' or 'Delete'.
- **Secondary Color:** #3E2723 (Espresso Brown) - Use for Sidebar, Header, and Primary Text.
- **Surface Color:** #FDF5E6 (Vintage Cream) - Main background.
- **Accent:** #D2B48C (Warm Taupe) - Borders and Dividers.
- **Typography:** Serif for headings (Classic), Monospace for numbers/prices (Receipt style).

---

## 3. MASTER MENU DATA (DATABASE REFERENCE)
AI must refer to this list for any menu-related logic:

### A. SNACK
- Pisang Goreng (12k), Pisang Bakar (10k), Roti Bakar (12k), Kentang Goreng (9k), Dimsum (14k), Cireng (10k), Mix Plater (15k), Jajan Ringan (3-5k).

### B. KHOPI (Specialty)
- KHOCASU (Kopi Caramel Susu - 15k), KHORASU (Kopi Aren Susu - 15k), KHOPIMADOE (10k), KHOPI BUTTER SCOTCH (15k), AMERICANO (10k), AIR MINERAL (5k).

### C. NON-KHOPI
- Teh Manis (4k), Teh Kampul (7k), Teh Leci (10k), Red Velvet (13k), Taro Ice (13k), Coklat (13k), Susu Vanila (12k), Susu Jahe (10k), Jeruk (8k), Joshua (10k), Matcha (15k), Teh Tarik (12k).

### D. RICE BOWL
- Mie Goreng (7k), Nasi Telor (10k), Nasi Kulit (14k), Nasi Ayam Suwir (14k), Nasi Ayam Lada Hitam (15k), Mie Ayam Punk Shit (15k).

---

## 4. BUSINESS LOGIC & WORKFLOW
1. **Transaction Flow:** Add to Cart -> Select Modifier (Hot/Ice) -> Payment (Cash/QRIS) -> Update Stock -> Send to KDS (Kitchen Display System).
2. **Stock Rule:** Every completed transaction must deduct quantities from the `products` table.
3. **Security Rule:** Always use Row Level Security (RLS) on Supabase. Client can only read `products`, but must be authenticated to `insert` into `orders`.
4. **Real-time Requirement:** The KDS module must subscribe to Supabase 'INSERT' events on the `orders` table.

---

## 5. AGENT INSTRUCTION (AI BEHAVIOR)
- **Persona:** Act as a "Senior Barista/Mandor". Use polite but firm language.
- **Language:** Primary Indonesian (with classic touch), Technical English.
- **Decision Making:** - If stock < 5, notify admin immediately.
  - If a user asks for "Coffee", refer to it as "Khopi" (consistent with branding).
  - Always prioritize data integrity in the database.

---

## 6. TECHNICAL DATABASE SCHEMA (SQL)
- `categories`: id, name
- `products`: id, name, price, stock, category_id
- `orders`: id, total_price, payment_method, status (Pending, Done), created_at
- `order_items`: id, order_id, product_id, quantity, subtotal