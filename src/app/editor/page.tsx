'use client'

import { useState, useRef, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import type { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { sendAIGenMDX } from '@/lib/modules/llm/llm-service'

export default function MonacoEditorPage() {
  const [code, setCode] = useState<string>('// Write your code here\nfunction hello() {\n  return "Hello, world!"\n}')
  const [selectedText, setSelectedText] = useState<string>('')
  const [selectionRange, setSelectionRange] = useState<{ startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number } | null>(null)
  const [replaceText, setReplaceText] = useState<string>('')
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)

  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Listen for selection changes
    editor.onDidChangeCursorSelection((event) => {
      const selection = event.selection
      const selectedText = editor.getModel()?.getValueInRange(selection) || ''
      setSelectedText(selectedText)
      setSelectionRange({
        startLineNumber: selection.startLineNumber,
        startColumn: selection.startColumn,
        endLineNumber: selection.endLineNumber,
        endColumn: selection.endColumn
      })
    })
  }, [])

  const handleReplaceSelection = async () => {
    if (!editorRef.current || !selectionRange || !replaceText.trim()) return

    const editor = editorRef.current
    const model = editor.getModel()
    
    if (!model) return
    const data = await sendAIGenMDX({
        prompt: `Replace the following code snippet with an improved version:\n\n${selectedText}\n\nImproved version:`,
        model: 'gemini-2.5-flash',
        apiKey: "AIzaSyBXCE3lSmVEudgwVevjVYjRI3frwHLWOGg",
        provider: 'gemini'
    });
    // Execute the edit operation
    editor.executeEdits('replace-selection', [{
      range: {
        startLineNumber: selectionRange.startLineNumber,
        startColumn: selectionRange.startColumn,
        endLineNumber: selectionRange.endLineNumber,
        endColumn: selectionRange.endColumn
      },
      text: data,
      forceMoveMarkers: true
    }])

    // Clear the replace input
    setReplaceText('')
    setSelectedText('')
    setSelectionRange(null)
  }

  const handleWrapSelection = useCallback(() => {
    if (!editorRef.current || !selectionRange || !selectedText.trim()) return

    const editor = editorRef.current
    const model = editor.getModel()
    
    if (!model) return

    // Wrap the selected text with a function call
    const wrappedText = `someFunction(${selectedText})`
    
    editor.executeEdits('wrap-selection', [{
      range: {
        startLineNumber: selectionRange.startLineNumber,
        startColumn: selectionRange.startColumn,
        endLineNumber: selectionRange.endLineNumber,
        endColumn: selectionRange.endColumn
      },
      text: wrappedText,
      forceMoveMarkers: true
    }])

    setSelectedText('')
    setSelectionRange(null)
  }, [selectionRange, selectedText])

  const handleCommentSelection = useCallback(() => {
    if (!editorRef.current || !selectionRange || !selectedText.trim()) return

    const editor = editorRef.current
    const model = editor.getModel()
    
    if (!model) return

    // Toggle comments (simple implementation)
    const isCommented = selectedText.startsWith('//')
    const newText = isCommented ? selectedText.slice(2) : `//${selectedText}`
    
    editor.executeEdits('comment-selection', [{
      range: {
        startLineNumber: selectionRange.startLineNumber,
        startColumn: selectionRange.startColumn,
        endLineNumber: selectionRange.endLineNumber,
        endColumn: selectionRange.endColumn
      },
      text: newText,
      forceMoveMarkers: true
    }])

    setSelectedText('')
    setSelectionRange(null)
  }, [selectionRange, selectedText])

  return (
    <div className="editor-container h-screen">
      <h1>Monaco Editor Selection Demo</h1>
      
      <div className="controls">
        <input
          type="text"
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          placeholder="Enter replacement text"
          className="replace-input"
          disabled={!selectedText}
        />
        <button 
          onClick={handleReplaceSelection} 
          className="button"
          disabled={!selectedText || !replaceText.trim()}
        >
          Replace Selection
        </button>
        <button 
          onClick={handleWrapSelection} 
          className="button"
          disabled={!selectedText}
        >
          Wrap with Function
        </button>
        <button 
          onClick={handleCommentSelection} 
          className="button"
          disabled={!selectedText}
        >
          Toggle Comment
        </button>
      </div>

      {selectedText && (
        <div className="selection-info">
          <span>Selected Text:</span> {selectedText}
          <br />
          <strong>Range:</strong> Ln {selectionRange?.startLineNumber}:{selectionRange?.startColumn} - Ln {selectionRange?.endLineNumber}:{selectionRange?.endColumn}
        </div>
      )}

      <div className="monaco-wrapper h-full">
        <Editor
          height="100%"
          defaultLanguage="typescript"
          value={code}
          onChange={(value) => setCode(value || '')}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            roundedSelection: true,
            selectionHighlight: true,
          }}
        />
      </div>
    </div>
  )
}
