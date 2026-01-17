-- Grant all privileges to myclinic user
GRANT ALL PRIVILEGES ON DATABASE myclinic TO myclinic;
GRANT ALL ON SCHEMA public TO myclinic;
ALTER SCHEMA public OWNER TO myclinic;
