require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

const STORAGE_ROOT = process.env.STORAGE_ROOT || __dirname;
const DATA_DIR = path.join(STORAGE_ROOT, 'data');
const UPLOAD_DIR = path.join(STORAGE_ROOT, 'uploads');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, '[]', 'utf8');

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

const allowedProducts = {
  "Chocolate Cake": 850,
  "Vanilla Cake": 750,
  "Strawberry Cake": 750,
  "Lemon Cake": 750,
  "Mocha Cake": 850,
  "Orange Cake": 750,
  "6 Inch Brownie": 700,
  "Assorted Brownie": 1350,
  "Regular Icing Donut": 150,
  "Exclusive Premium Donut": 300,
  "Hazelnut Moist Cake": 1700,
  "Pistachio Raspberry Cake": 4000,
  "Dubai Kunefe Cake": 1800,
  "Salted Caramel Moist Cake": 2000,
  "Red Velvet Cake": 1500,
  "Biscoff Chocolate Cake": 2100,
  "Russian Honey Cake": 4500,
  "Chocolate Indulgence Cake": 3000,
  "Chocolate Mud Cake": 1500
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.\w]/g, '');
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,10)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image uploads are allowed.'));
    cb(null, true);
  }
});

function clean(value, max = 250) {
  return String(value || '').trim().slice(0, max);
}

function readOrders() {
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
}

function makeOrderId() {
  const now = new Date();
  const y = String(now.getFullYear()).slice(-2);
  const m = String(now.getMonth()+1).padStart(2,'0');
  const d = String(now.getDate()).padStart(2,'0');
  const rnd = Math.floor(1000 + Math.random()*9000);
  return `FS-${y}${m}${d}-${rnd}`;
}



