// 通用响应类型
export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data?: T;
}

// 用户相关类型
export interface User {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  role?: "user" | "admin";
  created_at?: string;
  updated_at?: string;
}

export interface AuthUser extends User {
  access_token?: string;
  refresh_token?: string;
}

// 短链接相关类型
export interface Link {
  id: string;
  user_id: string;
  original_url: string;
  short_code: string;
  title?: string;
  description?: string;
  tags?: string[];
  click_count: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  password?: string;
  custom_params?: Record<string, any>;
}

export interface CreateLinkPayload {
  original_url: string;
  short_code?: string;
  title?: string;
  description?: string;
  tags?: string[];
  expires_at?: string;
  password?: string;
  custom_params?: Record<string, any>;
}

export interface UpdateLinkPayload {
  original_url?: string;
  title?: string;
  description?: string;
  tags?: string[];
  is_active?: boolean;
  expires_at?: string;
  password?: string;
  custom_params?: Record<string, any>;
}

// 统计相关类型
export interface LinkStats {
  total_links: number;
  total_clicks: number;
  active_links: number;
  expired_links: number;
}

export interface ClickLog {
  id: string;
  link_id: string;
  clicked_at: string;
  ip_address?: string;
  user_agent?: string;
  referer?: string;
  country?: string;
  city?: string;
}

// 登录日志类型
export interface LoginLog {
  id: string;
  user_id: string;
  email: string;
  ip_address?: string;
  user_agent?: string;
  login_at: string;
  status: "success" | "failed";
  error_message?: string;
}

// 分页相关类型
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  order?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Supabase 相关类型
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<User, "id">>;
      };
      links: {
        Row: Link;
        Insert: Omit<Link, "id" | "created_at" | "updated_at" | "click_count">;
        Update: Partial<Omit<Link, "id">>;
      };
      click_logs: {
        Row: ClickLog;
        Insert: Omit<ClickLog, "id" | "clicked_at">;
        Update: Partial<Omit<ClickLog, "id">>;
      };
      login_logs: {
        Row: LoginLog;
        Insert: Omit<LoginLog, "id" | "login_at">;
        Update: Partial<Omit<LoginLog, "id">>;
      };
    };
  };
}

// Fastify 相关类型扩展（仅在后端使用时有效）
// declare module 'fastify' {
//   interface FastifyRequest {
//     user?: User
//   }
// }
