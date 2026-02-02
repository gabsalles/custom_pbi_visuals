import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-sql";
import "ace-builds/src-noconflict/theme-monokai";

// --- ESTILOS DE UI ---
const styles = {
  container: { display: 'flex', height: '100vh', fontFamily: 'Inter, Segoe UI, sans-serif', backgroundColor: '#18181b', color: '#e4e4e7', overflow: 'hidden' },
  canvasArea: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#27272a', backgroundImage: 'radial-gradient(#3f3f46 1px, transparent 1px)', backgroundSize: '20px 20px', position: 'relative' },
  inspector: { width: '420px', display: 'flex', flexDirection: 'column', backgroundColor: '#18181b', borderLeft: '1px solid #3f3f46', overflowY: 'auto' },
  accordionHeader: { padding: '12px 15px', background: '#27272a', borderBottom: '1px solid #3f3f46', cursor: 'pointer', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', letterSpacing: '0.5px', color: '#a1a1aa' },
  accordionContent: { padding: '15px', borderBottom: '1px solid #3f3f46', background: '#18181b' },
  row: { display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' },
  col: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '10px', color: '#71717a', fontWeight: '600', textTransform: 'uppercase' },
  input: { background: '#09090b', border: '1px solid #3f3f46', color: '#fff', borderRadius: '4px', padding: '6px 8px', fontSize: '12px', outline: 'none', transition: 'border 0.2s', width: '100%', boxSizing: 'border-box' },
  select: { background: '#09090b', border: '1px solid #3f3f46', color: '#fff', borderRadius: '4px', padding: '6px 8px', fontSize: '12px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  timelineStart: { borderLeft: '3px solid #10b981', paddingLeft: '10px', marginBottom: '15px' },
  timelineEnd: { borderLeft: '3px solid #ef4444', paddingLeft: '10px' },
  header: { padding: '15px', borderBottom: '1px solid #3f3f46', background: '#09090b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  primaryBtn: { background: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', width: '100%', marginTop: '20px', fontSize: '13px' },
  floatingControls: { position: 'absolute', top: 20, display: 'flex', gap: 10, zIndex: 10 }
};

const Accordion = ({ title, isOpen, onToggle, children }) => (
  <div>
    <div style={{...styles.accordionHeader, color: isOpen ? '#fff' : '#a1a1aa', background: isOpen ? '#3f3f46' : '#27272a'}} onClick={onToggle}>
      {title} <span>{isOpen ? '−' : '+'}</span>
    </div>
    {isOpen && <div style={styles.accordionContent}>{children}</div>}
  </div>
);

function App() {
  const [svgContent, setSvgContent] = useState('');
  const [bindings, setBindings] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [daxResult, setDaxResult] = useState('');
  const [openSections, setOpenSections] = useState({ data: true, transform: true, style: false, anim: false });

  const toggleSection = (sec) => setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));

  // --- UPLOAD & PROCESSAMENTO ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(ev.target.result, "image/svg+xml");
      // Auto-ID: Garante que tudo é clicável
      doc.querySelectorAll('*').forEach((el, i) => {
        if (!['svg', 'defs', 'style'].includes(el.tagName) && !el.id) el.id = `gen_${el.tagName}_${i}`;
      });
      const serializer = new XMLSerializer();
      setSvgContent(serializer.serializeToString(doc));
      setBindings({});
      setSelectedId(null);
    };
    reader.readAsText(file);
  };

  // --- SELEÇÃO ---
  const handleSvgClick = (e) => {
    e.stopPropagation();
    let target = e.target;
    if (target.tagName === 'div' || target.tagName === 'svg') return;
    while (target && target.tagName !== 'svg' && !target.id) target = target.parentElement;
    if (!target || !target.id) return;

    const id = target.id;
    setSelectedId(id);

    // Inicializa Binding com TODOS os campos possíveis (Merge Completo)
    if (!bindings[id]) {
      setBindings(prev => ({
        ...prev,
        [id]: {
          element_id: id,
          measure: '',
          property_type: 'none', // none, bar, clip_bar, fill, text
          direction: 'right', 
          max_value: '100',
          
          // Granular Static Controls (Design)
          static: { 
            x: 0, y: 0, scale: 1, rotate: 0, skewX: 0, skewY: 0, opacity: 1, 
            transform_origin: 'center', mix_blend_mode: 'normal', cursor: 'default',
            blur: 0, brightness: 100, contrast: 100, drop_shadow: 0,
            stroke_linecap: 'butt', stroke_linejoin: 'miter', text_anchor: 'start', font_weight: 'normal'
          },
          
          // Hover Logic
          hover: { enabled: false, fill: '', scale: '', opacity: '' },
          
          // Animation Logic (Timeline)
          custom_anim: { 
            enabled: false, duration: '1s', delay: '0s', timing: 'ease', iteration: '1', 
            direction: 'normal', fill_mode: 'forwards',
            start: { x:0, y:0, scale:1, rotate:0, opacity:0 },
            end: { x:0, y:0, scale:1, rotate:0, opacity:1 }
          }
        }
      }));
    }
  };

  const updateBinding = (path, value) => {
    setBindings(prev => {
        const newItem = { ...prev[selectedId] };
        const keys = path.split('.');
        let ref = newItem;
        for (let i = 0; i < keys.length - 1; i++) ref = ref[keys[i]];
        ref[keys[keys.length - 1]] = value;
        return { ...prev, [selectedId]: newItem };
    });
  };

  // --- ENGINE DE PREVIEW (LIVE SIMULATION) ---
  useEffect(() => {
    Object.values(bindings).forEach(bind => {
        const el = document.getElementById(bind.element_id);
        if (!el) return;
        
        const s = bind.static;
        el.style.transition = "all 0.2s ease";
        el.style.transformBox = "fill-box";
        
        // 1. Static Transforms (Deep Granularity)
        const transforms = [];
        if (s.x != 0 || s.y != 0) transforms.push(`translate(${s.x}px, ${s.y}px)`);
        if (s.scale != 1) transforms.push(`scale(${s.scale})`);
        if (s.rotate != 0) transforms.push(`rotate(${s.rotate}deg)`);
        if (s.skewX != 0) transforms.push(`skewX(${s.skewX}deg)`);
        if (s.skewY != 0) transforms.push(`skewY(${s.skewY}deg)`);
        
        el.style.transform = transforms.join(" ");
        el.style.transformOrigin = s.transform_origin;
        el.style.opacity = s.opacity;
        el.style.mixBlendMode = s.mix_blend_mode;
        el.style.cursor = s.cursor;
        
        // 2. SVG Props
        el.style.strokeLinecap = s.stroke_linecap;
        el.style.strokeLinejoin = s.stroke_linejoin;
        if(el.tagName === 'text') {
            el.style.textAnchor = s.text_anchor;
            el.style.fontWeight = s.font_weight;
        }
        
        // 3. FX Filters
        let filters = [];
        if (s.blur > 0) filters.push(`blur(${s.blur}px)`);
        if (s.drop_shadow > 0) filters.push(`drop-shadow(2px 2px ${s.drop_shadow}px rgba(0,0,0,0.5))`);
        if (s.brightness != 100) filters.push(`brightness(${s.brightness}%)`);
        if (s.contrast != 100) filters.push(`contrast(${s.contrast}%)`);
        el.style.filter = filters.join(" ");
    });
  }, [bindings]);

  // --- ANIMATION REPLAY ---
  const replayAnimation = () => {
     Object.values(bindings).forEach(bind => {
         const el = document.getElementById(bind.element_id);
         if (!el || !bind.custom_anim.enabled) return;
         const anim = bind.custom_anim;
         el.getAnimations().forEach(a => a.cancel());
         el.animate([
             { transform: `translate(${anim.start.x}px, ${anim.start.y}px) scale(${anim.start.scale}) rotate(${anim.start.rotate}deg)`, opacity: anim.start.opacity },
             { transform: `translate(${anim.end.x}px, ${anim.end.y}px) scale(${anim.end.scale}) rotate(${anim.end.rotate}deg)`, opacity: anim.end.opacity }
         ], {
             duration: parseFloat(anim.duration) * 1000,
             delay: parseFloat(anim.delay) * 1000,
             easing: anim.timing,
             iterations: anim.iteration === 'infinite' ? Infinity : parseFloat(anim.iteration),
             direction: anim.direction,
             fill: anim.fill_mode
         });
     });
  };

  // --- GERADOR DAX ---
  const generateDax = async () => {
    // Processa filtros estáticos para enviar string CSS final
    const processed = Object.values(bindings).map(b => {
        const s = b.static;
        let f = [];
        if (s.blur > 0) f.push(`blur(${s.blur}px)`);
        if (s.drop_shadow > 0) f.push(`drop-shadow(2px 2px ${s.drop_shadow}px rgba(0,0,0,0.5))`);
        if (s.brightness != 100) f.push(`brightness(${s.brightness}%)`);
        if (s.contrast != 100) f.push(`contrast(${s.contrast}%)`);
        return { ...b, static: { ...s, filter: f.join(" ") } };
    });
    try {
      const response = await axios.post('http://localhost:8000/compile', { svg_code: svgContent, bindings: processed });
      setDaxResult(response.data.dax);
    } catch (e) { alert("Erro Backend: Verifique se o Python está rodando."); }
  };

  const wrapperStyle = `
    #${selectedId} { outline: 2px solid #2563eb; cursor: crosshair; }
    svg { max-width: 90%; max-height: 80vh; background: #fff; box-shadow: 0 0 40px rgba(0,0,0,0.5); }
  `;

  return (
    <div style={styles.container}>
      <div style={styles.canvasArea}>
        <div style={styles.floatingControls}>
            <button onClick={replayAnimation} style={{padding:'8px 16px', background:'#10b981', border:'none', color:'white', borderRadius:'4px', cursor:'pointer', fontWeight:'bold', boxShadow:'0 4px 6px rgba(0,0,0,0.3)'}}>▶ PLAY ANIMAÇÃO</button>
            <button onClick={() => setSvgContent('')} style={{padding:'8px 16px', background:'#3f3f46', border:'none', color:'white', borderRadius:'4px', cursor:'pointer'}}>Nova Importação</button>
        </div>
        {!svgContent ? (
           <label style={{cursor:'pointer', color:'#71717a', textAlign:'center'}}>
              <div style={{fontSize:'40px', marginBottom:'10px'}}>🎨</div>
              <div>Arraste SVG ou Clique</div>
              <input type="file" accept=".svg" onChange={handleFileUpload} style={{display:'none'}}/>
           </label>
        ) : (
           <div dangerouslySetInnerHTML={{__html: `<style>${wrapperStyle}</style>` + svgContent}} onClick={handleSvgClick} />
        )}
      </div>

      <div style={styles.inspector}>
        <div style={styles.header}>
           <div style={{fontWeight:'bold', color:'#fff'}}>PROPERTIES</div>
           <div style={{fontSize:'12px', color:'#2563eb', fontFamily:'monospace'}}>{selectedId || 'Nenhum'}</div>
        </div>

        {selectedId && bindings[selectedId] && (
          <>
            {/* 1. DADOS */}
            <Accordion title="1. Dados (Power BI)" isOpen={openSections.data} onToggle={() => toggleSection('data')}>
                <div style={styles.col}>
                    <label style={styles.label}>Medida DAX</label>
                    <input style={styles.input} placeholder="Ex: [Total Vendas]" value={bindings[selectedId].measure} onChange={(e) => updateBinding('measure', e.target.value)} />
                </div>
                <div style={{marginTop:'10px'}}>
                    <label style={styles.label}>Comportamento</label>
                    <select style={styles.select} value={bindings[selectedId].property_type} onChange={(e) => updateBinding('property_type', e.target.value)}>
                        <option value="none">Estático</option>
                        <option value="clip_bar">✨ Barra Progresso (Máscara)</option>
                        <option value="bar">Barra Simples (Scale)</option>
                        <option value="fill">Cor Condicional</option>
                    </select>
                </div>
                {(bindings[selectedId].property_type === 'bar' || bindings[selectedId].property_type === 'clip_bar') && (
                    <div style={styles.row}>
                        <div style={styles.col}><label style={styles.label}>Direção</label>
                            <select style={styles.select} value={bindings[selectedId].direction} onChange={(e) => updateBinding('direction', e.target.value)}>
                                <option value="right">Direita</option><option value="up">Cima</option><option value="down">Baixo</option><option value="left">Esquerda</option>
                            </select>
                        </div>
                        <div style={styles.col}><label style={styles.label}>Meta</label><input style={styles.input} value={bindings[selectedId].max_value} onChange={(e) => updateBinding('max_value', e.target.value)} /></div>
                    </div>
                )}
            </Accordion>

            {/* 2. ANIMAÇÃO GRANULAR */}
            <Accordion title="2. Animação (Timeline)" isOpen={openSections.anim} onToggle={() => toggleSection('anim')}>
                <div style={{display:'flex', alignItems:'center', marginBottom:'15px', background:'#27272a', padding:'8px', borderRadius:'4px'}}>
                    <input type="checkbox" checked={bindings[selectedId].custom_anim.enabled} onChange={(e) => updateBinding('custom_anim.enabled', e.target.checked)} />
                    <span style={{marginLeft:'8px', fontSize:'12px', fontWeight:'bold', color:'#fff'}}>HABILITAR KEYFRAMES</span>
                </div>
                {bindings[selectedId].custom_anim.enabled && (
                    <>
                        <div style={styles.row}>
                            <div style={styles.col}><label style={styles.label}>Duração (s)</label><input style={styles.input} value={bindings[selectedId].custom_anim.duration} onChange={(e) => updateBinding('custom_anim.duration', e.target.value)}/></div>
                            <div style={styles.col}><label style={styles.label}>Easing</label>
                                <select style={styles.select} value={bindings[selectedId].custom_anim.timing} onChange={(e) => updateBinding('custom_anim.timing', e.target.value)}>
                                    <option value="ease">Ease</option><option value="linear">Linear</option><option value="cubic-bezier(0.34, 1.56, 0.64, 1)">Elastic Pop</option>
                                </select>
                            </div>
                        </div>
                        <div style={styles.timelineStart}>
                            <label style={{color:'#10b981', fontWeight:'bold', fontSize:'10px'}}>INÍCIO (0%)</label>
                            <div style={styles.row}>
                                <div style={styles.col}><label style={styles.label}>X</label><input type="number" style={styles.input} value={bindings[selectedId].custom_anim.start.x} onChange={(e) => updateBinding('custom_anim.start.x', e.target.value)}/></div>
                                <div style={styles.col}><label style={styles.label}>Scale</label><input type="number" step="0.1" style={styles.input} value={bindings[selectedId].custom_anim.start.scale} onChange={(e) => updateBinding('custom_anim.start.scale', e.target.value)}/></div>
                                <div style={styles.col}><label style={styles.label}>Opacity</label><input type="number" step="0.1" style={styles.input} value={bindings[selectedId].custom_anim.start.opacity} onChange={(e) => updateBinding('custom_anim.start.opacity', e.target.value)}/></div>
                            </div>
                        </div>
                        <div style={styles.timelineEnd}>
                            <label style={{color:'#ef4444', fontWeight:'bold', fontSize:'10px'}}>FIM (100%)</label>
                            <div style={styles.row}>
                                <div style={styles.col}><label style={styles.label}>X</label><input type="number" style={styles.input} value={bindings[selectedId].custom_anim.end.x} onChange={(e) => updateBinding('custom_anim.end.x', e.target.value)}/></div>
                                <div style={styles.col}><label style={styles.label}>Scale</label><input type="number" step="0.1" style={styles.input} value={bindings[selectedId].custom_anim.end.scale} onChange={(e) => updateBinding('custom_anim.end.scale', e.target.value)}/></div>
                                <div style={styles.col}><label style={styles.label}>Opacity</label><input type="number" step="0.1" style={styles.input} value={bindings[selectedId].custom_anim.end.opacity} onChange={(e) => updateBinding('custom_anim.end.opacity', e.target.value)}/></div>
                            </div>
                        </div>
                    </>
                )}
            </Accordion>

            {/* 3. GEOMETRIA ESTÁTICA */}
            <Accordion title="3. Geometria Estática" isOpen={openSections.transform} onToggle={() => toggleSection('transform')}>
                <div style={styles.row}>
                    <div style={styles.col}><label style={styles.label}>X</label><input type="number" style={styles.input} value={bindings[selectedId].static.x} onChange={(e) => updateBinding('static.x', e.target.value)}/></div>
                    <div style={styles.col}><label style={styles.label}>Y</label><input type="number" style={styles.input} value={bindings[selectedId].static.y} onChange={(e) => updateBinding('static.y', e.target.value)}/></div>
                </div>
                <div style={styles.row}>
                    <div style={styles.col}><label style={styles.label}>Scale</label><input type="number" step="0.1" style={styles.input} value={bindings[selectedId].static.scale} onChange={(e) => updateBinding('static.scale', e.target.value)}/></div>
                    <div style={styles.col}><label style={styles.label}>Rotate</label><input type="number" style={styles.input} value={bindings[selectedId].static.rotate} onChange={(e) => updateBinding('static.rotate', e.target.value)}/></div>
                </div>
                <div style={styles.row}>
                    <div style={styles.col}><label style={styles.label}>Skew X</label><input type="number" style={styles.input} value={bindings[selectedId].static.skewX} onChange={(e) => updateBinding('static.skewX', e.target.value)}/></div>
                    <div style={styles.col}><label style={styles.label}>Skew Y</label><input type="number" style={styles.input} value={bindings[selectedId].static.skewY} onChange={(e) => updateBinding('static.skewY', e.target.value)}/></div>
                </div>
            </Accordion>

            {/* 4. ESTILO & FX */}
            <Accordion title="4. Estilo & FX" isOpen={openSections.style} onToggle={() => toggleSection('style')}>
                <div style={styles.row}>
                    <div style={styles.col}><label style={styles.label}>Opacity</label><input type="number" step="0.1" max="1" style={styles.input} value={bindings[selectedId].static.opacity} onChange={(e) => updateBinding('static.opacity', e.target.value)}/></div>
                    <div style={styles.col}><label style={styles.label}>Blend</label>
                        <select style={styles.select} value={bindings[selectedId].static.mix_blend_mode} onChange={(e) => updateBinding('static.mix_blend_mode', e.target.value)}>
                            <option value="normal">Normal</option><option value="multiply">Multiply</option><option value="screen">Screen</option>
                        </select>
                    </div>
                </div>
                <div style={styles.row}>
                     <div style={styles.col}><label style={styles.label}>Blur</label><input type="range" max="20" style={{width:'100%'}} value={bindings[selectedId].static.blur} onChange={(e) => updateBinding('static.blur', e.target.value)}/></div>
                     <div style={styles.col}><label style={styles.label}>Shadow</label><input type="range" max="20" style={{width:'100%'}} value={bindings[selectedId].static.drop_shadow} onChange={(e) => updateBinding('static.drop_shadow', e.target.value)}/></div>
                </div>
                <div style={styles.row}>
                     <div style={styles.col}><label style={styles.label}>Line Cap</label>
                        <select style={styles.select} value={bindings[selectedId].static.stroke_linecap} onChange={(e) => updateBinding('static.stroke_linecap', e.target.value)}>
                            <option value="butt">Butt</option><option value="round">Round</option><option value="square">Square</option>
                        </select>
                     </div>
                </div>
            </Accordion>
            
            <div style={{padding: '20px'}}>
                <button style={styles.primaryBtn} onClick={generateDax}>⚡ GERAR CÓDIGO DAX</button>
            </div>
            
            {daxResult && (
                <div style={{padding:'10px'}}>
                    <AceEditor mode="sql" theme="monokai" value={daxResult} name="dax_output" width="100%" height="200px" fontSize={11} showGutter={false} />
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;