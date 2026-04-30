import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Trash2, Zap, Sparkles } from 'lucide-react'
import { sendChatMessage, getChatHistory, clearChatHistory } from '../api/client'
import toast from 'react-hot-toast'

const SUGGESTIONS = [
  'How much did I spend on food this month?',
  'What are my top 3 biggest expense categories?',
  'Am I on track to save money this month?',
  'Which transactions look unusual or suspicious?',
]

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in-up" style={{ alignItems: 'flex-end' }}>
      <div
        style={{
          width: '30px',
          height: '30px',
          background: 'linear-gradient(135deg, #6C63FF, #4A44B3)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 0 12px rgba(108,99,255,0.4)',
        }}
      >
        <Bot size={13} color="white" />
      </div>
      <div
        style={{
          background: '#1A1A24',
          border: '1px solid #1E1E2E',
          borderRadius: '16px',
          borderBottomLeftRadius: '4px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
        }}
      >
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  )
}

function Message({ m }) {
  const isUser = m.role === 'user'
  return (
    <div
      className="flex gap-3"
      style={{
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        animation: 'fadeInUp 0.2s ease-out',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: isUser
            ? 'linear-gradient(135deg, #6C63FF, #4A44B3)'
            : '#1A1A24',
          border: isUser ? 'none' : '1px solid #1E1E2E',
          boxShadow: isUser ? '0 0 12px rgba(108,99,255,0.35)' : 'none',
        }}
      >
        {isUser
          ? <User size={12} color="white" />
          : <Bot size={12} color="#6B6B8A" />
        }
      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth: '72%',
          padding: '11px 15px',
          borderRadius: '16px',
          borderBottomRightRadius: isUser ? '4px' : '16px',
          borderBottomLeftRadius: isUser ? '16px' : '4px',
          background: isUser
            ? 'linear-gradient(135deg, #6C63FF, #4A44B3)'
            : '#1A1A24',
          border: isUser ? 'none' : '1px solid #1E1E2E',
          boxShadow: isUser
            ? '0 4px 16px rgba(108,99,255,0.3)'
            : '0 2px 12px rgba(0,0,0,0.3)',
          color: isUser ? '#fff' : '#E8E8F0',
          fontSize: '13px',
          lineHeight: 1.6,
          fontWeight: 400,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {m.content}
      </div>
    </div>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

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
        { role: 'assistant', content: `⚠️ ${detail}` },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleClear = async () => {
    await clearChatHistory()
    setMessages([])
    toast.success('Chat cleared')
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full page-enter" style={{ background: '#0A0A0F' }}>

      {/* Header */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{
          padding: '18px 28px',
          borderBottom: '1px solid #1E1E2E',
          background: '#0D0D18',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              width: '34px',
              height: '34px',
              background: 'linear-gradient(135deg, #6C63FF, #4A44B3)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(108,99,255,0.4)',
            }}
          >
            <Sparkles size={15} color="white" />
          </div>
          <div>
            <h1 style={{ color: '#E8E8F0', fontSize: '15px', fontWeight: 700, letterSpacing: '-0.2px' }}>
              AI Finance Assistant
            </h1>
            <p style={{ color: '#3A3A5C', fontSize: '11px', marginTop: '1px' }}>
              Ask anything about your finances
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 transition-colors"
            style={{
              color: '#3A3A5C',
              fontSize: '12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: '8px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#FF4757'; e.currentTarget.style.background = 'rgba(255,71,87,0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#3A3A5C'; e.currentTarget.style.background = 'none' }}
          >
            <Trash2 size={13} />
            Clear
          </button>
        )}
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div
              style={{
                width: '64px',
                height: '64px',
                background: 'rgba(108,99,255,0.1)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                boxShadow: '0 0 32px rgba(108,99,255,0.2)',
              }}
            >
              <Bot size={28} color="#6C63FF" />
            </div>
            <h2 style={{ color: '#E8E8F0', fontSize: '17px', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.3px' }}>
              Your Financial AI Assistant
            </h2>
            <p style={{ color: '#6B6B8A', fontSize: '13px', lineHeight: 1.6, marginBottom: '28px', maxWidth: '360px' }}>
              Ask me anything about your spending, income, or savings.
              I have full access to all your transaction data.
            </p>

            {/* Suggestion chips */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                width: '100%',
                maxWidth: '480px',
              }}
            >
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    background: '#111118',
                    border: '1px solid #1E1E2E',
                    borderRadius: '10px',
                    color: '#6B6B8A',
                    fontSize: '12px',
                    lineHeight: 1.4,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(108,99,255,0.4)'
                    e.currentTarget.style.color = '#E8E8F0'
                    e.currentTarget.style.background = 'rgba(108,99,255,0.06)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#1E1E2E'
                    e.currentTarget.style.color = '#6B6B8A'
                    e.currentTarget.style.background = '#111118'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((m, i) => (
          <Message key={i} m={m} />
        ))}

        {/* Typing indicator */}
        {loading && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        className="shrink-0"
        style={{
          padding: '16px 28px 20px',
          borderTop: '1px solid #1E1E2E',
          background: '#0D0D18',
        }}
      >
        <div
          className="flex gap-3"
          style={{ maxWidth: '800px', margin: '0 auto', alignItems: 'flex-end' }}
        >
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              ref={inputRef}
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
              className="input-dark"
              disabled={loading}
              style={{ paddingRight: '14px' }}
            />
          </div>
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{
              width: '42px',
              height: '42px',
              background: input.trim() && !loading
                ? 'linear-gradient(135deg, #6C63FF, #4A44B3)'
                : '#16161F',
              border: '1px solid #1E1E2E',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              opacity: !input.trim() || loading ? 0.4 : 1,
              transition: 'all 0.15s ease',
              flexShrink: 0,
              boxShadow: input.trim() && !loading ? '0 0 16px rgba(108,99,255,0.3)' : 'none',
            }}
          >
            {loading
              ? <Zap size={15} color="#6C63FF" />
              : <Send size={15} color="white" />
            }
          </button>
        </div>
        <p style={{ color: '#3A3A5C', fontSize: '10px', textAlign: 'center', marginTop: '8px' }}>
          AI responses are based on your uploaded transaction data
        </p>
      </div>
    </div>
  )
}
