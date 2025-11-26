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
  public: {
    Tables: {
      account_applications: {
        Row: {
          application_assessment: Json | null
          application_data: Json | null
          application_type: string | null
          completed_actual: string | null
          completed_at: string | null
          created_at: string
          customer_id: string | null
          estimated_completion_time: string | null
          id: string
          reference_number: number
          status: Database["public"]["Enums"]["application_status"]
          submission_source: string | null
          updated_at: string
        }
        Insert: {
          application_assessment?: Json | null
          application_data?: Json | null
          application_type?: string | null
          completed_actual?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          estimated_completion_time?: string | null
          id?: string
          reference_number: number
          status?: Database["public"]["Enums"]["application_status"]
          submission_source?: string | null
          updated_at?: string
        }
        Update: {
          application_assessment?: Json | null
          application_data?: Json | null
          application_type?: string | null
          completed_actual?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          estimated_completion_time?: string | null
          id?: string
          reference_number?: number
          status?: Database["public"]["Enums"]["application_status"]
          submission_source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_applications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      application_assessment_history: {
        Row: {
          application_id: string
          change_type: string
          changed_by: string
          changed_by_role: Database["public"]["Enums"]["app_role"]
          comment: string | null
          created_at: string
          id: string
          new_assessment: Json | null
          previous_assessment: Json | null
        }
        Insert: {
          application_id: string
          change_type: string
          changed_by: string
          changed_by_role: Database["public"]["Enums"]["app_role"]
          comment?: string | null
          created_at?: string
          id?: string
          new_assessment?: Json | null
          previous_assessment?: Json | null
        }
        Update: {
          application_id?: string
          change_type?: string
          changed_by?: string
          changed_by_role?: Database["public"]["Enums"]["app_role"]
          comment?: string | null
          created_at?: string
          id?: string
          new_assessment?: Json | null
          previous_assessment?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "application_assessment_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "account_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_assessment_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      application_documents: {
        Row: {
          application_id: string
          created_at: string
          document_type: string
          file_path: string | null
          id: string
          is_uploaded: boolean
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          document_type: string
          file_path?: string | null
          id?: string
          is_uploaded?: boolean
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          document_type?: string
          file_path?: string | null
          id?: string
          is_uploaded?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "account_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_messages: {
        Row: {
          application_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          sender_id?: string | null
          sender_type?: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "account_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_owners: {
        Row: {
          application_id: string
          created_at: string
          id: string
          name: string
          nationality: string | null
          ownership_percentage: number | null
          passport_number: string | null
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          name: string
          nationality?: string | null
          ownership_percentage?: number | null
          passport_number?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          name?: string
          nationality?: string | null
          ownership_percentage?: number | null
          passport_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_owners_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "account_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_status_changes: {
        Row: {
          application_id: string
          changed_by: string
          changed_by_role: Database["public"]["Enums"]["app_role"]
          comment: string | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["application_status"]
          previous_status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          application_id: string
          changed_by: string
          changed_by_role: Database["public"]["Enums"]["app_role"]
          comment?: string | null
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["application_status"]
          previous_status: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          application_id?: string
          changed_by?: string
          changed_by_role?: Database["public"]["Enums"]["app_role"]
          comment?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["application_status"]
          previous_status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "application_status_changes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "account_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_status_preferences: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          status_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          status_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          status_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      arr_performance: {
        Row: {
          actual_new_arr: number
          actual_total_arr: number
          actual_upsell_arr: number
          checkins_completed: number
          churn_arr: number
          created_at: string
          deals_closed: number
          id: string
          meetings_held: number
          month: number
          new_clients_count: number
          pipeline_value: number
          proposals_sent: number
          retention_rate: number
          updated_at: string
          upsell_deals_count: number
          user_id: string
          year: number
        }
        Insert: {
          actual_new_arr?: number
          actual_total_arr?: number
          actual_upsell_arr?: number
          checkins_completed?: number
          churn_arr?: number
          created_at?: string
          deals_closed?: number
          id?: string
          meetings_held?: number
          month: number
          new_clients_count?: number
          pipeline_value?: number
          proposals_sent?: number
          retention_rate?: number
          updated_at?: string
          upsell_deals_count?: number
          user_id: string
          year: number
        }
        Update: {
          actual_new_arr?: number
          actual_total_arr?: number
          actual_upsell_arr?: number
          checkins_completed?: number
          churn_arr?: number
          created_at?: string
          deals_closed?: number
          id?: string
          meetings_held?: number
          month?: number
          new_clients_count?: number
          pipeline_value?: number
          proposals_sent?: number
          retention_rate?: number
          updated_at?: string
          upsell_deals_count?: number
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "arr_performance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      arr_targets: {
        Row: {
          created_at: string
          id: string
          month: number
          target_checkins: number
          target_closes: number
          target_meetings: number
          target_new_arr: number
          target_new_clients: number
          target_proposals: number
          target_total_arr: number
          target_upsell_arr: number
          target_upsell_deals: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: number
          target_checkins?: number
          target_closes?: number
          target_meetings?: number
          target_new_arr?: number
          target_new_clients?: number
          target_proposals?: number
          target_total_arr?: number
          target_upsell_arr?: number
          target_upsell_deals?: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: number
          target_checkins?: number
          target_closes?: number
          target_meetings?: number
          target_new_arr?: number
          target_new_clients?: number
          target_proposals?: number
          target_total_arr?: number
          target_upsell_arr?: number
          target_upsell_deals?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "arr_targets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      banks: {
        Row: {
          code: string
          country: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          processing_time_days: number | null
          updated_at: string
        }
        Insert: {
          code: string
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          processing_time_days?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          processing_time_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      bundle_products: {
        Row: {
          bundle_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          bundle_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          bundle_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_products_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "service_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
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
      completion_date_history: {
        Row: {
          application_id: string
          changed_by: string
          changed_by_role: Database["public"]["Enums"]["app_role"]
          comment: string | null
          created_at: string
          id: string
          new_date: string
          previous_date: string | null
        }
        Insert: {
          application_id: string
          changed_by: string
          changed_by_role: Database["public"]["Enums"]["app_role"]
          comment?: string | null
          created_at?: string
          id?: string
          new_date: string
          previous_date?: string | null
        }
        Update: {
          application_id?: string
          changed_by?: string
          changed_by_role?: Database["public"]["Enums"]["app_role"]
          comment?: string | null
          created_at?: string
          id?: string
          new_date?: string
          previous_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "completion_date_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "account_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_services: {
        Row: {
          arr_contribution: number
          assigned_user_id: string | null
          created_at: string
          customer_id: string
          end_date: string | null
          id: string
          next_billing_date: string | null
          service_type_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          arr_contribution?: number
          assigned_user_id?: string | null
          created_at?: string
          customer_id: string
          end_date?: string | null
          id?: string
          next_billing_date?: string | null
          service_type_id: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          arr_contribution?: number
          assigned_user_id?: string | null
          created_at?: string
          customer_id?: string
          end_date?: string | null
          id?: string
          next_billing_date?: string | null
          service_type_id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_services_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_services_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_services_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          amount: number
          annual_turnover: number | null
          any_suitable_bank: boolean | null
          company: string
          completed_actual: string | null
          completed_at: string | null
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
          preferred_bank_2: string | null
          preferred_bank_3: string | null
          product_id: string | null
          reference_number: number
          status: Database["public"]["Enums"]["customer_status"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          annual_turnover?: number | null
          any_suitable_bank?: boolean | null
          company: string
          completed_actual?: string | null
          completed_at?: string | null
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
          preferred_bank_2?: string | null
          preferred_bank_3?: string | null
          product_id?: string | null
          reference_number: number
          status?: Database["public"]["Enums"]["customer_status"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          annual_turnover?: number | null
          any_suitable_bank?: boolean | null
          company?: string
          completed_actual?: string | null
          completed_at?: string | null
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
          preferred_bank_2?: string | null
          preferred_bank_3?: string | null
          product_id?: string | null
          reference_number?: number
          status?: Database["public"]["Enums"]["customer_status"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
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
      cycles: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          name: string
          start_date: string
          status: Database["public"]["Enums"]["cycle_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          name: string
          start_date: string
          status?: Database["public"]["Enums"]["cycle_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          status?: Database["public"]["Enums"]["cycle_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cycles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          actual_close_date: string | null
          arr_value: number
          assigned_user_id: string
          created_at: string
          customer_id: string
          deal_stage: string
          deal_type: string
          expected_close_date: string | null
          id: string
          notes: string | null
          probability: number
          services: Json
          updated_at: string
        }
        Insert: {
          actual_close_date?: string | null
          arr_value?: number
          assigned_user_id: string
          created_at?: string
          customer_id: string
          deal_stage?: string
          deal_type: string
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          probability?: number
          services?: Json
          updated_at?: string
        }
        Update: {
          actual_close_date?: string | null
          arr_value?: number
          assigned_user_id?: string
          created_at?: string
          customer_id?: string
          deal_stage?: string
          deal_type?: string
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          probability?: number
          services?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
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
      domains: {
        Row: {
          created_at: string
          dns_configured: boolean
          domain_name: string
          id: string
          last_checked_at: string | null
          partner_id: string | null
          ssl_status: string
          status: string
          updated_at: string
          user_id: string | null
          verification_token: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          dns_configured?: boolean
          domain_name: string
          id?: string
          last_checked_at?: string | null
          partner_id?: string | null
          ssl_status?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          verification_token?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          dns_configured?: boolean
          domain_name?: string
          id?: string
          last_checked_at?: string | null
          partner_id?: string | null
          ssl_status?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          verification_token?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      form_configuration_versions: {
        Row: {
          change_notes: string | null
          changed_by: string | null
          config_data: Json
          created_at: string
          id: string
          product_id: string
          version_number: number
        }
        Insert: {
          change_notes?: string | null
          changed_by?: string | null
          config_data: Json
          created_at?: string
          id?: string
          product_id: string
          version_number: number
        }
        Update: {
          change_notes?: string | null
          changed_by?: string | null
          config_data?: Json
          created_at?: string
          id?: string
          product_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "form_configuration_versions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_configuration_versions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      form_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          product_id: string | null
          template_config: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          product_id?: string | null
          template_config?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          product_id?: string | null
          template_config?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_templates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
      monthly_performance: {
        Row: {
          actual_applications: number | null
          actual_completed: number | null
          actual_revenue: number | null
          completion_rate: number | null
          created_at: string
          id: string
          month: number
          user_id: string | null
          year: number
        }
        Insert: {
          actual_applications?: number | null
          actual_completed?: number | null
          actual_revenue?: number | null
          completion_rate?: number | null
          created_at?: string
          id?: string
          month: number
          user_id?: string | null
          year: number
        }
        Update: {
          actual_applications?: number | null
          actual_completed?: number | null
          actual_revenue?: number | null
          completion_rate?: number | null
          created_at?: string
          id?: string
          month?: number
          user_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_performance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_targets: {
        Row: {
          created_at: string
          id: string
          month: number
          target_applications: number | null
          target_completed: number | null
          target_revenue: number | null
          updated_at: string
          user_id: string | null
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: number
          target_applications?: number | null
          target_completed?: number | null
          target_revenue?: number | null
          updated_at?: string
          user_id?: string | null
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: number
          target_applications?: number | null
          target_completed?: number | null
          target_revenue?: number | null
          updated_at?: string
          user_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_targets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_notifications_enabled: boolean
          id: string
          notify_document_uploads: boolean
          notify_new_comments: boolean
          notify_status_updates: boolean
          notify_system_alerts: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications_enabled?: boolean
          id?: string
          notify_document_uploads?: boolean
          notify_new_comments?: boolean
          notify_status_updates?: boolean
          notify_system_alerts?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications_enabled?: boolean
          id?: string
          notify_document_uploads?: boolean
          notify_new_comments?: boolean
          notify_status_updates?: boolean
          notify_system_alerts?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_role_preferences: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          role: Database["public"]["Enums"]["app_role"]
          status_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          role: Database["public"]["Enums"]["app_role"]
          status_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          status_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      notification_user_preferences: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          status_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          status_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          status_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          customer_id: string | null
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_signup_requests: {
        Row: {
          business_description: string | null
          company_name: string | null
          created_at: string
          email: string
          email_verified: boolean
          first_name: string
          id: string
          last_name: string
          otp_code: string | null
          otp_expires_at: string | null
          partner_type: string
          phone_number: string
          role_at_company: string | null
          status: string
          updated_at: string
        }
        Insert: {
          business_description?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          email_verified?: boolean
          first_name: string
          id?: string
          last_name: string
          otp_code?: string | null
          otp_expires_at?: string | null
          partner_type?: string
          phone_number: string
          role_at_company?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          business_description?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          email_verified?: boolean
          first_name?: string
          id?: string
          last_name?: string
          otp_code?: string | null
          otp_expires_at?: string | null
          partner_type?: string
          phone_number?: string
          role_at_company?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          service_category_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          service_category_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          service_category_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_service_category_id_fkey"
            columns: ["service_category_id"]
            isOneToOne: false
            referencedRelation: "service_category"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          must_change_password: boolean | null
          name: string
          role: Database["public"]["Enums"]["app_role"]
          temporary_password_expires_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          must_change_password?: boolean | null
          name: string
          role?: Database["public"]["Enums"]["app_role"]
          temporary_password_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          must_change_password?: boolean | null
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
          temporary_password_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          github_repo: string | null
          id: string
          name: string
          owner_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          github_repo?: string | null
          id?: string
          name: string
          owner_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          github_repo?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_bundles: {
        Row: {
          bundle_description: string | null
          bundle_name: string
          created_at: string
          id: string
          is_active: boolean
          total_arr: number
          updated_at: string
        }
        Insert: {
          bundle_description?: string | null
          bundle_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          total_arr?: number
          updated_at?: string
        }
        Update: {
          bundle_description?: string | null
          bundle_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          total_arr?: number
          updated_at?: string
        }
        Relationships: []
      }
      service_category: {
        Row: {
          category_name: string
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          category_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          category_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      service_fees: {
        Row: {
          amount: number
          bundle_id: string | null
          created_at: string
          currency: string
          description: string | null
          fee_type: string
          id: string
          product_id: string | null
          service_charge: number
          updated_at: string
        }
        Insert: {
          amount?: number
          bundle_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          fee_type?: string
          id?: string
          product_id?: string | null
          service_charge?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          bundle_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          fee_type?: string
          id?: string
          product_id?: string | null
          service_charge?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_fees_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "service_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_fees_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      service_form_configurations: {
        Row: {
          created_at: string
          form_config: Json
          id: string
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          form_config?: Json
          id?: string
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          form_config?: Json
          id?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_form_configurations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      service_types: {
        Row: {
          arr_value: number
          billing_period: string
          created_at: string
          frequency: string
          id: string
          is_active: boolean
          is_recurring: boolean
          service_code: string
          service_name: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          arr_value?: number
          billing_period: string
          created_at?: string
          frequency: string
          id?: string
          is_active?: boolean
          is_recurring?: boolean
          service_code: string
          service_name: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          arr_value?: number
          billing_period?: string
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          is_recurring?: boolean
          service_code?: string
          service_name?: string
          unit_price?: number
          updated_at?: string
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
      task_attachments: {
        Row: {
          attachment_type: string
          attachment_url: string | null
          created_at: string | null
          file_name: string
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          task_id: string
          updated_at: string | null
          uploaded_by: string
          url_title: string | null
        }
        Insert: {
          attachment_type?: string
          attachment_url?: string | null
          created_at?: string | null
          file_name: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          task_id: string
          updated_at?: string | null
          uploaded_by: string
          url_title?: string | null
        }
        Update: {
          attachment_type?: string
          attachment_url?: string | null
          created_at?: string | null
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          task_id?: string
          updated_at?: string | null
          uploaded_by?: string
          url_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          architectural_component: string | null
          assigned_to: string | null
          category: string | null
          created_at: string
          created_by: string
          cycle_id: string | null
          description: string | null
          github_branch: string | null
          github_repo: string | null
          id: string
          importance: string | null
          importance_reason: string | null
          mission: string | null
          module: string | null
          parent_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          product_id: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          story: string | null
          title: string
          type: Database["public"]["Enums"]["task_type"]
          updated_at: string
        }
        Insert: {
          architectural_component?: string | null
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          created_by: string
          cycle_id?: string | null
          description?: string | null
          github_branch?: string | null
          github_repo?: string | null
          id?: string
          importance?: string | null
          importance_reason?: string | null
          mission?: string | null
          module?: string | null
          parent_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          product_id?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          story?: string | null
          title: string
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
        }
        Update: {
          architectural_component?: string | null
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          created_by?: string
          cycle_id?: string | null
          description?: string | null
          github_branch?: string | null
          github_repo?: string | null
          id?: string
          importance?: string | null
          importance_reason?: string | null
          mission?: string | null
          module?: string | null
          parent_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          product_id?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          story?: string | null
          title?: string
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_products: {
        Row: {
          assigned_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_activities: {
        Row: {
          activity_type: string
          created_at: string
          customer_id: string | null
          deal_id: string | null
          id: string
          notes: string | null
          user_id: string
          week_start_date: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          customer_id?: string | null
          deal_id?: string | null
          id?: string
          notes?: string | null
          user_id: string
          week_start_date: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          customer_id?: string | null
          deal_id?: string | null
          id?: string
          notes?: string | null
          user_id?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_activities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_annual_performance: {
        Args: { p_user_id: string; p_year: number }
        Returns: {
          actual_applications: number
          actual_completed: number
          actual_revenue: number
          completion_rate: number
        }[]
      }
      calculate_arr_performance: {
        Args: { p_month: number; p_user_id: string; p_year: number }
        Returns: {
          actual_new_arr: number
          actual_total_arr: number
          actual_upsell_arr: number
          churn_arr: number
          new_clients_count: number
          pipeline_value: number
          upsell_deals_count: number
        }[]
      }
      calculate_monthly_performance: {
        Args: { p_month: number; p_user_id: string; p_year: number }
        Returns: {
          actual_applications: number
          actual_completed: number
          actual_revenue: number
          completion_rate: number
        }[]
      }
      calculate_quarterly_performance: {
        Args: { p_quarter: number; p_user_id: string; p_year: number }
        Returns: {
          actual_applications: number
          actual_completed: number
          actual_revenue: number
          completion_rate: number
        }[]
      }
      cleanup_deleted_users: {
        Args: never
        Returns: {
          deleted_count: number
        }[]
      }
      create_anonymous_customer: {
        Args: {
          customer_any_suitable_bank?: boolean
          customer_company: string
          customer_email: string
          customer_jurisdiction?: string
          customer_license_type: string
          customer_mobile: string
          customer_name: string
          customer_notes?: string
          customer_preferred_bank?: string
          customer_preferred_bank_2?: string
          customer_preferred_bank_3?: string
        }
        Returns: string
      }
      create_product: {
        Args: {
          product_description: string
          product_is_active: boolean
          product_name: string
        }
        Returns: undefined
      }
      delete_product: { Args: { product_id: string }; Returns: undefined }
      generate_application_reference: { Args: never; Returns: number }
      generate_customer_reference: { Args: never; Returns: number }
      get_next_version_number: {
        Args: { p_product_id: string }
        Returns: number
      }
      get_or_create_arr_target: {
        Args: { p_month: number; p_user_id: string; p_year: number }
        Returns: string
      }
      get_or_create_monthly_target: {
        Args: { p_month: number; p_user_id: string; p_year: number }
        Returns: string
      }
      get_products: {
        Args: never
        Returns: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }[]
      }
      get_secure_document_url: {
        Args: { expires_in_seconds?: number; file_path: string }
        Returns: string
      }
      get_table_column_types: {
        Args: { p_table_name: string }
        Returns: {
          column_name: string
          data_type: string
        }[]
      }
      get_table_foreign_keys: {
        Args: { p_table_name: string }
        Returns: {
          column_name: string
          foreign_column_name: string
          foreign_table_name: string
        }[]
      }
      get_table_indexes: {
        Args: { p_table_name: string }
        Returns: {
          column_names: string
          index_name: string
          is_unique: boolean
        }[]
      }
      get_table_primary_keys: {
        Args: { p_table_name: string }
        Returns: {
          column_name: string
        }[]
      }
      get_user_products: {
        Args: { user_uuid: string }
        Returns: {
          product_description: string
          product_id: string
          product_name: string
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      log_api_access: {
        Args: {
          action_type: string
          api_key_id: string
          resource_accessed: string
        }
        Returns: undefined
      }
      log_failed_login: {
        Args: { _email: string; _reason: string }
        Returns: undefined
      }
      update_product: {
        Args: {
          product_description: string
          product_id: string
          product_is_active: boolean
          product_name: string
        }
        Returns: undefined
      }
      validate_api_key_access: {
        Args: { key_hash: string; required_permission: string }
        Returns: boolean
      }
      validate_session_security: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "manager"
      application_status:
        | "draft"
        | "submitted"
        | "returned"
        | "paid"
        | "completed"
        | "rejected"
        | "under_review"
        | "approved"
        | "need more info"
        | "predraft"
      customer_status:
        | "Draft"
        | "Submitted"
        | "Returned"
        | "Sent to Bank"
        | "Complete"
        | "Rejected"
        | "Need More Info"
        | "Paid"
        | "Ready for Bank"
        | "draft"
        | "submitted"
        | "returned"
        | "paid"
        | "completed"
        | "rejected"
        | "need more info"
        | "under_review"
        | "approved"
      cycle_status:
        | "planning"
        | "active"
        | "completed"
        | "loveable-stage"
        | "dev-stage"
        | "qa-stage"
        | "live-stage"
      document_category:
        | "mandatory"
        | "freezone"
        | "supporting"
        | "signatory"
        | "passport_docs"
        | "emirates_id_docs"
        | "bank_statement_docs"
      lead_source: "Website" | "Referral" | "Social Media" | "Other"
      license_type: "Mainland" | "Freezone" | "Offshore"
      project_status:
        | "planning"
        | "active"
        | "on_hold"
        | "completed"
        | "cancelled"
      task_priority: "low" | "medium" | "high" | "critical"
      task_status: "todo" | "in_progress" | "in_review" | "done" | "blocked"
      task_type:
        | "bug"
        | "feature"
        | "enhancement"
        | "task"
        | "system_issue"
        | "prototype"
        | "alpha"
        | "beta"
        | "mvp"
        | "loveable_link"
        | "github_version"
        | "release"
        | "deployment"
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
      app_role: ["admin", "user", "manager"],
      application_status: [
        "draft",
        "submitted",
        "returned",
        "paid",
        "completed",
        "rejected",
        "under_review",
        "approved",
        "need more info",
        "predraft",
      ],
      customer_status: [
        "Draft",
        "Submitted",
        "Returned",
        "Sent to Bank",
        "Complete",
        "Rejected",
        "Need More Info",
        "Paid",
        "Ready for Bank",
        "draft",
        "submitted",
        "returned",
        "paid",
        "completed",
        "rejected",
        "need more info",
        "under_review",
        "approved",
      ],
      cycle_status: [
        "planning",
        "active",
        "completed",
        "loveable-stage",
        "dev-stage",
        "qa-stage",
        "live-stage",
      ],
      document_category: [
        "mandatory",
        "freezone",
        "supporting",
        "signatory",
        "passport_docs",
        "emirates_id_docs",
        "bank_statement_docs",
      ],
      lead_source: ["Website", "Referral", "Social Media", "Other"],
      license_type: ["Mainland", "Freezone", "Offshore"],
      project_status: [
        "planning",
        "active",
        "on_hold",
        "completed",
        "cancelled",
      ],
      task_priority: ["low", "medium", "high", "critical"],
      task_status: ["todo", "in_progress", "in_review", "done", "blocked"],
      task_type: [
        "bug",
        "feature",
        "enhancement",
        "task",
        "system_issue",
        "prototype",
        "alpha",
        "beta",
        "mvp",
        "loveable_link",
        "github_version",
        "release",
        "deployment",
      ],
    },
  },
} as const
