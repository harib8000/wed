-- Wedding OS — Postgres init script
-- Creates one database per service (shared Postgres instance for dev)

CREATE DATABASE weddingos_auth;
CREATE DATABASE weddingos_users;
CREATE DATABASE weddingos_vendors;
CREATE DATABASE weddingos_bookings;
CREATE DATABASE weddingos_payments;
CREATE DATABASE weddingos_execution;
CREATE DATABASE weddingos_notifications;
CREATE DATABASE weddingos_reviews;

GRANT ALL PRIVILEGES ON DATABASE weddingos_auth TO weddingos;
GRANT ALL PRIVILEGES ON DATABASE weddingos_users TO weddingos;
GRANT ALL PRIVILEGES ON DATABASE weddingos_vendors TO weddingos;
GRANT ALL PRIVILEGES ON DATABASE weddingos_bookings TO weddingos;
GRANT ALL PRIVILEGES ON DATABASE weddingos_payments TO weddingos;
GRANT ALL PRIVILEGES ON DATABASE weddingos_execution TO weddingos;
GRANT ALL PRIVILEGES ON DATABASE weddingos_notifications TO weddingos;
GRANT ALL PRIVILEGES ON DATABASE weddingos_reviews TO weddingos;
