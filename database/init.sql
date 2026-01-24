-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create table for PH Sensor 02 data
CREATE TABLE IF NOT EXISTS ph_sensor_02 (
    time TIMESTAMPTZ NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    raw_value DOUBLE PRECISION,
    topic VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable('ph_sensor_02', 'time', if_not_exists => TRUE);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ph_sensor_02_time ON ph_sensor_02 (time DESC);

-- Create table for all WWT01 sensor data
CREATE TABLE IF NOT EXISTS wwt01_data (
    time TIMESTAMPTZ NOT NULL,
    -- Lohand sensors (all FLOAT)
    ph_sensor_01 DOUBLE PRECISION,
    orp_sensor_01 DOUBLE PRECISION,
    temp_01 DOUBLE PRECISION,
    ph_sensor_02 DOUBLE PRECISION,
    orp_sensor_02 DOUBLE PRECISION,
    temp_02 DOUBLE PRECISION,
    ph_sensor_03 DOUBLE PRECISION,
    orp_sensor_03 DOUBLE PRECISION,
    temp_03 DOUBLE PRECISION,
    ph_sensor_04 DOUBLE PRECISION,
    orp_sensor_04 DOUBLE PRECISION,
    temp_04 DOUBLE PRECISION,
    ph_sensor_05 DOUBLE PRECISION,
    orp_sensor_05 DOUBLE PRECISION,
    temp_05 DOUBLE PRECISION,
    ph_sensor_06 DOUBLE PRECISION,
    orp_sensor_06 DOUBLE PRECISION,
    temp_06 DOUBLE PRECISION,
    -- Level Sensors (KM30)
    at_01_level DOUBLE PRECISION,
    sump_pump_water_level DOUBLE PRECISION,
    at_02_level DOUBLE PRECISION,
    -- Flow Meters (DOUBLE PRECISION for Float values)
    flow_meter_no4_realtime DOUBLE PRECISION,
    flow_meter_no4_forward INTEGER,
    flow_meter_no1_realtime DOUBLE PRECISION,
    flow_meter_no1_forward INTEGER,
    flow_meter_no2_realtime DOUBLE PRECISION,
    flow_meter_no2_forward INTEGER,
    flow_meter_no3_realtime DOUBLE PRECISION,
    flow_meter_no3_forward INTEGER,
    -- Power Meters MDB (DOUBLE PRECISION for Float values)
    power_mdb_01_current DOUBLE PRECISION,
    power_mdb_01_active_power DOUBLE PRECISION,
    power_mdb_01_energy INTEGER,
    power_mdb_02_current DOUBLE PRECISION,
    power_mdb_02_active_power DOUBLE PRECISION,
    power_mdb_02_energy INTEGER,
    power_mdb_03_current DOUBLE PRECISION,
    power_mdb_03_active_power DOUBLE PRECISION,
    power_mdb_03_energy INTEGER,
    -- Turbo Blowers (DOUBLE PRECISION for values with 0.1 multiplier)
    turbo_at01_output_power DOUBLE PRECISION,
    turbo_at01_motor_current DOUBLE PRECISION,
    turbo_at01_flow_rate DOUBLE PRECISION,
    turbo_at02_fab07_output_power DOUBLE PRECISION,
    turbo_at02_fab07_flow_rate DOUBLE PRECISION,
    turbo_at02_fab07_motor_current INTEGER,
    turbo_at02_fab07_running_time INTEGER,
    turbo_at02_fab08_output_power DOUBLE PRECISION,
    turbo_at02_fab08_flow_rate DOUBLE PRECISION,
    turbo_at02_fab08_motor_current INTEGER,
    turbo_at02_fab08_running_time INTEGER,
    turbo_at02_gab05_output_power DOUBLE PRECISION,
    turbo_at02_gab05_flow_rate DOUBLE PRECISION,
    turbo_at02_gab05_motor_current INTEGER,
    turbo_at02_gab05_running_time INTEGER,
    -- Metadata
    topic VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable('wwt01_data', 'time', if_not_exists => TRUE);

-- Create index
CREATE INDEX IF NOT EXISTS idx_wwt01_data_time ON wwt01_data (time DESC);

-- Create continuous aggregate for 1-minute averages
CREATE MATERIALIZED VIEW IF NOT EXISTS ph_sensor_02_1min
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 minute', time) AS bucket,
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value,
    COUNT(*) as count
FROM ph_sensor_02
GROUP BY bucket
WITH NO DATA;

-- Refresh policy for continuous aggregate
SELECT add_continuous_aggregate_policy('ph_sensor_02_1min',
    start_offset => INTERVAL '1 hour',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '1 minute',
    if_not_exists => TRUE);

-- Compression policies (compress data older than 7 days)
ALTER TABLE ph_sensor_02 SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'topic'
);

ALTER TABLE wwt01_data SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'topic'
);

