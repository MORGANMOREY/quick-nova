import { useState, useRef } from 'react';

export function compressImage(file, maxWidth = 480, quality = 0.75, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      callback(dataUrl);
    };
    img.onerror = () => callback(e.target.result);
    img.src = e.target.result;
  };
  reader.onerror = () => {};
  reader.readAsDataURL(file);
}

export default function ImageUploadInput({ value, onChange, placeholder, style, compact = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    compressImage(file, 480, 0.75, (compressed) => {
      onChange(compressed);
    });
  };

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%', ...(style || {}) }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]); }}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        {value ? (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              overflow: 'hidden',
              flexShrink: 0,
              border: '1px solid var(--accent-1)',
              background: '#000',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            title="Click to replace image"
          >
            <img src={value} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{
              padding: '0.35rem 0.55rem',
              borderRadius: '6px',
              background: isDragging ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.06)',
              border: isDragging ? '1px dashed var(--accent-1)' : '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontSize: '0.75rem',
              fontWeight: '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
            }}
          >
            📁 Pick/Drop
          </button>
        )}
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Paste image URL..."}
          style={{ flex: 1, padding: '0.35rem 0.6rem', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', color: '#fff' }}
          onClick={(e) => e.stopPropagation()}
        />
        {value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', padding: '0.2rem 0.35rem' }}
            title="Remove image"
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', ...(style || {}) }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '120px',
          border: isDragging ? '2px dashed var(--accent-1)' : '2px dashed var(--border-subtle)',
          borderRadius: '12px',
          background: isDragging ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255,255,255,0.02)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          overflow: 'hidden'
        }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
      >
        {value && value.length > 0 ? (
          <div style={{ position: 'relative', width: '100%', height: '100px', display: 'flex', justifyContent: 'center' }}>
            <img 
              src={value} 
              alt="Preview" 
              onError={(e) => { 
                e.target.style.display = 'none'; 
                if(e.target.nextElementSibling) e.target.nextElementSibling.innerHTML = '⚠️ Invalid Image URL';
              }} 
              style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }} 
            />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', color: 'white', fontWeight: 'bold', borderRadius: '8px' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
              Click or Drop to Replace
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📸</div>
            <div style={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '0.9rem' }}>Drag & Drop Image Here</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>or click to browse local files</div>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]); }}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Or Image URL:</span>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "https://..."}
          style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}
