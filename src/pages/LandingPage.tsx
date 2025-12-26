import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Building2,
  Calculator,
  CreditCard,
  Landmark,
  Shield,
  Users,
  Scale,
  Zap,
  Layers,
  FileCheck,
  Heart,
  Lightbulb,
  LayoutDashboard,
  HeadphonesIcon,
  BookOpen,
  Banknote,
  Cpu,
  Calendar,
  Home,
  FileText,
  BarChart3,
  ArrowRight,
  Check,
  Star,
  Globe,
  Rocket,
  Briefcase,
  Building,
  ChevronRight,
} from 'lucide-react';

type ServiceTab = 'incorporation' | 'accounting' | 'visa' | 'banking' | 'insurance' | 'payroll' | 'legal';

const services: { key: ServiceTab; label: string; icon: React.ElementType }[] = [
  { key: 'incorporation', label: 'Incorporation', icon: Building2 },
  { key: 'accounting', label: 'Accounting & Tax', icon: Calculator },
  { key: 'visa', label: 'Visa & Residency', icon: CreditCard },
  { key: 'banking', label: 'Banking', icon: Landmark },
  { key: 'insurance', label: 'Insurance', icon: Shield },
  { key: 'payroll', label: 'Payroll', icon: Users },
  { key: 'legal', label: 'Legal', icon: Scale },
];

const serviceDetails: Record<ServiceTab, { title: string; features: { icon: React.ElementType; title: string; desc: string }[] }> = {
  incorporation: {
    title: 'Incorporation',
    features: [
      { icon: Lightbulb, title: 'Smart Jurisdiction', desc: 'Choose the best setup location.' },
      { icon: Layers, title: 'End-to-End Setup', desc: 'Automate licensing & approvals.' },
      { icon: LayoutDashboard, title: 'Digital Dashboard', desc: 'Manage everything in one place.' },
      { icon: HeadphonesIcon, title: 'Post-Support', desc: 'Full coverage after setup.' },
    ],
  },
  accounting: {
    title: 'Accounting & Tax',
    features: [
      { icon: Calculator, title: 'Automated Bookkeeping', desc: 'AI handles filing.' },
      { icon: Banknote, title: 'Corporate Tax Made Easy', desc: 'Quick tax submissions.' },
      { icon: BookOpen, title: 'Real-Time Bank Integration', desc: 'Instant account sync.' },
      { icon: Cpu, title: 'AI Insights & Audits', desc: 'Smart compliance checks.' },
    ],
  },
  visa: {
    title: 'Visa & Residency',
    features: [
      { icon: CreditCard, title: 'Complete Visa Support', desc: 'Easy applications & renewals.' },
      { icon: Calendar, title: 'Smart Scheduling', desc: 'Automated bookings & updates.' },
      { icon: Home, title: 'Easy Family Relocation', desc: 'Visas, housing & school support.' },
      { icon: Layers, title: 'Seamless Flow Integration', desc: 'All services in sync.' },
    ],
  },
  banking: {
    title: 'Banking',
    features: [
      { icon: Landmark, title: 'Fast Account Opening', desc: 'Quick setup & KYC.' },
      { icon: FileText, title: 'Smart Document Handling', desc: 'Auto checklists.' },
      { icon: BarChart3, title: 'Live Tracking Dashboard', desc: 'Real-time updates.' },
      { icon: Banknote, title: 'All-in Banking Support', desc: 'Multi-currency & help.' },
    ],
  },
  insurance: {
    title: 'Insurance',
    features: [
      { icon: Shield, title: 'Comprehensive Coverage', desc: 'All business needs covered.' },
      { icon: FileCheck, title: 'Quick Claims', desc: 'Fast claim processing.' },
      { icon: Users, title: 'Employee Benefits', desc: 'Health & life insurance.' },
      { icon: Heart, title: 'Tailored Plans', desc: 'Custom solutions for you.' },
    ],
  },
  payroll: {
    title: 'Payroll',
    features: [
      { icon: Users, title: 'Automated Payroll', desc: 'Seamless salary processing.' },
      { icon: Calendar, title: 'Compliance Ready', desc: 'WPS & labor law aligned.' },
      { icon: FileText, title: 'Employee Records', desc: 'Centralized HR data.' },
      { icon: BarChart3, title: 'Reports & Analytics', desc: 'Detailed payroll insights.' },
    ],
  },
  legal: {
    title: 'Legal',
    features: [
      { icon: Scale, title: 'Contract Drafting', desc: 'Professional legal docs.' },
      { icon: FileCheck, title: 'Compliance Review', desc: 'Regulatory alignment.' },
      { icon: Shield, title: 'IP Protection', desc: 'Trademark & patent services.' },
      { icon: HeadphonesIcon, title: 'Legal Consultation', desc: 'Expert advice on demand.' },
    ],
  },
};

