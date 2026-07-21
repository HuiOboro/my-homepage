import { createClient } from '@supabase/supabase-js';

// 从环境变量读取 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 初始化并导出 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey);