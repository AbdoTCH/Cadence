import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Archive, Bell, BookOpenText, CalendarDays, Check, CheckCircle2, Clock3, LayoutDashboard, Pencil, Plus, RotateCcw, Settings2, Trash2, X } from 'lucide-react'
import type { RouteObject } from 'react-router-dom'
import { Link, Navigate, useParams } from 'react-router-dom'

import { db } from './db/db'
import type { Block, BlockKind, Notification, Topic, TopicColor } from './db/schema'
import { localeFor, translate } from './lib/i18n'
import { createId } from './lib/id'
import { summarizePlanner } from './lib/planner'
import { areReviewRemindersEnabled } from './lib/reviewPreferences'
import { useLanguageText } from './lib/useLanguageText'
import { useUIStore, type UILanguage } from './stores/uiStore'

const topicColors: TopicColor[] = ['slate', 'olive', 'clay', 'indigo', 'amber', 'teal']
const topicColorLabel: Record<TopicColor, 'Slate' | 'Olive' | 'Clay' | 'Indigo' | 'Amber' | 'Teal'> = {
  slate: 'Slate',
  olive: 'Olive',
  clay: 'Clay',
  indigo: 'Indigo',
  amber: 'Amber',
  teal: 'Teal',
}
function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string
  message: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}) {
  const { t } = useLanguageText()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div className="confirm-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-message">{message}</p>
        <div className="dialog-actions">
          <button type="button" className="mini-button" autoFocus onClick={onCancel}>{t('Cancel')}</button>
          <button type="button" className="primary-button delete-confirm" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  )
}

