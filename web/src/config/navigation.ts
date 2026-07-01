import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  ChartBar,
  FileText,
  GitBranch,
  Handshake,
  Heart,
  Home,
  MessageCircle,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Wrench,
} from 'lucide-react'

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  badge?: number
  keywords?: string[]
}

export type NavGroup = {
  title: string
  items: NavItem[]
}

export const APP_NAME = 'PM-Twin'

export const mainNavigation: NavGroup[] = [
  {
    title: 'Workspace',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        keywords: ['home', 'overview', 'workspace', 'attention'],
      },
      {
        title: 'Workflow pipeline',
        href: '/pipeline',
        icon: GitBranch,
        keywords: ['pipeline', 'stages', 'workflow', 'postmatch', 'negotiation', 'deal', 'contract'],
      },
      {
        title: 'Find',
        href: '/people',
        icon: Users,
        keywords: ['people', 'talent', 'search'],
      },
    ],
  },
  {
    title: 'Opportunities',
    items: [
      {
        title: 'Opportunities',
        href: '/opportunities',
        icon: Briefcase,
        keywords: ['jobs', 'projects', 'postings'],
      },
      {
        title: 'Matches',
        href: '/matches',
        icon: Heart,
        keywords: ['matching', 'postmatch', 'collaboration', 'recommendations'],
      },
    ],
  },
  {
    title: 'Workflow stages',
    items: [
      {
        title: 'Deals',
        href: '/deals',
        icon: Handshake,
        keywords: ['negotiations', 'agreements', 'workflow'],
      },
      {
        title: 'Contracts',
        href: '/contracts',
        icon: FileText,
        keywords: ['legal', 'documents', 'workflow'],
      },
    ],
  },
  {
    title: 'Communication',
    items: [
      {
        title: 'Messages',
        href: '/messages',
        icon: MessageCircle,
        badge: 3,
        keywords: ['chat', 'inbox'],
      },
      {
        title: 'Notifications',
        href: '/notifications',
        icon: Bell,
        badge: 5,
        keywords: ['alerts', 'updates'],
      },
    ],
  },
]

export const adminNavigationGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', href: '/admin', icon: ShieldCheck, keywords: ['admin', 'home'] },
      { title: 'Reports', href: '/admin/reports', icon: ChartBar, keywords: ['analytics'] },
      { title: 'Health', href: '/admin/health', icon: Activity, keywords: ['status', 'system'] },
    ],
  },
  {
    title: 'Users & access',
    items: [
      { title: 'Users', href: '/admin/users', icon: Users, keywords: ['accounts'] },
      { title: 'Vetting', href: '/admin/vetting', icon: User, keywords: ['approval', 'queue'] },
    ],
  },
  {
    title: 'Marketplace',
    items: [
      { title: 'Opportunities', href: '/admin/opportunities', icon: Briefcase },
      { title: 'Matching', href: '/admin/matching', icon: Sparkles },
      { title: 'Negotiations', href: '/admin/negotiations', icon: Handshake },
      { title: 'Disputes', href: '/admin/disputes', icon: ShieldAlert },
    ],
  },
  {
    title: 'Deals & legal',
    items: [
      { title: 'Deals', href: '/admin/deals', icon: Handshake },
      { title: 'Contracts', href: '/admin/contracts', icon: FileText },
      { title: 'Consortium', href: '/admin/consortium', icon: Building2 },
    ],
  },
  {
    title: 'Platform',
    items: [
      { title: 'Audit', href: '/admin/audit', icon: BookOpen },
      { title: 'Settings', href: '/admin/settings', icon: Settings },
      { title: 'Skills', href: '/admin/skills', icon: Wrench },
      { title: 'Collaboration models', href: '/admin/collaboration-models', icon: GitBranch },
      { title: 'Site content', href: '/admin/site-content', icon: FileText },
      { title: 'Subscriptions', href: '/admin/subscriptions', icon: Bell },
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
    keywords: ['company', 'workspace'],
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
  dashboard: 'Dashboard',
  'company-dashboard': 'Company Dashboard',
  pipeline: 'Workflow pipeline',
  people: 'Find',
  opportunities: 'Opportunities',
  create: 'Create',
  edit: 'Edit',
  map: 'Map',
  matches: 'Matches',
  deals: 'Deals',
  rate: 'Rate',
  contracts: 'Contracts',
  negotiations: 'Negotiations',
  messages: 'Messages',
  notifications: 'Notifications',
  profile: 'Profile',
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
  'collaboration-wizard': 'Collaboration Wizard',
  'site-content': 'Site Content',
  'knowledge-base': 'Knowledge Base',
  workflow: 'How it works',
  find: 'Find',
  login: 'Sign in',
  register: 'Register',
  'forgot-password': 'Forgot password',
  'reset-password': 'Reset password',
}
