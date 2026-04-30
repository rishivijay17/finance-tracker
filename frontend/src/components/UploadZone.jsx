import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { uploadStatement } from '../api/client'
import toast from 'react-hot-toast'

export default function UploadZone({ onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [duplicateInfo, setDuplicateInfo] = useState(null)

  const onDrop = async (accepted) => {
    if (!accepted.length) return
    const file = accepted[0]
    setLoading(true)
    setDuplicateInfo(null)
    try {
      const res = await uploadStatement(file)
      const { count, anomalies, duplicate, statement_period } = res.data

      if (duplicate) {
        setDuplicateInfo(statement_period ?? 'this statement')
        return
      }

      toast.success(
        `Imported ${count} transactions${anomalies ? ` · ${anomalies} anomalies flagged` : ''}!`
      )
      onSuccess?.()
    } catch (err) {
      setDuplicateInfo(null)
      const msg =
        err.response?.data?.detail ||
        'Upload failed. Check that your GEMINI_API_KEY is set in backend/.env'
      toast.error(msg, { duration: 6000 })
    } finally {
      setLoading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: loading,
  })

  const borderColor = loading
    ? '#1E1E2E'
    : isDragActive
    ? '#6C63FF'
    : duplicateInfo
    ? '#FFB800'
    : '#1E1E2E'

  const bg = isDragActive ? 'rgba(108,99,255,0.06)' : 'transparent'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${borderColor}`,
          borderRadius: '12px',
          padding: '28px 20px',
          textAlign: 'center',
          cursor: loading ? 'not-allowed' : 'pointer',
          background: bg,
          transition: 'all 0.2s ease',
          opacity: loading ? 0.6 : 1,
        }}
      >
        <input {...getInputProps()} />

        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div
              style={{
                width: '44px',
                height: '44px',
                background: 'rgba(108,99,255,0.1)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Loader2 size={20} color="#6C63FF" className="animate-spin" />
            </div>
            <div>
              <p style={{ color: '#E8E8F0', fontSize: '13px', fontWeight: 600 }}>Analyzing with AI…</p>
              <p style={{ color: '#6B6B8A', fontSize: '11px', marginTop: '4px' }}>This can take 10–30 seconds</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div
              style={{
                width: '44px',
                height: '44px',
                background: isDragActive ? 'rgba(108,99,255,0.15)' : 'rgba(108,99,255,0.08)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isDragActive ? (
                <FileText size={20} color="#6C63FF" />
              ) : (
                <Upload size={20} color="#6C63FF" />
              )}
            </div>
            <div>
              <p style={{ color: '#E8E8F0', fontWeight: 600, fontSize: '13px' }}>
                {isDragActive ? 'Drop your PDF here' : 'Upload Bank Statement PDF'}
              </p>
              <p style={{ color: '#3A3A5C', fontSize: '11px', marginTop: '4px' }}>
                Drag & drop or click to browse · PDF only
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Duplicate warning */}
      {duplicateInfo && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background: 'rgba(255,184,0,0.06)',
            border: '1px solid rgba(255,184,0,0.25)',
          }}
        >
          <AlertCircle size={15} color="#FFB800" style={{ flexShrink: 0 }} />
          <div>
            <p style={{ color: '#FFB800', fontSize: '12px', fontWeight: 700 }}>
              Already uploaded
            </p>
            <p style={{ color: '#9A8A5A', fontSize: '11px', marginTop: '2px' }}>
              The statement for <strong style={{ color: '#E8E8F0' }}>{duplicateInfo}</strong> has already been imported.
              No duplicate transactions were added.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
