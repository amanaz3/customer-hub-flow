import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Brain, Target, Users, Lightbulb, AlertTriangle, BookOpen, CheckCircle2, Trophy, Heart, Shield, Zap, Handshake, DollarSign, MessageSquare } from 'lucide-react';
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
              <Tabs defaultValue="sales" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="sales" className="text-xs">Sales Mindset</TabsTrigger>
                  <TabsTrigger value="customer" className="text-xs">Customer Mindset</TabsTrigger>
                </TabsList>
                
                <TabsContent value="sales" className="space-y-4">
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
                
                <TabsContent value="customer" className="space-y-4">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-teal-500/10 border">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Heart className="h-5 w-5 text-green-500" />
                      The Customer Mindset
                    </h3>
                    <div className="grid gap-3">
                      {[
                        { title: "They're Skeptical", desc: "Customers have been burned before. Assume doubt until you've earned trust through actions, not words." },
                        { title: "They're Busy", desc: "Your call is an interruption. Respect their time by being concise, relevant, and value-focused." },
                        { title: "They Want to Feel Heard", desc: "Customers buy from people who understand them. Listen 2x more than you speak." },
                        { title: "They Fear Making Mistakes", desc: "The pain of a bad decision often outweighs the potential gain. Reduce their perceived risk." },
                        { title: "They Compare Options", desc: "You're rarely the only option. Know your competition and clearly articulate your unique value." }
                      ].map((item, i) => (
                        <div key={i} className="p-3 rounded bg-background/80 border-l-4 border-green-500/50">
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <h4 className="font-semibold mb-2 text-blue-600">What Customers Really Want</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• To feel understood, not sold to</li>
                      <li>• Solutions tailored to their specific situation</li>
                      <li>• Honesty about what you can and can't do</li>
                      <li>• A trusted advisor, not a pushy salesperson</li>
                      <li>• Confidence that they're making the right choice</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Brain className="h-5 w-5 text-amber-500" />
                      What's Going On In The Client's Mind
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">Understanding client psychology is 80% of sales success. Every client has these thoughts running:</p>
                    
                    <div className="grid gap-4">
                      <div className="p-3 rounded bg-background/80 border-l-4 border-red-500/50">
                        <p className="font-medium text-sm flex items-center gap-2">🛡️ Defense Thoughts (First 30 seconds)</p>
                        <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                          <li>• "Is this person going to waste my time?"</li>
                          <li>• "Are they trying to sell me something I don't need?"</li>
                          <li>• "Can I trust this person/company?"</li>
                          <li>• "How do I get out of this quickly if needed?"</li>
                        </ul>
                      </div>
                      
                      <div className="p-3 rounded bg-background/80 border-l-4 border-yellow-500/50">
                        <p className="font-medium text-sm flex items-center gap-2">🤔 Evaluation Thoughts (During Call)</p>
                        <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                          <li>• "Does this person understand MY situation?"</li>
                          <li>• "Is this worth my money and time?"</li>
                          <li>• "What will happen if this goes wrong?"</li>
                          <li>• "What will others think of my decision?"</li>
                        </ul>
                      </div>
                      
                      <div className="p-3 rounded bg-background/80 border-l-4 border-green-500/50">
                        <p className="font-medium text-sm flex items-center gap-2">✅ Buying Thoughts (When Ready)</p>
                        <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                          <li>• "This person gets me and my needs"</li>
                          <li>• "I feel safe making this decision"</li>
                          <li>• "The value clearly exceeds the cost"</li>
                          <li>• "I can justify this to myself and others"</li>
                        </ul>
                      </div>
                      
                      <div className="p-3 rounded bg-background/80 border-l-4 border-purple-500/50">
                        <p className="font-medium text-sm flex items-center gap-2">🔄 Hidden Concerns (Never Said)</p>
                        <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                          <li>• "What if I look stupid for asking questions?"</li>
                          <li>• "I don't want to seem like I can't afford it"</li>
                          <li>• "My partner/boss might disagree"</li>
                          <li>• "I've been burned before by salespeople"</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      Client Response Patterns & How to Branch
                    </h3>
                    
                    <div className="grid gap-3">
                      {[
                        { emoji: "😊", type: "Engaged Response", signal: '"That sounds interesting..." / Asking questions', action: "Build momentum, move to discovery" },
                        { emoji: "🤨", type: "Skeptical Response", signal: '"I\'ve heard this before..." / Short answers', action: "Slow down, ask about past experiences" },
                        { emoji: "🙄", type: "Dismissive Response", signal: '"Just send info..." / "Not interested"', action: "Pattern interrupt, ask curious question" },
                        { emoji: "📊", type: "Analytical Response", signal: '"What\'s the process?" / Asking for details', action: "Provide data, specifics, don't rush" },
                        { emoji: "😰", type: "Anxious Response", signal: '"I\'m not sure..." / Hesitant tone', action: "Reassure, share testimonials, no pressure" },
                        { emoji: "⏰", type: "Rushing Response", signal: '"Make it quick..." / Checking time', action: "Respect time, hit key points only, schedule follow-up" }
                      ].map((item, i) => (
                        <div key={i} className="p-3 rounded bg-background/80 border">
                          <p className="font-medium text-sm">{item.emoji} {item.type}</p>
                          <p className="text-xs text-muted-foreground italic mt-1">{item.signal}</p>
                          <p className="text-xs text-green-600 mt-1">→ Action: {item.action}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10 border">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <ArrowRight className="h-5 w-5 text-orange-500" />
                      When Client Jumps Stages - Guide Them Back
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="p-3 rounded bg-background/80 border">
                        <p className="font-medium text-sm mb-2">Client: "How much does it cost?" (Jumping to pricing before discovery)</p>
                        <div className="space-y-2">
                          <div className="p-2 rounded bg-red-500/10 border-l-2 border-red-500">
                            <p className="text-xs"><span className="font-semibold text-red-600">❌ Wrong:</span> "It's AED 5,000"</p>
                            <p className="text-xs text-muted-foreground italic">Loses control, no context for value</p>
                          </div>
                          <div className="p-2 rounded bg-green-500/10 border-l-2 border-green-500">
                            <p className="text-xs"><span className="font-semibold text-green-600">✅ Right:</span> "Great question! It ranges from X to Y depending on your specific needs. To give you an accurate quote, can I ask a few quick questions about your situation?"</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3 rounded bg-background/80 border">
                        <p className="font-medium text-sm mb-2">Client: "Just tell me if you can do it" (Jumping to closing)</p>
                        <div className="space-y-2">
                          <div className="p-2 rounded bg-red-500/10 border-l-2 border-red-500">
                            <p className="text-xs"><span className="font-semibold text-red-600">❌ Wrong:</span> "Yes, we can!"</p>
                            <p className="text-xs text-muted-foreground italic">Misses opportunity to understand</p>
                          </div>
                          <div className="p-2 rounded bg-green-500/10 border-l-2 border-green-500">
                            <p className="text-xs"><span className="font-semibold text-green-600">✅ Right:</span> "Absolutely we can help! But I want to make sure we do it right. What's the specific outcome you're hoping for? That way I can confirm we're the perfect fit."</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3 rounded bg-background/80 border">
                        <p className="font-medium text-sm mb-2">Client: "My friend said you're expensive" (Starting with objection)</p>
                        <div className="space-y-2">
                          <div className="p-2 rounded bg-red-500/10 border-l-2 border-red-500">
                            <p className="text-xs"><span className="font-semibold text-red-600">❌ Wrong:</span> "We're actually very competitive..."</p>
                            <p className="text-xs text-muted-foreground italic">Defensive</p>
                          </div>
                          <div className="p-2 rounded bg-green-500/10 border-l-2 border-green-500">
                            <p className="text-xs"><span className="font-semibold text-green-600">✅ Right:</span> "I appreciate you being upfront! What did your friend's situation involve? Our pricing varies based on complexity - let's see if your needs are similar or different."</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
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

              <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-amber-500" />
                  The First 30 Seconds - Make or Break
                </h3>
                <p className="text-sm text-muted-foreground mb-4">You have 30 seconds to answer the client's unspoken question: "Why should I keep listening?"</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-3 rounded bg-red-500/10 border-l-4 border-red-500/50">
                    <p className="font-medium text-sm text-red-600 mb-2">❌ Bad Openings (What Most Do)</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• "Hi, I'm calling from XYZ company..."</li>
                      <li>• "Do you have a moment to talk about..."</li>
                      <li>• "I wanted to introduce our services..."</li>
                      <li>• "Is this a good time?" (Easy out)</li>
                    </ul>
                    <p className="text-xs text-red-500 mt-2 italic">Why bad: Client-focus is zero. It's all about YOU.</p>
                  </div>
                  
                  <div className="p-3 rounded bg-green-500/10 border-l-4 border-green-500/50">
                    <p className="font-medium text-sm text-green-600 mb-2">✅ Great Openings (What Works)</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• "I noticed [specific thing about them]..."</li>
                      <li>• "Quick question - [relevant curiosity hook]?"</li>
                      <li>• "[Mutual connection] mentioned you might..."</li>
                      <li>• "I help [their type] with [their problem]..."</li>
                    </ul>
                    <p className="text-xs text-green-500 mt-2 italic">Why good: Shows you did homework. It's about THEM.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-500" />
                  🎣 Hook Techniques - Earn The Right To Continue
                </h3>
                
                <div className="grid gap-3">
                  {[
                    { title: "The Curiosity Hook", script: "\"I have a quick question that might save you [time/money/hassle]...\"", result: "Creates intrigue without commitment" },
                    { title: "The Relevance Hook", script: "\"I noticed you're expanding to [area] - we just helped [similar company] with that...\"", result: "Shows you understand their world" },
                    { title: "The Social Proof Hook", script: "\"[Known name/competitor] in your industry just completed [outcome] with us...\"", result: "Leverages fear of missing out" },
                    { title: "The Problem Hook", script: "\"Most [their type] I talk to are struggling with [common pain]...\"", result: "Resonates if they have the problem" }
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded bg-background/80 border">
                      <p className="font-medium text-sm text-blue-600">{item.title}</p>
                      <p className="text-xs italic text-foreground mt-1">{item.script}</p>
                      <p className="text-xs text-green-600 mt-1">🎯 {item.result}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-500" />
                  Opening Scripts By Call Type
                </h3>
                
                <div className="space-y-4">
                  <div className="p-3 rounded bg-background/80 border-l-4 border-purple-500/50">
                    <p className="font-medium text-sm text-purple-600 mb-2">Outbound Cold Call</p>
                    <p className="text-xs italic text-foreground">"Hi [Name], this is [You] from AMANA. I'll be brief - I help business owners in [industry] open bank accounts in half the usual time. Is that something worth 2 minutes of your time?"</p>
                    <p className="text-xs text-muted-foreground mt-2">💡 Key: Respect their time, give value proposition immediately</p>
                  </div>
                  
                  <div className="p-3 rounded bg-background/80 border-l-4 border-green-500/50">
                    <p className="font-medium text-sm text-green-600 mb-2">Inbound Inquiry</p>
                    <p className="text-xs italic text-foreground">"Thanks for reaching out! Before I dive in, I'd love to understand what caught your attention about us - what are you hoping to achieve?"</p>
                    <p className="text-xs text-muted-foreground mt-2">💡 Key: Warmth first, then understand their motivation</p>
                  </div>
                  
                  <div className="p-3 rounded bg-background/80 border-l-4 border-blue-500/50">
                    <p className="font-medium text-sm text-blue-600 mb-2">Follow-up Call</p>
                    <p className="text-xs italic text-foreground">"Hi [Name], it's [You] from AMANA. We spoke [timeframe] ago about [topic]. I wanted to check in - has anything changed since then? Any new questions I can help with?"</p>
                    <p className="text-xs text-muted-foreground mt-2">💡 Key: Remind context, show you remember them</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-teal-500" />
                  Voice & Tone - How To Speak
                </h3>
                
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-medium text-sm">🎵 Pace</p>
                    <p className="text-xs text-muted-foreground mt-1">Match their speed. Slow = authority. Fast = excitement.</p>
                  </div>
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-medium text-sm">📊 Tone</p>
                    <p className="text-xs text-muted-foreground mt-1">Confident but not pushy. Curious not interrogating.</p>
                  </div>
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-medium text-sm">⏸️ Pauses</p>
                    <p className="text-xs text-muted-foreground mt-1">After key points. Let them think. Don't fill silence.</p>
                  </div>
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-medium text-sm">😊 Energy</p>
                    <p className="text-xs text-muted-foreground mt-1">Smile while talking - they can hear it. Be warm.</p>
                  </div>
                </div>
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

              <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-amber-500" />
                  The Trust-Before-Pitch Rule
                </h3>
                <p className="text-sm text-muted-foreground mb-4 font-medium">Golden Rule: Never pitch until they trust you. No trust = No sale, no matter how good your offer is.</p>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-3 rounded bg-red-500/10 border-l-4 border-red-500/50">
                    <p className="font-medium text-sm text-red-600 mb-2">🚫 What Destroys Trust</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Pitching too early</li>
                      <li>• Not listening, just waiting to talk</li>
                      <li>• Overpromising</li>
                      <li>• Being vague about process/pricing</li>
                      <li>• Pressuring for quick decisions</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 rounded bg-green-500/10 border-l-4 border-green-500/50">
                    <p className="font-medium text-sm text-green-600 mb-2">✅ What Builds Trust</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Active listening (paraphrasing back)</li>
                      <li>• Asking thoughtful questions</li>
                      <li>• Being honest about limitations</li>
                      <li>• Sharing relevant examples</li>
                      <li>• Giving before asking</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 rounded bg-blue-500/10 border-l-4 border-blue-500/50">
                    <p className="font-medium text-sm text-blue-600 mb-2">🎯 Trust Signals to Watch</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• They share personal details</li>
                      <li>• They ask "How?" questions</li>
                      <li>• They mention concerns openly</li>
                      <li>• Conversation becomes two-way</li>
                      <li>• They agree to next steps</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Trust-Building Techniques
                </h3>
                
                <div className="space-y-4">
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-medium text-sm text-purple-600 mb-2">1. The Mirror Technique</p>
                    <p className="text-xs text-muted-foreground mb-2">Repeat their last 1-3 words as a question. Shows you're listening.</p>
                    <div className="p-2 rounded bg-muted/50 text-xs">
                      <p><span className="font-medium">Client:</span> "I'm worried about the timeline."</p>
                      <p><span className="font-medium text-purple-600">You:</span> "The timeline?"</p>
                      <p><span className="font-medium">Client:</span> "Yes, we need this done by March because..." <span className="italic text-green-600">[Opens up more]</span></p>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-medium text-sm text-purple-600 mb-2">2. The Label Technique</p>
                    <p className="text-xs text-muted-foreground mb-2">Name their emotion. "It sounds like..." / "It seems like..."</p>
                    <div className="p-2 rounded bg-muted/50 text-xs">
                      <p><span className="font-medium text-purple-600">You:</span> "It sounds like you've had frustrating experiences with this before..."</p>
                      <p><span className="font-medium">Client:</span> "Yes! We tried twice and it failed both times." <span className="italic text-green-600">[Validates them, builds connection]</span></p>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-medium text-sm text-purple-600 mb-2">3. The Vulnerability Technique</p>
                    <p className="text-xs text-muted-foreground mb-2">Share a small limitation or honest admission. Makes you human.</p>
                    <div className="p-2 rounded bg-muted/50 text-xs">
                      <p><span className="font-medium text-purple-600">You:</span> "I'll be honest - if you need this in 2 days, we're not the right fit. Our minimum is 5 days because we don't cut corners."</p>
                      <p className="italic text-green-600">[Honesty = Trust]</p>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-medium text-sm text-purple-600 mb-2">4. The Give-First Technique</p>
                    <p className="text-xs text-muted-foreground mb-2">Offer value before asking for anything. Creates reciprocity.</p>
                    <div className="p-2 rounded bg-muted/50 text-xs">
                      <p><span className="font-medium text-purple-600">You:</span> "Before we go further, let me share a quick tip that might help regardless of whether you work with us..."</p>
                      <p className="italic text-green-600">[Generosity = Trust]</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-teal-500" />
                  Evoking Interest - Make Them WANT To Buy
                </h3>
                
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-medium text-sm text-teal-600 mb-2">Paint The "After" Picture</p>
                    <p className="text-xs italic text-foreground">"Imagine 3 weeks from now - your account is open, your first transaction goes through smoothly, and you can finally [their goal]. How would that feel?"</p>
                  </div>
                  
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-medium text-sm text-teal-600 mb-2">Highlight The Cost Of Inaction</p>
                    <p className="text-xs italic text-foreground">"Every month you wait is a month of [lost opportunity/risk/frustration]. What's that costing you right now?"</p>
                  </div>
                  
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-medium text-sm text-teal-600 mb-2">Use Social Proof Stories</p>
                    <p className="text-xs italic text-foreground">"We just helped a company just like yours - they were hesitant too, but within 3 weeks they had [outcome]. Would you like to hear how?"</p>
                  </div>
                  
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-medium text-sm text-teal-600 mb-2">Create Scarcity (Genuine)</p>
                    <p className="text-xs italic text-foreground">"Our specialist for [their need] only takes on 4 new clients per month. I want to make sure I can hold a spot if you decide to move forward."</p>
                  </div>
                </div>
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

              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-blue-500/10 border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  The 5-Stage Call Framework (Visual)
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded bg-background/80 border-l-4 border-blue-500">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shrink-0">1</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-blue-600">Opening</span>
                        <Badge variant="outline" className="text-xs">30-60 sec</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground"><strong>Goal:</strong> Hook attention, establish rapport, earn the right to continue</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded bg-background/80 border-l-4 border-green-500">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm shrink-0">2</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-green-600">Discovery</span>
                        <Badge variant="outline" className="text-xs">5-10 min</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground"><strong>Goal:</strong> Understand needs, pains, goals, budget, timeline</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded bg-background/80 border-l-4 border-purple-500">
                    <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm shrink-0">3</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-purple-600">Demonstration</span>
                        <Badge variant="outline" className="text-xs">5-15 min</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground"><strong>Goal:</strong> Present solution mapped to their specific needs</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded bg-background/80 border-l-4 border-amber-500">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0">4</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-amber-600">Negotiation</span>
                        <Badge variant="outline" className="text-xs">5-10 min</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground"><strong>Goal:</strong> Handle objections, discuss pricing, terms</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded bg-background/80 border-l-4 border-teal-500">
                    <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-sm shrink-0">5</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-teal-600">Closing</span>
                        <Badge variant="outline" className="text-xs">2-5 min</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground"><strong>Goal:</strong> Ask for commitment, define next steps</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <h4 className="font-semibold mb-3 text-amber-600 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  When Clients Skip Stages
                </h4>
                <p className="text-sm text-muted-foreground mb-3">Clients often jump ahead - don't follow them blindly!</p>
                
                <div className="space-y-3">
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-medium text-sm text-amber-600 mb-2">Client jumps to price → Bring them back to discovery</p>
                    <div className="p-2 rounded bg-muted/50 text-sm italic">
                      "Great question! To give you an accurate answer, I need to understand [X] first. Can you tell me about...?"
                    </div>
                  </div>
                  
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-medium text-sm text-amber-600 mb-2">Client wants to close immediately → Ensure they understand value</p>
                    <div className="p-2 rounded bg-muted/50 text-sm italic">
                      "I love your enthusiasm! Before we finalize, let me make sure you have all the information you need about [key benefit]..."
                    </div>
                  </div>
                </div>
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

              <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  BANT Framework (Visual)
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded bg-background/80 border text-center">
                    <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg mx-auto mb-2">B</div>
                    <p className="font-semibold text-green-600 mb-1">Budget</p>
                    <p className="text-xs text-muted-foreground">Can they afford it?</p>
                  </div>
                  
                  <div className="p-3 rounded bg-background/80 border text-center">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg mx-auto mb-2">A</div>
                    <p className="font-semibold text-blue-600 mb-1">Authority</p>
                    <p className="text-xs text-muted-foreground">Can they decide?</p>
                  </div>
                  
                  <div className="p-3 rounded bg-background/80 border text-center">
                    <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-lg mx-auto mb-2">N</div>
                    <p className="font-semibold text-purple-600 mb-1">Need</p>
                    <p className="text-xs text-muted-foreground">Do they need it?</p>
                  </div>
                  
                  <div className="p-3 rounded bg-background/80 border text-center">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-lg mx-auto mb-2">T</div>
                    <p className="font-semibold text-amber-600 mb-1">Timeline</p>
                    <p className="text-xs text-muted-foreground">When do they need it?</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-background/50 border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                  Pain/Need Identification Questions
                </h4>
                <div className="space-y-2">
                  {[
                    "What's your biggest challenge with [area] right now?",
                    "What happens if this problem isn't solved in the next 3 months?",
                    "What have you tried before? What worked/didn't work?",
                    "If you could wave a magic wand, what would the ideal outcome look like?"
                  ].map((q, i) => (
                    <div key={i} className="p-3 rounded bg-muted/30 text-sm text-muted-foreground italic border-l-2 border-purple-500/50">
                      "{q}"
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

              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  ADEA Framework
                </h3>
                
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-4 rounded bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">A</div>
                      <p className="font-semibold text-blue-600">Analytical</p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Data-driven, detail-oriented, methodical</p>
                    <div className="space-y-1 text-xs">
                      <p><strong className="text-blue-600">Signs:</strong> "Can you send specs?" "What's the exact process?"</p>
                      <p><strong className="text-green-600">Approach:</strong> Facts, documentation, ROI data, no pressure</p>
                      <p><strong className="text-red-600">Avoid:</strong> Rushing, emotional appeals, vague answers</p>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold">D</div>
                      <p className="font-semibold text-red-600">Driver</p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Results-focused, brief, decisive</p>
                    <div className="space-y-1 text-xs">
                      <p><strong className="text-blue-600">Signs:</strong> "What's the bottom line?" "How fast?"</p>
                      <p><strong className="text-green-600">Approach:</strong> Get to point, focus on outcomes, be direct</p>
                      <p><strong className="text-red-600">Avoid:</strong> Small talk, lengthy explanations, indecision</p>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center font-bold">E</div>
                      <p className="font-semibold text-yellow-600">Expressive</p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Enthusiastic, story-driven, relationship-focused</p>
                    <div className="space-y-1 text-xs">
                      <p><strong className="text-blue-600">Signs:</strong> "I'm so excited!" Shares personal stories</p>
                      <p><strong className="text-green-600">Approach:</strong> Build rapport, share success stories, show enthusiasm</p>
                      <p><strong className="text-red-600">Avoid:</strong> Being too formal, ignoring their ideas, rushing</p>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">A</div>
                      <p className="font-semibold text-green-600">Amiable</p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Seeks consensus, risk-averse, patient</p>
                    <div className="space-y-1 text-xs">
                      <p><strong className="text-blue-600">Signs:</strong> "Need to discuss with team" "What do others say?"</p>
                      <p><strong className="text-green-600">Approach:</strong> Reassurance, testimonials, low-pressure, patience</p>
                      <p><strong className="text-red-600">Avoid:</strong> Aggressive closing, creating urgency, confrontation</p>
                    </div>
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

              <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-amber-500" />
                  LAER Objection Handling Framework
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded bg-background/80 border text-center">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg mx-auto mb-2">L</div>
                    <p className="font-semibold text-blue-600 mb-1">Listen</p>
                    <p className="text-xs text-muted-foreground">Hear them out fully</p>
                  </div>
                  
                  <div className="p-3 rounded bg-background/80 border text-center">
                    <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg mx-auto mb-2">A</div>
                    <p className="font-semibold text-green-600 mb-1">Acknowledge</p>
                    <p className="text-xs text-muted-foreground">"I understand..."</p>
                  </div>
                  
                  <div className="p-3 rounded bg-background/80 border text-center">
                    <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-lg mx-auto mb-2">E</div>
                    <p className="font-semibold text-purple-600 mb-1">Explore</p>
                    <p className="text-xs text-muted-foreground">Ask clarifying questions</p>
                  </div>
                  
                  <div className="p-3 rounded bg-background/80 border text-center">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-lg mx-auto mb-2">R</div>
                    <p className="font-semibold text-amber-600 mb-1">Respond</p>
                    <p className="text-xs text-muted-foreground">Address the concern</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <h4 className="font-semibold mb-3 text-red-600 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Price Objections
                </h4>
                <div className="space-y-3">
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-medium text-sm text-red-600 mb-2">"It's too expensive"</p>
                    <p className="text-sm text-muted-foreground italic">"I understand budget is important. Can you help me understand what you're comparing this to? Let's look at the value you're getting..."</p>
                  </div>
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-medium text-sm text-red-600 mb-2">"I need to think about it"</p>
                    <p className="text-sm text-muted-foreground italic">"Of course! What specific aspects would you like to consider? I want to make sure you have all the information you need."</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <h4 className="font-semibold mb-3 text-blue-600 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Trust Objections
                </h4>
                <div className="space-y-3">
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-medium text-sm text-blue-600 mb-2">"I need to check with others"</p>
                    <p className="text-sm text-muted-foreground italic">"Absolutely! Who else should be involved? Would it help if I joined a call with your team to answer questions directly?"</p>
                  </div>
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-medium text-sm text-blue-600 mb-2">"We're happy with current provider"</p>
                    <p className="text-sm text-muted-foreground italic">"That's great you have something working! Out of curiosity, what made you take this call today?"</p>
                  </div>
                </div>
              </div>
            </TabsContent>
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

              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-purple-500" />
                  Closing Techniques (Detailed)
                </h3>
                
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-semibold text-purple-600 mb-1">Assumptive Close</p>
                    <p className="text-sm text-muted-foreground italic mb-2">"When would you like to get started?"</p>
                    <p className="text-xs text-green-600"><strong>Best for:</strong> Warm leads showing buying signals</p>
                  </div>
                  
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-semibold text-purple-600 mb-1">Alternative Close</p>
                    <p className="text-sm text-muted-foreground italic mb-2">"Would you prefer Package A or B?"</p>
                    <p className="text-xs text-green-600"><strong>Best for:</strong> Indecisive customers</p>
                  </div>
                  
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-semibold text-purple-600 mb-1">Summary Close</p>
                    <p className="text-sm text-muted-foreground italic mb-2">"So we've agreed on X, Y, Z. Shall we proceed?"</p>
                    <p className="text-xs text-green-600"><strong>Best for:</strong> Complex sales, multiple features</p>
                  </div>
                  
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-semibold text-purple-600 mb-1">Urgency Close</p>
                    <p className="text-sm text-muted-foreground italic mb-2">"This offer is valid until Friday..."</p>
                    <p className="text-xs text-green-600"><strong>Best for:</strong> Hot leads, time-sensitive offers</p>
                  </div>
                  
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-semibold text-purple-600 mb-1">Trial Close</p>
                    <p className="text-sm text-muted-foreground italic mb-2">"How does this sound so far?"</p>
                    <p className="text-xs text-green-600"><strong>Best for:</strong> Testing readiness, mid-pitch</p>
                  </div>
                  
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-semibold text-purple-600 mb-1">Direct Ask</p>
                    <p className="text-sm text-muted-foreground italic mb-2">"Are you ready to move forward?"</p>
                    <p className="text-xs text-green-600"><strong>Best for:</strong> Direct personalities, clear signals</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <h4 className="font-semibold mb-3 text-green-600 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Buying Signals to Watch For
                </h4>
                <div className="grid md:grid-cols-2 gap-2">
                  {[
                    "Asks about pricing details",
                    "Discusses implementation timeline",
                    'Asks "What happens next?"',
                    "Mentions other decision-makers approvingly",
                    "Compares options seriously",
                    "Asks about payment terms",
                    "Requests references",
                    "Nodding, leaning in, taking notes"
                  ].map((signal, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                      {signal}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
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

              <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-amber-500" />
                  When The Client Is Still Undecided
                </h3>
                <p className="text-sm text-muted-foreground mb-4">Reluctance usually means one of three things: They don't see enough value, they have hidden concerns, or the timing isn't right.</p>
                
                <div className="space-y-3">
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-medium text-sm text-amber-600 mb-2">🔍 Diagnose First</p>
                    <p className="text-sm text-muted-foreground italic">"I sense some hesitation - and that's completely normal. Can you help me understand what's holding you back? Is it the timing, the investment, or something else?"</p>
                  </div>
                  
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-medium text-sm text-amber-600 mb-2">🎯 Isolate The Objection</p>
                    <p className="text-sm text-muted-foreground italic">"If we could address [concern], would you be ready to move forward today? I want to make sure I'm focused on what matters most to you."</p>
                  </div>
                  
                  <div className="p-3 rounded bg-background/80 border">
                    <p className="font-medium text-sm text-amber-600 mb-2">✅ Confirm Alignment</p>
                    <p className="text-sm text-muted-foreground italic">"Just to make sure we're aligned - you DO want [outcome], right? It's just [specific concern] that's making you pause?"</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-background/50 border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  💰 Strategic Discounting & Offers
                </h4>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="p-3 rounded bg-red-500/10 border border-red-500/20">
                    <p className="font-semibold text-red-600 text-sm mb-2">❌ When NOT To Discount</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Client hasn't expressed price as concern</li>
                      <li>• You haven't established full value yet</li>
                      <li>• They're shopping around (creates weakness)</li>
                      <li>• First mention of price</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 rounded bg-green-500/10 border border-green-500/20">
                    <p className="font-semibold text-green-600 text-sm mb-2">✅ When TO Discount</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Price is confirmed as the ONLY barrier</li>
                      <li>• Client is ready but needs justification</li>
                      <li>• Long-term relationship potential</li>
                      <li>• End of month/quarter targets</li>
                    </ul>
                  </div>
                </div>
                
                <p className="font-semibold text-sm mb-3">Discount Delivery Scripts</p>
                <div className="space-y-3">
                  <div className="p-3 rounded bg-muted/50 border-l-4 border-purple-500/50">
                    <p className="font-medium text-sm text-purple-600">The "Special Case" Discount</p>
                    <p className="text-xs text-muted-foreground italic mt-1">"I don't usually do this, but given [specific reason about them], let me see if I can get you a special rate. Would [X% off] make this work for you today?"</p>
                    <p className="text-xs text-primary mt-2">💡 Makes them feel valued, not like everyone gets this</p>
                  </div>
                  
                  <div className="p-3 rounded bg-muted/50 border-l-4 border-teal-500/50">
                    <p className="font-medium text-sm text-teal-600">The "Add Value" Approach</p>
                    <p className="text-xs text-muted-foreground italic mt-1">"Instead of reducing the price, what if I add [bonus service/feature] at no extra cost? That way you get more value for the same investment."</p>
                    <p className="text-xs text-primary mt-2">💡 Maintains price integrity while increasing perceived value</p>
                  </div>
                  
                  <div className="p-3 rounded bg-muted/50 border-l-4 border-blue-500/50">
                    <p className="font-medium text-sm text-blue-600">The "Payment Terms" Alternative</p>
                    <p className="text-xs text-muted-foreground italic mt-1">"If the total is the concern, would spreading it over [X payments] make it more manageable? The total stays the same, but it's easier on cash flow."</p>
                    <p className="text-xs text-primary mt-2">💡 Addresses affordability without discounting</p>
                  </div>
                  
                  <div className="p-3 rounded bg-muted/50 border-l-4 border-amber-500/50">
                    <p className="font-medium text-sm text-amber-600">The "Deadline" Close</p>
                    <p className="text-xs text-muted-foreground italic mt-1">"I can hold this rate until [date/time], but after that I can't guarantee it. If you confirm by then, we lock it in."</p>
                    <p className="text-xs text-primary mt-2">💡 Creates urgency without pressure</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <h4 className="font-semibold mb-3 text-blue-600 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Handling "I Need To Think About It"
                </h4>
                <p className="text-xs text-muted-foreground mb-3 italic">Translation: "I'm not convinced yet" or "I have concerns I haven't shared"</p>
                
                <div className="space-y-2">
                  <div className="p-2 rounded bg-background/80 border text-sm">
                    <span className="text-green-600 font-medium">✅ Response 1:</span> <span className="text-muted-foreground italic">"Of course! Just so I can prepare the right information - what specifically would you want to think through?"</span>
                  </div>
                  <div className="p-2 rounded bg-background/80 border text-sm">
                    <span className="text-green-600 font-medium">✅ Response 2:</span> <span className="text-muted-foreground italic">"Absolutely fair. Usually when people say that, it's about [price/timing/fit]. Which is it for you?"</span>
                  </div>
                  <div className="p-2 rounded bg-background/80 border text-sm">
                    <span className="text-green-600 font-medium">✅ Response 3:</span> <span className="text-muted-foreground italic">"I respect that. If you were to decide today, what would your gut tell you - yes or no?"</span>
                  </div>
                </div>
              </div>
            </TabsContent>
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

              <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Pre-Call Checklist (Detailed)
                </h4>
                <div className="space-y-2">
                  {[
                    "Review customer history & previous interactions",
                    "Check company website/LinkedIn for context",
                    "Prepare relevant case studies/testimonials",
                    "Have pricing/packages ready",
                    "Prepare discovery questions",
                    "Test audio/video if virtual call"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  Post-Call Actions
                </h4>
                <div className="space-y-2">
                  {[
                    "Update CRM with call notes immediately",
                    "Send follow-up email within 24 hours",
                    "Schedule next action/follow-up",
                    "Send promised materials/documents",
                    "Log deal stage if applicable"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-background/50 border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-500" />
                  Follow-Up Email Template
                </h4>
                <div className="p-4 rounded bg-muted/30 text-sm space-y-3 font-mono">
                  <p>Hi [Name],</p>
                  <p>Thank you for your time today discussing [topic]. As promised, here's [what you discussed].</p>
                  <div>
                    <p className="font-semibold">Key points we covered:</p>
                    <p>• [Point 1]</p>
                    <p>• [Point 2]</p>
                    <p>• [Point 3]</p>
                  </div>
                  <p><span className="font-semibold">Next steps:</span> [Clear action item with date]</p>
                  <p>Please let me know if you have any questions.</p>
                  <div>
                    <p>Best regards,</p>
                    <p>[Your name]</p>
                  </div>
                </div>
              </div>
            </TabsContent>
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
                  
                  <div className="mt-4 p-3 rounded bg-blue-500/10 border border-blue-500/20">
                    <p className="font-semibold text-sm text-blue-600 mb-2">Q: "Why are you calling me?"</p>
                    <p className="text-xs text-muted-foreground italic">"Great question! I help business owners in [industry] with [specific problem]. I noticed [something about their company] and thought there might be an opportunity to help. Do you have 2 minutes?"</p>
                  </div>
                  
                  <div className="p-3 rounded bg-blue-500/10 border border-blue-500/20">
                    <p className="font-semibold text-sm text-blue-600 mb-2">Q: "How did you get my number?"</p>
                    <p className="text-xs text-muted-foreground italic">"Your company came up in my research for businesses in [industry]. I reached out because [specific reason]. If this isn't the right time, I'm happy to schedule a better moment."</p>
                  </div>
                  
                  <div className="p-3 rounded bg-blue-500/10 border border-blue-500/20">
                    <p className="font-semibold text-sm text-blue-600 mb-2">Q: "We already have a provider"</p>
                    <p className="text-xs text-muted-foreground italic">"That's great! Many of our clients had providers before switching. Out of curiosity, what made you take this call today? Is there anything your current provider isn't addressing?"</p>
                  </div>
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
                  
                  <div className="mt-4 p-3 rounded bg-green-500/10 border border-green-500/20">
                    <p className="font-semibold text-sm text-green-600 mb-2">Q: "How much does it cost?"</p>
                    <p className="text-xs text-muted-foreground italic">"Our pricing depends on your specific needs. To give you an accurate quote, can I ask a few quick questions about what you're looking for? This will help me recommend the best option for your situation."</p>
                  </div>
                  
                  <div className="p-3 rounded bg-green-500/10 border border-green-500/20">
                    <p className="font-semibold text-sm text-green-600 mb-2">Q: "How long does it take?"</p>
                    <p className="text-xs text-muted-foreground italic">"Timeline varies based on complexity. Most clients complete within [range]. To give you a realistic estimate, let me understand your specific requirements - when are you hoping to have this done by?"</p>
                  </div>
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
                  
                  <div className="mt-4 p-3 rounded bg-amber-500/10 border border-amber-500/20">
                    <p className="font-semibold text-sm text-amber-600 mb-2">Q: "I haven't had time to review"</p>
                    <p className="text-xs text-muted-foreground italic">"No problem at all! I know you're busy. Would you prefer I send a quick summary of the key points? Or would a brief 5-minute call be more helpful to answer any initial questions?"</p>
                  </div>
                  
                  <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20">
                    <p className="font-semibold text-sm text-amber-600 mb-2">Q: "We decided to go with someone else"</p>
                    <p className="text-xs text-muted-foreground italic">"I appreciate you letting me know. May I ask what made you choose them? I'd value your feedback to improve. And if anything changes in the future, please don't hesitate to reach out."</p>
                  </div>
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
                  
                  <div className="mt-4 p-3 rounded bg-purple-500/10 border border-purple-500/20">
                    <p className="font-semibold text-sm text-purple-600 mb-2">Q: "There's a problem with my order"</p>
                    <p className="text-xs text-muted-foreground italic">"I'm sorry to hear that. Let me look into this immediately. Can you describe exactly what happened? I want to make sure we resolve this completely and prevent it from happening again."</p>
                  </div>
                  
                  <div className="p-3 rounded bg-purple-500/10 border border-purple-500/20">
                    <p className="font-semibold text-sm text-purple-600 mb-2">Q: "Can I get a refund?"</p>
                    <p className="text-xs text-muted-foreground italic">"I understand your concern. Before we discuss refund options, I'd like to understand what went wrong. Is there something specific we can address? Sometimes there's a quick fix we can provide."</p>
                  </div>
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

              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  Playbook Editor Tabs - Natural Call Flow
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded bg-background/80 border-l-4 border-blue-500">
                    <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shrink-0">1</div>
                    <div>
                      <p className="font-semibold text-blue-600 text-sm">Stages</p>
                      <p className="text-xs text-muted-foreground">Define the overall call structure first (Opening → Discovery → Pitch → Negotiation → Closing)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded bg-background/80 border-l-4 border-green-500">
                    <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm shrink-0">2</div>
                    <div>
                      <p className="font-semibold text-green-600 text-sm">Questions</p>
                      <p className="text-xs text-muted-foreground">Discovery questions used early in the call to understand customer needs</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded bg-background/80 border-l-4 border-amber-500">
                    <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0">3</div>
                    <div>
                      <p className="font-semibold text-amber-600 text-sm">Pricing</p>
                      <p className="text-xs text-muted-foreground">Negotiation strategies discussed during the pricing/negotiation phase</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded bg-background/80 border-l-4 border-red-500">
                    <div className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-sm shrink-0">4</div>
                    <div>
                      <p className="font-semibold text-red-600 text-sm">Objections</p>
                      <p className="text-xs text-muted-foreground">Objections typically arise during pricing/negotiation - not after closing</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded bg-background/80 border-l-4 border-purple-500">
                    <div className="w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm shrink-0">5</div>
                    <div>
                      <p className="font-semibold text-purple-600 text-sm">Emotions</p>
                      <p className="text-xs text-muted-foreground">Emotional responses can occur throughout the entire call and need handling</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-background/50 border">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Why This Order Matters
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong className="text-foreground">Questions before Objections:</strong> You ask discovery questions early in the call, objections come later during negotiation</li>
                  <li>• <strong className="text-foreground">Pricing before Objections:</strong> Pricing discussion triggers most objections - "too expensive", "need to think about it"</li>
                  <li>• <strong className="text-foreground">Objections after Pricing:</strong> Objections don't arise after closing - if you're at closing, objections have been handled</li>
                  <li>• <strong className="text-foreground">Emotions throughout:</strong> Emotional responses (frustration, excitement, hesitation) can occur at any stage</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <h4 className="font-semibold mb-2 text-amber-600 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Key Insight
                </h4>
                <p className="text-sm text-muted-foreground">
                  <strong>Objections don't come after closing.</strong> If a customer has objections after you've reached the closing stage, it means you didn't fully address their concerns during negotiation. The goal is to handle all objections BEFORE asking for commitment, not after.
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
