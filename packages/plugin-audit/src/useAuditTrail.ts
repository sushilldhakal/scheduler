import { useState, useCallback } from 'react'
import type { Block } from '@shadcn-scheduler/core'

export type AuditAction = 'create' | 'delete' | 'move' | 'resize' | 'publish'

export interface AuditEntry {
  timestamp: string
  action: AuditAction
  blockId: string
  before?: Partial<Block>
  after?: Partial<Block>
}

export interface UseAuditTrailReturn {
  log: AuditEntry[]
  clearLog: () => void
  append: (entry: Omit<AuditEntry, 'timestamp'>) => void
}

/**
 * Maintains an in-memory audit log of block mutations.
 * Pass onAuditEvent to receive real-time notifications.
 */
export function useAuditTrail(
  onAuditEvent?: (entry: AuditEntry) => void
): UseAuditTrailReturn {
  const [log, setLog] = useState<AuditEntry[]>([])

  const append = useCallback(
    (entry: Omit<AuditEntry, 'timestamp'>) => {
      const full: AuditEntry = { ...entry, timestamp: new Date().toISOString() }
      setLog((prev) => [...prev.slice(-499), full])
      onAuditEvent?.(full)
    },
    [onAuditEvent]
  )

  const clearLog = useCallback(() => setLog([]), [])

  return { log, clearLog, append }
}
