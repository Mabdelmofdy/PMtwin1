import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Box, Building2, HardHat, Search, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const metrics = [
  { title: '3D + BIM', body: 'Architectural design, visualization, coordination, and clash detection.' },
  { title: 'Multi-party deals', body: 'Build consortiums with design, construction, finance, and equipment roles.' },
  { title: 'Value exchange', body: 'Support cash, barter, equity, profit sharing, and hybrid proposals.' },
]

const audiences = [
  { icon: Box, title: 'Design and BIM studios', body: 'Offer architecture, 3D visualization, BIM modeling, and coordination.' },
  { icon: HardHat, title: 'Contractors and suppliers', body: 'Join tenders, provide site execution, or share equipment capacity.' },
  { icon: Building2, title: 'Consultants and PM teams', body: 'Match planning, supervision, sustainability, and project management.' },
]

const models = [
  { n: '01', title: 'Project-based', body: 'Tasks, consortiums, joint ventures, and SPVs for defined packages.' },
  { n: '02', title: 'Strategic', body: 'Long-term alliances, mentorship, and strategic joint ventures.' },
  { n: '03', title: 'Resource pooling', body: 'Equipment sharing, resource exchange, and bulk purchasing.' },
  { n: '04', title: 'Hiring and RFPs', body: 'Professional hiring, consultant engagement, and competitions.' },
]

