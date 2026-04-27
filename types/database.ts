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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      account_deletion_attempts: {
        Row: {
          attempted_at: string
          id: string
          succeeded: boolean
          user_id: string
        }
        Insert: {
          attempted_at?: string
          id?: string
          succeeded?: boolean
          user_id: string
        }
        Update: {
          attempted_at?: string
          id?: string
          succeeded?: boolean
          user_id?: string
        }
        Relationships: []
      }
      families: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "families_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      family_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          expires_at: string
          family_id: string
          id: string
          invite_code: string
          invited_by: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          expires_at: string
          family_id: string
          id?: string
          invite_code: string
          invited_by?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          expires_at?: string
          family_id?: string
          id?: string
          invite_code?: string
          invited_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_invites_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_invites_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          family_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          family_id: string
          id?: string
          joined_at?: string
          role: string
          user_id: string
        }
        Update: {
          family_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          app_version: string | null
          category: string | null
          created_at: string | null
          description: string
          device_model: string | null
          id: string
          os_name: string | null
          os_version: string | null
          screen_name: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          category?: string | null
          created_at?: string | null
          description: string
          device_model?: string | null
          id?: string
          os_name?: string | null
          os_version?: string | null
          screen_name?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          category?: string | null
          created_at?: string | null
          description?: string
          device_model?: string | null
          id?: string
          os_name?: string | null
          os_version?: string | null
          screen_name?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      food_entries: {
        Row: {
          amount_per_meal: string | null
          brand: string
          created_at: string
          created_by: string | null
          end_date: string | null
          food_type: string | null
          id: string
          meals_per_day: number | null
          modified_by: string | null
          notes: string | null
          pet_id: string
          product_name: string | null
          reason_for_change: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          amount_per_meal?: string | null
          brand: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          food_type?: string | null
          id?: string
          meals_per_day?: number | null
          modified_by?: string | null
          notes?: string | null
          pet_id: string
          product_name?: string | null
          reason_for_change?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          amount_per_meal?: string | null
          brand?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          food_type?: string | null
          id?: string
          meals_per_day?: number | null
          modified_by?: string | null
          notes?: string | null
          pet_id?: string
          product_name?: string | null
          reason_for_change?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_entries_modified_by_fkey"
            columns: ["modified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_entries_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_doses: {
        Row: {
          created_at: string
          created_by: string | null
          given_at: string
          id: string
          medication_id: string
          notes: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          given_at?: string
          id?: string
          medication_id: string
          notes?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          given_at?: string
          id?: string
          medication_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medication_doses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_doses_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          dosage: string | null
          end_date: string | null
          frequency: string | null
          id: string
          is_archived: boolean
          modified_by: string | null
          name: string
          notes: string | null
          pet_id: string
          prescribing_vet: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          is_archived?: boolean
          modified_by?: string | null
          name: string
          notes?: string | null
          pet_id: string
          prescribing_vet?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          is_archived?: boolean
          modified_by?: string | null
          name?: string
          notes?: string | null
          pet_id?: string
          prescribing_vet?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_modified_by_fkey"
            columns: ["modified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          id: string
          notification_type: string
          reference_id: string
          reminder_key: string
          sent_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_type: string
          reference_id: string
          reminder_key: string
          sent_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_type?: string
          reference_id?: string
          reminder_key?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_tickets: {
        Row: {
          created_at: string
          error_code: string | null
          id: string
          notification_type: string
          push_token: string
          receipt_checked_at: string | null
          reference_id: string
          status: string
          ticket_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          id?: string
          notification_type: string
          push_token: string
          receipt_checked_at?: string | null
          reference_id: string
          status: string
          ticket_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          error_code?: string | null
          id?: string
          notification_type?: string
          push_token?: string
          receipt_checked_at?: string | null
          reference_id?: string
          status?: string
          ticket_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_allergies: {
        Row: {
          allergen: string
          created_at: string
          created_by: string | null
          id: string
          modified_by: string | null
          pet_id: string
          updated_at: string
        }
        Insert: {
          allergen: string
          created_at?: string
          created_by?: string | null
          id?: string
          modified_by?: string | null
          pet_id: string
          updated_at?: string
        }
        Update: {
          allergen?: string
          created_at?: string
          created_by?: string | null
          id?: string
          modified_by?: string | null
          pet_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_allergies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_allergies_modified_by_fkey"
            columns: ["modified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_allergies_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          approximate_age_months: number | null
          breed: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          family_id: string
          id: string
          insurance_policy_number: string | null
          insurance_provider: string | null
          is_archived: boolean
          microchip_number: string | null
          name: string
          pet_type: string
          profile_photo_url: string | null
          sex: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          approximate_age_months?: number | null
          breed?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          family_id: string
          id?: string
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          is_archived?: boolean
          microchip_number?: string | null
          name: string
          pet_type: string
          profile_photo_url?: string | null
          sex?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          approximate_age_months?: number | null
          breed?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          family_id?: string
          id?: string
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          is_archived?: boolean
          microchip_number?: string | null
          name?: string
          pet_type?: string
          profile_photo_url?: string | null
          sex?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pets_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          medication_reminder_time: string
          push_tokens: Json
          reminders_enabled: boolean
          timezone: string
          vaccination_advance_days: number
          weight_unit: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          medication_reminder_time?: string
          push_tokens?: Json
          reminders_enabled?: boolean
          timezone?: string
          vaccination_advance_days?: number
          weight_unit?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          medication_reminder_time?: string
          push_tokens?: Json
          reminders_enabled?: boolean
          timezone?: string
          vaccination_advance_days?: number
          weight_unit?: string
        }
        Relationships: []
      }
      vaccination_doses: {
        Row: {
          clinic_name: string | null
          created_at: string
          created_by: string | null
          date_administered: string
          id: string
          notes: string | null
          vaccination_id: string
        }
        Insert: {
          clinic_name?: string | null
          created_at?: string
          created_by?: string | null
          date_administered: string
          id?: string
          notes?: string | null
          vaccination_id: string
        }
        Update: {
          clinic_name?: string | null
          created_at?: string
          created_by?: string | null
          date_administered?: string
          id?: string
          notes?: string | null
          vaccination_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccination_doses_vaccination_id_fkey"
            columns: ["vaccination_id"]
            isOneToOne: false
            referencedRelation: "vaccinations"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccinations: {
        Row: {
          clinic_name: string | null
          created_at: string
          created_by: string | null
          date_administered: string
          id: string
          interval_months: number | null
          modified_by: string | null
          next_due_date: string | null
          pet_id: string
          updated_at: string
          vaccine_name: string
        }
        Insert: {
          clinic_name?: string | null
          created_at?: string
          created_by?: string | null
          date_administered: string
          id?: string
          interval_months?: number | null
          modified_by?: string | null
          next_due_date?: string | null
          pet_id: string
          updated_at?: string
          vaccine_name: string
        }
        Update: {
          clinic_name?: string | null
          created_at?: string
          created_by?: string | null
          date_administered?: string
          id?: string
          interval_months?: number | null
          modified_by?: string | null
          next_due_date?: string | null
          pet_id?: string
          updated_at?: string
          vaccine_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccinations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccinations_modified_by_fkey"
            columns: ["modified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccinations_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      vet_visit_attachments: {
        Row: {
          created_at: string
          file_name: string | null
          file_type: string
          file_url: string
          id: string
          vet_visit_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_type: string
          file_url: string
          id?: string
          vet_visit_id: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_type?: string
          file_url?: string
          id?: string
          vet_visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vet_visit_attachments_vet_visit_id_fkey"
            columns: ["vet_visit_id"]
            isOneToOne: false
            referencedRelation: "vet_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      vet_visits: {
        Row: {
          clinic_name: string | null
          created_at: string
          created_by: string | null
          date: string
          id: string
          modified_by: string | null
          notes: string | null
          pet_id: string
          reason: string | null
          updated_at: string
        }
        Insert: {
          clinic_name?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          id?: string
          modified_by?: string | null
          notes?: string | null
          pet_id: string
          reason?: string | null
          updated_at?: string
        }
        Update: {
          clinic_name?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          modified_by?: string | null
          notes?: string | null
          pet_id?: string
          reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vet_visits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_visits_modified_by_fkey"
            columns: ["modified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_visits_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_entries: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          id: string
          modified_by: string | null
          note: string | null
          pet_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          id?: string
          modified_by?: string | null
          note?: string | null
          pet_id: string
          weight: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          modified_by?: string | null
          note?: string | null
          pet_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_entries_modified_by_fkey"
            columns: ["modified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_entries_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: { Args: { invite_code: string }; Returns: undefined }
      get_my_family_id: { Args: never; Returns: string }
      get_my_family_role: { Args: never; Returns: string }
      leave_family: { Args: never; Returns: undefined }
      preview_invite: { Args: { code: string }; Returns: Json }
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
  public: {
    Enums: {},
  },
} as const
