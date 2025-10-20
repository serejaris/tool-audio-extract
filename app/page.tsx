'use client'

import { useEffect, useRef, useState } from 'react'

export default function Page() {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Prevent the browser from opening a dropped file outside our dropzone
  useEffect(() => {
    const prevent = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }
    window.addEventListener('dragover', prevent)
    window.addEventListener('drop', prevent)
    return () => {
      window.removeEventListener('dragover', prevent)
      window.removeEventListener('drop', prevent)
    }
  }, [])

  const pickFile = () => {
    inputRef.current?.click()
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    setMessage(null)
    setFile(files[0])
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!dragActive) setDragActive(true)
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer?.files || null)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setBusy(true)
    setMessage(null)

    try {
      const apiUrl = `/api/extract?filename=${encodeURIComponent(file.name)}`
      const res = await fetch(apiUrl, {
        method: 'POST',
        body: file,
        headers: file.type ? { 'Content-Type': file.type } : undefined,
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Extraction failed')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const base = file.name.replace(/\.[^.]+$/, '')
      a.href = url
      a.download = `${base}.m4a`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      setMessage('Done!')
    } catch (err: any) {
      setMessage(err?.message || 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main>
      <h1>Audio Extractor</h1>
      <p>
        Drag & drop a video to extract audio as <code>m4a</code>.
      </p>

      <form onSubmit={onSubmit}>
        <div>
          <div
            role="button"
            onClick={pickFile}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                pickFile()
              }
            }}
            tabIndex={0}
            onDragOver={onDragOver}
            onDragEnter={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`dropzone ${dragActive ? 'active' : ''}`}
            aria-label="Drag and drop a video here, or click to choose"
          >
            <div className="dropzone-title">Drag & drop video here</div>
            <div className="dropzone-subtitle">or click to choose a file</div>
            {file && (
              <div className="dropzone-filename">Selected: {file.name}</div>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            onChange={(e) => handleFiles(e.target.files)}
            style={{ display: 'none' }}
            required={!file}
          />
        </div>

        <button type="submit" disabled={!file || busy}>
          {busy ? 'Processing…' : 'Extract Audio'}
        </button>
      </form>

      {message && <div className="message">{message}</div>}
    </main>
  )
}
