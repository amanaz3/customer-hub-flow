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
    const { parentTaskId } = await req.json();
    
    if (!parentTaskId) {
      throw new Error('parentTaskId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all child tasks (recursive) under the parent
    const { data: allTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('id, title, description, importance, parent_id')
      .order('created_at', { ascending: true });

    if (fetchError) throw fetchError;

    // Find all descendants of the parent task
    const getDescendants = (parentId: string, tasks: any[]): any[] => {
      const children = tasks.filter(t => t.parent_id === parentId);
      let descendants = [...children];
      for (const child of children) {
        descendants = [...descendants, ...getDescendants(child.id, tasks)];
      }
      return descendants;
    };

    const childTasks = getDescendants(parentTaskId, allTasks || []);
    
    // Filter tasks that need importance assignment (no importance set)
    const tasksToAnalyze = childTasks.filter(t => !t.importance);

    if (tasksToAnalyze.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'All tasks already have importance assigned',
        updated: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Analyzing ${tasksToAnalyze.length} tasks for importance assignment`);

    // Prepare task summaries for AI
    const taskSummaries = tasksToAnalyze.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description || 'No description'
    }));

    // Call AI to analyze and assign importance
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a task prioritization expert for a CRM development project. Analyze each task and assign an importance level based on the title and description.

Importance levels:
- "must": Critical bugs, security issues, data integrity problems, blocking issues that prevent core functionality
- "should": Important features, significant UX improvements, performance issues affecting users
- "good-to-have": Nice improvements, minor enhancements, code quality improvements
- "nice-to-have": Polish items, minor UI tweaks, documentation, low-impact changes

Guidelines:
- Anything with "bug", "fix", "error", "crash", "broken" that affects core functionality = must
- Anything with "security", "data loss", "critical" = must
- Performance improvements, important UX fixes = should
- New features that enhance but don't block = good-to-have
- Minor polish, optional improvements = nice-to-have

Return a JSON array with objects containing "id" and "importance" for each task.`
          },
          {
            role: 'user',
            content: `Analyze these tasks and assign importance levels:\n\n${JSON.stringify(taskSummaries, null, 2)}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'assign_importance',
              description: 'Assign importance levels to tasks',
              parameters: {
                type: 'object',
                properties: {
                  assignments: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', description: 'Task ID' },
                        importance: { 
                          type: 'string', 
                          enum: ['must', 'should', 'good-to-have', 'nice-to-have'],
                          description: 'Assigned importance level'
                        },
                        reason: { type: 'string', description: 'Brief reason for assignment' }
                      },
                      required: ['id', 'importance']
                    }
                  }
                },
                required: ['assignments']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'assign_importance' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData, null, 2));

    // Extract assignments from tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const assignments = JSON.parse(toolCall.function.arguments).assignments;
    console.log(`Received ${assignments.length} importance assignments`);

    // Update tasks with assigned importance
    let updatedCount = 0;
    const results = [];

    for (const assignment of assignments) {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ importance: assignment.importance })
        .eq('id', assignment.id);

      if (updateError) {
        console.error(`Failed to update task ${assignment.id}:`, updateError);
        results.push({ id: assignment.id, success: false, error: updateError.message });
      } else {
        updatedCount++;
        results.push({ 
          id: assignment.id, 
          success: true, 
          importance: assignment.importance,
          reason: assignment.reason 
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Updated ${updatedCount} of ${tasksToAnalyze.length} tasks`,
      updated: updatedCount,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in assign-task-importance:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
