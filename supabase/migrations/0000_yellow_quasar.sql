CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"sku" text NOT NULL,
	"category" text NOT NULL,
	"price" numeric NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"stock_status" text NOT NULL,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "transaction_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid,
	"product_id" uuid,
	"title" text NOT NULL,
	"quantity" integer NOT NULL,
	"price_at_time" numeric NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" text NOT NULL,
	"total_amount" numeric NOT NULL,
	"payment_method" text NOT NULL,
	"status" text NOT NULL,
	"order_type" text DEFAULT 'Dine In' NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
	CONSTRAINT "transactions_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;