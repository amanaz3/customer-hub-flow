export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      comments: {
        Row: {
          comment: string
          created_at: string | null
          created_by: string
          customer_id: string
          id: string
        }
        Insert: {
          comment: string
          created_at?: string | null
          created_by: string
          customer_id: string
          id?: string
        }
        Update: {
          comment?: string
          created_at?: string | null
          created_by?: string
          customer_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          amount: number
          annual_turnover: number | null
          company: string
          created_at: string | null
          customer_notes: string | null
          document_checklist_complete: boolean
          email: string
          id: string
          jurisdiction: string | null
          lead_source: Database["public"]["Enums"]["lead_source"]
          license_type: Database["public"]["Enums"]["license_type"]
          mobile: string
          name: string
          preferred_bank: string | null
          status: Database["public"]["Enums"]["customer_status"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          annual_turnover?: number | null
          company: string
          created_at?: string | null
          customer_notes?: string | null
          document_checklist_complete?: boolean
          email: string
          id?: string
          jurisdiction?: string | null
          lead_source: Database["public"]["Enums"]["lead_source"]
          license_type: Database["public"]["Enums"]["license_type"]
          mobile: string
          name: string
          preferred_bank?: string | null
          status?: Database["public"]["Enums"]["customer_status"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          annual_turnover?: number | null
          company?: string
          created_at?: string | null
          customer_notes?: string | null
          document_checklist_complete?: boolean
          email?: string
          id?: string
          jurisdiction?: string | null
          lead_source?: Database["public"]["Enums"]["lead_source"]
          license_type?: Database["public"]["Enums"]["license_type"]
          mobile?: string
          name?: string
          preferred_bank?: string | null
          status?: Database["public"]["Enums"]["customer_status"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_customers_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          created_at: string | null
          customer_id: string
          file_path: string | null
          id: string
          is_mandatory: boolean
          is_uploaded: boolean
          name: string
          requires_license_type:
            | Database["public"]["Enums"]["license_type"]
            | null
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["document_category"]
          created_at?: string | null
          customer_id: string
          file_path?: string | null
          id?: string
          is_mandatory?: boolean
          is_uploaded?: boolean
          name: string
          requires_license_type?:
            | Database["public"]["Enums"]["license_type"]
            | null
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string | null
          customer_id?: string
          file_path?: string | null
          id?: string
          is_mandatory?: boolean
          is_uploaded?: boolean
          name?: string
          requires_license_type?:
            | Database["public"]["Enums"]["license_type"]
            | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      logs: {
        Row: {
          component: string | null
          created_at: string
          id: string
          level: string
          message: string
          stack_trace: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          component?: string | null
          created_at?: string
          id?: string
          level?: string
          message: string
          stack_trace?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          component?: string | null
          created_at?: string
          id?: string
          level?: string
          message?: string
          stack_trace?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          email: string
          id: string
          is_active: boolean
          name: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          email: string
          id: string
          is_active?: boolean
          name: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      status_changes: {
        Row: {
          changed_by: string
          changed_by_role: Database["public"]["Enums"]["app_role"]
          comment: string | null
          created_at: string | null
          customer_id: string
          id: string
          new_status: Database["public"]["Enums"]["customer_status"]
          previous_status: Database["public"]["Enums"]["customer_status"]
        }
        Insert: {
          changed_by: string
          changed_by_role: Database["public"]["Enums"]["app_role"]
          comment?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          new_status: Database["public"]["Enums"]["customer_status"]
          previous_status: Database["public"]["Enums"]["customer_status"]
        }
        Update: {
          changed_by?: string
          changed_by_role?: Database["public"]["Enums"]["app_role"]
          comment?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          new_status?: Database["public"]["Enums"]["customer_status"]
          previous_status?: Database["public"]["Enums"]["customer_status"]
        }
        Relationships: [
          {
            foreignKeyName: "status_changes_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_changes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_secure_document_url: {
        Args: { file_path: string; expires_in_seconds?: number }
        Returns: string
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      customer_status:
        | "Draft"
        | "Submitted"
        | "Returned"
        | "Sent to Bank"
        | "Complete"
        | "Rejected"
        | "Need More Info"
        | "Paid"
      document_category: "mandatory" | "freezone" | "supporting" | "signatory"
      lead_source: "Website" | "Referral" | "Social Media" | "Other"
      license_type: "Mainland" | "Freezone" | "Offshore"
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
  public: {
    Enums: {
      app_role: ["admin", "user"],
      customer_status: [
        "Draft",
        "Submitted",
        "Returned",
        "Sent to Bank",
        "Complete",
        "Rejected",
        "Need More Info",
        "Paid",
      ],
      document_category: ["mandatory", "freezone", "supporting", "signatory"],
      lead_source: ["Website", "Referral", "Social Media", "Other"],
      license_type: ["Mainland", "Freezone", "Offshore"],
    },
  },
} as const
