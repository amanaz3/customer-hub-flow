import React, { useState } from 'react';
import { Target, Users, Shield, Trophy, AlertTriangle, Lightbulb, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface QuickReferencePanelProps {
  className?: string;
}

const QuickReferencePanel = ({ className }: QuickReferencePanelProps) => {
  const [activeTab, setActiveTab] = useState("stages");

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-1 h-auto mb-4 p-1.5 bg-muted/50">
          <TabsTrigger value="stages" className="text-xs">Stages</TabsTrigger>
          <TabsTrigger value="assessment" className="text-xs">Assessment</TabsTrigger>
          <TabsTrigger value="personality" className="text-xs">Personality</TabsTrigger>
          <TabsTrigger value="objections" className="text-xs">Objections</TabsTrigger>
          <TabsTrigger value="closing" className="text-xs">Closing</TabsTrigger>
          <TabsTrigger value="prep" className="text-xs">Prep</TabsTrigger>
          <TabsTrigger value="faqs" className="text-xs">FAQs</TabsTrigger>
          <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[calc(100vh-200px)]">
          {/* STAGES TAB */}
          <TabsContent value="stages" className="space-y-4 pr-4">
            <div className="p-4 rounded-lg bg-background/50 border">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                5-Stage Sales Framework
              </h4>
              <div className="space-y-3">
                {[
                  { stage: "1. Opening", time: "30-60 sec", goal: "Capture attention, establish relevance", tips: "Personalized hook, state purpose clearly, ask permission to continue" },
                  { stage: "2. Discovery", time: "5-10 min", goal: "Understand needs, pain, budget, timeline", tips: "Open questions, active listening, SPIN technique" },
                  { stage: "3. Presentation", time: "3-5 min", goal: "Match solution to discovered needs", tips: "Focus on benefits not features, use their language" },
                  { stage: "4. Objection Handling", time: "2-5 min", goal: "Address concerns, build confidence", tips: "LAER framework, never argue, empathize first" },
                  { stage: "5. Closing", time: "2-3 min", goal: "Secure commitment, next steps", tips: "Assumptive close, summary close, clear call-to-action" }
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded bg-muted/50 border-l-4 border-primary/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{item.stage}</span>
                      <Badge variant="outline" className="text-xs">{item.time}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1"><strong>Goal:</strong> {item.goal}</p>
                    <p className="text-xs text-muted-foreground"><strong>Tips:</strong> {item.tips}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <h4 className="font-semibold mb-2 text-amber-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                When Client Skips Stages
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Jumps to price:</strong> "Great question! To give you an accurate quote, can I ask a few quick questions first?"</li>
                <li>• <strong>Wants to buy immediately:</strong> Confirm needs briefly, then proceed to close</li>
                <li>• <strong>Asks technical questions:</strong> Answer briefly, then return to discovery</li>
                <li>• <strong>Says they're in a hurry:</strong> "I respect your time. What's the ONE thing you need to know?"</li>
              </ul>
            </div>
          </TabsContent>

          {/* ASSESSMENT TAB */}
          <TabsContent value="assessment" className="space-y-4 pr-4">
            <div className="p-4 rounded-lg bg-background/50 border">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                BANT Framework
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { letter: "B", title: "Budget", question: "What budget have you allocated for this?", tip: "If unknown, ask about similar past investments" },
                  { letter: "A", title: "Authority", question: "Who else is involved in this decision?", tip: "Map all stakeholders early" },
                  { letter: "N", title: "Need", question: "What problem are you trying to solve?", tip: "Dig into the pain - what happens if they don't solve it?" },
                  { letter: "T", title: "Timeline", question: "When do you need this by?", tip: "Understand urgency drivers" }
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">{item.letter}</span>
                      <span className="font-medium text-sm">{item.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground italic mb-1">"{item.question}"</p>
                    <p className="text-xs text-muted-foreground">{item.tip}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-background/50 border">
              <h4 className="font-semibold mb-3">Pain Assessment Questions</h4>
              <div className="space-y-2">
                {[
                  "What's the biggest challenge you're facing with [area]?",
                  "How long has this been a problem?",
                  "What have you tried so far to solve it?",
                  "What happens if you don't fix this in the next 6 months?",
                  "On a scale of 1-10, how urgent is solving this?"
                ].map((q, i) => (
                  <div key={i} className="p-2 rounded bg-muted/30 text-sm text-muted-foreground">
                    {i + 1}. {q}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* PERSONALITY TAB */}
          <TabsContent value="personality" className="space-y-4 pr-4">
            <div className="p-4 rounded-lg bg-background/50 border">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                DISC Personality Types
              </h4>
              <div className="space-y-3">
                <div className="p-3 rounded bg-red-500/10 border border-red-500/20">
                  <p className="font-semibold text-red-600 mb-1">D - Dominant</p>
                  <p className="text-xs text-muted-foreground mb-2">Fast-paced, results-oriented, direct</p>
                  <p className="text-xs"><strong>Signs:</strong> Interrupts, wants bottom line, impatient</p>
                  <p className="text-xs"><strong>Approach:</strong> Be direct, focus on results, skip small talk</p>
                </div>
                <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/20">
                  <p className="font-semibold text-yellow-600 mb-1">I - Influencer</p>
                  <p className="text-xs text-muted-foreground mb-2">Enthusiastic, optimistic, collaborative</p>
                  <p className="text-xs"><strong>Signs:</strong> Talks a lot, personal stories, expressive</p>
                  <p className="text-xs"><strong>Approach:</strong> Be friendly, share stories, show enthusiasm</p>
                </div>
                <div className="p-3 rounded bg-green-500/10 border border-green-500/20">
                  <p className="font-semibold text-green-600 mb-1">S - Steady</p>
                  <p className="text-xs text-muted-foreground mb-2">Patient, reliable, team-oriented</p>
                  <p className="text-xs"><strong>Signs:</strong> Asks about process, mentions team, cautious</p>
                  <p className="text-xs"><strong>Approach:</strong> Be patient, provide assurance, no pressure</p>
                </div>
                <div className="p-3 rounded bg-blue-500/10 border border-blue-500/20">
                  <p className="font-semibold text-blue-600 mb-1">C - Conscientious</p>
                  <p className="text-xs text-muted-foreground mb-2">Analytical, detail-oriented, accurate</p>
                  <p className="text-xs"><strong>Signs:</strong> Many questions, wants data, methodical</p>
                  <p className="text-xs"><strong>Approach:</strong> Provide details, facts, proof, be precise</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* OBJECTIONS TAB */}
          <TabsContent value="objections" className="space-y-4 pr-4">
            <div className="p-4 rounded-lg bg-background/50 border">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-500" />
                LAER Framework
              </h4>
              <div className="space-y-2">
                {[
                  { letter: "L", title: "Listen", desc: "Let them finish completely. Don't interrupt." },
                  { letter: "A", title: "Acknowledge", desc: "\"I understand...\" or \"That's a fair concern...\"" },
                  { letter: "E", title: "Explore", desc: "\"Help me understand - is it the price or value?\"" },
                  { letter: "R", title: "Respond", desc: "Address the real concern with relevant info." }
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded bg-muted/50 flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 text-sm">{item.letter}</span>
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-background/50 border">
              <h4 className="font-semibold mb-3">Common Objections</h4>
              <div className="space-y-2">
                {[
                  { obj: "Too expensive", resp: "Compared to what? Let me show the ROI..." },
                  { obj: "Need to think", resp: "What specifically - price, timing, or service?" },
                  { obj: "Send info", resp: "Happy to! What would you be looking for?" },
                  { obj: "Happy with current", resp: "Great! Anything you wish was different?" }
                ].map((item, i) => (
                  <div key={i} className="p-2 rounded bg-muted/30">
                    <p className="text-xs font-medium text-red-500">❌ "{item.obj}"</p>
                    <p className="text-xs text-muted-foreground">✓ {item.resp}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* CLOSING TAB */}
          <TabsContent value="closing" className="space-y-4 pr-4">
            <div className="p-4 rounded-lg bg-background/50 border">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-purple-500" />
                6 Closing Techniques
              </h4>
              <div className="space-y-2">
                {[
                  { name: "Assumptive", desc: "\"Shall I set you up with standard or premium?\"" },
                  { name: "Summary", desc: "\"So you get X, Y, Z - shall we proceed?\"" },
                  { name: "Urgency", desc: "\"This rate is only available until Friday.\"" },
                  { name: "Alternative", desc: "\"Start this month or next?\"" },
                  { name: "Direct", desc: "\"Are you ready to move forward?\"" },
                  { name: "Trial", desc: "\"How does that sound so far?\"" }
                ].map((item, i) => (
                  <div key={i} className="p-2 rounded bg-muted/50 border-l-4 border-purple-500/50">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <h4 className="font-semibold mb-2 text-green-600">Buying Signals</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• "What happens next?"</li>
                <li>• "How soon can we start?"</li>
                <li>• Asking detailed questions</li>
                <li>• Discussing implementation</li>
              </ul>
            </div>
          </TabsContent>

          {/* PREP TAB */}
          <TabsContent value="prep" className="space-y-4 pr-4">
            <div className="p-4 rounded-lg bg-background/50 border">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Pre-Call Checklist
              </h4>
              <div className="space-y-1">
                {[
                  "Review client info/history",
                  "Prepare 3 opening hooks",
                  "List 5 discovery questions",
                  "Know pricing & discounts",
                  "Prepare for objections",
                  "Set clear call objective"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-3 h-3 rounded border border-muted-foreground/30 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-background/50 border">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                Post-Call Checklist
              </h4>
              <div className="space-y-1">
                {[
                  "Update CRM with notes",
                  "Send materials within 1 hour",
                  "Schedule follow-up task",
                  "Rate call (1-10) & reflect",
                  "Note what worked/improve"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-3 h-3 rounded border border-muted-foreground/30 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* FAQS TAB */}
          <TabsContent value="faqs" className="space-y-4 pr-4">
            <Tabs defaultValue="outbound" className="w-full">
              <TabsList className="h-auto p-1 bg-muted/30 w-full">
                <TabsTrigger value="outbound" className="text-[10px] flex-1">Outbound</TabsTrigger>
                <TabsTrigger value="inbound" className="text-[10px] flex-1">Inbound</TabsTrigger>
                <TabsTrigger value="followup" className="text-[10px] flex-1">Follow-up</TabsTrigger>
              </TabsList>
              <TabsContent value="outbound" className="mt-3 space-y-2">
                {[
                  { q: "Get past gatekeepers?", a: "Be confident & specific. \"Calling regarding [topic] for [Name].\"" },
                  { q: "Not interested?", a: "\"Is it timing or does [problem] not resonate?\"" },
                  { q: "How many follow-ups?", a: "5-7 touches. Vary channels, space 2-3 days." }
                ].map((item, i) => (
                  <div key={i} className="p-2 rounded bg-muted/30">
                    <p className="font-medium text-xs text-primary">Q: {item.q}</p>
                    <p className="text-xs text-muted-foreground">A: {item.a}</p>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="inbound" className="mt-3 space-y-2">
                {[
                  { q: "Price immediately?", a: "\"Pricing depends on needs. Quick questions first?\"" },
                  { q: "Comparison shoppers?", a: "\"What criteria are most important to you?\"" },
                  { q: "Ready but won't commit?", a: "\"Something's holding you back. What is it?\"" }
                ].map((item, i) => (
                  <div key={i} className="p-2 rounded bg-muted/30">
                    <p className="font-medium text-xs text-primary">Q: {item.q}</p>
                    <p className="text-xs text-muted-foreground">A: {item.a}</p>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="followup" className="mt-3 space-y-2">
                {[
                  { q: "No email response?", a: "Try voice message or LinkedIn." },
                  { q: "How long to wait?", a: "Initial: 24-48h. Proposal: 2-3 days. Then weekly." },
                  { q: "Gone quiet?", a: "\"Should I close this file or catch up next week?\"" }
                ].map((item, i) => (
                  <div key={i} className="p-2 rounded bg-muted/30">
                    <p className="font-medium text-xs text-primary">Q: {item.q}</p>
                    <p className="text-xs text-muted-foreground">A: {item.a}</p>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* NOTES TAB */}
          <TabsContent value="notes" className="space-y-4 pr-4">
            <div className="p-4 rounded-lg bg-background/50 border">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                How to Use
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>Before calls:</strong> Review Prep & Stages</li>
                <li>• <strong>During calls:</strong> Keep Objections open</li>
                <li>• <strong>After calls:</strong> Reflect with Assessment</li>
                <li>• <strong>Weekly:</strong> Deep-dive one tab</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <h4 className="font-semibold mb-2 text-amber-600 text-sm">Remember</h4>
              <p className="text-xs text-muted-foreground">
                This is a reference, not a script. Internalize frameworks, then adapt naturally to each conversation.
              </p>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default QuickReferencePanel;
