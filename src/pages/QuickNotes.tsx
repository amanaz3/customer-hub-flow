import React, { useState } from 'react';
import { ArrowLeft, Brain, Target, Users, Lightbulb, AlertTriangle, BookOpen, CheckCircle2, Trophy, Heart, Shield, Zap, Handshake, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';

const QuickNotes = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("mindset");

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/playbook-editor')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Playbook Editor
        </Button>
      </div>
      
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Lightbulb className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Sales Playbook Guide & Best Practices</h1>
        </div>
        <p className="text-muted-foreground mb-6">Master the art of sales with comprehensive techniques, scripts, and strategies</p>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1.5 bg-muted/50 mb-6">
            <TabsTrigger value="mindset" className="text-xs gap-1">🧠 Mindset</TabsTrigger>
            <TabsTrigger value="opening" className="text-xs gap-1">🚀 Opening</TabsTrigger>
            <TabsTrigger value="trust" className="text-xs gap-1">🤝 Trust</TabsTrigger>
            <TabsTrigger value="stages" className="text-xs">Stages</TabsTrigger>
            <TabsTrigger value="assess" className="text-xs">Assess</TabsTrigger>
            <TabsTrigger value="personality" className="text-xs">Personality</TabsTrigger>
            <TabsTrigger value="objections" className="text-xs">Objections</TabsTrigger>
            <TabsTrigger value="closing" className="text-xs">Closing</TabsTrigger>
            <TabsTrigger value="reluctance" className="text-xs gap-1">💰 Reluctance</TabsTrigger>
            <TabsTrigger value="prep" className="text-xs">Prep</TabsTrigger>
            <TabsTrigger value="faqs" className="text-xs">FAQs</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-280px)]">
            {/* MINDSET TAB */}
            <TabsContent value="mindset" className="space-y-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  The Sales Mindset
                </h3>
                <div className="grid gap-3">
                  {[
                    { title: "Service, Not Selling", desc: "You're helping people solve problems, not pushing products. Shift from 'How can I sell?' to 'How can I help?'" },
                    { title: "Rejection is Redirection", desc: "Every 'no' brings you closer to 'yes'. Top performers embrace rejection as data, not defeat." },
                    { title: "Curiosity Over Pitch", desc: "Be genuinely curious about the client's world. Questions build rapport; monologues break it." },
                    { title: "Confidence Without Arrogance", desc: "Know your value. Believe in your solution. But always remain humble and coachable." },
                    { title: "Long Game Thinking", desc: "Build relationships, not transactions. Today's 'no' can become next quarter's biggest deal." }
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded bg-background/80 border-l-4 border-purple-500/50">
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <h4 className="font-semibold mb-2 text-amber-600">Daily Affirmations</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• "I am here to help, not to sell"</li>
                  <li>• "Every call is an opportunity to learn"</li>
                  <li>• "I provide real value to my clients"</li>
                  <li>• "Rejection makes me stronger"</li>
                </ul>
              </div>
            </TabsContent>

            {/* OPENING TAB */}
            <TabsContent value="opening" className="space-y-4">
              <div className="p-4 rounded-lg bg-background/50 border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  Powerful Opening Lines
                </h3>
                <div className="space-y-3">
                  {[
                    { type: "Permission-Based", example: "Hi [Name], this is [You] from [Company]. Did I catch you at an okay time?", why: "Shows respect, reduces defensiveness" },
                    { type: "Value-First", example: "Hi [Name], we've helped companies like yours reduce [problem] by 40%. Wondered if that's relevant to you?", why: "Leads with benefit, creates curiosity" },
                    { type: "Referral", example: "[Mutual contact] suggested I reach out. They thought we could help with [specific issue].", why: "Leverages trust, builds instant credibility" },
                    { type: "Pattern Interrupt", example: "This isn't a sales call – I'm actually trying to figure out if we're even a fit.", why: "Disarms skepticism, sounds genuine" },
                    { type: "Research-Based", example: "I saw [company announcement]. Congrats! I'm curious how you're planning to handle [related challenge].", why: "Shows effort, demonstrates relevance" }
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{item.type}</Badge>
                      </div>
                      <p className="text-sm italic text-foreground mb-1">"{item.example}"</p>
                      <p className="text-xs text-muted-foreground">Why it works: {item.why}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <h4 className="font-semibold mb-2 text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Avoid These Openers
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• "How are you today?" (Screams sales call)</li>
                  <li>• "I'm calling because..." (Self-centered)</li>
                  <li>• "Do you have a few minutes?" (Easy to say no)</li>
                  <li>• Starting with your company pitch (Nobody cares yet)</li>
                </ul>
              </div>
            </TabsContent>

            {/* TRUST TAB */}
            <TabsContent value="trust" className="space-y-4">
              <div className="p-4 rounded-lg bg-background/50 border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Handshake className="h-5 w-5 text-green-500" />
                  Building Trust Fast
                </h3>
                <div className="grid gap-3">
                  {[
                    { title: "Mirror & Match", desc: "Subtly match their pace, tone, and energy. People trust those who feel familiar." },
                    { title: "Active Listening", desc: "Repeat key phrases back. 'So what I'm hearing is...' shows you're truly present." },
                    { title: "Vulnerability", desc: "Admit what you DON'T do well. 'We're not the cheapest, but...' builds credibility." },
                    { title: "Social Proof", desc: "Reference similar clients naturally. 'We worked with [similar company] on exactly this...'" },
                    { title: "Under-Promise", desc: "Set expectations slightly below what you'll deliver. Exceeding expectations builds loyalty." }
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded bg-muted/50">
                      <p className="font-medium text-sm text-green-600">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <h4 className="font-semibold mb-2 text-blue-600">Trust Killers</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Overpromising or exaggerating</li>
                  <li>• Talking more than listening (60/40 rule: they talk 60%)</li>
                  <li>• Pushing too hard too fast</li>
                  <li>• Being vague about pricing/process</li>
                  <li>• Not admitting when you don't know something</li>
                </ul>
              </div>
            </TabsContent>

            {/* STAGES TAB */}
            <TabsContent value="stages" className="space-y-4">
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

            {/* ASSESS TAB */}
            <TabsContent value="assess" className="space-y-4">
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
            <TabsContent value="personality" className="space-y-4">
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
            <TabsContent value="objections" className="space-y-4">
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
            <TabsContent value="closing" className="space-y-4">
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

            {/* RELUCTANCE TAB */}
            <TabsContent value="reluctance" className="space-y-4">
              <div className="p-4 rounded-lg bg-background/50 border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-amber-500" />
                  Overcoming Call Reluctance
                </h3>
                <div className="grid gap-3">
                  {[
                    { type: "Fear of Rejection", solution: "Reframe: You're not being rejected, your timing/offer is. It's not personal.", action: "Track rejections – aim for 10/day. Celebrate the nos." },
                    { type: "Perfectionism", solution: "Done is better than perfect. Every call teaches you something.", action: "Make the first 5 calls 'practice calls' with no expectation." },
                    { type: "Imposter Syndrome", solution: "You have knowledge they need. Focus on helping, not selling.", action: "List 3 ways your product genuinely helps clients." },
                    { type: "Fear of Being Pushy", solution: "Asking questions isn't pushy. Ignoring their needs is.", action: "Use permission-based language: 'Would it be okay if...'" },
                    { type: "Analysis Paralysis", solution: "Stop researching, start calling. Learn by doing.", action: "Set a timer: 5 min research max, then dial." }
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded bg-muted/50 border-l-4 border-amber-500/50">
                      <p className="font-medium text-sm text-amber-600">{item.type}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.solution}</p>
                      <p className="text-xs text-primary mt-1"><strong>Action:</strong> {item.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* PREP TAB */}
            <TabsContent value="prep" className="space-y-4">
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
            <TabsContent value="faqs" className="space-y-4">
              <Tabs defaultValue="outbound" className="w-full">
                <TabsList className="h-auto p-1 bg-muted/30 w-full">
                  <TabsTrigger value="outbound" className="text-[10px] flex-1">Outbound</TabsTrigger>
                  <TabsTrigger value="inbound" className="text-[10px] flex-1">Inbound</TabsTrigger>
                  <TabsTrigger value="followup" className="text-[10px] flex-1">Follow-up</TabsTrigger>
                  <TabsTrigger value="postsale" className="text-[10px] flex-1">Post-Sale</TabsTrigger>
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
                <TabsContent value="postsale" className="mt-3 space-y-2">
                  {[
                    { q: "When to ask for referrals?", a: "After successful delivery. 'Who else might benefit?'" },
                    { q: "Handling buyer's remorse?", a: "Reassure, reiterate value, offer support." },
                    { q: "Upselling timing?", a: "Wait 30-60 days, after initial success." }
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
            <TabsContent value="notes" className="space-y-4">
              <div className="p-4 rounded-lg bg-background/50 border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Tab Sequence Logic
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>The tabs follow a logical sales journey:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li><strong>Mindset</strong> - Start with the right mental framework</li>
                    <li><strong>Opening</strong> - How to start conversations effectively</li>
                    <li><strong>Trust</strong> - Building rapport and credibility</li>
                    <li><strong>Stages</strong> - The 5-stage framework overview</li>
                    <li><strong>Assess</strong> - BANT and need discovery</li>
                    <li><strong>Personality</strong> - Adapt to different buyer types</li>
                    <li><strong>Objections</strong> - Handle resistance professionally</li>
                    <li><strong>Closing</strong> - Seal the deal</li>
                    <li><strong>Reluctance</strong> - Overcome your own barriers</li>
                    <li><strong>Prep</strong> - Before & after call checklists</li>
                    <li><strong>FAQs</strong> - Quick answers by scenario</li>
                    <li><strong>Notes</strong> - This overview!</li>
                  </ol>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h4 className="font-semibold mb-2 text-primary">Key Principle</h4>
                <p className="text-sm text-muted-foreground">
                  Sales is about helping people make decisions that benefit them. 
                  Focus on understanding their needs, building trust, and guiding them to the right solution.
                </p>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
};

export default QuickNotes;
