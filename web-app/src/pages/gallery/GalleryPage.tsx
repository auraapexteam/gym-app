import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardContent, Button, Modal, Input } from '@/components/ui';
import { Image as ImageIcon, Plus, Trash2, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { galleryApi } from '@/api/gallery';
import { uploadFileToGallery } from '@/utils';
import { toast } from 'sonner';

export default function GalleryPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const qc = useQueryClient();

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: async () => {
      const res = await galleryApi.getImages();
      return Array.isArray(res.data.data) ? res.data.data : [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => galleryApi.deleteImage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gallery'] });
      toast.success('Photo removed from gym gallery.');
    },
    onError: () => toast.error('Failed to remove photo.'),
  });

  const handleUploadPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select an image file to upload.');
      return;
    }

    setIsUploading(true);
    try {
      await uploadFileToGallery({
        file,
        entityType: 'gym',
        caption: caption.trim() || undefined,
      });

      qc.invalidateQueries({ queryKey: ['gallery'] });
      toast.success('Photo uploaded to gym gallery!');
      setShowUploadModal(false);
      setCaption('');
      setFile(null);
    } catch {
      toast.error('Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Gallery' }]}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-aura-text">Gym Gallery</h1>
          <p className="text-sm text-aura-muted mt-0.5">Manage photos of facilities, workout spaces, and equipment</p>
        </div>
        <Button variant="primary" onClick={() => setShowUploadModal(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Upload Photo
        </Button>
      </div>

      {/* Photos Grid */}
      {images.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="h-16 w-16 mx-auto rounded-full bg-aura-primary/10 flex items-center justify-center mb-3">
            <ImageIcon className="h-8 w-8 text-aura-primary" />
          </div>
          <h3 className="font-semibold text-aura-text">No Gallery Photos</h3>
          <p className="text-sm text-aura-muted mt-1 mb-4">Upload gym facility pictures to attract customers</p>
          <Button variant="primary" onClick={() => setShowUploadModal(true)} className="gap-2 mx-auto">
            <Upload className="h-4 w-4" /> Upload First Photo
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img: any, i: number) => {
            const src = img.publicUrl || img.public_url || img.path;
            return (
              <motion.div
                key={img.id || i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="group relative rounded-xl overflow-hidden border border-aura-border bg-aura-card"
              >
                <img src={src} alt={img.caption || 'Gym Photo'} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                  <p className="text-xs font-semibold text-white truncate">{img.caption || 'Gym Facility'}</p>
                  <button
                    onClick={() => deleteMutation.mutate(img.id)}
                    className="absolute top-2 right-2 p-1.5 bg-red-600/80 text-white rounded-md hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <Modal open={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Gym Photo">
        <form onSubmit={handleUploadPhoto} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-aura-text mb-1">Select Photo File *</label>
            <input
              type="file"
              accept="image/*"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-aura-muted border border-aura-border rounded-md p-2 bg-aura-bg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-aura-text mb-1">Caption / Description</label>
            <Input
              type="text"
              placeholder="e.g. Main Cardio Floor & Free Weights Area"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowUploadModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isUploading || !file}>
              {isUploading ? 'Uploading to Supabase...' : 'Upload Photo'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