SELECT add_compression_policy('ph_sensor_02', INTERVAL '7 days', if_not_exists => TRUE);
SELECT add_compression_policy('wwt01_data', INTERVAL '7 days', if_not_exists => TRUE);

-- Data retention policy (keep data for 30 days)
SELECT add_retention_policy('ph_sensor_02', INTERVAL '30 days', if_not_exists => TRUE);
SELECT add_retention_policy('wwt01_data', INTERVAL '30 days', if_not_exists => TRUE);

-- Database size monitoring and cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_data_if_needed()
RETURNS void AS $$
DECLARE
    current_db_size BIGINT;
    max_db_size BIGINT := 10 * 1024 * 1024 * 1024; -- 10GB in bytes
    size_threshold BIGINT := max_db_size * 0.9; -- 90% of max size (9GB)
    oldest_time_ph TIMESTAMPTZ;
    oldest_time_wwt TIMESTAMPTZ;
BEGIN
    -- Get current database size
    SELECT pg_database_size(current_database()) INTO current_db_size;
    
    -- Log current size
    RAISE NOTICE 'Current database size: % MB', (current_db_size / 1024 / 1024);
    
    -- If database is over 90% of max size, start deleting old data
    IF current_db_size > size_threshold THEN
        RAISE NOTICE 'Database size exceeds threshold, cleaning up old data...';
        
        -- Delete oldest 10% of data from ph_sensor_02
        SELECT time INTO oldest_time_ph FROM ph_sensor_02 
        ORDER BY time ASC 
        LIMIT 1 OFFSET (SELECT COUNT(*) * 0.1 FROM ph_sensor_02)::INTEGER;
        
        IF oldest_time_ph IS NOT NULL THEN
            DELETE FROM ph_sensor_02 WHERE time < oldest_time_ph;
            RAISE NOTICE 'Deleted ph_sensor_02 data older than %', oldest_time_ph;
        END IF;
        
        -- Delete oldest 10% of data from wwt01_data
        SELECT time INTO oldest_time_wwt FROM wwt01_data 
        ORDER BY time ASC 
        LIMIT 1 OFFSET (SELECT COUNT(*) * 0.1 FROM wwt01_data)::INTEGER;
        
        IF oldest_time_wwt IS NOT NULL THEN
            DELETE FROM wwt01_data WHERE time < oldest_time_wwt;
            RAISE NOTICE 'Deleted wwt01_data older than %', oldest_time_wwt;
        END IF;
        
        -- Vacuum to reclaim space
        VACUUM ANALYZE ph_sensor_02;
        VACUUM ANALYZE wwt01_data;
        
        RAISE NOTICE 'Cleanup completed';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job to check database size daily (using correct TimescaleDB job syntax)
SELECT add_job(
    'cleanup_old_data_if_needed',
    '1 day'::INTERVAL,
    config => '{"type":"function"}',
    if_not_exists => TRUE
);

-- Create function to get database statistics
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS TABLE (
    table_name TEXT,
    total_size TEXT,
    table_size TEXT,
    indexes_size TEXT,
    row_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::TEXT,
        pg_size_pretty(pg_total_relation_size(t.table_name::regclass)) AS total_size,
        pg_size_pretty(pg_relation_size(t.table_name::regclass)) AS table_size,
        pg_size_pretty(pg_total_relation_size(t.table_name::regclass) - pg_relation_size(t.table_name::regclass)) AS indexes_size,
        (SELECT COUNT(*) FROM pg_class WHERE relname = t.table_name) AS row_count
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name IN ('ph_sensor_02', 'wwt01_data')
    ORDER BY pg_total_relation_size(t.table_name::regclass) DESC;
END;
$$ LANGUAGE plpgsql;

