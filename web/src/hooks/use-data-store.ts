import { useSyncExternalStore } from 'react'

let storeVersion = 0

type Listener = () => void
const listeners = new Set<Listener>()

export function subscribeDataStore(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function notifyDataStore() {
  storeVersion += 1
  listeners.forEach((l) => l())
}

export function useDataStoreVersion() {
  return useSyncExternalStore(
    subscribeDataStore,
    () => storeVersion,
    () => storeVersion,
  )
}
