'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

interface ActiveTimer {
  id: string
  pondId: string
  type: 'Pakan' | 'Cek Anco' | 'Probiotik'
  triggerTime: string
  dueTime: string
}

interface Pond {
  id: string
  name: string
}

interface TimerContextProps {
  activeTimers: ActiveTimer[]
  now: Date
  refreshTimers: () => void
}

const TimerContext = createContext<TimerContextProps>({
  activeTimers: [],
  now: new Date(),
  refreshTimers: () => {}
})

export const useTimerContext = () => useContext(TimerContext)

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([])
  const [ponds, setPonds] = useState<Pond[]>([])
  const [now, setNow] = useState(new Date())
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  
  const notifiedTimers = useRef<Set<string>>(new Set())

  // Register SW and check permission on mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.warn('SW failed:', err))
    }

    if ('Notification' in window && Notification.permission === 'default') {
      // Tampilkan modal perizinan dengan UX yang bagus untuk user awam
      setShowPermissionModal(true)
    }
  }, [])

  const handleRequestPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(() => {
        setShowPermissionModal(false)
      })
    }
  }

  const fetchTimers = async () => {
    try {
      const res = await fetch('/api/timers?all=true')
      if (res.ok) {
        const data = await res.json()
        setActiveTimers(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Fetch data kolam untuk pemetaan nama
  const fetchPonds = async () => {
    try {
      // Kita bisa buat API get ponds sederhana, tapi karena ini MVP kita hardcode mapping atau
      // kita fetch dari API. Untuk amannya kita biarkan kosong jika tidak ada API, atau kita fetch jika ada.
      // Asumsi ada endpoint /api/kolam, tapi jika belum ada, tidak masalah.
    } catch (e) {}
  }

  useEffect(() => {
    fetchTimers()
    fetchPonds()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = new Date()
      setNow(currentTime)

      if ('Notification' in window && Notification.permission === 'granted') {
        const dueTimers = activeTimers.filter(t => 
          new Date(t.dueTime).getTime() <= currentTime.getTime() && 
          !notifiedTimers.current.has(t.id)
        )

        if (dueTimers.length > 0) {
          // Tandai sudah dinotifikasi
          dueTimers.forEach(t => notifiedTimers.current.add(t.id))

          // Batching Logic (Anti-Spam)
          // Kelompokkan berdasarkan Tipe (Pakan, Cek Anco, dll)
          const groupedByType = dueTimers.reduce((acc, timer) => {
            if (!acc[timer.type]) acc[timer.type] = []
            acc[timer.type].push(timer)
            return acc
          }, {} as Record<string, ActiveTimer[]>)

          Object.entries(groupedByType).forEach(async ([type, timers]) => {
            let title = `Jadwal ${type} Tiba!`
            let body = `Waktunya eksekusi jadwal ${type} untuk kolam Anda.`
            
            if (timers.length > 1) {
              title = `Jadwal ${type} Tiba (Batch)`
              body = `Waktunya eksekusi jadwal ${type} untuk ${timers.length} kolam secara bersamaan!`
            }

            const options = { body, icon: '/favicon.ico' }

            try {
              if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.ready
                await reg.showNotification(title, options)
              } else {
                new Notification(title, options)
              }
            } catch (err) {
              try {
                new Notification(title, options)
              } catch (fallbackErr) {
                alert(`[Notifikasi Sistem]\n\n${title}\n${options.body}`)
              }
            }
          })
        }
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [activeTimers])

  return (
    <TimerContext.Provider value={{ activeTimers, now, refreshTimers: fetchTimers }}>
      {children}
      
      {/* Welcome Permission Modal UI */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#002530]/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full  animate-in fade-in zoom-in duration-300">
            <div className="w-12 h-12 bg-[#56C1CD]/20 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">🔔</span>
            </div>
            <h3 className="text-lg font-bold text-center text-[#0A4D58] mb-2">
              Aktifkan Notifikasi Cerdas
            </h3>
            <p className="text-sm text-center text-[#002530]/70 mb-6 leading-relaxed">
              Agar Anda tidak pernah terlewat jadwal pakan dan probiotik, Prima butuh izin untuk mengirimkan pengingat ke layar Anda.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleRequestPermission}
                className="w-full bg-[#56C1CD] hover:bg-[#7FD3DC] text-[#002530] font-semibold py-3 rounded-xl transition-all"
              >
                Izinkan Notifikasi
              </button>
              <button 
                onClick={() => setShowPermissionModal(false)}
                className="w-full bg-transparent hover:bg-gray-100 text-gray-500 font-medium py-3 rounded-xl transition-all"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}
    </TimerContext.Provider>
  )
}
