import React, { useState } from 'react';
import { DatabaseState } from '../types/game';

interface AdminDashboardProps {
  db: DatabaseState;
  onAddTeacher: (fullName: string, username: string, password: string) => void;
  onUpdateTeacherPassword: (userId: string, newPassword: string) => void;
  onAddClass: (name: string, code: string) => void;
  onDeleteUser: (userId: string) => void;
  onDeleteClass: (classId: string) => void;
  onToggleMission: (index: number, active: boolean) => void;
  onSaveApi: (url: string) => void;
  onResetDemo: () => void;
}

export function AdminDashboard({
  db,
  onAddTeacher,
  onUpdateTeacherPassword,
  onAddClass,
  onDeleteUser,
  onDeleteClass,
  onToggleMission,
  onSaveApi,
  onResetDemo,
}: AdminDashboardProps) {
  const [tab, setTab] = useState<'overview' | 'teachers' | 'classes' | 'students' | 'missions'>(
    'teachers'
  );
  const [minimized, setMinimized] = useState(false);

  const [tName, setTName] = useState('');
  const [tUser, setTUser] = useState('');
  const [tPass, setTPass] = useState('guru123');
  const [cName, setCName] = useState('');
  const [cCode, setCCode] = useState('');
  const [apiUrl, setApiUrl] = useState(db.apiEndpoint || '');
  const [editingPwdId, setEditingPwdId] = useState<string | null>(null);
  const [pwdDraft, setPwdDraft] = useState('');

  const teachers = db.users.filter((u) => u.role === 'guru');
  const students = db.users.filter((u) => u.role === 'murid');

  if (minimized) {
    return (
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30">
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="px-5 py-2.5 rounded-xl bg-slate-950/95 border border-purple-400 text-purple-300 font-display font-bold text-sm shadow-xl cursor-pointer"
        >
          ▴ Buka Pusat Kawalan Admin
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 top-16 bottom-4 z-30 flex items-start justify-center p-4 pointer-events-none">
      <div className="w-full max-w-6xl max-h-full overflow-y-auto eco-scroll bg-slate-950/95 border border-purple-500/40 rounded-3xl p-6 text-slate-100 shadow-2xl pointer-events-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-purple-300">
              Pusat Kawalan Admin
            </h2>
            <p className="text-xs text-slate-400">
              Pengurusan Nama Guru & Kata Laluan, Kelas, Rekod Murid, dan Status Misi 3D
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onResetDemo}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
            >
              Reset Data Demo
            </button>
            <button
              type="button"
              onClick={() => setMinimized(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold cursor-pointer"
            >
              ▾ Tinjau Pulau 3D
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {[
            ['teachers', `Guru & Kata Laluan (${teachers.length})`],
            ['classes', `Kelas (${db.classes.length})`],
            ['students', `Murid (${students.length})`],
            ['overview', 'Rekod Aktiviti'],
            ['missions', 'Misi & Sync'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key as typeof tab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                tab === key
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-900 border border-slate-700 text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'teachers' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onAddTeacher(tName.trim(), tUser.trim(), tPass);
                setTName('');
                setTUser('');
              }}
              className="md:col-span-4 space-y-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 h-fit"
            >
              <h3 className="font-display font-bold text-white">Daftar Guru & Kata Laluan</h3>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nama Guru</label>
                <input
                  required
                  placeholder="Contoh: Cikgu Hafiz bin Omar"
                  value={tName}
                  onChange={(e) => setTName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nama Pengguna (Login)</label>
                <input
                  required
                  placeholder="Contoh: cikgu_hafiz"
                  value={tUser}
                  onChange={(e) => setTUser(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Kata Laluan Guru</label>
                <input
                  required
                  placeholder="Kata laluan"
                  value={tPass}
                  onChange={(e) => setTPass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                + Tambah Guru
              </button>
            </form>

            <div className="md:col-span-8 rounded-2xl border border-slate-800 bg-slate-900/70 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400">
                  <tr>
                    <th className="p-3">Nama Guru</th>
                    <th className="p-3">Nama Pengguna</th>
                    <th className="p-3">Kata Laluan</th>
                    <th className="p-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {teachers.map((t) => (
                    <tr key={t.id}>
                      <td className="p-3 font-semibold text-white">{t.fullName}</td>
                      <td className="p-3 text-slate-300">{t.username}</td>
                      <td className="p-3 font-mono-num text-amber-300">
                        {editingPwdId === t.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              value={pwdDraft}
                              onChange={(e) => setPwdDraft(e.target.value)}
                              className="w-28 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (pwdDraft.trim()) {
                                  onUpdateTeacherPassword(t.id, pwdDraft.trim());
                                }
                                setEditingPwdId(null);
                              }}
                              className="px-2 py-1 rounded bg-emerald-500 text-slate-950 font-bold cursor-pointer"
                            >
                              Simpan
                            </button>
                          </div>
                        ) : (
                          <span>{t.password}</span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPwdId(t.id);
                            setPwdDraft(t.password);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-sky-500 text-slate-950 font-bold cursor-pointer"
                        >
                          Ubah Kata Laluan
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteUser(t.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold cursor-pointer"
                        >
                          Padam
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">Guru</div>
                <div className="font-mono-num text-2xl font-bold text-emerald-400">
                  {teachers.length}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">Kelas</div>
                <div className="font-mono-num text-2xl font-bold text-sky-400">
                  {db.classes.length}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">Murid</div>
                <div className="font-mono-num text-2xl font-bold text-amber-300">
                  {students.length}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">Misi Aktif</div>
                <div className="font-mono-num text-2xl font-bold text-emerald-400">
                  {db.missions.filter((m) => m.active).length}/5
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase">
                  <tr>
                    <th className="p-3">Masa</th>
                    <th className="p-3">Pengguna</th>
                    <th className="p-3">Aktiviti</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {db.logs.map((l, i) => (
                    <tr key={i}>
                      <td className="p-3 font-mono-num text-slate-400">{l.time}</td>
                      <td className="p-3 font-semibold text-white">{l.actor}</td>
                      <td className="p-3 text-slate-300">{l.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'classes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onAddClass(cName.trim(), cCode.trim().toUpperCase());
                setCName('');
                setCCode('');
              }}
              className="space-y-3 p-4 rounded-2xl bg-slate-900 border border-slate-800"
            >
              <h3 className="font-display font-bold text-white">Tambah Kelas Baharu</h3>
              <input
                required
                placeholder="Nama Kelas (cth: 6 Amanah)"
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm"
              />
              <input
                required
                placeholder="Kod Kelas (cth: 6AMANAH)"
                value={cCode}
                onChange={(e) => setCCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs cursor-pointer"
              >
                + Tambah Kelas
              </button>
            </form>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400">
                  <tr>
                    <th className="p-3">Kelas</th>
                    <th className="p-3">Kod</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {db.classes.map((c) => (
                    <tr key={c.id}>
                      <td className="p-3">{c.name}</td>
                      <td className="p-3 font-mono-num text-amber-300">{c.code}</td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteClass(c.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold cursor-pointer"
                        >
                          Padam
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'students' && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Nama</th>
                  <th className="p-3">Kelas</th>
                  <th className="p-3">XP</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="p-3 font-mono-num">{s.studentId}</td>
                    <td className="p-3 font-semibold text-white">{s.fullName}</td>
                    <td className="p-3">{s.className}</td>
                    <td className="p-3 font-mono-num text-amber-300 font-bold">{s.xp || 0}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteUser(s.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold cursor-pointer"
                      >
                        Padam
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'missions' && (
          <div className="space-y-4">
            <div className="space-y-2">
              {db.missions.map((m, i) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                >
                  <span className="text-sm">
                    <strong>
                      {m.icon} Misi {m.id}:
                    </strong>{' '}
                    {m.title}
                  </span>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={m.active}
                      onChange={(e) => onToggleMission(i, e.target.checked)}
                      className="accent-emerald-500"
                    />
                    Aktif
                  </label>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                URL Web App Google Apps Script (Opsional untuk Sync Google Sheets)
              </label>
              <div className="flex gap-2">
                <input
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm"
                />
                <button
                  type="button"
                  onClick={() => onSaveApi(apiUrl.trim())}
                  className="px-4 py-2 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
