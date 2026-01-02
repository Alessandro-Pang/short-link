// Supabase Admin API 类型扩展
// 用于后端服务使用 Service Role Key 时的 admin API

declare module '@supabase/supabase-js' {
  interface SupabaseAuthClient {
    admin: {
      listUsers(params?: {
        page?: number;
        perPage?: number;
      }): Promise<{
        data: { users: any[] } | null;
        error: any;
      }>;

      getUserById(userId: string): Promise<{
        data: { user: any } | null;
        error: any;
      }>;

      createUser(attributes: {
        email: string;
        password?: string;
        email_confirm?: boolean;
        phone_confirm?: boolean;
        user_metadata?: Record<string, any>;
        app_metadata?: Record<string, any>;
      }): Promise<{
        data: { user: any } | null;
        error: any;
      }>;

      updateUserById(userId: string, attributes: {
        email?: string;
        password?: string;
        email_confirm?: boolean;
        phone_confirm?: boolean;
        user_metadata?: Record<string, any>;
        app_metadata?: Record<string, any>;
        ban_duration?: string;
      }): Promise<{
        data: { user: any } | null;
        error: any;
      }>;

      deleteUser(userId: string): Promise<{
        data: any;
        error: any;
      }>;
    };
  }
}

export {};
