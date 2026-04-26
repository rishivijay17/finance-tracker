import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { uploadStatement } from '../api/client'
import toast from 'react-hot-toast'

export default function UploadZone({ onSuccess }) {
  const [loading, setLoading] = useState(false)

  const onDrop = async (accepted) => {
    if (!accepted.length) return
    const file = accepted[0]

    setLoading(true)
    try {
      const res = await uploadStatement(file)
      const { count, anomalies } = res.data
      toast.success(
        `Imported ${count} transactions${anomalies ? ` · ${anomalies} anomalies flagged` : ''}!`
      )
      onSuccess?.()
    } catch (err) {
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

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
        loading
          ? 'opacity-60 cursor-not-allowed border-slate-200 bg-slate-50'
          : isDragActive
          ? 'border-indigo-500 bg-indigo-50 scale-[1.01]'
          : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
      }`}
    >
      <input {...getInputProps()} />

      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={30} className="text-indigo-500 animate-spin" />
          <div>
            <p className="text-slate-700 text-sm font-medium">Analyzing with AI…</p>
            <p className="text-slate-400 text-xs mt-0.5">This can take 10–30 seconds</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
            {isDragActive ? (
              <FileText size={22} className="text-indigo-600" />
            ) : (
              <Upload size={22} className="text-indigo-400" />
            )}
          </div>
          <div>
            <p className="text-slate-700 font-medium text-sm">
              {isDragActive ? 'Drop your PDF here' : 'Upload Bank Statement PDF'}
            </p>
            <p className="text-slate-400 text-xs mt-1">Drag & drop or click to browse</p>
          </div>
        </div>
      )}
    </div>
  )
}
