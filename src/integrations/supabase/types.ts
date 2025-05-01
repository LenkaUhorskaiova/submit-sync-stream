export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          entity_id: string
          entity_type: string
          id: string
          new_value: string | null
          previous_value: string | null
          timestamp: string
          user_id: string
        }
        Insert: {
          action: string
          entity_id: string
          entity_type: string
          id?: string
          new_value?: string | null
          previous_value?: string | null
          timestamp?: string
          user_id: string
        }
        Update: {
          action?: string
          entity_id?: string
          entity_type?: string
          id?: string
          new_value?: string | null
          previous_value?: string | null
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      form_fields: {
        Row: {
          created_at: string
          description: string | null
          field_order: number
          form_id: string
          id: string
          label: string
          options: string[] | null
          placeholder: string | null
          required: boolean
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          field_order: number
          form_id: string
          id?: string
          label: string
          options?: string[] | null
          placeholder?: string | null
          required?: boolean
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          field_order?: number
          form_id?: string
          id?: string
          label?: string
          options?: string[] | null
          placeholder?: string | null
          required?: boolean
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_fields_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          rejected_at: string | null
          rejected_by: string | null
          slug: string
          status: string
          submission_count: number
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          rejected_at?: string | null
          rejected_by?: string | null
          slug: string
          status: string
          submission_count?: number
          title: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          rejected_at?: string | null
          rejected_by?: string | null
          slug?: string
          status?: string
          submission_count?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          form_id: string
          id: string
          rejected_at: string | null
          rejected_by: string | null
          status: string
          updated_at: string
          user_id: string | null
          values: Json
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          form_id: string
          id?: string
          rejected_at?: string | null
          rejected_by?: string | null
          status: string
          updated_at?: string
          user_id?: string | null
          values: Json
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          form_id?: string
          id?: string
          rejected_at?: string | null
          rejected_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          values?: Json
        }
        Relationships: [
          {
            foreignKeyName: "submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
