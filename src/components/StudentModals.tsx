import React, { useState } from 'react';
import { CheckCircle2, Download, Printer, Shield, Sparkles, X, Zap } from 'lucide-react';
import { AVATARS, BADGES_DEF } from '../data/gameData';
import { AvatarId, MissionDef, UserAccount } from '../types/game';
import { downloadCertificatePdf } from '../utils/certificatePdf';
import { playSFX } from '../utils/sound';
import { calcLevel, calcOverallScore, computeAIGuide } from '../utils/storage';

export function EvidenceBookModal({
  user,
  onClose,
}: {
  user: UserAccount;
  onClose: () => void;
}) {
  const p = user.progress!;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
      <div className="w-full max-w-xl bg-slate-950 border border-sky-500/50 rounded-3xl p-6 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-bold text-sky-300">
            📖 Evidence Book · {user.fullName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4 text-sm">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="font-display font-bold text-emerald-400 mb-2">
              Bukti Sungai Tercemar (Misi 1)
            </div>
            {p.m1.evidence.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1 text-slate-300">
                {p.m1.evidence.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400">Belum ada bukti terkumpul.</p>
            )}
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="font-display font-bold text-amber-300 mb-2">
              Peta Pemikiran Udara Beracun (Misi 2)
            </div>
            {p.m2.thinkingMap ? (
              <div className="text-slate-300 space-y-1">
                <div>
                  <strong className="text-white">Punca:</strong> {p.m2.thinkingMap.punca}
                </div>
                <div>
                  <strong className="text-white">Kesan:</strong> {p.m2.thinkingMap.kesan}
                </div>
              </div>
            ) : (
              <p className="text-slate-400">Belum dilengkapkan.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileBadgesModal({
  user,
  missions,
  onChangeAvatar,
  onOpenMission,
  onClose,
}: {
  user: UserAccount;
  missions: MissionDef[];
  onChangeAvatar: (id: AvatarId) => void;
  onOpenMission: (id: number) => void;
  onClose: () => void;
}) {
  const xp = user.xp || 0;
  const lvl = calcLevel(xp);
  const xpIn = xp % 200;
  const pct = Math.round(xpIn / 2);
  const ai = computeAIGuide(user);
  const p = user.progress!;
  const currentAv = AVATARS.find((a) => a.id === user.avatar) || AVATARS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto eco-scroll bg-slate-950 border border-emerald-500/50 rounded-3xl p-6 text-slate-100 shadow-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-amber-400 flex items-center justify-center text-4xl">
              {currentAv.emoji}
            </div>
            <div>
              <div className="text-xs text-amber-300 font-semibold">
                Tahap {lvl} · {user.className} · {user.studentId}
              </div>
              <h2 className="font-display text-2xl font-bold text-white">{user.fullName}</h2>
              <div className="text-xs text-slate-400 mt-1 font-mono-num">
                XP: <span className="text-amber-300 font-bold">{xp}</span> ({xpIn}/200 ke Tahap{' '}
                {lvl + 1})
              </div>
              <div className="w-56 h-2.5 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-amber-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3D Avatar Selector */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-bold text-slate-300 mb-2.5">
            Pilih Karakter Ejen 3D Anda (Berubah terus di Pulau 3D)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {AVATARS.map((av) => (
              <button
                key={av.id}
                type="button"
                onClick={() => onChangeAvatar(av.id)}
                className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  user.avatar === av.id
                    ? 'bg-emerald-950/70 border-emerald-400 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="text-2xl mb-1">{av.emoji}</div>
                <div className="font-display font-bold text-xs">{av.name}</div>
                <div className="text-[11px] opacity-80">{av.tagline}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 3 Columns: Badges, Progress, AI Mission Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
            <h3 className="font-display font-bold text-amber-300 text-base">
              🏅 Lencana ({(user.badges || []).length}/5)
            </h3>
            {BADGES_DEF.map((b) => {
              const earned = (user.badges || []).includes(b.id);
              return (
                <div
                  key={b.id}
                  className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    earned
                      ? 'bg-amber-950/40 border-amber-400/60 text-amber-100'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  <span className="text-lg">{b.icon}</span>
                  <div>
                    <div className="font-bold">
                      {b.name} {earned ? '✅' : '🔒'}
                    </div>
                    <div className="text-[11px] opacity-80">{b.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
            <h3 className="font-display font-bold text-sky-300 text-base">📊 Kemajuan Misi</h3>
            {missions.map((m) => {
              const mp = p[`m${m.id}` as 'm1' | 'm2' | 'm3' | 'm4' | 'm5'];
              const done = 'submitted' in mp ? mp.submitted : mp.completed;
              const scoreVal = 'rubricScore' in mp ? mp.rubricScore : mp.score;
              const unlocked = m.id <= (user.unlockedMission || 1);
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => {
                    onClose();
                    onOpenMission(m.id);
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-400 disabled:opacity-50 flex items-center justify-between text-xs text-left cursor-pointer"
                >
                  <span>
                    {m.icon} Misi {m.id}: {m.shortTitle}
                  </span>
                  <span className="font-mono-num font-bold text-emerald-400">
                    {done ? `${scoreVal}%` : unlocked ? 'Sedia' : '🔒'}
                  </span>
                </button>
              );
            })}
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-100 mt-2">
              <strong className="text-amber-300">Maklum Balas Guru:</strong>
              <p className="mt-1">{user.teacherFeedback}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-purple-500/40 space-y-2.5">
            <h3 className="font-display font-bold text-purple-300 text-base">
              🤖 AI Mission Guide
            </h3>
            <div className="text-xs font-semibold text-sky-300">{ai.levelMode}</div>
            <div className="text-xs text-slate-200">
              <strong>Langkah Seterusnya:</strong>
              <p className="mt-1 text-slate-300">{ai.nextStep}</p>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-xs text-slate-400">
              {ai.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            <div className="text-xs font-semibold pt-2 text-emerald-400">
              {user.aiApprovedByTeacher ? '✅ Disahkan Guru' : '⏳ Menunggu semakan guru'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HallOfHeroesModal({
  user,
  onClose,
}: {
  user: UserAccount;
  onClose: () => void;
}) {
  const ov = calcOverallScore(user);
  const xp = user.xp || 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-amber-50 text-slate-900 rounded-3xl p-8 border-4 border-amber-400 shadow-2xl cert-printable text-center">
        <div className="text-5xl mb-2">🏆🌍</div>
        <h1 className="font-display text-3xl font-bold text-emerald-900">
          TAHNIAH, EJEN PRIHATIN!
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Sijil Pengiktirafan Penyelamat Dunia EcoWorld · Bahasa Melayu Tahun 6
        </p>

        <div className="my-6 py-4 border-y border-dashed border-slate-300">
          <div className="font-display text-2xl font-bold text-sky-800">{user.fullName}</div>
          <div className="text-sm text-slate-600 mt-1">
            Kelas: <strong>{user.className}</strong> · ID: <strong>{user.studentId}</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-slate-900 text-white">
            <div className="text-xs text-slate-400">Jumlah XP</div>
            <div className="font-mono-num text-xl font-bold text-amber-300">{xp}</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900 text-white">
            <div className="text-xs text-slate-400">Tahap</div>
            <div className="font-mono-num text-xl font-bold text-emerald-400">
              Lv.{calcLevel(xp)}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900 text-white">
            <div className="text-xs text-slate-400">Purata Skor</div>
            <div className="font-mono-num text-xl font-bold text-sky-400">{ov}%</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900 text-white">
            <div className="text-xs text-slate-400">Projek PBL</div>
            <div className="text-sm font-bold pt-1 text-emerald-300">
              {user.progress?.m5.submitted ? 'Selesai' : 'Dalam Proses'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {(user.badges || []).map((bId) => {
            const b = BADGES_DEF.find((x) => x.id === bId);
            if (!b) return null;
            return (
              <span
                key={b.id}
                className="px-3 py-1.5 rounded-xl bg-amber-200 border border-amber-500 text-xs font-bold text-amber-950"
              >
                {b.icon} {b.name}
              </span>
            );
          })}
        </div>

        <div className="no-print flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              playSFX('xp');
              downloadCertificatePdf(user);
            }}
            className="btn-game-emerald px-5 py-2.5 rounded-xl text-slate-950 font-game font-black text-sm flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Muat Turun Sijil PDF Sebenar
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-sm flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Cetak Sijil
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-display font-bold text-sm cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export function WheretoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
      <div className="w-full max-w-xl bg-slate-950 border border-emerald-500/40 rounded-3xl p-6 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl font-bold text-emerald-400">
            📘 Panduan Kurikulum & WHERETO
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          <strong>Bahasa Melayu Tahun 6 · SK 1.2 / SP 1.2.2:</strong> Bertutur untuk menghujahkan
          sesuatu perkara menggunakan idea kritis & kreatif berdasarkan maklumat tersurat dan tersirat.
        </p>
        <div className="space-y-2 text-xs bg-slate-900 border border-slate-800 rounded-2xl p-4 text-slate-300">
          <div><strong className="text-amber-300">W:</strong> Hala tuju Kempen Digital Selamatkan EcoWorld.</div>
          <div><strong className="text-amber-300">H:</strong> Penerokaan Pulau 3D, bukti sungai & audio Puan Aminah.</div>
          <div><strong className="text-amber-300">E (Equip):</strong> 5 misi berperingkat + pembina hujah & rakaman suara.</div>
          <div><strong className="text-amber-300">R (Rethink):</strong> Semakan kendiri, rakan sebaya & maklum balas guru.</div>
          <div><strong className="text-amber-300">E (Evaluate):</strong> Markah automatik, lencana pencapaian & rubrik PBL.</div>
          <div><strong className="text-amber-300">T (Tailor):</strong> AI Mission Guide mencadangkan pengukuhan/pengayaan.</div>
          <div><strong className="text-amber-300">O (Organize):</strong> Dunia 3D berperingkat hingga Hall of Heroes.</div>
        </div>
      </div>
    </div>
  );
}

export function AgentSelectModal({
  user,
  onSelectAgent,
}: {
  user: UserAccount;
  onSelectAgent: (avatarId: AvatarId) => void;
}) {
  const [selected, setSelected] = useState<AvatarId>(user.avatar || 'rimba');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-950 border-2 border-emerald-400/75 rounded-3xl p-6 sm:p-8 text-slate-100 shadow-2xl space-y-6">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-400/50 text-emerald-300 font-game text-xs font-bold">
            <Shield className="w-3.5 h-3.5" /> PENDAFTARAN WATAK EJEN 3D
          </div>
          <h2 className="game-title-emerald text-2xl sm:text-3xl font-black uppercase">
            PILIH EJEN ECOWORLD ANDA
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Selamat datang <strong className="text-amber-300">{user.fullName}</strong>! Pilih ejen pilihan anda sebelum memulakan misi menyelamatkan EcoWorld.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {AVATARS.map((av) => {
            const active = selected === av.id;
            return (
              <button
                key={av.id}
                type="button"
                onClick={() => {
                  playSFX('click');
                  setSelected(av.id);
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-4 ${
                  active
                    ? 'bg-emerald-950/75 border-amber-400 shadow-lg scale-[1.01]'
                    : 'bg-slate-900 border-slate-800 hover:border-emerald-500/60'
                }`}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0 border-2"
                  style={{
                    backgroundColor: `${av.primaryColor}25`,
                    borderColor: active ? '#facc15' : av.primaryColor,
                  }}
                >
                  {av.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-game text-base font-black text-white">{av.name}</span>
                    {active && <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />}
                  </div>
                  <div className="text-xs text-emerald-300 font-semibold mt-0.5">{av.tagline}</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Suit {av.primaryColor === '#16a34a' ? 'Hijau Rimba' : av.primaryColor === '#0284c7' ? 'Biru Laut' : av.primaryColor === '#0d9488' ? 'Turquoise Bayu' : 'Emas Suara'} · Visor Aktif 3D
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => {
              playSFX('portal');
              onSelectAgent(selected);
            }}
            className="btn-game-emerald px-8 py-3.5 rounded-2xl text-slate-950 font-game font-black text-sm sm:text-base tracking-wider uppercase flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> SAHKAN EJEN & MULA MISI →
          </button>
        </div>
      </div>
    </div>
  );
}

export function MissionSuccessModal({
  user,
  info,
  nextMission,
  onTeleportNext,
  onClose,
  onOpenHeroes,
}: {
  user: UserAccount;
  info: { missionId: number; score: number; xpEarned: number; message: string };
  nextMission?: MissionDef | null;
  onTeleportNext?: () => void;
  onClose: () => void;
  onOpenHeroes: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
      <div className="w-full max-w-lg bg-slate-950 border-2 border-amber-400 rounded-3xl p-7 text-center text-slate-100 shadow-2xl space-y-4">
        <div className="text-5xl">🎉🏆</div>
        <div>
          <div className="font-game text-xs font-bold tracking-widest text-amber-300 uppercase">
            TAHNIAH, {user.fullName}!
          </div>
          <h2 className="game-title-emerald text-2xl sm:text-3xl font-black mt-1">
            MISI 0{info.missionId} SELESAI!
          </h2>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/40 space-y-1">
          <div className="font-mono-num text-base font-bold text-amber-300">
            Markah: {info.score}% · Ganjaran: +{info.xpEarned} XP
          </div>
          <div className="text-xs text-emerald-300 font-semibold flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Rekod anda telah dicatat ke Dashboard Guru!
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">{info.message}</p>

        <div className="flex flex-wrap justify-center gap-2.5 pt-2">
          {nextMission && onTeleportNext && (
            <button
              type="button"
              onClick={onTeleportNext}
              className="btn-game-emerald w-full sm:w-auto px-5 py-2.5 rounded-xl text-slate-950 font-game font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4" /> TELEPORT KE MISI 0{nextMission.id}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              playSFX('xp');
              downloadCertificatePdf(user);
            }}
            className="btn-game-gold px-5 py-2.5 rounded-xl text-slate-950 font-game font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Muat Turun Sijil PDF
          </button>
          <button
            type="button"
            onClick={onOpenHeroes}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-400/60 text-amber-200 font-display font-bold text-xs sm:text-sm cursor-pointer"
          >
            Lihat Sijil Penuh
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-display font-bold text-xs sm:text-sm cursor-pointer"
          >
            Teroka Pulau 3D
          </button>
        </div>
      </div>
    </div>
  );
}
