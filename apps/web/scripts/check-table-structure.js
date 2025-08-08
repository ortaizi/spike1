#!/usr/bin/env node

/**
 * סקריפט לבדיקת מבנה הטבלה
 */

require('dotenv').config({ path: '.env.development' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableStructure() {
  try {
    console.log('🔍 בודק מבנה טבלת users...');
    
    // בדיקת מבנה הטבלה
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'users')
      .eq('table_schema', 'public')
      .order('ordinal_position');
    
    if (error) {
      console.error('❌ שגיאה בבדיקת מבנה הטבלה:', error);
      return;
    }
    
    console.log('📊 מבנה טבלת users:');
    console.log('=====================================');
    
    data.forEach(column => {
      console.log(`${column.column_name} (${column.data_type}) - ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('=====================================');
    console.log(`סה"כ עמודות: ${data.length}`);
    
    // בדיקה ספציפית לעמודות Moodle
    const moodleColumns = data.filter(col => col.column_name.toLowerCase().includes('moodle'));
    console.log('\n🔍 עמודות Moodle:');
    moodleColumns.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})`);
    });
    
  } catch (error) {
    console.error('❌ שגיאה:', error);
  }
}

checkTableStructure(); 