import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gymsApi, getFullGymCatalog, PublicGym } from '@/api/gyms';
import { toast } from 'sonner';

export function useGymDirectory(search?: string) {
  return useQuery<PublicGym[]>({
    queryKey: ['gym-directory', search],
    queryFn: async () => {
      const res = await gymsApi.listDirectory(search ? { search } : undefined);
      const raw: any = res.data?.data;
      return Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : Array.isArray(res.data) ? res.data : [];
    },
  });
}

export function useGymDetails(gymId?: string) {
  return useQuery<PublicGym | null>({
    queryKey: ['gym-details', gymId],
    queryFn: async () => {
      if (!gymId) return null;
      const res = await gymsApi.getById(gymId);
      return res.data.data || null;
    },
    enabled: !!gymId,
  });
}

export function useSavedGyms() {
  return useQuery<PublicGym[]>({
    queryKey: ['saved-gyms'],
    queryFn: async () => {
      const res = await gymsApi.getSaved();
      return res.data.data || [];
    },
  });
}

export function useToggleGymBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (gymId: string) => gymsApi.toggleBookmark(gymId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['saved-gyms'] });
      qc.invalidateQueries({ queryKey: ['gym-directory'] });
      const isSaved = res.data?.data?.isSaved;
      toast.success(isSaved ? 'Gym bookmarked!' : 'Gym removed from bookmarks.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update bookmark.';
      toast.error(msg);
    },
  });
}

export function useFullGymCatalog(gymId?: string) {
  return useQuery({
    queryKey: ['full-gym-catalog', gymId],
    queryFn: async () => {
      if (!gymId) return null;
      return await getFullGymCatalog(gymId);
    },
    enabled: !!gymId,
  });
}

export function useJoinRequestStatus() {
  return useQuery({
    queryKey: ['join-request-status'],
    queryFn: async () => {
      const res = await gymsApi.getJoinStatus();
      return res.data.data || null;
    },
  });
}

export function useApplyJoinGym() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (gymId: string) => gymsApi.createJoinRequest({ gymId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['join-request-status'] });
      toast.success('Join request submitted! Awaiting gym owner approval.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to submit join request.';
      toast.error(msg);
    },
  });
}

export function usePendingJoinRequests() {
  return useQuery({
    queryKey: ['pending-join-requests'],
    queryFn: async () => {
      const res = await gymsApi.listPendingRequests();
      return res.data.data || [];
    },
  });
}

export function useApproveJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gymsApi.approveRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-join-requests'] });
      qc.invalidateQueries({ queryKey: ['members'] });
      toast.success('Member join request approved successfully!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to approve request.';
      toast.error(msg);
    },
  });
}

export function useRejectJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gymsApi.rejectRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-join-requests'] });
      toast.success('Join request rejected.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to reject request.';
      toast.error(msg);
    },
  });
}

export function useMyGymProfile() {
  return useQuery({
    queryKey: ['my-gym-profile'],
    queryFn: async () => {
      const res = await gymsApi.getMine();
      return res.data.data || null;
    },
  });
}

export function useUpdateMyGymProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => gymsApi.updateMine(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-gym-profile'] });
      qc.invalidateQueries({ queryKey: ['gym-directory'] });
      toast.success('Gym profile updated successfully!');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update gym profile.';
      toast.error(msg);
    },
  });
}

