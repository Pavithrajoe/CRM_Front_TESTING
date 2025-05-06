import React, { useRef, useEffect } from 'react';
import './texteditor.css';

function TextEditor({ content, setContent }) {
  const editorRef = useRef(null);

  // Update the parent state on content change
  const handleInputChange = () => {
    const html = editorRef.current.innerHTML;
    setContent(html);
  };

  const applyStyle = (style) => {
    document.execCommand(style, false, null);
    editorRef.current.focus();
  };

  const applyCustomStyle = (command, value) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
  };

  const handleFontSizeChange = (e) => {
    const sizeMap = {
      '8px': 1,
      '10px': 2,
      '12px': 3,
      '14px': 4,
      '16px': 5,
      '18px': 6,
      '20px': 7,
    };
    const sizeValue = sizeMap[e.target.value] || 3;
    applyCustomStyle('fontSize', sizeValue);
  };

  const handleFontFamilyChange = (e) => {
    applyCustomStyle('fontName', e.target.value);
  };

  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  return (
    <div className="text-editor-container">
      <div className="toolbar">
        <button onClick={() => applyStyle('bold')}><strong>B</strong></button>
        <button onClick={() => applyStyle('italic')}><em>I</em></button>
        <button onClick={() => applyStyle('underline')}><u>U</u></button>
        <button onClick={() => applyStyle('strikeThrough')}><s>S</s></button>
        <select onChange={handleFontSizeChange}>
          <option value="">Size</option>
          <option value="8px">8</option>
          <option value="10px">10</option>
          <option value="12px">12</option>
          <option value="14px">14</option>
          <option value="16px">16</option>
          <option value="18px">18</option>
          <option value="20px">20</option>
        </select>
        <select onChange={handleFontFamilyChange}>
          <option value="">Font</option>
          <option value="Arial">Arial</option>
          <option value="Verdana">Verdana</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
        </select>
      </div>

      <div
        className="editor"
        ref={editorRef}
        contentEditable
        onInput={handleInputChange}
        style={{
          border: '1px solid #ccc',
          padding: '10px',
          minHeight: '200px',
          marginTop: '10px',
          direction: 'ltr',
          textAlign: 'left',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
        }}
      />
    </div>
  );
}

export default TextEditor;
