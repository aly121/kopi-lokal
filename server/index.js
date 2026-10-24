import "dotenv/config";
import express from "express";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { products } from "../src/data/products.js";
import pg from "pg";
const { Pool } = pg;

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const ordersFile = path.join(dataDir, "orders.json");
const PORT = Number(process.env.PORT || 4242);
const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";

const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined }) : null;
const MIDTRANS_BASE = IS_PRODUCTION ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com";
console.log("Midtrans config:", {
  isProduction: IS_PRODUCTION,
  serverKeyLoaded: Boolean(SERVER_KEY),
  serverKeyLooksLikeSandbox: SERVER_KEY.startsWith("SB-Mid-server-")
});
app.use(express.json({ limit: "1mb" }));
let databaseReady;

function ensureDatabase() {
  if (!databaseReady) {
    databaseReady = initDatabase().catch((error) => {
      databaseReady = null;
      throw error;
    });
  }

  return databaseReady;
}

app.use(async (req, res, next) => {
  try {
    await ensureDatabase();
    next();
  } catch (error) {
    console.error("Database initialization failed:", error);
    res.status(500).json({
      error: "Database initialization failed."
    });
  }
});

async function initDatabase() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS store_orders (
      order_id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ,
      payment_status TEXT NOT NULL,
      order_status TEXT NOT NULL,
      total BIGINT NOT NULL,
      order_data JSONB NOT NULL
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS store_orders_created_at_idx
    ON store_orders (created_at DESC)
  `);

  await pool.query(`
    ALTER TABLE store_orders
    ADD COLUMN IF NOT EXISTS queue_date DATE
  `);

  await pool.query(`
    ALTER TABLE store_orders
    ADD COLUMN IF NOT EXISTS queue_number INTEGER
  `);
}


async function readOrders() {
  if (pool) {
    const result = await pool.query(`
      SELECT order_data, queue_date, queue_number
      FROM store_orders
      ORDER BY created_at DESC
    `);

    return result.rows.map((row) => ({
      ...row.order_data,
      queueDate: row.queue_date
        ? String(row.queue_date).slice(0, 10)
        : row.order_data.queueDate ?? null,
      queueNumber:
        row.queue_number ?? row.order_data.queueNumber ?? null
    }));
  }

  await fs.mkdir(dataDir, { recursive: true });

  try {
    return JSON.parse(await fs.readFile(ordersFile, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeOrders(orders) {
  if (pool) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const order of orders) {
        await client.query(`INSERT INTO store_orders (order_id, created_at, updated_at, payment_status, order_status, total, order_data)
          VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
          ON CONFLICT (order_id) DO UPDATE SET updated_at = EXCLUDED.updated_at, payment_status = EXCLUDED.payment_status,
          order_status = EXCLUDED.order_status, total = EXCLUDED.total, order_data = EXCLUDED.order_data`,
          [order.orderId, order.createdAt, order.updatedAt || null, order.paymentStatus, order.orderStatus, order.total, JSON.stringify(order)]);
      }
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
    return;
  }
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(ordersFile, JSON.stringify(orders, null, 2));
}

async function assignDailyQueue(orderId) {
  if (!pool) {
    throw new Error("Daily queue requires PostgreSQL.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Kunci transaksi untuk mencegah nomor antrean ganda.
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext($1))",
      ["kopilokal-daily-queue"]
    );

    // Ambil pesanan dan kunci barisnya.
    const result = await client.query(
      `SELECT order_id, payment_status, total, order_data,
              queue_date, queue_number
       FROM store_orders
       WHERE order_id = $1
       FOR UPDATE`,
      [orderId]
    );

    if (result.rowCount === 0) {
      throw new Error("Order not found: " + orderId);
    }

    const row = result.rows[0];

    if (row.payment_status !== "paid") {
      await client.query("COMMIT");
      return null;
    }

    // Jika nomor sudah ada, gunakan nomor yang sama.
    if (row.queue_date && row.queue_number !== null) {
      await client.query("COMMIT");
      return {
        date: row.queue_date,
        number: Number(row.queue_number)
      };
    }

    // Tanggal antrean berdasarkan zona waktu Medan/Jakarta.
    const dateResult = await client.query(
      `SELECT (NOW() AT TIME ZONE 'Asia/Jakarta')::date AS today`
    );
    const today = dateResult.rows[0].today;

    // Cari nomor terbesar untuk tanggal hari ini.
    const nextResult = await client.query(
      `SELECT COALESCE(MAX(queue_number), 0) + 1 AS next_number
       FROM store_orders
       WHERE queue_date = $1`,
      [today]
    );

    const queueNumber = Number(nextResult.rows[0].next_number);

    // Simpan nomor ke kolom database dan order_data.
    const orderData = {
      ...row.order_data,
      queueDate: today,
      queueNumber
    };

    await client.query(
      `UPDATE store_orders
       SET queue_date = $1,
           queue_number = $2,
           order_data = $3::jsonb,
           updated_at = NOW()
       WHERE order_id = $4`,
      [today, queueNumber, JSON.stringify(orderData), orderId]
    );

    await client.query("COMMIT");

    return {
      date: today,
      number: queueNumber
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a)); const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function adminOnly(req, res, next) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || expected === "change-this-admin-token") return res.status(503).json({ error: "Set a private ADMIN_TOKEN in .env before using the admin API." });
  if (!safeEqual(req.get("x-admin-token") || "", expected)) return res.status(401).json({ error: "Unauthorized" });
  next();
}

app.get("/api/health", (_req, res) => res.json({ ok: true, paymentMode: IS_PRODUCTION ? "production" : "sandbox", database: pool ? "postgresql" : "json-demo" }));

// Create an order and a dynamic QRIS payment. Prices are always recalculated on the server.

app.post("/api/orders", async (req, res) => {
  try {
    // 1. Pastikan konfigurasi Midtrans tersedia
    if (!SERVER_KEY) {
      return res.status(503).json({
        error:
          "QRIS is not configured. Add MIDTRANS_SERVER_KEY to your .env file."
      });
    }

    // 2. Validasi data pelanggan dan keranjang
    const { customer, items } = req.body || {};

    if (
      !customer?.name?.trim() ||
      !customer?.phone?.trim() ||
      !customer?.address?.trim()
    ) {
      return res.status(400).json({
        error:
          "Name, phone number, and delivery/pickup details are required."
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "Your cart is empty."
      });
    }

    // 3. Validasi produk dan jumlah pesanan
    const normalizedItems = [];

    for (const item of items) {
      const product = products.find(
        (p) => p.id === item.productId
      );

      const quantity = Number(item.quantity);
      const grind = item.grind || "whole-bean";

      if (
        !product ||
        !product.availableGrinds?.includes(grind) ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > product.stock
      ) {
        return res.status(400).json({
          error:
            "A product or quantity is invalid. Please refresh your cart."
        });
      }

      normalizedItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
        grind
      });
    }

    const total = normalizedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (!Number.isSafeInteger(total) || total < 1500) {
      return res.status(400).json({
        error: "The payment total is invalid or below the minimum QRIS amount."
      });
    }

    // 4. Buat ID pesanan unik
    const orderId = `KOPI-${Date.now()}-${crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;

    const now = new Date().toISOString();

    const order = {
      orderId,
      createdAt: now,

      customer: {
        name: String(customer.name).trim().slice(0, 100),
        phone: String(customer.phone).trim().slice(0, 40),
        address: String(customer.address).trim().slice(0, 500),
        notes: String(customer.notes || "").trim().slice(0, 500)
      },

      items: normalizedItems,
      total,

      paymentStatus: "pending",
      orderStatus: "awaiting_payment",
      paymentType: "qris",

      history: [
        {
          statusType: "payment",
          status: "pending",
          label: "Pembayaran dibuat",
          at: now
        },
        {
          statusType: "order",
          status: "awaiting_payment",
          label: "Menunggu pembayaran",
          at: now
        }
      ]
    };

    // 5. Kirim permintaan pembayaran ke Midtrans
    const auth = Buffer.from(`${SERVER_KEY}:`).toString("base64");

    const paymentResponse = await fetch(
      `${MIDTRANS_BASE}/v2/charge`,
      {
        method: "POST",

        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },

        body: JSON.stringify({
          payment_type: "qris",

          transaction_details: {
            order_id: orderId,
            gross_amount: total
          },

          item_details: normalizedItems.map((item, index) => ({
            id: `${item.productId}-${index}`,
            price: item.price,
            quantity: item.quantity,
            name: item.name.slice(0, 50)
          })),

          customer_details: {
            first_name: order.customer.name,
            phone: order.customer.phone,
            shipping_address: {
              address: order.customer.address
            }
          }
        })
      }
    );

    // 6. Baca respons sebagai teks dahulu agar JSON kosong
    // atau respons yang tidak valid tidak membuat endpoint crash.
    const responseText = await paymentResponse.text();

    let payment;

    try {
      payment = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Midtrans returned invalid JSON:", {
        httpStatus: paymentResponse.status,
        response: responseText.slice(0, 500)
      });

      return res.status(502).json({
        error:
          "Midtrans returned an invalid response. Check the backend terminal."
      });
    }

    // 7. Periksa apakah Midtrans menolak permintaan
    const midtransStatusCode = String(payment.status_code || "");

    if (
      !paymentResponse.ok ||
      (midtransStatusCode && !midtransStatusCode.startsWith("2"))
    ) {
      console.error("Midtrans create payment failed:", {
        httpStatus: paymentResponse.status,
        statusCode: payment.status_code,
        statusMessage: payment.status_message,
        errorMessages: payment.error_messages
      });

      return res.status(502).json({
        error:
          payment.status_message ||
          payment.error_messages?.join(", ") ||
          `Midtrans rejected the payment request (HTTP ${paymentResponse.status}).`
      });
    }

    // 8. Ambil informasi QRIS dari respons Midtrans
    const qrAction = (payment.actions || []).find(
      (action) => action.name === "generate-qr-code"
    );
    console.log("QR ACTION:", qrAction);

    order.midtransTransactionId =
      payment.transaction_id || null;

    order.qrUrl = qrAction?.url || null;
    order.qrString = payment.qr_string || null;

    order.midtransTransactionStatus =
      payment.transaction_status || "pending";

    // Jika Midtrans menyatakan berhasil tetapi tidak memberikan
    // data QRIS, catat detailnya agar mudah diperiksa.
    if (!order.qrUrl && !order.qrString) {
      console.error("Midtrans response contains no QRIS data:", {
        orderId,
        transactionId: payment.transaction_id || null,
        statusCode: payment.status_code,
        transactionStatus: payment.transaction_status
      });

      return res.status(502).json({
        error:
          "Midtrans did not return QRIS data. Check the backend terminal and Midtrans Sandbox configuration."
      });
    }

    // 9. Simpan pesanan menggunakan penyimpanan yang sudah ada
    const orders = await readOrders();

    orders.unshift(order);

    await writeOrders(orders);

    // 10. Kirim respons JSON ke frontend
    return res.status(201).json({
      orderId,
      total,
      qrUrl: order.qrUrl,
      qrString: order.qrString,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      mode: IS_PRODUCTION ? "production" : "sandbox"
    });
  } catch (error) {
    console.error("Error creating order:", error);

    return res.status(500).json({
      error:
        "Unexpected server error while creating the order. Check the backend terminal."
    });
  }
});

