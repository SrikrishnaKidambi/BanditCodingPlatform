import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const STORAGE_KEY = 'codecompass_groq_key'
const MODEL       = 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `You are an expert DSA (Data Structures & Algorithms) tutor for Code Compass, an adaptive coding practice platform.

Help users with:
- Understanding DSA concepts: Arrays, Binary Search, Trees, Graphs, Dynamic Programming
- Problem-solving approaches, algorithm design, and pseudocode
- Time and space complexity analysis (Big-O)
- Debugging logic and spotting edge cases
- Providing hints without giving away complete solutions
- Explaining WHY one approach is better than another

Be concise, encouraging, and use code examples when helpful. Format code with triple backticks.
Never give full solutions directly — guide the user to discover them.`

// ---------- sub-components ----------

function RobotIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <rect x="5"   y="7.5" width="14" height="10"  rx="2.5" />
      <path d="M12 3.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="12" cy="2.5" r="1.5" />
      <circle cx="9"    cy="12.5" r="1.8"  fill="white" fillOpacity="0.92" />
      <circle cx="15"   cy="12.5" r="1.8"  fill="white" fillOpacity="0.92" />
      <circle cx="9.4"  cy="12.5" r="0.85" fill="#818cf8" />
      <circle cx="15.4" cy="12.5" r="0.85" fill="#818cf8" />
      <rect x="8.5" y="15" width="7" height="1.5" rx="0.75" fill="white" fillOpacity="0.7" />
      <rect x="1.5" y="10.5" width="3.5" height="4" rx="1" fillOpacity="0.7" />
      <rect x="19"  y="10.5" width="3.5" height="4" rx="1" fillOpacity="0.7" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9z"/>
    </svg>
  )
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center py-0.5">
      {[0, 1, 2].map(i => (
        <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  )
}

function ApiKeyModal({ onSave, error }) {
  const [val, setVal] = useState('')

  return (
    <div className="absolute inset-0 rounded-2xl z-20 flex flex-col items-center justify-center p-6"
      style={{ background: 'rgba(4,6,12,0.95)', backdropFilter: 'blur(8px)' }}>

      <div className="w-14 h-14 rounded-full bg-indigo-600/30 flex items-center justify-center mb-3">
        <RobotIcon size={30} />
      </div>
      <h3 className="text-white font-semibold text-base mb-1">Connect to Groq AI</h3>
      <p className="text-white/45 text-xs text-center mb-5 leading-relaxed">
        Enter your free Groq API key to unlock the DSA tutor.<br/>
        It's saved only in your browser — never sent anywhere else.
      </p>

      <div className="w-full space-y-2.5">
        <input
          type="password"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && val.trim() && onSave(val.trim())}
          placeholder="gsk_xxxxxxxxxxxxxxxxxxxx"
          autoFocus
          className="w-full border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          style={{
            background: '#1e293b',
            WebkitTextFillColor: 'white',
            WebkitBoxShadow: '0 0 0px 1000px #1e293b inset',
          }}
        />
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button
          onClick={() => val.trim() && onSave(val.trim())}
          disabled={!val.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
        >
          Save Key &amp; Start Chatting
        </button>
      </div>

      {/* Setup instructions */}
      <div className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 space-y-1.5">
        <p className="text-white/60 text-xs font-semibold mb-2">How to get your free Groq key (30 seconds):</p>
        <p className="text-white/40 text-xs">
          1. Visit{' '}
          <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer"
            className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300">
            console.groq.com/keys
          </a>
        </p>
        <p className="text-white/40 text-xs">2. Sign up or log in (no credit card needed)</p>
        <p className="text-white/40 text-xs">3. Click <span className="text-white/65">"Create API Key"</span></p>
        <p className="text-white/40 text-xs">4. Copy the key and paste it above</p>
      </div>
    </div>
  )
}

// ---------- main component ----------

