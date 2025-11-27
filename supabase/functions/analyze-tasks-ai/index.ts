import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rawText, projectId } = await req.json();
    
    if (!rawText) {
      throw new Error('rawText is required');
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const systemPrompt = `You are an expert project manager and task analyzer. Analyze the provided raw text (which may be from WhatsApp, emails, notes, or any format) and extract a structured list of tasks with complete metadata.

For each task, determine:
1. **title**: Clear, concise task title (extract from text)
2. **description**: Detailed description if available
3. **type**: One of: "bug", "feature", "enhancement", "task", "documentation"
4. **importance**: One of: "must", "should", "good", "nice", "none" (based on urgency, impact, and priority indicators)
5. **priority**: One of: "critical", "high", "medium", "low"
6. **module**: Category/module name (e.g., "Authentication", "UI", "Database", "API") - infer from context
7. **parentTitle**: If this is a subtask, the title of its parent task (null for top-level tasks)
8. **hierarchyLevel**: 0 for top-level, 1 for first-level subtasks, 2 for nested subtasks, etc.

Guidelines:
- Detect hierarchy from indentation, bullets, numbers, or contextual grouping
- "bug", "fix", "error", "broken", "crash" → type: "bug", importance: "must" or "should"
- "feature", "add", "implement" → type: "feature", importance: "should" or "good"
- "improve", "enhance", "optimize" → type: "enhancement"
- Security/critical issues → importance: "must", priority: "critical"
- Performance issues → importance: "should", priority: "high"
- Minor polish → importance: "nice", priority: "low"
- Infer modules from task context (e.g., "login screen" → module: "Authentication")
- Group related tasks under logical parent tasks when possible
- If text has no clear hierarchy, create flat list with hierarchyLevel: 0

Return a JSON array of task objects.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this text and extract structured tasks:\n\n${rawText}` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_tasks',
              description: 'Extract and structure tasks from raw text',
              parameters: {
                type: 'object',
                properties: {
                  tasks: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string', description: 'Task title' },
                        description: { type: 'string', description: 'Task description' },
                        type: { 
                          type: 'string', 
                          enum: ['bug', 'feature', 'enhancement', 'task', 'documentation'],
                          description: 'Task type'
                        },
                        importance: {
                          type: 'string',
                          enum: ['must', 'should', 'good', 'nice', 'none'],
                          description: 'Importance level'
                        },
                        priority: {
                          type: 'string',
                          enum: ['critical', 'high', 'medium', 'low'],
                          description: 'Priority level'
                        },
                        module: { type: 'string', description: 'Module/category name' },
                        parentTitle: { type: 'string', description: 'Parent task title if subtask, null otherwise' },
                        hierarchyLevel: { type: 'number', description: 'Hierarchy depth (0 = top-level)' },
                        reasoning: { type: 'string', description: 'Brief explanation of importance/priority assignment' }
                      },
                      required: ['title', 'type', 'importance', 'priority', 'hierarchyLevel']
                    }
                  }
                },
                required: ['tasks']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_tasks' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          success: false 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required. Please add credits to your Lovable AI workspace.',
          success: false 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData, null, 2));

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const { tasks } = JSON.parse(toolCall.function.arguments);
    console.log(`Extracted ${tasks.length} tasks from AI`);

    // Create task hierarchy in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build parent map for creating hierarchy
    const taskMap = new Map<string, string>(); // parentTitle -> taskId

    // Sort tasks by hierarchy level to create parents first
    const sortedTasks = [...tasks].sort((a, b) => a.hierarchyLevel - b.hierarchyLevel);

    const createdTasks = [];

    for (const task of sortedTasks) {
      let parentId: string | null = null;
      
      // Find parent if this is a subtask
      if (task.parentTitle && task.hierarchyLevel > 0) {
        parentId = taskMap.get(task.parentTitle) || null;
      }

      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert({
          title: task.title,
          description: task.description || null,
          type: task.type,
          priority: task.priority,
          importance: task.importance,
          importance_reason: task.reasoning || null,
          module: task.module || null,
          status: 'todo',
          project_id: projectId || null,
          parent_id: parentId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        continue;
      }

      // Store task ID for potential children
      taskMap.set(task.title, newTask.id);
      createdTasks.push(newTask);
    }

    return new Response(JSON.stringify({ 
      success: true,
      tasksCreated: createdTasks.length,
      tasks: createdTasks
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-tasks-ai:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
