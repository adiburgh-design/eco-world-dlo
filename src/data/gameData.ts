import { AvatarDef, BadgeDef, Clue3D, DatabaseState, MissionDef } from '../types/game';

export const STORAGE_KEY = 'ecoworld_3d_bm6_v1';

export const BADGES_DEF: BadgeDef[] = [
  {
    id: 'eco_explorer',
    name: 'Eco Explorer',
    icon: '🧭',
    desc: 'Menjelajah & melepasi Misi 1 dan Misi 2 dengan skor ≥ 70%.',
  },
  {
    id: 'listening_detective',
    name: 'Listening Detective',
    icon: '🎧',
    desc: 'Mengesan maklumat tersurat & tersirat dengan cemerlang (Misi 1 ≥ 80%).',
  },
  {
    id: 'critical_thinker',
    name: 'Critical Thinker',
    icon: '🧠',
    desc: 'Menguasai analisis punca-kesan & penilaian penyelesaian (Misi 2 & 3 ≥ 75%).',
  },
  {
    id: 'brilliant_speaker',
    name: 'Brilliant Speaker',
    icon: '🎙️',
    desc: 'Membina hujah kritis & melengkapkan latihan bertutur di Makmal Suara.',
  },
  {
    id: 'eco_hero',
    name: 'Eco Hero',
    icon: '🏆',
    desc: 'Menjayakan Kempen Digital PBL: Selamatkan EcoWorld!',
  },
];

export const AVATARS: AvatarDef[] = [
  {
    id: 'rimba',
    name: 'Ejen Rimba',
    emoji: '🦊',
    primaryColor: '#16a34a',
    accentColor: '#f59e0b',
    tagline: 'Penjaga Hutan & Flora',
  },
  {
    id: 'tirta',
    name: 'Ejen Tirta',
    emoji: '🐬',
    primaryColor: '#0284c7',
    accentColor: '#38bdf8',
    tagline: 'Penyiasat Sungai & Laut',
  },
  {
    id: 'bayu',
    name: 'Ejen Bayu',
    emoji: '🦅',
    primaryColor: '#0d9488',
    accentColor: '#facc15',
    tagline: 'Pemantau Kualiti Udara',
  },
  {
    id: 'suara',
    name: 'Ejen Suara',
    emoji: '🦁',
    primaryColor: '#d97706',
    accentColor: '#fde047',
    tagline: 'Pemidato Generasi Prihatin',
  },
];

export const DEFAULT_MISSIONS: MissionDef[] = [
  {
    id: 1,
    title: 'Zon Sungai Tercemar',
    shortTitle: 'Sungai Tercemar',
    focus: 'Mendengar & Maklumat Tersurat/Tersirat',
    icon: '🌊',
    maxXp: 150,
    active: true,
    color: '#0ea5e9',
    position: [-15, 0, 10],
  },
  {
    id: 2,
    title: 'Bandar Udara Beracun',
    shortTitle: 'Bandar Beracun',
    focus: 'Analisis Punca, Kesan & KBAT',
    icon: '🏭',
    maxXp: 180,
    active: true,
    color: '#f97316',
    position: [-14, 0, -12],
  },
  {
    id: 3,
    title: 'Hutan Harapan',
    shortTitle: 'Hutan Harapan',
    focus: 'Menilai Cadangan Penyelesaian',
    icon: '🌳',
    maxXp: 180,
    active: true,
    color: '#22c55e',
    position: [13, 0, -12],
  },
  {
    id: 4,
    title: 'Makmal Suara',
    shortTitle: 'Makmal Suara',
    focus: 'Membina Hujah & Bertutur',
    icon: '🎙️',
    maxXp: 220,
    active: true,
    color: '#a855f7',
    position: [15, 0, 10],
  },
  {
    id: 5,
    title: 'Operasi Selamatkan EcoWorld',
    shortTitle: 'Operasi EcoWorld',
    focus: 'Projek Kempen Digital PBL',
    icon: '🌍',
    maxXp: 300,
    active: true,
    color: '#eab308',
    position: [0, 0, 0],
  },
];

