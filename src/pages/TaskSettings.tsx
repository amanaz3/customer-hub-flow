import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, GitBranch } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  github_repo: string | null;
  status: string;
}

const TaskSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGitHubRepo = async (projectId: string, githubRepo: string) => {
    setSaving(projectId);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ github_repo: githubRepo || null })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "GitHub repository updated successfully",
      });

      // Update local state
      setProjects(projects.map(p => 
        p.id === projectId ? { ...p, github_repo: githubRepo || null } : p
      ));
    } catch (error) {
      console.error('Error updating GitHub repo:', error);
      toast({
        title: "Error",
        description: "Failed to update GitHub repository",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const handleRepoChange = (projectId: string, value: string) => {
    setProjects(projects.map(p => 
      p.id === projectId ? { ...p, github_repo: value } : p
    ));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/configure')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Task Settings</h1>
          <p className="text-muted-foreground">Configure GitHub repositories and project settings</p>
        </div>
      </div>

      <div className="space-y-4">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No projects found. Create a project first.</p>
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-primary" />
                  {project.name}
                </CardTitle>
                {project.description && (
                  <CardDescription>{project.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`repo-${project.id}`}>
                      GitHub Repository URL
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={`repo-${project.id}`}
                        placeholder="https://github.com/username/repository"
                        value={project.github_repo || ''}
                        onChange={(e) => handleRepoChange(project.id, e.target.value)}
                      />
                      <Button
                        onClick={() => handleSaveGitHubRepo(project.id, project.github_repo || '')}
                        disabled={saving === project.id}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving === project.id ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Example: https://github.com/your-org/your-repo
                    </p>
                  </div>
                  
                  {project.github_repo && (
                    <div className="rounded-lg border bg-muted/50 p-3">
                      <p className="text-sm font-medium">Current Repository:</p>
                      <a
                        href={project.github_repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {project.github_repo}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskSettings;
