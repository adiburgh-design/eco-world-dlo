import { useCallback, useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Compass,
  LogOut,
  Music,
  Trophy,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard';
import { IntroVideoCutscene } from './components/IntroVideoCutscene';
import { LoginPortal } from './components/LoginPortal';
import { MissionDrawer } from './components/MissionDrawer';
import {
  AgentSelectModal,
  EvidenceBookModal,
  HallOfHeroesModal,
  MissionSuccessModal,
  ProfileBadgesModal,
  WheretoModal,
} from './components/StudentModals';
import { TeacherDashboard } from './components/TeacherDashboard';
import { WarpTransition } from './components/WarpTransition';
import { WelcomeSplash } from './components/WelcomeSplash';
import { AVATARS } from './data/gameData';
import { EcoWorldCanvas } from './three/EcoWorldCanvas';
import {
  AvatarId,
  CameraMode,
  Clue3D,
  DatabaseState,
  UserAccount,
} from './types/game';
import {
  getMusicTrackInfo,
  getMusicVolume,
  isMusicEnabled,
  isSoundEnabled,
  playSFX,
  setMusicEnabled,
  setMusicState,
  setMusicVolume,
  setSoundEnabled,
  startAmbientMusic,
  stopAmbientMusic,
} from './utils/sound';
import {
  addLog,
  calcLevel,
  evaluateBadges,
  getDB,
  resetDemoDB,
  saveDB,
} from './utils/storage';

export default function App() {
  const [db, setDb] = useState<DatabaseState>(() => getDB());
  const [showSplash, setShowSplash] = useState(true);
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 3D Viewport Navigation & Camera State
  const [cameraMode, setCameraMode] = useState<CameraMode>('overview');
  const [focusedMissionId, setFocusedMissionId] = useState<number>(1);
  const [activeMissionId, setActiveMissionId] = useState<number | null>(null);
  const [hoverInfo, setHoverInfo] = useState<string | null>(null);
  const [m1CluesFound, setM1CluesFound] = useState<string[]>([]);
  const [dpadVector, setDpadVector] = useState<{ x: number; z: number }>({ x: 0, z: 0 });

  // Collapsible Bottom Dock (Cinema / Zen Mode)
  const [dockCollapsed, setDockCollapsed] = useState(false);

  // Modals & Audio
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [musicOn, setMusicOn] = useState(isMusicEnabled());
  const [musicVolume, setMusicVolumeState] = useState(getMusicVolume());
  const [proximityZoneId, setProximityZoneId] = useState<number>(0);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showAgentSelect, setShowAgentSelect] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showHeroes, setShowHeroes] = useState(false);
  const [showWhereto, setShowWhereto] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    missionId: number;
    score: number;
    xpEarned: number;
    message: string;
  } | null>(null);
  const [warpState, setWarpState] = useState<{
    title: string;
    subtitle: string;
    accentColor: string;
    onMidpoint?: () => void;
    onComplete?: () => void;
  } | null>(null);

  const [toastMsg, setToastMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const currentUser: UserAccount | null =
    db.users.find((u) => u.id === currentUserId) || null;

  const showToast = useCallback((text: string, isError = false) => {
    setToastMsg({ text, isError });
    if (isError) playSFX('error');
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3200);
    return () => clearTimeout(t);
  }, [toastMsg]);

  // Keyboard shortcut 'H' to toggle Collapsible Bottom Dock (Cinema/Zen Mode)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
      ) {
        return;
      }
      if (e.key.toLowerCase() === 'h' && currentUser?.role === 'murid') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentUser]);

  // Derive active music zone & restoration state
  const activeMusicZone =
    activeMissionId ??
    (cameraMode === 'zone' ? focusedMissionId : proximityZoneId || 0);
  const activeZoneKey =
    activeMusicZone >= 1 && activeMusicZone <= 5
      ? (`m${activeMusicZone}` as 'm1' | 'm2' | 'm3' | 'm4' | 'm5')
      : null;
  const activeZoneProgress = activeZoneKey ? currentUser?.progress?.[activeZoneKey] : null;
  const isZoneRestored = Boolean(
    activeZoneProgress &&
      ('submitted' in activeZoneProgress
        ? activeZoneProgress.submitted
        : activeZoneProgress.completed)
  );

  // Sync adaptive ambient music track & intensity with active zone / proximity / mission state
  useEffect(() => {
    setMusicState({
      zoneId: currentUser ? activeMusicZone : 0,
      inMission: Boolean(activeMissionId),
      zoneRestored: isZoneRestored,
    });
  }, [currentUser, activeMusicZone, activeMissionId, isZoneRestored]);

  useEffect(() => {
    return () => {
      stopAmbientMusic();
    };
  }, []);

  const updateDB = useCallback((mutator: (draft: DatabaseState) => void) => {
    setDb((prev) => {
      const next: DatabaseState = JSON.parse(JSON.stringify(prev));
      mutator(next);
      saveDB(next);
      return next;
    });
  }, []);

  const handleStartFromSplash = () => {
    setShowSplash(false);
    setShowIntroVideo(true);
    if (musicOn) startAmbientMusic();
  };

  const handleFinishIntroVideo = () => {
    setShowIntroVideo(false);
  };

  // Staff Login (Guru by Nama Guru or Username + Password; Admin by Username + Password)
  const handleLoginStaff = (identifier: string, password: string, role: 'guru' | 'admin') => {
    const idLower = identifier.toLowerCase();
    const found = db.users.find(
      (u) =>
        u.role === role &&
        u.password === password &&
        (u.username.toLowerCase() === idLower || u.fullName.toLowerCase() === idLower)
    );
    if (!found) {
      showToast(
        role === 'guru'
          ? 'Nama Guru / Nama Pengguna atau Kata Laluan tidak sah!'
          : 'Nama Pengguna atau Kata Laluan Admin tidak sah!',
        true
      );
      return;
    }
    playSFX('xp');
    if (musicOn) startAmbientMusic();
    setCurrentUserId(found.id);
    setActiveMissionId(null);
    setCameraMode('overview');
    showToast(`Selamat datang, ${found.fullName}!`);
  };

  // Student Access directly via Nama + ID Murid + Kelas (auto-resumes or auto-creates record)
  const handleEnterStudent = (fullName: string, studentId: string, className: string) => {
    const cleanId = studentId.trim().toUpperCase();
    const existing = db.users.find(
      (u) =>
        u.role === 'murid' &&
        ((u.studentId || '').toUpperCase() === cleanId ||
          (u.fullName.toLowerCase() === fullName.toLowerCase() && u.className === className))
    );

    if (existing) {
      updateDB((draft) => {
        const target = draft.users.find((u) => u.id === existing.id);
        if (target) {
          target.fullName = fullName;
          target.className = className;
        }
        addLog(draft, fullName, `Log masuk ke EcoWorld 3D (${cleanId} · ${className})`);
      });
      playSFX('xp');
      if (musicOn) startAmbientMusic();
      setCurrentUserId(existing.id);
      setActiveMissionId(null);
      setFocusedMissionId(existing.unlockedMission || 1);
      setCameraMode('overview');
      setShowAgentSelect(true);
      showToast(`Selamat kembali, ${fullName}! Pilih ejen anda sebelum mula misi.`);
      return;
    }

    const newId = 'M' + Date.now();
    const newStudent: UserAccount = {
      id: newId,
      role: 'murid',
      username: cleanId.toLowerCase(),
      password: '',
      fullName,
      studentId: cleanId,
      className,
      classCode: className.replace(/\s+/g, '').toUpperCase(),
      avatar: 'rimba',
      xp: 0,
      unlockedMission: 1,
      progress: {
        m1: { completed: false, score: 0, tersuratScore: 0, tersiratScore: 0, evidence: [] },
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
      teacherFeedback: 'Belum ada maklum balas guru.',
      aiApprovedByTeacher: false,
      peerFeedback: '',
    };

    updateDB((draft) => {
      draft.users.push(newStudent);
      addLog(draft, fullName, `Akses baharu (${cleanId} · ${className})`);
    });
    playSFX('win');
    if (musicOn) startAmbientMusic();
    setCurrentUserId(newId);
    setActiveMissionId(null);
    setFocusedMissionId(1);
    setCameraMode('overview');
    setShowAgentSelect(true);
    showToast(`Selamat datang Ejen ${fullName}! Pilih ejen pilihan anda.`);
  };

  const handleSelectMissionFromWorld = useCallback(
    (missionId: number) => {
      if (!currentUser || currentUser.role !== 'murid') return;
      const mission = db.missions.find((m) => m.id === missionId);
      if (!mission) return;
      if (!mission.active) {
        showToast('Misi ini dinyahaktifkan oleh Admin buat sementara.', true);
        return;
      }
      if (missionId > (currentUser.unlockedMission || 1)) {
        showToast(`Selesaikan Misi ${missionId - 1} dahulu untuk membuka zon ini!`, true);
        return;
      }
      playSFX('portal');
      setFocusedMissionId(missionId);
      setCameraMode('zone');
      setActiveMissionId(missionId);
    },
    [currentUser, db.missions, showToast]
  );

  const handleToggleMusic = useCallback(() => {
    const next = !musicOn;
    setMusicOn(next);
    setMusicEnabled(next);
    if (next) playSFX('click');
  }, [musicOn]);

  const handleChangeMusicVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setMusicVolumeState(clamped);
    setMusicVolume(clamped);
    if (clamped <= 0.01) {
      setMusicOn(false);
      setMusicEnabled(false);
    } else if (!musicOn) {
      setMusicOn(true);
      setMusicEnabled(true);
    }
  }, [musicOn]);

  const handleCollectClue = useCallback(
    (clue: Clue3D) => {
      if (!currentUser || currentUser.role !== 'murid') return;
      playSFX('clue');
      setM1CluesFound((prev) => (prev.includes(clue.id) ? prev : [...prev, clue.id]));
      updateDB((draft) => {
        const u = draft.users.find((x) => x.id === currentUser.id);
        if (u?.progress) {
          u.progress.m1.evidence = Array.from(
            new Set([...u.progress.m1.evidence, `${clue.title}: ${clue.description}`])
          );
        }
      });
      showToast(`Bukti ditemui: ${clue.title}! Disimpan dalam Evidence Book.`);
    },
    [currentUser, updateDB, showToast]
  );

  const triggerMissionWarp = useCallback(
    (
      completedId: number,
      score: number,
      xpEarned: number,
      message: string
    ) => {
      const nextId = completedId < 5 ? completedId + 1 : 5;
      const nextMission = db.missions.find((m) => m.id === nextId);
      playSFX('warp');
      setWarpState({
        title:
          completedId < 5
            ? `MISI 0${completedId} BERJAYA!`
            : 'ECOWORLD DISELAMATKAN!',
        subtitle:
          completedId < 5
            ? `BERPINDAH KE ZON MISI 0${nextId}: ${(nextMission?.title || '').toUpperCase()}`
            : 'MEMBUKA SIJIL KEJAYAAN HALL OF HEROES',
        accentColor: nextMission?.color || '#34d399',
        onMidpoint: () => {
          setActiveMissionId(null);
          setFocusedMissionId(nextId);
          setCameraMode('zone');
        },
        onComplete: () => {
          setWarpState(null);
          playSFX('win');
          setSuccessInfo({
            missionId: completedId,
            score,
            xpEarned,
            message,
          });
        },
      });
    },
    [db.missions]
  );

  const handleCompleteM1 = (
    score: number,
    tersuratScore: number,
    tersiratScore: number,
    evidence: string
  ) => {
    if (!currentUser) return;
    const isFirst = !currentUser.progress?.m1.completed;
    const xpEarned = isFirst ? 150 : 0;
    updateDB((draft) => {
      const u = draft.users.find((x) => x.id === currentUser.id)!;
      u.progress!.m1 = {
        completed: true,
        score,
        tersuratScore,
        tersiratScore,
        evidence: Array.from(new Set([...u.progress!.m1.evidence, evidence].filter(Boolean))),
      };
      u.xp = (u.xp || 0) + xpEarned;
      if ((u.unlockedMission || 1) < 2) u.unlockedMission = 2;
      evaluateBadges(u);
      addLog(draft, u.fullName, `Menyelesaikan Misi 1 (${score}%)`);
    });
    triggerMissionWarp(
      1,
      score,
      xpEarned,
      `Tersurat: ${tersuratScore}% · Tersirat: ${tersiratScore}%. Rekod telah dihantar ke Dashboard Guru & Zon 2 kini dibuka!`
    );
  };

  const handleCompleteM2 = (
    score: number,
    kbatScore: number,
    punca: string,
    kesan: string,
    kbatAnswer: string
  ) => {
    if (!currentUser) return;
    const isFirst = !currentUser.progress?.m2.completed;
    const xpEarned = isFirst ? 180 : 0;
    updateDB((draft) => {
      const u = draft.users.find((x) => x.id === currentUser.id)!;
      u.progress!.m2 = {
        completed: true,
        score,
        kbatScore,
        thinkingMap: { punca, kesan },
        kbatAnswer,
      };
      u.xp = (u.xp || 0) + xpEarned;
      if ((u.unlockedMission || 1) < 3) u.unlockedMission = 3;
      evaluateBadges(u);
      addLog(draft, u.fullName, `Menyelesaikan Misi 2 (${score}%)`);
    });
    triggerMissionWarp(
      2,
      score,
      xpEarned,
      'Jerebu berjaya dibersihkan & rekod dihantar ke Dashboard Guru! Zon 3 kini dibuka.'
    );
  };

  const handleCompleteM3 = (score: number, chosenOption: string, justification: string) => {
    if (!currentUser) return;
    const isFirst = !currentUser.progress?.m3.completed;
    const xpEarned = isFirst ? 180 : 0;
    updateDB((draft) => {
      const u = draft.users.find((x) => x.id === currentUser.id)!;
      u.progress!.m3 = { completed: true, score, chosenOption, justification };
      u.xp = (u.xp || 0) + xpEarned;
      if ((u.unlockedMission || 1) < 4) u.unlockedMission = 4;
      evaluateBadges(u);
      addLog(draft, u.fullName, `Menyelesaikan Misi 3 (${score}%)`);
    });
    triggerMissionWarp(
      3,
      score,
      xpEarned,
      'Turbin angin Hutan Harapan kini berputar! Makmal Suara (Misi 4) kini dibuka.'
    );
  };

  const handleCompleteM4 = (
    score: number,
    argument: { pendirian: string; bukti: string; huraian: string; kesimpulan: string },
    hasRecording: boolean,
    peerFeedback: string
  ) => {
    if (!currentUser) return;
    const isFirst = !currentUser.progress?.m4.completed;
    const xpEarned = isFirst ? 220 : 0;
    updateDB((draft) => {
      const u = draft.users.find((x) => x.id === currentUser.id)!;
      u.progress!.m4 = {
        completed: true,
        score,
        argument,
        hasRecording: hasRecording || u.progress!.m4.hasRecording,
      };
      u.peerFeedback = peerFeedback;
      u.xp = (u.xp || 0) + xpEarned;
      if ((u.unlockedMission || 1) < 5) u.unlockedMission = 5;
      evaluateBadges(u);
      addLog(draft, u.fullName, `Menyiapkan Makmal Suara (${score}%)`);
    });
    triggerMissionWarp(
      4,
      score,
      xpEarned,
      'Hujah kritis anda mantap! Monumen Operasi Selamatkan EcoWorld (Misi 5) kini dibuka.'
    );
  };

  const handleCompleteM5 = (
    title: string,
    link: string,
    stepsDone: number[],
    rubricScore: number,
    reflection: string
  ) => {
    if (!currentUser) return;
    const isFirst = !currentUser.progress?.m5.submitted;
    const xpEarned = isFirst ? 300 : 0;
    updateDB((draft) => {
      const u = draft.users.find((x) => x.id === currentUser.id)!;
      u.progress!.m5 = {
        completed: true,
        submitted: true,
        title,
        link,
        stepsDone,
        rubricScore,
        reflection,
      };
      u.xp = (u.xp || 0) + xpEarned;
      evaluateBadges(u);
      addLog(draft, u.fullName, `Menghantar Kempen Digital: ${title}`);
    });
    triggerMissionWarp(
      5,
      rubricScore,
      xpEarned,
      'TAHNIAH! EcoWorld berjaya diselamatkan. Cetak atau muat turun sijil PDF anda sekarang!'
    );
  };

  const activeMission = db.missions.find((m) => m.id === activeMissionId) || null;
  const currentAv = AVATARS.find((a) => a.id === currentUser?.avatar) || AVATARS[0];
  const trackInfo = getMusicTrackInfo({
    zoneId: currentUser ? activeMusicZone : 0,
    inMission: Boolean(activeMissionId),
    zoneRestored: isZoneRestored,
  });

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      {/* Dedicated Isolated 3D WebGL Canvas */}
      <EcoWorldCanvas
        user={currentUser}
        missions={db.missions}
        cameraMode={cameraMode}
        focusedMissionId={focusedMissionId}
        activeRoomId={currentUser?.role === 'murid' ? activeMissionId : null}
        m1CluesFound={m1CluesFound}
        dpadVector={dpadVector}
        onSelectMission={handleSelectMissionFromWorld}
        onCollectClue={handleCollectClue}
        onHoverInfo={setHoverInfo}
        onProximityZoneChange={setProximityZoneId}
      />

      {/* Top Navigation Bar */}
      {currentUser && (
        <header className="no-print fixed top-0 inset-x-0 z-30 px-4 md:px-6 py-2 bg-slate-950/92 border-b border-emerald-500/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="game-title-emerald text-lg md:text-xl font-black whitespace-nowrap shrink-0">
              ECOWORLD 3D
            </span>
            <span className="hidden sm:inline text-xs text-slate-300 font-medium whitespace-nowrap truncate">
              {currentUser.fullName} · {currentUser.role.toUpperCase()}
              {currentUser.role === 'murid' &&
                ` · ${currentUser.studentId} · ${currentUser.className} · Lv.${calcLevel(
                  currentUser.xp || 0
                )} · ${currentUser.xp || 0} XP`}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {musicOn && (
              <span className="hidden xl:inline text-xs text-emerald-300/80 font-mono-num whitespace-nowrap mr-1">
                {trackInfo.title} · {trackInfo.intensityPct}%
              </span>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700">
              <button
                type="button"
                onClick={handleToggleMusic}
                className={`text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  musicOn ? 'text-emerald-300' : 'text-slate-400'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{musicOn ? 'Muzik ON' : 'Muzik OFF'}</span>
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={musicOn ? Math.round(musicVolume * 100) : 0}
                onChange={(e) => handleChangeMusicVolume(Number(e.target.value) / 100)}
                aria-label="Kelantangan muzik latar"
                className="w-14 sm:w-20 accent-emerald-400 cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                setSoundEnabled(next);
                if (next) playSFX('click');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              {soundOn ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="hidden md:inline">{soundOn ? 'SFX ON' : 'SFX OFF'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playSFX('click');
                setShowWhereto(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 whitespace-nowrap cursor-pointer"
            >
              Panduan WHERETO
            </button>

            <button
              type="button"
              onClick={() => {
                playSFX('click');
                setCurrentUserId(null);
                setActiveMissionId(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Keluar
            </button>
          </div>
        </header>
      )}

      {/* First-Person POV Indicator & Subtle 3D Hover Tooltip */}
      {currentUser?.role === 'murid' && !activeMission && cameraMode === 'firstPerson' && !hoverInfo && (
        <div className="no-print fixed top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-xl bg-slate-950/95 border border-emerald-400/70 text-xs font-game font-bold text-emerald-200 pointer-events-none shadow-lg">
          👁️ PANDANGAN MATA EJEN ({currentAv.name}) · W/S Jalan · A/D Pusing
        </div>
      )}
      {hoverInfo && currentUser?.role === 'murid' && !activeMission && (
        <div className="no-print fixed top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-xl bg-slate-950/95 border border-amber-400/60 text-xs font-semibold text-amber-200 pointer-events-none shadow-lg">
          {hoverInfo}
        </div>
      )}

      {/* Step 1: Static 16:9 Welcome Splash Screen with Single MULA Button */}
      {!currentUser && showSplash && <WelcomeSplash onStart={handleStartFromSplash} />}

      {/* Step 1.5: Dramatic 30s Intro Video Cutscene with "Amaran! Bumi Dalam Bahaya!" */}
      {!currentUser && !showSplash && showIntroVideo && (
        <IntroVideoCutscene onComplete={handleFinishIntroVideo} />
      )}

      {/* Step 2: Role Access Portal (Admin, Guru, Murid) */}
      {!currentUser && !showSplash && !showIntroVideo && (
        <LoginPortal
          classes={db.classes}
          onBackToSplash={() => {
            setShowIntroVideo(false);
            setShowSplash(true);
          }}
          onLoginStaff={handleLoginStaff}
          onEnterStudent={handleEnterStudent}
        />
      )}

      {/* Teacher Dashboard */}
      {currentUser?.role === 'guru' && (
        <TeacherDashboard
          db={db}
          teacher={currentUser}
          onSaveFeedback={(studentId, fb) => {
            updateDB((draft) => {
              const s = draft.users.find((u) => u.id === studentId);
              if (s) s.teacherFeedback = fb;
            });
            playSFX('xp');
            showToast('Maklum balas guru disimpan!');
          }}
          onApproveAI={(studentId, approved) => {
            updateDB((draft) => {
              const s = draft.users.find((u) => u.id === studentId);
              if (s) s.aiApprovedByTeacher = approved;
            });
            playSFX('click');
            showToast('Status pengesahan AI dikemas kini.');
          }}
        />
      )}

      {/* Admin Dashboard */}
      {currentUser?.role === 'admin' && (
        <AdminDashboard
          db={db}
          onAddTeacher={(fullName, username, password) => {
            updateDB((draft) => {
              draft.users.push({
                id: 't' + Date.now(),
                role: 'guru',
                fullName,
                username,
                password,
              });
              addLog(draft, currentUser.fullName, `Mendaftar guru baharu: ${fullName}`);
            });
            playSFX('xp');
            showToast('Guru baharu ditambah!');
          }}
          onUpdateTeacherPassword={(userId, newPassword) => {
            updateDB((draft) => {
              const t = draft.users.find((u) => u.id === userId);
              if (t) t.password = newPassword;
            });
            playSFX('xp');
            showToast('Kata laluan guru dikemas kini.');
          }}
          onAddClass={(name, code) => {
            updateDB((draft) => {
              draft.classes.push({ id: 'c' + Date.now(), name, code });
            });
            playSFX('xp');
            showToast('Kelas baharu ditambah!');
          }}
          onDeleteUser={(userId) => {
            updateDB((draft) => {
              draft.users = draft.users.filter((u) => u.id !== userId);
            });
            showToast('Pengguna dipadam.');
          }}
          onDeleteClass={(classId) => {
            updateDB((draft) => {
              draft.classes = draft.classes.filter((c) => c.id !== classId);
            });
            showToast('Kelas dipadam.');
          }}
          onToggleMission={(index, active) => {
            updateDB((draft) => {
              draft.missions[index].active = active;
            });
            showToast('Status misi dikemas kini.');
          }}
          onSaveApi={(url) => {
            updateDB((draft) => {
              draft.apiEndpoint = url;
            });
            showToast('URL Sync disimpan.');
          }}
          onResetDemo={() => {
            setDb(resetDemoDB());
            showToast('Data demo berjaya ditetapkan semula.');
          }}
        />
      )}

      {/* Student Collapsible Bottom Control Dock (Hidden while inside a 3D Mission Room) */}
      {currentUser?.role === 'murid' && !activeMission && (
        <div
          className={`no-print fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[min(960px,95vw)] transition-transform duration-300 ${
            dockCollapsed ? 'translate-y-[calc(100%-34px)]' : 'translate-y-0'
          }`}
        >
          <div className="flex justify-center mb-1.5">
            <button
              type="button"
              onClick={() => {
                playSFX('click');
                setDockCollapsed((p) => !p);
              }}
              className="px-4 py-1 rounded-t-xl bg-slate-950/95 border border-b-0 border-slate-700 text-[11px] font-game font-bold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              {dockCollapsed ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> Papar Kawalan (H)
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-amber-300" /> Sembunyi Kawalan (H)
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-950/94 border-2 border-emerald-500/40 rounded-2xl p-3 shadow-2xl space-y-2.5">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {db.missions.map((m) => {
                const mp = currentUser.progress![`m${m.id}` as 'm1' | 'm2' | 'm3' | 'm4' | 'm5'];
                const done = 'submitted' in mp ? mp.submitted : mp.completed;
                const unlocked = m.id <= (currentUser.unlockedMission || 1) && m.active;
                const isFocused = focusedMissionId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMissionFromWorld(m.id)}
                    className={`px-2.5 py-2 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      done
                        ? 'bg-amber-950/45 border-amber-400/80 text-amber-100'
                        : unlocked
                        ? isFocused
                          ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-md'
                          : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-emerald-400'
                        : 'bg-slate-900/50 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-game font-bold">
                      <span>
                        {m.icon} MISI 0{m.id}
                      </span>
                      <span>{done ? '✅' : unlocked ? '▶' : '🔒'}</span>
                    </div>
                    <div className="text-xs font-display font-bold truncate mt-0.5">
                      {m.shortTitle}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-800">
              <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
                <Compass className="w-3.5 h-3.5 text-sky-400 ml-1.5 mr-1" />
                {(
                  [
                    ['overview', 'Pulau'],
                    ['follow', 'Ikut Ejen'],
                    ['firstPerson', 'Mata Ejen'],
                    ['zone', 'Zon'],
                  ] as [CameraMode, string][]
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      playSFX('click');
                      setCameraMode(mode);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer whitespace-nowrap ${
                      cameraMode === mode
                        ? 'bg-sky-500 text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="hidden lg:inline">Gerak: WASD / Klik Pulau ·</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onPointerDown={() => setDpadVector({ x: -1, z: 0 })}
                    onPointerUp={() => setDpadVector({ x: 0, z: 0 })}
                    onPointerLeave={() => setDpadVector({ x: 0, z: 0 })}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
                    aria-label="Gerak kiri"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onPointerDown={() => setDpadVector({ x: 0, z: -1 })}
                    onPointerUp={() => setDpadVector({ x: 0, z: 0 })}
                    onPointerLeave={() => setDpadVector({ x: 0, z: 0 })}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
                    aria-label="Gerak depan"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onPointerDown={() => setDpadVector({ x: 0, z: 1 })}
                    onPointerUp={() => setDpadVector({ x: 0, z: 0 })}
                    onPointerLeave={() => setDpadVector({ x: 0, z: 0 })}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
                    aria-label="Gerak belakang"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onPointerDown={() => setDpadVector({ x: 1, z: 0 })}
                    onPointerUp={() => setDpadVector({ x: 0, z: 0 })}
                    onPointerLeave={() => setDpadVector({ x: 0, z: 0 })}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
                    aria-label="Gerak kanan"
                  >
                    ▶
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    playSFX('click');
                    setShowAgentSelect(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/50 text-teal-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>{currentAv.emoji}</span> Pilih Ejen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSFX('click');
                    setShowEvidence(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Evidence Book (
                  {currentUser.progress?.m1.evidence.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSFX('click');
                    setShowProfile(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <User className="w-3.5 h-3.5" /> Profil & Lencana (
                  {(currentUser.badges || []).length}/5)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSFX('click');
                    setShowHeroes(true);
                  }}
                  className="btn-game-gold px-3.5 py-1.5 rounded-xl text-slate-950 font-game text-xs font-black flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Trophy className="w-3.5 h-3.5" /> Hall of Heroes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3D Virtual Mission Room HUD & Activity Panel */}
      {activeMission && currentUser?.role === 'murid' && (
        <MissionDrawer
          mission={activeMission}
          user={currentUser}
          m1CluesFound={m1CluesFound}
          musicOn={musicOn}
          musicVolume={musicVolume}
          onToggleMusic={handleToggleMusic}
          onChangeMusicVolume={handleChangeMusicVolume}
          onCollectClue={handleCollectClue}
          onClose={() => setActiveMissionId(null)}
          onCompleteMission1={handleCompleteM1}
          onCompleteMission2={handleCompleteM2}
          onCompleteMission3={handleCompleteM3}
          onCompleteMission4={handleCompleteM4}
          onCompleteMission5={handleCompleteM5}
        />
      )}

      {/* Student & Shared Modals */}
      {showAgentSelect && currentUser?.role === 'murid' && (
        <AgentSelectModal
          user={currentUser}
          onSelectAgent={(avatarId: AvatarId) => {
            updateDB((draft) => {
              const u = draft.users.find((x) => x.id === currentUser.id);
              if (u) u.avatar = avatarId;
            });
            setShowAgentSelect(false);
            const av = AVATARS.find((a) => a.id === avatarId);
            showToast(`Anda kini bertugas sebagai ${av?.name || 'Ejen EcoWorld'}! Klik Misi 1 untuk bermula.`);
          }}
        />
      )}
      {showEvidence && currentUser && (
        <EvidenceBookModal user={currentUser} onClose={() => setShowEvidence(false)} />
      )}
      {showProfile && currentUser && (
        <ProfileBadgesModal
          user={currentUser}
          missions={db.missions}
          onChangeAvatar={(avatarId: AvatarId) => {
            updateDB((draft) => {
              const u = draft.users.find((x) => x.id === currentUser.id);
              if (u) u.avatar = avatarId;
            });
            playSFX('click');
            showToast('Karakter Ejen 3D bertukar!');
          }}
          onOpenMission={(id) => handleSelectMissionFromWorld(id)}
          onClose={() => setShowProfile(false)}
        />
      )}
      {showHeroes && currentUser && (
        <HallOfHeroesModal user={currentUser} onClose={() => setShowHeroes(false)} />
      )}
      {showWhereto && <WheretoModal onClose={() => setShowWhereto(false)} />}
      {successInfo && currentUser && (() => {
        const nextM =
          successInfo.missionId < 5
            ? db.missions.find((m) => m.id === successInfo.missionId + 1 && m.active) || null
            : null;
        return (
          <MissionSuccessModal
            user={currentUser}
            info={successInfo}
            nextMission={nextM}
            onTeleportNext={
              nextM
                ? () => {
                    setSuccessInfo(null);
                    playSFX('warp');
                    setWarpState({
                      title: `TELEPORTASI KE MISI 0${nextM.id}`,
                      subtitle: nextM.title.toUpperCase(),
                      accentColor: nextM.color,
                      onMidpoint: () => {
                        setFocusedMissionId(nextM.id);
                        setCameraMode('zone');
                        setActiveMissionId(nextM.id);
                      },
                      onComplete: () => {
                        setWarpState(null);
                        playSFX('portal');
                      },
                    });
                  }
                : undefined
            }
            onClose={() => setSuccessInfo(null)}
            onOpenHeroes={() => {
              setSuccessInfo(null);
              setShowHeroes(true);
            }}
          />
        );
      })()}

      {/* Cinematic Teleportation / Warp Speed Overlay */}
      {warpState && (
        <WarpTransition
          title={warpState.title}
          subtitle={warpState.subtitle}
          accentColor={warpState.accentColor}
          onMidpoint={warpState.onMidpoint}
          onComplete={() => warpState.onComplete?.()}
        />
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`no-print fixed top-16 right-4 z-50 px-4 py-3 rounded-2xl border shadow-2xl text-xs md:text-sm font-semibold flex items-center gap-2 ${
            toastMsg.isError
              ? 'bg-rose-950/95 border-rose-500 text-rose-100'
              : 'bg-slate-950/95 border-emerald-400 text-emerald-100'
          }`}
        >
          <Award className="w-4 h-4 shrink-0" />
          <span>{toastMsg.text}</span>
        </div>
      )}
    </div>
  );
}
