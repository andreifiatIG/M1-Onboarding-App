-- Grant necessary permissions to electric user for ElectricSQL
-- Run this as superuser (postgres or taif_me)

-- Grant CONNECT permission on the database
GRANT CONNECT ON DATABASE ils_m1_villa_management TO electric;

-- Grant CREATE permission on the database (needed for creating publications)
GRANT CREATE ON DATABASE ils_m1_villa_management TO electric;

-- Connect to the database to grant schema permissions
\c ils_m1_villa_management

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO electric;

-- Grant ALL privileges on all tables in public schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO electric;

-- Grant ALL privileges on all sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO electric;

-- Grant execute on all functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO electric;

-- Make electric user a replication role
ALTER USER electric REPLICATION;

-- Grant permissions for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO electric;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO electric;