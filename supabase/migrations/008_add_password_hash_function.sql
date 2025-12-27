-- Add function to hash passwords using bcrypt
-- We'll use pgcrypto extension for password hashing

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to verify password
CREATE OR REPLACE FUNCTION verify_password(
  input_password TEXT,
  stored_hash TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN crypt(input_password, stored_hash) = stored_hash;
END;
$$ LANGUAGE plpgsql;

