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
      churches: {
        Row: {
          created_at: string
          id: string
          name: string
          plan_tier: string
          primary_language: string
          secondary_language: string | null
          slug: string
          timezone: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan_tier?: string
          primary_language?: string
          secondary_language?: string | null
          slug: string
          timezone?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan_tier?: string
          primary_language?: string
          secondary_language?: string | null
          slug?: string
          timezone?: string
        }
        Relationships: []
      }
      content_assets: {
        Row: {
          content: string
          created_at: string
          id: string
          language: string
          parent_asset_id: string | null
          sermon_id: string
          status: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          language?: string
          parent_asset_id?: string | null
          sermon_id: string
          status?: string
          type: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          language?: string
          parent_asset_id?: string | null
          sermon_id?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_assets_parent_asset_id_fkey"
            columns: ["parent_asset_id"]
            isOneToOne: false
            referencedRelation: "content_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_assets_sermon_id_fkey"
            columns: ["sermon_id"]
            isOneToOne: false
            referencedRelation: "sermons"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          church_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          language_preference: string
          role: string
        }
        Insert: {
          avatar_url?: string | null
          church_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          language_preference?: string
          role?: string
        }
        Update: {
          avatar_url?: string | null
          church_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          language_preference?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      scripture_references: {
        Row: {
          book: string
          chapter: number
          created_at: string
          detected_text: string | null
          id: string
          language: string
          normalized_ref: string
          sermon_id: string
          translation: string | null
          verse_end: number | null
          verse_start: number | null
        }
        Insert: {
          book: string
          chapter: number
          created_at?: string
          detected_text?: string | null
          id?: string
          language?: string
          normalized_ref: string
          sermon_id: string
          translation?: string | null
          verse_end?: number | null
          verse_start?: number | null
        }
        Update: {
          book?: string
          chapter?: number
          created_at?: string
          detected_text?: string | null
          id?: string
          language?: string
          normalized_ref?: string
          sermon_id?: string
          translation?: string | null
          verse_end?: number | null
          verse_start?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scripture_references_sermon_id_fkey"
            columns: ["sermon_id"]
            isOneToOne: false
            referencedRelation: "sermons"
            referencedColumns: ["id"]
          },
        ]
      }
      sermons: {
        Row: {
          audio_url: string | null
          church_id: string
          created_at: string
          date: string
          duration_seconds: number | null
          id: string
          language: string
          processing_metadata: Json | null
          speaker: string | null
          status: string
          title: string
          transcript: string | null
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          church_id: string
          created_at?: string
          date?: string
          duration_seconds?: number | null
          id?: string
          language?: string
          processing_metadata?: Json | null
          speaker?: string | null
          status?: string
          title: string
          transcript?: string | null
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          church_id?: string
          created_at?: string
          date?: string
          duration_seconds?: number | null
          id?: string
          language?: string
          processing_metadata?: Json | null
          speaker?: string | null
          status?: string
          title?: string
          transcript?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sermons_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never

// Re-export convenience types for app use
export type PlanTier = 'spark' | 'chapel' | 'parish' | 'cathedral';
export type UserRole = 'owner' | 'admin' | 'editor' | 'member';
export type SermonStatus = 'pending' | 'processing' | 'transcribed' | 'completed' | 'error';
export type AssetType = 'summary' | 'clip' | 'social_post' | 'blog' | 'bulletin' | 'study_guide';
export type AssetStatus = 'draft' | 'review' | 'published' | 'archived';

export type Church = Database['public']['Tables']['churches']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Sermon = Database['public']['Tables']['sermons']['Row'];
export type ScriptureReference = Database['public']['Tables']['scripture_references']['Row'];
export type ContentAsset = Database['public']['Tables']['content_assets']['Row'];