app.get("/api/orders/:orderId", async (req, res) => {
  try {
    const orders = await readOrders();
    const order = orders.find(
      (item) => item.orderId === req.params.orderId
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Periksa Midtrans hanya jika pesanan belum terkonfirmasi.
    if (
      SERVER_KEY &&
      order.paymentStatus !== "paid" &&
      order.paymentStatus !== "expired" &&
      order.paymentStatus !== "failed"
    ) {
      const auth = Buffer.from(`${SERVER_KEY}:`).toString("base64");

      const response = await fetch(
        `${MIDTRANS_BASE}/v2/${encodeURIComponent(order.orderId)}/status`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json"
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error("Midtrans status check failed:", {
          httpStatus: response.status,
          statusMessage: result.status_message
        });

        return res.status(502).json({
          error: "Could not verify payment with Midtrans."
        });
      }

      const status = String(
        result.transaction_status || ""
      ).toLowerCase();

      const fraud = String(
        result.fraud_status || ""
      ).toLowerCase();

      // Pastikan status sukses dan nominal cocok.
      if (
        Number(result.gross_amount) === Number(order.total) &&
        (
          status === "settlement" ||
          (status === "capture" && fraud === "accept")
        )
      ) {
        order.paymentStatus = "paid";

        if (order.orderStatus === "awaiting_payment") {
          order.orderStatus = "new";
        }

        order.history = [
          ...(order.history || []),
          {
            statusType: "payment",
            status: "paid",
            label: "Pembayaran dikonfirmasi melalui Midtrans",
            at: new Date().toISOString()
          }
        ];

        order.midtransTransactionStatus = status;
        order.updatedAt = new Date().toISOString();

        await writeOrders(orders);
      }
    }
    if (order.paymentStatus === "paid") {
      const queue = await assignDailyQueue(order.orderId);

      if (queue) {
        order.queueNumber = queue.number;
        order.queueDate = String(queue.date).slice(0, 10);
      }
    }

    // Hanya kirim informasi yang diperlukan pelanggan.
    
    return res.json({
      orderId: order.orderId,
      customerName:
        order.customerName ||
        order.customer?.name ||
        order.customer?.fullName ||
        "Customer",
      total: order.total,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      queueNumber: order.queueNumber ?? null,
      queueDate: order.queueDate ?? null,
      createdAt: order.createdAt ?? order.created_at ?? null,
      updatedAt: order.updatedAt || order.createdAt
    });

  } catch (error) {
    console.error("Payment status check failed:", error);

    return res.status(500).json({
      error: "Could not check order status."
    });
  }
});


// Midtrans sends payment status notifications here. Never trust the browser to mark an order paid.
app.post("/api/midtrans/notification", async (req, res) => {
  try {
    if (!SERVER_KEY) return res.status(503).send("Payment gateway is not configured");
    const { order_id: orderId, status_code: statusCode, gross_amount: grossAmount, signature_key: signature } = req.body || {};
    const expected = crypto.createHash("sha512").update(`${orderId}${statusCode}${grossAmount}${SERVER_KEY}`).digest("hex");
    if (!signature || !safeEqual(signature, expected)) return res.status(403).send("Invalid signature");
    const orders = await readOrders();
    const order = orders.find((item) => item.orderId === orderId);
    if (!order) return res.status(404).send("Order not found");
    if (Number(grossAmount) !== order.total) return res.status(400).send("Amount mismatch");
    const status = String(req.body.transaction_status || "").toLowerCase();
    const fraud = String(req.body.fraud_status || "").toLowerCase();
    if (status === "settlement" || (status === "capture" && fraud === "accept")) {
      order.paymentStatus = "paid";
      if (order.orderStatus === "awaiting_payment") order.orderStatus = "new";
      order.history = [...(order.history || []), { statusType: "payment", status: "paid", label: "Pembayaran berhasil dikonfirmasi Midtrans", at: new Date().toISOString() }];
    } else if (["expire", "cancel", "deny"].includes(status)) {
      order.paymentStatus = status === "expire" ? "expired" : "failed";
      if (order.orderStatus === "awaiting_payment") order.orderStatus = "cancelled";
      order.history = [...(order.history || []), { statusType: "payment", status: order.paymentStatus, label: status === "expire" ? "Pembayaran kedaluwarsa" : "Pembayaran dibatalkan atau ditolak", at: new Date().toISOString() }];
    }
    
    order.midtransTransactionStatus = status;
    order.updatedAt = new Date().toISOString();

    await writeOrders(orders);

    // Berikan nomor antrean jika pembayaran sudah berhasil.
    if (order.paymentStatus === "paid") {
      await assignDailyQueue(order.orderId);
    }

    res.status(200).send("OK");

  } catch (error) { console.error(error); res.status(500).send("Notification processing failed"); }
});

app.get("/api/admin/sales", adminOnly, async (_req, res) => {
  try {
    const orders = await readOrders();
    const paid = orders.filter((order) => order.paymentStatus === "paid");
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const totalRevenue = (list) => list.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const salesDays = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(startToday); day.setDate(startToday.getDate() - (6 - index));
      const next = new Date(day); next.setDate(day.getDate() + 1);
      const dayOrders = paid.filter((order) => new Date(order.createdAt) >= day && new Date(order.createdAt) < next);
      return { date: day.toISOString().slice(0, 10), label: day.toLocaleDateString("id-ID", { weekday: "short" }), revenue: totalRevenue(dayOrders), orders: dayOrders.length };
    });
    const productsSold = {};
    for (const order of paid) for (const item of order.items || []) {
      const id = item.productId || item.name;
      if (!productsSold[id]) productsSold[id] = { productId: id, name: item.name, quantity: 0, revenue: 0 };
      productsSold[id].quantity += Number(item.quantity || 0);
      productsSold[id].revenue += Number(item.price || 0) * Number(item.quantity || 0);
    }
    res.json({ totalRevenue: totalRevenue(paid), monthRevenue: totalRevenue(paid.filter((order) => new Date(order.createdAt) >= startMonth)), paidOrders: paid.length, pendingOrders: orders.filter((order) => order.paymentStatus === "pending").length, averageOrderValue: paid.length ? Math.round(totalRevenue(paid) / paid.length) : 0, salesDays, topProducts: Object.values(productsSold).sort((a, b) => b.quantity - a.quantity).slice(0, 5) });
  } catch (error) { console.error(error); res.status(500).json({ error: "Could not load sales summary" }); }
});

