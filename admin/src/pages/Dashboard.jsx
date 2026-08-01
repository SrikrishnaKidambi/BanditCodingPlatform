import { useState, useEffect, useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { questionsAPI, topicsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

// ─── Utility ──────────────────────────────────────────────────────────────────

function Toast({ toast }) {
  if (!toast.show) return null
  const cls = toast.type === 'success'
    ? 'bg-green-50 border-green-300 text-green-700'
    : 'bg-red-50 border-red-300 text-red-700'
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium shadow-lg ${cls}`}>
      {toast.type === 'success'
        ? <span className="text-green-500">✓</span>
        : <span className="text-red-500">✕</span>}
      {toast.message}
    </div>
  )
}

function Badge({ label, color }) {
  const colors = {
    Easy:   'bg-green-100 text-green-700',
    Medium: 'bg-amber-100 text-amber-700',
    Hard:   'bg-red-100 text-red-700',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[label] || 'bg-slate-100 text-slate-600'}`}>
      {label}
    </span>
  )
}

function TopicBadge({ label }) {
  const hues = {
    Arrays: 'bg-blue-100 text-blue-700',
    BinarySearch: 'bg-purple-100 text-purple-700',
    Trees: 'bg-teal-100 text-teal-700',
    Graphs: 'bg-orange-100 text-orange-700',
    DP: 'bg-rose-100 text-rose-700',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${hues[label] || 'bg-slate-100 text-slate-600'}`}>
      {label}
    </span>
  )
}

function StatPill({ label, value, color }) {
  const c = {
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    green:  'bg-green-50 border-green-200 text-green-700',
    amber:  'bg-amber-50 border-amber-200 text-amber-700',
    slate:  'bg-slate-50 border-slate-200 text-slate-600',
  }
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium ${c[color]}`}>
      <span className="font-bold">{value}</span>
      <span className="font-normal text-xs opacity-80">{label}</span>
    </div>
  )
}

// ─── Excel parser ──────────────────────────────────────────────────────────────

function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const wb   = XLSX.read(e.target.result, { type: 'binary' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
        // Accept both snake_case and Title Case headers
        const normalised = rows.map(row => ({
          problem_id:             row.problem_id             || row['Problem ID']              || '',
          title:                  row.title                  || row['Title']                   || '',
          topic:                  row.topic                  || row['Topic']                   || '',
          difficulty:             row.difficulty             || row['Difficulty']              || '',
          tags:                   row.tags                   || row['Tags']                    || '',
          platform:               row.platform               || row['Platform']                || '',
          url:                    row.url                    || row['URL']                     || '',
          estimated_solving_time: row.estimated_solving_time || row['Estimated Solving Time']  || 20,
        }))
        resolve(normalised)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsBinaryString(file)
  })
}

// ─── Questions tab ─────────────────────────────────────────────────────────────

