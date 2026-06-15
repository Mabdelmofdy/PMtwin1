import { Link, useParams } from 'react-router-dom'
import { dataStore } from '@/lib/data-store'
import { formatRelativeTime } from '@/lib/format'
import { PageHeader } from '@/components/shared/page-primitives'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function PeoplePage() {
  const people = dataStore.getPeople().filter((p) => p.isPublic !== false)
  return (
    <div className="space-y-6">
      <PageHeader label="Directory" title="Find" description="Search professionals and companies." />
      <Input placeholder="Search by name, skills, sector…" className="max-w-md" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((person) => {
          const name = person.profile?.name ?? person.email
          const headline = person.profile?.headline ?? person.profile?.type ?? person.role
          return (
            <Link key={person.id} to={`/people/${person.id}`} className="cursor-pointer">
              <Card className="h-full hover:border-primary/30 hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{name}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>{headline}</p>
                  <p className="mt-1">{person.profile?.location}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function PersonProfilePage() {
  const { id } = useParams()
  const person = id ? dataStore.getPersonById(id) : undefined
  if (!person) return <p className="text-muted-foreground">Profile not found.</p>
  const skills = 'skills' in (person.profile ?? {}) ? person.profile?.skills ?? [] : []
  return (
    <div className="space-y-6">
      <PageHeader
        title={person.profile?.name ?? person.email}
        description={person.profile?.headline}
        actions={
          <>
            <Button variant="outline" className="cursor-pointer">Connect</Button>
            <Button className="cursor-pointer" asChild><Link to="/messages">Message</Link></Button>
          </>
        }
      />
      <Card>
        <CardHeader><CardTitle>About</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {person.profile?.bio ?? person.profile?.description ?? '—'}
        </CardContent>
      </Card>
      {skills.length > 0 ? (
        <Card>
          <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {skills.map((s: string) => <span key={s} className="rounded-md bg-muted px-2 py-1 text-xs">{s}</span>)}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

export function MessagesPage() {
  const { id } = useParams()
  const threads = [
    { id: 't1', name: 'Khalid Al-Harbi', preview: 'Happy to walk through LOD 400…', unread: 2 },
    { id: 't2', name: 'Al-Riyadh Construction', preview: 'Contract draft attached', unread: 0 },
  ]
  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="Direct conversations with your network." />
      <div className="grid min-h-[20rem] gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="divide-y p-0">
            {threads.map((t) => (
              <Link key={t.id} to={`/messages/${t.id}`} className={`block cursor-pointer px-4 py-3 transition-colors hover:bg-muted/50 ${id === t.id ? 'bg-muted/50' : ''}`}>
                <p className="font-medium">{t.name}</p>
                <p className="truncate text-xs text-muted-foreground">{t.preview}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardContent className="flex min-h-[16rem] flex-col justify-end p-4">
            {id ? <p className="text-sm text-muted-foreground">Thread {id} — compose area</p> : <p className="text-sm text-muted-foreground">Select a conversation</p>}
            <Input placeholder="Write a message…" className="mt-4" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function NotificationsPage() {
  const notifications = dataStore.getNotifications()
  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Alerts for matches, applications, deals, and messages." />
      <div className="divide-y rounded-xl border border-border/60">
        {notifications.map((n) => (
          <Link key={n.id} to={n.link ?? '/notifications'} className="flex cursor-pointer gap-4 px-4 py-4 transition-colors hover:bg-muted/40">
            <span className={`mt-2 size-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-primary'}`} />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{n.title}</p>
              <p className="text-sm text-muted-foreground">{n.message}</p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(n.createdAt)}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function ProfilePage() {
  const user = dataStore.getUsers()[1] ?? dataStore.getUsers()[0]
  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Your public profile and vetting status." />
      <Card>
        <CardHeader><CardTitle>{user?.profile?.name}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{user?.profile?.bio}</p>
          <p>{user?.profile?.location}</p>
        </CardContent>
      </Card>
    </div>
  )
}

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Account security and notification preferences." />
      <Card>
        <CardHeader><CardTitle>Security</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input type="password" placeholder="Current password" />
          <Input type="password" placeholder="New password" />
          <Button className="cursor-pointer">Update password</Button>
        </CardContent>
      </Card>
    </div>
  )
}
