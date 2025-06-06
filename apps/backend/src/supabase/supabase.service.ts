import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private serviceClient: SupabaseClient;
  private anonClient: SupabaseClient;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const supabaseUrl = this.configService.get('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get('SUPABASE_SERVICE_KEY');
    const supabaseAnonKey = this.configService.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL and Service Key must be provided');
    }

    if (!supabaseAnonKey) {
      throw new Error('Supabase Anon Key must be provided');
    }

    // Create service client (for server-side operations)
    this.serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create anon client (for user-context operations)
    this.anonClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test connection
    try {
      const { error } = await this.serviceClient.from('users').select('count').limit(1);
      if (error && error.message.includes('relation "users" does not exist')) {
        console.log('✅ Supabase connected successfully (tables not yet created)');
      } else if (error) {
        console.warn('⚠️ Supabase connection issue:', error.message);
      } else {
        console.log('✅ Supabase connected successfully');
      }
    } catch (error) {
      console.error('❌ Failed to connect to Supabase:', error);
    }
  }

  /**
   * Get Supabase client with service role privileges
   * Use for server-side operations that bypass RLS
   */
  getServiceClient(): SupabaseClient {
    return this.serviceClient;
  }

  /**
   * Get Supabase client with anon key
   * Use for operations that should respect RLS
   */
  getAnonClient(): SupabaseClient {
    return this.anonClient;
  }

  /**
   * Get user-specific client with access token
   * Use for operations in user context
   */
  getUserClient(_accessToken: string): SupabaseClient {
    // TODO: Implement user-specific client with access token
    return this.anonClient;
  }

  /**
   * Verify a Supabase JWT token
   */
  async verifyToken(token: string) {
    try {
      const { data: user, error } = await this.anonClient.auth.getUser(token);
      if (error) throw error;
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Invalid token: ${errorMessage}`);
    }
  }

  /**
   * Update user metadata in Supabase Auth
   */
  async updateUserMetadata(userId: string, metadata: Record<string, any>) {
    try {
      const { error } = await this.serviceClient.auth.admin.updateUserById(userId, {
        user_metadata: metadata
      });
      if (error) throw error;
    } catch (error) {
      console.error('Failed to update user metadata:', error);
      throw error;
    }
  }

  /**
   * Check if user is synced with our database
   */
  isUserSynced(user: any): boolean {
    return user?.user_metadata?.db_synced === true;
  }

  /**
   * Mark user as synced in Supabase metadata
   */
  async markUserAsSynced(userId: string, existingMetadata: Record<string, any> = {}) {
    await this.updateUserMetadata(userId, {
      ...existingMetadata,
      db_synced: true,
      synced_at: new Date().toISOString()
    });
  }

  /**
   * Upload file to Supabase Storage
   */
  async uploadFile(
    bucket: string,
    path: string,
    file: Buffer,
    contentType?: string
  ): Promise<{ path: string; publicUrl: string }> {
    try {
      const { data, error } = await this.serviceClient.storage
        .from(bucket)
        .upload(path, file, {
          contentType,
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = this.serviceClient.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return {
        path: data.path,
        publicUrl
      };
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete file from Supabase Storage
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const { error } = await this.serviceClient.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
    } catch (error) {
      console.error('File deletion error:', error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate signed URL for private file access
   */
  async getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string> {
    try {
      const { data, error } = await this.serviceClient.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) throw error;

      return data.signedUrl;
    } catch (error) {
      console.error('Signed URL generation error:', error);
      throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create storage bucket if it doesn't exist
   */
  async createBucket(bucketName: string, isPublic = true): Promise<void> {
    try {
      const { error } = await this.serviceClient.storage
        .createBucket(bucketName, {
          public: isPublic,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        });

      // Ignore error if bucket already exists
      if (error && !error.message.includes('already exists')) {
        throw error;
      }
    } catch (error) {
      console.error('Bucket creation error:', error);
      throw new Error(`Failed to create bucket: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 