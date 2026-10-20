-- REVIEW BEFORE APPLYING. Run in Supabase SQL Editor only after final product verification.
-- Preserve orders and historic product records; deactivate legacy catalogue instead of deleting data.
BEGIN;
UPDATE public.products SET is_active = false WHERE is_active = true;
-- Existing six rows can be updated by slug, but first confirm product contents and real inventory.
-- Do NOT activate concept/mock-up products for payment until manufactured stock and truthful photography exist.
ROLLBACK; -- intentionally dry run; change to COMMIT only after approval