export default function ChatBot() {
  const { user }                    = useAuth()
  const [open, setOpen]             = useState(false)
  const [messages, setMessages]     = useState([])
  const [input, setInput]           = useState('')
  const [streaming, setStreaming]   = useState(false)
  const [showKey, setShowKey]       = useState(false)
  const [keyError, setKeyError]     = useState('')
  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)
  const textaRef   = useRef(null)

  // auto-scroll on new tokens
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // on open: check key, show welcome if first time
  useEffect(() => {
    if (!open) return
    const key = localStorage.getItem(STORAGE_KEY)
    if (!key) { setShowKey(true); return }
    setShowKey(false)
    if (messages.length === 0) {
      const firstName = user?.name?.split(' ')[0] ?? ''
      setMessages([{
        role:    'assistant',
        content: `Hi${firstName ? ` ${firstName}` : ''}! I'm your DSA tutor. Ask me anything — a concept, a problem you're stuck on, or why an algorithm works the way it does.`,
      }])
    }
    setTimeout(() => textaRef.current?.focus(), 120)
  }, [open])

  function handleSaveKey(k) {
    localStorage.setItem(STORAGE_KEY, k)
    setShowKey(false)
    setKeyError('')
    if (messages.length === 0) {
      const firstName = user?.name?.split(' ')[0] ?? ''
      setMessages([{
        role:    'assistant',
        content: `Hi${firstName ? ` ${firstName}` : ''}! I'm your DSA tutor. Ask me anything — a concept, a problem you're stuck on, or why an algorithm works the way it does.`,
      }])
    }
    setTimeout(() => textaRef.current?.focus(), 120)
  }

  async function send() {
    const text = input.trim()
    if (!text || streaming) return
    const key = localStorage.getItem(STORAGE_KEY)
    if (!key) { setShowKey(true); return }

    const history = [...messages, { role: 'user', content: text }]
    setMessages([...history, { role: 'assistant', content: '' }])
    setInput('')
    setStreaming(true)

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          model:       MODEL,
          messages:    [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.slice(-14),              // last 14 messages for context
          ],
          stream:      true,
          max_tokens:  900,
          temperature: 0.65,
        }),
      })

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem(STORAGE_KEY)
          setKeyError('Invalid API key — please enter it again.')
          setMessages(history)
          setShowKey(true)
          return
        }
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.error?.message || `HTTP ${res.status}`)
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      outer: while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop()                       // keep incomplete trailing line
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') break outer
          try {
            const delta = JSON.parse(raw).choices?.[0]?.delta?.content ?? ''
            if (delta) {
              setMessages(prev => {
                const upd = [...prev]
                upd[upd.length - 1] = {
                  ...upd[upd.length - 1],
                  content: upd[upd.length - 1].content + delta,
                }
                return upd
              })
            }
          } catch { /* skip malformed chunk */ }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const upd = [...prev]
        upd[upd.length - 1] = {
          ...upd[upd.length - 1],
          content: `Sorry, something went wrong: ${err.message}`,
          error:   true,
        }
        return upd
      })
    } finally {
      setStreaming(false)
      setTimeout(() => textaRef.current?.focus(), 80)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3" ref={inputRef}>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{   opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-[370px] h-[530px] rounded-2xl border border-white/12 shadow-2xl overflow-hidden flex flex-col text-white"
            style={{ background: 'rgba(5,7,14,0.91)', backdropFilter: 'blur(24px)' }}
          >
            {/* API key overlay */}
            {showKey && <ApiKeyModal onSave={handleSaveKey} error={keyError} />}

            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/10 shrink-0">
              <div className="w-8 h-8 rounded-full bg-indigo-600/70 flex items-center justify-center">
                <RobotIcon size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white leading-none">Compass AI</p>
                <p className="text-[10px] text-white/30 mt-0.5">Groq · Llama 3.3 70B · free</p>
              </div>
              <div className="flex items-center gap-3">
                {messages.length > 1 && (
                  <button onClick={() => setMessages([])}
                    className="text-[11px] text-white/25 hover:text-white/55 transition-colors">
                    Clear
                  </button>
                )}
                <button
                  onClick={() => { localStorage.removeItem(STORAGE_KEY); setKeyError(''); setShowKey(true) }}
                  className="text-[11px] text-white/25 hover:text-white/55 transition-colors"
                  title="Change API key">
                  Key
                </button>
                <button onClick={() => setOpen(false)}
                  className="text-white/35 hover:text-white/75 transition-colors text-base leading-none ml-1">
                  ✕
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {messages.length === 0 && !showKey && (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-14 h-14 rounded-full bg-indigo-600/15 flex items-center justify-center mb-3">
                    <RobotIcon size={28} />
                  </div>
                  <p className="text-white/55 text-sm font-medium">Ask me anything about DSA</p>
                  <p className="text-white/25 text-xs mt-1">Arrays · Trees · Graphs · DP · Binary Search</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-indigo-700/50 flex items-center justify-center shrink-0 mt-1">
                      <RobotIcon size={13} />
                    </div>
                  )}
                  <div
                    className={`max-w-[84%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : msg.error
                          ? 'bg-red-950/60 text-red-300 border border-red-900/50 rounded-bl-none'
                          : 'bg-white/8 text-white/88 rounded-bl-none'
                    }`}
                    style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  >
                    {msg.content === '' && msg.role === 'assistant'
                      ? <TypingDots />
                      : msg.content}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-2.5 border-t border-white/10 shrink-0">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={textaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
                  }}
                  placeholder="Ask about a concept or problem…"
                  rows={1}
                  disabled={streaming || showKey}
                  className="flex-1 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none disabled:opacity-35 transition-opacity"
                  style={{
                    background: '#1e293b',
                    WebkitTextFillColor: 'white',
                    maxHeight: '88px',
                    overflowY: 'auto',
                  }}
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || streaming || showKey}
                  className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 flex items-center justify-center text-white transition-colors shrink-0 mb-0.5"
                >
                  <SendIcon />
                </button>
              </div>
              <p className="text-white/18 text-[10px] text-center mt-1.5">
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating robot button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.1, y: -4 }}
        whileTap={{ scale: 0.93 }}
        transition={{ type: 'spring', stiffness: 380, damping: 18 }}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-colors ${
          open ? 'bg-indigo-700' : 'bg-indigo-600'
        }`}
        style={{ boxShadow: '0 6px 28px rgba(99,102,241,0.50)' }}
        title="Ask Compass AI"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.svg key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}
                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </motion.svg>
            : <motion.div key="bot" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} transition={{ duration: 0.15 }}>
                <RobotIcon size={26} />
              </motion.div>
          }
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