app.post('/api/checkout', upload.single('referenceImage'), (req, res) => {
  try {
    const customerName = clean(req.body.customerName, 80);
    const customerPhone = clean(req.body.customerPhone, 20);
    const requiredDate = clean(req.body.requiredDate, 20);
    const requiredTime = clean(req.body.requiredTime, 10);
    const fulfilment = clean(req.body.fulfilment, 20);
    const deliveryAddress = clean(req.body.deliveryAddress, 250);
    const cakeMessage = clean(req.body.cakeMessage, 100);
    const customInstructions = clean(req.body.customInstructions, 500);
    const payerBkashNumber = clean(req.body.payerBkashNumber, 20);
    const trxId = clean(req.body.trxId, 40).toUpperCase();
    const paidAmount = Number(req.body.paidAmount);

    if (!customerName || !customerPhone || !requiredDate || !requiredTime) {
      return res.status(400).json({ error: 'Please complete all required customer details.' });
    }
    if (!['pickup','delivery'].includes(fulfilment)) {
      return res.status(400).json({ error: 'Invalid fulfilment option.' });
    }
    if (fulfilment === 'delivery' && !deliveryAddress) {
      return res.status(400).json({ error: 'Delivery address is required.' });
    }
    if (!payerBkashNumber || !trxId || !Number.isFinite(paidAmount) || paidAmount <= 0) {
      return res.status(400).json({ error: 'Please complete all bKash payment details.' });
    }

    let incomingItems;
    try { incomingItems = JSON.parse(req.body.items || '[]'); }
    catch { return res.status(400).json({ error: 'Invalid cart data.' }); }

    if (!Array.isArray(incomingItems) || incomingItems.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty.' });
    }

    const items = [];
    let subtotal = 0;
    for (const raw of incomingItems) {
      const name = clean(raw.name, 100);
      const qty = Math.max(1, Math.min(100, Number(raw.qty) || 1));
      if (!(name in allowedProducts)) {
        return res.status(400).json({ error: `Unknown product: ${name}` });
      }
      const price = allowedProducts[name];
      subtotal += price * qty;
      items.push({ name, qty, price, detail: clean(raw.detail, 40) });
    }

    const orders = readOrders();
    const duplicate = orders.find(o => o.payment && String(o.payment.trxId || '').toUpperCase() === trxId);
    if (duplicate) {
      return res.status(409).json({ error: 'This bKash TrxID has already been submitted.' });
    }

    const orderId = makeOrderId();
    const createdAt = new Date().toISOString();
    const order = {
      orderId,
      createdAt,
      status: 'Pending confirmation',
      statusHistory: [
        { status: 'Pending confirmation', at: createdAt }
      ],
      customerName,
      customerPhone,
      requiredDate,
      requiredTime,
      fulfilment,
      deliveryAddress: fulfilment === 'delivery' ? deliveryAddress : '',
      cakeMessage,
      customInstructions,
      items,
      subtotal,
      deliveryCharge: null,
      totalConfirmed: null,
      paymentStatus: 'Awaiting verification',
      payment: {
        method: 'Manual bKash',
        receivingNumber: '01712108397',
        payerBkashNumber,
        amount: paidAmount,
        trxId,
        submittedAt: new Date().toISOString(),
        status: 'Awaiting verification'
      },
      referenceImageUrl: req.file ? `/uploads/${req.file.filename}` : null
    };

    orders.unshift(order);
    writeOrders(orders);

    res.status(201).json({
      orderId,
      subtotal,
      trxId,
      paymentStatus: order.paymentStatus
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to complete checkout.' });
  }
});

app.get('/api/admin/orders', (req, res) => {
  const configuredKey = process.env.ADMIN_KEY;
  if (!configuredKey) {
    return res.status(503).json({ error: 'ADMIN_KEY has not been configured on the server.' });
  }
  if (req.get('x-admin-key') !== configuredKey) {
    return res.status(401).json({ error: 'Incorrect admin key.' });
  }
  res.json({ orders: readOrders() });
});


// Temporary manual bKash payment confirmation.
// This is NOT an automated bKash gateway.
// The site never collects PINs, OTPs, or passwords.


const ORDER_STATUSES = [
  'Pending confirmation',
  'Received / Confirmed',
  'Preparing',
  'Ready for pickup / delivery',
  'Completed',
  'Cancelled'
];

const PAYMENT_STATUSES = [
  'Not requested',
  'Awaiting verification',
  'Verified',
  'Rejected'
];

function adminAuthorized(req) {
  const configuredKey = process.env.ADMIN_KEY;
  return configuredKey && req.get('x-admin-key') === configuredKey;
}

app.patch('/api/admin/orders/:orderId', (req, res) => {
  if (!adminAuthorized(req)) {
    return res.status(401).json({ error: 'Incorrect admin key.' });
  }

  const orderId = clean(req.params.orderId, 50);
  const nextStatus = req.body.status ? clean(req.body.status, 50) : null;
  const nextPaymentStatus = req.body.paymentStatus ? clean(req.body.paymentStatus, 50) : null;

  if (nextStatus && !ORDER_STATUSES.includes(nextStatus)) {
    return res.status(400).json({ error: 'Invalid order status.' });
  }
  if (nextPaymentStatus && !PAYMENT_STATUSES.includes(nextPaymentStatus)) {
    return res.status(400).json({ error: 'Invalid payment status.' });
  }

  const orders = readOrders();
  const order = orders.find(o => o.orderId === orderId);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const now = new Date().toISOString();

  if (nextStatus && nextStatus !== order.status) {
    order.status = nextStatus;
    if (!Array.isArray(order.statusHistory)) order.statusHistory = [];
    order.statusHistory.push({ status: nextStatus, at: now });
  }

  if (nextPaymentStatus && nextPaymentStatus !== order.paymentStatus) {
    order.paymentStatus = nextPaymentStatus;
    if (order.payment) order.payment.status = nextPaymentStatus;
    if (!Array.isArray(order.paymentHistory)) order.paymentHistory = [];
    order.paymentHistory.push({ status: nextPaymentStatus, at: now });
  }

  writeOrders(orders);
  res.json({ order });
});

app.get('/api/admin/backup', (req, res) => {
  if (!adminAuthorized(req)) {
    return res.status(401).json({ error: 'Incorrect admin key.' });
  }
  const orders = readOrders();
  res.setHeader('Content-Disposition', `attachment; filename="frost-studio-orders-${new Date().toISOString().slice(0,10)}.json"`);
  res.json({
    exportedAt: new Date().toISOString(),
    version: 1,
    orders
  });
});

app.post('/api/admin/restore', (req, res) => {
  if (!adminAuthorized(req)) {
    return res.status(401).json({ error: 'Incorrect admin key.' });
  }

  const orders = req.body && Array.isArray(req.body.orders) ? req.body.orders : null;
  if (!orders) {
    return res.status(400).json({ error: 'Invalid backup file.' });
  }

  // Basic shape validation before replacing data.
  for (const order of orders) {
    if (!order || typeof order !== 'object' || !order.orderId || !Array.isArray(order.items)) {
      return res.status(400).json({ error: 'Backup contains an invalid order.' });
    }
  }

  writeOrders(orders);
  res.json({ restored: orders.length });
});

app.get('/api/track', (req, res) => {
  const orderId = clean(req.query.orderId, 50);
  const phone = clean(req.query.phone, 30);

  if (!orderId || !phone) {
    return res.status(400).json({ error: 'Order number and phone number are required.' });
  }

  const order = readOrders().find(o => o.orderId === orderId && String(o.customerPhone || '').replace(/\D/g,'') === phone.replace(/\D/g,''));
  if (!order) {
    return res.status(404).json({ error: 'Order not found. Check the order number and phone number.' });
  }

  res.json({
    orderId: order.orderId,
    createdAt: order.createdAt,
    status: order.status,
    paymentStatus: order.paymentStatus,
    requiredDate: order.requiredDate,
    requiredTime: order.requiredTime,
    fulfilment: order.fulfilment,
    items: order.items.map(i => ({
      name: i.name,
      qty: i.qty,
      price: i.price,
      detail: i.detail
    })),
    subtotal: order.subtotal,
    statusHistory: Array.isArray(order.statusHistory) ? order.statusHistory : []
  });
});


app.use((err, _req, res, _next) => {
  console.error(err);
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Reference image must be 5 MB or smaller.' });
  }
  res.status(400).json({ error: err.message || 'Request could not be processed.' });
});

app.listen(PORT, () => {
  console.log(`Frost Studio running on http://localhost:${PORT}`);
  console.log(`Owner order dashboard: http://localhost:${PORT}/admin.html`);
});
