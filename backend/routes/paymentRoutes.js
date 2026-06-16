const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const { Client, Environment, OrdersController, ApiError } = require('@paypal/paypal-server-sdk');

let paypalClient = null;
let ordersController = null;

const getPayPalClient = () => {
  if (!paypalClient) {
    const clientId = (process.env.PAYPAL_CLIENT_ID || '').trim();
    const clientSecret = (process.env.PAYPAL_CLIENT_SECRET || '').trim();
    const mode = (process.env.PAYPAL_MODE || 'sandbox').trim();

    log(`>>> PayPal Init: ID=${clientId.substring(0,5)}...${clientId.substring(clientId.length-5)}, Secret=${clientSecret.substring(0,5)}...${clientSecret.substring(clientSecret.length-5)}, Mode=${mode}`);

    if (!clientId || !clientSecret) {
      log(">>> CRITICAL: PayPal Credentials missing or empty");
    }

    paypalClient = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: clientId,
        oAuthClientSecret: clientSecret,
      },
      environment: mode === 'live' ? Environment.Production : Environment.Sandbox,
    });
  }
  return paypalClient;
};

const getOrdersController = () => {
  if (!ordersController) {
    ordersController = new OrdersController(getPayPalClient());
  }
  return ordersController;
};

// In-memory payment sessions (use Redis/DB in production)
const paymentSessions = new Map();

const logFile = 'paypal_debug.log';
const log = (msg) => {
  const time = new Date().toISOString();
  const entry = `[${time}] ${msg}\n`;
  fs.appendFileSync(logFile, entry);
  console.log(msg);
};

// PayPal: Create Order
router.post('/create-paypal-order', async (req, res) => {
  log(">>> RECEIVED REQUEST: /create-paypal-order");
  log(`>>> Request Body: ${JSON.stringify(req.body)}`);
  
  try {
    const { amount, bookingDetails } = req.body;
    
    if (!amount || !bookingDetails) {
      log(">>> Missing amount or booking details");
      return res.status(400).json({ error: "Missing amount or booking details" });
    }

    // Ensure amount is a string with 2 decimal places for PayPal
    const formattedAmount = parseFloat(amount).toFixed(2);

    const body = {
      intent: 'CAPTURE',
      purchaseUnits: [
        {
          amount: {
            currencyCode: 'INR',
            value: formattedAmount,
          },
          description: `Parking Booking for ${bookingDetails.area || 'Parking Slot'}`,
        },
      ],
    };

    log(`>>> Creating Order with amount: ${formattedAmount}`);
    
    try {
      const { result } = await getOrdersController().createOrder({ body });
      
      if (!result || !result.id) {
        throw new Error("PayPal response did not contain an order ID");
      }

      log(`>>> Order created successfully: ${result.id}`);
      
      paymentSessions.set(result.id, {
        amount: formattedAmount,
        bookingDetails,
        status: 'pending',
        createdAt: new Date()
      });

      res.json({ id: result.id });
    } catch (err) {
      if (err instanceof ApiError) {
        const errorDetail = err.result?.details?.[0]?.description || err.message;
        log(`>>> PayPal API Error: ${errorDetail}`);
        log(`>>> Full API Error: ${JSON.stringify(err.result, null, 2)}`);
        throw new Error(`PayPal SDK Error: ${errorDetail}`);
      }
      throw err;
    }
  } catch (error) {
    log(`>>> FINAL ERROR in /create-paypal-order: ${error.message}`);
    res.status(500).json({ error: error.message || 'PayPal order creation failed' });
  }
});

// PayPal: Capture Order
router.post('/capture-paypal-order', async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    log(`>>> PayPal Backend: Capturing order: ${orderId}`);

    try {
      const { result } = await getOrdersController().captureOrder({ id: orderId });
      
      if (result.status === 'COMPLETED') {
        log(`>>> PayPal Backend: Order captured successfully: ${orderId}`);
        const session = paymentSessions.get(orderId);
        if (session) {
          session.status = 'completed';
          paymentSessions.set(orderId, session);
        }
        res.json({ success: true, status: 'completed', orderId });
      } else {
        log(`>>> PayPal Backend: Order capture status not COMPLETED: ${result.status}`);
        res.status(400).json({ success: false, status: result.status });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        const errorDetail = err.result?.details?.[0]?.description || err.message;
        log(`>>> PayPal API Error (Capture): ${errorDetail}`);
        throw new Error(`PayPal SDK Error: ${errorDetail}`);
      }
      throw err;
    }
  } catch (error) {
    log(`>>> PayPal Capture Order Error: ${error.message}`);
    res.status(500).json({ error: error.message || "Internal Server Error during PayPal capture" });
  }
});

// Backward compatibility or other routes
router.post('/api/payments/initiate', (req, res) => {
  try {
    const { amount, bookingDetails } = req.body;
    const orderId = 'PAY_' + crypto.randomBytes(8).toString('hex').toUpperCase();
    paymentSessions.set(orderId, {
      amount,
      bookingDetails,
      status: 'pending',
      createdAt: new Date()
    });
    res.json({ orderId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPI: Confirm Payment
router.post('/parking/payment', async (req, res) => {
  log(">>> RECEIVED UPI PAYMENT CONFIRMATION");
  log(`>>> Request Body: ${JSON.stringify(req.body)}`);

  try {
    const { amount, paymentMethod, paymentStatus } = req.body;

    if (!amount || !paymentMethod || !paymentStatus) {
      return res.status(400).json({ error: "Missing payment details" });
    }

    // In a real app, you would verify the transaction here
    // For this implementation, we assume the user has paid as they clicked "I HAVE PAID"
    
    // You might want to update a booking record here if a bookingId was provided
    // For now, we just return success
    
    res.status(200).json({
      message: "Payment received and verified",
      transactionId: `UPI-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: "Success"
    });
  } catch (error) {
    log(`>>> UPI Payment Error: ${error.message}`);
    res.status(500).json({ error: "Internal server error during payment verification" });
  }
});

module.exports = router;
