import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GitBranch, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

interface GitHubBranchesViewerProps {
  defaultRepo?: string;
}

export const GitHubBranchesViewer: React.FC<GitHubBranchesViewerProps> = ({ defaultRepo }) => {
  const [repoUrl, setRepoUrl] = useState(defaultRepo || '');
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseGitHubUrl = (url: string): { owner: string; repo: string } | null => {
    try {
      // Support formats: https://github.com/owner/repo or owner/repo
      const match = url.match(/(?:https?:\/\/github\.com\/)?([^\/]+)\/([^\/\s]+)/);
      if (match) {
        return { owner: match[1], repo: match[2].replace('.git', '') };
      }
      return null;
    } catch {
      return null;
    }
  };

  const fetchBranches = async () => {
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      setError('Invalid GitHub URL. Use format: owner/repo or https://github.com/owner/repo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/branches`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Repository not found. Check the URL and ensure the repository is public.');
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data: GitHubBranch[] = await response.json();
      setBranches(data);
      toast.success(`Found ${data.length} branch${data.length !== 1 ? 'es' : ''}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch branches';
      setError(errorMessage);
      toast.error(errorMessage);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (defaultRepo) {
      fetchBranches();
    }
  }, []);

  const handleRefresh = () => {
    if (repoUrl) {
      fetchBranches();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          GitHub Branches
        </CardTitle>
        <CardDescription>
          View all branches from a GitHub repository
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Repository Input */}
        <div className="flex gap-2">
          <Input
            placeholder="owner/repo or https://github.com/owner/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                fetchBranches();
              }
            }}
          />
          <Button onClick={fetchBranches} disabled={loading || !repoUrl}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading
              </>
            ) : (
              'Fetch'
            )}
          </Button>
          {branches.length > 0 && (
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Branches List */}
        {branches.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {branches.length} branch{branches.length !== 1 ? 'es' : ''} found
              </span>
            </div>
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {branches.map((branch) => (
                <div
                  key={branch.name}
                  className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <GitBranch className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-sm truncate">{branch.name}</span>
                    {branch.protected && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Protected
                      </Badge>
                    )}
                    {branch.name === 'main' || branch.name === 'master' && (
                      <Badge className="ml-2 text-xs bg-primary/10 text-primary">
                        Default
                      </Badge>
                    )}
                  </div>
                  <a
                    href={branch.commit.url.replace('api.github.com/repos', 'github.com').replace('/commits/', '/commit/')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 flex-shrink-0"
                  >
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && branches.length === 0 && repoUrl && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No branches found. Try fetching from a repository.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
