import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { supabase } from '@/config/supabase';
import { PrivateMediaService } from '@/shared/services/private-media.service';
import { ProgressService } from '@/modules/progress/progress.service';
import { mockTable, resetMocks, setupAuthUser } from './utils/test-helpers';
import { Role } from '@/shared/rbac';
const app=createApp();
const owner='47d7dfca-8857-48f8-b3ab-5c30fbdb7ba1';
const other='47d7dfca-8857-48f8-b3ab-5c30fbdb7ba2';
const path=`personal/${owner}/progress-photo/nonce-photo.jpg`;
describe('Private personal media',()=>{
  beforeEach(()=>{
    resetMocks(); setupAuthUser(Role.CUSTOMER,null,owner);
    vi.mocked(supabase.storage.getBucket).mockResolvedValue({data:{id:'gym-personal',public:false,file_size_limit:5242880,allowed_mime_types:['image/jpeg','image/png','image/webp']} as any,error:null});
  });
  it('prepares only a private upload path and never emits a public URL',async()=>{
    const res=await request(app).post('/api/v1/uploads/signed-url').set('Authorization',`Bearer ${owner}`).send({purpose:'progress-photo',fileName:'photo.jpg',mimeType:'image/jpeg',size:1024});
    expect(res.status).toBe(201);
    expect(res.body.data.bucket).toBe('gym-personal');
    expect(res.body.data.path).toMatch(new RegExp(`^personal/${owner}/progress-photo/`));
    expect(res.body.data.publicUrl).toBeUndefined();
    expect(supabase.storage.getBucket).toHaveBeenCalledWith('gym-personal');
  });
  it('fails closed when the personal bucket is public',async()=>{
    vi.mocked(supabase.storage.getBucket).mockResolvedValueOnce({data:{id:'gym-personal',public:true} as any,error:null});
    const res=await request(app).post('/api/v1/uploads/signed-url').set('Authorization',`Bearer ${owner}`).send({purpose:'avatar',fileName:'photo.jpg',mimeType:'image/jpeg',size:1024});
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('PRIVATE_STORAGE_UNAVAILABLE');
    expect(supabase.storage.from).not.toHaveBeenCalled();
  });
  it('rejects another user path before contacting storage',async()=>{
    const res=await request(app).post('/api/v1/uploads/read-url').set('Authorization',`Bearer ${owner}`).send({path:`personal/${other}/progress-photo/nonce-photo.jpg`});
    expect(res.status).toBe(403); expect(supabase.storage.getBucket).not.toHaveBeenCalled();
  });
  it.each([`personal/${owner}/progress-photo/../avatar/photo.jpg`,`personal/${owner}/progress-photo/%2e%2e-photo.jpg`,`personal/${owner}/wrong-purpose/nonce-photo.jpg`])('rejects malformed paths',async path=>{
    expect((await request(app).post('/api/v1/uploads/read-url').set('Authorization',`Bearer ${owner}`).send({path})).status).toBe(400);
  });
  it('returns short-lived access only for an authenticated owner',async()=>{
    expect((await request(app).post('/api/v1/uploads/read-url').send({path})).status).toBe(401);
    const res=await request(app).post('/api/v1/uploads/read-url').set('Authorization',`Bearer ${owner}`).send({path});
    expect(res.status).toBe(200); expect(res.body.data.expiresIn).toBe(300);
    expect(res.headers['cache-control']).toBe('private, no-store');
  });
  it('stores paths rather than expiring URLs in the progress record',async()=>{
    const res=await request(app).post('/api/v1/progress/image').set('Authorization',`Bearer ${owner}`).send({imagePath:path,logDate:'2026-01-01'});
    expect(res.status).toBe(200);
    expect(res.body.data.image_path).toBe(path);
    expect(res.body.data.image_url).toContain('expires=300');
    expect(supabase.upsert).toHaveBeenCalledWith(expect.objectContaining({profile_id:owner,image_url:path}));
  });
  it('rejects public progress-image references and another account path',async()=>{
    expect((await request(app).post('/api/v1/progress/image').set('Authorization',`Bearer ${owner}`).send({imageUrl:'https://example.invalid/public.jpg',logDate:'2026-01-01'})).status).toBe(400);
    expect((await request(app).post('/api/v1/progress/image').set('Authorization',`Bearer ${owner}`).send({imagePath:`personal/${other}/progress-photo/nonce-photo.jpg`,logDate:'2026-01-01'})).status).toBe(403);
    expect(supabase.upsert).not.toHaveBeenCalled();
  });
  it('does not serve legacy public progress links as private media',async()=>{
    mockTable('progress_images',[{id:'legacy',profile_id:owner,image_url:'https://example.invalid/public.jpg',log_date:'2026-01-01'}]);
    const summary=await ProgressService.getMonthSummary(owner,2026,1);
    expect(summary.imageLogs).toEqual([{id:'legacy',log_date:'2026-01-01',image_url:null,unavailable:true}]);
    expect(supabase.storage.getBucket).not.toHaveBeenCalled();
  });
  it('never signs another account photo even through a direct service call',async()=>{
    await expect(PrivateMediaService.signedReadUrl(owner,`personal/${other}/avatar/nonce-photo.jpg`)).rejects.toMatchObject({statusCode:403});
  });
});
