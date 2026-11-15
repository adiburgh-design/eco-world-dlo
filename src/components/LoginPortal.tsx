import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ClassRoom, UserRole } from '../types/game';
import { playSFX } from '../utils/sound';

interface LoginPortalProps {
  classes: ClassRoom[];
  onBackToSplash: () => void;
  onLoginStaff: (identifier: string, password: string, role: 'guru' | 'admin') => void;
  onEnterStudent: (fullName: string, studentId: string, className: string) => void;
}

export function LoginPortal({
  classes,
  onBackToSplash,
  onLoginStaff,
  onEnterStudent,
}: LoginPortalProps) {
  const [role, setRole] = useState<UserRole>('murid');

  // Murid state (Nama + ID Murid + Kelas)
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentClass, setStudentClass] = useState(classes[0]?.name || '6 Bestari');

  // Guru / Admin state (Nama / Username + Password)
  const [staffIdentifier, setStaffIdentifier] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  const handleRoleSwitch = (nextRole: UserRole) => {
    playSFX('click');
    setRole(nextRole);
    if (nextRole === 'guru') {
      setStaffIdentifier('Cikgu Amina binti Razak');
      setStaffPassword('guru123');
    } else if (nextRole === 'admin') {
      setStaffIdentifier('admin');
      setStaffPassword('admin123');
    }
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentId.trim()) return;
    onEnterStudent(studentName.trim(), studentId.trim().toUpperCase(), studentClass);
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'guru' || role === 'admin') {
      onLoginStaff(staffIdentifier.trim(), staffPassword, role);
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 md:p-8 pointer-events-none overflow-y-auto">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pointer-events-auto">
        {/* Left Hero Summary over 3D Island */}
        <div className="lg:col-span-7 bg-slate-950/90 border border-slate-700/80 rounded-3xl p-6 md:p-8 shadow-2xl text-slate-100">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-amber-300 tracking-wide">
              Bahasa Melayu Tahun 6 · SK 1.2 / SP 1.2.2
            </span>
            <button
              type="button"
              onClick={() => {
                playSFX('click');
                onBackToSplash();
              }}
              className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Skrin Utama
            </button>
          </div>

          <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight text-white text-balance mb-4">
            Suara Generasi <span className="text-emerald-400">Prihatin</span>: Misi 3D
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6 max-w-xl">
            Pilih akses anda di sebelah kanan. Murid hanya perlu memasukkan Nama, ID Murid, dan Kelas untuk terus bermain. Semua markah dan status penguasaan akan direkodkan terus ke papan pemuka Guru.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
              <div className="font-display text-emerald-400 text-base mb-1">🦸 Akses Murid</div>
              <p className="text-xs text-slate-400">
                Masukkan Nama & ID Murid untuk terus teroka Pulau EcoWorld 3D.
              </p>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
              <div className="font-display text-sky-400 text-base mb-1">👩‍🏫 Akses Guru</div>
              <p className="text-xs text-slate-400">
                Log masuk dengan Nama Guru & Kata Laluan untuk pilih kelas & pantau murid.
              </p>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
              <div className="font-display text-amber-300 text-base mb-1">🛡️ Akses Admin</div>
              <p className="text-xs text-slate-400">
                Urus senarai Nama Guru, Kata Laluan, Kelas dan status Misi 3D.
              </p>
            </div>
          </div>
        </div>

        {/* Right Portal Login Card */}
        <div className="lg:col-span-5 bg-slate-950/95 border border-amber-400/50 rounded-3xl p-6 shadow-2xl text-slate-100">
          <div className="text-center mb-5">
            <h2 className="font-display text-2xl font-bold text-white">Pilih Akses Portal</h2>
            <p className="text-xs text-slate-400 mt-1">Admin · Guru · Murid</p>
          </div>

          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 mb-5">
            {(['murid', 'guru', 'admin'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleSwitch(r)}
                className={`py-2.5 px-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  role === r
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {r === 'murid' ? '🦸 Murid' : r === 'guru' ? '👩‍🏫 Guru' : '🛡️ Admin'}
              </button>
            ))}
          </div>

          {role === 'murid' ? (
            <form onSubmit={handleStudentSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nama Penuh Murid
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Contoh: Ali bin Hassan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ID Murid
                  </label>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Contoh: BM6-001"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kelas
                  </label>
                  <select
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-400"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-base transition-colors cursor-pointer"
              >
                Masuk Game EcoWorld 3D
              </button>

              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-400">Isi pantas murid sedia ada:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playSFX('click');
                      setStudentName('Ali bin Hassan');
                      setStudentId('BM6-001');
                      setStudentClass('6 Bestari');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold cursor-pointer"
                  >
                    Ali (BM6-001)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSFX('click');
                      setStudentName('Siti Nurhaliza binti Kamal');
                      setStudentId('BM6-002');
                      setStudentClass('6 Bestari');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold cursor-pointer"
                  >
                    Siti (BM6-002)
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleStaffSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {role === 'guru' ? 'Nama Guru atau Nama Pengguna' : 'Nama Pengguna Admin'}
                </label>
                <input
                  type="text"
                  required
                  value={staffIdentifier}
                  onChange={(e) => setStaffIdentifier(e.target.value)}
                  placeholder={role === 'guru' ? 'Cikgu Amina binti Razak / cikgu_amina' : 'admin'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kata Laluan
                </label>
                <input
                  type="password"
                  required
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="Masukkan kata laluan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-base transition-colors cursor-pointer"
              >
                {role === 'guru' ? 'Masuk Dashboard Guru' : 'Masuk Kawalan Admin'}
              </button>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 leading-relaxed">
                {role === 'guru' ? (
                  <>
                    <strong className="text-slate-200">Contoh Guru:</strong>{' '}
                    <code className="text-sky-400">Cikgu Amina binti Razak</code> atau{' '}
                    <code className="text-sky-400">cikgu_amina</code> · Kata Laluan:{' '}
                    <code className="text-amber-300">guru123</code>
                  </>
                ) : (
                  <>
                    <strong className="text-slate-200">Contoh Admin:</strong>{' '}
                    <code className="text-amber-300">admin</code> · Kata Laluan:{' '}
                    <code className="text-amber-300">admin123</code>
                  </>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
