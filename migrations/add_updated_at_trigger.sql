-- Migration: Add updatedAt trigger function and apply to tables
-- Run this in your Supabase SQL Editor or via migration tool

-- Create the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to settings table
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to message_templates table
DROP TRIGGER IF EXISTS update_message_templates_updated_at ON message_templates;
CREATE TRIGGER update_message_templates_updated_at
    BEFORE UPDATE ON message_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed default roast templates if none exist
INSERT INTO message_templates (type, name, subject, content, variables, is_active)
SELECT 'roast', 'roast_' || row_number() OVER (), NULL, roast, '[]'::jsonb, true
FROM (VALUES
    ('Abe gadhe, DSA kar varna Swiggy pe delivery karega zindagi bhar! 🛵'),
    ('Oye nikamme! Netflix band kar, LeetCode khol! Nahi toh jobless marega! 💀'),
    ('Tere dost Google join kar rahe, tu abhi bhi Two Sum mein atka hai ullu! 😭'),
    ('DSA nahi aati? Koi baat nahi, Chai Ka Thela khol le nalayak! ☕'),
    ('Ek problem bhi solve nahi karta? Teri toh kismat hi kharab hai bhai! 🏫'),
    ('Array reverse karna nahi aata? Teri life reverse ho jayegi bekaar! 🔄'),
    ('Bro itna useless kaun hota hai? Thoda toh padhle kamina! 🙈'),
    ('Teri struggle story LinkedIn pe viral hogi... rejection ke saath! 😅'),
    ('Placement season mein tujhe dekhke HR log bhi hasenge! 🤣'),
    ('Recursion samajh nahi aata? Tu khud ek infinite loop hai bc! 🔁'),
    ('Aaj bhi kuch nahi kiya? Teri productivity toh COVID se bhi zyada khatarnak hai! 🦠'),
    ('Tere resume mein sirf WhatsApp forward karne ka experience hai kya? 📱'),
    ('DSA Dhurandhar banne aaya tha, DSA Bekaar ban gaya! 🤡')
) AS roasts(roast)
WHERE NOT EXISTS (
    SELECT 1 FROM message_templates WHERE type = 'roast'
);

-- Verify the triggers were created
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE 'update_%_updated_at';
