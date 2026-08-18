export type PondStatus = 'Aktif' | 'Non-aktif';
export type CycleStatus = 'Berjalan' | 'Selesai' | 'Jeda';

export interface FeedLog {
  id: string;
  cycleId: string;
  date: string; // ISO String
  feedAmountKg: number;
  feedType: string; // e.g. "Pelet 1mm"
  ancoResult: 'Habis' | 'Sisa Sedikit' | 'Sisa Banyak' | 'Belum Dicek';
  createdAt: string;
}

export interface ProbioticLog {
  id: string;
  cycleId: string;
  date: string;
  amountMl: number;
  probioticType: string;
  method: 'Ke Air' | 'Campur Pakan';
  createdAt: string;
}

export interface ActiveTimer {
  id: string;
  pondId: string;
  type: 'Pakan' | 'Cek Anco' | 'Probiotik';
  triggerTime: string; // ISO String
  dueTime: string; // ISO String
}

export interface Cycle {
  id: string;
  pondId: string;
  status: CycleStatus;
  startDate: string; // ISO String
  endDate?: string;
  initialShrimpCount: number;
  targetYieldKgPerM2: number;
  currentBiomassKg: number;
  currentAbwGram: number;
  createdAt: string;
}

export interface Pond {
  id: string;
  userId: string;
  name: string;
  areaM2: number;
  depthM: number;
  location: string;
  status: PondStatus;
  createdAt: string;
}

// ==========================================
// MOCK DATA
// ==========================================

let mockPonds: Pond[] = [
  {
    id: 'p-1',
    userId: 'u-1',
    name: 'Kolam Alpha',
    areaM2: 1000,
    depthM: 1.5,
    location: 'Blok A Utara',
    status: 'Aktif',
    createdAt: new Date('2026-05-01').toISOString(),
  },
  {
    id: 'p-2',
    userId: 'u-1',
    name: 'Kolam Beta',
    areaM2: 1200,
    depthM: 1.5,
    location: 'Blok A Selatan',
    status: 'Aktif',
    createdAt: new Date('2026-05-02').toISOString(),
  },
  {
    id: 'p-3',
    userId: 'u-1',
    name: 'Kolam Gamma',
    areaM2: 1500,
    depthM: 1.8,
    location: 'Blok B Timur',
    status: 'Aktif',
    createdAt: new Date('2026-05-15').toISOString(),
  },
  {
    id: 'p-4',
    userId: 'u-1',
    name: 'Kolam Delta',
    areaM2: 800,
    depthM: 1.2,
    location: 'Blok B Barat',
    status: 'Aktif',
    createdAt: new Date('2026-06-01').toISOString(),
  },
  {
    id: 'p-5',
    userId: 'u-1',
    name: 'Kolam Epsilon',
    areaM2: 2000,
    depthM: 2.0,
    location: 'Blok C Tengah',
    status: 'Non-aktif',
    createdAt: new Date('2026-07-10').toISOString(),
  }
];

