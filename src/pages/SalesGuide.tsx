import React from 'react';
import { ArrowLeft, Brain, Target, Users, DollarSign, Lightbulb, AlertTriangle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';

const SalesGuide = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/playbook-editor')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Playbook Editor
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Lightbulb className="h-8 w-8 text-primary" />
          Sales Playbook Guide & Best Practices
        </h1>
        <p className="text-muted-foreground mt-2">Master the art of sales with comprehensive techniques, scripts, and strategies</p>
      </div>

      <Tabs defaultValue="mindset" className="w-full">
        <TabsList className="flex flex-wrap gap-1 h-auto mb-6 p-2 bg-muted/50">
          <TabsTrigger value="mindset" className="text-sm px-3 py-2">🧠 Mindset</TabsTrigger>
          <TabsTrigger value="opening" className="text-sm px-3 py-2">🚀 Opening</TabsTrigger>
          <TabsTrigger value="trust" className="text-sm px-3 py-2">🤝 Trust</TabsTrigger>
          <TabsTrigger value="stages" className="text-sm px-3 py-2">Stages</TabsTrigger>
          <TabsTrigger value="assessment" className="text-sm px-3 py-2">Assess</TabsTrigger>
          <TabsTrigger value="personality" className="text-sm px-3 py-2">Personality</TabsTrigger>
          <TabsTrigger value="objections" className="text-sm px-3 py-2">Objections</TabsTrigger>
          <TabsTrigger value="closing" className="text-sm px-3 py-2">Closing</TabsTrigger>
          <TabsTrigger value="reluctance" className="text-sm px-3 py-2">💰 Reluctance</TabsTrigger>
          <TabsTrigger value="preparation" className="text-sm px-3 py-2">Prep</TabsTrigger>
          <TabsTrigger value="faqs" className="text-sm px-3 py-2">FAQs</TabsTrigger>
          <TabsTrigger value="notes" className="text-sm px-3 py-2">Notes</TabsTrigger>
        </TabsList>

        {/* CLIENT MINDSET TAB */}
        <TabsContent value="mindset" className="space-y-6">
          <div className="grid gap-4">
            <div className="p-6 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5 text-purple-500" />
                What's Going On In The Client's Mind
              </h4>
              <p className="text-sm text-muted-foreground mb-4">Understanding client psychology is 80% of sales success. Every client has these thoughts running:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded bg-background/50 border">
                  <p className="font-medium text-red-500 mb-3">🛡️ Defense Thoughts (First 30 seconds)</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• "Is this person going to waste my time?"</li>
                    <li>• "Are they trying to sell me something I don't need?"</li>
                    <li>• "Can I trust this person/company?"</li>
                    <li>• "How do I get out of this quickly if needed?"</li>
                  </ul>
                </div>
                <div className="p-4 rounded bg-background/50 border">
                  <p className="font-medium text-amber-500 mb-3">🤔 Evaluation Thoughts (During Call)</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• "Does this person understand MY situation?"</li>
                    <li>• "Is this worth my money and time?"</li>
                    <li>• "What will happen if this goes wrong?"</li>
                    <li>• "What will others think of my decision?"</li>
                  </ul>
                </div>
                <div className="p-4 rounded bg-background/50 border">
                  <p className="font-medium text-green-500 mb-3">✅ Buying Thoughts (When Ready)</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• "This person gets me and my needs"</li>
                    <li>• "I feel safe making this decision"</li>
                    <li>• "The value clearly exceeds the cost"</li>
                    <li>• "I can justify this to myself and others"</li>
                  </ul>
                </div>
                <div className="p-4 rounded bg-background/50 border">
                  <p className="font-medium text-blue-500 mb-3">🔄 Hidden Concerns (Never Said)</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• "What if I look stupid for asking questions?"</li>
                    <li>• "I don't want to seem like I can't afford it"</li>
                    <li>• "My partner/boss might disagree"</li>
                    <li>• "I've been burned before by salespeople"</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-background/50 border">
              <h4 className="font-semibold text-foreground mb-4">Client Response Patterns & How to Branch</h4>
              <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="p-3 rounded bg-green-500/10 border border-green-500/20">
                    <p className="font-medium text-green-600">😊 Engaged Response</p>
                    <p className="text-muted-foreground italic text-sm">"That sounds interesting..." / Asking questions</p>
                    <p className="text-foreground mt-2 text-sm"><strong>→ Action:</strong> Build momentum, move to discovery</p>
                  </div>
                  <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20">
                    <p className="font-medium text-amber-600">🤨 Skeptical Response</p>
                    <p className="text-muted-foreground italic text-sm">"I've heard this before..." / Short answers</p>
                    <p className="text-foreground mt-2 text-sm"><strong>→ Action:</strong> Slow down, ask about past experiences</p>
                  </div>
                  <div className="p-3 rounded bg-red-500/10 border border-red-500/20">
                    <p className="font-medium text-red-600">🙄 Dismissive Response</p>
                    <p className="text-muted-foreground italic text-sm">"Just send info..." / "Not interested"</p>
                    <p className="text-foreground mt-2 text-sm"><strong>→ Action:</strong> Pattern interrupt, ask curious question</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="p-3 rounded bg-blue-500/10 border border-blue-500/20">
                    <p className="font-medium text-blue-600">📊 Analytical Response</p>
                    <p className="text-muted-foreground italic text-sm">"What's the process?" / Asking for details</p>
                    <p className="text-foreground mt-2 text-sm"><strong>→ Action:</strong> Provide data, specifics, don't rush</p>
                  </div>
                  <div className="p-3 rounded bg-purple-500/10 border border-purple-500/20">
                    <p className="font-medium text-purple-600">😰 Anxious Response</p>
                    <p className="text-muted-foreground italic text-sm">"I'm not sure..." / Hesitant tone</p>
                    <p className="text-foreground mt-2 text-sm"><strong>→ Action:</strong> Reassure, share testimonials, no pressure</p>
                  </div>
                  <div className="p-3 rounded bg-cyan-500/10 border border-cyan-500/20">
                    <p className="font-medium text-cyan-600">⏰ Rushing Response</p>
                    <p className="text-muted-foreground italic text-sm">"Make it quick..." / Checking time</p>
                    <p className="text-foreground mt-2 text-sm"><strong>→ Action:</strong> Respect time, hit key points only, schedule follow-up</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                When Client Jumps Stages - Guide Them Back
              </h4>
              <div className="space-y-3">
                <div className="p-4 rounded bg-background/50">
                  <p className="font-medium text-foreground">Client: "How much does it cost?" (Jumping to pricing before discovery)</p>
                  <div className="mt-2 space-y-1 text-muted-foreground">
                    <p>❌ <span className="line-through">Wrong: "It's AED 5,000"</span> (Loses control, no context for value)</p>
                    <p>✅ <strong>Right:</strong> "Great question! It ranges from X to Y depending on your specific needs. To give you an accurate quote, can I ask a few quick questions about your situation?"</p>
                  </div>
                </div>
                <div className="p-4 rounded bg-background/50">
                  <p className="font-medium text-foreground">Client: "Just tell me if you can do it" (Jumping to closing)</p>
                  <div className="mt-2 space-y-1 text-muted-foreground">
                    <p>❌ <span className="line-through">Wrong: "Yes, we can!"</span> (Misses opportunity to understand)</p>
                    <p>✅ <strong>Right:</strong> "Absolutely we can help! But I want to make sure we do it right. What's the specific outcome you're hoping for? That way I can confirm we're the perfect fit."</p>
                  </div>
                </div>
                <div className="p-4 rounded bg-background/50">
                  <p className="font-medium text-foreground">Client: "My friend said you're expensive" (Starting with objection)</p>
                  <div className="mt-2 space-y-1 text-muted-foreground">
                    <p>❌ <span className="line-through">Wrong: "We're actually very competitive..."</span> (Defensive)</p>
                    <p>✅ <strong>Right:</strong> "I appreciate you being upfront! What did your friend's situation involve? Our pricing varies based on complexity - let's see if your needs are similar or different."</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* OPENING TAB */}
        <TabsContent value="opening" className="space-y-6">
          <div className="grid gap-4">
            <div className="p-6 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-blue-500" />
                The First 30 Seconds - Make or Break
              </h4>
              <p className="text-sm text-muted-foreground mb-4">You have 30 seconds to answer the client's unspoken question: "Why should I keep listening?"</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded bg-background/50 border">
                  <p className="font-medium text-red-500 mb-3">❌ Bad Openings (What Most Do)</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• "Hi, I'm calling from XYZ company..."</li>
                    <li>• "Do you have a moment to talk about..."</li>
                    <li>• "I wanted to introduce our services..."</li>
                    <li>• "Is this a good time?" (Easy out)</li>
                  </ul>
                  <p className="text-red-500 mt-3 italic">Why bad: Client-focus is zero. It's all about YOU.</p>
                </div>
                <div className="p-4 rounded bg-background/50 border">
                  <p className="font-medium text-green-500 mb-3">✅ Great Openings (What Works)</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• "I noticed [specific thing about them]..."</li>
                    <li>• "Quick question - [relevant curiosity hook]?"</li>
                    <li>• "[Mutual connection] mentioned you might..."</li>
                    <li>• "I help [their type] with [their problem]..."</li>
                  </ul>
                  <p className="text-green-500 mt-3 italic">Why good: Shows you did homework. It's about THEM.</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-background/50 border">
              <h4 className="font-semibold text-foreground mb-4">🎣 Hook Techniques - Earn The Right To Continue</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded bg-purple-500/10 border border-purple-500/20">
                  <p className="font-medium text-purple-600 mb-2">The Curiosity Hook</p>
                  <p className="text-muted-foreground italic">"I have a quick question that might save you [time/money/hassle]..."</p>
                  <p className="text-foreground mt-2">🎯 Creates intrigue without commitment</p>
                </div>
                <div className="p-4 rounded bg-blue-500/10 border border-blue-500/20">
                  <p className="font-medium text-blue-600 mb-2">The Relevance Hook</p>
                  <p className="text-muted-foreground italic">"I noticed you're expanding to [area] - we just helped [similar company] with that..."</p>
                  <p className="text-foreground mt-2">🎯 Shows you understand their world</p>
                </div>
                <div className="p-4 rounded bg-green-500/10 border border-green-500/20">
                  <p className="font-medium text-green-600 mb-2">The Social Proof Hook</p>
                  <p className="text-muted-foreground italic">"[Known name/competitor] in your industry just completed [outcome] with us..."</p>
                  <p className="text-foreground mt-2">🎯 Leverages fear of missing out</p>
                </div>
                <div className="p-4 rounded bg-amber-500/10 border border-amber-500/20">
                  <p className="font-medium text-amber-600 mb-2">The Problem Hook</p>
                  <p className="text-muted-foreground italic">"Most [their type] I talk to are struggling with [common pain]..."</p>
                  <p className="text-foreground mt-2">🎯 Resonates if they have the problem</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-green-500/5 border border-green-500/20">
              <h4 className="font-semibold text-foreground mb-4">Opening Scripts By Call Type</h4>
              <div className="space-y-4">
                <div className="p-4 rounded bg-background/50">
                  <Badge variant="outline" className="mb-2 bg-blue-500/10 text-blue-600">Outbound Cold Call</Badge>
                  <p className="text-muted-foreground italic">"Hi [Name], this is [You] from AMANA. I'll be brief - I help business owners in [industry] open bank accounts in half the usual time. Is that something worth 2 minutes of your time?"</p>
                  <p className="text-foreground mt-2">💡 <strong>Key:</strong> Respect their time, give value proposition immediately</p>
                </div>
                <div className="p-4 rounded bg-background/50">
                  <Badge variant="outline" className="mb-2 bg-green-500/10 text-green-600">Inbound Inquiry</Badge>
                  <p className="text-muted-foreground italic">"Thanks for reaching out! Before I dive in, I'd love to understand what caught your attention about us - what are you hoping to achieve?"</p>
                  <p className="text-foreground mt-2">💡 <strong>Key:</strong> Warmth first, then understand their motivation</p>
                </div>
                <div className="p-4 rounded bg-background/50">
                  <Badge variant="outline" className="mb-2 bg-purple-500/10 text-purple-600">Follow-up Call</Badge>
                  <p className="text-muted-foreground italic">"Hi [Name], it's [You] from AMANA. We spoke [timeframe] ago about [topic]. I wanted to check in - has anything changed since then? Any new questions I can help with?"</p>
                  <p className="text-foreground mt-2">💡 <strong>Key:</strong> Remind context, show you remember them</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <h4 className="font-semibold text-foreground mb-3">Voice & Tone - How To Speak</h4>
              <div className="grid md:grid-cols-4 gap-3">
                <div className="p-3 rounded bg-background/50 text-center">
                  <p className="font-medium text-foreground">🎵 Pace</p>
                  <p className="text-muted-foreground text-sm">Match their speed. Slow = authority. Fast = excitement.</p>
                </div>
                <div className="p-3 rounded bg-background/50 text-center">
                  <p className="font-medium text-foreground">📊 Tone</p>
                  <p className="text-muted-foreground text-sm">Confident but not pushy. Curious not interrogating.</p>
                </div>
                <div className="p-3 rounded bg-background/50 text-center">
                  <p className="font-medium text-foreground">⏸️ Pauses</p>
                  <p className="text-muted-foreground text-sm">After key points. Let them think. Don't fill silence.</p>
                </div>
                <div className="p-3 rounded bg-background/50 text-center">
                  <p className="font-medium text-foreground">😊 Energy</p>
                  <p className="text-muted-foreground text-sm">Smile while talking - they can hear it. Be warm.</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TRUST TAB */}
        <TabsContent value="trust" className="space-y-6">
          <div className="grid gap-4">
            <div className="p-6 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-green-500" />
                The Trust-Before-Pitch Rule
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>Golden Rule:</strong> Never pitch until they trust you. No trust = No sale, no matter how good your offer is.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded bg-background/50 border">
                  <p className="font-medium text-red-500 mb-3">🚫 What Destroys Trust</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Pitching too early</li>
                    <li>• Not listening, just waiting to talk</li>
                    <li>• Overpromising</li>
                    <li>• Being vague about process/pricing</li>
                    <li>• Pressuring for quick decisions</li>
                  </ul>
                </div>
                <div className="p-4 rounded bg-background/50 border">
                  <p className="font-medium text-green-500 mb-3">✅ What Builds Trust</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Active listening (paraphrasing back)</li>
                    <li>• Asking thoughtful questions</li>
                    <li>• Being honest about limitations</li>
                    <li>• Sharing relevant examples</li>
                    <li>• Giving before asking</li>
                  </ul>
                </div>
                <div className="p-4 rounded bg-background/50 border">
                  <p className="font-medium text-blue-500 mb-3">🎯 Trust Signals to Watch</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• They share personal details</li>
                    <li>• They ask "How?" questions</li>
                    <li>• They mention concerns openly</li>
                    <li>• Conversation becomes two-way</li>
                    <li>• They agree to next steps</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-background/50 border">
              <h4 className="font-semibold text-foreground mb-4">Trust-Building Techniques</h4>
              <div className="space-y-4">
                <div className="p-4 rounded bg-purple-500/10 border border-purple-500/20">
                  <p className="font-medium text-purple-600 mb-2">1. The Mirror Technique</p>
                  <p className="text-muted-foreground">Repeat their last 1-3 words as a question. Shows you're listening.</p>
                  <p className="bg-background/50 p-3 rounded mt-2 italic text-sm">Client: "I'm worried about the timeline."<br/>You: "The timeline?"<br/>Client: "Yes, we need this done by March because..." [Opens up more]</p>
                </div>
                <div className="p-4 rounded bg-blue-500/10 border border-blue-500/20">
                  <p className="font-medium text-blue-600 mb-2">2. The Label Technique</p>
                  <p className="text-muted-foreground">Name their emotion. "It sounds like..." / "It seems like..."</p>
                  <p className="bg-background/50 p-3 rounded mt-2 italic text-sm">"It sounds like you've had frustrating experiences with this before..."<br/>Client: "Yes! We tried twice and it failed both times." [Validates them, builds connection]</p>
                </div>
                <div className="p-4 rounded bg-green-500/10 border border-green-500/20">
                  <p className="font-medium text-green-600 mb-2">3. The Vulnerability Technique</p>
                  <p className="text-muted-foreground">Share a small limitation or honest admission. Makes you human.</p>
                  <p className="bg-background/50 p-3 rounded mt-2 italic text-sm">"I'll be honest - if you need this in 2 days, we're not the right fit. Our minimum is 5 days because we don't cut corners."<br/>[Honesty = Trust]</p>
                </div>
                <div className="p-4 rounded bg-amber-500/10 border border-amber-500/20">
                  <p className="font-medium text-amber-600 mb-2">4. The Give-First Technique</p>
                  <p className="text-muted-foreground">Offer value before asking for anything. Creates reciprocity.</p>
                  <p className="bg-background/50 p-3 rounded mt-2 italic text-sm">"Before we go further, let me share a quick tip that might help regardless of whether you work with us..."<br/>[Generosity = Trust]</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Evoking Interest - Make Them WANT To Buy
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded bg-background/50">
                  <p className="font-medium text-foreground mb-2">Paint The "After" Picture</p>
                  <p className="text-muted-foreground italic">"Imagine 3 weeks from now - your account is open, your first transaction goes through smoothly, and you can finally [their goal]. How would that feel?"</p>
                </div>
                <div className="p-4 rounded bg-background/50">
                  <p className="font-medium text-foreground mb-2">Highlight The Cost Of Inaction</p>
                  <p className="text-muted-foreground italic">"Every month you wait is a month of [lost opportunity/risk/frustration]. What's that costing you right now?"</p>
                </div>
                <div className="p-4 rounded bg-background/50">
                  <p className="font-medium text-foreground mb-2">Use Social Proof Stories</p>
                  <p className="text-muted-foreground italic">"We just helped a company just like yours - they were hesitant too, but within 3 weeks they had [outcome]. Would you like to hear how?"</p>
                </div>
                <div className="p-4 rounded bg-background/50">
                  <p className="font-medium text-foreground mb-2">Create Scarcity (Genuine)</p>
                  <p className="text-muted-foreground italic">"Our specialist for [their need] only takes on 4 new clients per month. I want to make sure I can hold a spot if you decide to move forward."</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* RELUCTANCE TAB */}
        <TabsContent value="reluctance" className="space-y-6">
          <div className="grid gap-4">
            <div className="p-6 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-amber-500" />
                When The Client Is Still Undecided
              </h4>
              <p className="text-sm text-muted-foreground mb-4">Reluctance usually means one of three things: They don't see enough value, they have hidden concerns, or the timing isn't right.</p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded bg-background/50 border">
                  <p className="font-medium text-purple-500 mb-2">🔍 Diagnose First</p>
                  <p className="text-muted-foreground italic text-sm">"I sense some hesitation - and that's completely normal. Can you help me understand what's holding you back? Is it the timing, the investment, or something else?"</p>
                </div>
                <div className="p-4 rounded bg-background/50 border">
                  <p className="font-medium text-blue-500 mb-2">🎯 Isolate The Objection</p>
                  <p className="text-muted-foreground italic text-sm">"If we could address [concern], would you be ready to move forward today? I want to make sure I'm focused on what matters most to you."</p>
                </div>
                <div className="p-4 rounded bg-background/50 border">
                  <p className="font-medium text-green-500 mb-2">✅ Confirm Alignment</p>
                  <p className="text-muted-foreground italic text-sm">"Just to make sure we're aligned - you DO want [outcome], right? It's just [specific concern] that's making you pause?"</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-background/50 border">
              <h4 className="font-semibold text-foreground mb-4">💰 Strategic Discounting & Offers</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded bg-red-500/10 border border-red-500/20">
                  <p className="font-medium text-red-600 mb-2">❌ When NOT To Discount</p>
                  <ul className="space-y-1 text-muted-foreground text-sm">
                    <li>• Client hasn't expressed price as concern</li>
                    <li>• You haven't established full value yet</li>
                    <li>• They're shopping around (creates weakness)</li>
                    <li>• First mention of price</li>
                  </ul>
                </div>
                <div className="p-4 rounded bg-green-500/10 border border-green-500/20">
                  <p className="font-medium text-green-600 mb-2">✅ When TO Discount</p>
                  <ul className="space-y-1 text-muted-foreground text-sm">
                    <li>• Price is confirmed as the ONLY barrier</li>
                    <li>• Client is ready but needs justification</li>
                    <li>• Long-term relationship potential</li>
                    <li>• End of month/quarter targets</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <h4 className="font-semibold text-foreground mb-4">Discount Delivery Scripts</h4>
              <div className="space-y-4">
                <div className="p-4 rounded bg-background/50">
                  <Badge variant="outline" className="mb-2 bg-green-500/10 text-green-600">The "Special Case" Discount</Badge>
                  <p className="text-muted-foreground italic">"I don't usually do this, but given [specific reason about them], let me see if I can get you a special rate. Would [X% off] make this work for you today?"</p>
                  <p className="text-foreground mt-2 text-sm">💡 Makes them feel valued, not like everyone gets this</p>
                </div>
                <div className="p-4 rounded bg-background/50">
                  <Badge variant="outline" className="mb-2 bg-blue-500/10 text-blue-600">The "Add Value" Approach</Badge>
                  <p className="text-muted-foreground italic">"Instead of reducing the price, what if I add [bonus service/feature] at no extra cost? That way you get more value for the same investment."</p>
                  <p className="text-foreground mt-2 text-sm">💡 Maintains price integrity while increasing perceived value</p>
                </div>
                <div className="p-4 rounded bg-background/50">
                  <Badge variant="outline" className="mb-2 bg-purple-500/10 text-purple-600">The "Payment Terms" Alternative</Badge>
                  <p className="text-muted-foreground italic">"If the total is the concern, would spreading it over [X payments] make it more manageable? The total stays the same, but it's easier on cash flow."</p>
                  <p className="text-foreground mt-2 text-sm">💡 Addresses affordability without discounting</p>
                </div>
                <div className="p-4 rounded bg-background/50">
                  <Badge variant="outline" className="mb-2 bg-amber-500/10 text-amber-600">The "Deadline" Close</Badge>
                  <p className="text-muted-foreground italic">"I can hold this rate until [date/time], but after that I can't guarantee it. If you confirm by then, we lock it in."</p>
                  <p className="text-foreground mt-2 text-sm">💡 Creates urgency without pressure</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Handling "I Need To Think About It"
              </h4>
              <div className="space-y-3">
                <div className="p-4 rounded bg-background/50">
                  <p className="font-medium text-foreground">Translation: "I'm not convinced yet" or "I have concerns I haven't shared"</p>
                  <div className="mt-3 space-y-2 text-muted-foreground">
                    <p>✅ <strong>Response 1:</strong> "Of course! Just so I can prepare the right information - what specifically would you want to think through?"</p>
                    <p>✅ <strong>Response 2:</strong> "Absolutely fair. Usually when people say that, it's about [price/timing/fit]. Which is it for you?"</p>
                    <p>✅ <strong>Response 3:</strong> "I respect that. If you were to decide today, what would your gut tell you - yes or no?"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* STAGES TAB */}
        <TabsContent value="stages" className="space-y-6">
          <div className="grid gap-4">
            <div className="p-6 rounded-lg bg-background/50 border">
              <h4 className="font-semibold text-foreground mb-4">The 5-Stage Call Framework</h4>
              <div className="space-y-4">
                {[
                  { stage: 'Opening', time: '30-60 sec', goal: 'Hook attention, establish rapport, earn the right to continue' },
                  { stage: 'Discovery', time: '5-10 min', goal: 'Understand needs, pains, goals, budget, timeline' },
                  { stage: 'Demonstration', time: '5-15 min', goal: 'Present solution mapped to their specific needs' },
                  { stage: 'Negotiation', time: '5-10 min', goal: 'Handle objections, discuss pricing, terms' },
                  { stage: 'Closing', time: '2-5 min', goal: 'Ask for commitment, define next steps' }
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded bg-primary/5 border border-primary/20">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{s.stage}</p>
                      <p className="text-muted-foreground text-sm"><strong>Time:</strong> {s.time}</p>
                      <p className="text-muted-foreground text-sm"><strong>Goal:</strong> {s.goal}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                When Clients Skip Stages
              </h4>
              <p className="text-muted-foreground mb-4">Clients often jump ahead - don't follow them blindly!</p>
              <div className="space-y-3">
                <div className="p-4 rounded bg-background/50">
                  <p className="font-medium">Client jumps to price → Bring them back to discovery</p>
                  <p className="text-muted-foreground italic text-sm">"Great question! To give you an accurate answer, I need to understand [X] first. Can you tell me about...?"</p>
                </div>
                <div className="p-4 rounded bg-background/50">
                  <p className="font-medium">Client wants to close immediately → Ensure they understand value</p>
                  <p className="text-muted-foreground italic text-sm">"I love your enthusiasm! Before we finalize, let me make sure you have all the information you need about [key benefit]..."</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ASSESSMENT TAB */}
        <TabsContent value="assessment" className="space-y-6">
          <div className="grid gap-4">
            <div className="p-6 rounded-lg bg-background/50 border">
              <h4 className="font-semibold text-foreground mb-4">BANT Framework</h4>
              <div className="grid md:grid-cols-4 gap-3">
                <div className="p-4 rounded bg-green-500/10 border border-green-500/20 text-center">
                  <p className="font-bold text-green-600 text-xl">B</p>
                  <p className="font-medium">Budget</p>
                  <p className="text-muted-foreground text-sm mt-1">Can they afford it?</p>
                </div>
                <div className="p-4 rounded bg-blue-500/10 border border-blue-500/20 text-center">
                  <p className="font-bold text-blue-600 text-xl">A</p>
                  <p className="font-medium">Authority</p>
                  <p className="text-muted-foreground text-sm mt-1">Can they decide?</p>
                </div>
                <div className="p-4 rounded bg-purple-500/10 border border-purple-500/20 text-center">
                  <p className="font-bold text-purple-600 text-xl">N</p>
                  <p className="font-medium">Need</p>
                  <p className="text-muted-foreground text-sm mt-1">Do they need it?</p>
                </div>
                <div className="p-4 rounded bg-amber-500/10 border border-amber-500/20 text-center">
                  <p className="font-bold text-amber-600 text-xl">T</p>
                  <p className="font-medium">Timeline</p>
                  <p className="text-muted-foreground text-sm mt-1">When do they need it?</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-background/50 border">
              <h4 className="font-semibold text-foreground mb-4">Pain/Need Identification Questions</h4>
              <div className="space-y-2">
                <p className="text-muted-foreground">"What's your biggest challenge with [area] right now?"</p>
                <p className="text-muted-foreground">"What happens if this problem isn't solved in the next 3 months?"</p>
                <p className="text-muted-foreground">"What have you tried before? What worked/didn't work?"</p>
                <p className="text-muted-foreground">"If you could wave a magic wand, what would the ideal outcome look like?"</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* PERSONALITY TAB */}
        <TabsContent value="personality" className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-blue-500/5 border-blue-500/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-600 text-sm font-bold flex items-center justify-center">A</span>
                <h4 className="font-semibold text-foreground">Analytical</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Data-driven, detail-oriented, methodical</p>
              <div className="space-y-2">
                <p className="text-sm"><strong>Signs:</strong> "Can you send specs?" "What's the exact process?"</p>
                <p className="text-sm"><strong>Approach:</strong> Facts, documentation, ROI data, no pressure</p>
                <p className="text-sm"><strong>Avoid:</strong> Rushing, emotional appeals, vague answers</p>
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-red-500/5 border-red-500/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-full bg-red-500/20 text-red-600 text-sm font-bold flex items-center justify-center">D</span>
                <h4 className="font-semibold text-foreground">Driver</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Results-focused, brief, decisive</p>
              <div className="space-y-2">
                <p className="text-sm"><strong>Signs:</strong> "What's the bottom line?" "How fast?"</p>
                <p className="text-sm"><strong>Approach:</strong> Get to point, focus on outcomes, be direct</p>
                <p className="text-sm"><strong>Avoid:</strong> Small talk, lengthy explanations, indecision</p>
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-yellow-500/5 border-yellow-500/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-600 text-sm font-bold flex items-center justify-center">E</span>
                <h4 className="font-semibold text-foreground">Expressive</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Enthusiastic, story-driven, relationship-focused</p>
              <div className="space-y-2">
                <p className="text-sm"><strong>Signs:</strong> "I'm so excited!" Shares personal stories</p>
                <p className="text-sm"><strong>Approach:</strong> Build rapport, share success stories, show enthusiasm</p>
                <p className="text-sm"><strong>Avoid:</strong> Being too formal, ignoring their ideas, rushing</p>
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-green-500/5 border-green-500/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-full bg-green-500/20 text-green-600 text-sm font-bold flex items-center justify-center">A</span>
                <h4 className="font-semibold text-foreground">Amiable</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Seeks consensus, risk-averse, patient</p>
              <div className="space-y-2">
                <p className="text-sm"><strong>Signs:</strong> "Need to discuss with team" "What do others say?"</p>
                <p className="text-sm"><strong>Approach:</strong> Reassurance, testimonials, low-pressure, patience</p>
                <p className="text-sm"><strong>Avoid:</strong> Aggressive closing, creating urgency, confrontation</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* OBJECTIONS TAB */}
        <TabsContent value="objections" className="space-y-6">
          <div className="grid gap-4">
            <div className="p-6 rounded-lg bg-background/50 border">
              <h4 className="font-semibold text-foreground mb-4">LAER Objection Handling Framework</h4>
              <div className="grid grid-cols-4 gap-3">
                <div className="p-4 rounded bg-primary/10 text-center">
                  <p className="font-bold text-primary text-xl">L</p>
                  <p className="font-medium">Listen</p>
                  <p className="text-muted-foreground text-sm">Hear them out fully</p>
                </div>
                <div className="p-4 rounded bg-primary/10 text-center">
                  <p className="font-bold text-primary text-xl">A</p>
                  <p className="font-medium">Acknowledge</p>
                  <p className="text-muted-foreground text-sm">"I understand..."</p>
                </div>
                <div className="p-4 rounded bg-primary/10 text-center">
                  <p className="font-bold text-primary text-xl">E</p>
                  <p className="font-medium">Explore</p>
                  <p className="text-muted-foreground text-sm">Ask clarifying questions</p>
                </div>
                <div className="p-4 rounded bg-primary/10 text-center">
                  <p className="font-bold text-primary text-xl">R</p>
                  <p className="font-medium">Respond</p>
                  <p className="text-muted-foreground text-sm">Address the concern</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-background/50 border">
                <h4 className="font-semibold text-foreground mb-3 text-amber-600">Price Objections</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded">
                    <p className="font-medium">"It's too expensive"</p>
                    <p className="text-muted-foreground italic text-sm">"I understand budget is important. Can you help me understand what you're comparing this to? Let's look at the value you're getting..."</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded">
                    <p className="font-medium">"I need to think about it"</p>
                    <p className="text-muted-foreground italic text-sm">"Of course! What specific aspects would you like to consider? I want to make sure you have all the information you need."</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-background/50 border">
                <h4 className="font-semibold text-foreground mb-3 text-blue-600">Trust Objections</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded">
                    <p className="font-medium">"I need to check with others"</p>
                    <p className="text-muted-foreground italic text-sm">"Absolutely! Who else should be involved? Would it help if I joined a call with your team to answer questions directly?"</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded">
                    <p className="font-medium">"We're happy with current provider"</p>
                    <p className="text-muted-foreground italic text-sm">"That's great you have something working! Out of curiosity, what made you take this call today?"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* CLOSING TAB */}
        <TabsContent value="closing" className="space-y-6">
          <div className="grid gap-4">
            <div className="p-6 rounded-lg bg-background/50 border">
              <h4 className="font-semibold text-foreground mb-4">Closing Techniques</h4>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="p-4 rounded bg-green-500/10 border border-green-500/20">
                  <p className="font-medium text-green-600">Assumptive Close</p>
                  <p className="text-muted-foreground">"When would you like to get started?"</p>
                  <p className="text-muted-foreground mt-2 italic text-sm">Best for: Warm leads showing buying signals</p>
                </div>
                <div className="p-4 rounded bg-blue-500/10 border border-blue-500/20">
                  <p className="font-medium text-blue-600">Alternative Close</p>
                  <p className="text-muted-foreground">"Would you prefer Package A or B?"</p>
                  <p className="text-muted-foreground mt-2 italic text-sm">Best for: Indecisive customers</p>
                </div>
                <div className="p-4 rounded bg-purple-500/10 border border-purple-500/20">
                  <p className="font-medium text-purple-600">Summary Close</p>
                  <p className="text-muted-foreground">"So we've agreed on X, Y, Z. Shall we proceed?"</p>
                  <p className="text-muted-foreground mt-2 italic text-sm">Best for: Complex sales, multiple features</p>
                </div>
                <div className="p-4 rounded bg-amber-500/10 border border-amber-500/20">
                  <p className="font-medium text-amber-600">Urgency Close</p>
                  <p className="text-muted-foreground">"This offer is valid until Friday..."</p>
                  <p className="text-muted-foreground mt-2 italic text-sm">Best for: Hot leads, time-sensitive offers</p>
                </div>
                <div className="p-4 rounded bg-pink-500/10 border border-pink-500/20">
                  <p className="font-medium text-pink-600">Trial Close</p>
                  <p className="text-muted-foreground">"How does this sound so far?"</p>
                  <p className="text-muted-foreground mt-2 italic text-sm">Best for: Testing readiness, mid-pitch</p>
                </div>
                <div className="p-4 rounded bg-cyan-500/10 border border-cyan-500/20">
                  <p className="font-medium text-cyan-600">Direct Ask</p>
                  <p className="text-muted-foreground">"Are you ready to move forward?"</p>
                  <p className="text-muted-foreground mt-2 italic text-sm">Best for: Direct personalities, clear signals</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-background/50 border">
              <h4 className="font-semibold text-foreground mb-4">Buying Signals to Watch For</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-green-500/10">Asks about pricing details</Badge>
                <Badge variant="outline" className="bg-green-500/10">Discusses implementation timeline</Badge>
                <Badge variant="outline" className="bg-green-500/10">Asks "What happens next?"</Badge>
                <Badge variant="outline" className="bg-green-500/10">Mentions other decision-makers approvingly</Badge>
                <Badge variant="outline" className="bg-green-500/10">Compares options seriously</Badge>
                <Badge variant="outline" className="bg-green-500/10">Asks about payment terms</Badge>
                <Badge variant="outline" className="bg-green-500/10">Requests references</Badge>
                <Badge variant="outline" className="bg-green-500/10">Nodding, leaning in, taking notes</Badge>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* PREPARATION TAB */}
        <TabsContent value="preparation" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-6 rounded-lg bg-background/50 border">
              <h4 className="font-semibold text-foreground mb-4">Pre-Call Checklist</h4>
              <div className="space-y-2">
                {[
                  'Review customer history & previous interactions',
                  'Check company website/LinkedIn for context',
                  'Prepare relevant case studies/testimonials',
                  'Have pricing/packages ready',
                  'Prepare discovery questions',
                  'Test audio/video if virtual call'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded border flex items-center justify-center text-primary text-sm">✓</div>
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-lg bg-background/50 border">
              <h4 className="font-semibold text-foreground mb-4">Post-Call Actions</h4>
              <div className="space-y-2">
                {[
                  'Update CRM with call notes immediately',
                  'Send follow-up email within 24 hours',
                  'Schedule next action/follow-up',
                  'Send promised materials/documents',
                  'Log deal stage if applicable'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded border flex items-center justify-center text-primary text-sm">✓</div>
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-lg bg-background/50 border md:col-span-2">
              <h4 className="font-semibold text-foreground mb-4">Follow-Up Email Template</h4>
              <div className="p-4 bg-muted/50 rounded font-mono text-sm text-muted-foreground">
                <p>Hi [Name],</p>
                <p className="mt-2">Thank you for your time today discussing [topic]. As promised, here's [what you discussed].</p>
                <p className="mt-2">Key points we covered:</p>
                <p>• [Point 1]</p>
                <p>• [Point 2]</p>
                <p>• [Point 3]</p>
                <p className="mt-2">Next steps: [Clear action item with date]</p>
                <p className="mt-2">Please let me know if you have any questions.</p>
                <p className="mt-2">Best regards,<br/>[Your name]</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* FAQS TAB */}
        <TabsContent value="faqs" className="space-y-6">
          <Tabs defaultValue="outbound" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="outbound">Outbound Sales</TabsTrigger>
              <TabsTrigger value="inbound">Inbound Sales</TabsTrigger>
              <TabsTrigger value="followup">Follow-up</TabsTrigger>
              <TabsTrigger value="postsale">Post-Sale Support</TabsTrigger>
            </TabsList>

            <TabsContent value="outbound" className="space-y-4">
              <div className="p-6 rounded-lg bg-background/50 border">
                <h4 className="font-semibold text-foreground mb-4 text-blue-600">Outbound Sales FAQs</h4>
                <div className="space-y-4">
                  <div className="p-4 rounded bg-muted/30">
                    <p className="font-medium">Q: "Why are you calling me?"</p>
                    <p className="text-muted-foreground mt-2 italic">"Great question! I help business owners in [industry] with [specific problem]. I noticed [something about their company] and thought there might be an opportunity to help. Do you have 2 minutes?"</p>
                  </div>
                  <div className="p-4 rounded bg-muted/30">
                    <p className="font-medium">Q: "How did you get my number?"</p>
                    <p className="text-muted-foreground mt-2 italic">"Your company came up in my research for businesses in [industry]. I reached out because [specific reason]. If this isn't the right time, I'm happy to schedule a better moment."</p>
                  </div>
                  <div className="p-4 rounded bg-muted/30">
                    <p className="font-medium">Q: "We already have a provider"</p>
                    <p className="text-muted-foreground mt-2 italic">"That's great! Many of our clients had providers before switching. Out of curiosity, what made you take this call today? Is there anything your current provider isn't addressing?"</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="inbound" className="space-y-4">
              <div className="p-6 rounded-lg bg-background/50 border">
                <h4 className="font-semibold text-foreground mb-4 text-green-600">Inbound Sales FAQs</h4>
                <div className="space-y-4">
                  <div className="p-4 rounded bg-muted/30">
                    <p className="font-medium">Q: "How much does it cost?"</p>
                    <p className="text-muted-foreground mt-2 italic">"Our pricing depends on your specific needs. To give you an accurate quote, can I ask a few quick questions about what you're looking for? This will help me recommend the best option for your situation."</p>
                  </div>
                  <div className="p-4 rounded bg-muted/30">
                    <p className="font-medium">Q: "How long does it take?"</p>
                    <p className="text-muted-foreground mt-2 italic">"Timeline varies based on complexity. Most clients complete within [range]. To give you a realistic estimate, let me understand your specific requirements - when are you hoping to have this done by?"</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="followup" className="space-y-4">
              <div className="p-6 rounded-lg bg-background/50 border">
                <h4 className="font-semibold text-foreground mb-4 text-purple-600">Follow-up FAQs</h4>
                <div className="space-y-4">
                  <div className="p-4 rounded bg-muted/30">
                    <p className="font-medium">Q: "I haven't had time to review"</p>
                    <p className="text-muted-foreground mt-2 italic">"No problem at all! I know you're busy. Would you prefer I send a quick summary of the key points? Or would a brief 5-minute call be more helpful to answer any initial questions?"</p>
                  </div>
                  <div className="p-4 rounded bg-muted/30">
                    <p className="font-medium">Q: "We decided to go with someone else"</p>
                    <p className="text-muted-foreground mt-2 italic">"I appreciate you letting me know. May I ask what made you choose them? I'd value your feedback to improve. And if anything changes in the future, please don't hesitate to reach out."</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="postsale" className="space-y-4">
              <div className="p-6 rounded-lg bg-background/50 border">
                <h4 className="font-semibold text-foreground mb-4 text-amber-600">Post-Sale Support FAQs</h4>
                <div className="space-y-4">
                  <div className="p-4 rounded bg-muted/30">
                    <p className="font-medium">Q: "There's a problem with my order"</p>
                    <p className="text-muted-foreground mt-2 italic">"I'm sorry to hear that. Let me look into this immediately. Can you describe exactly what happened? I want to make sure we resolve this completely and prevent it from happening again."</p>
                  </div>
                  <div className="p-4 rounded bg-muted/30">
                    <p className="font-medium">Q: "Can I get a refund?"</p>
                    <p className="text-muted-foreground mt-2 italic">"I understand your concern. Before we discuss refund options, I'd like to understand what went wrong. Is there something specific we can address? Sometimes there's a quick fix we can provide."</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* NOTES TAB */}
        <TabsContent value="notes" className="space-y-6">
          <div className="grid gap-4">
            <div className="p-6 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                Tab Sequence Logic
              </h4>
              <p className="text-muted-foreground mb-4">
                The playbook editor tabs follow the natural call flow sequence:
              </p>
              <div className="grid gap-3">
                {[
                  { num: 1, title: 'Stages', desc: 'Define the overall call structure first (Opening → Discovery → Pitch → Negotiation → Closing)' },
                  { num: 2, title: 'Questions', desc: 'Discovery questions used early in the call to understand customer needs' },
                  { num: 3, title: 'Pricing', desc: 'Negotiation strategies discussed during the pricing/negotiation phase' },
                  { num: 4, title: 'Objections', desc: 'Objections typically arise during pricing/negotiation - not after closing' },
                  { num: 5, title: 'Emotions', desc: 'Emotional responses can occur throughout the entire call and need handling' }
                ].map((item) => (
                  <div key={item.num} className="flex items-start gap-3 p-3 rounded bg-background/50">
                    <Badge className="bg-blue-500/20 text-blue-700">{item.num}</Badge>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-muted-foreground text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-lg bg-green-500/5 border border-green-500/20">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Why This Order Matters
              </h4>
              <div className="space-y-2 text-muted-foreground">
                <p>• <strong>Questions before Objections:</strong> You ask discovery questions early in the call, objections come later during negotiation</p>
                <p>• <strong>Pricing before Objections:</strong> Pricing discussion triggers most objections - "too expensive", "need to think about it"</p>
                <p>• <strong>Objections after Pricing:</strong> Objections don't arise after closing - if you're at closing, objections have been handled</p>
                <p>• <strong>Emotions throughout:</strong> Emotional responses (frustration, excitement, hesitation) can occur at any stage</p>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Key Insight
              </h4>
              <p className="text-muted-foreground">
                <strong>Objections don't come after closing.</strong> If a customer has objections after you've reached the closing stage, 
                it means you didn't fully address their concerns during negotiation. The goal is to handle all objections 
                BEFORE asking for commitment, not after.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesGuide;