const valueProps = [
  {
    icon: Zap,
    title: '3x Faster Setup',
    desc: 'Form your company with AI guidance, saving time and cutting costs.',
  },
  {
    icon: Layers,
    title: 'All-in-One Platform',
    desc: 'Manage everything from setup to scale in one seamless place.',
  },
  {
    icon: FileCheck,
    title: 'Zero Paperwork, Full Clarity',
    desc: 'Streamline processes with complete transparency.',
  },
  {
    icon: Heart,
    title: 'Trusted & Proven',
    desc: 'Backed by 540+ satisfied clients across the region.',
  },
];

const personas = [
  { icon: Rocket, title: 'Startups', desc: 'Launch fast with minimal friction.' },
  { icon: Briefcase, title: 'Consultants', desc: 'Focus on clients, not paperwork.' },
  { icon: Building, title: 'SMEs', desc: 'Scale operations effortlessly.' },
  { icon: Globe, title: 'Holding Structures', desc: 'Optimize multi-entity setups.' },
];

const faqs = [
  {
    q: 'Which jurisdictions do you support?',
    a: 'We support all major UAE free zones including DMCC, DIFC, ADGM, Meydan, IFZA, RAKEZ, and mainland Dubai, Abu Dhabi, and Sharjah. We also cover KSA jurisdictions.',
  },
  {
    q: 'How long does company formation take?',
    a: 'Depending on the jurisdiction, company formation can take as little as 2-5 business days. Our AI-powered platform expedites the process by 3x compared to traditional methods.',
  },
  {
    q: 'What documents do I need to get started?',
    a: 'Typically you\'ll need passport copies, proof of address, and a business plan. Our platform guides you through the exact requirements based on your chosen jurisdiction and activity.',
  },
  {
    q: 'Do you offer ongoing support after setup?',
    a: 'Yes! We provide comprehensive post-formation support including accounting, visa processing, banking assistance, and annual renewals all through our unified platform.',
  },
  {
    q: 'What are your pricing options?',
    a: 'We offer transparent, all-inclusive packages starting from AED 12,000 for free zone setups. No hidden fees – what you see is what you pay.',
  },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeService, setActiveService] = useState<ServiceTab>('incorporation');

  return (
    <div className="min-h-screen bg-[hsl(240,20%,8%)] text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[hsl(240,20%,8%)]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                AMANA
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-sm text-white/70 hover:text-white transition-colors">Services</a>
              <a href="#why-us" className="text-sm text-white/70 hover:text-white transition-colors">Why Us</a>
              <a href="#faq" className="text-sm text-white/70 hover:text-white transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
              <Button
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white border-0"
                onClick={() => navigate('/webflow-simple/country')}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-violet-600/30 rounded-full blur-[128px]" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px]" />
        
        <div className="relative max-w-7xl mx-auto text-center">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 border-2 border-[hsl(240,20%,8%)] flex items-center justify-center text-xs font-medium">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <span className="text-sm text-white/70">Trusted by <span className="text-white font-semibold">540+</span> clients</span>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              One Platform for Your
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Entire Company
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10">
            End slow processes, hidden fees and manual work. Launch and manage your business in the UAE with AI-powered efficiency.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white border-0 px-8 py-6 text-lg rounded-xl shadow-2xl shadow-violet-500/25"
              onClick={() => navigate('/webflow-simple/country')}
            >
              Start Your Journey
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl"
            >
              Watch Demo
            </Button>
          </div>

          {/* Dashboard preview placeholder */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(240,20%,8%)] via-transparent to-transparent z-10 pointer-events-none" />
            <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-1 shadow-2xl shadow-violet-500/10">
              <div className="rounded-xl bg-[hsl(240,18%,12%)] p-4 sm:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 h-48 rounded-lg bg-white/5 border border-white/10 p-4">
                    <div className="h-4 w-1/3 bg-white/20 rounded mb-4" />
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-white/10 rounded" />
                      <div className="h-3 w-4/5 bg-white/10 rounded" />
                      <div className="h-3 w-3/5 bg-white/10 rounded" />
                    </div>
                  </div>
                  <div className="h-48 rounded-lg bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/20 p-4">
                    <div className="h-4 w-2/3 bg-violet-400/30 rounded mb-4" />
                    <div className="flex items-end gap-1 h-28">
                      {[40, 65, 45, 80, 55, 70].map((h, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-violet-500 to-purple-400 rounded-t" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section id="why-us" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {valueProps.map((prop, idx) => (
              <Card key={idx} className="bg-white/5 border-white/10 hover:border-violet-500/50 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <prop.icon className="w-6 h-6 text-violet-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{prop.title}</h3>
                  <p className="text-white/60 text-sm">{prop.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-violet-900/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              From company formation to ongoing operations, we've got you covered.
            </p>
          </div>

          {/* Service Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {services.map((service) => (
              <button
                key={service.key}
                onClick={() => setActiveService(service.key)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
                  ${activeService === service.key
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                  }
                `}
              >
                <service.icon className="w-4 h-4" />
                {service.label}
              </button>
            ))}
          </div>

          {/* Service Details Card */}
          <Card className="bg-white/5 border-white/10 overflow-hidden">
            <CardContent className="p-8 sm:p-12">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-6">
                    {React.createElement(services.find(s => s.key === activeService)?.icon || Building2, {
                      className: 'w-8 h-8 text-violet-400'
                    })}
                    <h3 className="text-2xl font-bold text-white">
                      {serviceDetails[activeService].title}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {serviceDetails[activeService].features.map((feature, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="w-10 h-10 rounded-lg bg-violet-600/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                          <feature.icon className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                          <p className="text-sm text-white/60">{feature.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="mt-8 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white"
                    onClick={() => navigate('/webflow-simple/country')}
                  >
                    Get Started
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </Button>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-full max-w-sm aspect-square rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center">
                    {React.createElement(services.find(s => s.key === activeService)?.icon || Building2, {
                      className: 'w-24 h-24 text-violet-400/50'
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Who Uses Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Who Uses Our Platform?
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Trusted by entrepreneurs and businesses of all sizes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {personas.map((persona, idx) => (
              <Card key={idx} className="bg-white/5 border-white/10 hover:border-violet-500/50 transition-all duration-300 group cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <persona.icon className="w-8 h-8 text-violet-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{persona.title}</h3>
                  <p className="text-white/60 text-sm">{persona.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-violet-900/10 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <blockquote className="text-2xl sm:text-3xl font-medium text-white mb-8 leading-relaxed">
            "The platform made setting up our Dubai office incredibly simple. What would have taken weeks was done in days."
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
              JM
            </div>
            <div className="text-left">
              <div className="font-semibold text-white">James Mitchell</div>
              <div className="text-sm text-white/60">CEO, TechVentures Ltd</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-white/60">
              Everything you need to know about our services.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`faq-${idx}`}
                className="bg-white/5 border border-white/10 rounded-xl px-6 data-[state=open]:border-violet-500/50"
              >
                <AccordionTrigger className="text-left text-white hover:text-violet-400 hover:no-underline py-6">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-white/60 pb-6">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-violet-600 to-purple-600 border-0 overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNGMwIDItMiA0LTIgNHMtMi0yLTItNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
            <CardContent className="relative p-8 sm:p-12 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-white/80 max-w-xl mx-auto mb-8">
                Join 540+ businesses who've simplified their operations with our platform.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  className="bg-white text-violet-600 hover:bg-white/90 px-8 py-6 text-lg rounded-xl"
                  onClick={() => navigate('/webflow-simple/country')}
                >
                  Start Free Consultation
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">AMANA</span>
            </div>
            <div className="flex items-center gap-8">
              <a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Contact</a>
            </div>
            <p className="text-sm text-white/40">
              © 2024 AMANA. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
