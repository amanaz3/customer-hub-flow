import React, { useState } from 'react';
import { ArrowLeft, Brain, Target, Users, DollarSign, Lightbulb, AlertTriangle, BookOpen, CheckCircle2, XCircle, ChevronRight, Trophy, Star, GraduationCap, MessageSquare, Heart, Shield, Zap, Award, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Quiz Question Component
const QuizQuestion = ({ 
  question, 
  options, 
  correctIndex, 
  explanation,
  onAnswer
}: { 
  question: string; 
  options: string[]; 
  correctIndex: number; 
  explanation: string;
  onAnswer: (correct: boolean) => void;
}) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelected(index);
    setShowResult(true);
    onAnswer(index === correctIndex);
  };

  return (
    <div className="p-4 rounded-lg bg-background/50 border space-y-3">
      <p className="font-medium text-foreground">{question}</p>
      <div className="space-y-2">
        {options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            className={cn(
              "w-full p-3 rounded-lg border text-left transition-all text-sm",
              selected === i && showResult
                ? i === correctIndex
                  ? "bg-green-500/20 border-green-500/50 text-green-700"
                  : "bg-red-500/20 border-red-500/50 text-red-700"
                : i === correctIndex && showResult
                ? "bg-green-500/20 border-green-500/50"
                : "hover:bg-muted/50 border-border/50"
            )}
            disabled={showResult}
          >
            <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
            {option}
          </button>
        ))}
      </div>
      {showResult && (
        <div className={cn(
          "p-3 rounded-lg text-sm",
          selected === correctIndex ? "bg-green-500/10 text-green-700" : "bg-amber-500/10 text-amber-700"
        )}>
          <p className="font-medium mb-1">
            {selected === correctIndex ? "✓ Correct!" : "✗ Not quite right"}
          </p>
          <p className="text-muted-foreground">{explanation}</p>
        </div>
      )}
    </div>
  );
};

