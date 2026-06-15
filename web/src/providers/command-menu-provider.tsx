import { createContext, useCallback, useContext, useEffect, useState } from 'react'

type CommandMenuContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

const CommandMenuContext = createContext<CommandMenuContextValue | null>(null)

export function CommandMenuProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  const toggle = useCallback(() => setOpen((prev) => !prev), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <CommandMenuContext.Provider value={{ open, setOpen, toggle }}>
      {children}
    </CommandMenuContext.Provider>
  )
}

export function useCommandMenu() {
  const context = useContext(CommandMenuContext)
  if (!context) {
    throw new Error('useCommandMenu must be used within CommandMenuProvider')
  }
  return context
}