let mockCycles: Cycle[] = [
  {
    id: 'c-1',
    pondId: 'p-1',
    status: 'Berjalan',
    startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // DOC 45
    initialShrimpCount: 100000,
    targetYieldKgPerM2: 3,
    currentBiomassKg: 540,
    currentAbwGram: 6.0,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c-2',
    pondId: 'p-2',
    status: 'Berjalan',
    startDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // DOC 21
    initialShrimpCount: 150000,
    targetYieldKgPerM2: 3.5,
    currentBiomassKg: 150,
    currentAbwGram: 1.5,
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c-3',
    pondId: 'p-3',
    status: 'Berjalan',
    startDate: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString(), // DOC 85 (Panen dekat)
    initialShrimpCount: 200000,
    targetYieldKgPerM2: 4,
    currentBiomassKg: 3200,
    currentAbwGram: 18.0,
    createdAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

let mockFeedLogs: FeedLog[] = [
  {
    id: 'f-1',
    cycleId: 'c-1',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Kemarin
    feedAmountKg: 7.5,
    feedType: 'Pelet 1.5mm',
    ancoResult: 'Habis',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'f-2',
    cycleId: 'c-2',
    date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 jam lalu
    feedAmountKg: 10.0,
    feedType: 'Pelet 2mm',
    ancoResult: 'Sisa Sedikit',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'f-3',
    cycleId: 'c-3',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 jam lalu
    feedAmountKg: 15.0,
    feedType: 'Pelet 2mm',
    ancoResult: 'Sisa Banyak',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  }
];

// Kita suntikkan beberapa timer awal agar Jadwal Terdekat di Dashboard terlihat penuh
let mockTimers: ActiveTimer[] = [
  {
    id: 't-init-1',
    pondId: 'p-1',
    type: 'Pakan',
    triggerTime: new Date().toISOString(),
    dueTime: new Date(Date.now() + 45 * 60 * 1000).toISOString() // 45 menit lagi
  },
  {
    id: 't-init-2',
    pondId: 'p-2',
    type: 'Cek Anco',
    triggerTime: new Date().toISOString(),
    dueTime: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 menit lagi
  },
  {
    id: 't-init-3',
    pondId: 'p-3',
    type: 'Probiotik',
    triggerTime: new Date().toISOString(),
    dueTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 jam lagi
  }
];

// ==========================================
// MOCK API FUNCTIONS (Simulasi Backend Delay)
// ==========================================
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getPonds(): Promise<Pond[]> {
  await delay(500);
  return [...mockPonds];
}

export async function getPondById(id: string): Promise<Pond | null> {
  await delay(300);
  return mockPonds.find(p => p.id === id) || null;
}

export async function addPond(data: Omit<Pond, 'id' | 'userId' | 'createdAt'>): Promise<Pond> {
  await delay(500);
  const newPond: Pond = {
    ...data,
    id: `p-${Date.now()}`,
    userId: 'u-1',
    createdAt: new Date().toISOString(),
  };
  mockPonds.push(newPond);
  return newPond;
}

export async function getActiveCycle(pondId: string): Promise<Cycle | null> {
  await delay(300);
  return mockCycles.find(c => c.pondId === pondId && c.status === 'Berjalan') || null;
}

export async function startCycle(data: Omit<Cycle, 'id' | 'status' | 'currentBiomassKg' | 'currentAbwGram' | 'createdAt'>): Promise<Cycle> {
  await delay(600);
  const newCycle: Cycle = {
    ...data,
    id: `c-${Date.now()}`,
    status: 'Berjalan',
    currentBiomassKg: 0,
    currentAbwGram: 0,
    createdAt: new Date().toISOString(),
  };
  mockCycles.push(newCycle);
  return newCycle;
}

export async function getRecentFeedLogs(cycleId: string): Promise<FeedLog[]> {
  await delay(400);
  return mockFeedLogs.filter(f => f.cycleId === cycleId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getAllFeedLogs(): Promise<{ log: FeedLog, pondName: string }[]> {
  await delay(400);
  const result = mockFeedLogs.map(log => {
    const cycle = mockCycles.find(c => c.id === log.cycleId);
    const pond = cycle ? mockPonds.find(p => p.id === cycle.pondId) : null;
    return {
      log,
      pondName: pond ? pond.name : 'Unknown Pond'
    };
  });
  
  return result.sort((a, b) => new Date(b.log.createdAt).getTime() - new Date(a.log.createdAt).getTime());
}

export async function getTimers(pondId?: string | null): Promise<ActiveTimer[]> {
  await delay(200);
  if (!pondId) return [...mockTimers];
  // Bersihkan timer yang sudah lewat jauh (opsional, tapi untuk demo kita return semua)
  return mockTimers.filter(t => t.pondId === pondId);
}

export async function setTimer(timer: Omit<ActiveTimer, 'id'>): Promise<ActiveTimer> {
  await delay(200);
  // Hapus timer tipe yang sama yang sudah ada untuk kolam ini (misal mau overwrite timer pakan sebelumnya)
  mockTimers = mockTimers.filter(t => !(t.pondId === timer.pondId && t.type === timer.type));
  
  const newTimer: ActiveTimer = {
    ...timer,
    id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
  };
  mockTimers.push(newTimer);
  return newTimer;
}

export async function deleteTimer(id: string): Promise<void> {
  await delay(200);
  mockTimers = mockTimers.filter(t => t.id !== id);
}

export async function fastForwardTimers(pondId: string, minutes: number): Promise<void> {
  await delay(200);
  mockTimers.forEach(t => {
    if (t.pondId === pondId) {
      t.dueTime = new Date(new Date(t.dueTime).getTime() - minutes * 60 * 1000).toISOString();
    }
  });
}
