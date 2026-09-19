export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      client_memberships: {
        Row: {
          client_id: string
          ends_on: string | null
          gym_id: string
          last_payment_id: string | null
          last_plan_name: string | null
          starts_on: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          ends_on?: string | null
          gym_id: string
          last_payment_id?: string | null
          last_plan_name?: string | null
          starts_on?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          ends_on?: string | null
          gym_id?: string
          last_payment_id?: string | null
          last_plan_name?: string | null
          starts_on?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_memberships_gym_id_client_id_fkey"
            columns: ["gym_id", "client_id"]
            isOneToOne: false
            referencedRelation: "client_status_v"
            referencedColumns: ["gym_id", "id"]
          },
          {
            foreignKeyName: "client_memberships_gym_id_client_id_fkey"
            columns: ["gym_id", "client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["gym_id", "id"]
          },
          {
            foreignKeyName: "client_memberships_gym_id_last_payment_id_fkey"
            columns: ["gym_id", "last_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["gym_id", "id"]
          },
        ]
      }
      client_notices: {
        Row: {
          client_id: string
          created_at: string
          deleted_at: string | null
          ends_on: string
          gym_id: string
          id: string
          note: string | null
          notified_at: string
          notified_by: string
        }
        Insert: {
          client_id: string
          created_at?: string
          deleted_at?: string | null
          ends_on: string
          gym_id: string
          id?: string
          note?: string | null
          notified_at?: string
          notified_by?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          deleted_at?: string | null
          ends_on?: string
          gym_id?: string
          id?: string
          note?: string | null
          notified_at?: string
          notified_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_notices_gym_id_client_id_fkey"
            columns: ["gym_id", "client_id"]
            isOneToOne: false
            referencedRelation: "client_status_v"
            referencedColumns: ["gym_id", "id"]
          },
          {
            foreignKeyName: "client_notices_gym_id_client_id_fkey"
            columns: ["gym_id", "client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["gym_id", "id"]
          },
          {
            foreignKeyName: "client_notices_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notices_notified_by_fkey"
            columns: ["notified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          assigned_trainer_id: string | null
          birth_year: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender"]
          gym_id: string
          id: string
          notes: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          assigned_trainer_id?: string | null
          birth_year: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender"]
          gym_id: string
          id?: string
          notes?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          assigned_trainer_id?: string | null
          birth_year?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender"]
          gym_id?: string
          id?: string
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_gym_id_assigned_trainer_id_fkey"
            columns: ["gym_id", "assigned_trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["gym_id", "id"]
          },
          {
            foreignKeyName: "clients_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_subscriptions: {
        Row: {
          created_at: string
          gym_id: string
          paid_until: string | null
          platform_plan_id: string | null
          suspended_at: string | null
          suspended_reason: string | null
          trial_ends_at: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          gym_id: string
          paid_until?: string | null
          platform_plan_id?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          trial_ends_at: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          gym_id?: string
          paid_until?: string | null
          platform_plan_id?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          trial_ends_at?: string
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gym_subscriptions_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: true
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_subscriptions_platform_plan_id_fkey"
            columns: ["platform_plan_id"]
            isOneToOne: false
            referencedRelation: "platform_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_users: {
        Row: {
          created_at: string
          gym_id: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["staff_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gym_id: string
          id?: string
          is_active?: boolean
          role: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          gym_id?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_users_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gym_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gyms: {
        Row: {
          address: string
          created_at: string
          created_by: string | null
          expiring_threshold_days: number
          id: string
          logo_path: string | null
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          created_by?: string | null
          expiring_threshold_days?: number
          id?: string
          logo_path?: string | null
          name: string
          phone: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          created_by?: string | null
          expiring_threshold_days?: number
          id?: string
          logo_path?: string | null
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gyms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          created_at: string
          deleted_at: string | null
          duration_months: number
          gym_id: string
          id: string
          is_active: boolean
          name: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          duration_months: number
          gym_id: string
          id?: string
          is_active?: boolean
          name: string
          price: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          duration_months?: number
          gym_id?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_plans_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          discount_amount: number
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          duration_months: number
          ends_on: string
          gym_id: string
          id: string
          is_renewal: boolean
          list_price: number
          method: Database["public"]["Enums"]["payment_method"]
          note: string | null
          paid_on: string
          plan_id: string
          plan_name: string
          recorded_by: string
          seq: number
          starts_on: string
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          discount_amount?: number
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          duration_months: number
          ends_on: string
          gym_id: string
          id?: string
          is_renewal: boolean
          list_price: number
          method: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          paid_on: string
          plan_id: string
          plan_name: string
          recorded_by: string
          seq?: never
          starts_on: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          discount_amount?: number
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          duration_months?: number
          ends_on?: string
          gym_id?: string
          id?: string
          is_renewal?: boolean
          list_price?: number
          method?: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          paid_on?: string
          plan_id?: string
          plan_name?: string
          recorded_by?: string
          seq?: never
          starts_on?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_gym_id_client_id_fkey"
            columns: ["gym_id", "client_id"]
            isOneToOne: false
            referencedRelation: "client_status_v"
            referencedColumns: ["gym_id", "id"]
          },
          {
            foreignKeyName: "payments_gym_id_client_id_fkey"
            columns: ["gym_id", "client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["gym_id", "id"]
          },
          {
            foreignKeyName: "payments_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_gym_id_plan_id_fkey"
            columns: ["gym_id", "plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["gym_id", "id"]
          },
          {
            foreignKeyName: "payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          max_clients: number | null
          monthly_price: number
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_clients?: number | null
          monthly_price: number
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_clients?: number | null
          monthly_price?: number
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_platform_admin: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          is_platform_admin?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_platform_admin?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      trainers: {
        Row: {
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          gym_id: string
          id: string
          invited_at: string | null
          is_active: boolean
          notes: string | null
          phone: string
          specialization: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          gym_id: string
          id?: string
          invited_at?: string | null
          is_active?: boolean
          notes?: string | null
          phone: string
          specialization?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          gym_id?: string
          id?: string
          invited_at?: string | null
          is_active?: boolean
          notes?: string | null
          phone?: string
          specialization?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trainers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainers_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      client_status_v: {
        Row: {
          assigned_trainer_id: string | null
          birth_year: number | null
          days_left: number | null
          ends_on: string | null
          full_name: string | null
          gender: Database["public"]["Enums"]["gender"] | null
          gym_id: string | null
          id: string | null
          last_plan_name: string | null
          notice_id: string | null
          notice_note: string | null
          notified_at: string | null
          notified_by_name: string | null
          phone: string | null
          starts_on: string | null
          status: Database["public"]["Enums"]["client_membership_status"] | null
          trainer_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_gym_id_assigned_trainer_id_fkey"
            columns: ["gym_id", "assigned_trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["gym_id", "id"]
          },
          {
            foreignKeyName: "clients_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      dashboard_summary: {
        Args: { p_gym_id: string }
        Returns: {
          active_count: number
          expired_count: number
          expired_recent_count: number
          expiring_count: number
          month_new_clients: number
          month_payment_count: number
          month_renewed_clients: number
          month_revenue: number
          none_count: number
        }[]
      }
      get_my_context: {
        Args: never
        Returns: {
          access_ends_on: string
          expiring_threshold_days: number
          full_name: string
          gym_id: string
          gym_logo_path: string
          gym_name: string
          is_platform_admin: boolean
          paid_until: string
          role: Database["public"]["Enums"]["staff_role"]
          subscription_status: Database["public"]["Enums"]["gym_subscription_status"]
          today: string
          trial_ends_at: string
          user_id: string
        }[]
      }
      record_payment: {
        Args: {
          p_client_id: string
          p_discount_type?: Database["public"]["Enums"]["discount_type"]
          p_discount_value?: number
          p_method: Database["public"]["Enums"]["payment_method"]
          p_note?: string
          p_paid_on: string
          p_plan_id: string
        }
        Returns: {
          amount: number
          ends_on: string
          is_renewal: boolean
          payment_id: string
          starts_on: string
        }[]
      }
      trainer_accounts: {
        Args: { p_gym_id: string }
        Returns: {
          email_confirmed: boolean
          last_sign_in_at: string
          trainer_id: string
        }[]
      }
      void_payment: {
        Args: { p_payment_id: string; p_reason: string }
        Returns: undefined
      }
    }
    Enums: {
      client_membership_status: "active" | "expiring" | "expired" | "none"
      discount_type: "none" | "amount" | "percent"
      gender: "male" | "female"
      gym_subscription_status: "trial" | "active" | "past_due" | "suspended"
      payment_method: "cash" | "bank_transfer" | "qpay"
      staff_role: "manager" | "trainer"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
    Enums: {
      client_membership_status: ["active", "expiring", "expired", "none"],
      discount_type: ["none", "amount", "percent"],
      gender: ["male", "female"],
      gym_subscription_status: ["trial", "active", "past_due", "suspended"],
      payment_method: ["cash", "bank_transfer", "qpay"],
      staff_role: ["manager", "trainer"],
    },
  },
} as const