app.get("/api/admin/orders", adminOnly, async (_req, res) => {
  const orders = await readOrders();
  res.json(orders.map(({ orderId, createdAt, updatedAt, customer, items, total, paymentStatus, orderStatus, paymentType, history }) => ({ orderId, createdAt, updatedAt, customer, items, total, paymentStatus, orderStatus, paymentType, history: history || [] })));
});

app.patch("/api/admin/orders/:orderId", adminOnly, async (req, res) => {
  const allowed = ["new", "preparing", "ready", "completed", "cancelled"];
  if (!allowed.includes(req.body?.orderStatus)) return res.status(400).json({ error: "Invalid order status" });
  const orders = await readOrders();
  const order = orders.find((item) => item.orderId === req.params.orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.paymentStatus !== "paid" && req.body.orderStatus !== "cancelled") {
    return res.status(409).json({ error: "Only paid orders can be processed." });
  }

  const previousStatus = order.orderStatus;
  order.orderStatus = req.body.orderStatus;
  order.updatedAt = new Date().toISOString();

  if (previousStatus !== order.orderStatus) {
    const labels = {
      new: "Pesanan diterima toko",
      preparing: "Pesanan mulai dibuat",
      ready: "Pesanan siap diambil",
      completed: "Pesanan telah diambil",
      cancelled: "Pesanan dibatalkan"
    };
    order.history = [
      ...(order.history || []),
      {
        statusType: "order",
        status: order.orderStatus,
        label: labels[order.orderStatus],
        at: order.updatedAt
      }
    ];
  }

  await writeOrders(orders);
  res.json({ ok: true, orderStatus: order.orderStatus, history: order.history || [] });
});

// Sajikan frontend React dari folder hasil build.
const frontendPath = path.resolve(__dirname, "../dist");


if (!process.env.VERCEL) {
  app.use(express.static(frontendPath));

  // Fallback untuk React Router saat berjalan lokal.
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }

    res.sendFile(path.join(frontendPath, "index.html"), (error) => {
      if (error) next(error);
    });
  });
}



if (!process.env.VERCEL) {
  ensureDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log(
          `Kopi Lokal API listening at http://localhost:${PORT} (${IS_PRODUCTION ? "PRODUCTION" : "SANDBOX"}; ${pool ? "PostgreSQL" : "JSON demo storage"})`
        );
      });
    })
    .catch((error) => {
      console.error("Database initialization failed:", error);
      process.exit(1);
    });
}

export default app;