export const M1_CLUES_3D: Clue3D[] = [
  {
    id: 'paip',
    title: 'Paip Sisa Kimia',
    description: 'Paip kilang menyalurkan cecair hitam ke sungai pada waktu malam',
    position: [-19.5, 1.3, 8.2],
  },
  {
    id: 'ikan',
    title: 'Ikan Mati Terapung',
    description: 'Ratusan ikan mati terapung di permukaan sungai yang tercemar',
    position: [-12.2, 0.55, 13.5],
  },
  {
    id: 'bau',
    title: 'Tong Sisa Berbau Busuk',
    description: 'Tong kimia terbiar menyebabkan air hitam berbau busuk',
    position: [-16.8, 1.1, 14.2],
  },
];

export const M1_SCRIPT =
  'Selamat sejahtera Ejen Prihatin! Saya Puan Aminah dari Kampung Sungai Jernih. Sejak bulan lalu, air sungai kami bertukar hitam pekat dan berbau busuk selepas waktu tengah malam. Ratusan ekor ikan mati terapung. Kami mengesyaki kilang tekstil di hulu sungai membuang sisa kimia secara senyap ketika penduduk tidur agar perbuatan mereka tidak dapat dikesan.';

export const M2_SCENES = [
  {
    icon: '🏭',
    title: 'Babak 1: Cerobong Asap Tanpa Penapis',
    text: 'Kilang melepaskan gas sulfur dioksida dan zarah karbon hitam terus ke udara tanpa sistem penapisan moden.',
  },
  {
    icon: '🚗',
    title: 'Babak 2: Kenderaan & Pembakaran Terbuka',
    text: 'Asap kenderaan yang sesak dan pembakaran sampah terbuka membentuk lapisan jerebu tebal menyelubungi bandar.',
  },
  {
    icon: '🌳',
    title: 'Babak 3: Kesan Kepada Manusia & Hutan',
    text: 'Penduduk mengalami sesak nafas dan asma manakala daun pokok menjadi layu akibat tindak balas hujan asid.',
  },
];

export const M3_OPTS = [
  {
    id: 'o1',
    t: 'Pilihan A: Tutup Semua Kilang Serta-Merta',
    p: 'Udara pulih dengan sangat pantas.',
    c: 'Ramai pekerja hilang punca pendapatan dan ekonomi bandar terjejas.',
  },
  {
    id: 'o2',
    t: 'Pilihan B: Wajibkan Penapis Asap + Tanam Semula Hutan & Pengangkutan Hijau',
    p: 'Mengawal punca pencemaran secara mampan sambil mengekalkan pekerjaan.',
    c: 'Memerlukan pemantauan berkala dan kerjasama semua pihak.',
  },
  {
    id: 'o3',
    t: 'Pilihan C: Edar Topeng Muka Percuma Sahaja',
    p: 'Kos murah dan mudah dilaksanakan segera.',
    c: 'Tidak menghapuskan punca pencemaran udara atau melindungi pokok.',
  },
];

export const PBL_STEPS = [
  '1. Pilih isu alam sekitar',
  '2. Kumpul bukti lapangan',
  '3. Analisis punca & kesan',
  '4. Bina hujah kritis',
  '5. Rancang skrip kempen',
  '6. Rakam audio / video',
  '7. Bentang kempen digital',
  '8. Terima maklum balas',
  '9. Laksana penambahbaikan',
];

