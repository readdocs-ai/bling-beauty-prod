# Bling Beauty Products Ltd PayPal Checkout

The merchant account is **info@blingbeautyproducts.com**. PayPal Checkout charges GBP with free UK delivery. In PayPal mode the cart shows PayPal and new Worldpay checkout attempts are disabled. Existing Worldpay order records and callbacks remain available. The existing order switch still controls whether customers can start checkout.

## Preview setup

1. Create a Sandbox REST app in [PayPal Developer Apps & Credentials](https://developer.paypal.com/dashboard/applications/sandbox). Use a Sandbox business seller and a Sandbox personal buyer.
2. Apply `supabase/migrations/20261120120000_paypal_checkout.sql` to the test database after its existing Bling order migrations.
3. Set these values for the Vercel Preview branch and redeploy.

| Variable | Preview value |
| --- | --- |
| `BLING_CHECKOUT_PROVIDER` | `paypal` |
| `PAYPAL_ENVIRONMENT` | `sandbox` |
| `PAYPAL_CLIENT_ID` | Sandbox app client ID |
| `PAYPAL_CLIENT_SECRET` | Sandbox app secret, stored as a sensitive Vercel variable |
| `PAYPAL_MERCHANT_ID` | Sandbox business seller's merchant ID |
| `PAYPAL_CHECKOUT_ORIGIN` | The stable HTTPS Preview origin, with no trailing slash |
| `PAYPAL_WEBHOOK_ID` | ID of the webhook registered on the Sandbox app |
| `PAYPAL_PREVIEW_RETURN_SHARE_TOKEN` | For a protected Preview, the `_vercel_share` value for the test branch. Set as a sensitive Preview variable. |

For a protected Preview, the branch share token lets the buyer return to the same Preview domain after approval or cancellation. Start the test checkout on that domain so the browser keeps its checkout cookie. Register `/api/paypal/webhook` on that Preview origin for `CHECKOUT.ORDER.APPROVED` and `PAYMENT.CAPTURE.COMPLETED`. For a protected Preview, use Vercel’s Protection Bypass for Automation on the separate Sandbox project and register the endpoint with `?x-vercel-protection-bypass=…` in PayPal Sandbox. Verify that the POST reaches the application and that the genuine event passes signature verification. To test Resend delivery, enable order emails in Preview and use addresses covered by the existing test recipient allowlist.

Confirm that the basket uses the current database prices, cancellation preserves the basket, a captured payment produces one marked test order and one job per email type, and a retry or duplicate notification does not create another order. Confirm the order pause disables new checkout attempts.

## Production and Packlink

Use separate Live app credentials and the Live webhook ID with `PAYPAL_ENVIRONMENT=live`. Apply the migration before switching production checkout. The default PayPal origin is `https://www.blingbeautyproducts.com`. Verify the first paid GBP order against PayPal Activity, Supabase and confirmation email delivery.

In [PayPal Activity](https://www.paypal.com/myaccount/activities/), open a paid Bling Beauty transaction and choose **Print shipping label**. Connect PayPal Shipping powered by Packlink when prompted and confirm the sender address. Packlink imports paid PayPal transactions. The Bling order detail includes the PayPal capture reference and an Activity link. Choose the carrier and confirm parcel dimensions and weight in PayPal Shipping before buying a label.

To switch back to Worldpay, remove `BLING_CHECKOUT_PROVIDER=paypal` and deploy with the saved Worldpay settings. Keep PayPal credentials and its webhook configured while reconciling any payments started before the switch.
