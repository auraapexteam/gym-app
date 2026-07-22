import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { mockTable, resetMocks, setupAuthUser } from './utils/test-helpers';
import { Role } from '@/shared/rbac';
import { supabase } from '@/config/supabase';

const app = createApp();

describe('Uploads / Gallery Module', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('POST /api/v1/gallery/upload-url', () => {
    it('should successfully return signed upload URL details', async () => {
      setupAuthUser(Role.OWNER, '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000006');

      // Mock Supabase storage signed url generation
      vi.mocked(supabase.storage) as any;
      const mockStorage = {
        from: vi.fn().mockReturnThis(),
        createSignedUploadUrl: vi.fn(async () => ({
          data: { signedUrl: 'https://supabase.co/signed-url-123', path: 'progress/photo-1.jpg' },
          error: null,
        })),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: 'https://supabase.co/public-url-123' },
        })),
      };
      // Assign storage mock on supabase client
      (supabase as any).storage = mockStorage;

      const res = await request(app)
        .post('/api/v1/gallery/upload-url')
        .set('Authorization', 'Bearer 00000000-0000-0000-0000-000000000006')
        .send({
          fileName: 'progress-photo.jpg',
          mimeType: 'image/jpeg',
          size: 1024 * 1024,
          entityType: 'gym',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.uploadUrl).toBe('https://supabase.co/signed-url-123');
      expect(res.body.data.publicUrl).toBe('https://supabase.co/public-url-123');
    });

    it('should fail with invalid mimeType or payload validation errors', async () => {
      setupAuthUser(Role.OWNER, '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000006');

      const res = await request(app)
        .post('/api/v1/gallery/upload-url')
        .set('Authorization', 'Bearer 00000000-0000-0000-0000-000000000006')
        .send({
          fileName: '',
          mimeType: '',
          size: -100,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