// Scenario Test Component
const ScenarioTest = ({ 
  scenario, 
  clientSays, 
  options, 
  bestIndex, 
  feedback 
}: { 
  scenario: string;
  clientSays: string;
  options: string[];
  bestIndex: number;
  feedback: string[];
}) => {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/20 space-y-4">
      <div>
        <Badge variant="outline" className="mb-2 bg-purple-500/10 text-purple-600">Scenario</Badge>
        <p className="text-sm text-muted-foreground">{scenario}</p>
      </div>
      <div className="p-3 rounded bg-muted/50 border-l-4 border-primary">
        <p className="text-sm font-medium">Client says:</p>
        <p className="text-muted-foreground italic">"{clientSays}"</p>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">How do you respond?</p>
        <div className="space-y-2">
          {options.map((option, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={cn(
                "w-full p-3 rounded-lg border text-left transition-all text-sm",
                selected === i
                  ? i === bestIndex
                    ? "bg-green-500/20 border-green-500/50"
                    : "bg-amber-500/20 border-amber-500/50"
                  : "hover:bg-muted/50 border-border/50"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      {selected !== null && (
        <div className={cn(
          "p-3 rounded-lg text-sm",
          selected === bestIndex ? "bg-green-500/10" : "bg-amber-500/10"
        )}>
          <p className="font-medium mb-1">
            {selected === bestIndex ? "✓ Best Response!" : "Consider this..."}
          </p>
          <p className="text-muted-foreground">{feedback[selected]}</p>
        </div>
      )}
    </div>
  );
};

// Self-Reflection Component
const SelfReflection = ({ questions }: { questions: string[] }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/20">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-amber-500" />
          <span className="font-medium text-foreground">Self-Reflection Questions</span>
        </div>
        <ChevronRight className={cn("h-4 w-4 transition-transform", expanded && "rotate-90")} />
      </button>
      {expanded && (
        <div className="mt-4 space-y-3">
          {questions.map((q, i) => (
            <div key={i} className="p-3 rounded bg-background/50 border">
              <p className="text-sm text-muted-foreground">{i + 1}. {q}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground italic">
            Take a moment to honestly answer these questions. Write them down in a journal for better retention.
          </p>
        </div>
      )}
    </div>
  );
};

const SalesGuide = () => {
  const navigate = useNavigate();
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [quizScores, setQuizScores] = useState<Record<string, { correct: number; total: number }>>({});

  const handleQuizAnswer = (level: string, correct: boolean) => {
    setQuizScores(prev => ({
      ...prev,
      [level]: {
        correct: (prev[level]?.correct || 0) + (correct ? 1 : 0),
        total: (prev[level]?.total || 0) + 1
      }
    }));
  };

  const levels = [
    { id: 1, title: "Foundation", icon: GraduationCap, color: "blue", desc: "What is sales? The mindset." },
    { id: 2, title: "Opening", icon: Zap, color: "cyan", desc: "First impressions & hooks" },
    { id: 3, title: "Trust Building", icon: Heart, color: "pink", desc: "Building rapport & connection" },
    { id: 4, title: "Discovery", icon: Target, color: "green", desc: "Understanding client needs" },
    { id: 5, title: "Objections", icon: Shield, color: "amber", desc: "Handling resistance" },
    { id: 6, title: "Closing", icon: Trophy, color: "purple", desc: "Sealing the deal" },
    { id: 7, title: "Advanced", icon: Star, color: "orange", desc: "Personality types & mastery" },
    { id: 8, title: "Assessment", icon: Award, color: "emerald", desc: "Full scenarios & certification" },
  ];

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/playbook-editor')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Playbook Editor
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-primary" />
          Sales Training Academy
        </h1>
        <p className="text-muted-foreground mt-2">Progressive learning from basics to mastery • Quizzes • Scenarios • Self-Assessment</p>
      </div>

      {/* Progress Overview */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Your Progress</span>
            <span className="text-sm text-muted-foreground">{completedLevels.length}/{levels.length} Levels</span>
          </div>
          <Progress value={(completedLevels.length / levels.length) * 100} className="h-2" />
          <div className="flex gap-2 mt-3 flex-wrap">
            {levels.map(level => (
              <Badge 
                key={level.id}
                variant={completedLevels.includes(level.id) ? "default" : "outline"}
                className={cn(
                  "text-xs",
                  completedLevels.includes(level.id) && "bg-green-500"
                )}
              >
                {level.id}. {level.title}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="level-1" className="w-full">
        <TabsList className="flex flex-wrap gap-1 h-auto mb-6 p-2 bg-muted/50">
          {levels.map(level => {
            const Icon = level.icon;
            return (
              <TabsTrigger key={level.id} value={`level-${level.id}`} className="text-xs px-3 py-2 gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                L{level.id}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* ========== LEVEL 1: FOUNDATION ========== */}
        <TabsContent value="level-1" className="space-y-6">
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <GraduationCap className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <CardTitle>Level 1: Foundation</CardTitle>
                  <CardDescription>Understanding what sales really is</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Section 1.1 */}
              <div className="p-5 rounded-lg bg-background/50 border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">1</span>
                  What Is Sales? (Not What You Think)
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded bg-red-500/10 border border-red-500/20">
                    <p className="font-medium text-red-600 mb-2">❌ Sales is NOT:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Convincing people to buy things they do not need</li>
                      <li>• Tricking or manipulating customers</li>
                      <li>• Being pushy or aggressive</li>
                      <li>• Talking more than listening</li>
                      <li>• Just about making money</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded bg-green-500/10 border border-green-500/20">
                    <p className="font-medium text-green-600 mb-2">✓ Sales IS:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• <strong>Helping</strong> people solve problems</li>
                      <li>• <strong>Understanding</strong> what someone truly needs</li>
                      <li>• <strong>Matching</strong> solutions to problems</li>
                      <li>• <strong>Building</strong> trust and relationships</li>
                      <li>• <strong>Creating</strong> win-win outcomes</li>
                    </ul>
                  </div>
                </div>
                <div className="p-4 rounded bg-primary/5 border border-primary/20">
                  <p className="text-sm font-medium text-primary">💡 Key Insight</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The best salespeople are not the best talkers — they are the best <strong>listeners</strong> and <strong>problem solvers</strong>.
                    Your job is to understand, not to convince.
                  </p>
                </div>
              </div>

              {/* Section 1.2 */}
              <div className="p-5 rounded-lg bg-background/50 border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">2</span>
                  The Sales Mindset
                </h3>
                <div className="space-y-3">
                  <div className="p-4 rounded bg-muted/50">
                    <p className="font-medium text-foreground mb-2">🧠 Belief #1: You are a Helper, Not a Seller</p>
                    <p className="text-sm text-muted-foreground">
                      When you genuinely believe you are helping someone, your energy changes. Clients can feel authenticity.
                      If you would not recommend this product to your own family, you should not sell it.
                    </p>
                  </div>
                  <div className="p-4 rounded bg-muted/50">
                    <p className="font-medium text-foreground mb-2">🧠 Belief #2: Rejection is Redirection</p>
                    <p className="text-sm text-muted-foreground">
                      "No" does not mean you failed. It means this person is not the right fit right now.
                      Every "no" brings you closer to a "yes". Top performers hear more "no"s because they try more.
                    </p>
                  </div>
                  <div className="p-4 rounded bg-muted/50">
                    <p className="font-medium text-foreground mb-2">🧠 Belief #3: Curiosity Over Assumption</p>
                    <p className="text-sm text-muted-foreground">
                      Never assume you know what the client needs. Ask questions. Be genuinely curious.
                      The client who talks the most feels most understood.
                    </p>
                  </div>
                  <div className="p-4 rounded bg-muted/50">
                    <p className="font-medium text-foreground mb-2">🧠 Belief #4: Value First, Money Follows</p>
                    <p className="text-sm text-muted-foreground">
                      Focus on creating value for the client. If they see clear value, price becomes secondary.
                      People pay premium for solutions that truly solve their problems.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 1.3 - Client Psychology */}
              <div className="p-5 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">3</span>
                  What Goes On In The Client's Mind
                </h3>
                <p className="text-sm text-muted-foreground">Understanding client psychology is 80% of sales success. Every client has these thoughts:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded bg-background/50 border">
                    <p className="font-medium text-red-500 mb-2">🛡️ Defense Mode (First 30 seconds)</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• "Is this person going to waste my time?"</li>
                      <li>• "Are they trying to sell me something I do not need?"</li>
                      <li>• "Can I trust this person?"</li>
                      <li>• "How do I get out of this quickly?"</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded bg-background/50 border">
                    <p className="font-medium text-amber-500 mb-2">🤔 Evaluation Mode (During Call)</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• "Does this person understand MY situation?"</li>
                      <li>• "Is this worth my money and time?"</li>
                      <li>• "What happens if this goes wrong?"</li>
                      <li>• "What will others think of my decision?"</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded bg-background/50 border">
                    <p className="font-medium text-green-500 mb-2">✅ Ready to Buy Mode</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• "This person gets me and my needs"</li>
                      <li>• "I feel safe making this decision"</li>
                      <li>• "The value clearly exceeds the cost"</li>
                      <li>• "I can justify this to myself and others"</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded bg-background/50 border">
                    <p className="font-medium text-blue-500 mb-2">🔒 Hidden Concerns (Never Said)</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• "What if I look stupid for asking questions?"</li>
                      <li>• "I do not want to seem like I cannot afford it"</li>
                      <li>• "My partner/boss might disagree"</li>
                      <li>• "I have been burned before by salespeople"</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Quiz Section */}
              <div className="p-5 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    Level 1 Quiz
                  </h3>
                  {quizScores['level-1'] && (
                    <Badge variant="outline">
                      Score: {quizScores['level-1'].correct}/{quizScores['level-1'].total}
                    </Badge>
                  )}
                </div>
                
                <QuizQuestion
                  question="What is the primary role of a salesperson?"
                  options={[
                    "Convincing people to buy products",
                    "Talking about product features",
                    "Understanding client needs and matching solutions",
                    "Closing deals as quickly as possible"
                  ]}
                  correctIndex={2}
                  explanation="Sales is about understanding what the client truly needs and helping them find the right solution. It's not about convincing or rushing."
                  onAnswer={(c) => handleQuizAnswer('level-1', c)}
                />
                
                <QuizQuestion
                  question="When a client says 'no', what should you think?"
                  options={[
                    "I failed at my job",
                    "This client is difficult",
                    "I should push harder",
                    "This person is not the right fit right now"
                  ]}
                  correctIndex={3}
                  explanation="'No' is redirection, not rejection. It simply means this particular client isn't the right fit at this moment. Every 'no' brings you closer to a 'yes'."
                  onAnswer={(c) => handleQuizAnswer('level-1', c)}
                />

                <QuizQuestion
                  question="What is the client's main concern in the first 30 seconds?"
                  options={[
                    "How much does it cost?",
                    "Is this person going to waste my time?",
                    "What are the product features?",
                    "When can I get started?"
                  ]}
                  correctIndex={1}
                  explanation="In the first 30 seconds, clients are in 'defense mode' - their primary concern is whether this conversation is worth their time."
                  onAnswer={(c) => handleQuizAnswer('level-1', c)}
                />
              </div>

              {/* Self Reflection */}
              <SelfReflection questions={[
                "Do I genuinely believe our service helps clients? If not, what would help me believe?",
                "How do I currently feel when a client says 'no'? How would I like to feel?",
                "When was the last time I truly listened to someone without thinking about what to say next?",
                "What assumptions do I make about clients before talking to them?"
              ]} />

              <Button 
                className="w-full" 
                onClick={() => setCompletedLevels(prev => [...new Set([...prev, 1])])}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Level 1 Complete & Continue to Level 2
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== LEVEL 2: OPENING ========== */}
        <TabsContent value="level-2" className="space-y-6">
          <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Zap className="h-6 w-6 text-cyan-500" />
                </div>
                <div>
                  <CardTitle>Level 2: Opening & First Impressions</CardTitle>
                  <CardDescription>The first 30 seconds make or break your call</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Why Opening Matters */}
              <div className="p-5 rounded-lg bg-background/50 border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500 text-white text-xs flex items-center justify-center">1</span>
                  Why Opening Matters
                </h3>
                <div className="p-4 rounded bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                  <p className="font-medium text-cyan-600 text-lg">You have 30 seconds to answer one question:</p>
                  <p className="text-xl font-bold text-foreground mt-2">"Why should I keep listening?"</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  If you fail to capture attention in the first 30 seconds, the client mentally checks out.
                  They may stay on the call, but they are no longer engaged.
                </p>
              </div>

              {/* Bad vs Good Openings */}
              <div className="p-5 rounded-lg bg-background/50 border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500 text-white text-xs flex items-center justify-center">2</span>
                  Bad Openings vs Good Openings
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded bg-red-500/10 border border-red-500/20">
                    <p className="font-medium text-red-500 mb-3">❌ Common Mistakes</p>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="line-through">"Hi, I am calling from XYZ company..."</li>
                      <li className="line-through">"Do you have a moment to talk about..."</li>
                      <li className="line-through">"I wanted to introduce our services..."</li>
                      <li className="line-through">"Is this a good time?"</li>
                    </ul>
                    <p className="text-red-500 text-sm mt-3 font-medium">
                      Why bad: It is all about YOU, not them.
                    </p>
                  </div>
                  <div className="p-4 rounded bg-green-500/10 border border-green-500/20">
                    <p className="font-medium text-green-500 mb-3">✓ What Works</p>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>"I noticed [something specific about them]..."</li>
                      <li>"Quick question - [curiosity hook]?"</li>
                      <li>"[Mutual connection] mentioned you might..."</li>
                      <li>"I help [their type] with [their problem]..."</li>
                    </ul>
                    <p className="text-green-500 text-sm mt-3 font-medium">
                      Why good: Shows you did homework. It is about THEM.
                    </p>
                  </div>
                </div>
              </div>

              {/* Hook Techniques */}
              <div className="p-5 rounded-lg bg-background/50 border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500 text-white text-xs flex items-center justify-center">3</span>
                  The 4 Hook Techniques
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded bg-purple-500/10 border border-purple-500/20">
                    <p className="font-medium text-purple-600 mb-2">🎯 The Curiosity Hook</p>
                    <p className="text-muted-foreground italic text-sm">"I have a quick question that might save you [time/money/hassle]..."</p>
                    <p className="text-sm text-foreground mt-2"><strong>Purpose:</strong> Creates intrigue without commitment</p>
                  </div>
                  <div className="p-4 rounded bg-blue-500/10 border border-blue-500/20">
                    <p className="font-medium text-blue-600 mb-2">🔗 The Relevance Hook</p>
                    <p className="text-muted-foreground italic text-sm">"I noticed you are expanding to [area] - we just helped [similar company] with that..."</p>
                    <p className="text-sm text-foreground mt-2"><strong>Purpose:</strong> Shows you understand their world</p>
                  </div>
                  <div className="p-4 rounded bg-green-500/10 border border-green-500/20">
                    <p className="font-medium text-green-600 mb-2">👥 The Social Proof Hook</p>
                    <p className="text-muted-foreground italic text-sm">"[Known name] in your industry just completed [outcome] with us..."</p>
                    <p className="text-sm text-foreground mt-2"><strong>Purpose:</strong> Leverages fear of missing out</p>
                  </div>
                  <div className="p-4 rounded bg-amber-500/10 border border-amber-500/20">
                    <p className="font-medium text-amber-600 mb-2">🎪 The Problem Hook</p>
                    <p className="text-muted-foreground italic text-sm">"Most [their type] I talk to are struggling with [common pain]..."</p>
                    <p className="text-sm text-foreground mt-2"><strong>Purpose:</strong> Resonates if they have the problem</p>
                  </div>
                </div>
              </div>

              {/* Voice & Tone */}
              <div className="p-5 rounded-lg bg-background/50 border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500 text-white text-xs flex items-center justify-center">4</span>
                  Voice & Tone - HOW to Speak
                </h3>
                <div className="grid md:grid-cols-4 gap-3">
                  <div className="p-4 rounded bg-muted/50 text-center">
                    <p className="font-medium text-foreground">🎵 Pace</p>
                    <p className="text-xs text-muted-foreground mt-1">Match their speed. Slow = authority. Fast = excitement.</p>
                  </div>
                  <div className="p-4 rounded bg-muted/50 text-center">
                    <p className="font-medium text-foreground">🎭 Tone</p>
                    <p className="text-xs text-muted-foreground mt-1">Confident but not pushy. Curious not interrogating.</p>
                  </div>
                  <div className="p-4 rounded bg-muted/50 text-center">
                    <p className="font-medium text-foreground">⏸️ Pauses</p>
                    <p className="text-xs text-muted-foreground mt-1">After key points. Let them think. Do not fill silence.</p>
                  </div>
                  <div className="p-4 rounded bg-muted/50 text-center">
                    <p className="font-medium text-foreground">😊 Energy</p>
                    <p className="text-xs text-muted-foreground mt-1">Smile while talking - they can hear it. Be warm.</p>
                  </div>
                </div>
              </div>

              {/* Opening Scripts */}
              <div className="p-5 rounded-lg bg-green-500/5 border border-green-500/20 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">5</span>
                  Ready-to-Use Opening Scripts
                </h3>
                <div className="space-y-3">
                  <div className="p-4 rounded bg-background/50">
                    <Badge variant="outline" className="mb-2 bg-blue-500/10 text-blue-600">Outbound Cold Call</Badge>
                    <p className="text-muted-foreground italic text-sm">"Hi [Name], this is [You] from AMANA. I will be brief - I help business owners in [industry] open bank accounts in half the usual time. Is that something worth 2 minutes of your time?"</p>
                    <p className="text-xs text-foreground mt-2">💡 <strong>Key:</strong> Respect their time, give value proposition immediately</p>
                  </div>
                  <div className="p-4 rounded bg-background/50">
                    <Badge variant="outline" className="mb-2 bg-green-500/10 text-green-600">Inbound Inquiry</Badge>
                    <p className="text-muted-foreground italic text-sm">"Thanks for reaching out! Before I dive in, I would love to understand what caught your attention about us - what are you hoping to achieve?"</p>
                    <p className="text-xs text-foreground mt-2">💡 <strong>Key:</strong> Warmth first, then understand their motivation</p>
                  </div>
                  <div className="p-4 rounded bg-background/50">
                    <Badge variant="outline" className="mb-2 bg-purple-500/10 text-purple-600">Follow-up Call</Badge>
                    <p className="text-muted-foreground italic text-sm">"Hi [Name], it is [You] from AMANA. We spoke [timeframe] ago about [topic]. I wanted to check in - has anything changed since then? Any new questions I can help with?"</p>
                    <p className="text-xs text-foreground mt-2">💡 <strong>Key:</strong> Remind context, show you remember them</p>
                  </div>
                </div>
              </div>

              {/* Scenario Practice */}
              <div className="p-5 rounded-lg bg-purple-500/5 border border-purple-500/20 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-500" />
                  Scenario Practice
                </h3>
                
                <ScenarioTest
                  scenario="You are making a cold call to a business owner who has never heard of your company."
                  clientSays="Yes, who is this?"
                  options={[
                    "Hi, I am calling from AMANA corporate services. Do you have a moment to talk about our services?",
                    "Hi [Name], quick question - are you currently happy with how long it takes to open a corporate bank account?",
                    "Hi, I am [Name] and I would like to tell you about our amazing company formation services.",
                    "Is the decision maker available? I need to speak with someone about your banking needs."
                  ]}
                  bestIndex={1}
                  feedback={[
                    "This is a generic opener that focuses on you, not them. They will likely want to end the call.",
                    "Great! This creates curiosity, addresses a real pain point, and gets them thinking about their own situation.",
                    "Starting with 'amazing' comes across as salesy and not credible. Focus on their needs instead.",
                    "Asking for the decision maker when you do not know who they are is presumptuous and can offend."
                  ]}
                />

                <ScenarioTest
                  scenario="A client inquired through your website and you are calling them back."
                  clientSays="Oh yes, I filled out that form yesterday."
                  options={[
                    "Great! Let me tell you all about our services and packages.",
                    "Perfect! So what package are you interested in?",
                    "Thanks for reaching out! What made you decide to look into this now? What are you hoping to achieve?",
                    "Wonderful! Our prices start at AED 5,000. Would you like to proceed?"
                  ]}
                  bestIndex={2}
                  feedback={[
                    "Jumping straight into your pitch misses the opportunity to understand their needs.",
                    "Asking about packages before understanding needs is premature.",
                    "Excellent! This shows genuine interest in their situation and helps you understand their motivation.",
                    "Jumping to price before establishing value or understanding needs will almost always fail."
                  ]}
                />
              </div>

              {/* Quiz */}
              <div className="p-5 rounded-lg bg-cyan-500/5 border border-cyan-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-cyan-500" />
                    Level 2 Quiz
                  </h3>
                  {quizScores['level-2'] && (
                    <Badge variant="outline">
                      Score: {quizScores['level-2'].correct}/{quizScores['level-2'].total}
                    </Badge>
                  )}
                </div>

                <QuizQuestion
                  question="How long do you have to capture a client's attention at the start of a call?"
                  options={["2 minutes", "30 seconds", "5 minutes", "1 minute"]}
                  correctIndex={1}
                  explanation="You have approximately 30 seconds to answer the client's unspoken question: 'Why should I keep listening?'"
                  onAnswer={(c) => handleQuizAnswer('level-2', c)}
                />

                <QuizQuestion
                  question="What makes a good opening different from a bad opening?"
                  options={[
                    "Good openings are longer and more detailed",
                    "Good openings focus on the client, not on you",
                    "Good openings always mention price first",
                    "Good openings ask if it is a good time"
                  ]}
                  correctIndex={1}
                  explanation="Great openings are client-focused. They show you understand their world and have something relevant to offer them."
                  onAnswer={(c) => handleQuizAnswer('level-2', c)}
                />

                <QuizQuestion
                  question="Which hook technique uses phrases like 'Most business owners struggle with...'?"
                  options={["Curiosity Hook", "Social Proof Hook", "Problem Hook", "Relevance Hook"]}
                  correctIndex={2}
                  explanation="The Problem Hook directly addresses a common pain point that resonates if the client has that same problem."
                  onAnswer={(c) => handleQuizAnswer('level-2', c)}
                />
              </div>

              <SelfReflection questions={[
                "What is my current go-to opening line? Is it about me or about them?",
                "How do I feel in the first 30 seconds of a call? Nervous? Confident? Rushed?",
                "Can I recall a time when someone opened a conversation with me really well? What did they do?",
                "What research can I do BEFORE my next call to make my opening more relevant?"
              ]} />

              <Button 
                className="w-full" 
                onClick={() => setCompletedLevels(prev => [...new Set([...prev, 2])])}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Level 2 Complete & Continue to Level 3
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== LEVEL 3: TRUST BUILDING ========== */}
        <TabsContent value="level-3" className="space-y-6">
          <Card className="border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-rose-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/10">
                  <Heart className="h-6 w-6 text-pink-500" />
                </div>
                <div>
                  <CardTitle>Level 3: Trust Building</CardTitle>
                  <CardDescription>No trust = No sale. Trust before demonstrating.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Trust Formula */}
              <div className="p-5 rounded-lg bg-background/50 border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center">1</span>
                  The Trust Formula
                </h3>
                <div className="p-4 rounded bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20">
                  <p className="text-lg font-bold text-center text-foreground">
                    Trust = (Credibility + Reliability + Intimacy) ÷ Self-Interest
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 rounded bg-muted/50">
                    <p className="font-medium text-green-600">✓ Credibility</p>
                    <p className="text-sm text-muted-foreground">Do you know what you are talking about? Show expertise without being arrogant.</p>
                  </div>
                  <div className="p-4 rounded bg-muted/50">
                    <p className="font-medium text-blue-600">✓ Reliability</p>
                    <p className="text-sm text-muted-foreground">Do you do what you say? Follow through on small promises.</p>
                  </div>
                  <div className="p-4 rounded bg-muted/50">
                    <p className="font-medium text-purple-600">✓ Intimacy</p>
                    <p className="text-sm text-muted-foreground">Do they feel safe sharing with you? Create psychological safety.</p>
                  </div>
                  <div className="p-4 rounded bg-muted/50">
                    <p className="font-medium text-red-600">÷ Self-Interest</p>
                    <p className="text-sm text-muted-foreground">The more you seem to care only about closing, the less they trust you.</p>
                  </div>
                </div>
              </div>

              {/* Trust Building Actions */}
              <div className="p-5 rounded-lg bg-background/50 border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center">2</span>
                  Trust-Building Actions (Do These!)
                </h3>
                <div className="space-y-3">
                  <div className="p-4 rounded bg-green-500/10 border border-green-500/20">
                    <p className="font-medium text-foreground">1. Listen More Than You Talk (70/30 Rule)</p>
                    <p className="text-sm text-muted-foreground mt-1">You should talk only 30% of the time. Ask questions and let them talk 70%.</p>
                  </div>
                  <div className="p-4 rounded bg-green-500/10 border border-green-500/20">
                    <p className="font-medium text-foreground">2. Acknowledge Before Responding</p>
                    <p className="text-sm text-muted-foreground mt-1">"I hear you..." / "That makes sense..." / "I understand why you would feel that way..."</p>
                  </div>
                  <div className="p-4 rounded bg-green-500/10 border border-green-500/20">
                    <p className="font-medium text-foreground">3. Admit When You Do Not Know</p>
                    <p className="text-sm text-muted-foreground mt-1">"That is a great question. I am not 100% sure, but I will find out and get back to you."</p>
                  </div>
                  <div className="p-4 rounded bg-green-500/10 border border-green-500/20">
                    <p className="font-medium text-foreground">4. Use Their Name (Sparingly)</p>
                    <p className="text-sm text-muted-foreground mt-1">Using their name shows you see them as a person. But do not overdo it - it becomes creepy.</p>
                  </div>
                  <div className="p-4 rounded bg-green-500/10 border border-green-500/20">
                    <p className="font-medium text-foreground">5. Mirror Their Energy</p>
                    <p className="text-sm text-muted-foreground mt-1">If they are calm, be calm. If they are excited, match their energy. People trust those who are similar to them.</p>
                  </div>
                </div>
              </div>

              {/* Trust Killers */}
              <div className="p-5 rounded-lg bg-red-500/5 border border-red-500/20 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Trust Killers (Never Do These!)
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="p-3 rounded bg-background/50 border border-red-500/20">
                    <p className="text-sm text-red-600 font-medium">❌ Interrupting</p>
                    <p className="text-xs text-muted-foreground">Let them finish. Even if you know what they will say.</p>
                  </div>
                  <div className="p-3 rounded bg-background/50 border border-red-500/20">
                    <p className="text-sm text-red-600 font-medium">❌ Over-promising</p>
                    <p className="text-xs text-muted-foreground">Better to under-promise and over-deliver.</p>
                  </div>
                  <div className="p-3 rounded bg-background/50 border border-red-500/20">
                    <p className="text-sm text-red-600 font-medium">❌ Talking bad about competitors</p>
                    <p className="text-xs text-muted-foreground">It makes YOU look bad, not them.</p>
                  </div>
                  <div className="p-3 rounded bg-background/50 border border-red-500/20">
                    <p className="text-sm text-red-600 font-medium">❌ Being defensive</p>
                    <p className="text-xs text-muted-foreground">When challenged, stay curious not defensive.</p>
                  </div>
                  <div className="p-3 rounded bg-background/50 border border-red-500/20">
                    <p className="text-sm text-red-600 font-medium">❌ Ignoring concerns</p>
                    <p className="text-xs text-muted-foreground">Address concerns head-on. Do not brush them off.</p>
                  </div>
                  <div className="p-3 rounded bg-background/50 border border-red-500/20">
                    <p className="text-sm text-red-600 font-medium">❌ Rushing to pitch</p>
                    <p className="text-xs text-muted-foreground">Earn the right to present by understanding first.</p>
                  </div>
                </div>
              </div>

              {/* Scenario Practice */}
              <div className="p-5 rounded-lg bg-purple-500/5 border border-purple-500/20 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-500" />
                  Scenario Practice
                </h3>
                
                <ScenarioTest
                  scenario="You are on a discovery call and the client suddenly seems hesitant and quiet."
                  clientSays="I do not know... this is all new to me."
                  options={[
                    "Do not worry, our process is very simple. Let me explain...",
                    "I understand. Many clients feel the same way at first. What specifically is making you feel uncertain?",
                    "Trust me, we have done this hundreds of times. You are in good hands.",
                    "Would you like me to send you some information to read instead?"
                  ]}
                  bestIndex={1}
                  feedback={[
                    "This dismisses their concern. You are not acknowledging their feelings.",
                    "Perfect! You are acknowledging, normalizing, and asking them to share more. This builds trust.",
                    "'Trust me' is often a trust-killer. Show, do not tell.",
                    "This might feel like you are trying to end the conversation. They need reassurance, not escape routes."
                  ]}
                />

                <ScenarioTest
                  scenario="A client asks a technical question you do not know the answer to."
                  clientSays="What is the exact timeline for getting the trade license with multiple activities?"
                  options={[
                    "It is usually about 2-3 weeks.",
                    "That depends on many factors. Can I check with our team and get back to you today?",
                    "Our competitor takes 4 weeks but we are faster.",
                    "Why are you asking? Do you have a deadline?"
                  ]}
                  bestIndex={1}
                  feedback={[
                    "Making up an answer you are not sure about can backfire and destroy trust later.",
                    "Excellent! Honesty when you do not know builds credibility. Promising to follow up shows reliability.",
                    "Bashing competitors makes you look unprofessional and does not answer their question.",
                    "Deflecting with a question when they want information feels evasive."
                  ]}
                />
              </div>

              {/* Quiz */}
              <div className="p-5 rounded-lg bg-pink-500/5 border border-pink-500/20 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-pink-500" />
                  Level 3 Quiz
                </h3>

                <QuizQuestion
                  question="According to the 70/30 rule, how much should YOU talk during a call?"
                  options={["70% of the time", "50% of the time", "30% of the time", "As much as needed"]}
                  correctIndex={2}
                  explanation="The 70/30 rule says you should listen 70% and talk only 30%. The client who talks more feels more understood."
                  onAnswer={(c) => handleQuizAnswer('level-3', c)}
                />

                <QuizQuestion
                  question="What should you do when a client asks something you do not know?"
                  options={[
                    "Give your best guess to seem knowledgeable",
                    "Admit you do not know and promise to find out",
                    "Change the subject to something you know",
                    "Say 'That is not my area' and move on"
                  ]}
                  correctIndex={1}
                  explanation="Admitting what you do not know builds credibility. People trust those who are honest about their limitations."
                  onAnswer={(c) => handleQuizAnswer('level-3', c)}
                />

                <QuizQuestion
                  question="Which of these is a trust killer?"
                  options={[
                    "Using the client's name",
                    "Matching their energy level",
                    "Talking negatively about competitors",
                    "Acknowledging their concerns"
                  ]}
                  correctIndex={2}
                  explanation="Talking badly about competitors actually makes YOU look bad and unprofessional. Focus on your own value instead."
                  onAnswer={(c) => handleQuizAnswer('level-3', c)}
                />
              </div>

              <SelfReflection questions={[
                "In my last call, how much did I talk vs listen? Was it closer to 70/30 or 50/50 or worse?",
                "When was the last time I admitted I did not know something? How did the client react?",
                "Do I have a habit of interrupting? Ask a colleague to observe your next call.",
                "What is one trust-building action I can practice consistently this week?"
              ]} />

              <Button 
                className="w-full" 
                onClick={() => setCompletedLevels(prev => [...new Set([...prev, 3])])}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Level 3 Complete & Continue to Level 4
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== LEVEL 4: DISCOVERY ========== */}
        <TabsContent value="level-4" className="space-y-6">
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Target className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <CardTitle>Level 4: Discovery & Understanding Needs</CardTitle>
                  <CardDescription>The client who feels understood is the client who buys</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Why Discovery Matters */}
              <div className="p-5 rounded-lg bg-background/50 border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">1</span>
                  Why Discovery Matters
                </h3>
                <div className="p-4 rounded bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                  <p className="font-medium text-green-600">The Golden Rule of Sales:</p>
                  <p className="text-lg font-bold text-foreground mt-1">"Prescription without diagnosis is malpractice."</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  If a doctor gave you medicine without asking about your symptoms, you would not trust them.
                  Similarly, if you pitch solutions without understanding the client's situation, they will not trust you.
                </p>
              </div>

              {/* BANT Framework */}
              <div className="p-5 rounded-lg bg-background/50 border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">2</span>
                  The BANT Framework
                </h3>
                <div className="grid md:grid-cols-4 gap-3">
                  <div className="p-4 rounded bg-green-500/10 border border-green-500/20 text-center">
                    <p className="font-bold text-green-600 text-2xl">B</p>
                    <p className="font-medium">Budget</p>
                    <p className="text-xs text-muted-foreground mt-1">Can they afford it?</p>
                    <p className="text-xs text-muted-foreground italic mt-2">"What budget range were you considering?"</p>
                  </div>
                  <div className="p-4 rounded bg-blue-500/10 border border-blue-500/20 text-center">
                    <p className="font-bold text-blue-600 text-2xl">A</p>
                    <p className="font-medium">Authority</p>
                    <p className="text-xs text-muted-foreground mt-1">Can they decide?</p>
                    <p className="text-xs text-muted-foreground italic mt-2">"Who else is involved in this decision?"</p>
                  </div>
                  <div className="p-4 rounded bg-purple-500/10 border border-purple-500/20 text-center">
                    <p className="font-bold text-purple-600 text-2xl">N</p>
                    <p className="font-medium">Need</p>
                    <p className="text-xs text-muted-foreground mt-1">Do they need it?</p>
                    <p className="text-xs text-muted-foreground italic mt-2">"What is your biggest challenge right now?"</p>
                  </div>
                  <div className="p-4 rounded bg-amber-500/10 border border-amber-500/20 text-center">
                    <p className="font-bold text-amber-600 text-2xl">T</p>
                    <p className="font-medium">Timeline</p>
                    <p className="text-xs text-muted-foreground mt-1">When do they need it?</p>
                    <p className="text-xs text-muted-foreground italic mt-2">"When are you hoping to have this done by?"</p>
                  </div>
                </div>
              </div>

              {/* Discovery Questions */}
              <div className="p-5 rounded-lg bg-background/50 border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">3</span>
                  Powerful Discovery Questions
                </h3>
                <div className="space-y-3">
                  <div className="p-4 rounded bg-muted/50">
                    <p className="font-medium text-foreground mb-2">🎯 Situation Questions</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• "Tell me about your current situation with [area]..."</li>
                      <li>• "How are you handling [process] right now?"</li>
                      <li>• "What does your typical [workflow] look like?"</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded bg-muted/50">
                    <p className="font-medium text-foreground mb-2">😤 Problem Questions</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• "What is your biggest challenge with [area] right now?"</li>
                      <li>• "What frustrates you most about the current process?"</li>
                      <li>• "What happens when [problem] occurs?"</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded bg-muted/50">
                    <p className="font-medium text-foreground mb-2">💰 Implication Questions</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• "What happens if this problem is not solved in the next 3 months?"</li>
                      <li>• "How is this affecting your [revenue/time/team]?"</li>
                      <li>• "What is the cost of doing nothing?"</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded bg-muted/50">
                    <p className="font-medium text-foreground mb-2">✨ Need-Payoff Questions</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• "If you could wave a magic wand, what would the ideal outcome look like?"</li>
                      <li>• "How would solving this impact your business?"</li>
                      <li>• "What would success look like for you?"</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Active Listening */}
              <div className="p-5 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">4</span>
                  Active Listening Techniques
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded bg-background/50">
                    <p className="font-medium text-foreground">🔄 Paraphrase</p>
                    <p className="text-sm text-muted-foreground mt-1">"So what I am hearing is..." / "Let me make sure I understand..."</p>
                  </div>
                  <div className="p-4 rounded bg-background/50">
                    <p className="font-medium text-foreground">🎯 Clarify</p>
                    <p className="text-sm text-muted-foreground mt-1">"Can you tell me more about...?" / "What do you mean by...?"</p>
                  </div>
                  <div className="p-4 rounded bg-background/50">
                    <p className="font-medium text-foreground">✅ Validate</p>
                    <p className="text-sm text-muted-foreground mt-1">"That makes total sense." / "I can see why that would be frustrating."</p>
                  </div>
                  <div className="p-4 rounded bg-background/50">
                    <p className="font-medium text-foreground">➡️ Probe Deeper</p>
                    <p className="text-sm text-muted-foreground mt-1">"And then what happened?" / "How did that make you feel?"</p>
                  </div>
                </div>
              </div>

              {/* Scenario Practice */}
              <div className="p-5 rounded-lg bg-purple-500/5 border border-purple-500/20 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-500" />
                  Scenario Practice
                </h3>
                
                <ScenarioTest
                  scenario="You are in discovery and the client gives a vague answer about their needs."
                  clientSays="We just need to get this done quickly."
                  options={[
                    "Great, we can definitely do it quickly. Let me tell you about our express service.",
                    "I understand speed is important. Can you help me understand what is driving the urgency? Is there a specific deadline or event?",
                    "How quickly are you thinking?",
                    "Speed is our specialty. We are the fastest in the market."
                  ]}
                  bestIndex={1}
                  feedback={[
                    "You are accepting a vague answer without understanding the real need behind it.",
                    "Excellent! You are acknowledging their need while digging deeper to understand the WHY behind the urgency.",
                    "This is okay but does not explore the underlying motivation.",
                    "Jumping to pitch mode without understanding their situation fully."
                  ]}
                />
              </div>

              {/* Quiz */}
              <div className="p-5 rounded-lg bg-green-500/5 border border-green-500/20 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Level 4 Quiz
                </h3>

                <QuizQuestion
                  question="What does the 'A' in BANT stand for?"
                  options={["Ability", "Authority", "Appetite", "Agreement"]}
                  correctIndex={1}
                  explanation="'A' stands for Authority - you need to know if the person can actually make the buying decision or if others are involved."
                  onAnswer={(c) => handleQuizAnswer('level-4', c)}
                />

                <QuizQuestion
                  question="What is an 'Implication Question'?"
                  options={[
                    "A question about their budget",
                    "A question about what happens if the problem is not solved",
                    "A question about who makes decisions",
                    "A question about their current situation"
                  ]}
                  correctIndex={1}
                  explanation="Implication questions explore the consequences of not solving the problem - 'What happens if this continues?'"
                  onAnswer={(c) => handleQuizAnswer('level-4', c)}
                />
              </div>

              <SelfReflection questions={[
                "Do I spend enough time in discovery, or do I rush to pitch?",
                "What is one discovery question I could add to my routine?",
                "How do I react when a client gives vague answers? Do I accept them or dig deeper?",
                "Can I recall a time I lost a deal because I did not fully understand the client's needs?"
              ]} />

              <Button 
                className="w-full" 
                onClick={() => setCompletedLevels(prev => [...new Set([...prev, 4])])}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Level 4 Complete & Continue to Level 5
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== LEVEL 5: OBJECTIONS ========== */}
        <TabsContent value="level-5" className="space-y-6">
          <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Shield className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <CardTitle>Level 5: Handling Objections</CardTitle>
                  <CardDescription>Objections are buying signals in disguise</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Reframe Objections */}
              <div className="p-5 rounded-lg bg-background/50 border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">1</span>
                  Reframing Objections
                </h3>
                <div className="p-4 rounded bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                  <p className="font-medium text-amber-600">The Truth About Objections:</p>
                  <p className="text-lg font-bold text-foreground mt-1">An objection means they are still engaged. If they did not care, they would just say "no thanks" and leave.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 rounded bg-red-500/10 border border-red-500/20">
                    <p className="font-medium text-red-600 mb-2">❌ Wrong Mindset</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• "They are trying to reject me"</li>
                      <li>• "I need to overcome this barrier"</li>
                      <li>• "I should argue my point harder"</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded bg-green-500/10 border border-green-500/20">
                    <p className="font-medium text-green-600 mb-2">✓ Right Mindset</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• "They are sharing their concerns"</li>
                      <li>• "They want me to address this before buying"</li>
                      <li>• "This is information I need to understand"</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* LAER Framework */}
              <div className="p-5 rounded-lg bg-background/50 border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">2</span>
                  The LAER Framework
                </h3>
                <div className="space-y-3">
                  <div className="p-4 rounded bg-blue-500/10 border border-blue-500/20">
                    <p className="font-bold text-blue-600 text-lg">L - Listen</p>
                    <p className="text-sm text-muted-foreground">Let them finish. Do not interrupt. Do not prepare your response while they are talking.</p>
                  </div>
                  <div className="p-4 rounded bg-purple-500/10 border border-purple-500/20">
                    <p className="font-bold text-purple-600 text-lg">A - Acknowledge</p>
                    <p className="text-sm text-muted-foreground">"I understand that concern..." / "That is a fair point..." / "I appreciate you sharing that..."</p>
                  </div>
                  <div className="p-4 rounded bg-green-500/10 border border-green-500/20">
                    <p className="font-bold text-green-600 text-lg">E - Explore</p>
                    <p className="text-sm text-muted-foreground">"Can you tell me more about that?" / "What specifically concerns you?" / "Is it [A] or [B] that worries you?"</p>
                  </div>
                  <div className="p-4 rounded bg-amber-500/10 border border-amber-500/20">
                    <p className="font-bold text-amber-600 text-lg">R - Respond</p>
                    <p className="text-sm text-muted-foreground">Only NOW do you respond to the objection with relevant information.</p>
                  </div>
                </div>
              </div>

              {/* Common Objections */}
              <div className="p-5 rounded-lg bg-background/50 border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">3</span>
                  Common Objections & Responses
                </h3>
                <div className="space-y-4">
                  <div className="p-4 rounded bg-muted/50">
                    <p className="font-medium text-red-600">"It is too expensive"</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Translation:</strong> "I do not see enough value yet" or "I am comparing to something else"
                    </p>
                    <p className="text-sm text-foreground mt-2 italic">
                      "I hear you. When you say too expensive, are you comparing to another option, or is it the total amount that is the concern?"
                    </p>
                  </div>
                  <div className="p-4 rounded bg-muted/50">
                    <p className="font-medium text-amber-600">"I need to think about it"</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Translation:</strong> "I have concerns I have not shared" or "I am not convinced yet"
                    </p>
                    <p className="text-sm text-foreground mt-2 italic">
                      "Of course. Just so I can help, what specifically would you want to think through?"
                    </p>
                  </div>
                  <div className="p-4 rounded bg-muted/50">
                    <p className="font-medium text-blue-600">"I need to discuss with my partner/boss"</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Translation:</strong> Could be real OR could be a polite way to end the conversation
                    </p>
                    <p className="text-sm text-foreground mt-2 italic">
                      "That makes sense - big decisions need alignment. What do you think they would be most concerned about? Maybe I can provide information to help that conversation."
                    </p>
                  </div>
                  <div className="p-4 rounded bg-muted/50">
                    <p className="font-medium text-purple-600">"We already have a provider"</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Translation:</strong> "Convince me to switch" or "I do not want to deal with change"
                    </p>
                    <p className="text-sm text-foreground mt-2 italic">
                      "That is great! Many of our clients had providers before. What made you take this call today - is there something your current provider is not addressing?"
                    </p>
                  </div>
                </div>
              </div>

              {/* Scenario Practice */}
              <div className="p-5 rounded-lg bg-purple-500/5 border border-purple-500/20 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-500" />
                  Scenario Practice
                </h3>
                
                <ScenarioTest
                  scenario="After presenting your solution and pricing, the client expresses concern about cost."
                  clientSays="That is more than I expected. I am not sure if we can afford that."
                  options={[
                    "I can give you a 10% discount if you sign today.",
                    "We are actually very competitive compared to others in the market.",
                    "I understand budget is important. Help me understand - is it the total amount, or are you comparing to something else? What were you expecting?",
                    "The price reflects the quality of service you will receive."
                  ]}
                  bestIndex={2}
                  feedback={[
                    "Offering discounts immediately devalues your service and signals desperation.",
                    "This is defensive and does not address their specific concern.",
                    "Perfect! You are acknowledging, then exploring to understand the real issue before responding.",
                    "This sounds defensive and does not help you understand their situation."
                  ]}
                />

                <ScenarioTest
                  scenario="The client wants to delay the decision."
                  clientSays="This all sounds good, but I need to think about it. Can you call me next week?"
                  options={[
                    "Sure, I will call you Monday.",
                    "I understand. Usually when people say that, there is something specific they want to think through. Is it the price, timing, or something about the service itself?",
                    "If you sign today, I can hold this price for you.",
                    "What is stopping you from moving forward today?"
                  ]}
                  bestIndex={1}
                  feedback={[
                    "You are accepting without understanding. You will likely not get through next week.",
                    "Excellent! You are gently uncovering the real objection while being respectful.",
                    "Pressure tactics often backfire and damage trust.",
                    "This sounds confrontational. Softer exploration works better."
                  ]}
                />
              </div>

              {/* Quiz */}
              <div className="p-5 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-amber-500" />
                  Level 5 Quiz
                </h3>

                <QuizQuestion
                  question="What does 'A' in the LAER framework stand for?"
                  options={["Answer", "Acknowledge", "Ask", "Agree"]}
                  correctIndex={1}
                  explanation="'A' stands for Acknowledge - you must show you heard and understood their concern before exploring or responding."
                  onAnswer={(c) => handleQuizAnswer('level-5', c)}
                />

                <QuizQuestion
                  question="When a client says 'it is too expensive', what are they really saying?"
                  options={[
                    "They cannot afford it",
                    "They do not see enough value yet or are comparing to something else",
                    "They want a discount",
                    "They are not interested"
                  ]}
                  correctIndex={1}
                  explanation="'Too expensive' usually means they do not see sufficient value or are comparing to a cheaper alternative. It rarely means they truly cannot afford it."
                  onAnswer={(c) => handleQuizAnswer('level-5', c)}
                />
              </div>

              <SelfReflection questions={[
                "What is my natural reaction when I hear an objection? Defensive? Anxious?",
                "Do I usually listen fully before responding, or do I start thinking of my answer?",
                "What is the most common objection I hear, and how do I currently handle it?",
                "Can I recall a time I turned an objection into a sale? What did I do differently?"
              ]} />

              <Button 
                className="w-full" 
                onClick={() => setCompletedLevels(prev => [...new Set([...prev, 5])])}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Level 5 Complete & Continue to Level 6
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== LEVEL 6: CLOSING ========== */}
        <TabsContent value="level-6" className="space-y-6">
          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-violet-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Trophy className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <CardTitle>Level 6: Closing & Handling Reluctance</CardTitle>
                  <CardDescription>The art of asking for the business</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Closing Mindset */}
              <div className="p-5 rounded-lg bg-background/50 border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">1</span>
                  The Closing Mindset
                </h3>
                <div className="p-4 rounded bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20">
                  <p className="font-medium text-purple-600">Remember:</p>
                  <p className="text-lg font-bold text-foreground mt-1">Closing is not something you do TO a client. It is helping them take the next step they WANT to take.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 rounded bg-muted/50">
                    <p className="font-medium text-foreground">If you did discovery right...</p>
                    <p className="text-sm text-muted-foreground">...the client already knows they need this.</p>
                  </div>
                  <div className="p-4 rounded bg-muted/50">
                    <p className="font-medium text-foreground">If you built trust...</p>
                    <p className="text-sm text-muted-foreground">...they feel safe saying yes to you.</p>
                  </div>
                </div>
              </div>

              {/* Buying Signals */}
              <div className="p-5 rounded-lg bg-background/50 border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">2</span>
                  Recognizing Buying Signals
                </h3>
                <p className="text-sm text-muted-foreground">These signals mean they are ready - it is time to close!</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-green-500/10 text-green-700">Asks about pricing details</Badge>
                  <Badge variant="outline" className="bg-green-500/10 text-green-700">Discusses implementation timeline</Badge>
                  <Badge variant="outline" className="bg-green-500/10 text-green-700">Asks "What happens next?"</Badge>
                  <Badge variant="outline" className="bg-green-500/10 text-green-700">Mentions other decision-makers approvingly</Badge>
                  <Badge variant="outline" className="bg-green-500/10 text-green-700">Compares options seriously</Badge>
                  <Badge variant="outline" className="bg-green-500/10 text-green-700">Asks about payment terms</Badge>
                  <Badge variant="outline" className="bg-green-500/10 text-green-700">Requests references</Badge>
                  <Badge variant="outline" className="bg-green-500/10 text-green-700">Uses "when" instead of "if"</Badge>
                </div>
              </div>

              {/* Closing Techniques */}
              <div className="p-5 rounded-lg bg-background/50 border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">3</span>
                  6 Closing Techniques (Simple to Advanced)
                </h3>
                <div className="space-y-3">
                  <div className="p-4 rounded bg-green-500/10 border border-green-500/20">
                    <p className="font-medium text-green-600">1. The Direct Ask (Easiest)</p>
                    <p className="text-muted-foreground italic text-sm">"Are you ready to move forward?"</p>
                    <p className="text-xs text-foreground mt-2">Best for: Direct personalities, clear buying signals</p>
                  </div>
                  <div className="p-4 rounded bg-blue-500/10 border border-blue-500/20">
                    <p className="font-medium text-blue-600">2. The Assumptive Close</p>
                    <p className="text-muted-foreground italic text-sm">"Great, let me get the paperwork started. Should I send it to this email?"</p>
                    <p className="text-xs text-foreground mt-2">Best for: When buying signals are strong, after handling objections</p>
                  </div>
                  <div className="p-4 rounded bg-purple-500/10 border border-purple-500/20">
                    <p className="font-medium text-purple-600">3. The Alternative Close</p>
                    <p className="text-muted-foreground italic text-sm">"Would you prefer the standard package or the premium? Would you like to start this week or next?"</p>
                    <p className="text-xs text-foreground mt-2">Best for: Avoiding yes/no questions, guiding decisions</p>
                  </div>
                  <div className="p-4 rounded bg-amber-500/10 border border-amber-500/20">
                    <p className="font-medium text-amber-600">4. The Summary Close</p>
                    <p className="text-muted-foreground italic text-sm">"So to recap: you need [X], by [date], and this solution gives you [benefits]. Does that match what you are looking for?"</p>
                    <p className="text-xs text-foreground mt-2">Best for: Complex sales, analytical clients</p>
                  </div>
                  <div className="p-4 rounded bg-pink-500/10 border border-pink-500/20">
                    <p className="font-medium text-pink-600">5. The Urgency Close</p>
                    <p className="text-muted-foreground italic text-sm">"I can hold this rate until [date], but after that I cannot guarantee it."</p>
                    <p className="text-xs text-foreground mt-2">Best for: Genuine deadlines, not false pressure</p>
                  </div>
                  <div className="p-4 rounded bg-cyan-500/10 border border-cyan-500/20">
                    <p className="font-medium text-cyan-600">6. The Question Close</p>
                    <p className="text-muted-foreground italic text-sm">"What would need to happen for you to feel comfortable moving forward today?"</p>
                    <p className="text-xs text-foreground mt-2">Best for: Uncovering hidden objections, hesitant clients</p>
                  </div>
                </div>
              </div>

              {/* Handling Reluctance */}
              <div className="p-5 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-amber-500" />
                  Handling Price Reluctance & Discounts
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded bg-red-500/10 border border-red-500/20">
                    <p className="font-medium text-red-600 mb-2">❌ When NOT to Discount</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• You have not established full value yet</li>
                      <li>• They are shopping around (creates weakness)</li>
                      <li>• First mention of price</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded bg-green-500/10 border border-green-500/20">
                    <p className="font-medium text-green-600 mb-2">✓ When TO Discount</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Price is confirmed as the ONLY barrier</li>
                      <li>• Client is ready but needs justification</li>
                      <li>• Long-term relationship potential</li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-3 mt-4">
                  <div className="p-4 rounded bg-background/50">
                    <p className="font-medium text-foreground text-sm">The "Add Value" Approach (Better than Discounting)</p>
                    <p className="text-muted-foreground italic text-xs">"Instead of reducing the price, what if I add [bonus service] at no extra cost? That way you get more value for the same investment."</p>
                  </div>
                  <div className="p-4 rounded bg-background/50">
                    <p className="font-medium text-foreground text-sm">The "Special Case" Discount</p>
                    <p className="text-muted-foreground italic text-xs">"I do not usually do this, but given [specific reason about them], let me see if I can get you a special rate."</p>
                  </div>
                </div>
              </div>

              {/* Quiz */}
              <div className="p-5 rounded-lg bg-purple-500/5 border border-purple-500/20 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-purple-500" />
                  Level 6 Quiz
                </h3>

                <QuizQuestion
                  question="What is a buying signal?"
                  options={[
                    "When the client says yes",
                    "Signs that show the client is ready to move forward",
                    "When the client asks for a discount",
                    "When the client stops objecting"
                  ]}
                  correctIndex={1}
                  explanation="Buying signals are verbal and non-verbal cues that indicate the client is ready - like asking about timelines, pricing details, or saying 'when' instead of 'if'."
                  onAnswer={(c) => handleQuizAnswer('level-6', c)}
                />

                <QuizQuestion
                  question="What is the 'Alternative Close'?"
                  options={[
                    "Asking yes or no",
                    "Offering two positive choices instead of yes/no",
                    "Summarizing the benefits",
                    "Creating urgency with deadlines"
                  ]}
                  correctIndex={1}
                  explanation="The Alternative Close gives two positive options ('Would you prefer A or B?') instead of a yes/no question, making it easier to say yes."
                  onAnswer={(c) => handleQuizAnswer('level-6', c)}
                />
              </div>

              <SelfReflection questions={[
                "Am I comfortable asking for the sale? If not, what makes me uncomfortable?",
                "What closing technique feels most natural to me? Which one should I practice?",
                "Do I recognize buying signals, or do I miss them and keep talking?",
                "How do I handle it when someone says no? Does it affect my next call?"
              ]} />

              <Button 
                className="w-full" 
                onClick={() => setCompletedLevels(prev => [...new Set([...prev, 6])])}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Level 6 Complete & Continue to Level 7
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== LEVEL 7: ADVANCED ========== */}
        <TabsContent value="level-7" className="space-y-6">
          <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-red-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Star className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <CardTitle>Level 7: Advanced Techniques</CardTitle>
                  <CardDescription>Personality types, stage management, and mastery</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* DISC Personalities */}
              <div className="p-5 rounded-lg bg-background/50 border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">1</span>
                  Understanding Personality Types (DISC)
                </h3>
                <p className="text-sm text-muted-foreground">Different people need different approaches. Learn to identify and adapt:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded bg-red-500/5 border border-red-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-8 h-8 rounded-full bg-red-500/20 text-red-600 text-sm font-bold flex items-center justify-center">D</span>
                      <span className="font-semibold">Driver / Dominant</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Results-focused, brief, decisive</p>
                    <p className="text-xs"><strong>Signs:</strong> "What is the bottom line?" "How fast?"</p>
                    <p className="text-xs mt-1"><strong>Approach:</strong> Get to point, focus on outcomes, be direct</p>
                    <p className="text-xs mt-1 text-red-600"><strong>Avoid:</strong> Small talk, lengthy explanations</p>
                  </div>
                  <div className="p-4 rounded bg-yellow-500/5 border border-yellow-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-600 text-sm font-bold flex items-center justify-center">I</span>
                      <span className="font-semibold">Influencer / Expressive</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Enthusiastic, story-driven, relationship-focused</p>
                    <p className="text-xs"><strong>Signs:</strong> "I am so excited!" Shares personal stories</p>
                    <p className="text-xs mt-1"><strong>Approach:</strong> Build rapport, share success stories, show enthusiasm</p>
                    <p className="text-xs mt-1 text-yellow-600"><strong>Avoid:</strong> Being too formal, rushing</p>
                  </div>
                  <div className="p-4 rounded bg-green-500/5 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-8 h-8 rounded-full bg-green-500/20 text-green-600 text-sm font-bold flex items-center justify-center">S</span>
                      <span className="font-semibold">Steady / Amiable</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Seeks consensus, risk-averse, patient</p>
                    <p className="text-xs"><strong>Signs:</strong> "Need to discuss with team" "What do others say?"</p>
                    <p className="text-xs mt-1"><strong>Approach:</strong> Reassurance, testimonials, low-pressure</p>
                    <p className="text-xs mt-1 text-green-600"><strong>Avoid:</strong> Pressure, rushing decisions</p>
                  </div>
                  <div className="p-4 rounded bg-blue-500/5 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-600 text-sm font-bold flex items-center justify-center">C</span>
                      <span className="font-semibold">Conscientious / Analytical</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Data-driven, detail-oriented, methodical</p>
                    <p className="text-xs"><strong>Signs:</strong> "Can you send specs?" "What is the exact process?"</p>
                    <p className="text-xs mt-1"><strong>Approach:</strong> Facts, documentation, ROI data</p>
                    <p className="text-xs mt-1 text-blue-600"><strong>Avoid:</strong> Rushing, vague answers</p>
                  </div>
                </div>
              </div>

              {/* Stage Management */}
              <div className="p-5 rounded-lg bg-background/50 border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">2</span>
                  Stage Management - When Clients Jump Ahead
                </h3>
                <p className="text-sm text-muted-foreground">Clients often try to skip stages. Here is how to guide them back:</p>
                <div className="space-y-3">
                  <div className="p-4 rounded bg-muted/50">
                    <p className="font-medium text-foreground">Client jumps to PRICE (skipping discovery)</p>
                    <p className="text-red-600 line-through text-sm">Wrong: "It is AED 5,000"</p>
                    <p className="text-green-600 text-sm mt-1">Right: "Great question! It ranges from X to Y depending on your specific needs. To give you an accurate quote, can I ask a few quick questions about your situation?"</p>
                  </div>
                  <div className="p-4 rounded bg-muted/50">
                    <p className="font-medium text-foreground">Client wants to CLOSE immediately (skipping value)</p>
                    <p className="text-red-600 line-through text-sm">Wrong: "Great, let us sign!"</p>
                    <p className="text-green-600 text-sm mt-1">Right: "I love your enthusiasm! Before we finalize, let me make sure you have all the information you need about [key benefit]. I want to ensure this is the perfect fit."</p>
                  </div>
                  <div className="p-4 rounded bg-muted/50">
                    <p className="font-medium text-foreground">Client starts with OBJECTION (before understanding)</p>
                    <p className="text-red-600 line-through text-sm">Wrong: "We are actually very affordable..."</p>
                    <p className="text-green-600 text-sm mt-1">Right: "I appreciate you being upfront! What did your friend's situation involve? Our pricing varies based on complexity - let us see if your needs are similar or different."</p>
                  </div>
                </div>
              </div>

              {/* The 5-Stage Framework */}
              <div className="p-5 rounded-lg bg-background/50 border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">3</span>
                  The 5-Stage Call Framework
                </h3>
                <div className="space-y-3">
                  {[
                    { stage: 'Opening', time: '30-60 sec', goal: 'Hook attention, establish rapport, earn the right to continue' },
                    { stage: 'Discovery', time: '5-10 min', goal: 'Understand needs, pains, goals, budget, timeline' },
                    { stage: 'Demonstration', time: '5-15 min', goal: 'Present solution mapped to their specific needs' },
                    { stage: 'Negotiation', time: '5-10 min', goal: 'Handle objections, discuss pricing, terms' },
                    { stage: 'Closing', time: '2-5 min', goal: 'Ask for commitment, define next steps' }
                  ].map((s, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded bg-primary/5 border border-primary/20">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0 text-sm">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{s.stage}</p>
                        <p className="text-xs text-muted-foreground"><strong>Time:</strong> {s.time}</p>
                        <p className="text-xs text-muted-foreground"><strong>Goal:</strong> {s.goal}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quiz */}
              <div className="p-5 rounded-lg bg-orange-500/5 border border-orange-500/20 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-orange-500" />
                  Level 7 Quiz
                </h3>

                <QuizQuestion
                  question="A client says 'Just give me the bottom line, I do not have much time.' What personality type are they likely?"
                  options={["Influencer (I)", "Steady (S)", "Driver (D)", "Conscientious (C)"]}
                  correctIndex={2}
                  explanation="This is classic Driver (D) behavior - results-focused, brief, wants to get to the point quickly."
                  onAnswer={(c) => handleQuizAnswer('level-7', c)}
                />

                <QuizQuestion
                  question="When a client skips to asking about price before discovery, what should you do?"
                  options={[
                    "Give them the price to seem transparent",
                    "Redirect back to discovery by giving a range and asking questions",
                    "Refuse to discuss price until later",
                    "Offer a discount to move forward"
                  ]}
                  correctIndex={1}
                  explanation="Acknowledge their question, give a range, then redirect to discovery to understand their needs better."
                  onAnswer={(c) => handleQuizAnswer('level-7', c)}
                />
              </div>

              <SelfReflection questions={[
                "Which personality type am I? How might this affect how I sell?",
                "Which personality type do I find most challenging to sell to? Why?",
                "Do I follow a structured call framework, or do I wing it?",
                "What would change if I prepared better for different personality types?"
              ]} />

              <Button 
                className="w-full" 
                onClick={() => setCompletedLevels(prev => [...new Set([...prev, 7])])}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Level 7 Complete & Proceed to Final Assessment
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== LEVEL 8: FINAL ASSESSMENT ========== */}
        <TabsContent value="level-8" className="space-y-6">
          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Award className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <CardTitle>Level 8: Final Assessment & Certification</CardTitle>
                  <CardDescription>Comprehensive scenarios and self-evaluation</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Full Scenario Tests */}
              <div className="p-5 rounded-lg bg-background/50 border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">1</span>
                  Full Scenario Assessment
                </h3>
                <p className="text-sm text-muted-foreground">These scenarios test everything you have learned. Take your time.</p>

                <ScenarioTest
                  scenario="You are cold calling a business owner. After your opening, they seem skeptical but have not hung up."
                  clientSays="Look, I get calls like this every day. Why should I listen to you?"
                  options={[
                    "Because we are the best in the market and have helped hundreds of clients.",
                    "I completely understand. You probably do get a lot of calls. I will be brief - I help business owners like you with [specific problem]. Out of curiosity, is [problem] something you have dealt with?",
                    "If you give me just 5 minutes, I promise you will not regret it.",
                    "I am sorry to bother you. Should I call another time?"
                  ]}
                  bestIndex={1}
                  feedback={[
                    "This sounds like every other sales call. You have not differentiated yourself.",
                    "Perfect! You are acknowledging reality, being respectful of their time, and pivoting to their potential pain point.",
                    "This sounds pushy and desperate. They have not earned that commitment from you yet.",
                    "This gives them an easy out. You have already got them on the phone - make it count."
                  ]}
                />

                <ScenarioTest
                  scenario="Mid-discovery, the client suddenly asks about price. You have not fully understood their needs yet."
                  clientSays="This all sounds good, but how much is it going to cost me?"
                  options={[
                    "It is AED 5,000 for the standard package.",
                    "Let me finish explaining everything first, then we can discuss price.",
                    "Great question! Depending on what you need, it typically ranges from AED 3,000 to AED 8,000. To give you an accurate quote, can I ask - will this be for [specific detail]?",
                    "Price should not be your main concern. Focus on the value."
                  ]}
                  bestIndex={2}
                  feedback={[
                    "You are giving a price without context. They cannot evaluate if it is good value.",
                    "This sounds like you are avoiding the question. Customers do not like that.",
                    "Excellent! You are giving a range (transparency), then redirecting to gather more info to give an accurate quote.",
                    "This is dismissive and will make them feel like you are not listening."
                  ]}
                />

                <ScenarioTest
                  scenario="You are about to close. The client has been positive throughout but suddenly hesitates."
                  clientSays="Everything sounds perfect, but I think I need to sleep on it."
                  options={[
                    "Sure, take your time. I will call you tomorrow.",
                    "I understand big decisions need thought. What specifically would you want to sleep on - is it the price, the timing, or something about the service itself?",
                    "If you sign today, I can give you 10% off.",
                    "When you sleep on it, what do you think you will be thinking about?"
                  ]}
                  bestIndex={1}
                  feedback={[
                    "You are accepting without understanding. Tomorrow they may not pick up.",
                    "Perfect! You are respecting their need to think while uncovering the real concern.",
                    "Discounting at the last minute devalues your service and seems desperate.",
                    "This is good but the first response is more structured and professional."
                  ]}
                />
              </div>

              {/* Final Self-Assessment */}
              <div className="p-5 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-emerald-500" />
                  Final Self-Assessment
                </h3>
                <p className="text-sm text-muted-foreground">Rate yourself honestly on a scale of 1-10 for each skill:</p>
                <div className="space-y-3">
                  {[
                    "Opening calls with confidence and relevance",
                    "Building trust quickly through active listening",
                    "Asking powerful discovery questions",
                    "Handling objections without being defensive",
                    "Recognizing buying signals",
                    "Closing naturally without pressure",
                    "Adapting to different personality types",
                    "Managing the sales conversation flow",
                    "Staying positive after rejection",
                    "Continuous learning and improvement"
                  ].map((skill, i) => (
                    <div key={i} className="p-3 rounded bg-background/50 border flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{i + 1}. {skill}</span>
                      <div className="flex gap-1">
                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                          <div key={n} className="w-6 h-6 rounded border border-border/50 flex items-center justify-center text-xs text-muted-foreground hover:bg-primary/10 cursor-pointer">
                            {n}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground italic mt-4">
                  Any skill rated below 7 should be a focus area for your next week of practice.
                </p>
              </div>

              {/* Commitment */}
              <div className="p-5 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Your Commitment
                </h3>
                <p className="text-sm text-muted-foreground">
                  Sales mastery is not about knowing - it is about <strong>doing</strong>.
                  Choose one thing from each level to practice this week:
                </p>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  {[
                    { level: "Foundation", suggestion: "Practice the 70/30 listening rule" },
                    { level: "Opening", suggestion: "Craft 3 personalized opening hooks" },
                    { level: "Trust", suggestion: "Acknowledge before responding" },
                    { level: "Discovery", suggestion: "Ask 2 implication questions per call" },
                    { level: "Objections", suggestion: "Use LAER on every objection" },
                    { level: "Closing", suggestion: "Try one new closing technique" },
                    { level: "Advanced", suggestion: "Identify personality types early" },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded bg-background/50 border">
                      <p className="text-xs text-primary font-medium">{item.level}</p>
                      <p className="text-sm text-muted-foreground">{item.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-center space-y-4">
                <Trophy className="h-12 w-12 text-emerald-500 mx-auto" />
                <h3 className="text-xl font-bold text-foreground">Congratulations!</h3>
                <p className="text-muted-foreground">
                  You have completed the Sales Training Academy. Remember: reading this guide once is not enough.
                  Come back regularly, practice daily, and reflect on your calls.
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => setCompletedLevels(prev => [...new Set([...prev, 8])])}
                >
                  <Award className="h-4 w-4 mr-2" />
                  Mark Training Complete
                </Button>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setCompletedLevels([]);
                  setQuizScores({});
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Progress & Start Over
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesGuide;
