'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'

interface PdfUploadProps {
  onUpload: (file: File) => void
  isLoading: boolean
  error?: string
}

export default function PdfUpload({ onUpload, isLoading, error }: PdfUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setSelectedFile(file)
        onUpload(file)
      }
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      setSelectedFile(file)
      onUpload(file)
    }
  }

  const handleClick = () => {
    if (!isLoading) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer"
        style={{
          borderColor: isDragging ? '#00E8FF' : error ? '#FF4444' : '#4D4D4D',
          backgroundColor: isDragging ? 'rgba(0, 232, 255, 0.05)' : '#3D3D3D',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#00E8FF', borderTopColor: 'transparent' }}
            />
            <p className="text-white font-medium">PDF verwerken...</p>
            <p style={{ color: '#9D9D9D' }} className="text-sm">
              Planning wordt ingelezen en afstanden worden berekend
            </p>
          </div>
        ) : selectedFile && !error ? (
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0, 232, 255, 0.1)' }}
            >
              <svg className="w-8 h-8" style={{ color: '#00E8FF' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">{selectedFile.name}</p>
              <p style={{ color: '#9D9D9D' }} className="text-sm mt-1">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <p style={{ color: '#00E8FF' }} className="text-sm">Klik om ander bestand te kiezen</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0, 232, 255, 0.1)' }}
            >
              <svg
                className="w-8 h-8"
                style={{ color: error ? '#FF4444' : '#00E8FF' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-lg">
                Sleep PDF hier of klik om te kiezen
              </p>
              <p style={{ color: '#9D9D9D' }} className="text-sm mt-1">
                ExcelAir System-Care maandplanning (PDF)
              </p>
            </div>
            {error ? (
              <p className="text-sm px-4 py-2 rounded" style={{ color: '#FF4444', backgroundColor: 'rgba(255, 68, 68, 0.1)' }}>
                {error}
              </p>
            ) : (
              <p style={{ color: '#6D6D6D' }} className="text-xs">
                Alleen .pdf bestanden worden geaccepteerd
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