export const DEFAULT_DB: DatabaseState = {
  apiEndpoint: '',
  classes: [
    { id: 'c1', name: '6 Bestari', code: '6BESTARI', teacherUsername: 'cikgu_amina' },
    { id: 'c2', name: '6 Cerdik', code: '6CERDIK', teacherUsername: 'cikgu_amina' },
  ],
  missions: DEFAULT_MISSIONS,
  users: [
    {
      id: 'adm1',
      role: 'admin',
      username: 'admin',
      password: 'admin123',
      fullName: 'Penyelaras DLO EcoWorld',
    },
    {
      id: 'tch1',
      role: 'guru',
      username: 'cikgu_amina',
      password: 'guru123',
      fullName: 'Cikgu Amina binti Razak',
      classes: ['6 Bestari', '6 Cerdik'],
    },
    {
      id: 'M001',
      role: 'murid',
      username: 'ali_ejen',
      password: 'murid123',
      fullName: 'Ali bin Hassan',
      studentId: 'BM6-001',
      className: '6 Bestari',
      classCode: '6BESTARI',
      avatar: 'rimba',
      xp: 530,
      unlockedMission: 4,
      progress: {
        m1: {
          completed: true,
          score: 90,
          tersuratScore: 100,
          tersiratScore: 80,
          evidence: [
            'Paip kilang menyalurkan cecair hitam ke sungai pada waktu malam',
            'Ratusan ikan mati terapung di permukaan sungai yang tercemar',
          ],
        },
        m2: {
          completed: true,
          score: 85,
          kbatScore: 85,
          thinkingMap: {
            punca: 'Asap kilang tanpa penapis & pembakaran terbuka',
            kesan: 'Jerebu tebal, asma & hujan asid',
          },
          kbatAnswer:
            'Indeks pencemaran udara meningkat, aktiviti luar bilik darjah terpaksa dihentikan dan kesihatan murid terjejas.',
        },
        m3: {
          completed: true,
          score: 80,
          chosenOption:
            'Pilihan B: Wajibkan Penapis Asap + Tanam Semula Hutan & Pengangkutan Hijau',
          justification: 'Menangani punca pencemaran secara mampan tanpa menjejaskan ekonomi penduduk.',
        },
        m4: { completed: false, score: 0, argument: null, hasRecording: false },
        m5: {
          completed: false,
          submitted: false,
          link: '',
          title: '',
          stepsDone: [],
          rubricScore: 0,
          reflection: '',
        },
      },
      badges: ['eco_explorer', 'listening_detective', 'critical_thinker'],
      teacherFeedback: 'Syabas Ali! Teruskan ke Makmal Suara untuk berlatih intonasi hujah.',
      aiApprovedByTeacher: true,
      peerFeedback: '',
    },
    {
      id: 'M002',
      role: 'murid',
      username: 'siti_ejen',
      password: 'murid123',
      fullName: 'Siti Nurhaliza binti Kamal',
      studentId: 'BM6-002',
      className: '6 Bestari',
      classCode: '6BESTARI',
      avatar: 'tirta',
      xp: 120,
      unlockedMission: 2,
      progress: {
        m1: {
          completed: true,
          score: 55,
          tersuratScore: 70,
          tersiratScore: 40,
          evidence: ['Air sungai bertukar hitam pekat'],
        },
        m2: { completed: false, score: 0, kbatScore: 0, thinkingMap: null, kbatAnswer: '' },
        m3: { completed: false, score: 0, chosenOption: '', justification: '' },
        m4: { completed: false, score: 0, argument: null, hasRecording: false },
        m5: {
          completed: false,
          submitted: false,
          link: '',
          title: '',
          stepsDone: [],
          rubricScore: 0,
          reflection: '',
        },
      },
      badges: [],
      teacherFeedback: 'Dengar semula laporan Puan Aminah untuk mengesan maksud tersirat.',
      aiApprovedByTeacher: false,
      peerFeedback: '',
    },
  ],
  logs: [
    { time: '08:30', actor: 'Ali bin Hassan', action: 'Menyelesaikan Misi 3: Hutan Harapan (80%)' },
    {
      time: '09:15',
      actor: 'Siti Nurhaliza',
      action: 'Menyelesaikan Misi 1: Zon Sungai Tercemar (55%)',
    },
  ],
};
