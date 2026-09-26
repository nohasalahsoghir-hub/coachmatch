export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      athlete_packages: {
        Row: {
          athlete_id: string
          coach_id: string
          created_at: string
          expires_at: string
          id: string
          price_paid: number
          remaining_sessions: number
          status: Database["public"]["Enums"]["package_status"]
          total_sessions: number
        }
        Insert: {
          athlete_id: string
          coach_id: string
          created_at?: string
          expires_at: string
          id?: string
          price_paid: number
          remaining_sessions?: number
          status?: Database["public"]["Enums"]["package_status"]
          total_sessions?: number
        }
        Update: {
          athlete_id?: string
          coach_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          price_paid?: number
          remaining_sessions?: number
          status?: Database["public"]["Enums"]["package_status"]
          total_sessions?: number
        }
        Relationships: [
          {
            foreignKeyName: "athlete_packages_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_packages_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          athlete_id: string
          attendance_confirmed_at: string | null
          coach_id: string
          coach_net: number
          created_at: string
          end_time: string
          id: string
          location: string
          package_id: string | null
          platform_fee: number
          session_date: string
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
        }
        Insert: {
          athlete_id: string
          attendance_confirmed_at?: string | null
          coach_id: string
          coach_net: number
          created_at?: string
          end_time: string
          id?: string
          location: string
          package_id?: string | null
          platform_fee?: number
          session_date: string
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price: number
        }
        Update: {
          athlete_id?: string
          attendance_confirmed_at?: string | null
          coach_id?: string
          coach_net?: number
          created_at?: string
          end_time?: string
          id?: string
          location?: string
          package_id?: string | null
          platform_fee?: number
          session_date?: string
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "athlete_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          instapay_address: string | null
          is_available_today: boolean
          is_verified: boolean
          package_8_rate: number
          rating: number
          session_rate: number
          sports: string[]
          total_reviews: number
          training_locations: string[]
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id: string
          instapay_address?: string | null
          is_available_today?: boolean
          is_verified?: boolean
          package_8_rate?: number
          rating?: number
          session_rate?: number
          sports?: string[]
          total_reviews?: number
          training_locations?: string[]
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          instapay_address?: string | null
          is_available_today?: boolean
          is_verified?: boolean
          package_8_rate?: number
          rating?: number
          session_rate?: number
          sports?: string[]
          total_reviews?: number
          training_locations?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "coaches_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          phone: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          athlete_id: string
          booking_id: string
          coach_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
        }
        Insert: {
          athlete_id: string
          booking_id: string
          coach_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
        }
        Update: {
          athlete_id?: string
          booking_id?: string
          coach_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
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
      booking_status: "pending" | "confirmed" | "completed" | "cancelled"
      package_status: "active" | "expired" | "exhausted"
      user_role: "athlete" | "coach" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  T extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][T]["Row"]

export type TablesInsert<
  T extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][T]["Insert"]

export type TablesUpdate<
  T extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][T]["Update"]

export type Enums<T extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][T]
