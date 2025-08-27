-- Migration 090: Fix migration history table to use integer format
-- This updates the supabase_migrations.schema_migrations table to match our new integer naming

BEGIN;

-- First, let's check if we need to do this update
DO $$
BEGIN
    -- Only proceed if the schema_migrations table exists
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'supabase_migrations' 
        AND table_name = 'schema_migrations'
    ) THEN
        -- Update the migration history to match our new integer format
        -- This maps the old timestamp format to the new integer format
        
        -- First batch (original timestamp-dash-UUID format)
        UPDATE supabase_migrations.schema_migrations SET version = '012' WHERE version = '20250709123849';
        UPDATE supabase_migrations.schema_migrations SET version = '013' WHERE version = '20250709134157';
        UPDATE supabase_migrations.schema_migrations SET version = '014' WHERE version = '20250709141805';
        UPDATE supabase_migrations.schema_migrations SET version = '015' WHERE version = '20250709141826';
        UPDATE supabase_migrations.schema_migrations SET version = '016' WHERE version = '20250709144306';
        UPDATE supabase_migrations.schema_migrations SET version = '017' WHERE version = '20250711094109';
        UPDATE supabase_migrations.schema_migrations SET version = '018' WHERE version = '20250711094905';
        UPDATE supabase_migrations.schema_migrations SET version = '019' WHERE version = '20250711095922';
        UPDATE supabase_migrations.schema_migrations SET version = '020' WHERE version = '20250711103134';
        UPDATE supabase_migrations.schema_migrations SET version = '021' WHERE version = '20250711105618';
        UPDATE supabase_migrations.schema_migrations SET version = '022' WHERE version = '20250711105645';
        UPDATE supabase_migrations.schema_migrations SET version = '023' WHERE version = '20250711105721';
        UPDATE supabase_migrations.schema_migrations SET version = '024' WHERE version = '20250711105737';
        UPDATE supabase_migrations.schema_migrations SET version = '025' WHERE version = '20250711110530';
        UPDATE supabase_migrations.schema_migrations SET version = '026' WHERE version = '20250711111208';
        UPDATE supabase_migrations.schema_migrations SET version = '027' WHERE version = '20250711111408';
        UPDATE supabase_migrations.schema_migrations SET version = '028' WHERE version = '20250711111435';
        UPDATE supabase_migrations.schema_migrations SET version = '029' WHERE version = '20250711111529';
        
        -- Continue with more migrations
        UPDATE supabase_migrations.schema_migrations SET version = '030' WHERE version = '20250713231804';
        UPDATE supabase_migrations.schema_migrations SET version = '031' WHERE version = '20250713234137';
        UPDATE supabase_migrations.schema_migrations SET version = '032' WHERE version = '20250713234158';
        UPDATE supabase_migrations.schema_migrations SET version = '033' WHERE version = '20250713234226';
        UPDATE supabase_migrations.schema_migrations SET version = '034' WHERE version = '20250713235417';
        UPDATE supabase_migrations.schema_migrations SET version = '035' WHERE version = '20250713235503';
        UPDATE supabase_migrations.schema_migrations SET version = '036' WHERE version = '20250713235541';
        UPDATE supabase_migrations.schema_migrations SET version = '037' WHERE version = '20250714143448';
        UPDATE supabase_migrations.schema_migrations SET version = '038' WHERE version = '20250714143538';
        UPDATE supabase_migrations.schema_migrations SET version = '039' WHERE version = '20250714143759';
        UPDATE supabase_migrations.schema_migrations SET version = '040' WHERE version = '20250714145919';
        UPDATE supabase_migrations.schema_migrations SET version = '041' WHERE version = '20250714145947';
        UPDATE supabase_migrations.schema_migrations SET version = '042' WHERE version = '20250714151927';
        UPDATE supabase_migrations.schema_migrations SET version = '043' WHERE version = '20250714151950';
        UPDATE supabase_migrations.schema_migrations SET version = '044' WHERE version = '20250714152250';
        UPDATE supabase_migrations.schema_migrations SET version = '045' WHERE version = '20250714152519';
        UPDATE supabase_migrations.schema_migrations SET version = '046' WHERE version = '20250714152756';
        UPDATE supabase_migrations.schema_migrations SET version = '047' WHERE version = '20250714152914';
        UPDATE supabase_migrations.schema_migrations SET version = '048' WHERE version = '20250714161805';
        UPDATE supabase_migrations.schema_migrations SET version = '049' WHERE version = '20250714163131';
        UPDATE supabase_migrations.schema_migrations SET version = '050' WHERE version = '20250714164448';
        UPDATE supabase_migrations.schema_migrations SET version = '051' WHERE version = '20250714165540';
        UPDATE supabase_migrations.schema_migrations SET version = '052' WHERE version = '20250714204248';
        UPDATE supabase_migrations.schema_migrations SET version = '053' WHERE version = '20250715093227';
        UPDATE supabase_migrations.schema_migrations SET version = '054' WHERE version = '20250715093750';
        UPDATE supabase_migrations.schema_migrations SET version = '055' WHERE version = '20250715100555';
        UPDATE supabase_migrations.schema_migrations SET version = '056' WHERE version = '20250715103439';
        UPDATE supabase_migrations.schema_migrations SET version = '057' WHERE version = '20250717201424';
        UPDATE supabase_migrations.schema_migrations SET version = '058' WHERE version = '20250726012357';
        UPDATE supabase_migrations.schema_migrations SET version = '059' WHERE version = '20250728125941';
        UPDATE supabase_migrations.schema_migrations SET version = '060' WHERE version = '20250729125332';
        UPDATE supabase_migrations.schema_migrations SET version = '061' WHERE version = '20250729133606';
        UPDATE supabase_migrations.schema_migrations SET version = '062' WHERE version = '20250729133632';
        UPDATE supabase_migrations.schema_migrations SET version = '063' WHERE version = '20250729141220';
        UPDATE supabase_migrations.schema_migrations SET version = '064' WHERE version = '20250729141244';
        UPDATE supabase_migrations.schema_migrations SET version = '065' WHERE version = '20250730043026';
        UPDATE supabase_migrations.schema_migrations SET version = '066' WHERE version = '20250730043123';
        UPDATE supabase_migrations.schema_migrations SET version = '067' WHERE version = '20250730050605';
        UPDATE supabase_migrations.schema_migrations SET version = '068' WHERE version = '20250730074515';
        UPDATE supabase_migrations.schema_migrations SET version = '069' WHERE version = '20250730082014';
        UPDATE supabase_migrations.schema_migrations SET version = '070' WHERE version = '20250730095438';
        UPDATE supabase_migrations.schema_migrations SET version = '071' WHERE version = '20250730095944';
        UPDATE supabase_migrations.schema_migrations SET version = '072' WHERE version = '20250730100015';
        UPDATE supabase_migrations.schema_migrations SET version = '073' WHERE version = '20250730100234';
        UPDATE supabase_migrations.schema_migrations SET version = '074' WHERE version = '20250730101317';
        UPDATE supabase_migrations.schema_migrations SET version = '075' WHERE version = '20250730101455';
        UPDATE supabase_migrations.schema_migrations SET version = '076' WHERE version = '20250730130405';
        UPDATE supabase_migrations.schema_migrations SET version = '077' WHERE version = '20250730175632';
        UPDATE supabase_migrations.schema_migrations SET version = '078' WHERE version = '20250730175659';
        UPDATE supabase_migrations.schema_migrations SET version = '079' WHERE version = '20250730175738';
        UPDATE supabase_migrations.schema_migrations SET version = '080' WHERE version = '20250804091539';
        UPDATE supabase_migrations.schema_migrations SET version = '081' WHERE version = '20250805105932';
        UPDATE supabase_migrations.schema_migrations SET version = '082' WHERE version = '20250805110403';
        UPDATE supabase_migrations.schema_migrations SET version = '083' WHERE version = '20250805110449';
        UPDATE supabase_migrations.schema_migrations SET version = '084' WHERE version = '20250806211127';
        UPDATE supabase_migrations.schema_migrations SET version = '085' WHERE version = '20250808203036';
        UPDATE supabase_migrations.schema_migrations SET version = '086' WHERE version = '20250808224138';
        UPDATE supabase_migrations.schema_migrations SET version = '087' WHERE version = '20250810081339';
        UPDATE supabase_migrations.schema_migrations SET version = '088' WHERE version = '20250810083739';
        UPDATE supabase_migrations.schema_migrations SET version = '089' WHERE version = '20250816112424';
        
        -- Also handle the short timestamp format (without UUID)
        UPDATE supabase_migrations.schema_migrations SET version = '012' WHERE version = '20250709123849';
        UPDATE supabase_migrations.schema_migrations SET version = '013' WHERE version = '20250709134157';
        -- Continue for any short format ones
        UPDATE supabase_migrations.schema_migrations SET version = '014' WHERE version = '20250709014154';
        UPDATE supabase_migrations.schema_migrations SET version = '015' WHERE version = '20250709024304';
        UPDATE supabase_migrations.schema_migrations SET version = '016' WHERE version = '20250709123839';
        UPDATE supabase_migrations.schema_migrations SET version = '018' WHERE version = '20250711094903';
        UPDATE supabase_migrations.schema_migrations SET version = '019' WHERE version = '20250711095921';
        UPDATE supabase_migrations.schema_migrations SET version = '020' WHERE version = '20250711103132';
        UPDATE supabase_migrations.schema_migrations SET version = '024' WHERE version = '20250711105735';
        UPDATE supabase_migrations.schema_migrations SET version = '026' WHERE version = '20250711111206';
        UPDATE supabase_migrations.schema_migrations SET version = '027' WHERE version = '20250711111406';
        UPDATE supabase_migrations.schema_migrations SET version = '029' WHERE version = '20250711111527';
        UPDATE supabase_migrations.schema_migrations SET version = '030' WHERE version = '20250713111803';
        UPDATE supabase_migrations.schema_migrations SET version = '033' WHERE version = '20250713114224';
        UPDATE supabase_migrations.schema_migrations SET version = '036' WHERE version = '20250713115539';
        UPDATE supabase_migrations.schema_migrations SET version = '038' WHERE version = '20250714023536';
        UPDATE supabase_migrations.schema_migrations SET version = '039' WHERE version = '20250714023756';
        UPDATE supabase_migrations.schema_migrations SET version = '041' WHERE version = '20250714025945';
        
        RAISE NOTICE 'Migration history updated to use integer format';
    ELSE
        RAISE NOTICE 'Schema migrations table does not exist, skipping update';
    END IF;
END $$;

COMMIT;