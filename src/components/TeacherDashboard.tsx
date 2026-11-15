import React, { useState } from 'react';
import { BADGES_DEF } from '../data/gameData';
import { DatabaseState, UserAccount } from '../types/game';
import { calcOverallScore, computeAIGuide, getMasteryLevel } from '../utils/storage';

interface TeacherDashboardProps {
  db: DatabaseState;
  teacher: UserAccount;
  onSaveFeedback: (studentId: string, feedback: string) => void;
  onApproveAI: (studentId: string, approved: boolean) => void;
}

export function TeacherDashboard({
  db,
  teacher,
  onSaveFeedback,
  onApproveAI,
}: TeacherDashboardProps) {
  const [tab, setTab] = useState<'overview' | 'analytics'>('overview');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fbDraft, setFbDraft] = useState('');
  const [minimized, setMinimized] = useState(false);

  const allStudents = db.users.filter((u) => u.role === 'murid');
  const students =
    selectedClass === 'ALL'
      ? allStudents
      : allStudents.filter((s) => s.className === selectedClass);

  const activeCount = students.filter((s) => (s.xp || 0) > 0).length;
  const avgScore = students.length
    ? Math.round(students.reduce((acc, s) => acc + calcOverallScore(s), 0) / students.length)
    : 0;
  const completedMissions = students.reduce((acc, s) => {
    const p = s.progress;
    if (!p) return acc;
    return (
      acc +
      (['m1', 'm2', 'm3', 'm4', 'm5'] as const).filter((k) => {
        const m = p[k];
        return 'submitted' in m ? m.submitted : m.completed;
      }).length
    );
  }, 0);
  const needGuidanceCount = students.filter((s) => computeAIGuide(s).needsIntervention).length;
  const selectedStudent = allStudents.find((s) => s.id === selectedId) || null;

  if (minimized) {
    return (
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30">
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="px-5 py-2.5 rounded-xl bg-slate-950/95 border border-sky-400 text-sky-300 font-display font-bold text-sm shadow-xl cursor-pointer"
        >
          ▴ Buka Dashboard Guru
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 top-16 bottom-4 z-30 flex items-start justify-center p-4 pointer-events-none">
      <div className="w-full max-w-6xl max-h-full overflow-y-auto eco-scroll bg-slate-950/95 border border-sky-500/40 rounded-3xl p-6 text-slate-100 shadow-2xl pointer-events-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">
              Dashboard Guru · {teacher.fullName}
            </h2>
            <p className="text-xs text-slate-400">
              Pilih kelas untuk memantau rekod jawapan murid dan status bimbingan secara masa nyata
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('overview')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                tab === 'overview'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-900 border border-slate-700 text-slate-300'
              }`}
            >
              Rekod Murid
            </button>
            <button
              type="button"
              onClick={() => setTab('analytics')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                tab === 'analytics'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-900 border border-slate-700 text-slate-300'
              }`}
            >
              Analitik & Intervensi
            </button>
            <button
              type="button"
              onClick={() => setMinimized(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-sky-300 cursor-pointer"
            >
              ▾ Tinjau Pulau 3D
            </button>
          </div>
        </div>

        {/* Class Filter Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 mb-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-300 mr-1">Pilih Kelas:</span>
            <button
              type="button"
              onClick={() => setSelectedClass('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                selectedClass === 'ALL'
                  ? 'bg-sky-500 text-slate-950'
                  : 'bg-slate-950 border border-slate-700 text-slate-300 hover:border-sky-400'
              }`}
            >
              Semua Kelas ({allStudents.length})
            </button>
            {db.classes.map((cls) => {
              const count = allStudents.filter((s) => s.className === cls.name).length;
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => setSelectedClass(cls.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    selectedClass === cls.name
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-slate-950 border border-slate-700 text-slate-300 hover:border-sky-400'
                  }`}
                >
                  {cls.name} ({count})
                </button>
              );
            })}
          </div>
          <div className="text-xs text-slate-400">
            Menunjukkan <strong className="text-white">{students.length}</strong> rekod murid
          </div>
        </div>

        {/* 5 KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-xs text-slate-400">Jumlah Murid</div>
            <div className="font-mono-num text-2xl font-bold text-emerald-400">{students.length}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-xs text-slate-400">Aktif Bermain</div>
            <div className="font-mono-num text-2xl font-bold text-sky-400">{activeCount}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-xs text-slate-400">Purata Markah</div>
            <div className="font-mono-num text-2xl font-bold text-amber-300">{avgScore}%</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-xs text-slate-400">Misi Selesai</div>
            <div className="font-mono-num text-2xl font-bold text-emerald-400">{completedMissions}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-xs text-slate-400">Perlu Bimbingan</div>
            <div className="font-mono-num text-2xl font-bold text-rose-400">{needGuidanceCount}</div>
          </div>
        </div>

        {tab === 'overview' ? (
          <>
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[11px]">
                  <tr>
                    <th className="p-3">Nama Murid</th>
                    <th className="p-3">ID Murid</th>
                    <th className="p-3">Kelas</th>
                    <th className="p-3">XP</th>
                    <th className="p-3">Markah</th>
                    <th className="p-3">Status Murid</th>
                    <th className="p-3">Tahap Penguasaan</th>
                    <th className="p-3">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {students.length > 0 ? (
                    students.map((s) => {
                      const sc = calcOverallScore(s);
                      const m = getMasteryLevel(sc);
                      const ai = computeAIGuide(s);
                      const toneCls =
                        m.tone === 'emerald'
                          ? 'text-emerald-400'
                          : m.tone === 'sky'
                          ? 'text-sky-400'
                          : m.tone === 'rose'
                          ? 'text-rose-400'
                          : 'text-amber-300';
                      const statusLabel =
                        sc === 0
                          ? 'Belum Menjawab'
                          : ai.needsIntervention
                          ? 'Perlu Bimbingan'
                          : sc >= 80
                          ? 'Cemerlang'
                          : 'Memuaskan';
                      const statusCls =
                        sc === 0
                          ? 'text-amber-300'
                          : ai.needsIntervention
                          ? 'text-rose-400'
                          : 'text-emerald-400';

                      return (
                        <tr key={s.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-semibold text-white">{s.fullName}</td>
                          <td className="p-3 font-mono-num text-slate-300">{s.studentId}</td>
                          <td className="p-3 text-slate-300">{s.className}</td>
                          <td className="p-3 font-mono-num font-bold text-amber-300">{s.xp || 0}</td>
                          <td className="p-3 font-mono-num font-bold text-white">{sc}%</td>
                          <td className={`p-3 text-xs font-bold ${statusCls}`}>{statusLabel}</td>
                          <td className={`p-3 text-xs font-semibold ${toneCls}`}>{m.label}</td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedId(s.id);
                                setFbDraft(s.teacherFeedback || '');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold cursor-pointer"
                            >
                              Semak Rekod
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400 text-xs">
                        Belum ada rekod murid untuk kelas {selectedClass}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {selectedStudent && (
              <div className="mt-5 p-5 rounded-2xl bg-slate-900 border border-amber-400/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-amber-300">
                    Rekod Terperinci: {selectedStudent.fullName} ({selectedStudent.studentId} ·{' '}
                    {selectedStudent.className})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="px-3 py-1 rounded-lg bg-slate-800 text-xs text-slate-300 cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-xs text-slate-400">Mendengar (Misi 1)</div>
                    <div className="font-mono-num text-xl font-bold text-sky-400">
                      {selectedStudent.progress?.m1.score || 0}%
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Tersurat {selectedStudent.progress?.m1.tersuratScore || 0}% · Tersirat{' '}
                      {selectedStudent.progress?.m1.tersiratScore || 0}%
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-xs text-slate-400">Analisis & Bertutur (M2–M5)</div>
                    <div className="font-mono-num text-xl font-bold text-emerald-400">
                      M2:{selectedStudent.progress?.m2.score || 0}% · M3:
                      {selectedStudent.progress?.m3.score || 0}% · M4:
                      {selectedStudent.progress?.m4.score || 0}%
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-xs text-slate-400">Lencana Pencapaian</div>
                    <div className="text-lg mt-1">
                      {(selectedStudent.badges || []).length > 0
                        ? selectedStudent.badges!
                            .map((bId) => BADGES_DEF.find((x) => x.id === bId)?.icon)
                            .join(' ')
                        : 'Tiada lagi'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-purple-300">
                      Cadangan AI ({computeAIGuide(selectedStudent).levelMode})
                    </div>
                    <ul className="list-disc pl-4 text-xs text-slate-300 space-y-1">
                      {computeAIGuide(selectedStudent).recommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                    <label className="flex items-center gap-2 text-xs text-emerald-400 pt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(selectedStudent.aiApprovedByTeacher)}
                        onChange={(e) => onApproveAI(selectedStudent.id, e.target.checked)}
                        className="accent-emerald-500"
                      />
                      Guru sahkan cadangan AI ini
                    </label>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-emerald-400">Maklum Balas Guru</div>
                    <textarea
                      rows={3}
                      value={fbDraft}
                      onChange={(e) => setFbDraft(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => onSaveFeedback(selectedStudent.id, fbDraft)}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer"
                    >
                      Simpan Maklum Balas
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="font-display text-lg font-bold text-sky-300">
                Perbandingan Pencapaian (%)
              </h3>
              {students.map((s) => {
                const sc = calcOverallScore(s);
                return (
                  <div key={s.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>
                        {s.fullName} ({s.className})
                      </span>
                      <span className="font-mono-num font-bold">{sc}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          sc >= 75 ? 'bg-emerald-500' : sc >= 60 ? 'bg-sky-400' : 'bg-rose-500'
                        }`}
                        style={{ width: `${sc}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="font-display text-lg font-bold text-rose-300">
                Senarai Murid Perlu Bimbingan
              </h3>
              {students.filter((s) => computeAIGuide(s).needsIntervention).length > 0 ? (
                students
                  .filter((s) => computeAIGuide(s).needsIntervention)
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between py-2 border-b border-slate-800 text-xs"
                    >
                      <span>
                        <strong>{s.fullName}</strong> · {s.className} ({calcOverallScore(s)}%)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setTab('overview');
                          setSelectedId(s.id);
                          setFbDraft(s.teacherFeedback || '');
                        }}
                        className="px-3 py-1 rounded-lg bg-sky-500 text-slate-950 font-bold cursor-pointer"
                      >
                        Semak
                      </button>
                    </div>
                  ))
              ) : (
                <p className="text-xs text-emerald-300">
                  Tiada murid memerlukan bimbingan khas dalam pilihan kelas ini.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
