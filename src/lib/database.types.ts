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
    PostgrestVersion: "13"
  }
  public: {
    Tables: {
      exercises: {
        Row: {
          archived_at: string | null
          category: Database["public"]["Enums"]["exercise_category"]
          created_at: string
          description: string | null
          id: string
          is_built_in: boolean
          name: string
          owner_id: string | null
        }
        Insert: {
          archived_at?: string | null
          category: Database["public"]["Enums"]["exercise_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_built_in?: boolean
          name: string
          owner_id?: string | null
        }
        Update: {
          archived_at?: string | null
          category?: Database["public"]["Enums"]["exercise_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_built_in?: boolean
          name?: string
          owner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      logged_exercises: {
        Row: {
          completed: boolean
          duration_sec: number | null
          edge_mm: number | null
          exercise_id: string | null
          grade: string | null
          id: string
          load_kg: number | null
          log_id: string
          notes: string | null
          position: number
          reps: number | null
          sets: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          duration_sec?: number | null
          edge_mm?: number | null
          exercise_id?: string | null
          grade?: string | null
          id?: string
          load_kg?: number | null
          log_id: string
          notes?: string | null
          position: number
          reps?: number | null
          sets?: number | null
          user_id?: string
        }
        Update: {
          completed?: boolean
          duration_sec?: number | null
          edge_mm?: number | null
          exercise_id?: string | null
          grade?: string | null
          id?: string
          load_kg?: number | null
          log_id?: string
          notes?: string | null
          position?: number
          reps?: number | null
          sets?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "logged_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logged_exercises_log_id_user_id_fkey"
            columns: ["log_id", "user_id"]
            isOneToOne: false
            referencedRelation: "session_logs"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      plan_blocks: {
        Row: {
          focus: string | null
          id: string
          name: string
          plan_id: string
          position: number
        }
        Insert: {
          focus?: string | null
          id?: string
          name: string
          plan_id: string
          position: number
        }
        Update: {
          focus?: string | null
          id?: string
          name?: string
          plan_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_blocks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_day_items: {
        Row: {
          day_id: string
          duration_sec: number | null
          edge_mm: number | null
          exercise_id: string | null
          grade: string | null
          id: string
          load_kg: number | null
          notes: string | null
          plan_id: string
          position: number
          reps: number | null
          rest_sec: number | null
          sets: number | null
          test_type_id: string | null
        }
        Insert: {
          day_id: string
          duration_sec?: number | null
          edge_mm?: number | null
          exercise_id?: string | null
          grade?: string | null
          id?: string
          load_kg?: number | null
          notes?: string | null
          plan_id: string
          position: number
          reps?: number | null
          rest_sec?: number | null
          sets?: number | null
          test_type_id?: string | null
        }
        Update: {
          day_id?: string
          duration_sec?: number | null
          edge_mm?: number | null
          exercise_id?: string | null
          grade?: string | null
          id?: string
          load_kg?: number | null
          notes?: string | null
          plan_id?: string
          position?: number
          reps?: number | null
          rest_sec?: number | null
          sets?: number | null
          test_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_day_items_day_id_plan_id_fkey"
            columns: ["day_id", "plan_id"]
            isOneToOne: false
            referencedRelation: "plan_days"
            referencedColumns: ["id", "plan_id"]
          },
          {
            foreignKeyName: "plan_day_items_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_day_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_day_items_test_type_id_fkey"
            columns: ["test_type_id"]
            isOneToOne: false
            referencedRelation: "test_types"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_days: {
        Row: {
          id: string
          kind: Database["public"]["Enums"]["day_kind"]
          notes: string | null
          plan_id: string
          title: string
          week_id: string
          weekday: number
        }
        Insert: {
          id?: string
          kind?: Database["public"]["Enums"]["day_kind"]
          notes?: string | null
          plan_id: string
          title: string
          week_id: string
          weekday: number
        }
        Update: {
          id?: string
          kind?: Database["public"]["Enums"]["day_kind"]
          notes?: string | null
          plan_id?: string
          title?: string
          week_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_days_week_id_plan_id_fkey"
            columns: ["week_id", "plan_id"]
            isOneToOne: false
            referencedRelation: "plan_weeks"
            referencedColumns: ["id", "plan_id"]
          },
        ]
      }
      plan_weeks: {
        Row: {
          block_id: string
          id: string
          plan_id: string
          position: number
        }
        Insert: {
          block_id: string
          id?: string
          plan_id: string
          position: number
        }
        Update: {
          block_id?: string
          id?: string
          plan_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_weeks_block_id_plan_id_fkey"
            columns: ["block_id", "plan_id"]
            isOneToOne: false
            referencedRelation: "plan_blocks"
            referencedColumns: ["id", "plan_id"]
          },
          {
            foreignKeyName: "plan_weeks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          goal: string | null
          id: string
          owner_id: string
          source_plan_id: string | null
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          goal?: string | null
          id?: string
          owner_id?: string
          source_plan_id?: string | null
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          created_at?: string
          description?: string | null
          goal?: string | null
          id?: string
          owner_id?: string
          source_plan_id?: string | null
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "plans_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_source_plan_id_fkey"
            columns: ["source_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bodyweight_kg: number | null
          created_at: string
          display_name: string | null
          id: string
          username: string
        }
        Insert: {
          bodyweight_kg?: number | null
          created_at?: string
          display_name?: string | null
          id: string
          username: string
        }
        Update: {
          bodyweight_kg?: number | null
          created_at?: string
          display_name?: string | null
          id?: string
          username?: string
        }
        Relationships: []
      }
      scheduled_sessions: {
        Row: {
          date: string
          id: string
          plan_day_id: string
          plan_id: string
          schedule_id: string
          user_id: string
        }
        Insert: {
          date: string
          id?: string
          plan_day_id: string
          plan_id: string
          schedule_id: string
          user_id?: string
        }
        Update: {
          date?: string
          id?: string
          plan_day_id?: string
          plan_id?: string
          schedule_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_sessions_plan_day_id_plan_id_fkey"
            columns: ["plan_day_id", "plan_id"]
            isOneToOne: false
            referencedRelation: "plan_days"
            referencedColumns: ["id", "plan_id"]
          },
          {
            foreignKeyName: "scheduled_sessions_schedule_id_plan_id_user_id_fkey"
            columns: ["schedule_id", "plan_id", "user_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id", "plan_id", "user_id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string
          id: string
          plan_id: string
          start_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_id: string
          start_date: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_id?: string
          start_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session_logs: {
        Row: {
          created_at: string
          date: string
          duration_min: number | null
          id: string
          notes: string | null
          rpe: number | null
          scheduled_session_id: string | null
          title: string
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          created_at?: string
          date: string
          duration_min?: number | null
          id?: string
          notes?: string | null
          rpe?: number | null
          scheduled_session_id?: string | null
          title: string
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          created_at?: string
          date?: string
          duration_min?: number | null
          id?: string
          notes?: string | null
          rpe?: number | null
          scheduled_session_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "session_logs_scheduled_session_id_user_id_fkey"
            columns: ["scheduled_session_id", "user_id"]
            isOneToOne: false
            referencedRelation: "scheduled_sessions"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "session_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          bodyweight_kg: number | null
          created_at: string
          date: string
          id: string
          notes: string | null
          scheduled_session_id: string | null
          test_type_id: string
          user_id: string
          value: number
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          bodyweight_kg?: number | null
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          scheduled_session_id?: string | null
          test_type_id: string
          user_id?: string
          value: number
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          bodyweight_kg?: number | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          scheduled_session_id?: string | null
          test_type_id?: string
          user_id?: string
          value?: number
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "test_results_scheduled_session_id_user_id_fkey"
            columns: ["scheduled_session_id", "user_id"]
            isOneToOne: false
            referencedRelation: "scheduled_sessions"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "test_results_test_type_id_fkey"
            columns: ["test_type_id"]
            isOneToOne: false
            referencedRelation: "test_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_types: {
        Row: {
          archived_at: string | null
          category: Database["public"]["Enums"]["test_category"]
          created_at: string
          higher_is_better: boolean
          id: string
          is_built_in: boolean
          name: string
          owner_id: string | null
          protocol: string | null
          unit: Database["public"]["Enums"]["test_unit"]
        }
        Insert: {
          archived_at?: string | null
          category: Database["public"]["Enums"]["test_category"]
          created_at?: string
          higher_is_better?: boolean
          id?: string
          is_built_in?: boolean
          name: string
          owner_id?: string | null
          protocol?: string | null
          unit: Database["public"]["Enums"]["test_unit"]
        }
        Update: {
          archived_at?: string | null
          category?: Database["public"]["Enums"]["test_category"]
          created_at?: string
          higher_is_better?: boolean
          id?: string
          is_built_in?: boolean
          name?: string
          owner_id?: string | null
          protocol?: string | null
          unit?: Database["public"]["Enums"]["test_unit"]
        }
        Relationships: [
          {
            foreignKeyName: "test_types_owner_id_fkey"
            columns: ["owner_id"]
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
      copy_plan: { Args: { p_plan_id: string }; Returns: string }
      save_plan: {
        Args: { p_plan: Json; p_plan_id: string }
        Returns: undefined
      }
      schedule_plan: {
        Args: { p_plan_id: string; p_start_date: string }
        Returns: string
      }
      unschedule: { Args: { p_schedule_id: string }; Returns: undefined }
    }
    Enums: {
      day_kind: "training" | "test"
      exercise_category:
        | "finger_strength"
        | "strength"
        | "power"
        | "power_endurance"
        | "endurance"
        | "climbing"
        | "antagonist"
        | "mobility"
        | "other"
      test_category: "finger" | "pulling" | "grade" | "other"
      test_unit:
        | "kg_added"
        | "mm"
        | "reps"
        | "seconds"
        | "font_grade"
        | "french_grade"
      visibility: "public" | "private"
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
  public: {
    Enums: {
      day_kind: ["training", "test"],
      exercise_category: [
        "finger_strength",
        "strength",
        "power",
        "power_endurance",
        "endurance",
        "climbing",
        "antagonist",
        "mobility",
        "other",
      ],
      test_category: ["finger", "pulling", "grade", "other"],
      test_unit: [
        "kg_added",
        "mm",
        "reps",
        "seconds",
        "font_grade",
        "french_grade",
      ],
      visibility: ["public", "private"],
    },
  },
} as const

