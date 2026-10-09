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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      job_recommendations: {
        Row: {
          created_at: string
          id: string
          job_id: string
          match_score: number
          matched_skills: string[]
          missing_skills: string[]
          overlap_score: number
          rank: number
          readiness: number
          resume_id: string
          skill_gap: number
          tfidf_score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          match_score: number
          matched_skills?: string[]
          missing_skills?: string[]
          overlap_score: number
          rank: number
          readiness: number
          resume_id: string
          skill_gap: number
          tfidf_score: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          match_score?: number
          matched_skills?: string[]
          missing_skills?: string[]
          overlap_score?: number
          rank?: number
          readiness?: number
          resume_id?: string
          skill_gap?: number
          tfidf_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_recommendations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_recommendations_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          city: string | null
          company: string | null
          created_at: string
          employment_type: string | null
          experience: string | null
          external_id: string | null
          id: string
          job_description: string
          job_title: string
          location: string | null
          required_skills: string[]
          salary: string | null
          state: string | null
        }
        Insert: {
          city?: string | null
          company?: string | null
          created_at?: string
          employment_type?: string | null
          experience?: string | null
          external_id?: string | null
          id?: string
          job_description: string
          job_title: string
          location?: string | null
          required_skills?: string[]
          salary?: string | null
          state?: string | null
        }
        Update: {
          city?: string | null
          company?: string | null
          created_at?: string
          employment_type?: string | null
          experience?: string | null
          external_id?: string | null
          id?: string
          job_description?: string
          job_title?: string
          location?: string | null
          required_skills?: string[]
          salary?: string | null
          state?: string | null
        }
        Relationships: []
      }
      learning_resources: {
        Row: {
          description: string | null
          id: number
          level: string
          resource_name: string
          resource_url: string
          skill: string
        }
        Insert: {
          description?: string | null
          id?: number
          level: string
          resource_name: string
          resource_url: string
          skill: string
        }
        Update: {
          description?: string | null
          id?: number
          level?: string
          resource_name?: string
          resource_url?: string
          skill?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          analyzed_at: string | null
          created_at: string
          error: string | null
          extracted_text: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          status: string
          user_id: string
        }
        Insert: {
          analyzed_at?: string | null
          created_at?: string
          error?: string | null
          extracted_text?: string | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          status?: string
          user_id: string
        }
        Update: {
          analyzed_at?: string | null
          created_at?: string
          error?: string | null
          extracted_text?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      roadmap_items: {
        Row: {
          completed: boolean
          completed_at: string | null
          id: string
          kind: string
          level: string | null
          roadmap_id: string
          skill: string | null
          step: number
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          id?: string
          kind?: string
          level?: string | null
          roadmap_id: string
          skill?: string | null
          step: number
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          id?: string
          kind?: string
          level?: string | null
          roadmap_id?: string
          skill?: string | null
          step?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_items_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmaps: {
        Row: {
          created_at: string
          id: string
          job_id: string | null
          resume_id: string
          target_role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id?: string | null
          resume_id: string
          target_role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string | null
          resume_id?: string
          target_role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmaps_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmaps_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          aliases: string[]
          category: string
          id: number
          level: string
          name: string
          source: string
        }
        Insert: {
          aliases?: string[]
          category?: string
          id?: number
          level?: string
          name: string
          source?: string
        }
        Update: {
          aliases?: string[]
          category?: string
          id?: number
          level?: string
          name?: string
          source?: string
        }
        Relationships: []
      }
      user_skills: {
        Row: {
          id: string
          resume_id: string
          skill_name: string
          user_id: string
        }
        Insert: {
          id?: string
          resume_id: string
          skill_name: string
          user_id: string
        }
        Update: {
          id?: string
          resume_id?: string
          skill_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
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
    Enums: {},
  },
} as const
