import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/SecureAuthContext';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { TaskAttachments } from './TaskAttachments';
import { Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: () => void;
  projectId?: string;
  productId?: string;
  parentTaskId?: string; // New prop for creating subtasks
}

interface TeamMember {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
}

interface ParentTask {
  id: string;
  title: string;
}

interface Cycle {
  id: string;
  name: string;
  status: string;
}

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onOpenChange,
  onTaskCreated,
  projectId,
  productId,
  parentTaskId,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [parentTasks, setParentTasks] = useState<ParentTask[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'task' as const,
    priority: 'medium' as const,
    status: 'todo' as const,
    assigned_to: '',
    product_id: productId || projectId || '',
    parent_id: parentTaskId || '',
    cycle_id: '',
    module: '',
    category: '',
    mission: '',
    story: '',
    architectural_component: '',
    github_repo: '',
    github_branch: '',
  });

  useEffect(() => {
    if (open) {
      fetchTeamMembers();
      fetchProducts();
      fetchParentTasks();
      fetchCycles();
    }
  }, [open]);

  const fetchTeamMembers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    
    if (data) setTeamMembers(data);
  };

  const fetchProducts = async () => {
    try {
      // Still querying 'projects' table since database hasn't been migrated yet
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .in('status', ['planning', 'active'])
        .order('name');
      
      if (data && !error) {
        setProducts(data as unknown as Product[]);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchParentTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title')
        .order('title');
      
      if (data && !error) {
        setParentTasks(data as ParentTask[]);
      }
    } catch (err) {
      console.error('Error fetching parent tasks:', err);
    }
  };

  const fetchCycles = async () => {
    try {
      const { data, error } = await supabase
        .from('cycles')
        .select('id, name, status')
        .in('status', ['planning', 'active'])
        .order('start_date', { ascending: false });
      
      if (data && !error) {
        setCycles(data as Cycle[]);
      }
    } catch (err) {
      console.error('Error fetching cycles:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title.trim()) return;

    setLoading(true);
    try {
      // Create task first
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert([{
          title: formData.title.trim(),
          description: formData.description || null,
          type: formData.type,
          priority: formData.priority,
          status: formData.status,
          assigned_to: formData.assigned_to === 'unassigned' ? null : formData.assigned_to || null,
          project_id: productId ? productId : projectId ? projectId : (formData.product_id === 'none' ? null : formData.product_id || null),
          parent_id: formData.parent_id || null,
          module: formData.module || null,
          category: formData.category || null,
          mission: formData.mission || null,
          story: formData.story || null,
          architectural_component: formData.architectural_component || null,
          github_repo: formData.github_repo || null,
          github_branch: formData.github_branch || null,
          created_by: user.id,
        }])
        .select()
        .single();

      if (taskError) throw taskError;

      // Upload attachments if any
      if (uploadedFiles.length > 0 && taskData) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-powerpoint'];
        
        for (const file of uploadedFiles) {
          if (!allowedTypes.includes(file.type)) continue;
          if (file.size > 10 * 1024 * 1024) continue;

          const fileExt = file.name.split('.').pop();
          const fileName = `${taskData.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('task-attachments')
            .upload(fileName, file);

          if (!uploadError) {
            await supabase.from('task_attachments').insert({
              task_id: taskData.id,
              file_name: file.name,
              file_path: fileName,
              file_size: file.size,
              file_type: file.type,
              uploaded_by: user.id,
            });
          }
        }
      }

      toast.success('Task created successfully');
      onTaskCreated();
      onOpenChange(false);
      setFormData({
        title: '',
        description: '',
        type: 'task',
        priority: 'medium',
        status: 'todo',
        assigned_to: '',
        product_id: productId || projectId || '',
        parent_id: parentTaskId || '',
        cycle_id: '',
        module: '',
        category: '',
        mission: '',
        story: '',
        architectural_component: '',
        github_repo: '',
        github_branch: '',
      });
      setUploadedFiles([]);
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const getFilePreview = (file: File): string | null => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-powerpoint'];
    const validFiles: File[] = [];

      Array.from(files).forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File type not allowed: ${file.name}. Supported: Images, PDF, Word, Excel, PowerPoint.`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File too large (max 10MB): ${file.name}`);
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...validFiles]);
      toast.success(`${validFiles.length} file(s) selected`);
    }
    
    // Reset input to allow selecting the same file again
    event.target.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task for your team
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="title" className="text-sm">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Task title..."
              required
              className="h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as any })}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="feature">Feature</SelectItem>
                  <SelectItem value="enhancement">Enhancement</SelectItem>
                  <SelectItem value="system_issue">System Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Priority</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v as any })}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as any })}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Assign To</Label>
              <Select value={formData.assigned_to || 'unassigned'} onValueChange={(v) => setFormData({ ...formData, assigned_to: v === 'unassigned' ? '' : v })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!projectId && !productId && (
            <div className="space-y-1">
              <Label className="text-sm">Product</Label>
              <Select value={formData.product_id || 'none'} onValueChange={(v) => setFormData({ ...formData, product_id: v === 'none' ? '' : v })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="No product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No product</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Parent Task Selection - Only show if not already a subtask */}
          {!parentTaskId && (
            <div className="space-y-1">
              <Label className="text-sm">Parent Task (Optional)</Label>
              <Select value={formData.parent_id || 'none'} onValueChange={(v) => setFormData({ ...formData, parent_id: v === 'none' ? '' : v })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="No parent - main task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent - main task</SelectItem>
                  {parentTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Cycle Selection */}
          <div className="space-y-1">
            <Label className="text-sm">Cycle (Optional)</Label>
            <Select value={formData.cycle_id || 'none'} onValueChange={(v) => setFormData({ ...formData, cycle_id: v === 'none' ? '' : v })}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="No cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No cycle</SelectItem>
                {cycles.map((cycle) => (
                  <SelectItem key={cycle.id} value={cycle.id}>
                    {cycle.name} {cycle.status === 'active' && '(Active)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">Module</Label>
              <Select value={formData.module} onValueChange={(v) => setFormData({ ...formData, module: v })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cases">Cases</SelectItem>
                  <SelectItem value="products">Products</SelectItem>
                  <SelectItem value="notifications">Notifications</SelectItem>
                  <SelectItem value="customers">Customers</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="reports">Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Architecture</Label>
              <Select value={formData.architectural_component} onValueChange={(v) => setFormData({ ...formData, architectural_component: v })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frontend">Frontend</SelectItem>
                  <SelectItem value="backend">Backend</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="component_service">Component/Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-sm">Category</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="usability_testing">Usability Testing</SelectItem>
                <SelectItem value="code_review">Code Review</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="testing">Testing</SelectItem>
                <SelectItem value="documentation">Documentation</SelectItem>
                <SelectItem value="bug_fix">Bug Fix</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="mission" className="text-sm">Mission</Label>
            <Input
              id="mission"
              value={formData.mission}
              onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
              placeholder="High-level goal..."
              className="h-9"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="story" className="text-sm">Story</Label>
            <Textarea
              id="story"
              value={formData.story}
              onChange={(e) => setFormData({ ...formData, story: e.target.value })}
              placeholder="As a [user], I want to [action]..."
              rows={2}
              className="text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="description" className="text-sm">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add details..."
              rows={2}
              className="text-sm"
            />
          </div>

          {/* GitHub Information */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="github_repo" className="text-sm">GitHub Project</Label>
              <Input
                id="github_repo"
                value={formData.github_repo}
                onChange={(e) => setFormData({ ...formData, github_repo: e.target.value })}
                placeholder="e.g., lovable-crm"
                className="h-9"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="github_branch" className="text-sm">GitHub Branch</Label>
              <Input
                id="github_branch"
                value={formData.github_branch}
                onChange={(e) => setFormData({ ...formData, github_branch: e.target.value })}
                placeholder="e.g., main, feature/xyz"
                className="h-9"
              />
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Paperclip className="h-4 w-4" />
              Attachments ({uploadedFiles.length})
            </Label>
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const input = document.getElementById('create-task-file-upload') as HTMLInputElement;
                  if (input) input.click();
                }}
                className="w-full"
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Add Files (Images & PDFs)
              </Button>
              <input
                id="create-task-file-upload"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => {
                    const preview = getFilePreview(file);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {preview ? (
                            <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 border">
                              <img 
                                src={preview} 
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="text-muted-foreground flex-shrink-0">
                              <FileText className="h-4 w-4" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
