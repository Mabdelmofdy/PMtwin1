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
      { title: 'Commercial Agreements', href: '/admin/commercial-agreements', icon: Handshake },
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
  deals: 'Deals',
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
}
