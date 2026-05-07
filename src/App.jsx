import { useState, useEffect, useRef } from 'react'

const KEY       = 'ejercicio-cama-v1'
const KEY_PROX  = 'ejercicio-cama-proximo'
const MESES     = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS      = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const DIAS_GRID = ['Lu','Ma','Mi','Ju','Vi','Sá','Do']

const pad = v => String(v).padStart(2, '0')
function hoy() { return new Date() }
function fechaLocal(d = hoy()) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
function horaLocal(d = hoy())  { return `${pad(d.getHours())}:${pad(d.getMinutes())}` }
function semanaLimites(d = hoy()) {
  const dow = d.getDay(), diff = dow === 0 ? -6 : 1 - dow
  const lun = new Date(d); lun.setDate(d.getDate() + diff)
  const dom = new Date(lun); dom.setDate(lun.getDate() + 6)
  return { inicio: fechaLocal(lun), fin: fechaLocal(dom) }
}
function leerLS()       { try { return JSON.parse(localStorage.getItem(KEY))      || [] }   catch { return [] } }
function guardarLS(arr) { localStorage.setItem(KEY, JSON.stringify(arr)) }
function leerProx()     { try { return JSON.parse(localStorage.getItem(KEY_PROX)) || null } catch { return null } }
function guardarProx(v) { localStorage.setItem(KEY_PROX, JSON.stringify(v)) }

function calcularCuenta(fecha, hora) {
  if (!fecha || !hora) return null
  const diff = new Date(`${fecha}T${hora}:00`) - hoy()
  if (diff <= 0) return { pasado: true }
  const s = Math.floor(diff / 1000)
  return { pasado: false, dias: Math.floor(s/86400), horas: Math.floor((s%86400)/3600), minutos: Math.floor((s%3600)/60), segundos: s%60 }
}

const Ico = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)
const IcoCama    = () => <Ico size={22} d="M3 20v-5a2 2 0 012-2h14a2 2 0 012 2v5M3 15V9a2 2 0 012-2h3v8M10 7h4a2 2 0 012 2v6h-6V9a2 2 0 010 0M2 20h20" />
const IcoFecha   = () => <Ico d="M3 5h18M3 5v14a2 2 0 002 2h14a2 2 0 002-2V5M16 3v4M8 3v4M3 10h18" />
const IcoHora    = () => <Ico d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2" />
const IcoBasura  = () => <Ico size={14} d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6" />
const IcoCheck   = () => <Ico size={18} d="M20 6L9 17l-5-5" />
const IcoEditar  = () => <Ico size={14} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
const IcoX       = () => <Ico size={14} d="M18 6L6 18M6 6l12 12" />
const IcoCampana = () => <Ico size={16} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
const IcoReloj   = () => <Ico size={15} d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l3 3" />
const IcoExport  = () => <Ico size={15} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
const IcoImport  = () => <Ico size={15} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />

function Toast({ msg, ok }) {
  return (
    <div style={{
      position:'fixed', top:20, left:'50%', transform:'translateX(-50%)',
      background: ok ? '#2d5a30' : '#8b2a1a', color:'#fff',
      padding:'10px 22px', borderRadius:4, fontSize:13, fontWeight:700,
      letterSpacing:'.03em', boxShadow:'0 4px 20px rgba(0,0,0,.25)',
      zIndex:9999, animation:'toastIn .22s ease', whiteSpace:'nowrap',
      display:'flex', alignItems:'center', gap:8,
    }}>
      {ok ? <IcoCheck /> : '\u2715'} {msg}
    </div>
  )
}

function Stat({ label, value, sub, color }) {
  return (
    <div style={{ flex:1, textAlign:'center', padding:'20px 8px', background:'var(--cream)', border:'1px solid var(--border)', borderTop:`3px solid ${color}` }}>
      <div style={{ fontFamily:"'Playfair Display', serif", fontSize:44, fontWeight:900, lineHeight:1, color }}>{value}</div>
      <div style={{ fontSize:11, fontWeight:700, color:'var(--ink2)', textTransform:'uppercase', letterSpacing:'.08em', marginTop:6 }}>{label}</div>
      <div style={{ fontSize:11, color:'var(--ink3)', marginTop:3 }}>{sub}</div>
    </div>
  )
}

