import Stripe from "stripe";

let _stripeInstance = null;

export function getStripe() {
  if (!_stripeInstance) {
    _stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20",
    });
  }
  return _stripeInstance;
}

export const stripe = new Proxy(
  {},
  {
    get(_, prop) {
      return getStripe()[prop];
    },
  }
);

export const PRICE_IDS = {
  monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY,
  annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL,
};
