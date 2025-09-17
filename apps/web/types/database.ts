export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      auth_attempts: {
        Row: {
          authentication_type: string;
          client_ip: unknown | null;
          created_at: string | null;
          error_message: string | null;
          id: string;
          response_time_ms: number | null;
          success: boolean;
          university_id: string | null;
          user_agent: string | null;
          user_email: string;
        };
        Insert: {
          authentication_type: string;
          client_ip?: unknown | null;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          response_time_ms?: number | null;
          success: boolean;
          university_id?: string | null;
          user_agent?: string | null;
          user_email: string;
        };
        Update: {
          authentication_type?: string;
          client_ip?: unknown | null;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          response_time_ms?: number | null;
          success?: boolean;
          university_id?: string | null;
          user_agent?: string | null;
          user_email?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'auth_attempts_university_id_fkey';
            columns: ['university_id'];
            isOneToOne: false;
            referencedRelation: 'universities';
            referencedColumns: ['id'];
          },
        ];
      };
      sync_jobs: {
        Row: {
          connection_id: string | null;
          created_at: string | null;
          data: Json | null;
          id: string;
          message: string | null;
          progress: number | null;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          connection_id?: string | null;
          created_at?: string | null;
          data?: Json | null;
          id: string;
          message?: string | null;
          progress?: number | null;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          connection_id?: string | null;
          created_at?: string | null;
          data?: Json | null;
          id?: string;
          message?: string | null;
          progress?: number | null;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sync_jobs_connection_id_fkey';
            columns: ['connection_id'];
            isOneToOne: false;
            referencedRelation: 'user_university_connections';
            referencedColumns: ['id'];
          },
        ];
      };
      universities: {
        Row: {
          created_at: string | null;
          domain: string;
          id: string;
          is_active: boolean | null;
          logo_url: string | null;
          moodle_url: string | null;
          name_en: string;
          name_he: string;
          scraper_config: Json | null;
          supported_features: string[] | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          domain: string;
          id: string;
          is_active?: boolean | null;
          logo_url?: string | null;
          moodle_url?: string | null;
          name_en: string;
          name_he: string;
          scraper_config?: Json | null;
          supported_features?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          domain?: string;
          id?: string;
          is_active?: boolean | null;
          logo_url?: string | null;
          moodle_url?: string | null;
          name_en?: string;
          name_he?: string;
          scraper_config?: Json | null;
          supported_features?: string[] | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      university_data: {
        Row: {
          academic_year: string | null;
          connection_id: string | null;
          created_at: string | null;
          data_payload: Json;
          data_type: string;
          description: string | null;
          description_he: string | null;
          external_id: string | null;
          id: string;
          semester: string | null;
          status: string | null;
          title: string | null;
          title_he: string | null;
          updated_at: string | null;
        };
        Insert: {
          academic_year?: string | null;
          connection_id?: string | null;
          created_at?: string | null;
          data_payload: Json;
          data_type: string;
          description?: string | null;
          description_he?: string | null;
          external_id?: string | null;
          id?: string;
          semester?: string | null;
          status?: string | null;
          title?: string | null;
          title_he?: string | null;
          updated_at?: string | null;
        };
        Update: {
          academic_year?: string | null;
          connection_id?: string | null;
          created_at?: string | null;
          data_payload?: Json;
          data_type?: string;
          description?: string | null;
          description_he?: string | null;
          external_id?: string | null;
          id?: string;
          semester?: string | null;
          status?: string | null;
          title?: string | null;
          title_he?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'university_data_connection_id_fkey';
            columns: ['connection_id'];
            isOneToOne: false;
            referencedRelation: 'user_university_connections';
            referencedColumns: ['id'];
          },
        ];
      };
      user_university_connections: {
        Row: {
          created_at: string | null;
          encrypted_password: string;
          id: string;
          is_active: boolean | null;
          is_verified: boolean | null;
          last_sync_at: string | null;
          last_verified_at: string | null;
          university_id: string | null;
          university_username: string;
          updated_at: string | null;
          user_id: string | null;
          validation_attempts: number | null;
          verification_data: Json | null;
        };
        Insert: {
          created_at?: string | null;
          encrypted_password: string;
          id?: string;
          is_active?: boolean | null;
          is_verified?: boolean | null;
          last_sync_at?: string | null;
          last_verified_at?: string | null;
          university_id?: string | null;
          university_username: string;
          updated_at?: string | null;
          user_id?: string | null;
          validation_attempts?: number | null;
          verification_data?: Json | null;
        };
        Update: {
          created_at?: string | null;
          encrypted_password?: string;
          id?: string;
          is_active?: boolean | null;
          is_verified?: boolean | null;
          last_sync_at?: string | null;
          last_verified_at?: string | null;
          university_id?: string | null;
          university_username?: string;
          updated_at?: string | null;
          user_id?: string | null;
          validation_attempts?: number | null;
          verification_data?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_university_connections_university_id_fkey';
            columns: ['university_id'];
            isOneToOne: false;
            referencedRelation: 'universities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_university_connections_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          email: string;
          google_id: string | null;
          id: string;
          is_setup_complete: boolean | null;
          name: string | null;
          preferences: Json | null;
          preferred_language: string | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          email: string;
          google_id?: string | null;
          id?: string;
          is_setup_complete?: boolean | null;
          name?: string | null;
          preferences?: Json | null;
          preferred_language?: string | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string;
          google_id?: string | null;
          id?: string;
          is_setup_complete?: boolean | null;
          name?: string | null;
          preferences?: Json | null;
          preferred_language?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_or_create_user_by_google_id: {
        Args: {
          email_param: string;
          google_id_param: string;
          name_param: string;
        };
        Returns: Json;
      };
      get_user_credential_status: {
        Args: { university_id_param: string; user_email_param: string };
        Returns: Json;
      };
      increment_validation_attempts: {
        Args: { university_id_param: string; user_email_param: string };
        Returns: undefined;
      };
      log_auth_attempt: {
        Args: {
          authentication_type_param: string;
          client_ip_param?: string;
          error_message_param?: string;
          response_time_ms_param?: number;
          success_param: boolean;
          university_id_param: string;
          user_agent_param?: string;
          user_email_param: string;
        };
        Returns: undefined;
      };
      save_validated_credentials: {
        Args: {
          encrypted_password_param: string;
          university_id_param: string;
          user_email_param: string;
          username_param: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null;
          avif_autodetection: boolean | null;
          created_at: string | null;
          file_size_limit: number | null;
          id: string;
          name: string;
          owner: string | null;
          owner_id: string | null;
          public: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id: string;
          name: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id?: string;
          name?: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      migrations: {
        Row: {
          executed_at: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Insert: {
          executed_at?: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Update: {
          executed_at?: string | null;
          hash?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      objects: {
        Row: {
          bucket_id: string | null;
          created_at: string | null;
          id: string;
          last_accessed_at: string | null;
          metadata: Json | null;
          name: string | null;
          owner: string | null;
          owner_id: string | null;
          path_tokens: string[] | null;
          updated_at: string | null;
          user_metadata: Json | null;
          version: string | null;
        };
        Insert: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Update: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'objects_bucketId_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          },
        ];
      };
      s3_multipart_uploads: {
        Row: {
          bucket_id: string;
          created_at: string;
          id: string;
          in_progress_size: number;
          key: string;
          owner_id: string | null;
          upload_signature: string;
          user_metadata: Json | null;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          id: string;
          in_progress_size?: number;
          key: string;
          owner_id?: string | null;
          upload_signature: string;
          user_metadata?: Json | null;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          id?: string;
          in_progress_size?: number;
          key?: string;
          owner_id?: string | null;
          upload_signature?: string;
          user_metadata?: Json | null;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: 's3_multipart_uploads_bucket_id_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          },
        ];
      };
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string;
          created_at: string;
          etag: string;
          id: string;
          key: string;
          owner_id: string | null;
          part_number: number;
          size: number;
          upload_id: string;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          etag: string;
          id?: string;
          key: string;
          owner_id?: string | null;
          part_number: number;
          size?: number;
          upload_id: string;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          etag?: string;
          id?: string;
          key?: string;
          owner_id?: string | null;
          part_number?: number;
          size?: number;
          upload_id?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: 's3_multipart_uploads_parts_bucket_id_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 's3_multipart_uploads_parts_upload_id_fkey';
            columns: ['upload_id'];
            isOneToOne: false;
            referencedRelation: 's3_multipart_uploads';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string };
        Returns: undefined;
      };
      extension: {
        Args: { name: string };
        Returns: string;
      };
      filename: {
        Args: { name: string };
        Returns: string;
      };
      foldername: {
        Args: { name: string };
        Returns: string[];
      };
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>;
        Returns: {
          bucket_id: string;
          size: number;
        }[];
      };
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string;
          delimiter_param: string;
          max_keys?: number;
          next_key_token?: string;
          next_upload_token?: string;
          prefix_param: string;
        };
        Returns: {
          key: string;
          id: string;
          created_at: string;
        }[];
      };
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string;
          delimiter_param: string;
          max_keys?: number;
          next_token?: string;
          prefix_param: string;
          start_after?: string;
        };
        Returns: {
          updated_at: string;
          metadata: Json;
          id: string;
          name: string;
        }[];
      };
      operation: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      search: {
        Args: {
          bucketname: string;
          levels?: number;
          limits?: number;
          offsets?: number;
          prefix: string;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          metadata: Json;
          last_accessed_at: string;
          created_at: string;
          updated_at: string;
          id: string;
          name: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
  storage: {
    Enums: {},
  },
} as const;

// Convenience type aliases for common database entities
export type User = Tables<'users'>;
export type UserInsert = TablesInsert<'users'>;
export type UserUpdate = TablesUpdate<'users'>;

export type UniversityData = Tables<'university_data'>;
export type UniversityDataInsert = TablesInsert<'university_data'>;
export type UniversityDataUpdate = TablesUpdate<'university_data'>;

export type University = Tables<'universities'>;
export type UniversityInsert = TablesInsert<'universities'>;
export type UniversityUpdate = TablesUpdate<'universities'>;

export type UserUniversityConnection = Tables<'user_university_connections'>;
export type UserUniversityConnectionInsert = TablesInsert<'user_university_connections'>;
export type UserUniversityConnectionUpdate = TablesUpdate<'user_university_connections'>;

export type SyncJob = Tables<'sync_jobs'>;
export type SyncJobInsert = TablesInsert<'sync_jobs'>;
export type SyncJobUpdate = TablesUpdate<'sync_jobs'>;

export type AuthAttempt = Tables<'auth_attempts'>;
export type AuthAttemptInsert = TablesInsert<'auth_attempts'>;
export type AuthAttemptUpdate = TablesUpdate<'auth_attempts'>;

// Legacy type aliases for backward compatibility
export type Course = UniversityData & { data_type: 'course' };
export type Assignment = UniversityData & { data_type: 'assignment' };
export type Grade = UniversityData & { data_type: 'grade' };
export type CourseEnrollment = UniversityData & { data_type: 'enrollment' };
export type Team = UniversityData & { data_type: 'team' };
export type TeamMember = UniversityData & { data_type: 'team_member' };

// Input types for creating entities
export interface CreateUserInput extends Omit<UserInsert, 'id' | 'created_at' | 'updated_at'> {}
export interface UpdateUserInput extends Partial<Omit<UserUpdate, 'created_at'>> {
  id: string;
}

export interface CreateCourseInput
  extends Omit<UniversityDataInsert, 'id' | 'created_at' | 'updated_at'> {
  data_type: 'course';
}
export interface UpdateCourseInput
  extends Partial<Omit<UniversityDataUpdate, 'created_at'>> {
  id: string;
}

export interface CreateAssignmentInput
  extends Omit<UniversityDataInsert, 'id' | 'created_at' | 'updated_at'> {
  data_type: 'assignment';
}
export interface UpdateAssignmentInput
  extends Partial<Omit<UniversityDataUpdate, 'created_at'>> {
  id: string;
}

export interface CreateGradeInput
  extends Omit<UniversityDataInsert, 'id' | 'created_at' | 'updated_at'> {
  data_type: 'grade';
}
export interface UpdateGradeInput
  extends Partial<Omit<UniversityDataUpdate, 'created_at'>> {
  id: string;
}

export interface CreateEnrollmentInput
  extends Omit<UniversityDataInsert, 'id' | 'created_at' | 'updated_at'> {
  data_type: 'enrollment';
}

export interface CreateTeamInput
  extends Omit<UniversityDataInsert, 'id' | 'created_at' | 'updated_at'> {
  data_type: 'team';
}
export interface UpdateTeamInput extends Partial<Omit<UniversityDataUpdate, 'created_at'>> {
  id: string;
}

export interface CreateTeamMemberInput
  extends Omit<UniversityDataInsert, 'id' | 'created_at' | 'updated_at'> {
  data_type: 'team_member';
}

// Filter types for queries
export interface UserFilters {
  email?: string;
  is_setup_complete?: boolean;
  preferred_language?: string;
  faculty?: string;
  department?: string;
  yearOfStudy?: number;
}

export interface CourseFilters {
  connection_id?: string;
  academic_year?: string;
  semester?: string;
  status?: string;
  faculty?: string;
  department?: string;
  academicYear?: number;
  isActive?: boolean;
  instructor?: string;
}

export interface AssignmentFilters {
  connection_id?: string;
  academic_year?: string;
  semester?: string;
  status?: string;
  courseId?: string;
  priority?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface GradeFilters {
  connection_id?: string;
  academic_year?: string;
  semester?: string;
  userId?: string;
  courseId?: string;
  assignmentId?: string;
  gradeFrom?: number;
  gradeTo?: number;
}

// Generic database operation result
export interface DatabaseResult<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  count?: number;
}

// Paginated response for list operations
export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
