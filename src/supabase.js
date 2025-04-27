import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://okzybmyfmajikbcstsfv.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9renlibXlmbWFqaWtiY3N0c2Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTc0NjE2MCwiZXhwIjoyMDYxMzIyMTYwfQ.HiFaCeVOF6s3v0Heo6Yb9tzKkCIz2Y9wPAf_8jecfxU'; 

export const supabase = createClient(supabaseUrl, supabaseKey);
