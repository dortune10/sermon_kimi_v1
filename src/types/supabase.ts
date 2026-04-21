export type PlanTier = 'spark' | 'chapel' | 'parish' | 'cathedral';
export type UserRole = 'owner' | 'admin' | 'editor' | 'member';
export type SermonStatus = 'pending' | 'processing' | 'transcribed' | 'completed' | 'error';
export type AssetType = 'summary' | 'clip' | 'social_post' | 'blog' | 'bulletin' | 'study_guide';
export type AssetStatus = 'draft' | 'review' | 'published' | 'archived';

export interface Church {
  id: string;
  name: string;
  slug: string;
  primary_language: string;
  secondary_language: string | null;
  timezone: string;
  plan_tier: PlanTier;
  created_at: string;
}

export interface Profile {
  id: string;
  church_id: string | null;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  language_preference: string;
  created_at: string;
}

export interface Sermon {
  id: string;
  church_id: string;
  title: string;
  speaker: string | null;
  date: string;
  duration_seconds: number | null;
  audio_url: string | null;
  video_url: string | null;
  status: SermonStatus;
  language: string;
  transcript: string | null;
  processing_metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ScriptureReference {
  id: string;
  sermon_id: string;
  book: string;
  chapter: number;
  verse_start: number | null;
  verse_end: number | null;
  translation: string | null;
  detected_text: string | null;
  normalized_ref: string;
  language: string;
  created_at: string;
}

export interface ContentAsset {
  id: string;
  sermon_id: string;
  type: AssetType;
  language: string;
  content: string;
  status: AssetStatus;
  parent_asset_id: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      churches: {
        Row: Church;
        Insert: Partial<Church>;
        Update: Partial<Church>;
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
      };
      sermons: {
        Row: Sermon;
        Insert: Partial<Sermon>;
        Update: Partial<Sermon>;
      };
      scripture_references: {
        Row: ScriptureReference;
        Insert: Partial<ScriptureReference>;
        Update: Partial<ScriptureReference>;
      };
      content_assets: {
        Row: ContentAsset;
        Insert: Partial<ContentAsset>;
        Update: Partial<ContentAsset>;
      };
    };
  };
}
