# Application Flow (Supabase + Stripe)

## 1. User Opens the Website

* User visits the application.
* Check if there is an active Supabase authentication session.

### If NOT Authenticated:

* Redirect to the Authentication Page.
* User can:

  * Sign Up
  * Log In

### If Authenticated:

* Continue to the Subscription Check.

---

## 2. Subscription Check

After successful authentication:

* Get the authenticated user's `user.id` from Supabase Auth.
* Query the `subscriptions` table.

```text
SELECT * FROM subscriptions
WHERE user_id = current_user.id;
```

### If `status = active`

* Redirect to the Main Dashboard.

### If no subscription exists or status is:

* inactive
* expired
* cancelled
* unpaid

Redirect the user to the Pricing Page.

---

## 3. Pricing Page

* Display all available plans.
* User selects a plan.
* User clicks **Subscribe**.

---

## 4. Create Stripe Checkout Session

Frontend sends a request to the backend (or Supabase Edge Function).

Request:

* user_id
* selected_plan

Backend:

* Create a Stripe Checkout Session.
* Attach:

  * Supabase User ID
  * Email
  * Selected Plan
  * Metadata

Example metadata:

```text
user_id: supabase_user_id
plan: pro
```

Return:

* Stripe Checkout URL

Frontend redirects the user to Stripe Checkout.

---

## 5. Stripe Payment

User completes payment securely on Stripe.

After payment:

* Stripe redirects to Success URL.
* Stripe also sends a Webhook to the backend.

**Never trust only the success redirect.**
The webhook is the source of truth.

---

## 6. Stripe Webhook

On receiving:

* checkout.session.completed
* customer.subscription.created
* customer.subscription.updated

Backend should:

* Verify webhook signature.
* Read metadata.
* Get:

  * user_id
  * plan
  * customer_id
  * subscription_id

Update the `subscriptions` table.

Example:

```text
user_id
stripe_customer_id
stripe_subscription_id
plan
status = active
current_period_start
current_period_end
created_at
updated_at
```

---

## 7. Payment Success

After webhook verification:

* Subscription becomes `active`.
* User is redirected to the Main Dashboard.
* Premium features are unlocked.

---

## 8. Future Login Flow

Every time the user opens the app:

```text
Check Supabase Session
        │
        ▼
Authenticated?
        │
   ┌────┴────┐
   │         │
  No        Yes
   │         │
   ▼         ▼
 Login    Query subscriptions table
                 │
          ┌──────┴────────┐
          │               │
       status=active    status!=active
          │               │
          ▼               ▼
   Main Dashboard     Pricing Page
```

# Recommended Supabase Tables

## profiles

```text
id (uuid) -> references auth.users.id
name
email
created_at
```

## subscriptions

```text
id
user_id
stripe_customer_id
stripe_subscription_id
plan
status
current_period_start
current_period_end
created_at
updated_at
```

# Security Rules

* Use Supabase Auth for authentication.
* Use Row Level Security (RLS) on all user tables.
* Never trust the frontend for payment verification.
* Always verify Stripe Webhooks before activating a subscription.
* Store only the subscription status in Supabase; Stripe remains the source of truth for billing.
* Protect all dashboard routes by checking both authentication and an active subscription.
