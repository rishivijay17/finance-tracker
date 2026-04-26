import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Trash2, Loader2 } from 'lucide-react'
import { sendChatMessage, getChatHistory, clearChatHistory } from '../api/client'
import toast from 'react-hot-toast'

const SUGGESTIONS = [
  'How much did I spend on food this month?',
  'What are my top 3 biggest expense categories?',
  'Am I on track to save money this month?',
  'Which transactions look unusual or suspicious?',
]

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    getChatHistory()
      .then((res) => setMessages(res.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: msg }])
    setLoading(true)

    try {
      const res = await sendChatMessage(msg)
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch (err) {
      const detail = err.response?.data?.detail ?? 'Something went wrong. Check your API key.'
      toast.error(detail, { duration: 6000 })
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ Error: ${detail}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    await clearChatHistory()
    setMessages([])
    toast.success('Chat cleared')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900">AI Finance Chat</h1>
          <p className="text-slate-400 text-xs mt-0.5">Ask anything about your finances in plain English</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-slate-400 hover:text-red-500 text-sm transition-colors"
          >
            <Trash2 size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 space-y-5 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
              <Bot size={28} className="text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Your Financial AI Assistant</h2>
            <p className="text-slate-500 text-sm mb-8 max-w-sm leading-relaxed">
              Ask me anything about your spending, budgets, or savings. I have access to all your
              transaction data.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md w-full">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left p-3 bg-white rounded-xl border border-slate-200 text-slate-600 text-xs leading-relaxed hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                m.role === 'user' ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              {m.role === 'user' ? (
                <User size={14} className="text-white" />
              ) : (
                <Bot size={14} className="text-slate-600" />
              )}
            </div>
            <div
              className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : 'bg-white text-slate-800 border border-slate-100 shadow-sm rounded-tl-sm'
              }`}
            >
              <p style={{ whiteSpace: 'pre-wrap' }}>{m.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-slate-600" />
            </div>
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 size={14} className="text-slate-400 animate-spin" />
              <span className="text-slate-400 text-sm">Thinking…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-slate-100 p-4 shrink-0">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Ask about your finances… (Enter to send)"
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50"
            disabled={loading}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
