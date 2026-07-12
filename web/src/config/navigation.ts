import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  ChartBar,
  Compass,
  FileText,
  GitBranch,
  Handshake,
  Heart,
  Home,
  Map as MapIcon,
  MessageCircle,
  Scale,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Wrench,
} from 'lucide-react'
import type { ProductNavState } from '@/config/product-identity'

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  badge?: number
  keywords?: string[]
  /** Route state for presentation defaults (does not change URLs). */
  state?: ProductNavState
  /** Unfinished surface — link works but UI shows Preview affordance. */
  preview?: boolean
}

export type NavGroup = {
  title: string
  items: NavItem[]
}

export const APP_NAME = 'PM-Twin'

export const mainNavigation: NavGroup[] = [
  {
    title: 'My Workspace',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        state: { domain: 'workspace' },
        keywords: ['home', 'overview', 'my workspace', 'attention', 'tasks'],
      },
      {
        title: 'My Opportunities',
        href: '/opportunities',
        icon: Briefcase,
        state: { domain: 'workspace', ownershipScope: 'mine' },
        keywords: ['my opportunities', 'owned', 'drafts', 'published'],
      },
      {
        title: 'My Matches',
        href: '/matches',
        icon: Heart,
        state: { domain: 'workspace', matchView: 'mine' },
        keywords: ['my matches', 'assigned', 'collaboration'],
      },
      {
        title: 'My Pipeline',
        href: '/pipeline',
        icon: GitBranch,
        state: { domain: 'workspace' },
        keywords: ['pipeline', 'workflow', 'board', 'kanban', 'progress'],
      },
      {
        title: 'My Negotiations',
        href: '/negotiations',
        icon: Scale,
        state: { domain: 'workspace' },
        keywords: ['my negotiations', 'terms', 'counter', 'pending'],
      },
      {
        title: 'My Commercial Agreements',
        href: '/commercial-agreements',
        icon: Handshake,
        state: { domain: 'workspace' },
        keywords: ['my commercial agreements', 'executing', 'agreements'],
      },
      {
        title: 'My Contracts',
        href: '/contracts',
        icon: FileText,
        state: { domain: 'workspace' },
        keywords: ['my contracts', 'signing', 'legal'],
      },
    ],
  },
  {
    title: 'Marketplace',
    items: [
      {
        title: 'Discover',
        href: '/marketplace',
        icon: Compass,
        state: { domain: 'marketplace' },
        keywords: ['discover', 'explore', 'marketplace', 'models', 'matching'],
      },
      {
        title: 'Browse Opportunities',
        href: '/opportunities',
        icon: Briefcase,
        state: { domain: 'marketplace', ownershipScope: 'marketplace' },
        keywords: ['browse', 'available', 'latest', 'opportunities', 'needs', 'offers'],
      },
      {
        title: 'Browse Companies',
        href: '/people',
        icon: Building2,
        state: { domain: 'marketplace', peopleScope: 'companies' },
        keywords: ['companies', 'firms', 'organizations'],
      },
      {
        title: 'Browse Professionals',
        href: '/people',
        icon: Users,
        state: { domain: 'marketplace', peopleScope: 'people' },
        keywords: ['professionals', 'talent', 'people', 'experts'],
      },
      {
        title: 'Browse Matches',
        href: '/matches',
        icon: Sparkles,
        state: { domain: 'marketplace', matchView: 'marketplace' },
        preview: true,
        keywords: ['matching', 'recommendations', 'trending'],
      },
      {
        title: 'Map',
        href: '/opportunities/map',
        icon: MapIcon,
        state: { domain: 'marketplace' },
        preview: true,
        keywords: ['map', 'geo', 'location', 'discover'],
      },
      {
        title: 'Portfolio intelligence',
        href: '/intelligence/portfolio',
        icon: ChartBar,
        keywords: ['intelligence', 'portfolio', 'kpi'],
      },
      {
        title: 'Funnel intelligence',
        href: '/intelligence/funnel',
        icon: Sparkles,
        keywords: ['conversion', 'funnel', 'quality'],
      },
      {
        title: 'Risk intelligence',
        href: '/intelligence/risk',
        icon: ShieldAlert,
        keywords: ['risk', 'blockers', 'escalation'],
      },
      {
        title: 'Execution intelligence',
        href: '/intelligence/execution',
        icon: Activity,
        keywords: ['execution', 'delivery', 'contracts'],
      },
    ],
  },
  {
    title: 'Communication',
    items: [
      {
        title: 'Notifications',
        href: '/notifications',
        icon: Bell,
        keywords: ['alerts', 'updates'],
      },
      {
        title: 'Messages',
        href: '/messages',
        icon: MessageCircle,
        keywords: ['chat', 'inbox'],
      },
    ],
  },
]

