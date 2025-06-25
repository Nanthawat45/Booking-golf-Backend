import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 🔹 สร้าง Payment Intent
export const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ["card"],
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ message: "Payment failed", error: error.message });
  }
};

// 🔹 Webhook สำหรับอัปเดตสถานะการชำระเงิน
export const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ message: "Webhook signature verification failed", error: err.message });
  }

  if (event.type === "payment_intent.succeeded") {
    console.log(" Payment succeeded:", event.data.object);
  }

  res.status(200).json({ received: true });
};
