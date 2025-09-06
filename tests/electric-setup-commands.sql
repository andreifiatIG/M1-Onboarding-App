-- ElectricSQL PostgreSQL Setup Commands
-- Run as postgres superuser: sudo -u postgres psql ils_m1_villa_management

-- Step 1: Enable logical replication
ALTER SYSTEM SET wal_level = logical;
ALTER SYSTEM SET max_replication_slots = 10;
ALTER SYSTEM SET max_wal_senders = 10;

-- Step 2: Create electric user with proper permissions
CREATE USER electric WITH REPLICATION LOGIN PASSWORD 'electric_password';

-- Step 3: Grant necessary permissions
GRANT CONNECT ON DATABASE ils_m1_villa_management TO electric;
GRANT USAGE ON SCHEMA public TO electric;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO electric;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO electric;

-- Grant permissions on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO electric;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO electric;

-- Step 4: Create a publication for logical replication
CREATE PUBLICATION electric_publication FOR ALL TABLES;

-- Step 5: Verify settings
SELECT name, setting FROM pg_settings WHERE name IN ('wal_level', 'max_replication_slots', 'max_wal_senders');

-- Show the electric user
SELECT usename, userepl FROM pg_user WHERE usename = 'electric';

-- Show publications
SELECT pubname FROM pg_publication WHERE pubname = 'electric_publication';

\echo 'Setup complete! Now restart PostgreSQL service.'