-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('STRIPE', 'RAZORPAY');

-- AlterTable
ALTER TABLE "Agency"
ADD COLUMN "billingGateway" "PaymentGateway" NOT NULL DEFAULT 'STRIPE',
ADD COLUMN "billingCustomerId" TEXT NOT NULL DEFAULT '',
ADD COLUMN "payoutGateway" "PaymentGateway" NOT NULL DEFAULT 'STRIPE',
ADD COLUMN "payoutAccountId" TEXT DEFAULT '';

-- AlterTable
ALTER TABLE "SubAccount"
ADD COLUMN "paymentGateway" "PaymentGateway" NOT NULL DEFAULT 'STRIPE',
ADD COLUMN "paymentAccountId" TEXT DEFAULT '';

-- AlterTable
ALTER TABLE "Subscription"
ADD COLUMN "paymentGateway" "PaymentGateway" NOT NULL DEFAULT 'STRIPE',
ADD COLUMN "gatewaySubscriptionId" TEXT;

-- Backfill existing Stripe-linked records into provider-neutral columns.
UPDATE "Agency"
SET
  "billingCustomerId" = COALESCE("customerId", ''),
  "payoutAccountId" = COALESCE("connectAccountId", ''),
  "billingGateway" = 'STRIPE',
  "payoutGateway" = 'STRIPE';

UPDATE "SubAccount"
SET
  "paymentAccountId" = COALESCE("connectAccountId", ''),
  "paymentGateway" = 'STRIPE';

UPDATE "Subscription"
SET
  "gatewaySubscriptionId" = "subscritiptionId",
  "paymentGateway" = 'STRIPE';

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_gatewaySubscriptionId_key"
ON "Subscription"("gatewaySubscriptionId");