function formatRelativeTime(ms: number | null, language: UILanguage = 'en'): string {
  if (ms === null) return translate(language, 'Not scheduled')
  return new Date(ms).toLocaleString(localeFor(language), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function formatClockLabel(ms: number, language: UILanguage = 'en'): string {
  return new Date(ms).toLocaleTimeString(localeFor(language), { hour: 'numeric', minute: '2-digit' })
}

function formatUpcomingStart(timestamp: number, language: UILanguage = 'en', now = Date.now()): string {
  const eventDate = new Date(timestamp)
  const today = new Date(now)
  const tomorrow = new Date(now)
  today.setHours(0, 0, 0, 0)
  tomorrow.setHours(0, 0, 0, 0)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const eventDay = new Date(eventDate)
  eventDay.setHours(0, 0, 0, 0)
  const dayLabel = eventDay.getTime() === today.getTime()
    ? translate(language, 'Today')
    : eventDay.getTime() === tomorrow.getTime()
      ? translate(language, 'Tomorrow')
      : eventDate.toLocaleDateString(localeFor(language), { weekday: 'short', month: 'short', day: 'numeric' })

  return `${dayLabel} · ${formatClockLabel(timestamp, language)}`
}

function formatBlockRange(block: Pick<Block, 'start' | 'end'>, language: UILanguage = 'en'): string {
  return `${formatClockLabel(block.start, language)}–${formatClockLabel(block.end, language)}`
}

function toDateTimeLocal(timestamp: number): string {
  const date = new Date(timestamp - new Date(timestamp).getTimezoneOffset() * 60000)
  return date.toISOString().slice(0, 16)
}

async function saveTopic(name: string, color: TopicColor, reviewIntervalDays: number): Promise<void> {
  const trimmed = name.trim()
  if (!trimmed) return

  await db.topics.put({
    id: createId(),
    name: trimmed,
    color,
    reviewIntervalDays,
    nextReviewAt: Date.now() + reviewIntervalDays * 24 * 60 * 60 * 1000,
    archivedAt: null,
    createdAt: Date.now(),
  })
}

async function saveBlock(input: {
  topicId: string
  kind: BlockKind
  title: string
  start: number
  end: number
  language: UILanguage
}): Promise<void> {
  const title = input.title.trim() || 'Study block'
  const durationMinutes = Math.max(1, Math.round((input.end - input.start) / 60000))

  await db.blocks.put({
    id: createId(),
    topicId: input.topicId,
    kind: input.kind,
    title,
    start: input.start,
    end: input.end,
    status: 'planned',
    actualMinutes: durationMinutes,
    reviewedAt: null,
    createdAt: Date.now(),
  })

  const settings = input.kind === 'review' ? await db.settings.get('singleton') : undefined
  if (input.kind !== 'review' || areReviewRemindersEnabled(settings)) {
    await db.notifications.put({
      id: createId(),
      type: input.kind === 'review' ? 'review' : input.kind === 'rest' ? 'rest' : 'study',
      title: input.kind === 'review' ? translate(input.language, 'Review scheduled') : input.kind === 'rest' ? translate(input.language, 'Rest block added') : translate(input.language, 'Study block added'),
      body: `${title} ${translate(input.language, 'is scheduled for')} ${formatBlockRange({ start: input.start, end: input.end }, input.language)}.`,
      href: '/timetable',
      readAt: null,
      createdAt: Date.now(),
    })
  }
}

async function createReviewNotification(topic: Topic, nextReviewAt: number, language: UILanguage): Promise<void> {
  const settings = await db.settings.get('singleton')
  if (!areReviewRemindersEnabled(settings)) return

  await db.notifications.put({
    id: createId(),
    type: 'review',
    title: `${topic.name} ${translate(language, 'reviewed')}`,
    body: `${translate(language, 'Your next review is scheduled for')} ${formatRelativeTime(nextReviewAt, language)}.`,
    href: `/topics/${topic.id}`,
    readAt: null,
    createdAt: Date.now(),
  })
}

function getTopicColorClass(color: TopicColor): string {
  return `topic-dot ${color}`
}

export function DashboardPage() {
  const { language, t } = useLanguageText()
  const allTopics = useLiveQuery(() => db.topics.orderBy('createdAt').toArray(), []) ?? []
  const topics = allTopics.filter((topic) => topic.archivedAt === null)
  const blocks = useLiveQuery(() => db.blocks.orderBy('start').toArray(), []) ?? []
  const summary = useMemo(() => summarizePlanner(topics, blocks), [topics, blocks])
  const dueTopics = topics
    .filter((topic) => topic.nextReviewAt !== null && topic.nextReviewAt <= Date.now())
    .sort((a, b) => (a.nextReviewAt ?? 0) - (b.nextReviewAt ?? 0))
  const todayStudyCount = summary.entries.filter((block) => block.kind === 'study').length

  return (
    <section className="page-panel">
      <div className="page-header">
        <div>
          <p className="eyebrow">{new Date().toLocaleDateString(localeFor(language), { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1>{t('Study rhythm')}</h1>
        </div>
        <Link to="/timetable" className="primary-button"><Plus size={16} /> {t('Plan a block')}</Link>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span>{t('Study planned')}</span>
          <strong>{summary.studyMinutesToday} {t('minutes')}</strong>
          <small>{todayStudyCount} {t('blocks today')}</small>
        </article>
        <article className="stat-card">
          <span>{t('Rest planned')}</span>
          <strong>{summary.breakMinutesToday} {t('minutes')}</strong>
          <small>{t('Break time today')}</small>
        </article>
        <article className="stat-card">
          <span>{t('Review')}</span>
          <strong>{summary.reviewDueCount} {t('due')}</strong>
          <small>{topics.length} {t('Topics tracked')}</small>
        </article>
      </div>

      <div className="dashboard-grid">
        <div className="list-panel">
          <div className="section-heading">
            <h2>{t('Next up')}</h2>
            <Link to="/timetable">{t('View timetable')}</Link>
          </div>
          {summary.nextUp.length === 0 ? (
            <div className="empty-state">
              <strong>{t('Your schedule is clear.')}</strong>
              <span>{t('Plan a study block or a break when you’re ready.')}</span>
              <Link to="/timetable" className="text-action">{t('Open timetable')}</Link>
            </div>
          ) : (
            <ul className="agenda-list">
              {summary.nextUp.map((block) => (
                <li key={block.id}>
                  <span>{formatUpcomingStart(block.start, language)}</span>
                  <strong>{block.title}</strong>
                  <em>{t(block.kind === 'study' ? 'Study' : block.kind === 'rest' ? 'Rest' : 'Review')}</em>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="list-panel">
          <div className="section-heading">
            <h2>{t('Reviews due')}</h2>
            <Link to="/topics">{t('All topics')}</Link>
          </div>
          {dueTopics.length === 0 ? (
            <div className="empty-state">
              <strong>{t('No reviews due.')}</strong>
              <span>{t('Your review queue is clear.')}</span>
            </div>
          ) : (
            <ul className="review-list">
              {dueTopics.slice(0, 4).map((topic) => (
                <li key={topic.id}>
                  <span className={getTopicColorClass(topic.color)} />
                  <Link to={`/topics/${topic.id}`}><strong>{topic.name}</strong><small>{t('Due')} {formatRelativeTime(topic.nextReviewAt, language)}</small></Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

export function TimetablePage() {
  const { language, t } = useLanguageText()
  const [form, setForm] = useState({
    topicId: '',
    kind: 'study' as BlockKind,
    title: '',
    start: '',
    end: '',
  })
  const [formError, setFormError] = useState('')
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [blockToRemove, setBlockToRemove] = useState<Block | null>(null)

  const allTopics = useLiveQuery(() => db.topics.orderBy('createdAt').toArray(), []) ?? []
  const topics = allTopics.filter((topic) => topic.archivedAt === null)
  const blocks = useLiveQuery(() => db.blocks.orderBy('start').toArray(), []) ?? []

  useEffect(() => {
    if (topics.length > 0 && !form.topicId) {
      setForm((current) => ({ ...current, topicId: topics[0].id }))
    }
  }, [topics, form.topicId])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    if (!form.topicId) {
      setFormError(t('Add a topic before scheduling a block.'))
      return
    }

    if (!form.start || !form.end) {
      setFormError(t('Choose both a start and end time.'))
      return
    }

    const start = new Date(form.start).getTime()
    const end = new Date(form.end).getTime()
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
      setFormError(t('End time must be later than start time.'))
      return
    }

    const title = form.title || (topics.find((topic) => topic.id === form.topicId)?.name ?? t('Study block'))
    if (editingBlockId) {
      const current = blocks.find((block) => block.id === editingBlockId)
      await db.blocks.update(editingBlockId, {
        topicId: form.topicId,
        kind: form.kind,
        title: title.trim() || 'Study block',
        start,
        end,
        ...(current?.status !== 'done' ? { actualMinutes: Math.max(1, Math.round((end - start) / 60000)) } : {}),
      })
      setEditingBlockId(null)
    } else {
      await saveBlock({ topicId: form.topicId, kind: form.kind, title, start, end, language })
    }

    setForm((current) => ({ ...current, title: '', start: '', end: '' }))
  }

  const beginEditingBlock = (block: Block) => {
    setEditingBlockId(block.id)
    setForm({
      topicId: block.topicId,
      kind: block.kind,
      title: block.title,
      start: toDateTimeLocal(block.start),
      end: toDateTimeLocal(block.end),
    })
    setFormError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEditingBlock = () => {
    setEditingBlockId(null)
    setForm((current) => ({ ...current, title: '', start: '', end: '' }))
    setFormError('')
  }

  const updateBlockStatus = async (blockId: string, status: Block['status']) => {
    await db.blocks.update(blockId, { status })
  }

  const removeBlock = async () => {
    if (!blockToRemove) return
    await db.blocks.delete(blockToRemove.id)
    if (editingBlockId === blockToRemove.id) cancelEditingBlock()
    setBlockToRemove(null)
  }

  return (
    <section className="page-panel">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t('Timetable')}</p>
          <h1>{t('Week plan')}</h1>
        </div>
      </div>

      <form className="composer" onSubmit={handleSubmit} noValidate>
        <label>
          <span>{t('Topic')}</span>
          <select value={form.topicId} onChange={(event) => setForm((current) => ({ ...current, topicId: event.target.value }))}>
            {topics.length === 0 && <option value="">{t('Add a topic first')}</option>}
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>{topic.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{t('Type')}</span>
          <select value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value as BlockKind }))}>
            <option value="study">{t('Study')}</option>
            <option value="review">{t('Review')}</option>
            <option value="rest">{t('Rest')}</option>
          </select>
        </label>
        <label>
          <span>{t('Title')}</span>
          <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder={t('Session title')} />
        </label>
        <label>
          <span>{t('Start')}</span>
          <input type="datetime-local" value={form.start} onChange={(event) => setForm((current) => ({ ...current, start: event.target.value }))} />
        </label>
        <label>
          <span>{t('End')}</span>
          <input type="datetime-local" min={form.start || undefined} value={form.end} onChange={(event) => setForm((current) => ({ ...current, end: event.target.value }))} />
        </label>
        <div className="composer-actions">
          <button type="submit" className="primary-button" disabled={topics.length === 0}>
            {editingBlockId ? <Check size={16} /> : <Plus size={16} />}
            {editingBlockId ? t('Save changes') : t('Add block')}
          </button>
          {editingBlockId && <button type="button" className="mini-button" onClick={cancelEditingBlock}><X size={15} /> {t('Cancel')}</button>}
        </div>
        {formError && <p className="form-error" role="alert">{formError}</p>}
      </form>

      <div className="timeline">
        {blocks.length === 0 ? (
          <div className="empty-state">{t('No blocks yet. Add one to build your study week.')}</div>
        ) : (
          blocks.map((block) => (
            <div key={block.id} className={`timeline-row ${block.kind}`}>
              <span>{formatClockLabel(block.start, language)}</span>
              <div>
                <strong>{block.title}</strong>
                <small>{allTopics.find((topic) => topic.id === block.topicId)?.name ?? 'No topic'}</small>
              </div>
              <div className="timeline-actions">
                <em>{formatClockLabel(block.end)}</em>
                <button type="button" className="mini-button" aria-label={`${t('Edit')}: ${block.title}`} title={t('Edit')} onClick={() => beginEditingBlock(block)}><Pencil size={14} /></button>
                <button type="button" className="mini-button danger-action" aria-label={`${t('Remove block action')}: ${block.title}`} title={t('Remove block')} onClick={() => setBlockToRemove(block)}><Trash2 size={14} /></button>
                <button type="button" className="mini-button" disabled={block.status === 'done'} onClick={() => void updateBlockStatus(block.id, 'done')}>
                  {block.status === 'done' ? t('Done') : t('Mark done')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {blockToRemove && (
        <ConfirmDialog
          title={t('Remove timetable block?')}
          message={`“${blockToRemove.title}” ${t('will be permanently removed.')}`}
          confirmLabel={t('Remove block')}
          onCancel={() => setBlockToRemove(null)}
          onConfirm={() => void removeBlock()}
        />
      )}
    </section>
  )
}

export function TopicsPage() {
  const { language, t } = useLanguageText()
  const allTopics = useLiveQuery(() => db.topics.orderBy('createdAt').toArray(), []) ?? []
  const topics = allTopics.filter((topic) => topic.archivedAt === null)
  const archivedTopics = allTopics.filter((topic) => topic.archivedAt !== null)
  const [form, setForm] = useState({ name: '', color: 'slate' as TopicColor, reviewIntervalDays: 3 })
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null)
  const [topicDraft, setTopicDraft] = useState({ name: '', color: 'slate' as TopicColor, reviewIntervalDays: 3 })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await saveTopic(form.name, form.color, form.reviewIntervalDays)
    setForm({ name: '', color: 'slate', reviewIntervalDays: 3 })
  }

  const handleReviewed = async (topic: Topic) => {
    const nextReviewAt = Date.now() + topic.reviewIntervalDays * 24 * 60 * 60 * 1000
    await db.topics.update(topic.id, { nextReviewAt })
    await createReviewNotification(topic, nextReviewAt, language)
  }

  const beginEditingTopic = (topic: Topic) => {
    setEditingTopicId(topic.id)
    setTopicDraft({ name: topic.name, color: topic.color, reviewIntervalDays: topic.reviewIntervalDays })
  }

  const saveTopicEdits = async (event: React.FormEvent<HTMLFormElement>, topic: Topic) => {
    event.preventDefault()
    const name = topicDraft.name.trim()
    if (!name) return

    const intervalChanged = topicDraft.reviewIntervalDays !== topic.reviewIntervalDays
    await db.topics.update(topic.id, {
      name,
      color: topicDraft.color,
      reviewIntervalDays: topicDraft.reviewIntervalDays,
      ...(intervalChanged ? { nextReviewAt: Date.now() + topicDraft.reviewIntervalDays * 24 * 60 * 60 * 1000 } : {}),
    })
    setEditingTopicId(null)
  }

  const archiveTopic = async (topic: Topic) => {
    await db.topics.update(topic.id, { archivedAt: Date.now() })
    setEditingTopicId((current) => current === topic.id ? null : current)
  }

  const restoreTopic = async (topic: Topic) => {
    await db.topics.update(topic.id, { archivedAt: null })
  }

  return (
    <section className="page-panel">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t('Topics')}</p>
          <h1>{t('All study topics')}</h1>
        </div>
      </div>

      <form className="composer" onSubmit={handleSubmit}>
        <label>
          <span>{t('Topic name')}</span>
          <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Biology" />
        </label>
        <label>
          <span>{t('Color')}</span>
          <select value={form.color} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value as TopicColor }))}>
            {topicColors.map((color) => (
              <option key={color} value={color}>{t(topicColorLabel[color])}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{t('Review interval')}</span>
          <input type="number" min={1} max={30} value={form.reviewIntervalDays} onChange={(event) => setForm((current) => ({ ...current, reviewIntervalDays: Number(event.target.value) || 1 }))} />
        </label>
        <button type="submit" className="primary-button"><Plus size={16} /> {t('Add topic')}</button>
      </form>

      <div className="topic-list">
        {topics.map((topic) => (
          <div key={topic.id} className="topic-card">
            <span className={getTopicColorClass(topic.color)} />
            <div>
              {editingTopicId === topic.id ? (
                <form className="topic-edit-form" onSubmit={(event) => void saveTopicEdits(event, topic)}>
                  <label>
                    <span>{t('Name')}</span>
                    <input autoFocus value={topicDraft.name} onChange={(event) => setTopicDraft((current) => ({ ...current, name: event.target.value }))} required />
                  </label>
                  <label>
                    <span>{t('Color')}</span>
                    <select value={topicDraft.color} onChange={(event) => setTopicDraft((current) => ({ ...current, color: event.target.value as TopicColor }))}>
                      {topicColors.map((color) => <option key={color} value={color}>{t(topicColorLabel[color])}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>{t('Review every (days)')}</span>
                    <input type="number" min={1} max={30} value={topicDraft.reviewIntervalDays} onChange={(event) => setTopicDraft((current) => ({ ...current, reviewIntervalDays: Number(event.target.value) || 1 }))} />
                  </label>
                  <div className="composer-actions">
                    <button type="submit" className="primary-button"><Check size={15} /> {t('Save changes')}</button>
                    <button type="button" className="mini-button" onClick={() => setEditingTopicId(null)}><X size={15} /> {t('Cancel')}</button>
                  </div>
                </form>
              ) : (
                <>
                  <Link to={`/topics/${topic.id}`}><strong>{topic.name}</strong></Link>
                  <small>{t('Next review:')} {formatRelativeTime(topic.nextReviewAt, language)}</small>
                  <div className="topic-actions">
                    <button type="button" className="mini-button" onClick={() => beginEditingTopic(topic)}><Pencil size={14} /> {t('Edit')}</button>
                    <button type="button" className="mini-button" onClick={() => void handleReviewed(topic)}>{t('Mark reviewed')}</button>
                    <button type="button" className="mini-button" aria-label={`${t('Archive')}: ${topic.name}`} title={t('Archive')} onClick={() => void archiveTopic(topic)}><Archive size={14} /> {t('Archive')}</button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {archivedTopics.length > 0 && (
        <div className="list-panel archived-topics">
          <div className="section-heading">
            <h2>{t('Archived topics')}</h2>
            <span>{archivedTopics.length}</span>
          </div>
          {archivedTopics.map((topic) => (
            <div key={topic.id} className="archived-topic-row">
              <span>{topic.name}</span>
              <button type="button" className="mini-button" onClick={() => void restoreTopic(topic)}><RotateCcw size={14} /> {t('Restore')}</button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export function TopicDetailPage() {
  const { language, t } = useLanguageText()
  const { id } = useParams()
  const topic = useLiveQuery(() => (id ? db.topics.get(id) : undefined), [id])
  const blocks =
    useLiveQuery<Block[]>(() => {
      if (!id) return []
      return db.blocks.where('topicId').equals(id).sortBy('start')
    }, [id]) ?? []

  if (!topic) {
    return (
      <section className="page-panel">
        <h1>{t('Topic not found')}</h1>
      </section>
    )
  }

  const handleReviewed = async () => {
    const nextReviewAt = Date.now() + topic.reviewIntervalDays * 24 * 60 * 60 * 1000
    await db.topics.update(topic.id, { nextReviewAt })
    await createReviewNotification(topic, nextReviewAt, language)
  }

  return (
    <section className="page-panel">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t('Topic')}</p>
          <h1>{topic.name}</h1>
        </div>
      </div>

      <div className="detail-card">
        <p>{t('Review interval')}: {topic.reviewIntervalDays} {t('days')}</p>
        <p>{t('Next review at')}: {formatRelativeTime(topic.nextReviewAt, language)}</p>
        <button type="button" className="primary-button" onClick={() => void handleReviewed()}>{t('Mark reviewed')}</button>
      </div>

      <div className="list-panel">
        <h2>{t('Recent blocks')}</h2>
        {blocks.length === 0 ? (
          <p>{t('No blocks for this topic yet.')}</p>
        ) : (
          <ul className="agenda-list">
            {blocks.map((block) => (
              <li key={block.id}>
                <span>{t(block.kind === 'study' ? 'Study' : block.kind === 'rest' ? 'Rest' : 'Review')}</span>
                <strong>{block.title}</strong>
                <em>{formatBlockRange(block, language)}</em>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export function NotificationsPage() {
  const { language, t } = useLanguageText()
  const notifications = useLiveQuery(() => db.notifications.orderBy('createdAt').reverse().toArray(), []) ?? []
  const [notificationToRemove, setNotificationToRemove] = useState<Notification | null>(null)

  const markOneRead = async (id: string) => {
    await db.notifications.update(id, { readAt: Date.now() })
  }

  const markAllRead = async () => {
    const unread = notifications.filter((item) => item.readAt === null)
    for (const item of unread) {
      await db.notifications.update(item.id, { readAt: Date.now() })
    }
  }

  const removeNotification = async () => {
    if (!notificationToRemove) return
    await db.notifications.delete(notificationToRemove.id)
    setNotificationToRemove(null)
  }

  return (
    <section className="page-panel">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t('Alerts')}</p>
          <h1>{t('Notifications')}</h1>
        </div>
        <button type="button" className="ghost-button" onClick={() => void markAllRead()}>{t('Mark all read')}</button>
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? <div className="empty-state">{t('You’re all caught up.')}</div> : notifications.map((item) => (
          <div key={item.id} className={`notification-item ${item.readAt ? 'muted' : ''}`}>
            {item.type === 'review' ? <Bell size={16} /> : item.type === 'rest' ? <Clock3 size={16} /> : <CalendarDays size={16} />}
            <div>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
              <small>{formatRelativeTime(item.createdAt, language)}</small>
            </div>
            <div className="notification-actions">
              {item.readAt === null ? <button type="button" className="mini-button" onClick={() => void markOneRead(item.id)}>{t('Read')}</button> : <CheckCircle2 size={16} />}
              <button type="button" className="mini-button danger-action" aria-label={`${t('Remove notification action')}: ${item.title}`} title={t('Remove notification')} onClick={() => setNotificationToRemove(item)}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
      {notificationToRemove && (
        <ConfirmDialog
          title={t('Remove notification?')}
          message={`“${notificationToRemove.title}” ${t('will be permanently removed.')}`}
          confirmLabel={t('Remove notification')}
          onCancel={() => setNotificationToRemove(null)}
          onConfirm={() => void removeNotification()}
        />
      )}
    </section>
  )
}

export function SettingsPage() {
  const { language, t } = useLanguageText()
  const setLanguage = useUIStore((state) => state.setLanguage)
  const settings = useLiveQuery(() => db.settings.get('singleton'), [])
  const [draft, setDraft] = useState({
    defaultStudyMinutes: 50,
    defaultBreakMinutes: 10,
    quietHoursStart: '21:00',
    quietHoursEnd: '07:00',
    reviewRemindersEnabled: true,
  })

  useEffect(() => {
    if (!settings) return
    setDraft({
      defaultStudyMinutes: settings.defaultStudyMinutes ?? 50,
      defaultBreakMinutes: settings.defaultBreakMinutes ?? 10,
      quietHoursStart: settings.quietHoursStart ?? '21:00',
      quietHoursEnd: settings.quietHoursEnd ?? '07:00',
      reviewRemindersEnabled: settings.reviewRemindersEnabled ?? true,
    })
  }, [settings])

  const saveSettings = async () => {
    await db.settings.put({
      ...settings,
      id: 'singleton',
      theme: settings?.theme ?? 'system',
      weekStartsOn: settings?.weekStartsOn ?? 1,
      defaultStudyMinutes: draft.defaultStudyMinutes,
      defaultBreakMinutes: draft.defaultBreakMinutes,
      quietHoursStart: draft.quietHoursStart,
      quietHoursEnd: draft.quietHoursEnd,
      reviewRemindersEnabled: draft.reviewRemindersEnabled,
      seededAt: settings?.seededAt ?? Date.now(),
    })
  }

  return (
    <section className="page-panel">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t('Settings')}</p>
          <h1>{t('Planner preferences')}</h1>
        </div>
      </div>

      <div className="settings-list">
        <label className="setting-row">
          <span>{t('Language')}</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value as UILanguage)}>
            <option value="en">{t('English')}</option>
            <option value="fr">{t('French')}</option>
            <option value="ar">{t('Arabic')}</option>
          </select>
        </label>
        <label className="setting-row">
          <span>{t('Study block length')}</span>
          <input type="number" min={15} step={5} value={draft.defaultStudyMinutes} onChange={(event) => setDraft((current) => ({ ...current, defaultStudyMinutes: Number(event.target.value) || 50 }))} />
        </label>
        <label className="setting-row">
          <span>{t('Break reminder')}</span>
          <input type="number" min={5} step={5} value={draft.defaultBreakMinutes} onChange={(event) => setDraft((current) => ({ ...current, defaultBreakMinutes: Number(event.target.value) || 10 }))} />
        </label>
        <label className="setting-row">
          <span>{t('Quiet hours start')}</span>
          <input type="time" value={draft.quietHoursStart} onChange={(event) => setDraft((current) => ({ ...current, quietHoursStart: event.target.value }))} />
        </label>
        <label className="setting-row">
          <span>{t('Quiet hours end')}</span>
          <input type="time" value={draft.quietHoursEnd} onChange={(event) => setDraft((current) => ({ ...current, quietHoursEnd: event.target.value }))} />
        </label>
        <label className="setting-row checkbox-row">
          <span>{t('Review reminders')}</span>
          <input type="checkbox" checked={draft.reviewRemindersEnabled} onChange={(event) => setDraft((current) => ({ ...current, reviewRemindersEnabled: event.target.checked }))} />
        </label>
      </div>

      <button type="button" className="primary-button" onClick={() => void saveSettings()}>{t('Save preferences')}</button>
    </section>
  )
}

export function NotFoundPage() {
  const { t } = useLanguageText()
  return (
    <section className="page-panel">
      <h1>{t('Page not found')}</h1>
      <p>{t('Return to the dashboard.')}</p>
    </section>
  )
}

export const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/timetable', label: 'Timetable', icon: CalendarDays },
  { to: '/topics', label: 'Topics', icon: BookOpenText },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings2 },
] as const

export const routes: RouteObject[] = [
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/timetable', element: <TimetablePage /> },
  { path: '/topics', element: <TopicsPage /> },
  { path: '/topics/:id', element: <TopicDetailPage /> },
  { path: '/notifications', element: <NotificationsPage /> },
  { path: '/settings', element: <SettingsPage /> },
  { path: '*', element: <NotFoundPage /> },
]
