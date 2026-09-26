-- Migration 001: Add currency column to payments table
ALTER TABLE payments ADD COLUMN currency VARCHAR(3);
