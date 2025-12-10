import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Save, 
  Trash2, 
  GitBranch,
  Circle,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScriptNode {
  id: string;
  stage_id: string;
  parent_id: string | null;
  node_type: 'root' | 'branch' | 'leaf';
  script_text: string;
  trigger_condition: string | null;
  order_index: number;
  metadata: Record<string, any>;
}

interface DecisionTreeVisualizerProps {
  nodes: ScriptNode[];
  stageId: string;
  onUpdate: (stageId: string, nodeId: string, updates: Partial<ScriptNode>) => void;
  onSave: (node: ScriptNode) => void;
  onDelete: (stageId: string, nodeId: string) => void;
  onAddChild: (stageId: string, parentId: string | null) => void;
}

interface TreeNodeProps {
  node: ScriptNode;
  allNodes: ScriptNode[];
  stageId: string;
  onUpdate: (stageId: string, nodeId: string, updates: Partial<ScriptNode>) => void;
  onSave: (node: ScriptNode) => void;
  onDelete: (stageId: string, nodeId: string) => void;
  onAddChild: (stageId: string, parentId: string) => void;
  level: number;
  isLast: boolean;
  parentLines: boolean[];
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  allNodes,
  stageId,
  onUpdate,
  onSave,
  onDelete,
  onAddChild,
  level,
  isLast,
  parentLines
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const childNodes = allNodes.filter(n => n.parent_id === node.id).sort((a, b) => a.order_index - b.order_index);
  const hasChildren = childNodes.length > 0;
  const isRoot = !node.parent_id;

  const getNodeColor = () => {
    if (isRoot) return 'bg-primary text-primary-foreground';
    if (childNodes.length === 0) return 'bg-accent text-accent-foreground';
    return 'bg-secondary text-secondary-foreground';
  };

  const getNodeIcon = () => {
    if (isRoot) return <Circle className="h-3 w-3 fill-current" />;
    if (childNodes.length === 0) return <MessageSquare className="h-3 w-3" />;
    return <GitBranch className="h-3 w-3" />;
  };

  return (
    <div className="relative">
      {/* Vertical lines from parent levels */}
      {level > 0 && parentLines.map((showLine, idx) => (
        showLine && (
          <div
            key={idx}
            className="absolute border-l-2 border-border"
            style={{
              left: `${idx * 32 + 12}px`,
              top: 0,
              bottom: 0
            }}
          />
        )
      ))}

      {/* Horizontal connector line */}
      {level > 0 && (
        <div 
          className="absolute border-t-2 border-border"
          style={{
            left: `${(level - 1) * 32 + 12}px`,
            top: '20px',
            width: '20px'
          }}
        />
      )}

      {/* Vertical line to this node (if not last) */}
      {level > 0 && !isLast && (
        <div 
          className="absolute border-l-2 border-border"
          style={{
            left: `${(level - 1) * 32 + 12}px`,
            top: '20px',
            bottom: 0
          }}
        />
      )}

      {/* Corner for last child */}
      {level > 0 && isLast && (
        <div 
          className="absolute border-l-2 border-b-2 border-border rounded-bl-md"
          style={{
            left: `${(level - 1) * 32 + 12}px`,
            top: 0,
            height: '22px',
            width: '8px'
          }}
        />
      )}

      <div 
        className="flex items-start gap-2 py-2"
        style={{ paddingLeft: `${level * 32}px` }}
      >
        {/* Expand/Collapse button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            <span className="h-4 w-4" />
          )}
        </Button>

        {/* Node card */}
        <div 
          className={cn(
            "flex-1 rounded-lg border shadow-sm transition-all",
            isEditing ? "ring-2 ring-primary" : "hover:shadow-md"
          )}
        >
          {/* Node header */}
          <div 
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-t-lg cursor-pointer",
              getNodeColor()
            )}
            onClick={() => setIsEditing(!isEditing)}
          >
            {getNodeIcon()}
            <span className="text-xs font-medium uppercase tracking-wide">
              {isRoot ? 'Start' : node.node_type === 'leaf' ? 'Response' : 'Branch'}
            </span>
            {node.trigger_condition && (
              <Badge variant="outline" className="ml-auto text-xs bg-background/20 border-current/20">
                {node.trigger_condition.length > 30 
                  ? node.trigger_condition.substring(0, 30) + '...' 
                  : node.trigger_condition}
              </Badge>
            )}
            {!node.trigger_condition && !isRoot && (
              <Badge variant="outline" className="ml-auto text-xs bg-background/20 border-current/20 opacity-50">
                No trigger
              </Badge>
            )}
          </div>

          {/* Node content preview (collapsed) */}
          {!isEditing && (
            <div className="px-3 py-2 bg-card text-sm text-muted-foreground rounded-b-lg">
              {node.script_text 
                ? (node.script_text.length > 100 
                    ? node.script_text.substring(0, 100) + '...' 
                    : node.script_text)
                : <span className="italic opacity-50">No script text</span>
              }
            </div>
          )}

          {/* Node editor (expanded) */}
          {isEditing && (
            <div className="p-3 bg-card space-y-3 rounded-b-lg">
              {!isRoot && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Trigger Condition
                  </label>
                  <Input
                    placeholder="When customer says..."
                    value={node.trigger_condition || ''}
                    onChange={(e) => onUpdate(stageId, node.id, { trigger_condition: e.target.value })}
                    className="text-sm"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Script / Response
                </label>
                <Textarea
                  placeholder="What to say..."
                  value={node.script_text}
                  onChange={(e) => onUpdate(stageId, node.id, { script_text: e.target.value })}
                  className="min-h-[80px] text-sm"
                />
              </div>
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button size="sm" onClick={() => onSave(node)}>
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => onAddChild(stageId, node.id)}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Branch
                </Button>
                <Button size="sm" variant="ghost" className="ml-auto text-destructive" onClick={() => onDelete(stageId, node.id)}>
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Child nodes */}
      {isExpanded && childNodes.map((child, idx) => (
        <TreeNode
          key={child.id}
          node={child}
          allNodes={allNodes}
          stageId={stageId}
          onUpdate={onUpdate}
          onSave={onSave}
          onDelete={onDelete}
          onAddChild={onAddChild}
          level={level + 1}
          isLast={idx === childNodes.length - 1}
          parentLines={[...parentLines, !isLast]}
        />
      ))}
    </div>
  );
};

const DecisionTreeVisualizer: React.FC<DecisionTreeVisualizerProps> = ({
  nodes,
  stageId,
  onUpdate,
  onSave,
  onDelete,
  onAddChild
}) => {
  const rootNodes = nodes.filter(n => !n.parent_id).sort((a, b) => a.order_index - b.order_index);

  if (rootNodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg bg-muted/20">
        <GitBranch className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-3">No decision tree nodes yet</p>
        <Button size="sm" onClick={() => onAddChild(stageId, null)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Root Node
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 pb-3 border-b text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>Start</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-secondary" />
          <span>Branch</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <span>Response</span>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          className="ml-auto"
          onClick={() => onAddChild(stageId, null)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Root
        </Button>
      </div>

      {/* Tree */}
      <div className="space-y-1">
        {rootNodes.map((node, idx) => (
          <TreeNode
            key={node.id}
            node={node}
            allNodes={nodes}
            stageId={stageId}
            onUpdate={onUpdate}
            onSave={onSave}
            onDelete={onDelete}
            onAddChild={onAddChild}
            level={0}
            isLast={idx === rootNodes.length - 1}
            parentLines={[]}
          />
        ))}
      </div>
    </div>
  );
};

export default DecisionTreeVisualizer;