function ProximoEjercicio({ mostrarToast }) {
  const [proximo,  setProximo]  = useState(leerProx)
  const [editProx, setEditProx] = useState(false)
  const [pFecha,   setPFecha]   = useState('')
  const [pHora,    setPHora]    = useState('08:00')
  const [cuenta,   setCuenta]   = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (editProx) { setPFecha(proximo?.fecha || fechaLocal()); setPHora(proximo?.hora || '08:00') }
  }, [editProx])

  useEffect(() => {
    const tick = () => setCuenta(proximo ? calcularCuenta(proximo.fecha, proximo.hora) : null)
    tick()
    timerRef.current = setInterval(tick, 1000)
    return () => clearInterval(timerRef.current)
  }, [proximo])

  const guardarProximo = () => {
    if (!pFecha || !pHora) { mostrarToast('Completa fecha y hora', false); return }
    const nuevo = { fecha: pFecha, hora: pHora }
    setProximo(nuevo); guardarProx(nuevo); setEditProx(false)
    mostrarToast('¡Próximo ejercicio programado!')
  }

  const borrarProximo = () => { setProximo(null); guardarProx(null); setEditProx(false); mostrarToast('Programación eliminada', false) }

  const fechaBonita = (fecha, hora) => {
    if (!fecha) return 'dd/mm/aaaa'
    const d = new Date(`${fecha}T12:00:00`)
    return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]} · ${hora}`
  }

  return (
    <div style={{ marginTop:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--ink3)' }}>
          <IcoCampana /> Próximo ejercicio
        </div>
        <button onClick={() => setEditProx(v => !v)} style={{
          fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em',
          padding:'5px 10px', background: editProx ? 'var(--ink)' : 'transparent',
          color: editProx ? '#fff' : 'var(--ink3)', border:'1px solid var(--border)',
          cursor:'pointer', borderRadius:2, transition:'all .15s', fontFamily:"'Lato', sans-serif",
        }}>
          {editProx ? 'Cancelar' : proximo ? 'Cambiar' : 'Próximo →'}
        </button>
      </div>

      {editProx && (
        <div style={{ padding:'16px', marginBottom:12, background:'var(--cream)', border:'1px solid var(--border)', borderTop:'2px solid var(--ink)', animation:'fadeUp .2s ease both' }}>
          <div style={{ display:'flex', gap:10, marginBottom:12 }}>
            <div style={{ flex:1 }}>
              <label style={estiloLabelSm}>Fecha</label>
              <input type="date" value={pFecha} onChange={e => setPFecha(e.target.value)} style={estiloInputSm} />
            </div>
            <div style={{ flex:1 }}>
              <label style={estiloLabelSm}>Hora</label>
              <input type="time" value={pHora} onChange={e => setPHora(e.target.value)} style={estiloInputSm} />
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={guardarProximo} style={{ flex:2, padding:'9px', background:'var(--ink)', color:'#fff', border:'2px solid var(--ink)', fontFamily:"'Lato', sans-serif", fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', cursor:'pointer', transition:'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background='var(--rust)'; e.currentTarget.style.borderColor='var(--rust)' }}
              onMouseLeave={e => { e.currentTarget.style.background='var(--ink)';  e.currentTarget.style.borderColor='var(--ink)' }}>
              Guardar
            </button>
            {proximo && (
              <button onClick={borrarProximo} style={{ flex:1, padding:'9px', background:'transparent', color:'var(--rust)', border:'1px solid rgba(192,83,58,0.4)', fontFamily:"'Lato', sans-serif", fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', cursor:'pointer', transition:'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background='#fde8e4' }}
                onMouseLeave={e => { e.currentTarget.style.background='transparent' }}>
                Quitar
              </button>
            )}
          </div>
        </div>
      )}

      <div style={{ background:'var(--cream)', border:'1px solid var(--border)', borderLeft: proximo && !cuenta?.pasado ? '3px solid var(--rust)' : '3px solid var(--border)', padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: proximo ? 12 : 0 }}>
          <IcoReloj />
          <span style={{ fontSize:13, color: proximo ? 'var(--ink)' : 'var(--ink3)', fontWeight: proximo ? 600 : 400 }}>
            {proximo
              ? <><span>Programado: </span><strong style={{ color:'var(--rust)' }}>{fechaBonita(proximo.fecha, proximo.hora)}</strong></>
              : <em>Sin próximo ejercicio programado</em>
            }
          </span>
        </div>

        {proximo && cuenta && !cuenta.pasado && (
          <div>
            <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--ink3)', marginBottom:8 }}>Tiempo restante</div>
            <div style={{ display:'flex', gap:8 }}>
              {[{ v: pad(cuenta.dias), u:'días' }, { v: pad(cuenta.horas), u:'horas' }, { v: pad(cuenta.minutos), u:'min' }, { v: pad(cuenta.segundos), u:'seg' }].map(({ v, u }) => (
                <div key={u} style={{ flex:1, textAlign:'center', background:'var(--paper)', border:'1px solid var(--border)', padding:'10px 4px' }}>
                  <div style={{ fontFamily:"'Playfair Display', serif", fontSize:26, fontWeight:900, lineHeight:1, color:'var(--rust)' }}>{v}</div>
                  <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--ink3)', marginTop:4 }}>{u}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {proximo && cuenta?.pasado && (
          <div style={{ marginTop:4, padding:'10px 12px', background:'rgba(90,122,94,0.1)', border:'1px solid rgba(90,122,94,0.3)', fontSize:12, color:'var(--sage)', fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
            <IcoCheck /> ¡Fecha alcanzada! Recuerda registrar tu sesión.
          </div>
        )}
      </div>
    </div>
  )
}

function Fila({ rec, recAnterior, onBorrar, onEditar }) {
  const [editando, setEditando] = useState(false)
  const [eFecha,   setEFecha]   = useState(rec.fecha)
  const [eHora,    setEHora]    = useState(rec.hora)
  const d = new Date(`${rec.fecha}T${rec.hora}:00`)
  
  // Calcular días desde el registro anterior
  const diasDiferencia = recAnterior 
    ? Math.floor((new Date(`${rec.fecha}T12:00:00`) - new Date(`${recAnterior.fecha}T12:00:00`)) / (1000 * 60 * 60 * 24))
    : null
  
  const cancelar  = () => { setEFecha(rec.fecha); setEHora(rec.hora); setEditando(false) }
  const confirmar = () => {
    if (!eFecha || !eHora) return
    if (new Date(`${eFecha}T12:00:00`).getFullYear() !== hoy().getFullYear()) return
    onEditar(rec.id, eFecha, eHora); setEditando(false)
  }
  return (
    <div style={{ borderBottom:'1px solid var(--border)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background: editando ? 'var(--warm)' : 'transparent', transition:'background .15s' }}
        onMouseEnter={e => { if (!editando) e.currentTarget.style.background = 'var(--warm)' }}
        onMouseLeave={e => { if (!editando) e.currentTarget.style.background = 'transparent' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, flex:1 }}>
          <div style={{ width:40, height:40, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--cream)', border:'1px solid var(--border)', fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:900, color: editando ? 'var(--gold)' : 'var(--rust)' }}>
            {d.getDate()}
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--ink)' }}>{DIAS[d.getDay()]}, {d.getDate()} de {MESES[d.getMonth()]} {d.getFullYear()}</div>
            <div style={{ fontSize:12, color:'var(--ink3)', marginTop:2, display:'flex', alignItems:'center', gap:5 }}><IcoHora /> {rec.hora}</div>
            {diasDiferencia !== null && (
              <div style={{ fontSize:14, color:'var(--sage)', marginTop:4, fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ width:4, height:4, background:'var(--sage)', borderRadius:'50%' }}></span>
                +{diasDiferencia} día{diasDiferencia !== 1 ? 's' : ''} desde anterior
              </div>
            )}
          </div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={() => editando ? cancelar() : setEditando(true)} title={editando ? 'Cancelar' : 'Editar'} style={{ padding:'7px 8px', border:'1px solid var(--border)', background: editando ? '#fef9ec' : 'transparent', color: editando ? 'var(--gold)' : 'var(--ink3)', cursor:'pointer', borderRadius:2, transition:'all .15s', display:'flex', alignItems:'center' }}
            onMouseEnter={e => { e.currentTarget.style.background='#fef9ec'; e.currentTarget.style.color='var(--gold)' }}
            onMouseLeave={e => { if (!editando) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--ink3)' } }}>
            {editando ? <IcoX /> : <IcoEditar />}
          </button>
          <button onClick={() => onBorrar(rec.id)} title="Eliminar" style={{ padding:'7px 8px', border:'1px solid var(--border)', background:'transparent', color:'var(--ink3)', cursor:'pointer', borderRadius:2, transition:'all .15s', display:'flex', alignItems:'center' }}
            onMouseEnter={e => { e.currentTarget.style.background='#fde8e4'; e.currentTarget.style.color='var(--rust)' }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--ink3)' }}>
            <IcoBasura />
          </button>
        </div>
      </div>
      {editando && (
        <div style={{ padding:'14px 16px 16px', background:'#fefcf5', borderTop:'1px dashed rgba(184,147,58,0.4)', animation:'fadeUp .2s ease both' }}>
          <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--gold)', marginBottom:12 }}>
            Editar registro
          </div>
          <div style={{ display:'flex', gap:10, marginBottom:12 }}>
            <div style={{ flex:1 }}>
              <label style={estiloLabelSm}>Fecha</label>
              <input type="date" value={eFecha} min={`${hoy().getFullYear()}-01-01`} max={`${hoy().getFullYear()}-12-31`} onChange={e => setEFecha(e.target.value)} style={estiloInputSm} />
            </div>
            <div style={{ flex:1 }}>
              <label style={estiloLabelSm}>Hora</label>
              <input type="time" value={eHora} onChange={e => setEHora(e.target.value)} style={estiloInputSm} />
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={confirmar} style={{ flex:2, padding:'9px', background:'var(--ink)', color:'#fff', border:'2px solid var(--ink)', fontFamily:"'Lato', sans-serif", fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', cursor:'pointer', transition:'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background='var(--gold)'; e.currentTarget.style.borderColor='var(--gold)' }}
              onMouseLeave={e => { e.currentTarget.style.background='var(--ink)';  e.currentTarget.style.borderColor='var(--ink)' }}>
              Guardar cambios
            </button>
            <button onClick={cancelar} style={{ flex:1, padding:'9px', background:'transparent', color:'var(--ink3)', border:'1px solid var(--border)', fontFamily:"'Lato', sans-serif", fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', cursor:'pointer', transition:'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background='var(--warm)' }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Vacio() {
  return (
    <div style={{ textAlign:'center', padding:'48px 24px', color:'var(--ink3)', fontSize:14 }}>
      <div style={{ fontSize:36, marginBottom:12 }}>&#128716;</div>
      Sin registros en este período
    </div>
  )
}

export default function App() {
  const [registros, setRegistros] = useState([])
  const [tab,       setTab]       = useState('registrar')
  const [fecha,     setFecha]     = useState(fechaLocal())
  const [hora,      setHora]      = useState(horaLocal())
  const [toast,     setToast]     = useState(null)
  const [animKey,   setAnimKey]   = useState(0)
  const importarRef = useRef(null)

  const ahora      = hoy()
  const anioActual = ahora.getFullYear()
  const mesActual  = `${anioActual}-${pad(ahora.getMonth()+1)}`
  const semana     = semanaLimites(ahora)

  useEffect(() => { setRegistros(leerLS()) }, [])

  const mostrarToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2800) }

  const guardar = () => {
    if (!fecha || !hora) { mostrarToast('Completa fecha y hora', false); return }
    if (new Date(`${fecha}T12:00:00`).getFullYear() !== anioActual) { mostrarToast(`Solo fechas de ${anioActual}`, false); return }
    const nuevo = { id: Date.now(), fecha, hora }
    const act = [nuevo, ...registros].sort((a,b) => `${b.fecha}${b.hora}`.localeCompare(`${a.fecha}${a.hora}`))
    setRegistros(act); guardarLS(act); setAnimKey(k => k+1); mostrarToast('¡Sesión guardada!')
  }

  const borrar = (id) => {
    const act = registros.filter(r => r.id !== id)
    setRegistros(act); guardarLS(act); mostrarToast('Registro eliminado', false)
  }

  const editar = (id, nf, nh) => {
    const act = registros.map(r => r.id === id ? { ...r, fecha: nf, hora: nh } : r)
      .sort((a,b) => `${b.fecha}${b.hora}`.localeCompare(`${a.fecha}${a.hora}`))
    setRegistros(act); guardarLS(act); mostrarToast('¡Registro actualizado!')
  }

  // Exportar JSON
  const exportar = () => {
    const datos = { version:1, exportado: new Date().toISOString(), registros, proximo: leerProx() }
    const blob  = new Blob([JSON.stringify(datos, null, 2)], { type:'application/json' })
    const url   = URL.createObjectURL(blob)
    const a     = document.createElement('a')
    a.href = url
    a.download = `ejercicio-cama-respaldo-${fechaLocal()}.json`
    a.click()
    URL.revokeObjectURL(url)
    mostrarToast(`Respaldo descargado (${registros.length} registros)`)
  }

  // Importar JSON
  const importar = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const datos = JSON.parse(ev.target.result)
        if (!Array.isArray(datos.registros)) throw new Error()
        const validos = datos.registros.filter(r => r.id && r.fecha && r.hora)
        const mapa = {}
        registros.forEach(r => { mapa[r.id] = r })
        validos.forEach(r => { mapa[r.id] = r })
        const fusionados = Object.values(mapa).sort((a,b) => `${b.fecha}${b.hora}`.localeCompare(`${a.fecha}${a.hora}`))
        setRegistros(fusionados); guardarLS(fusionados)
        if (datos.proximo?.fecha && datos.proximo?.hora) guardarProx(datos.proximo)
        mostrarToast(`¡${validos.length} registros importados!`)
      } catch { mostrarToast('Archivo no válido', false) }
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  const porAnio   = registros.filter(r => r.fecha.startsWith(String(anioActual)))
  const porMes    = registros.filter(r => r.fecha.startsWith(mesActual))
  const porSemana = registros.filter(r => r.fecha >= semana.inicio && r.fecha <= semana.fin)

  const agrupar = (lista) => {
    const g = {}
    lista.forEach(r => { const k = r.fecha.slice(0,7); if (!g[k]) g[k]=[]; g[k].push(r) })
    return Object.entries(g).sort((a,b) => b[0].localeCompare(a[0]))
  }

  function celdas() {
    const yr = ahora.getFullYear(), mo = ahora.getMonth()
    const dow = new Date(yr, mo, 1).getDay(), tot = new Date(yr, mo+1, 0).getDate()
    const off = dow === 0 ? 6 : dow - 1
    const arr = Array(off).fill(null)
    for (let d=1; d<=tot; d++) arr.push(d)
    return arr
  }

  function sesionesEnDia(dia) {
    if (!dia) return 0
    const ds = `${anioActual}-${pad(ahora.getMonth()+1)}-${pad(dia)}`
    return registros.filter(r => r.fecha === ds).length
  }

  const tabsConsulta = [
    { id:'anio',   color:'var(--rust)', lista: porAnio   },
    { id:'mes',    color:'var(--sage)', lista: porMes    },
    { id:'semana', color:'var(--gold)', lista: porSemana },
  ]
  const tabConsulta = tabsConsulta.find(t => t.id === tab) || tabsConsulta[0]

  return (
    <div style={{ maxWidth:480, margin:'0 auto', minHeight:'100vh', background:'var(--paper)', borderLeft:'1px solid var(--border)', borderRight:'1px solid var(--border)' }}>
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      <header style={{ padding:'36px 24px 24px', borderBottom:'2px solid var(--ink)', background:'var(--cream)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <span style={{ color:'var(--rust)' }}><IcoCama /></span>
          <h1 style={{ fontFamily:"'Playfair Display', serif", fontSize:24, fontWeight:900, color:'var(--ink)', letterSpacing:'-.3px' }}>
            Ejercicio de Cama
          </h1>
        </div>
        <p style={{ fontSize:12, color:'var(--ink3)', fontWeight:300, letterSpacing:'.05em', textTransform:'uppercase' }}>
          Registro de actividad &middot; {anioActual}
        </p>
      </header>

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)' }}>
        <Stat label="Este a&ntilde;o"             sub="sesiones"     value={porAnio.length}   color="var(--rust)" />
        <Stat label={MESES[ahora.getMonth()]}      sub="este mes"     value={porMes.length}    color="var(--sage)" />
        <Stat label="Esta semana"                  sub="d&iacute;as activos" value={porSemana.length} color="var(--gold)" />
      </div>

      <nav style={{ display:'flex', borderBottom:'2px solid var(--ink)', background:'var(--cream)' }}>
        {[{id:'registrar',label:'Registrar'},{id:'anio',label:'A&ntilde;o'},{id:'mes',label:'Mes'},{id:'semana',label:'Semana'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex:1, padding:'13px 4px', fontFamily:"'Lato', sans-serif", fontSize:12, fontWeight:700,
            textTransform:'uppercase', letterSpacing:'.06em', border:'none', borderRight:'1px solid var(--border)',
            background: tab === t.id ? 'var(--ink)' : 'var(--cream)', color: tab === t.id ? '#fff' : 'var(--ink3)',
            cursor:'pointer', transition:'all .15s',
          }} dangerouslySetInnerHTML={{__html: t.label}} />
        ))}
      </nav>

      <main style={{ padding:'24px', animation:'fadeUp .3s ease both' }} key={tab}>

        {tab === 'registrar' && (
          <div>
            <p style={{ fontSize:13, color:'var(--ink3)', marginBottom:24, lineHeight:1.6, borderLeft:'3px solid var(--rust)', paddingLeft:12 }}>
              Registra cada sesi&oacute;n de <strong style={{ color:'var(--ink)' }}>Ejercicio de Cama</strong> con su fecha y hora exacta.
            </p>

            <label style={estiloLabel}><span style={{ display:'flex', alignItems:'center', gap:7 }}><IcoFecha /> Fecha</span></label>
            <input type="date" value={fecha} min={`${anioActual}-01-01`} max={`${anioActual}-12-31`} onChange={e => setFecha(e.target.value)} style={estiloInput} />

            <label style={{ ...estiloLabel, marginTop:18 }}><span style={{ display:'flex', alignItems:'center', gap:7 }}><IcoHora /> Hora</span></label>
            <input type="time" value={hora} onChange={e => setHora(e.target.value)} style={estiloInput} />

            <button onClick={guardar} style={{ marginTop:24, width:'100%', padding:'15px', background:'var(--ink)', color:'#fff', border:'2px solid var(--ink)', fontFamily:"'Lato', sans-serif", fontSize:13, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', cursor:'pointer', transition:'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background='var(--rust)'; e.currentTarget.style.borderColor='var(--rust)' }}
              onMouseLeave={e => { e.currentTarget.style.background='var(--ink)';  e.currentTarget.style.borderColor='var(--ink)' }}>
              Guardar sesi&oacute;n
            </button>

            {registros.length > 0 && (
              <div key={animKey} style={{ marginTop:20, padding:'14px 16px', background:'var(--cream)', border:'1px solid var(--border)', borderLeft:'3px solid var(--sage)', fontSize:13, color:'var(--ink2)', animation:'pop .3s ease' }}>
                <span style={{ fontWeight:700, color:'var(--sage)' }}>Último registro: </span>
                {(() => { const u = registros[0]; const d = new Date(`${u.fecha}T${u.hora}:00`); return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]} · ${u.hora}` })()}
              </div>
            )}

            <ProximoEjercicio mostrarToast={mostrarToast} />
          </div>
        )}

        {(tab === 'anio' || tab === 'mes' || tab === 'semana') && (
          <div>
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:20, paddingBottom:12, borderBottom:'1px solid var(--border)' }}>
              <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:20, fontWeight:900, color:'var(--ink)' }}>
                {tab === 'anio' && `Año ${anioActual}`}
                {tab === 'mes'  && `${MESES[ahora.getMonth()]} ${anioActual}`}
                {tab === 'semana' && 'Semana actual'}
              </h2>
              <span style={{ fontFamily:"'Playfair Display', serif", fontSize:28, fontWeight:900, color: tabConsulta.color }}>
                {tabConsulta.lista.length}
                <span style={{ fontSize:13, fontWeight:400, color:'var(--ink3)', fontFamily:"'Lato', sans-serif", marginLeft:5 }}>
                  sesi&oacute;n{tabConsulta.lista.length !== 1 ? 'es' : ''}
                </span>
              </span>
            </div>

            {tab === 'mes' && (
              <div style={{ marginBottom:24, border:'1px solid var(--border)', background:'var(--cream)' }}>
                <div style={{ padding:'10px 12px', borderBottom:'1px solid var(--border)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--ink3)' }}>
                  {MESES[ahora.getMonth()]} {anioActual}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:1, padding:'8px 8px 4px' }}>
                  {DIAS_GRID.map(d => <div key={d} style={{ textAlign:'center', fontSize:10, fontWeight:700, color:'var(--ink3)', textTransform:'uppercase' }}>{d}</div>)}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, padding:'0 8px 8px' }}>
                  {celdas().map((dia, i) => {
                    const n = sesionesEnDia(dia), esHoy = dia === ahora.getDate()
                    return (
                      <div key={i} title={n > 0 ? `${n} sesión(es)` : ''} style={{ aspectRatio:'1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', borderRadius:2, background: n > 0 ? 'var(--rust)' : esHoy ? 'var(--warm)' : 'transparent', border: esHoy ? '1px solid var(--ink3)' : '1px solid transparent', fontSize:12, fontWeight: n>0||esHoy ? 700 : 400, color: n > 0 ? '#fff' : esHoy ? 'var(--ink)' : dia ? 'var(--ink2)' : 'transparent' }}>
                        {dia || ''}
                        {n > 1 && <span style={{ fontSize:8, lineHeight:1 }}>{n}x</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {tab === 'semana' && (
              <div style={{ marginBottom:16, padding:'10px 14px', background:'var(--cream)', border:'1px solid var(--border)', fontSize:12, color:'var(--ink3)' }}>
                Del <strong>{semana.inicio}</strong> al <strong>{semana.fin}</strong>
              </div>
            )}

            {tab === 'anio' ? (
              porAnio.length === 0 ? <Vacio /> :
              agrupar(porAnio).map(([clave, lista]) => {
                const [yr, mo] = clave.split('-')
                return (
                  <div key={clave} style={{ marginBottom:24 }}>
                    <div style={{ padding:'7px 0', marginBottom:4, borderBottom:'2px solid var(--ink)', display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                      <span style={{ fontFamily:"'Playfair Display', serif", fontSize:15, fontWeight:700, color:'var(--ink)' }}>{MESES[parseInt(mo)-1]} {yr}</span>
                      <span style={{ fontSize:12, color:'var(--ink3)', fontWeight:700 }}>{lista.length} sesi&oacute;n{lista.length !== 1 ? 'es' : ''}</span>
                    </div>
                    {lista.map((r, idx) => {
                      const globalIdx = porAnio.indexOf(r)
                      const recAnterior = globalIdx < porAnio.length - 1 ? porAnio[globalIdx + 1] : null
                      return <Fila key={r.id} rec={r} recAnterior={recAnterior} onBorrar={borrar} onEditar={editar} />
                    })}
                  </div>
                )
              })
            ) : (
              tabConsulta.lista.length === 0 ? <Vacio /> :
              tabConsulta.lista.map((r, idx) => <Fila key={r.id} rec={r} recAnterior={idx < tabConsulta.lista.length - 1 ? tabConsulta.lista[idx+1] : null} onBorrar={borrar} onEditar={editar} />)
            )}
          </div>
        )}
      </main>

      {/* RESPALDO */}
      <footer style={{ borderTop:'2px solid var(--ink)', background:'var(--cream)' }}>
        <div style={{ padding:'16px 24px 0', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:16 }}>&#128190;</span>
          <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--ink2)' }}>
            Respaldo de datos
          </span>
        </div>

        <p style={{ padding:'8px 24px 0', fontSize:12, color:'var(--ink3)', lineHeight:1.6 }}>
          Exporta tus datos como archivo <strong>.json</strong> a tu computador e imp&oacute;rtalos
          cuando quieras para restaurarlos.
        </p>

        <div style={{ display:'flex', gap:10, padding:'14px 24px' }}>
          <button onClick={exportar} style={{
            flex:1, padding:'12px 8px', background:'var(--ink)', color:'#fff', border:'2px solid var(--ink)',
            fontFamily:"'Lato', sans-serif", fontSize:12, fontWeight:700, textTransform:'uppercase',
            letterSpacing:'.07em', cursor:'pointer', transition:'all .15s',
            display:'flex', alignItems:'center', justifyContent:'center', gap:7,
          }}
          onMouseEnter={e => { e.currentTarget.style.background='var(--sage)'; e.currentTarget.style.borderColor='var(--sage)' }}
          onMouseLeave={e => { e.currentTarget.style.background='var(--ink)';  e.currentTarget.style.borderColor='var(--ink)' }}>
            <IcoExport /> Exportar
          </button>

          <input ref={importarRef} type="file" accept=".json" onChange={importar} style={{ display:'none' }} />
          <button onClick={() => importarRef.current?.click()} style={{
            flex:1, padding:'12px 8px', background:'transparent', color:'var(--ink)', border:'2px solid var(--ink)',
            fontFamily:"'Lato', sans-serif", fontSize:12, fontWeight:700, textTransform:'uppercase',
            letterSpacing:'.07em', cursor:'pointer', transition:'all .15s',
            display:'flex', alignItems:'center', justifyContent:'center', gap:7,
          }}
          onMouseEnter={e => { e.currentTarget.style.background='var(--warm)' }}
          onMouseLeave={e => { e.currentTarget.style.background='transparent' }}>
            <IcoImport /> Importar
          </button>
        </div>

        <div style={{ padding:'0 24px 14px', fontSize:11, color:'var(--ink3)', display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--sage)', display:'inline-block', flexShrink:0 }} />
          {registros.length} registro{registros.length !== 1 ? 's' : ''} almacenado{registros.length !== 1 ? 's' : ''} en este navegador
        </div>
      </footer>
    </div>
  )
}

const estiloLabel = { display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--ink3)', marginBottom:8 }
const estiloInput = { width:'100%', padding:'12px 14px', border:'1px solid var(--border)', borderBottom:'2px solid var(--ink)', background:'var(--cream)', color:'var(--ink)', fontSize:15, fontFamily:"'Lato', sans-serif", outline:'none', boxSizing:'border-box' }
const estiloLabelSm = { display:'block', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--ink3)', marginBottom:6 }
const estiloInputSm = { width:'100%', padding:'9px 10px', border:'1px solid var(--border)', borderBottom:'2px solid var(--gold)', background:'var(--paper)', color:'var(--ink)', fontSize:13, fontFamily:"'Lato', sans-serif", outline:'none', boxSizing:'border-box' }
