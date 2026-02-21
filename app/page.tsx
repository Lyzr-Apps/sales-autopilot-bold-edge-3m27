'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { callAIAgent, AIAgentResponse } from '@/lib/aiAgent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { HiOutlineHome, HiOutlineQueueList, HiOutlineClock, HiOutlineCog6Tooth, HiOutlineEnvelope, HiOutlineUsers, HiOutlineExclamationTriangle, HiOutlineCheckCircle, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineMagnifyingGlass, HiOutlineArrowPath, HiOutlineFunnel, HiOutlineDocumentDuplicate, HiOutlinePencilSquare, HiOutlineXMark, HiOutlineCheck, HiOutlineInformationCircle, HiOutlineBolt, HiOutlineArrowUpTray } from 'react-icons/hi2'
import { FiDatabase, FiActivity, FiTrendingUp, FiAlertCircle } from 'react-icons/fi'

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────
const CRM_SYNC_COORDINATOR_ID = '69995e60a4f57aa46126cb9f'
const CRM_ENTRY_AGENT_ID = '69995e7372a2e3b0eaab96c7'

// ──────────────────────────────────────────────
// TypeScript Interfaces
// ──────────────────────────────────────────────
interface CRMEntry {
  contact_name: string
  contact_email: string
  company: string
  job_title: string
  deal_name: string
  deal_value: string
  deal_stage: string
  next_steps: string
  confidence_score: number
  validation_status: 'validated' | 'flagged' | 'incomplete'
  validation_issues: string[]
  is_duplicate: boolean
  source_email_subject: string
}

interface ProcessingSummary {
  total_emails_processed: number
  total_entries: number
  validated_count: number
  flagged_count: number
  incomplete_count: number
  duplicate_count: number
  average_confidence: number
}

interface PushResult {
  contact_name: string
  contact_email: string
  company: string
  deal_name: string
  status: 'success' | 'failed'
  hubspot_contact_id: string
  hubspot_deal_id: string
  error_message: string
}

interface ProcessingRun {
  id: string
  date: string
  emailCount: number
  entriesCreated: number
  successCount: number
  failureCount: number
  status: string
  entries: CRMEntry[]
}

interface Settings {
  defaultSenderDomains: string
  defaultKeywords: string
  maxEmails: number
  requiredFields: { [key: string]: boolean }
  minConfidenceThreshold: number
  fieldMappings: { [key: string]: string }
}

type ScreenType = 'dashboard' | 'review' | 'history' | 'settings'

// ──────────────────────────────────────────────
// Sample Data
// ──────────────────────────────────────────────
const SAMPLE_ENTRIES: CRMEntry[] = [
  {
    contact_name: 'Sarah Chen',
    contact_email: 'sarah.chen@techvista.io',
    company: 'TechVista Solutions',
    job_title: 'Head of Partnerships',
    deal_name: 'TechVista Enterprise Suite',
    deal_value: '125000',
    deal_stage: 'Negotiation',
    next_steps: 'Schedule contract review call for next Tuesday',
    confidence_score: 94,
    validation_status: 'validated',
    validation_issues: [],
    is_duplicate: false,
    source_email_subject: 'Re: Enterprise Suite Pricing Discussion'
  },
  {
    contact_name: 'Marcus Rodriguez',
    contact_email: 'mrodriguez@globalfin.com',
    company: 'GlobalFin Corp',
    job_title: 'VP of Technology',
    deal_name: 'GlobalFin Platform Migration',
    deal_value: '89000',
    deal_stage: 'Proposal',
    next_steps: 'Send updated proposal with compliance add-ons',
    confidence_score: 78,
    validation_status: 'flagged',
    validation_issues: ['Deal value format inconsistent', 'Missing department field'],
    is_duplicate: false,
    source_email_subject: 'Platform Migration Timeline'
  },
  {
    contact_name: 'Emily Watson',
    contact_email: 'e.watson@brightpath.edu',
    company: 'BrightPath Academy',
    job_title: 'Director of IT',
    deal_name: 'BrightPath LMS Integration',
    deal_value: '45000',
    deal_stage: 'Discovery',
    next_steps: 'Demo scheduled for March 5th',
    confidence_score: 87,
    validation_status: 'validated',
    validation_issues: [],
    is_duplicate: false,
    source_email_subject: 'LMS Integration Requirements'
  },
  {
    contact_name: 'James Nakamura',
    contact_email: 'j.nakamura@cloudpeak.co',
    company: 'CloudPeak Industries',
    job_title: 'CTO',
    deal_name: 'CloudPeak Infrastructure Deal',
    deal_value: '210000',
    deal_stage: 'Closed Won',
    next_steps: 'Send SOW and kickoff meeting invite',
    confidence_score: 96,
    validation_status: 'validated',
    validation_issues: [],
    is_duplicate: false,
    source_email_subject: 'Re: Final Terms Agreement'
  },
  {
    contact_name: 'Sarah Chen',
    contact_email: 'sarah.chen@techvista.io',
    company: 'TechVista Solutions',
    job_title: 'Head of Partnerships',
    deal_name: 'TechVista Add-On Services',
    deal_value: '32000',
    deal_stage: 'Qualification',
    next_steps: 'Needs assessment call',
    confidence_score: 42,
    validation_status: 'incomplete',
    validation_issues: ['Duplicate contact detected', 'Missing deal stage confirmation'],
    is_duplicate: true,
    source_email_subject: 'Additional Services Inquiry'
  }
]

const SAMPLE_SUMMARY: ProcessingSummary = {
  total_emails_processed: 12,
  total_entries: 5,
  validated_count: 3,
  flagged_count: 1,
  incomplete_count: 1,
  duplicate_count: 1,
  average_confidence: 79.4
}