export const adminNavigationGroups: NavGroup[] = [
  {
    title: 'Command Center',
    items: [
      { title: 'Executive', href: '/admin', icon: ShieldCheck, keywords: ['admin', 'home', 'dashboard', 'command'] },
      { title: 'Operations', href: '/admin/command-center/operations', icon: Activity, keywords: ['ops', 'queue'] },
      { title: 'Risk & Compliance', href: '/admin/command-center/risk', icon: ShieldAlert, keywords: ['risk'] },
      { title: 'My Queue', href: '/admin/command-center/my-queue', icon: User, keywords: ['assigned'] },
      { title: 'Admin Inbox', href: '/admin/inbox', icon: Bell, keywords: ['inbox', 'work'] },
    ],
  },
  {
    title: 'Workspaces',
    items: [
      { title: 'Identity', href: '/admin/workspaces/identity', icon: Users, keywords: ['users', 'parties'] },
      { title: 'Compliance', href: '/admin/workspaces/compliance', icon: ShieldCheck, keywords: ['vetting'] },
      { title: 'Marketplace', href: '/admin/workspaces/marketplace', icon: Briefcase, keywords: ['opportunities', 'matching'] },
      { title: 'Commercial', href: '/admin/workspaces/commercial', icon: Handshake, keywords: ['agreements', 'contracts'] },
      { title: 'Reports', href: '/admin/workspaces/reports', icon: ChartBar, keywords: ['analytics'] },
      { title: 'Configuration', href: '/admin/workspaces/configuration', icon: Settings, keywords: ['settings'] },
      { title: 'System', href: '/admin/workspaces/system', icon: Wrench, keywords: ['health', 'audit'] },
    ],
  },
  {
    title: 'Explore',
    items: [
      { title: 'Global Search', href: '/admin/search', icon: Compass, keywords: ['search', 'find'] },
      { title: 'Platform Explorer', href: '/admin/explorer', icon: BookOpen, keywords: ['explorer', 'catalogue'] },
    ],
  },
  {
    title: 'Identity & Access',
    items: [
      { title: 'Users', href: '/admin/users', icon: Users, keywords: ['accounts'] },
      { title: 'Parties', href: '/admin/parties', icon: Building2, keywords: ['companies'] },
      { title: 'Memberships', href: '/admin/memberships', icon: Users, keywords: ['members'] },
      { title: 'Roles', href: '/admin/roles', icon: ShieldCheck, keywords: ['permissions'] },
      { title: 'Vetting', href: '/admin/vetting', icon: User, keywords: ['approval', 'queue'] },
    ],
  },
  {
    title: 'Marketplace',
    items: [
      { title: 'Opportunities', href: '/admin/opportunities', icon: Briefcase },
      { title: 'Matching', href: '/admin/matching', icon: Sparkles },
      { title: 'PostMatches', href: '/admin/post-matches', icon: Heart },
      { title: 'Matching Quality', href: '/admin/matching/quality', icon: ChartBar },
      { title: 'Taxonomy', href: '/admin/taxonomy', icon: GitBranch },
      { title: 'Moderation', href: '/admin/moderation', icon: ShieldAlert },
      { title: 'Negotiations', href: '/admin/negotiations', icon: Scale },
    ],
  },
  {
    title: 'Commercial Operations',
    items: [
      { title: 'Commercial Agreements', href: '/admin/commercial-agreements', icon: Handshake },
      { title: 'Approvals', href: '/admin/approvals', icon: ShieldCheck },
      { title: 'Award Management', href: '/admin/awards', icon: Sparkles },
      { title: 'Contracts', href: '/admin/contracts', icon: FileText },
      { title: 'Legal Review', href: '/admin/legal-review', icon: Scale },
    ],
  },
  {
    title: 'Reports',
    items: [
      { title: 'Reports', href: '/admin/reports', icon: ChartBar, keywords: ['analytics'] },
    ],
  },
  {
    title: 'Platform Configuration',
    items: [
      { title: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
  {
    title: 'System Administration',
    items: [
      { title: 'Audit', href: '/admin/audit', icon: BookOpen },
      { title: 'Environments', href: '/admin/environments', icon: MapIcon, keywords: ['scenario', 'restore'] },
      { title: 'Health', href: '/admin/health', icon: Activity, keywords: ['status', 'diagnostics'] },
      { title: 'Feature Flags', href: '/admin/feature-flags', icon: Sparkles },
      { title: 'Data Quality', href: '/admin/data-quality', icon: ShieldAlert },
      { title: 'Failed Commands', href: '/admin/failed-commands', icon: Activity },
    ],
  },
]

/** @deprecated use adminNavigationGroups */
export const adminNavigation: NavGroup = adminNavigationGroups[0]

export const userMenuLinks = [
  { title: 'Profile', href: '/profile', icon: User },
  { title: 'Settings', href: '/settings', icon: Settings },
] as const

export const commandActions = [
  {
    title: 'Post Opportunity',
    href: '/opportunities/create',
    icon: Briefcase,
    keywords: ['create', 'new', 'job'],
  },
  {
    title: 'Company Dashboard',
    href: '/company-dashboard',
    icon: Building2,
    keywords: ['company', 'my workspace'],
  },
] as const

export const allNavItems = [
  ...mainNavigation.flatMap((g) => g.items),
  ...adminNavigationGroups.flatMap((g) => g.items),
  ...commandActions,
  ...userMenuLinks,
]

export function isNavActive(pathname: string, href: string) {
  if (href === '/dashboard' || href === '/company-dashboard') {
    return pathname === '/dashboard' || pathname === '/company-dashboard'
  }
  if (href === '/admin') {
    return pathname === '/admin'
  }
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export const routeLabels: Record<string, string> = {
  dashboard: 'My Workspace',
  'company-dashboard': 'Company Workspace',
  pipeline: 'Pipeline',
  people: 'Discover',
  marketplace: 'Marketplace',
  opportunities: 'Opportunities',
  create: 'Create',
  edit: 'Edit',
  map: 'Map',
  matches: 'Matches',
  negotiations: 'Negotiations',
  'commercial-agreements': 'Commercial Agreements',
  deals: 'Commercial Agreements',
  rate: 'Rate',
  contracts: 'Contracts',
  messages: 'Messages',
  notifications: 'Notifications',
  profile: 'My Profile',
  settings: 'Settings',
  admin: 'Admin',
  reports: 'Reports',
  users: 'Users',
  vetting: 'Vetting',
  matching: 'Matching',
  disputes: 'Disputes',
  consortium: 'Consortium',
  audit: 'Audit',
  health: 'Health',
  skills: 'Skills',
  subscriptions: 'Subscriptions',
  'collaboration-models': 'Collaboration Models',
  features: 'Features',
  pricing: 'Pricing',
  about: 'About',
  contact: 'Contact',
  privacy: 'Privacy',
  terms: 'Terms',
  'collaboration-wizard': 'Collaboration Wizard',
  'site-content': 'Site Content',
  'knowledge-base': 'Knowledge Base',
  workflow: 'How it works',
  find: 'Discover',
  login: 'Sign in',
  register: 'Register',
  'forgot-password': 'Forgot password',
  'reset-password': 'Reset password',
  intelligence: 'Intelligence',
  portfolio: 'Portfolio',
  funnel: 'Funnel',
  risk: 'Risk',
  execution: 'Execution',
}
