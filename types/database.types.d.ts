export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      expiration_options: {
        Row: {
          days: number | null
          hours: number | null
          id: number
          is_permanent: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          days?: number | null
          hours?: number | null
          id?: number
          is_permanent?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          days?: number | null
          hours?: number | null
          id?: number
          is_permanent?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      link_access_logs: {
        Row: {
          accessed_at: string
          browser: string | null
          city: string | null
          country: string | null
          device_type: string | null
          id: number
          ip_address: string | null
          link_id: number
          os: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          id?: number
          ip_address?: string | null
          link_id: number
          os?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          id?: number
          ip_address?: string | null
          link_id?: number
          os?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_access_logs_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "link_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_access_logs_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: {
          access_restrictions: Json | null
          click_count: number | null
          created_at: string
          description: string | null
          expiration_date: string | null
          forward_header_list: Json | null
          forward_headers: boolean | null
          id: number
          is_active: boolean | null
          link: string
          max_clicks: number | null
          pass_query_params: boolean | null
          password_hash: string | null
          redirect_type: number | null
          short: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_restrictions?: Json | null
          click_count?: number | null
          created_at?: string
          description?: string | null
          expiration_date?: string | null
          forward_header_list?: Json | null
          forward_headers?: boolean | null
          id?: number
          is_active?: boolean | null
          link: string
          max_clicks?: number | null
          pass_query_params?: boolean | null
          password_hash?: string | null
          redirect_type?: number | null
          short: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_restrictions?: Json | null
          click_count?: number | null
          created_at?: string
          description?: string | null
          expiration_date?: string | null
          forward_header_list?: Json | null
          forward_headers?: boolean | null
          id?: number
          is_active?: boolean | null
          link?: string
          max_clicks?: number | null
          pass_query_params?: boolean | null
          password_hash?: string | null
          redirect_type?: number | null
          short?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      links_duplicate: {
        Row: {
          access_count: number | null
          created_at: string
          expires_at: string | null
          id: number
          is_public: boolean | null
          link: string
          short: string
          user_id: number | null
        }
        Insert: {
          access_count?: number | null
          created_at?: string
          expires_at?: string | null
          id?: number
          is_public?: boolean | null
          link: string
          short: string
          user_id?: number | null
        }
        Update: {
          access_count?: number | null
          created_at?: string
          expires_at?: string | null
          id?: number
          is_public?: boolean | null
          link?: string
          short?: string
          user_id?: number | null
        }
        Relationships: []
      }
      login_logs: {
        Row: {
          created_at: string
          email: string
          failure_reason: string | null
          id: number
          ip_address: string | null
          login_at: string
          login_method: string
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          failure_reason?: string | null
          id?: number
          ip_address?: string | null
          login_at?: string
          login_method?: string
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          failure_reason?: string | null
          id?: number
          ip_address?: string | null
          login_at?: string
          login_method?: string
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_identities: {
        Row: {
          id: string
          linked_at: string
          provider: string
          provider_email: string | null
          provider_metadata: Json | null
          provider_user_id: string
          user_id: string
        }
        Insert: {
          id?: string
          linked_at?: string
          provider: string
          provider_email?: string | null
          provider_metadata?: Json | null
          provider_user_id: string
          user_id: string
        }
        Update: {
          id?: string
          linked_at?: string
          provider?: string
          provider_email?: string | null
          provider_metadata?: Json | null
          provider_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          is_admin: boolean | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          is_admin?: boolean | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_admin?: boolean | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      link_stats: {
        Row: {
          active_days: number | null
          click_count: number | null
          created_at: string | null
          id: number | null
          link: string | null
          short: string | null
          total_accesses: number | null
          unique_visitors: number | null
          user_id: string | null
        }
        Relationships: []
      }
      user_link_stats: {
        Row: {
          avg_clicks_per_link: number | null
          total_clicks: number | null
          total_links: number | null
          user_id: string | null
          weekly_new_links: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_ip_in_cidr: {
        Args: { cidr_list: Json; ip_address: string }
        Returns: boolean
      }
      clean_old_login_logs: { Args: never; Returns: undefined }
      get_top_links_by_period: {
        Args: { p_limit?: number; p_start_date?: string; p_user_id?: string }
        Returns: {
          click_count: number
          created_at: string
          id: number
          is_active: boolean
          link: string
          period_clicks: number
          short: string
          user_id: string
        }[]
      }
      get_valid_link: {
        Args: {
          short_code: string
          visitor_device?: string
          visitor_ip?: string
          visitor_referrer?: string
        }
        Returns: {
          error_message: string
          forward_header_list: Json
          forward_headers: boolean
          id: number
          is_valid: boolean
          link: string
          pass_query_params: boolean
          redirect_type: number
        }[]
      }
      sync_user_identities: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
