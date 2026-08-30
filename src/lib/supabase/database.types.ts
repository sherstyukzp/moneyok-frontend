export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          archived_at: string | null
          budget_book_id: string
          color: string | null
          created_at: string
          current_balance: number
          currency: string
          icon: string | null
          id: string
          initial_balance: number
          name: string
          note: string | null
          type:
            | "payment"
            | "savings"
            | "credit_card"
            | "investment"
            | "reserve"
            | "liability"
            | "business"
            | "cash"
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          budget_book_id: string
          color?: string | null
          created_at?: string
          currency?: string
          current_balance?: number
          icon?: string | null
          id?: string
          initial_balance?: number
          name: string
          note?: string | null
          type:
            | "payment"
            | "savings"
            | "credit_card"
            | "investment"
            | "reserve"
            | "liability"
            | "business"
            | "cash"
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          budget_book_id?: string
          color?: string | null
          created_at?: string
          currency?: string
          current_balance?: number
          icon?: string | null
          id?: string
          initial_balance?: number
          name?: string
          note?: string | null
          type?:
            | "payment"
            | "savings"
            | "credit_card"
            | "investment"
            | "reserve"
            | "liability"
            | "business"
            | "cash"
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_budget_book_id_fkey"
            columns: ["budget_book_id"]
            isOneToOne: false
            referencedRelation: "budget_books"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_books: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          amount_limit: number
          budget_book_id: string
          category_id: string
          created_at: string
          id: string
          name: string
          period_type: "monthly" | "yearly" | "custom"
          start_date: string
          updated_at: string
        }
        Insert: {
          amount_limit: number
          budget_book_id: string
          category_id: string
          created_at?: string
          id?: string
          name: string
          period_type?: "monthly" | "yearly" | "custom"
          start_date: string
          updated_at?: string
        }
        Update: {
          amount_limit?: number
          budget_book_id?: string
          category_id?: string
          created_at?: string
          id?: string
          name?: string
          period_type?: "monthly" | "yearly" | "custom"
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_budget_book_id_fkey"
            columns: ["budget_book_id"]
            isOneToOne: false
            referencedRelation: "budget_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          budget_book_id: string
          color: string | null
          created_at: string
          icon: string | null
          id: string
          kind: "income" | "expense"
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          budget_book_id: string
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          kind: "income" | "expense"
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          budget_book_id?: string
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          kind?: "income" | "expense"
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_budget_book_id_fkey"
            columns: ["budget_book_id"]
            isOneToOne: false
            referencedRelation: "budget_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          default_currency: string
          email: string
          exchange_rates: Json | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_currency?: string
          email: string
          exchange_rates?: Json | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_currency?: string
          email?: string
          exchange_rates?: Json | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      recipients: {
        Row: {
          budget_book_id: string
          created_at: string
          id: string
          account_id: string | null
          category_id: string | null
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          budget_book_id: string
          created_at?: string
          id?: string
          account_id?: string | null
          category_id?: string | null
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          budget_book_id?: string
          created_at?: string
          id?: string
          account_id?: string | null
          category_id?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipients_budget_book_id_fkey"
            columns: ["budget_book_id"]
            isOneToOne: false
            referencedRelation: "budget_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipients_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipients_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          id: string
          budget_book_id: string
          name: string
          color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          budget_book_id: string
          name: string
          color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          budget_book_id?: string
          name?: string
          color?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_budget_book_id_fkey"
            columns: ["budget_book_id"]
            isOneToOne: false
            referencedRelation: "budget_books"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          budget_book_id: string
          category_id: string | null
          created_at: string
          currency: string
          id: string
          note: string | null
          recipient_id: string | null
          tag_id: string | null
          transaction_date: string
          transfer_account_id: string | null
          type: "income" | "expense" | "transfer"
          updated_at: string
        }
        Insert: {
          account_id: string
          amount: number
          budget_book_id: string
          category_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          note?: string | null
          recipient_id?: string | null
          tag_id?: string | null
          transaction_date?: string
          transfer_account_id?: string | null
          type: "income" | "expense" | "transfer"
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount?: number
          budget_book_id?: string
          category_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          note?: string | null
          recipient_id?: string | null
          tag_id?: string | null
          transaction_date?: string
          transfer_account_id?: string | null
          type?: "income" | "expense" | "transfer"
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_budget_book_id_fkey"
            columns: ["budget_book_id"]
            isOneToOne: false
            referencedRelation: "budget_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "recipients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_transfer_account_id_fkey"
            columns: ["transfer_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const