const SAMPLE_HISTORY: ProcessingRun[] = [
  {
    id: 'run-sample-001',
    date: '2026-02-21T10:30:00Z',
    emailCount: 12,
    entriesCreated: 5,
    successCount: 4,
    failureCount: 1,
    status: 'completed',
    entries: SAMPLE_ENTRIES
  },
  {
    id: 'run-sample-002',
    date: '2026-02-20T14:15:00Z',
    emailCount: 8,
    entriesCreated: 3,
    successCount: 3,
    failureCount: 0,
    status: 'completed',
    entries: []
  },
  {
    id: 'run-sample-003',
    date: '2026-02-19T09:45:00Z',
    emailCount: 15,
    entriesCreated: 7,
    successCount: 5,
    failureCount: 2,
    status: 'completed',
    entries: []
  }
]

// ──────────────────────────────────────────────
// Default Settings
// ──────────────────────────────────────────────
const DEFAULT_SETTINGS: Settings = {
  defaultSenderDomains: '',
  defaultKeywords: '',
  maxEmails: 50,
  requiredFields: {
    contact_name: true,
    contact_email: true,
    company: true,
    job_title: false,
    deal_name: true,
    deal_value: true,
    deal_stage: true,
    next_steps: false,
  },
  minConfidenceThreshold: 60,
  fieldMappings: {
    contact_name: 'firstname + lastname',
    contact_email: 'email',
    company: 'company',
    job_title: 'jobtitle',
    deal_name: 'dealname',
    deal_value: 'amount',
    deal_stage: 'dealstage',
    next_steps: 'notes',
  }
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function parseAgentResult(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return {} }
  }
  return {}
}

function formatCurrency(val: string | number | undefined): string {
  if (!val) return '$0'
  const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.]/g, '')) : val
  if (isNaN(num)) return '$0'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num)
}

function confidenceColor(score: number): string {
  if (score > 80) return 'hsl(142, 65%, 45%)'
  if (score > 50) return 'hsl(45, 90%, 50%)'
  return 'hsl(0, 63%, 31%)'
}

function statusBadgeClasses(status: string): string {
  switch (status) {
    case 'validated': return 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50'
    case 'flagged': return 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50'
    case 'incomplete': return 'bg-red-900/50 text-red-300 border-red-700/50'
    default: return 'bg-muted text-muted-foreground'
  }
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part)
}

// ──────────────────────────────────────────────
// Agent Info
// ──────────────────────────────────────────────
const AGENTS = [
  { id: CRM_SYNC_COORDINATOR_ID, name: 'CRM Sync Coordinator', purpose: 'Orchestrates email fetching, extraction, and validation pipeline' },
  { id: CRM_ENTRY_AGENT_ID, name: 'CRM Entry Agent', purpose: 'Pushes validated contacts and deals to HubSpot' },
  { id: '69995e49938bc0103dbe0c39', name: 'Email Fetcher Agent', purpose: 'Fetches emails from Gmail with search filters' },
  { id: '69995e38ceed43b6522c4550', name: 'Data Extraction Agent', purpose: 'Parses email content into structured CRM fields' },
  { id: '69995e38c066ed107671ab82', name: 'Validation Agent', purpose: 'Validates completeness, formatting, and duplicates' },
]

// ──────────────────────────────────────────────
// ErrorBoundary
// ──────────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ──────────────────────────────────────────────
// Sidebar Nav Item
// ──────────────────────────────────────────────
function SidebarNavItem({ icon, label, active, collapsed, onClick }: { icon: React.ReactNode; label: string; active: boolean; collapsed: boolean; onClick: () => void }) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={onClick} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${active ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
            <span className="flex-shrink-0 w-5 h-5">{icon}</span>
            {!collapsed && <span className="truncate">{label}</span>}
          </button>
        </TooltipTrigger>
        {collapsed && <TooltipContent side="right"><p>{label}</p></TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  )
}

// ──────────────────────────────────────────────
// Metric Card
// ──────────────────────────────────────────────
function MetricCard({ title, value, icon, trend }: { title: string; value: string | number; icon: React.ReactNode; trend?: string }) {
  return (
    <Card className="bg-card border-border shadow-lg shadow-black/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{title}</span>
          <span className="text-accent">{icon}</span>
        </div>
        <div className="text-2xl font-bold font-mono text-foreground">{value}</div>
        {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
      </CardContent>
    </Card>
  )
}

// ──────────────────────────────────────────────
// Inline Editable Cell
// ──────────────────────────────────────────────
function EditableCell({ value, onSave, mono }: { value: string; onSave: (v: string) => void; mono?: boolean }) {
  const [editing, setEditing] = useState(false)
  const [tempVal, setTempVal] = useState(value)

  useEffect(() => { setTempVal(value) }, [value])

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input value={tempVal} onChange={(e) => setTempVal(e.target.value)} className="h-7 text-xs px-1.5 bg-secondary border-border" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') { onSave(tempVal); setEditing(false) } if (e.key === 'Escape') { setTempVal(value); setEditing(false) } }} />
        <button onClick={() => { onSave(tempVal); setEditing(false) }} className="text-accent hover:text-accent/80"><HiOutlineCheck className="w-3.5 h-3.5" /></button>
        <button onClick={() => { setTempVal(value); setEditing(false) }} className="text-muted-foreground hover:text-foreground"><HiOutlineXMark className="w-3.5 h-3.5" /></button>
      </div>
    )
  }

  return (
    <button onClick={() => setEditing(true)} className={`group flex items-center gap-1 text-left hover:text-accent transition-colors ${mono ? 'font-mono' : ''}`}>
      <span className="text-xs truncate max-w-[140px]">{value || '-'}</span>
      <HiOutlinePencilSquare className="w-3 h-3 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
    </button>
  )
}