export function HomePage() {
  return (
    <div className="overflow-hidden">
      <section className="relative border-b border-border/60 bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 md:px-8 lg:grid-cols-2 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <p className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" aria-hidden />
              Built environment collaboration
            </p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
              PM-Twin
            </h1>
            <p className="text-lg text-muted-foreground">
              3D design, BIM, and construction partners in one deal-ready workspace.
            </p>
            <p className="max-w-xl text-muted-foreground">
              Match project needs with architects, BIM teams, contractors, consultants,
              and consortium partners across Saudi Arabia and the GCC.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button className="cursor-pointer" asChild>
                <Link to="/register">Start collaborating</Link>
              </Button>
              <Button variant="outline" className="cursor-pointer" asChild>
                <Link to="/find">Explore marketplace</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span><strong className="text-foreground">3D/BIM</strong> design services</span>
              <span><strong className="text-foreground">Consortium</strong> formation</span>
              <span><strong className="text-foreground">Deal</strong> workflow</span>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative rounded-2xl border border-border/60 bg-card p-6 shadow-lg"
          >
            <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-emerald-500" />
              Live project twin
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['Need', 'Match', 'Deal'].map((label, i) => (
                <div key={label} className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 font-semibold">
                    {i === 0 ? 'Mixed-use tower' : i === 1 ? '92%' : 'Draft'}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {metrics.map((m) => (
            <article key={m.title} className="rounded-xl border border-border/60 p-6">
              <h2 className="font-semibold">{m.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{m.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="text-sm font-medium text-primary">Who it is for</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
            A market surface for teams that design, build, and deliver.
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {audiences.map(({ icon: Icon, title, body }) => (
              <article key={title} className="rounded-xl border border-border/60 bg-card p-6">
                <Icon className="mb-3 size-5 text-primary" aria-hidden />
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Collaboration models</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Choose the structure that fits the opportunity.
            </h2>
          </div>
          <Button variant="ghost" className="hidden cursor-pointer md:inline-flex" asChild>
            <Link to="/collaboration-wizard">Open wizard <ArrowRight className="size-4" /></Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {models.map((m) => (
            <article key={m.n} className="rounded-xl border border-border/60 p-5">
              <span className="text-xs font-medium text-muted-foreground">{m.n}</span>
              <h3 className="mt-2 font-semibold">{m.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{m.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border/60 bg-primary px-4 py-16 text-primary-foreground md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm opacity-80">Ready for the next package?</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Bring your design, construction, and partner search into PM-Twin.
            </h2>
          </div>
          <Button variant="secondary" className="cursor-pointer" asChild>
            <Link to="/register">Create account</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

export function FindPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-2xl space-y-6 text-center">
        <p className="text-sm font-medium text-primary">Marketplace search</p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Find design, BIM, and construction partners.
        </h1>
        <p className="text-muted-foreground">
          Search professionals, companies, and live opportunities across the built-environment network.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="BIM, MEP, contractors, tenders…" />
          </div>
          <Button className="cursor-pointer">Search</Button>
        </div>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {['People', 'Companies', 'Opportunities'].map((tab) => (
          <div key={tab} className="rounded-xl border border-dashed border-border/80 p-8 text-center text-sm text-muted-foreground">
            {tab} results — connect to live search
          </div>
        ))}
      </div>
    </div>
  )
}

export function WorkflowPage() {
  const steps = [
    { n: 1, title: 'Register', body: 'Create an account as a professional or company.', href: '/register' },
    { n: 2, title: 'Vetting', body: 'Admins review and activate your profile.', href: '/admin/vetting' },
    { n: 3, title: 'Dashboard', body: 'Your hub for opportunities, matches, and notifications.', href: '/dashboard' },
    { n: 4, title: 'Opportunities', body: 'Publish needs or offers and manage lifecycle.', href: '/opportunities' },
    { n: 5, title: 'Matching', body: 'System matches needs, offers, and consortium roles.', href: '/admin/matching' },
    { n: 6, title: 'Negotiation', body: 'Parties negotiate value, scope, and timing after a PostMatch.', href: '/pipeline' },
    { n: 7, title: 'Contract', body: 'Agreed deals become signed contract records.', href: '/contracts' },
    { n: 8, title: 'Execution', body: 'Deliver scope and close opportunities.', href: '/deals' },
  ]
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-16">
      <p className="text-sm font-medium text-primary">Project lifecycle</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        From 3D design need to signed construction collaboration.
      </h1>
      <p className="mt-4 text-muted-foreground">
        PM-Twin gives teams a structured path from registration to matching, negotiation, contracts, and closure.
      </p>
      <ol className="mt-10 space-y-4">
        {steps.map((s) => (
          <li key={s.n} className="flex gap-4 rounded-xl border border-border/60 p-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {s.n}
            </span>
            <div>
              <h2 className="font-semibold">{s.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              <Link to={s.href} className="mt-2 inline-block cursor-pointer text-sm font-medium text-primary hover:underline">
                Learn more
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function KnowledgeBasePage() {
  const tabs = [
    { id: 'models', title: 'Collaboration models', items: [
      { q: 'What is Project-Based Collaboration?', a: 'Best for delivering a specific project with one or more partners — tasks, consortiums, JVs, and SPVs.' },
      { q: 'What are Strategic Partnerships?', a: 'Long-term alliances, mentorship, and strategic joint ventures.' },
    ]},
    { id: 'spv', title: 'SPV & legal', items: [
      { q: 'What is an SPV?', a: 'Special Purpose Vehicles isolate risk and structure financing for a single project.' },
    ]},
    { id: 'faq', title: 'FAQ', items: [
      { q: 'Who can use PM-Twin?', a: 'Companies and professionals in construction and the built environment across Saudi Arabia and the GCC.' },
    ]},
  ]
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Knowledge Base</h1>
      <p className="mt-2 text-muted-foreground">Guides for collaboration models, SPVs, and platform FAQs.</p>
      <div className="mt-8 space-y-8">
        {tabs.map((tab) => (
          <section key={tab.id}>
            <h2 className="text-lg font-semibold">{tab.title}</h2>
            <div className="mt-4 space-y-3">
              {tab.items.map((item) => (
                <details key={item.q} className="rounded-xl border border-border/60 p-4">
                  <summary className="cursor-pointer font-medium">{item.q}</summary>
                  <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export function CollaborationWizardPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12 md:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Collaboration Wizard</h1>
      <p className="mt-2 text-muted-foreground">Answer a few questions to get a model recommendation.</p>
      <div className="mt-8 space-y-4 rounded-xl border border-border/60 p-6">
        <p className="text-sm font-medium">Step 1 of 4</p>
        <h2 className="text-lg font-semibold">What is your primary goal?</h2>
        <div className="grid gap-2">
          {['Deliver a specific project', 'Form a long-term alliance', 'Share resources', 'Hire or compete for work'].map((opt) => (
            <button key={opt} type="button" className="cursor-pointer rounded-lg border border-border/60 px-4 py-3 text-left text-sm transition-colors hover:border-primary/40 hover:bg-muted/50">
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CollaborationModelsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Collaboration Models</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Structured ways to collaborate — from project delivery to resource pooling and RFPs.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {models.map((m) => (
          <article key={m.title} className="rounded-xl border border-border/60 p-6">
            <h2 className="text-lg font-semibold">{m.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{m.body}</p>
          </article>
        ))}
      </div>
      <Button className="mt-8 cursor-pointer" asChild>
        <Link to="/collaboration-wizard">Take the wizard</Link>
      </Button>
    </div>
  )
}
