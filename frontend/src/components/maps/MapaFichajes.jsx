import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Evita el bug de los iconos por defecto en Vite/webpack
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function makePin(color, letra) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:26px;height:34px;position:relative;display:flex;
      flex-direction:column;align-items:center;">
      <div style="
        width:24px;height:24px;border-radius:50% 50% 50% 0;
        background:${color};border:2.5px solid #fff;
        transform:rotate(-45deg);
        box-shadow:0 2px 8px rgba(0,0,0,.35);">
      </div>
      <span style="
        position:absolute;top:3px;left:50%;
        transform:translateX(-50%);
        color:#fff;font-size:10px;font-weight:700;
        font-family:sans-serif;line-height:1;">
        ${letra}
      </span>
    </div>`,
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -36],
  })
}

const ICONS = {
  entrada: makePin('#16a34a', 'E'),
  salida: makePin('#dc2626', 'S'),
}

export default function MapaFichajes({ points, height = 420 }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const groupRef = useRef(null)

  // Inicializar mapa (solo una vez al montar)
  useEffect(() => {
    if (!containerRef.current) return
    const map = L.map(containerRef.current, { center: [40.4168, -3.7038], zoom: 6 })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)
    mapRef.current = map
    groupRef.current = L.layerGroup().addTo(map)
    return () => {
      map.remove()
      mapRef.current = null
      groupRef.current = null
    }
  }, [])

  // Actualizar marcadores cuando cambian los puntos
  useEffect(() => {
    const map = mapRef.current
    const group = groupRef.current
    if (!map || !group) return

    group.clearLayers()
    if (points.length === 0) return

    const bounds = []

    points.forEach((pt) => {
      const icon = ICONS[pt.tipo] ?? ICONS.entrada
      const color = pt.tipo === 'entrada' ? '#16a34a' : '#dc2626'
      const tipoLabel = pt.tipo === 'entrada' ? '▶ Entrada' : '◀ Salida'
      const fechaStr = new Date(pt.timestamp).toLocaleDateString('es-ES')
      const horaStr = new Date(pt.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

      const marker = L.marker([pt.latitud, pt.longitud], { icon })
      marker.bindPopup(
        `<div style="min-width:210px;font-family:system-ui,sans-serif;">
          <p style="margin:0 0 5px;font-weight:700;font-size:14px">${pt.employeeName}</p>
          <p style="margin:3px 0;font-weight:600;color:${color};font-size:13px">${tipoLabel}</p>
          <p style="margin:3px 0;font-size:12px;color:#475569">${fechaStr} · ${horaStr}</p>
          <p style="margin:3px 0;font-size:11px;color:#94a3b8;font-family:monospace">
            ${pt.latitud.toFixed(6)}, ${pt.longitud.toFixed(6)}
          </p>
          <a href="https://www.google.com/maps?q=${pt.latitud},${pt.longitud}"
             target="_blank" rel="noopener noreferrer"
             style="display:inline-block;margin-top:8px;padding:5px 12px;
             background:#2563eb;color:#fff;border-radius:6px;
             font-size:12px;text-decoration:none;font-weight:600">
            Ver en Google Maps ↗
          </a>
        </div>`,
        { maxWidth: 280 },
      )
      group.addLayer(marker)
      bounds.push([pt.latitud, pt.longitud])
    })

    // Líneas punteadas entre fichajes del mismo empleado en el mismo día
    const byDayEmployee = {}
    points.forEach((pt) => {
      const dayKey = `${pt.employeeId}|${new Date(pt.timestamp).toISOString().slice(0, 10)}`
      if (!byDayEmployee[dayKey]) byDayEmployee[dayKey] = []
      byDayEmployee[dayKey].push(pt)
    })
    Object.values(byDayEmployee).forEach((pts) => {
      if (pts.length < 2) return
      const sorted = [...pts].sort((a, b) => a.timestamp - b.timestamp)
      L.polyline(sorted.map((p) => [p.latitud, p.longitud]), {
        color: '#94a3b8',
        weight: 2,
        dashArray: '6 4',
        opacity: 0.7,
      }).addTo(group)
    })

    // Ajustar zoom/bounds
    if (bounds.length === 1) {
      map.setView(bounds[0], 16)
    } else {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
    }

    // Invalidar tamaño por si el contenedor estaba oculto
    setTimeout(() => map.invalidateSize(), 80)
  }, [points])

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden border border-slate-200"
      style={{ height: `${height}px` }}
    />
  )
}
