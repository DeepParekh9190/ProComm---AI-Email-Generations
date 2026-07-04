import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

export async function POST(req) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const eventType = event.type;

    if (eventType === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.user_id;

      if (!userId) {
        return NextResponse.json({ error: "Missing user_id in session metadata" }, { status: 400 });
      }

      const plan = session.metadata?.plan || "monthly";
      const now = new Date();
      const periodEnd = new Date((session.current_period_end || 0) * 1000);
      const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      await supabaseAdmin.from("subscriptions").upsert(
        {
          user_id: userId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          plan,
          status: "active",
          monthly_usage: 0,
          usage_reset_at: nextReset.toISOString(),
          current_period_start: new Date((session.current_period_start || 0) * 1000).toISOString(),
          current_period_end: periodEnd.toISOString(),
        },
        { onConflict: "user_id" }
      );
    } else if (eventType === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      const { data: subs } = await supabaseAdmin
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customerId);

      if (subs && subs.length > 0) {
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);
      }
    } else if (eventType === "customer.subscription.updated") {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const status =
        subscription.status === "active" || subscription.status === "trialing" ? "active" : subscription.status;

      await supabaseAdmin
        .from("subscriptions")
        .update({
          status,
          current_period_start: new Date((subscript.current_period_start || 0) * 1000).toISOString(),
          current_period_end: new Date((subscript.current_period_end || 0) * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_customer_id", customerId);
    } else if (eventType === "invoice.payment_failed") {
      const invoice = event.data.object;
      const customerId = invoice.customer;

      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "past_due",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_customer_id", customerId);
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("Webhook handler error:", e);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
