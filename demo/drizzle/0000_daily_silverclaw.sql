CREATE TYPE "public"."carrier_type" AS ENUM('sea', 'air', 'road', 'rail');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'warehouse_staff');--> statement-breakpoint
CREATE TYPE "public"."shift" AS ENUM('morning', 'afternoon', 'night');--> statement-breakpoint
CREATE TYPE "public"."shipment_status" AS ENUM('pending', 'in_transit', 'delivered');--> statement-breakpoint
CREATE TABLE "admin" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"admin_level" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cargo_item" (
	"cargo_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cargo_type" varchar(100) NOT NULL,
	"weight" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carrier" (
	"carrier_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"carrier_type" "carrier_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "container" (
	"container_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"container_type" varchar(100) NOT NULL,
	"max_capacity" numeric(10, 2) NOT NULL,
	"shipment_id" uuid
);
--> statement-breakpoint
CREATE TABLE "container_cargo" (
	"cargo_id" uuid NOT NULL,
	"container_id" uuid NOT NULL,
	CONSTRAINT "container_cargo_cargo_id_container_id_pk" PRIMARY KEY("cargo_id","container_id"),
	CONSTRAINT "uq_cargo_single_container" UNIQUE("cargo_id")
);
--> statement-breakpoint
CREATE TABLE "inventory_record" (
	"cargo_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"quantity_stored" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_record_cargo_id_warehouse_id_pk" PRIMARY KEY("cargo_id","warehouse_id")
);
--> statement-breakpoint
CREATE TABLE "location" (
	"location_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_name" varchar(255) NOT NULL,
	"location_type" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manages" (
	"admin_user_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	CONSTRAINT "manages_admin_user_id_warehouse_id_pk" PRIMARY KEY("admin_user_id","warehouse_id")
);
--> statement-breakpoint
CREATE TABLE "route" (
	"route_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estimated_time" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipment" (
	"shipment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_date" date NOT NULL,
	"status" "shipment_status" DEFAULT 'pending' NOT NULL,
	"carrier_id" uuid NOT NULL,
	"route_id" uuid NOT NULL,
	"origin_loc_id" uuid NOT NULL,
	"destination_loc_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role_id" "role" NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "warehouse" (
	"warehouse_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" varchar(500) NOT NULL,
	"capacity" integer NOT NULL,
	"location_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouse_staff" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"job_title" varchar(255) NOT NULL,
	"shift" "shift" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin" ADD CONSTRAINT "admin_user_id_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "container" ADD CONSTRAINT "container_shipment_id_shipment_shipment_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipment"("shipment_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "container_cargo" ADD CONSTRAINT "container_cargo_cargo_id_cargo_item_cargo_id_fk" FOREIGN KEY ("cargo_id") REFERENCES "public"."cargo_item"("cargo_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "container_cargo" ADD CONSTRAINT "container_cargo_container_id_container_container_id_fk" FOREIGN KEY ("container_id") REFERENCES "public"."container"("container_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_record" ADD CONSTRAINT "inventory_record_cargo_id_cargo_item_cargo_id_fk" FOREIGN KEY ("cargo_id") REFERENCES "public"."cargo_item"("cargo_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_record" ADD CONSTRAINT "inventory_record_warehouse_id_warehouse_warehouse_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouse"("warehouse_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manages" ADD CONSTRAINT "manages_admin_user_id_admin_user_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manages" ADD CONSTRAINT "manages_warehouse_id_warehouse_warehouse_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouse"("warehouse_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_carrier_id_carrier_carrier_id_fk" FOREIGN KEY ("carrier_id") REFERENCES "public"."carrier"("carrier_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_route_id_route_route_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."route"("route_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_origin_loc_id_location_location_id_fk" FOREIGN KEY ("origin_loc_id") REFERENCES "public"."location"("location_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_destination_loc_id_location_location_id_fk" FOREIGN KEY ("destination_loc_id") REFERENCES "public"."location"("location_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse" ADD CONSTRAINT "warehouse_location_id_location_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("location_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_staff" ADD CONSTRAINT "warehouse_staff_user_id_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("user_id") ON DELETE cascade ON UPDATE no action;