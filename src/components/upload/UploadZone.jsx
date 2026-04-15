import { useId, useRef, useState } from "react"

export default function UploadZone({ onFile }) {
  const [drag, setDrag] = useState(false)
  const inputRef = useRef(null)
  const id = useId()

  function handleDrop(e) {
    e.preventDefault()
    setDrag(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  function pick() {
    inputRef.current?.click()
  }

  return (
    <>
      <div
        className={`zona-upload ${drag ? "arrastando" : ""}`}
        role="button"
        tabIndex={0}
        aria-label="Área de upload. Clique ou arraste um arquivo PDF"
        onClick={pick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") pick()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
      >
        <div className="upload-icone" aria-hidden="true">
          📁
        </div>
        <div className="upload-titulo">Arraste o PDF aqui ou clique para selecionar</div>
        <div className="upload-sub">O arquivo será lido pela IA para adaptação</div>
        <div className="upload-formatos">Formatos aceitos: PDF (máx. 20MB)</div>
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        className="sr-only"
        accept=".pdf,application/pdf"
        aria-label="Selecionar arquivo PDF"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
        }}
      />
    </>
  )
}
