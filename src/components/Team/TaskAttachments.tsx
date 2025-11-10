import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Paperclip, X, FileText, Image as ImageIcon, Download, Link } from 'lucide-react';

interface TaskAttachment {
  id: string;
  file_name: string;
  file_path: string | null;
  file_size: number | null;
  file_type: string | null;
  uploaded_by: string;
  created_at: string;
  attachment_type: 'file' | 'url';
  attachment_url: string | null;
  url_title: string | null;
}

interface TaskAttachmentsProps {
  taskId?: string;
  attachments: TaskAttachment[];
  onAttachmentsChange?: () => void;
  allowUpload?: boolean;
}

export const TaskAttachments: React.FC<TaskAttachmentsProps> = ({
  taskId,
  attachments,
  onAttachmentsChange,
  allowUpload = true,
}) => {
  const [uploading, setUploading] = useState(false);
  const inputId = `task-file-upload-${taskId ?? 'new'}`;
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');

  const handleAddUrl = async () => {
    if (!urlInput.trim() || !taskId) {
      toast.error('Please enter a valid URL');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('task_attachments').insert({
        task_id: taskId,
        attachment_type: 'url',
        attachment_url: urlInput.trim(),
        url_title: urlTitle.trim() || urlInput.trim(),
        file_name: urlTitle.trim() || urlInput.trim(),
        uploaded_by: user?.id,
      });

      if (error) throw error;

      toast.success('URL added successfully');
      setUrlInput('');
      setUrlTitle('');
      setShowUrlDialog(false);
      if (onAttachmentsChange) {
        onAttachmentsChange();
      }
    } catch (error) {
      console.error('Error adding URL:', error);
      toast.error('Failed to add URL');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !taskId) return;

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
      'application/pdf',
    ];

    setUploading(true);
    let uploadedCount = 0;
    
    try {
      for (const file of Array.from(files)) {
        if (!allowedTypes.includes(file.type)) {
          toast.error(`File type not allowed: ${file.name}`);
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File too large (max 10MB): ${file.name}`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${taskId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('task-attachments')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: { user } } = await supabase.auth.getUser();
        const { error: dbError } = await supabase
          .from('task_attachments')
          .insert({
            task_id: taskId,
            attachment_type: 'file',
            file_name: file.name,
            file_path: fileName,
            file_size: file.size,
            file_type: file.type,
            uploaded_by: user?.id,
          });

        if (dbError) {
          console.error('Database error:', dbError);
          // Clean up uploaded file if DB insert fails
          await supabase.storage.from('task-attachments').remove([fileName]);
          toast.error(`Failed to save ${file.name}`);
          continue;
        }
        
        uploadedCount++;
      }

      if (uploadedCount > 0) {
        toast.success(`${uploadedCount} file(s) uploaded successfully`);
        // Small delay to ensure database consistency before refetch
        setTimeout(() => {
          if (onAttachmentsChange) {
            onAttachmentsChange();
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleRemoveAttachment = async (attachment: TaskAttachment) => {
    if (!confirm(`Remove ${attachment.file_name}?`)) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('task-attachments')
        .remove([attachment.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', attachment.id);

      if (dbError) throw dbError;

      toast.success('Attachment removed');
      if (onAttachmentsChange) {
        onAttachmentsChange();
      }
    } catch (error) {
      console.error('Error removing attachment:', error);
      toast.error('Failed to remove attachment');
    }
  };

  const getAttachmentPreviewUrl = (attachment: TaskAttachment): string | null => {
    if (attachment.attachment_type === 'url') {
      return null; // URLs don't need preview generation
    }
    if (attachment.file_type?.startsWith('image/') && attachment.file_path) {
      const { data } = supabase.storage
        .from('task-attachments')
        .getPublicUrl(attachment.file_path);
      console.log('Preview URL for', attachment.file_name, ':', data.publicUrl);
      return data.publicUrl;
    }
    return null;
  };

  const handleDownloadAttachment = async (attachment: TaskAttachment) => {
    if (attachment.attachment_type === 'url' && attachment.attachment_url) {
      window.open(attachment.attachment_url, '_blank');
      return;
    }

    if (!attachment.file_path) return;

    try {
      const { data, error } = await supabase.storage
        .from('task-attachments')
        .download(attachment.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      toast.error('Failed to download file');
    }
  };

  const getFileIcon = (attachment: TaskAttachment) => {
    if (attachment.attachment_type === 'url') {
      return <Link className="h-4 w-4" />;
    }
    if (attachment.file_type?.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          Attachments ({attachments.length})
        </Label>
        {allowUpload && taskId && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => document.getElementById(inputId)?.click()}
            >
              {uploading ? 'Uploading...' : 'Add Files'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowUrlDialog(true)}
            >
              Add Link
            </Button>
          </div>
        )}
      </div>

      <input
        id={inputId}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
        onChange={handleFileUpload}
        className="hidden"
      />

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => {
            const previewUrl = getAttachmentPreviewUrl(attachment);
            return (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {previewUrl ? (
                    <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 border">
                      <img 
                        src={previewUrl} 
                        alt={attachment.file_name}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(previewUrl, '_blank')}
                      />
                    </div>
                  ) : (
                    <div className="text-muted-foreground flex-shrink-0">
                      {getFileIcon(attachment)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {attachment.attachment_type === 'url' && attachment.attachment_url ? (
                        <a 
                          href={attachment.attachment_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {attachment.url_title || attachment.file_name}
                        </a>
                      ) : (
                        attachment.file_name
                      )}
                    </p>
                    {attachment.attachment_type === 'file' && (
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.file_size || 0)}
                      </p>
                    )}
                    {attachment.attachment_type === 'url' && (
                      <p className="text-xs text-muted-foreground truncate">
                        {attachment.attachment_url}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadAttachment(attachment)}
                    title={attachment.attachment_type === 'url' ? 'Open link' : 'Download file'}
                  >
                    {attachment.attachment_type === 'url' ? (
                      <Link className="h-4 w-4" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                  {allowUpload && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAttachment(attachment)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* URL Dialog */}
      <Dialog open={showUrlDialog} onOpenChange={setShowUrlDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url-title">Title (optional)</Label>
              <Input
                id="url-title"
                placeholder="Link description"
                value={urlTitle}
                onChange={(e) => setUrlTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUrlDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUrl}>
              Add Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