// ──────────────────────────────────────────────
// Entry Detail Dialog
// ──────────────────────────────────────────────
function EntryDetailDialog({ entry }: { entry: CRMEntry }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
          <HiOutlineChevronDown className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">{entry?.contact_name ?? 'Entry Details'}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{entry?.company ?? ''} - {entry?.job_title ?? ''}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="text-sm font-mono">{entry?.contact_email ?? '-'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Deal Stage</Label>
              <p className="text-sm">{entry?.deal_stage ?? '-'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Deal Value</Label>
              <p className="text-sm font-mono">{formatCurrency(entry?.deal_value)}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Confidence</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full overflow-hidden bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${entry?.confidence_score ?? 0}%`, background: confidenceColor(entry?.confidence_score ?? 0) }} />
                </div>
                <span className="text-xs font-mono">{entry?.confidence_score ?? 0}%</span>
              </div>
            </div>
          </div>
          <Separator className="bg-border" />
          <div>
            <Label className="text-xs text-muted-foreground">Source Email Subject</Label>
            <p className="text-sm mt-1">{entry?.source_email_subject ?? '-'}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Next Steps</Label>
            <p className="text-sm mt-1">{entry?.next_steps ?? '-'}</p>
          </div>
          {Array.isArray(entry?.validation_issues) && entry.validation_issues.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Validation Issues</Label>
              <ul className="mt-1 space-y-1">
                {entry.validation_issues.map((issue, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-yellow-400">
                    <HiOutlineExclamationTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {entry?.is_duplicate && (
            <Badge className="bg-orange-900/40 text-orange-300 border-orange-700/50">
              <HiOutlineDocumentDuplicate className="w-3.5 h-3.5 mr-1" /> Duplicate Contact
            </Badge>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────────────────────────
// Main Page Component
// ──────────────────────────────────────────────
export default function Page() {
  // Navigation
  const [activeScreen, setActiveScreen] = useState<ScreenType>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Sample data toggle
  const [showSampleData, setShowSampleData] = useState(false)

  // Dashboard state
  const [senderDomain, setSenderDomain] = useState('')
  const [keywords, setKeywords] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Processing state
  const [processing, setProcessing] = useState(false)
  const [processMessage, setProcessMessage] = useState('')
  const [processError, setProcessError] = useState('')
  const [entries, setEntries] = useState<CRMEntry[]>([])
  const [summary, setSummary] = useState<ProcessingSummary | null>(null)
  const [pipelineStatus, setPipelineStatus] = useState('')

  // Review Queue state
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set())
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [pushing, setPushing] = useState(false)
  const [pushMessage, setPushMessage] = useState('')
  const [pushError, setPushError] = useState('')
  const [pushResults, setPushResults] = useState<PushResult[]>([])

  // History
  const [history, setHistory] = useState<ProcessingRun[]>([])
  const [historySearch, setHistorySearch] = useState('')
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all')
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)

  // Settings
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

  // Agent activity
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // Metrics
  const [totalEmailsProcessed, setTotalEmailsProcessed] = useState(0)
  const [totalEntriesCreated, setTotalEntriesCreated] = useState(0)
  const [totalErrors, setTotalErrors] = useState(0)
  const [pendingReview, setPendingReview] = useState(0)

  // ──────────────────────────────────────────────
  // Load from localStorage
  // ──────────────────────────────────────────────
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('crm-autosync-history')
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory)
        if (Array.isArray(parsed)) setHistory(parsed)
      }
    } catch {}
    try {
      const savedSettings = localStorage.getItem('crm-autosync-settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        if (parsed && typeof parsed === 'object') setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      }
    } catch {}
    try {
      const savedMetrics = localStorage.getItem('crm-autosync-metrics')
      if (savedMetrics) {
        const parsed = JSON.parse(savedMetrics)
        if (parsed) {
          setTotalEmailsProcessed(parsed.totalEmailsProcessed ?? 0)
          setTotalEntriesCreated(parsed.totalEntriesCreated ?? 0)
          setTotalErrors(parsed.totalErrors ?? 0)
          setPendingReview(parsed.pendingReview ?? 0)
        }
      }
    } catch {}
  }, [])

  // Save history to localStorage
  useEffect(() => {
    if (history.length > 0) {
      try { localStorage.setItem('crm-autosync-history', JSON.stringify(history)) } catch {}
    }
  }, [history])

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: Settings) => {
    setSettings(newSettings)
    try { localStorage.setItem('crm-autosync-settings', JSON.stringify(newSettings)) } catch {}
  }, [])

  // Save metrics
  useEffect(() => {
    try {
      localStorage.setItem('crm-autosync-metrics', JSON.stringify({ totalEmailsProcessed, totalEntriesCreated, totalErrors, pendingReview }))
    } catch {}
  }, [totalEmailsProcessed, totalEntriesCreated, totalErrors, pendingReview])

  // Current display entries (real or sample)
  const displayEntries = useMemo(() => {
    if (showSampleData && entries.length === 0) return SAMPLE_ENTRIES
    return entries
  }, [showSampleData, entries])

  const displaySummary = useMemo(() => {
    if (showSampleData && !summary) return SAMPLE_SUMMARY
    return summary
  }, [showSampleData, summary])

  const displayHistory = useMemo(() => {
    if (showSampleData && history.length === 0) return SAMPLE_HISTORY
    return history
  }, [showSampleData, history])

  // Filtered entries for Review Queue
  const filteredEntries = useMemo(() => {
    if (statusFilter === 'all') return displayEntries
    return displayEntries.filter(e => e?.validation_status === statusFilter)
  }, [displayEntries, statusFilter])

  // Filtered history
  const filteredHistory = useMemo(() => {
    let filtered = displayHistory
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase()
      filtered = filtered.filter(run => {
        if (run?.status?.toLowerCase().includes(q)) return true
        if (Array.isArray(run?.entries)) {
          return run.entries.some(e => (e?.contact_name ?? '').toLowerCase().includes(q) || (e?.deal_name ?? '').toLowerCase().includes(q))
        }
        return false
      })
    }
    if (historyStatusFilter !== 'all') {
      filtered = filtered.filter(run => run?.status === historyStatusFilter)
    }
    return filtered
  }, [displayHistory, historySearch, historyStatusFilter])

  // ──────────────────────────────────────────────
  // Process Emails Handler
  // ──────────────────────────────────────────────
  const handleProcessEmails = useCallback(async () => {
    setProcessing(true)
    setProcessMessage('')
    setProcessError('')
    setActiveAgentId(CRM_SYNC_COORDINATOR_ID)

    const filterParts: string[] = []
    if (senderDomain.trim()) filterParts.push(`sender domain: ${senderDomain.trim()}`)
    if (keywords.trim()) filterParts.push(`keywords: ${keywords.trim()}`)
    if (dateFrom) filterParts.push(`from date: ${dateFrom}`)
    if (dateTo) filterParts.push(`to date: ${dateTo}`)

    const filterStr = filterParts.length > 0 ? filterParts.join(', ') : 'no specific filters'
    const message = `Fetch emails from Gmail with filters: ${filterStr}. Then extract CRM data and validate all entries. Max emails: ${settings.maxEmails}. Minimum confidence threshold: ${settings.minConfidenceThreshold}%.`

    try {
      const result: AIAgentResponse = await callAIAgent(message, CRM_SYNC_COORDINATOR_ID)

      if (result.success && result?.response?.result) {
        const parsed = parseAgentResult(result.response.result)
        const validatedEntries = Array.isArray(parsed?.validated_entries) ? parsed.validated_entries as CRMEntry[] : []
        const summaryData = (parsed?.summary && typeof parsed.summary === 'object') ? parsed.summary as ProcessingSummary : null
        const status = typeof parsed?.pipeline_status === 'string' ? parsed.pipeline_status : 'completed'

        setEntries(validatedEntries)
        setSummary(summaryData)
        setPipelineStatus(status)
        setSelectedEntries(new Set())
        setPushResults([])

        const emailCount = summaryData?.total_emails_processed ?? 0
        const entryCount = validatedEntries.length
        setTotalEmailsProcessed(prev => prev + emailCount)
        setTotalEntriesCreated(prev => prev + entryCount)
        setPendingReview(entryCount)

        const runId = `run-${Date.now()}`
        const newRun: ProcessingRun = {
          id: runId,
          date: new Date().toISOString(),
          emailCount,
          entriesCreated: entryCount,
          successCount: summaryData?.validated_count ?? 0,
          failureCount: (summaryData?.flagged_count ?? 0) + (summaryData?.incomplete_count ?? 0),
          status,
          entries: validatedEntries,
        }
        setHistory(prev => [newRun, ...prev])

        setProcessMessage(`Successfully processed ${emailCount} emails and extracted ${entryCount} CRM entries.`)
        if (entryCount > 0) {
          setActiveScreen('review')
        }
      } else {
        setProcessError(result?.error ?? result?.response?.message ?? 'Processing failed. Please try again.')
      }
    } catch {
      setProcessError('Network error occurred. Please try again.')
    } finally {
      setProcessing(false)
      setActiveAgentId(null)
    }
  }, [senderDomain, keywords, dateFrom, dateTo, settings.maxEmails, settings.minConfidenceThreshold])

  // ──────────────────────────────────────────────
  // Push to CRM Handler
  // ──────────────────────────────────────────────
  const handlePushToCRM = useCallback(async () => {
    const selected = filteredEntries.filter((_, i) => selectedEntries.has(i))
    if (selected.length === 0) return

    setPushing(true)
    setPushMessage('')
    setPushError('')
    setPushResults([])
    setActiveAgentId(CRM_ENTRY_AGENT_ID)

    const entriesToPush = selected.map(e => ({
      contact_name: e?.contact_name ?? '',
      contact_email: e?.contact_email ?? '',
      company: e?.company ?? '',
      job_title: e?.job_title ?? '',
      deal_name: e?.deal_name ?? '',
      deal_value: e?.deal_value ?? '',
      deal_stage: e?.deal_stage ?? '',
      next_steps: e?.next_steps ?? '',
    }))

    const message = `Create the following contacts and deals in HubSpot: ${JSON.stringify(entriesToPush)}`

    try {
      const result: AIAgentResponse = await callAIAgent(message, CRM_ENTRY_AGENT_ID)

      if (result.success && result?.response?.result) {
        const parsed = parseAgentResult(result.response.result)
        const results = Array.isArray(parsed?.results) ? parsed.results as PushResult[] : []
        const pushSummary = (parsed?.summary && typeof parsed.summary === 'object') ? parsed.summary as { total_processed: number; successful: number; failed: number } : null

        setPushResults(results)
        const successCount = pushSummary?.successful ?? results.filter(r => r?.status === 'success').length
        const failCount = pushSummary?.failed ?? results.filter(r => r?.status === 'failed').length

        setTotalErrors(prev => prev + failCount)
        setPendingReview(prev => Math.max(0, prev - selected.length))

        setPushMessage(`Pushed ${selected.length} entries: ${successCount} succeeded, ${failCount} failed.`)
        setSelectedEntries(new Set())
      } else {
        setPushError(result?.error ?? result?.response?.message ?? 'Push failed. Please try again.')
      }
    } catch {
      setPushError('Network error while pushing to CRM.')
    } finally {
      setPushing(false)
      setActiveAgentId(null)
    }
  }, [filteredEntries, selectedEntries])

  // ──────────────────────────────────────────────
  // Select All / Toggle
  // ──────────────────────────────────────────────
  const toggleSelectAll = useCallback(() => {
    if (selectedEntries.size === filteredEntries.length) {
      setSelectedEntries(new Set())
    } else {
      setSelectedEntries(new Set(filteredEntries.map((_, i) => i)))
    }
  }, [selectedEntries.size, filteredEntries])

  const toggleSelect = useCallback((idx: number) => {
    setSelectedEntries(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }, [])

  // ──────────────────────────────────────────────
  // Update entry inline
  // ──────────────────────────────────────────────
  const updateEntry = useCallback((idx: number, field: keyof CRMEntry, value: string) => {
    setEntries(prev => {
      const updated = [...prev]
      if (updated[idx]) {
        updated[idx] = { ...updated[idx], [field]: value }
      }
      return updated
    })
  }, [])

  // ──────────────────────────────────────────────
  // Dashboard metrics
  // ──────────────────────────────────────────────
  const dashboardMetrics = useMemo(() => {
    if (showSampleData && totalEmailsProcessed === 0) {
      return { emails: 35, entries: 15, errorRate: '6.7%', pending: 5 }
    }
    const errorRate = totalEntriesCreated > 0 ? ((totalErrors / totalEntriesCreated) * 100).toFixed(1) + '%' : '0%'
    return { emails: totalEmailsProcessed, entries: totalEntriesCreated, errorRate, pending: pendingReview }
  }, [showSampleData, totalEmailsProcessed, totalEntriesCreated, totalErrors, pendingReview])

  // ──────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground font-sans flex">
        {/* ─── Sidebar ─── */}
        <aside className={`flex-shrink-0 bg-card border-r border-border flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
          {/* Logo area */}
          <div className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(160, 70%, 40%)' }}>
              <FiDatabase className="w-4 h-4 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-sm font-bold text-foreground tracking-tight leading-none">CRM AutoSync</h1>
                <p className="text-[10px] text-muted-foreground mt-0.5">Email to HubSpot</p>
              </div>
            )}
          </div>

          <Separator className="bg-border mx-3" />

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1">
            <SidebarNavItem icon={<HiOutlineHome className="w-5 h-5" />} label="Dashboard" active={activeScreen === 'dashboard'} collapsed={sidebarCollapsed} onClick={() => setActiveScreen('dashboard')} />
            <SidebarNavItem icon={<HiOutlineQueueList className="w-5 h-5" />} label="Review Queue" active={activeScreen === 'review'} collapsed={sidebarCollapsed} onClick={() => setActiveScreen('review')} />
            <SidebarNavItem icon={<HiOutlineClock className="w-5 h-5" />} label="History" active={activeScreen === 'history'} collapsed={sidebarCollapsed} onClick={() => setActiveScreen('history')} />
            <SidebarNavItem icon={<HiOutlineCog6Tooth className="w-5 h-5" />} label="Settings" active={activeScreen === 'settings'} collapsed={sidebarCollapsed} onClick={() => setActiveScreen('settings')} />
          </nav>

          {/* Agent Status */}
          {!sidebarCollapsed && (
            <div className="p-3 border-t border-border">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Agents</p>
              <div className="space-y-1.5">
                {AGENTS.map(agent => (
                  <TooltipProvider key={agent.id} delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeAgentId === agent.id ? 'bg-accent animate-pulse' : 'bg-muted-foreground/40'}`} />
                          <span className="text-[11px] text-muted-foreground truncate">{agent.name}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right"><p className="text-xs">{agent.purpose}</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}

          {/* Collapse toggle */}
          <button onClick={() => setSidebarCollapsed(prev => !prev)} className="p-3 border-t border-border text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center">
            {sidebarCollapsed ? <HiOutlineChevronRight className="w-4 h-4" /> : <HiOutlineChevronLeft className="w-4 h-4" />}
          </button>
        </aside>

        {/* ─── Main Content ─── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-card flex-shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-foreground">
                {activeScreen === 'dashboard' && 'Dashboard'}
                {activeScreen === 'review' && 'Review Queue'}
                {activeScreen === 'history' && 'Processing History'}
                {activeScreen === 'settings' && 'Settings'}
              </h2>
              {processing && (
                <Badge className="bg-accent/20 text-accent border-accent/30 text-xs">
                  <HiOutlineArrowPath className="w-3 h-3 mr-1 animate-spin" /> Processing
                </Badge>
              )}
              {pushing && (
                <Badge className="bg-accent/20 text-accent border-accent/30 text-xs">
                  <HiOutlineArrowPath className="w-3 h-3 mr-1 animate-spin" /> Pushing to CRM
                </Badge>
              )}
              {pipelineStatus && !processing && (
                <Badge variant="outline" className="text-xs border-border text-muted-foreground">{pipelineStatus}</Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground">Sample Data</Label>
              <Switch id="sample-toggle" checked={showSampleData} onCheckedChange={setShowSampleData} />
            </div>
          </header>

          {/* Content Area */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              {/* ═══════════════════════════════════════ */}
              {/* DASHBOARD SCREEN */}
              {/* ═══════════════════════════════════════ */}
              {activeScreen === 'dashboard' && (
                <div className="space-y-6">
                  {/* Metrics Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard title="Emails Processed" value={dashboardMetrics.emails} icon={<HiOutlineEnvelope className="w-5 h-5" />} />
                    <MetricCard title="Entries Created" value={dashboardMetrics.entries} icon={<HiOutlineUsers className="w-5 h-5" />} />
                    <MetricCard title="Error Rate" value={dashboardMetrics.errorRate} icon={<FiAlertCircle className="w-5 h-5" />} />
                    <MetricCard title="Pending Review" value={dashboardMetrics.pending} icon={<HiOutlineQueueList className="w-5 h-5" />} />
                  </div>

                  {/* Main content */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Recent Processing Runs */}
                    <div className="lg:col-span-3 space-y-4">
                      <h3 className="text-sm font-semibold text-foreground">Recent Processing Runs</h3>
                      {displayHistory.length === 0 ? (
                        <Card className="bg-card border-border shadow-lg shadow-black/20">
                          <CardContent className="p-8 text-center">
                            <FiActivity className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                            <p className="text-sm text-muted-foreground">No processing runs yet</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">Configure filters and click Process Emails to get started</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-3">
                          {displayHistory.slice(0, 5).map((run, i) => (
                            <Card key={run?.id ?? `history-${i}`} className="bg-card border-border shadow-lg shadow-black/20">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${run?.status === 'completed' ? 'bg-emerald-400' : run?.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                                    <div>
                                      <p className="text-sm font-medium text-foreground">{run?.emailCount ?? 0} emails processed</p>
                                      <p className="text-xs text-muted-foreground mt-0.5">{run?.date ? new Date(run.date).toLocaleString() : '-'}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <p className="text-xs text-muted-foreground">{run?.entriesCreated ?? 0} entries</p>
                                      <p className="text-xs text-muted-foreground">
                                        <span className="text-emerald-400">{run?.successCount ?? 0}</span>
                                        {' / '}
                                        <span className="text-red-400">{run?.failureCount ?? 0}</span>
                                      </p>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] capitalize border-border text-muted-foreground">{run?.status ?? 'unknown'}</Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* Summary card */}
                      {displaySummary && (
                        <Card className="bg-card border-border shadow-lg shadow-black/20">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-foreground">Last Run Summary</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Validated</p>
                                <p className="text-lg font-bold font-mono text-emerald-400">{displaySummary.validated_count ?? 0}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Flagged</p>
                                <p className="text-lg font-bold font-mono text-yellow-400">{displaySummary.flagged_count ?? 0}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Incomplete</p>
                                <p className="text-lg font-bold font-mono text-red-400">{displaySummary.incomplete_count ?? 0}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Duplicates</p>
                                <p className="text-lg font-bold font-mono text-orange-400">{displaySummary.duplicate_count ?? 0}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Avg Confidence</p>
                                <p className="text-lg font-bold font-mono" style={{ color: confidenceColor(displaySummary.average_confidence ?? 0) }}>{(displaySummary.average_confidence ?? 0).toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Total Entries</p>
                                <p className="text-lg font-bold font-mono text-foreground">{displaySummary.total_entries ?? 0}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Filter Configuration */}
                    <div className="lg:col-span-2">
                      <Card className="bg-card border-border shadow-lg shadow-black/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-foreground flex items-center gap-2">
                            <HiOutlineFunnel className="w-4 h-4 text-accent" /> Email Filters
                          </CardTitle>
                          <CardDescription className="text-xs text-muted-foreground">Configure filters to fetch relevant emails from Gmail</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Sender Domain</Label>
                            <Input placeholder="e.g. acmecorp.com" value={senderDomain} onChange={(e) => setSenderDomain(e.target.value)} className="mt-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground/50" />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Keywords</Label>
                            <Input placeholder="e.g. proposal, deal, contract" value={keywords} onChange={(e) => setKeywords(e.target.value)} className="mt-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground/50" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">From Date</Label>
                              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1 bg-secondary border-border text-foreground" />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">To Date</Label>
                              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1 bg-secondary border-border text-foreground" />
                            </div>
                          </div>

                          <Separator className="bg-border" />

                          <Button onClick={handleProcessEmails} disabled={processing} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 transition-colors">
                            {processing ? (
                              <><HiOutlineArrowPath className="w-4 h-4 mr-2 animate-spin" /> Processing Emails...</>
                            ) : (
                              <><HiOutlineBolt className="w-4 h-4 mr-2" /> Process Emails</>
                            )}
                          </Button>

                          {processMessage && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-900/30 border border-emerald-700/40">
                              <HiOutlineCheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-emerald-300">{processMessage}</p>
                            </div>
                          )}
                          {processError && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-900/30 border border-red-700/40">
                              <HiOutlineExclamationTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-red-300">{processError}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Processing skeleton */}
                  {processing && (
                    <Card className="bg-card border-border shadow-lg shadow-black/20">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-3">
                          <HiOutlineArrowPath className="w-5 h-5 text-accent animate-spin" />
                          <p className="text-sm text-foreground font-medium">Processing pipeline running...</p>
                        </div>
                        <div className="space-y-3">
                          <Skeleton className="h-4 w-3/4 bg-muted" />
                          <Skeleton className="h-4 w-1/2 bg-muted" />
                          <Skeleton className="h-4 w-5/6 bg-muted" />
                          <Skeleton className="h-4 w-2/3 bg-muted" />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════ */}
              {/* REVIEW QUEUE SCREEN */}
              {/* ═══════════════════════════════════════ */}
              {activeScreen === 'review' && (
                <div className="space-y-4">
                  {/* Action Bar */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={filteredEntries.length > 0 && selectedEntries.size === filteredEntries.length} onCheckedChange={toggleSelectAll} className="border-border data-[state=checked]:bg-accent data-[state=checked]:border-accent" />
                        <Label className="text-xs text-muted-foreground">{selectedEntries.size > 0 ? `${selectedEntries.size} selected` : 'Select All'}</Label>
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-36 h-8 text-xs bg-secondary border-border text-foreground">
                          <SelectValue placeholder="Filter status" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="validated">Validated</SelectItem>
                          <SelectItem value="flagged">Flagged</SelectItem>
                          <SelectItem value="incomplete">Incomplete</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">{filteredEntries.length} entries</p>
                    </div>
                    <Button onClick={handlePushToCRM} disabled={pushing || selectedEntries.size === 0} className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs">
                      {pushing ? (
                        <><HiOutlineArrowPath className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Pushing...</>
                      ) : (
                        <><HiOutlineArrowUpTray className="w-3.5 h-3.5 mr-1.5" /> Push to CRM ({selectedEntries.size})</>
                      )}
                    </Button>
                  </div>

                  {/* Status messages */}
                  {pushMessage && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-900/30 border border-emerald-700/40">
                      <HiOutlineCheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-300">{pushMessage}</p>
                    </div>
                  )}
                  {pushError && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-900/30 border border-red-700/40">
                      <HiOutlineExclamationTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-300">{pushError}</p>
                    </div>
                  )}

                  {/* Push Results */}
                  {pushResults.length > 0 && (
                    <Card className="bg-card border-border shadow-lg shadow-black/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-foreground">Push Results</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="space-y-2">
                          {pushResults.map((pr, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                              <div className="flex items-center gap-2">
                                {pr?.status === 'success' ? (
                                  <HiOutlineCheckCircle className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <HiOutlineExclamationTriangle className="w-4 h-4 text-red-400" />
                                )}
                                <span className="text-xs text-foreground">{pr?.contact_name ?? 'Unknown'}</span>
                                <span className="text-xs text-muted-foreground">- {pr?.deal_name ?? ''}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {pr?.hubspot_contact_id && (
                                  <span className="text-[10px] text-muted-foreground font-mono">CID: {pr.hubspot_contact_id}</span>
                                )}
                                {pr?.hubspot_deal_id && (
                                  <span className="text-[10px] text-muted-foreground font-mono">DID: {pr.hubspot_deal_id}</span>
                                )}
                                {pr?.error_message && (
                                  <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                      <TooltipTrigger><HiOutlineInformationCircle className="w-3.5 h-3.5 text-red-400" /></TooltipTrigger>
                                      <TooltipContent><p className="text-xs">{pr.error_message}</p></TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                <Badge className={pr?.status === 'success' ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50 text-[10px]' : 'bg-red-900/50 text-red-300 border-red-700/50 text-[10px]'}>{pr?.status ?? 'unknown'}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Entries Table */}
                  {filteredEntries.length === 0 ? (
                    <Card className="bg-card border-border shadow-lg shadow-black/20">
                      <CardContent className="p-12 text-center">
                        <HiOutlineQueueList className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-sm text-muted-foreground font-medium">No entries to review</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Process emails from the Dashboard to populate the review queue</p>
                        <Button variant="outline" className="mt-4 text-xs border-border text-muted-foreground hover:text-foreground" onClick={() => setActiveScreen('dashboard')}>Go to Dashboard</Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-card border-border shadow-lg shadow-black/20 overflow-hidden">
                      <ScrollArea className="w-full">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                              <TableHead className="w-10 text-muted-foreground text-[10px] uppercase tracking-wider"></TableHead>
                              <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider">Contact</TableHead>
                              <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider">Email</TableHead>
                              <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider">Company</TableHead>
                              <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider">Deal</TableHead>
                              <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider">Value</TableHead>
                              <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider">Stage</TableHead>
                              <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider w-32">Confidence</TableHead>
                              <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider">Status</TableHead>
                              <TableHead className="w-10"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredEntries.map((entry, idx) => (
                              <TableRow key={idx} className="border-border hover:bg-secondary/30 transition-colors">
                                <TableCell className="py-2">
                                  <Checkbox checked={selectedEntries.has(idx)} onCheckedChange={() => toggleSelect(idx)} className="border-border data-[state=checked]:bg-accent data-[state=checked]:border-accent" />
                                </TableCell>
                                <TableCell className="py-2">
                                  <div className="flex items-center gap-1.5">
                                    <EditableCell value={entry?.contact_name ?? ''} onSave={(v) => updateEntry(idx, 'contact_name', v)} />
                                    {entry?.is_duplicate && (
                                      <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                          <TooltipTrigger><HiOutlineDocumentDuplicate className="w-3.5 h-3.5 text-orange-400" /></TooltipTrigger>
                                          <TooltipContent><p className="text-xs">Duplicate contact</p></TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="py-2">
                                  <EditableCell value={entry?.contact_email ?? ''} onSave={(v) => updateEntry(idx, 'contact_email', v)} mono />
                                </TableCell>
                                <TableCell className="py-2">
                                  <EditableCell value={entry?.company ?? ''} onSave={(v) => updateEntry(idx, 'company', v)} />
                                </TableCell>
                                <TableCell className="py-2">
                                  <EditableCell value={entry?.deal_name ?? ''} onSave={(v) => updateEntry(idx, 'deal_name', v)} />
                                </TableCell>
                                <TableCell className="py-2">
                                  <EditableCell value={entry?.deal_value ?? ''} onSave={(v) => updateEntry(idx, 'deal_value', v)} mono />
                                </TableCell>
                                <TableCell className="py-2">
                                  <EditableCell value={entry?.deal_stage ?? ''} onSave={(v) => updateEntry(idx, 'deal_stage', v)} />
                                </TableCell>
                                <TableCell className="py-2">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 rounded-full overflow-hidden bg-muted">
                                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${entry?.confidence_score ?? 0}%`, background: confidenceColor(entry?.confidence_score ?? 0) }} />
                                    </div>
                                    <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{entry?.confidence_score ?? 0}%</span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-2">
                                  <Badge className={`text-[10px] capitalize border ${statusBadgeClasses(entry?.validation_status ?? '')}`}>{entry?.validation_status ?? 'unknown'}</Badge>
                                </TableCell>
                                <TableCell className="py-2">
                                  <EntryDetailDialog entry={entry} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </Card>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════ */}
              {/* HISTORY SCREEN */}
              {/* ═══════════════════════════════════════ */}
              {activeScreen === 'history' && (
                <div className="space-y-4">
                  {/* Search and Filter */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                      <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Search by contact or deal name..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 h-9 text-xs" />
                    </div>
                    <Select value={historyStatusFilter} onValueChange={setHistoryStatusFilter}>
                      <SelectTrigger className="w-36 h-9 text-xs bg-secondary border-border text-foreground">
                        <SelectValue placeholder="Filter status" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* History Table */}
                  {filteredHistory.length === 0 ? (
                    <Card className="bg-card border-border shadow-lg shadow-black/20">
                      <CardContent className="p-12 text-center">
                        <HiOutlineClock className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-sm text-muted-foreground font-medium">No history yet</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Processing runs will appear here after you process emails</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-card border-border shadow-lg shadow-black/20 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="w-10"></TableHead>
                            <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider">Date</TableHead>
                            <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider">Emails</TableHead>
                            <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider">Entries</TableHead>
                            <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider">Success</TableHead>
                            <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider">Failed</TableHead>
                            <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredHistory.map((run, i) => (
                            <React.Fragment key={run?.id ?? `hist-${i}`}>
                              <TableRow className="border-border hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setExpandedRunId(prev => prev === (run?.id ?? null) ? null : (run?.id ?? null))}>
                                <TableCell className="py-2">
                                  <button className="text-muted-foreground hover:text-foreground">
                                    {expandedRunId === run?.id ? <HiOutlineChevronUp className="w-4 h-4" /> : <HiOutlineChevronDown className="w-4 h-4" />}
                                  </button>
                                </TableCell>
                                <TableCell className="py-2 text-xs font-mono text-foreground">{run?.date ? new Date(run.date).toLocaleDateString() + ' ' + new Date(run.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</TableCell>
                                <TableCell className="py-2 text-xs font-mono text-foreground">{run?.emailCount ?? 0}</TableCell>
                                <TableCell className="py-2 text-xs font-mono text-foreground">{run?.entriesCreated ?? 0}</TableCell>
                                <TableCell className="py-2 text-xs font-mono text-emerald-400">{run?.successCount ?? 0}</TableCell>
                                <TableCell className="py-2 text-xs font-mono text-red-400">{run?.failureCount ?? 0}</TableCell>
                                <TableCell className="py-2">
                                  <Badge variant="outline" className={`text-[10px] capitalize border ${run?.status === 'completed' ? 'border-emerald-700/50 text-emerald-400' : run?.status === 'failed' ? 'border-red-700/50 text-red-400' : 'border-border text-muted-foreground'}`}>{run?.status ?? 'unknown'}</Badge>
                                </TableCell>
                              </TableRow>
                              {expandedRunId === run?.id && Array.isArray(run?.entries) && run.entries.length > 0 && (
                                <TableRow className="border-border">
                                  <TableCell colSpan={7} className="p-0">
                                    <div className="bg-secondary/30 p-4 space-y-2">
                                      <p className="text-xs font-medium text-muted-foreground mb-2">Entries from this run:</p>
                                      {run.entries.map((entry, ei) => (
                                        <div key={ei} className="flex items-center justify-between p-2 rounded bg-card/50 border border-border/50">
                                          <div className="flex items-center gap-3">
                                            <span className="text-xs text-foreground font-medium">{entry?.contact_name ?? 'Unknown'}</span>
                                            <span className="text-xs text-muted-foreground">{entry?.company ?? ''}</span>
                                            <span className="text-xs text-muted-foreground font-mono">{entry?.deal_name ?? ''}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-muted-foreground">{formatCurrency(entry?.deal_value)}</span>
                                            <Badge className={`text-[10px] capitalize border ${statusBadgeClasses(entry?.validation_status ?? '')}`}>{entry?.validation_status ?? 'unknown'}</Badge>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                              {expandedRunId === run?.id && (!Array.isArray(run?.entries) || run.entries.length === 0) && (
                                <TableRow className="border-border">
                                  <TableCell colSpan={7} className="p-4">
                                    <p className="text-xs text-muted-foreground text-center">No detailed entries available for this run</p>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════ */}
              {/* SETTINGS SCREEN */}
              {/* ═══════════════════════════════════════ */}
              {activeScreen === 'settings' && (
                <div className="space-y-6 max-w-3xl">
                  {/* Email Filters */}
                  <Card className="bg-card border-border shadow-lg shadow-black/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-foreground flex items-center gap-2">
                        <HiOutlineEnvelope className="w-4 h-4 text-accent" /> Email Filters
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">Default filters applied to email fetching</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Default Sender Domains</Label>
                        <Input placeholder="e.g. acme.com, techvista.io" value={settings.defaultSenderDomains} onChange={(e) => saveSettings({ ...settings, defaultSenderDomains: e.target.value })} className="mt-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground/50" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Default Keywords</Label>
                        <Input placeholder="e.g. proposal, deal, partnership" value={settings.defaultKeywords} onChange={(e) => saveSettings({ ...settings, defaultKeywords: e.target.value })} className="mt-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground/50" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Max Emails to Fetch</Label>
                        <div className="flex items-center gap-3 mt-1">
                          <Slider value={[settings.maxEmails]} onValueChange={(val) => saveSettings({ ...settings, maxEmails: val[0] ?? 50 })} min={10} max={200} step={10} className="flex-1" />
                          <span className="text-xs font-mono text-muted-foreground w-8 text-right">{settings.maxEmails}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Validation Rules */}
                  <Card className="bg-card border-border shadow-lg shadow-black/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-foreground flex items-center gap-2">
                        <HiOutlineCheckCircle className="w-4 h-4 text-accent" /> Validation Rules
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">Configure required fields and confidence thresholds</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-3 block">Required Fields</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(settings.requiredFields).map(([field, required]) => (
                            <div key={field} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                              <Label className="text-xs text-foreground capitalize">{field.replace(/_/g, ' ')}</Label>
                              <Switch checked={required} onCheckedChange={(checked) => saveSettings({ ...settings, requiredFields: { ...settings.requiredFields, [field]: checked } })} />
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator className="bg-border" />
                      <div>
                        <Label className="text-xs text-muted-foreground">Minimum Confidence Threshold</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Slider value={[settings.minConfidenceThreshold]} onValueChange={(val) => saveSettings({ ...settings, minConfidenceThreshold: val[0] ?? 60 })} min={0} max={100} step={5} className="flex-1" />
                          <span className="text-xs font-mono w-8 text-right" style={{ color: confidenceColor(settings.minConfidenceThreshold) }}>{settings.minConfidenceThreshold}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* CRM Field Mapping */}
                  <Card className="bg-card border-border shadow-lg shadow-black/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-foreground flex items-center gap-2">
                        <FiDatabase className="w-4 h-4 text-accent" /> CRM Field Mapping
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">Map extracted fields to HubSpot properties</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider">Extracted Field</TableHead>
                            <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider text-center w-12"></TableHead>
                            <TableHead className="text-muted-foreground text-[10px] uppercase tracking-wider">HubSpot Property</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(settings.fieldMappings).map(([extracted, hubspot]) => (
                            <TableRow key={extracted} className="border-border hover:bg-secondary/20">
                              <TableCell className="text-xs text-foreground capitalize py-2">{extracted.replace(/_/g, ' ')}</TableCell>
                              <TableCell className="text-center py-2">
                                <FiTrendingUp className="w-3 h-3 text-accent inline" />
                              </TableCell>
                              <TableCell className="py-2">
                                <Input value={hubspot} onChange={(e) => saveSettings({ ...settings, fieldMappings: { ...settings.fieldMappings, [extracted]: e.target.value } })} className="h-7 text-xs bg-secondary border-border text-foreground font-mono" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Reset Settings */}
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => saveSettings(DEFAULT_SETTINGS)} className="text-xs border-border text-muted-foreground hover:text-foreground">
                      <HiOutlineArrowPath className="w-3.5 h-3.5 mr-1.5" /> Reset to Defaults
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </ErrorBoundary>
  )
}
