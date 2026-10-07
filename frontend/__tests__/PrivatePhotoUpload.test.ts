import { uploadPersonalImage } from '../src/utils/upload';
import { apiClient } from '../src/api/client';
let mockAccount: any;
jest.mock('../src/config', () => ({ SUPABASE_URL: 'https://staging-project.supabase.co' }));
jest.mock('../src/api/client', () => ({ apiClient: { post: jest.fn() } }));
jest.mock('../src/store/useAuthStore', () => ({ useAuthStore: { getState: () => mockAccount } }));
const path = 'personal/reviewer/avatar/synthetic.jpg';
const uploadUrl = `https://staging-project.supabase.co/storage/v1/object/upload/sign/gym-personal/${path}?token=synthetic`;
const asset = { uri: 'file:///synthetic.jpg', fileName: 'synthetic.jpg', type: 'image/jpeg', fileSize: 100 };
beforeEach(() => {
  mockAccount = { user: { id: 'reviewer' }, accessToken: 'synthetic', accountGeneration: 1 };
  (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true, data: { bucket: 'gym-personal', path, uploadUrl } } });
  globalThis.fetch = jest.fn().mockResolvedValue({ ok: true });
});
afterEach(() => jest.clearAllMocks());
test('returns only the private object path after confirmed upload', async () => {
  await expect(uploadPersonalImage(asset, 'avatar')).resolves.toBe(path);
  expect(apiClient.post).toHaveBeenCalledWith('/uploads/signed-url', { fileName: 'synthetic.jpg', mimeType: 'image/jpeg', size: 100, purpose: 'avatar' });
  expect(fetch).toHaveBeenCalledWith(uploadUrl, expect.objectContaining({ headers: { 'x-upsert': 'false' } }));
});
test.each([
  { bucket: 'gym-media', path, uploadUrl },
  { bucket: 'gym-personal', path: 'personal/another/avatar/synthetic.jpg', uploadUrl },
  { bucket: 'gym-personal', path, uploadUrl: uploadUrl.replace('staging-project', 'another-project') },
  { bucket: 'gym-personal', path, uploadUrl: uploadUrl.replace('/personal/reviewer/', '/personal/another/') },
])('rejects public, foreign account, or foreign project destinations before sending bytes', async destination => {
  (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { success: true, data: destination } });
  await expect(uploadPersonalImage(asset, 'avatar')).rejects.toThrow();
  expect(fetch).not.toHaveBeenCalled();
});
test('unknown file size and failed storage responses cannot produce a saved path', async () => {
  await expect(uploadPersonalImage({ uri: asset.uri }, 'avatar')).rejects.toThrow('size');
  expect(apiClient.post).not.toHaveBeenCalled();
  (fetch as jest.Mock).mockResolvedValue({ ok: false, status: 403 });
  await expect(uploadPersonalImage(asset, 'avatar')).rejects.toThrow('403');
});
