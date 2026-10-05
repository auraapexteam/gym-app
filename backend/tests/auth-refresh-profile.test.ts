import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';
import { createAuthClient, supabaseAnon } from '@/config/supabase';
import { profileRepository } from '@/modules/auth/auth.repository';
import { mockTable, resetMocks, setupAuthUser } from './utils/test-helpers';
import { Role } from '@/shared/rbac';

const app=createApp();
const id='47d7dfca-8857-48f8-b3ab-5c30fbdb7ba1';
describe('Session refresh and safe profile updates',()=>{
  beforeEach(()=>{ resetMocks(); vi.mocked(supabaseAnon.auth.refreshSession).mockResolvedValue({
    data:{ user:{id} as any, session:{access_token:'new-access',refresh_token:'new-refresh',expires_at:1234567890} as any }, error:null,
  }); });
  it('rotates tokens and reloads the active profile through a request-scoped client',async()=>{
    mockTable('profiles',{id,email:'review@example.invalid',role:Role.CUSTOMER,status:'active'});
    const res=await request(app).post('/api/v1/auth/refresh').send({refreshToken:'old-refresh'});
    expect(res.status).toBe(200);
    expect(res.body.data.session).toMatchObject({accessToken:'new-access',refreshToken:'new-refresh'});
    expect(res.body.data.profile.id).toBe(id);
    expect(createAuthClient).toHaveBeenCalledTimes(1);
    expect(supabaseAnon.auth.refreshSession).toHaveBeenCalledWith({refresh_token:'old-refresh'});
  });
  it('does not disclose provider details for rejected refresh tokens',async()=>{
    vi.mocked(supabaseAnon.auth.refreshSession).mockResolvedValueOnce({data:{user:null,session:null},error:{message:'sensitive-provider-detail'} as any});
    const res=await request(app).post('/api/v1/auth/refresh').send({refreshToken:'invalid-refresh'});
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('SESSION_EXPIRED');
    expect(JSON.stringify(res.body)).not.toContain('sensitive-provider-detail');
  });
  it('refuses refreshed sessions for suspended profiles',async()=>{
    mockTable('profiles',{id,role:Role.CUSTOMER,status:'suspended'});
    expect((await request(app).post('/api/v1/auth/refresh').send({refreshToken:'old-refresh'})).status).toBe(403);
  });
  it.each([{refreshToken:''},{refreshToken:'value',id},{refreshToken:'x'.repeat(4097)}])('rejects malformed refresh input',async body=>{
    expect((await request(app).post('/api/v1/auth/refresh').send(body)).status).toBe(400);
    expect(createAuthClient).not.toHaveBeenCalled();
  });
  it.each(['role','gymId','gym_id','status','id','email'])('rejects protected profile field %s before persistence',async field=>{
    setupAuthUser(Role.CUSTOMER,null,id);
    const spy=vi.spyOn(profileRepository,'update');
    const res=await request(app).patch('/api/v1/auth/me').set('Authorization',`Bearer ${id}`).send({fullName:'Reviewer',[field]:'unauthorized-value'});
    expect(res.status).toBe(400); expect(spy).not.toHaveBeenCalled(); spy.mockRestore();
  });
  it('persists allowed onboarding data for the authenticated caller only',async()=>{
    setupAuthUser(Role.CUSTOMER,null,id);
    const spy=vi.spyOn(profileRepository,'update').mockResolvedValueOnce({id,email:'review@example.invalid',role:Role.CUSTOMER,status:'active',weight_kg:70,onboarding_completed:true} as any);
    const res=await request(app).patch('/api/v1/auth/me').set('Authorization',`Bearer ${id}`).send({dateOfBirth:'2000-01-02',weightKg:70,healthConditions:[],onboardingCompleted:true,healthDataConsent:true});
    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith(id,expect.objectContaining({date_of_birth:'2000-01-02',weight_kg:70,health_conditions:[],onboarding_completed:true,health_data_notice_version:'fitness-profile-2026-10-04'}));
    expect(res.body.data.profile).toBeUndefined();
    expect(res.body.data.weightKg).toBe(70);
    spy.mockRestore();
  });
  it('rejects invalid/future dates and invalid health measurements',async()=>{
    setupAuthUser(Role.CUSTOMER,null,id);
    for(const body of [{dateOfBirth:'2099-01-01'},{dateOfBirth:'2026-02-30'},{weightKg:-1},{heightCm:1000}]){
      expect((await request(app).patch('/api/v1/auth/me').set('Authorization',`Bearer ${id}`).send(body)).status).toBe(400);
    }
  });
});