function QuestionsSection({ questions, onDelete, loading }) {
  const [search,      setSearch]      = useState('')
  const [filterTopic, setFilterTopic] = useState('')
  const [filterDiff,  setFilterDiff]  = useState('')
  const [confirmId,   setConfirmId]   = useState(null)

  const topics = [...new Set(questions.map(q => q.topic))].sort()

  const filtered = questions.filter(q => {
    const s = search.toLowerCase()
    return (
      (!s || q.title.toLowerCase().includes(s) || q.problem_id.toLowerCase().includes(s) || q.platform.toLowerCase().includes(s)) &&
      (!filterTopic || q.topic === filterTopic) &&
      (!filterDiff  || q.difficulty === filterDiff)
    )
  })

  const easyCount   = questions.filter(q => q.difficulty === 'Easy').length
  const mediumCount = questions.filter(q => q.difficulty === 'Medium').length
  const hardCount   = questions.filter(q => q.difficulty === 'Hard').length

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <StatPill label="total" value={questions.length} color="indigo" />
        <StatPill label="Easy"  value={easyCount}         color="green"  />
        <StatPill label="Medium" value={mediumCount}      color="amber"  />
        <StatPill label="Hard" value={hardCount}          color="slate"  />
        {topics.map(t => (
          <StatPill key={t} label={t} value={questions.filter(q => q.topic === t).length} color="slate" />
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by title, ID or platform…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-52 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <select
          value={filterTopic}
          onChange={e => setFilterTopic(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        >
          <option value="">All Topics</option>
          {topics.map(t => <option key={t}>{t}</option>)}
        </select>
        <select
          value={filterDiff}
          onChange={e => setFilterDiff(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        >
          <option value="">All Difficulties</option>
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading questions…</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['ID', 'Title', 'Topic', 'Difficulty', 'Platform', 'Time', 'Tags', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(q => (
                <tr key={q.problem_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{q.problem_id}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 max-w-xs">
                    <a href={q.url} target="_blank" rel="noopener noreferrer"
                      className="hover:text-indigo-600 hover:underline">
                      {q.title}
                    </a>
                  </td>
                  <td className="px-4 py-3"><TopicBadge label={q.topic} /></td>
                  <td className="px-4 py-3"><Badge label={q.difficulty} /></td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{q.platform}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{q.estimated_solving_time} min</td>
                  <td className="px-4 py-3 text-slate-400 text-xs max-w-[140px] truncate">
                    {Array.isArray(q.tags) ? q.tags.join(', ') : q.tags}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {confirmId === q.problem_id ? (
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-xs text-slate-500 mr-1">Sure?</span>
                        <button
                          onClick={() => { onDelete(q.problem_id); setConfirmId(null) }}
                          className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-400 font-medium"
                        >Yes</button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                        >No</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(q.problem_id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center py-8 text-slate-400 text-sm">
              {questions.length === 0 ? 'No questions yet. Add some from the Add Questions tab.' : 'No questions match your filters.'}
            </p>
          )}
          {filtered.length > 0 && (
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
              Showing {filtered.length} of {questions.length} questions
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Manual form ──────────────────────────────────────────────────────────────

const KNOWN_TOPICS     = ['Arrays', 'BinarySearch', 'Trees', 'Graphs', 'DP']
const KNOWN_PLATFORMS  = ['LeetCode', 'GeeksForGeeks', 'HackerRank', 'CodeForces', 'InterviewBit']
const DIFFICULTIES     = ['Easy', 'Medium', 'Hard']
const EMPTY_FORM = { problem_id: '', title: '', topic: '', difficulty: 'Easy', tags: '', platform: 'LeetCode', url: '', estimated_solving_time: 20 }

function ManualForm({ onAdd }) {
  const [form,    setForm]    = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title || !form.topic || !form.difficulty || !form.platform || !form.url) {
      setError('Title, Topic, Difficulty, Platform, and URL are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const q = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        estimated_solving_time: Number(form.estimated_solving_time) || 20,
      }
      if (!q.problem_id) delete q.problem_id
      await onAdd(q)
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add question')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white'
  const labelCls = 'block text-xs font-medium text-slate-600 mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div className="md:col-span-2">
          <label className={labelCls}>Title <span className="text-red-400">*</span></label>
          <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="e.g. Two Sum" className={inputCls} />
        </div>

        {/* Topic */}
        <div>
          <label className={labelCls}>Topic <span className="text-red-400">*</span></label>
          <select value={form.topic} onChange={e => set('topic', e.target.value)} className={inputCls}>
            <option value="">Select topic…</option>
            {KNOWN_TOPICS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {/* Difficulty */}
        <div>
          <label className={labelCls}>Difficulty <span className="text-red-400">*</span></label>
          <div className="flex gap-2">
            {DIFFICULTIES.map(d => (
              <button key={d} type="button" onClick={() => set('difficulty', d)}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  form.difficulty === d
                    ? d === 'Easy'
                      ? 'bg-green-50 border-green-400 text-green-700'
                      : d === 'Medium'
                        ? 'bg-amber-50 border-amber-400 text-amber-700'
                        : 'bg-red-50 border-red-400 text-red-700'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Platform */}
        <div>
          <label className={labelCls}>Platform <span className="text-red-400">*</span></label>
          <select value={form.platform} onChange={e => set('platform', e.target.value)} className={inputCls}>
            {KNOWN_PLATFORMS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        {/* Solving time */}
        <div>
          <label className={labelCls}>Est. Solving Time (minutes)</label>
          <input type="number" min={5} max={120} value={form.estimated_solving_time}
            onChange={e => set('estimated_solving_time', e.target.value)} className={inputCls} />
        </div>

        {/* URL */}
        <div className="md:col-span-2">
          <label className={labelCls}>URL <span className="text-red-400">*</span></label>
          <input type="url" value={form.url} onChange={e => set('url', e.target.value)}
            placeholder="https://leetcode.com/problems/two-sum/" className={inputCls} />
        </div>

        {/* Tags */}
        <div className="md:col-span-2">
          <label className={labelCls}>Tags <span className="text-slate-400 font-normal">(comma-separated)</span></label>
          <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)}
            placeholder="array, hash-map, two-pointer" className={inputCls} />
        </div>

        {/* Problem ID (optional) */}
        <div>
          <label className={labelCls}>
            Problem ID <span className="text-slate-400 font-normal">(optional — auto-generated if blank)</span>
          </label>
          <input type="text" value={form.problem_id} onChange={e => set('problem_id', e.target.value)}
            placeholder="e.g. ARR-E-010" className={inputCls} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={loading}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition-colors">
          {loading ? 'Adding…' : 'Add Question →'}
        </button>
      </div>
    </form>
  )
}

// ─── Excel upload ──────────────────────────────────────────────────────────────

function ExcelUpload({ onBulkAdd }) {
  const [rows,      setRows]      = useState([])
  const [fileName,  setFileName]  = useState('')
  const [dragging,  setDragging]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState(null)
  const [error,     setError]     = useState('')
  const fileRef = useRef()

  async function handleFile(file) {
    if (!file) return
    setError('')
    setResult(null)
    setRows([])
    setFileName(file.name)
    try {
      const parsed = await parseExcelFile(file)
      setRows(parsed)
    } catch {
      setError('Could not parse file. Make sure it is a valid .xlsx or .csv file.')
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  async function handleImport() {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await onBulkAdd(rows)
      setResult(res)
      setRows([])
      setFileName('')
    } catch (err) {
      setError(err.response?.data?.error || 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Column format guide */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Excel Column Format</h4>
        <p className="text-xs text-slate-500 mb-3">Row 1 must be the header row. Column names can be snake_case or Title Case.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-white border border-slate-200 rounded">
                {['Column', 'Header Name', 'Required', 'Example'].map(h => (
                  <th key={h} className="text-left px-3 py-2 font-semibold text-slate-600 border-b border-slate-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ['A', 'problem_id', 'No (auto-gen)', 'ARR-E-010'],
                ['B', 'title',      'Yes',           'Two Sum'],
                ['C', 'topic',      'Yes',           'Arrays'],
                ['D', 'difficulty', 'Yes',           'Easy'],
                ['E', 'tags',       'No',            'array, hash-map'],
                ['F', 'platform',   'Yes',           'LeetCode'],
                ['G', 'url',        'Yes',           'https://leetcode.com/…'],
                ['H', 'estimated_solving_time', 'No (default 20)', '15'],
              ].map(([col, name, req, ex]) => (
                <tr key={col} className="bg-white">
                  <td className="px-3 py-2 font-mono font-bold text-indigo-600">{col}</td>
                  <td className="px-3 py-2 font-mono text-slate-700">{name}</td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${req === 'Yes' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                      {req}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">{ex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Valid topics: <span className="font-medium">All the topics present in the topics section</span> · Valid difficulties: <span className="font-medium">Easy, Medium, Hard</span>
        </p>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current.click()}
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          dragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
        }`}
      >
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
          onChange={e => handleFile(e.target.files[0])} />
        <div className="text-4xl mb-3">📊</div>
        <p className="text-sm font-medium text-slate-600">
          {fileName ? `Selected: ${fileName}` : 'Drop your .xlsx / .csv file here'}
        </p>
        <p className="text-xs text-slate-400 mt-1">or click to browse</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {/* Preview */}
      {rows.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <span className="text-sm font-semibold text-slate-700">Preview — {rows.length} rows parsed</span>
            <span className="text-xs text-slate-400">Showing first 5</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Title', 'Topic', 'Difficulty', 'Platform', 'URL', 'Tags'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i} className={!r.title || !r.topic || !r.difficulty || !r.platform || !r.url ? 'bg-red-50' : ''}>
                    <td className="px-3 py-2 max-w-[160px] truncate text-slate-700">{r.title || <span className="text-red-400">missing</span>}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.topic ? <TopicBadge label={r.topic} /> : <span className="text-red-400">missing</span>}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.difficulty ? <Badge label={r.difficulty} /> : <span className="text-red-400">missing</span>}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{r.platform || <span className="text-red-400">missing</span>}</td>
                    <td className="px-3 py-2 max-w-[180px] truncate text-indigo-500">{r.url}</td>
                    <td className="px-3 py-2 text-slate-400 max-w-[120px] truncate">{r.tags}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 5 && (
            <p className="text-xs text-slate-400 px-4 py-2 border-t border-slate-100">
              …and {rows.length - 5} more rows
            </p>
          )}
          <div className="flex items-center gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50">
            <button onClick={() => { setRows([]); setFileName('') }}
              className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg border border-slate-200 hover:bg-white transition-colors">
              Clear
            </button>
            <button onClick={handleImport} disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-60 transition-colors">
              {loading ? 'Importing…' : `Import ${rows.length} questions →`}
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-green-500 text-lg">✓</span>
            <span className="font-semibold text-slate-800">Import complete</span>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600 font-medium">{result.added} added</span>
            {result.skipped > 0 && (
              <span className="text-amber-600 font-medium">{result.skipped} skipped</span>
            )}
          </div>
          {result.skippedItems?.length > 0 && (
            <details className="mt-3">
              <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">View skipped rows</summary>
              <ul className="mt-2 space-y-1 text-xs text-red-600">
                {result.skippedItems.map((s, i) => (
                  <li key={i}>{s.row?.title || s.row?.problem_id || `Row ${i+1}`}: {s.reason}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Add Questions tab ─────────────────────────────────────────────────────────

function AddQuestionsSection({ onAdd, onBulkAdd }) {
  const [mode, setMode] = useState('manual')
  return (
    <div>
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit mb-6">
        {[['manual', 'Manual Entry'], ['excel', 'Excel Import']].map(([v, label]) => (
          <button key={v} onClick={() => setMode(v)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        {mode === 'manual'
          ? <ManualForm onAdd={onAdd} />
          : <ExcelUpload onBulkAdd={onBulkAdd} />}
      </div>
    </div>
  )
}

// ─── Topics tab ───────────────────────────────────────────────────────────────

function TopicsSection({ topicData, onAddTopic }) {
  const [name,    setName]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const { topics = [], counts = {} } = topicData

  async function handleAdd(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      await onAddTopic(name.trim())
      setName('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add topic')
    } finally {
      setLoading(false)
    }
  }

  const hues = ['blue', 'purple', 'teal', 'orange', 'rose', 'indigo', 'green', 'amber']
  const bgCls = i => ({
    blue:   'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    teal:   'bg-teal-50 border-teal-200',
    orange: 'bg-orange-50 border-orange-200',
    rose:   'bg-rose-50 border-rose-200',
    indigo: 'bg-indigo-50 border-indigo-200',
    green:  'bg-green-50 border-green-200',
    amber:  'bg-amber-50 border-amber-200',
  }[hues[i % hues.length]])

  const textCls = i => ({
    blue:   'text-blue-700',
    purple: 'text-purple-700',
    teal:   'text-teal-700',
    orange: 'text-orange-700',
    rose:   'text-rose-700',
    indigo: 'text-indigo-700',
    green:  'text-green-700',
    amber:  'text-amber-700',
  }[hues[i % hues.length]])

  return (
    <div className="space-y-6">
      {/* Current topics */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Active Topics ({topics.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {topics.map((t, i) => (
            <div key={t} className={`rounded-xl border p-4 ${bgCls(i)}`}>
              <div className={`text-base font-bold mb-1 ${textCls(i)}`}>{t}</div>
              <div className="text-xs text-slate-500">
                {counts[t] || 0} question{counts[t] !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add topic */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Add New Topic</h3>
        <p className="text-xs text-slate-500 mb-4">
          Adding a topic here updates the shared topic registry in <code className="bg-slate-100 px-1 rounded">data/topics.json</code>.
          The backend will notify the recommendation service which will reload topics automatically — no manual Python restart is required.
        </p>
        <form onSubmit={handleAdd} className="flex gap-2 max-w-sm">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Backtracking"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button type="submit" disabled={loading || !name.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition-colors whitespace-nowrap">
            {loading ? 'Adding…' : '+ Add'}
          </button>
        </form>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

        {/* Next steps reminder */}
        <div className="mt-5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <p className="text-xs font-semibold text-amber-700 mb-1">After adding a topic, do these steps:</p>
          <ol className="text-xs text-amber-600 space-y-0.5 list-decimal list-inside">
            <li>The backend will ask the recommendation service to reload topics automatically</li>
            <li>Add questions for this topic in the Questions tab</li>
            <li>You can use the topic immediately in recommendations and analytics</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar nav ──────────────────────────────────────────────────────────────

function Sidebar({ tab, setTab, totalQuestions, totalTopics, admin, onLogout }) {
  const navItems = [
    {
      id: 'questions', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ), label: 'Questions', badge: totalQuestions,
    },
    {
      id: 'add', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      ), label: 'Add Questions',
    },
    {
      id: 'topics', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ), label: 'Topics', badge: totalTopics,
    },
  ]

  return (
    <aside className="w-60 bg-slate-900 flex flex-col shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <svg className="w-7 h-7 text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
          </svg>
          <div>
            <div className="text-sm font-bold text-white leading-tight">Code Compass</div>
            <div className="text-xs text-slate-500 leading-tight">Admin Portal</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
              tab === item.id
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}>
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                tab === item.id ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}>{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="text-xs text-slate-500 truncate mb-2">{admin?.email}</div>
        <button onClick={onLogout}
          className="w-full text-xs text-slate-400 hover:text-red-400 flex items-center gap-2 transition-colors py-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  )
}

// ─── Dashboard root ───────────────────────────────────────────────────────────

const TAB_TITLES = {
  questions: { title: 'Question Bank',  sub: 'Browse, search and manage all DSA questions' },
  add:       { title: 'Add Questions',  sub: 'Add manually or import from an Excel sheet' },
  topics:    { title: 'Topic Manager',  sub: 'View and expand the curriculum topics' },
}

export default function Dashboard() {
  const { admin, logout } = useAuth()
  const [tab,        setTab]        = useState('questions')
  const [questions,  setQuestions]  = useState([])
  const [topicData,  setTopicData]  = useState({ topics: [], counts: {} })
  const [qLoading,   setQLoading]   = useState(true)
  const [toast,      setToast]      = useState({ show: false, type: 'success', message: '' })

  function showToast(type, message) {
    setToast({ show: true, type, message })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3500)
  }

  const loadQuestions = useCallback(async () => {
    setQLoading(true)
    try {
      const res = await questionsAPI.list()
      setQuestions(res.data)
    } catch {
      showToast('error', 'Failed to load questions')
    } finally {
      setQLoading(false)
    }
  }, [])

  const loadTopics = useCallback(async () => {
    try {
      const res = await topicsAPI.list()
      setTopicData(res.data)
    } catch {
      showToast('error', 'Failed to load topics')
    }
  }, [])

  useEffect(() => { loadQuestions() }, [loadQuestions])
  useEffect(() => { loadTopics() }, [loadTopics])

  async function handleDelete(id) {
    try {
      await questionsAPI.remove(id)
      setQuestions(qs => qs.filter(q => q.problem_id !== id))
      showToast('success', 'Question deleted')
    } catch {
      showToast('error', 'Failed to delete question')
    }
  }

  async function handleAdd(q) {
    const res = await questionsAPI.add(q)
    setQuestions(qs => [...qs, res.data])
    showToast('success', `"${res.data.title}" added successfully`)
  }

  async function handleBulkAdd(rows) {
    const res = await questionsAPI.bulk(rows)
    await loadQuestions()
    showToast('success', `${res.data.added} questions imported`)
    return res.data
  }

  async function handleAddTopic(name) {
    const res = await topicsAPI.add(name)
    setTopicData(prev => ({ ...prev, topics: res.data.topics }))
    showToast('success', `Topic "${name}" added`)
  }

  const { title, sub } = TAB_TITLES[tab]

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Toast toast={toast} />
      <Sidebar
        tab={tab} setTab={setTab}
        totalQuestions={questions.length}
        totalTopics={topicData.topics.length}
        admin={admin} onLogout={logout}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
          <h1 className="text-lg font-bold text-slate-800">{title}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {tab === 'questions' && (
            <QuestionsSection questions={questions} onDelete={handleDelete} loading={qLoading} />
          )}
          {tab === 'add' && (
            <AddQuestionsSection onAdd={handleAdd} onBulkAdd={handleBulkAdd} />
          )}
          {tab === 'topics' && (
            <TopicsSection topicData={topicData} onAddTopic={handleAddTopic} />
          )}
        </main>
      </div>
    </div>
  )
}
