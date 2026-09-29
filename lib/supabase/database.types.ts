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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      athlete_packages: {
        Row: {
          activation_key: string | null
          athlete_id: string
          checkout_fee: number
          coach_id: string
          created_at: string
          expires_at: string
          id: string
          is_demo: boolean
          is_trial: boolean
          platform_commission: number
          price_paid: number
          remaining_sessions: number
          session_coach_net: number | null
          session_unit_price: number | null
          status: Database["public"]["Enums"]["package_status"]
          subtotal: number | null
          total_sessions: number
        }
        Insert: {
          activation_key?: string | null
          athlete_id: string
          checkout_fee?: number
          coach_id: string
          created_at?: string
          expires_at: string
          id?: string
          is_demo?: boolean
          is_trial?: boolean
          platform_commission?: number
          price_paid: number
          remaining_sessions?: number
          session_coach_net?: number | null
          session_unit_price?: number | null
          status?: Database["public"]["Enums"]["package_status"]
          subtotal?: number | null
          total_sessions?: number
        }
        Update: {
          activation_key?: string | null
          athlete_id?: string
          checkout_fee?: number
          coach_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_demo?: boolean
          is_trial?: boolean
          platform_commission?: number
          price_paid?: number
          remaining_sessions?: number
          session_coach_net?: number | null
          session_unit_price?: number | null
          status?: Database["public"]["Enums"]["package_status"]
          subtotal?: number | null
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
      booking_checkout_intents: {
        Row: {
          athlete_id: string
          booking_id: string | null
          checkout_fee: number
          coach_id: string
          created_at: string
          currency: string
          end_time: string
          expires_at: string
          id: string
          idempotency_key: string
          location: string
          metadata: Json
          paid_at: string | null
          payment_id: string | null
          platform_commission: number
          session_date: string
          start_time: string
          status: string
          subtotal: number
          timezone: string
          total_amount: number
        }
        Insert: {
          athlete_id: string
          booking_id?: string | null
          checkout_fee?: number
          coach_id: string
          created_at?: string
          currency?: string
          end_time: string
          expires_at: string
          id?: string
          idempotency_key: string
          location: string
          metadata?: Json
          paid_at?: string | null
          payment_id?: string | null
          platform_commission?: number
          session_date: string
          start_time: string
          status?: string
          subtotal: number
          timezone?: string
          total_amount: number
        }
        Update: {
          athlete_id?: string
          booking_id?: string | null
          checkout_fee?: number
          coach_id?: string
          created_at?: string
          currency?: string
          end_time?: string
          expires_at?: string
          id?: string
          idempotency_key?: string
          location?: string
          metadata?: Json
          paid_at?: string | null
          payment_id?: string | null
          platform_commission?: number
          session_date?: string
          start_time?: string
          status?: string
          subtotal?: number
          timezone?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_checkout_intents_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_checkout_intents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_checkout_intents_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_checkout_intents_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_status_history: {
        Row: {
          booking_id: string
          changed_by: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["booking_status"] | null
          id: string
          is_demo: boolean
          note: string | null
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          booking_id: string
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: string
          is_demo?: boolean
          note?: string | null
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          booking_id?: string
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: string
          is_demo?: boolean
          note?: string | null
          to_status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          athlete_id: string
          attendance_confirmed_at: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          checkout_fee: number
          coach_id: string
          coach_net: number
          created_at: string
          end_time: string
          hold_expires_at: string | null
          id: string
          idempotency_key: string | null
          is_demo: boolean
          location: string
          package_id: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          platform_commission: number
          platform_fee: number
          refund_amount: number
          refunded_at: string | null
          session_date: string
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          subtotal: number | null
          timezone: string
          total_amount: number | null
          total_price: number
        }
        Insert: {
          athlete_id: string
          attendance_confirmed_at?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          checkout_fee?: number
          coach_id: string
          coach_net: number
          created_at?: string
          end_time: string
          hold_expires_at?: string | null
          id?: string
          idempotency_key?: string | null
          is_demo?: boolean
          location: string
          package_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          platform_commission?: number
          platform_fee?: number
          refund_amount?: number
          refunded_at?: string | null
          session_date: string
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal?: number | null
          timezone?: string
          total_amount?: number | null
          total_price: number
        }
        Update: {
          athlete_id?: string
          attendance_confirmed_at?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          checkout_fee?: number
          coach_id?: string
          coach_net?: number
          created_at?: string
          end_time?: string
          hold_expires_at?: string | null
          id?: string
          idempotency_key?: string | null
          is_demo?: boolean
          location?: string
          package_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          platform_commission?: number
          platform_fee?: number
          refund_amount?: number
          refunded_at?: string | null
          session_date?: string
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal?: number | null
          timezone?: string
          total_amount?: number | null
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
            foreignKeyName: "bookings_cancelled_by_fkey"
            columns: ["cancelled_by"]
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
      coach_availability: {
        Row: {
          coach_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          is_demo: boolean
          start_time: string
          timezone: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          is_demo?: boolean
          start_time: string
          timezone?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          is_demo?: boolean
          start_time?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_availability_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_blocked_slots: {
        Row: {
          coach_id: string
          created_at: string
          ends_at: string
          id: string
          is_demo: boolean
          reason: string | null
          starts_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          ends_at: string
          id?: string
          is_demo?: boolean
          reason?: string | null
          starts_at: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          ends_at?: string
          id?: string
          is_demo?: boolean
          reason?: string | null
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_blocked_slots_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_public_catalog: {
        Row: {
          accepting_bookings: boolean
          avatar_url: string | null
          bio: string | null
          experience_years: number
          full_name: string
          headline: string | null
          id: string
          is_available_today: boolean
          languages: string[]
          package_8_rate: number | null
          rating: number | null
          session_rate: number | null
          sports: string[]
          total_reviews: number
          training_locations: string[]
        }
        Insert: {
          accepting_bookings?: boolean
          avatar_url?: string | null
          bio?: string | null
          experience_years?: number
          full_name: string
          headline?: string | null
          id: string
          is_available_today?: boolean
          languages?: string[]
          package_8_rate?: number | null
          rating?: number | null
          session_rate?: number | null
          sports?: string[]
          total_reviews?: number
          training_locations?: string[]
        }
        Update: {
          accepting_bookings?: boolean
          avatar_url?: string | null
          bio?: string | null
          experience_years?: number
          full_name?: string
          headline?: string | null
          id?: string
          is_available_today?: boolean
          languages?: string[]
          package_8_rate?: number | null
          rating?: number | null
          session_rate?: number | null
          sports?: string[]
          total_reviews?: number
          training_locations?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "coach_public_catalog_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_public_profiles: {
        Row: {
          avatar_url: string | null
          full_name: string
          headline: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          full_name: string
          headline?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          full_name?: string
          headline?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_public_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_sports: {
        Row: {
          coach_id: string
          created_at: string
          is_demo: boolean
          is_primary: boolean
          specialization: string | null
          sport_id: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          is_demo?: boolean
          is_primary?: boolean
          specialization?: string | null
          sport_id: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          is_demo?: boolean
          is_primary?: boolean
          specialization?: string | null
          sport_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_sports_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_sports_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_verification_requests: {
        Row: {
          coach_id: string
          created_at: string
          documents: Json
          id: string
          is_demo: boolean
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"]
          submitted_at: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          documents?: Json
          id?: string
          is_demo?: boolean
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          documents?: Json
          id?: string
          is_demo?: boolean
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_verification_requests_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          accepting_bookings: boolean
          bio: string | null
          created_at: string
          experience_years: number
          headline: string | null
          id: string
          instapay_address: string | null
          is_available_today: boolean
          is_demo: boolean
          is_verified: boolean
          languages: string[]
          package_8_rate: number
          rating: number
          session_rate: number
          sports: string[]
          total_reviews: number
          training_locations: string[]
          updated_at: string
        }
        Insert: {
          accepting_bookings?: boolean
          bio?: string | null
          created_at?: string
          experience_years?: number
          headline?: string | null
          id: string
          instapay_address?: string | null
          is_available_today?: boolean
          is_demo?: boolean
          is_verified?: boolean
          languages?: string[]
          package_8_rate?: number
          rating?: number
          session_rate?: number
          sports?: string[]
          total_reviews?: number
          training_locations?: string[]
          updated_at?: string
        }
        Update: {
          accepting_bookings?: boolean
          bio?: string | null
          created_at?: string
          experience_years?: number
          headline?: string | null
          id?: string
          instapay_address?: string | null
          is_available_today?: boolean
          is_demo?: boolean
          is_verified?: boolean
          languages?: string[]
          package_8_rate?: number
          rating?: number
          session_rate?: number
          sports?: string[]
          total_reviews?: number
          training_locations?: string[]
          updated_at?: string
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
      demo_athletes: {
        Row: {
          avatar_url: string | null
          created_at: string
          favorite_sports: string[]
          full_name: string
          goals: string[]
          id: string
          is_demo: boolean
          level: string
          phone: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          favorite_sports?: string[]
          full_name: string
          goals?: string[]
          id?: string
          is_demo?: boolean
          level: string
          phone?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          favorite_sports?: string[]
          full_name?: string
          goals?: string[]
          id?: string
          is_demo?: boolean
          level?: string
          phone?: string | null
        }
        Relationships: []
      }
      demo_bookings: {
        Row: {
          athlete_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          checkout_fee: number
          coach_id: string
          coach_net: number
          created_at: string
          end_time: string
          id: string
          is_demo: boolean
          location: string
          package_id: string | null
          payment_status: string
          platform_commission: number
          platform_fee: number
          session_date: string
          start_time: string
          status: string
          subtotal: number | null
          timezone: string
          total_amount: number | null
          total_price: number
        }
        Insert: {
          athlete_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          checkout_fee?: number
          coach_id: string
          coach_net?: number
          created_at?: string
          end_time: string
          id?: string
          is_demo?: boolean
          location: string
          package_id?: string | null
          payment_status?: string
          platform_commission?: number
          platform_fee?: number
          session_date: string
          start_time: string
          status: string
          subtotal?: number | null
          timezone?: string
          total_amount?: number | null
          total_price: number
        }
        Update: {
          athlete_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          checkout_fee?: number
          coach_id?: string
          coach_net?: number
          created_at?: string
          end_time?: string
          id?: string
          is_demo?: boolean
          location?: string
          package_id?: string | null
          payment_status?: string
          platform_commission?: number
          platform_fee?: number
          session_date?: string
          start_time?: string
          status?: string
          subtotal?: number | null
          timezone?: string
          total_amount?: number | null
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "demo_bookings_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "demo_athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_bookings_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "demo_coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "demo_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_coach_availability: {
        Row: {
          coach_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          is_demo: boolean
          start_time: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          is_demo?: boolean
          start_time: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          is_demo?: boolean
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_coach_availability_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "demo_coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_coaches: {
        Row: {
          avatar_url: string | null
          bio: string
          created_at: string
          experience_years: number
          full_name: string
          headline: string
          id: string
          is_available_today: boolean
          is_demo: boolean
          is_verified: boolean
          languages: string[]
          package_8_rate: number
          rating: number
          session_rate: number
          specialization: string
          sport_id: string
          total_reviews: number
          training_locations: string[]
        }
        Insert: {
          avatar_url?: string | null
          bio: string
          created_at?: string
          experience_years: number
          full_name: string
          headline: string
          id?: string
          is_available_today?: boolean
          is_demo?: boolean
          is_verified?: boolean
          languages?: string[]
          package_8_rate: number
          rating: number
          session_rate: number
          specialization: string
          sport_id: string
          total_reviews?: number
          training_locations?: string[]
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          experience_years?: number
          full_name?: string
          headline?: string
          id?: string
          is_available_today?: boolean
          is_demo?: boolean
          is_verified?: boolean
          languages?: string[]
          package_8_rate?: number
          rating?: number
          session_rate?: number
          specialization?: string
          sport_id?: string
          total_reviews?: number
          training_locations?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "demo_coaches_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_disputes: {
        Row: {
          athlete_id: string | null
          booking_id: string | null
          coach_id: string | null
          created_at: string
          id: string
          is_demo: boolean
          reason: string
          resolution: string | null
          status: string
        }
        Insert: {
          athlete_id?: string | null
          booking_id?: string | null
          coach_id?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          reason: string
          resolution?: string | null
          status?: string
        }
        Update: {
          athlete_id?: string | null
          booking_id?: string | null
          coach_id?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          reason?: string
          resolution?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_disputes_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "demo_athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "demo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_disputes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "demo_coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_money_ledger: {
        Row: {
          amount: number
          athlete_id: string | null
          booking_id: string | null
          coach_id: string | null
          created_at: string
          currency: string
          direction: string
          entry_type: string
          id: string
          is_demo: boolean
          metadata: Json
          payment_id: string | null
          reference: string | null
        }
        Insert: {
          amount: number
          athlete_id?: string | null
          booking_id?: string | null
          coach_id?: string | null
          created_at?: string
          currency?: string
          direction: string
          entry_type: string
          id?: string
          is_demo?: boolean
          metadata?: Json
          payment_id?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          athlete_id?: string | null
          booking_id?: string | null
          coach_id?: string | null
          created_at?: string
          currency?: string
          direction?: string
          entry_type?: string
          id?: string
          is_demo?: boolean
          metadata?: Json
          payment_id?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_money_ledger_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "demo_athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_money_ledger_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "demo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_money_ledger_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "demo_coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_money_ledger_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "demo_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_notifications: {
        Row: {
          athlete_id: string | null
          body: string
          coach_id: string | null
          created_at: string
          id: string
          is_demo: boolean
          read_at: string | null
          title: string
          type: string
        }
        Insert: {
          athlete_id?: string | null
          body: string
          coach_id?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          read_at?: string | null
          title: string
          type: string
        }
        Update: {
          athlete_id?: string | null
          body?: string
          coach_id?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          read_at?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_notifications_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "demo_athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_notifications_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "demo_coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_packages: {
        Row: {
          athlete_id: string
          coach_id: string
          created_at: string
          expires_at: string
          id: string
          is_demo: boolean
          price_paid: number
          remaining_sessions: number
          status: string
          total_sessions: number
        }
        Insert: {
          athlete_id: string
          coach_id: string
          created_at?: string
          expires_at: string
          id?: string
          is_demo?: boolean
          price_paid: number
          remaining_sessions?: number
          status?: string
          total_sessions?: number
        }
        Update: {
          athlete_id?: string
          coach_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_demo?: boolean
          price_paid?: number
          remaining_sessions?: number
          status?: string
          total_sessions?: number
        }
        Relationships: [
          {
            foreignKeyName: "demo_packages_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "demo_athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_packages_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "demo_coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_payments: {
        Row: {
          amount: number
          athlete_id: string
          booking_id: string | null
          coach_id: string
          created_at: string
          id: string
          is_demo: boolean
          method: string
          provider_reference: string | null
          status: string
        }
        Insert: {
          amount: number
          athlete_id: string
          booking_id?: string | null
          coach_id: string
          created_at?: string
          id?: string
          is_demo?: boolean
          method?: string
          provider_reference?: string | null
          status?: string
        }
        Update: {
          amount?: number
          athlete_id?: string
          booking_id?: string | null
          coach_id?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          method?: string
          provider_reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_payments_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "demo_athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "demo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_payments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "demo_coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_payouts: {
        Row: {
          amount: number
          booking_id: string | null
          coach_id: string
          created_at: string
          id: string
          is_demo: boolean
          paid_at: string | null
          scheduled_at: string | null
          status: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          coach_id: string
          created_at?: string
          id?: string
          is_demo?: boolean
          paid_at?: string | null
          scheduled_at?: string | null
          status?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          coach_id?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          paid_at?: string | null
          scheduled_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_payouts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "demo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_payouts_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "demo_coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_reviews: {
        Row: {
          athlete_id: string
          booking_id: string
          coach_id: string
          comment: string | null
          created_at: string
          id: string
          is_demo: boolean
          rating: number
        }
        Insert: {
          athlete_id: string
          booking_id: string
          coach_id: string
          comment?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          rating: number
        }
        Update: {
          athlete_id?: string
          booking_id?: string
          coach_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "demo_reviews_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "demo_athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "demo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_reviews_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "demo_coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_verification_requests: {
        Row: {
          coach_id: string
          id: string
          is_demo: boolean
          notes: string | null
          reviewed_at: string | null
          status: string
          submitted_at: string
        }
        Insert: {
          coach_id: string
          id?: string
          is_demo?: boolean
          notes?: string | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
        }
        Update: {
          coach_id?: string
          id?: string
          is_demo?: boolean
          notes?: string | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_verification_requests_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "demo_coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          booking_id: string
          created_at: string
          details: string | null
          id: string
          is_demo: boolean
          opened_by: string
          reason: string
          resolution: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["dispute_status"]
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          details?: string | null
          id?: string
          is_demo?: boolean
          opened_by: string
          reason: string
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          details?: string | null
          id?: string
          is_demo?: boolean
          opened_by?: string
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      money_ledger: {
        Row: {
          account_id: string | null
          account_type: string | null
          amount: number
          athlete_id: string | null
          booking_id: string | null
          coach_id: string | null
          created_at: string
          currency: string
          direction: string
          entry_type: string
          id: string
          is_demo: boolean
          metadata: Json
          payment_id: string | null
          reference: string | null
        }
        Insert: {
          account_id?: string | null
          account_type?: string | null
          amount: number
          athlete_id?: string | null
          booking_id?: string | null
          coach_id?: string | null
          created_at?: string
          currency?: string
          direction: string
          entry_type: string
          id?: string
          is_demo?: boolean
          metadata?: Json
          payment_id?: string | null
          reference?: string | null
        }
        Update: {
          account_id?: string | null
          account_type?: string | null
          amount?: number
          athlete_id?: string | null
          booking_id?: string | null
          coach_id?: string | null
          created_at?: string
          currency?: string
          direction?: string
          entry_type?: string
          id?: string
          is_demo?: boolean
          metadata?: Json
          payment_id?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "money_ledger_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "money_ledger_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "money_ledger_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "money_ledger_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_demo: boolean
          link: string | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_demo?: boolean
          link?: string | null
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          link?: string | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      package_usage: {
        Row: {
          booking_id: string
          id: string
          is_demo: boolean
          package_id: string
          reversed_at: string | null
          sessions_used: number
          status: string
          used_at: string
        }
        Insert: {
          booking_id: string
          id?: string
          is_demo?: boolean
          package_id: string
          reversed_at?: string | null
          sessions_used?: number
          status?: string
          used_at?: string
        }
        Update: {
          booking_id?: string
          id?: string
          is_demo?: boolean
          package_id?: string
          reversed_at?: string | null
          sessions_used?: number
          status?: string
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_usage_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_usage_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "athlete_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          athlete_id: string
          booking_id: string | null
          coach_id: string | null
          created_at: string
          currency: string
          id: string
          is_demo: boolean
          metadata: Json
          package_id: string | null
          paid_at: string | null
          provider: string
          provider_reference: string | null
          refunded_amount: number
          refunded_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          athlete_id: string
          booking_id?: string | null
          coach_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_demo?: boolean
          metadata?: Json
          package_id?: string | null
          paid_at?: string | null
          provider?: string
          provider_reference?: string | null
          refunded_amount?: number
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          athlete_id?: string
          booking_id?: string | null
          coach_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_demo?: boolean
          metadata?: Json
          package_id?: string | null
          paid_at?: string | null
          provider?: string
          provider_reference?: string | null
          refunded_amount?: number
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: true
            referencedRelation: "athlete_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          coach_id: string
          created_at: string
          currency: string
          id: string
          is_demo: boolean
          paid_at: string | null
          payout_reference: string | null
          period_end: string | null
          period_start: string | null
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          coach_id: string
          created_at?: string
          currency?: string
          id?: string
          is_demo?: boolean
          paid_at?: string | null
          payout_reference?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          coach_id?: string
          created_at?: string
          currency?: string
          id?: string
          is_demo?: boolean
          paid_at?: string | null
          payout_reference?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
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
          is_demo: boolean
          linked_auth_id: string | null
          phone: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          is_demo?: boolean
          linked_auth_id?: string | null
          phone: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_demo?: boolean
          linked_auth_id?: string | null
          phone?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      public_reviews: {
        Row: {
          coach_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
        }
        Insert: {
          coach_id: string
          comment?: string | null
          created_at: string
          id: string
          rating: number
        }
        Update: {
          coach_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "public_reviews_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_reviews_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          athlete_id: string
          booking_id: string
          coach_id: string
          comment: string | null
          created_at: string
          id: string
          is_demo: boolean
          rating: number
        }
        Insert: {
          athlete_id: string
          booking_id: string
          coach_id: string
          comment?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          rating: number
        }
        Update: {
          athlete_id?: string
          booking_id?: string
          coach_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
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
      sports: {
        Row: {
          category: string
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          is_demo: boolean
          name_ar: string
          name_en: string
          slug: string
          sort_order: number
        }
        Insert: {
          category: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          name_ar: string
          name_en: string
          slug: string
          sort_order?: number
        }
        Update: {
          category?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          name_ar?: string
          name_en?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_package_direct: {
        Args: { p_coach_id: string }
        Returns: {
          coach_id: string
          expires_at: string
          package_id: string
          remaining_sessions: number
          session_unit_price: number
          total_sessions: number
        }[]
      }
      book_with_package: {
        Args: {
          p_coach_id: string
          p_idempotency_key?: string
          p_location: string
          p_package_id: string
          p_session_date: string
          p_start_time: string
        }
        Returns: {
          booking_id: string
          coach_id: string
          remaining_sessions: number
          session_date: string
          start_time: string
          total_amount: number
        }[]
      }
      cancel_booking_v3: {
        Args: { p_booking_id: string; p_reason?: string }
        Returns: {
          cancelled: boolean
          message: string
          returned_package_session: boolean
        }[]
      }
      complete_booking_v3: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      create_booking_direct: {
        Args: {
          p_coach_id: string
          p_location: string
          p_session_date: string
          p_start_time: string
        }
        Returns: {
          booking_id: string
          coach_id: string
          end_time: string
          session_date: string
          start_time: string
          total_amount: number
        }[]
      }
      create_demo_booking_atomic: {
        Args: {
          p_coach_id: string
          p_idempotency_key: string
          p_location: string
          p_session_date: string
          p_start_time: string
        }
        Returns: {
          booking_id: string
          checkout_fee: number
          coach_name: string
          payment_id: string
          reference: string
          subtotal: number
          total_amount: number
        }[]
      }
      get_public_coach_slot_counts: {
        Args: never
        Returns: {
          coach_id: string
          today_slots: number
        }[]
      }
      get_public_coach_slots: {
        Args: { p_coach_id: string; p_days?: number }
        Returns: {
          session_date: string
          start_time: string
        }[]
      }
      purchase_demo_package_atomic: {
        Args: { p_coach_id: string; p_idempotency_key: string }
        Returns: {
          coach_name: string
          package_id: string
          payment_id: string
          reference: string
          total_amount: number
        }[]
      }
      replace_coach_weekly_availability: {
        Args: { p_schedule: Json }
        Returns: number
      }
      reset_coachmatch_demo_data: { Args: never; Returns: undefined }
      sync_coach_public_projection: {
        Args: { p_coach_id: string }
        Returns: undefined
      }
    }
    Enums: {
      booking_status: "pending" | "confirmed" | "completed" | "cancelled"
      dispute_status: "open" | "under_review" | "resolved" | "rejected"
      notification_type:
        | "booking"
        | "payment"
        | "package"
        | "review"
        | "verification"
        | "system"
      package_status: "active" | "expired" | "exhausted"
      payment_status:
        | "pending"
        | "processing"
        | "paid"
        | "failed"
        | "refunded"
        | "cancelled"
      payout_status: "pending" | "processing" | "paid" | "failed"
      user_role: "athlete" | "coach" | "admin"
      verification_status: "pending" | "approved" | "rejected" | "needs_changes"
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
      booking_status: ["pending", "confirmed", "completed", "cancelled"],
      dispute_status: ["open", "under_review", "resolved", "rejected"],
      notification_type: [
        "booking",
        "payment",
        "package",
        "review",
        "verification",
        "system",
      ],
      package_status: ["active", "expired", "exhausted"],
      payment_status: [
        "pending",
        "processing",
        "paid",
        "failed",
        "refunded",
        "cancelled",
      ],
      payout_status: ["pending", "processing", "paid", "failed"],
      user_role: ["athlete", "coach", "admin"],
      verification_status: ["pending", "approved", "rejected", "needs_changes"],
    },
  },
} as const
