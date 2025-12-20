import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Building2,
  Users,
  UserPlus,
  Plus,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Shield,
  Briefcase,
  Settings,
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'approver' | 'data_entry' | 'reviewer' | 'admin';
}

interface Team {
  id: string;
  name: string;
  members: TeamMember[];
  subTeams?: Team[];
}

interface Division {
  id: string;
  name: string;
  icon: string;
  teams: Team[];
  services: string[];
}

const mockDivisions: Division[] = [
  {
    id: '1',
    name: 'Finance',
    icon: 'briefcase',
    teams: [
      {
        id: 't1',
        name: 'Accounts Payable',
        members: [
          { id: 'm1', name: 'John Smith', email: 'john@company.com', role: 'approver' },
          { id: 'm2', name: 'Sarah Jones', email: 'sarah@company.com', role: 'data_entry' },
        ],
        subTeams: [
          {
            id: 'st1',
            name: 'Vendor Management',
            members: [{ id: 'm3', name: 'Mike Brown', email: 'mike@company.com', role: 'reviewer' }],
          },
        ],
      },
      {
        id: 't2',
        name: 'Accounts Receivable',
        members: [
          { id: 'm4', name: 'Emily Davis', email: 'emily@company.com', role: 'approver' },
        ],
      },
    ],
    services: ['Invoice Processing', 'Payment Reconciliation', 'Financial Reporting'],
  },
  {
    id: '2',
    name: 'Legal',
    icon: 'shield',
    teams: [
      {
        id: 't3',
        name: 'Contract Review',
        members: [
          { id: 'm5', name: 'Alex Wilson', email: 'alex@company.com', role: 'approver' },
        ],
      },
    ],
    services: ['Contract Review', 'Compliance Check', 'Legal Documentation'],
  },
  {
    id: '3',
    name: 'Operations',
    icon: 'settings',
    teams: [
      {
        id: 't4',
        name: 'Process Management',
        members: [
          { id: 'm6', name: 'Chris Lee', email: 'chris@company.com', role: 'admin' },
        ],
      },
    ],
    services: ['Process Automation', 'Quality Assurance', 'Resource Planning'],
  },
  {
    id: '4',
    name: 'Tax',
    icon: 'building',
    teams: [
      {
        id: 't5',
        name: 'Tax Compliance',
        members: [
          { id: 'm7', name: 'Pat Morgan', email: 'pat@company.com', role: 'approver' },
        ],
      },
    ],
    services: ['Tax Filing', 'VAT Returns', 'Corporate Tax Planning'],
  },
];

const OrgStructureTab: React.FC = () => {
  const [divisions, setDivisions] = useState<Division[]>(mockDivisions);
  const [expandedDivisions, setExpandedDivisions] = useState<string[]>(['1']);
  const [expandedTeams, setExpandedTeams] = useState<string[]>([]);
  const [isAddDivisionOpen, setIsAddDivisionOpen] = useState(false);
  const [newDivisionName, setNewDivisionName] = useState('');

  const toggleDivision = (id: string) => {
    setExpandedDivisions((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const toggleTeam = (id: string) => {
    setExpandedTeams((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const getRoleBadge = (role: TeamMember['role']) => {
    const colors = {
      approver: 'bg-green-500/10 text-green-500 border-green-500/20',
      data_entry: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      reviewer: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      admin: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    };
    return <Badge className={colors[role]}>{role.replace('_', ' ')}</Badge>;
  };

  const renderTeam = (team: Team, depth = 0) => (
    <div key={team.id} className={`ml-${depth * 4}`}>
      <Collapsible open={expandedTeams.includes(team.id)} onOpenChange={() => toggleTeam(team.id)}>
        <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg">
          <CollapsibleTrigger className="flex items-center gap-2 flex-1">
            {expandedTeams.includes(team.id) ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{team.name}</span>
            <Badge variant="outline" className="ml-2">
              {team.members.length} members
            </Badge>
          </CollapsibleTrigger>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <UserPlus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CollapsibleContent>
          <div className="ml-8 space-y-2 py-2">
            {team.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                {getRoleBadge(member.role)}
              </div>
            ))}
            {team.subTeams?.map((subTeam) => renderTeam(subTeam, depth + 1))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Organizational Structure</h2>
          <p className="text-sm text-muted-foreground">
            Define divisions, teams, roles, and services
          </p>
        </div>
        <Dialog open={isAddDivisionOpen} onOpenChange={setIsAddDivisionOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Division
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Division</DialogTitle>
              <DialogDescription>Create a new organizational division</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Division Name</Label>
                <Input
                  value={newDivisionName}
                  onChange={(e) => setNewDivisionName(e.target.value)}
                  placeholder="e.g., Human Resources"
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select defaultValue="building">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="building">Building</SelectItem>
                    <SelectItem value="briefcase">Briefcase</SelectItem>
                    <SelectItem value="shield">Shield</SelectItem>
                    <SelectItem value="settings">Settings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDivisionOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsAddDivisionOpen(false)}>Create Division</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Divisions List */}
      <div className="grid gap-4">
        {divisions.map((division) => (
          <Card key={division.id}>
            <Collapsible
              open={expandedDivisions.includes(division.id)}
              onOpenChange={() => toggleDivision(division.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CollapsibleTrigger className="flex items-center gap-3 flex-1">
                    {expandedDivisions.includes(division.id) ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-lg">{division.name}</CardTitle>
                      <CardDescription>
                        {division.teams.length} teams · {division.services.length} services
                      </CardDescription>
                    </div>
                  </CollapsibleTrigger>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-1">
                      <Plus className="h-3 w-3" />
                      Team
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {/* Services */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Services</Label>
                    <div className="flex flex-wrap gap-2">
                      {division.services.map((service, idx) => (
                        <Badge key={idx} variant="secondary">
                          {service}
                        </Badge>
                      ))}
                      <Button variant="outline" size="sm" className="h-6 text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        Add Service
                      </Button>
                    </div>
                  </div>

                  {/* Teams */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Teams</Label>
                    <div className="border rounded-lg divide-y">
                      {division.teams.map((team) => renderTeam(team))}
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {/* Service Mapping Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Service Hierarchy
          </CardTitle>
          <CardDescription>
            Services are mapped as: Service → Project → Task → Subtask
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-primary" />
              <span>Service</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-blue-500" />
              <span>Project</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-green-500" />
              <span>Task</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-yellow-500" />
              <span>Subtask</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrgStructureTab;
