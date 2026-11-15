import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { AvatarId, CameraMode, Clue3D, MissionDef, UserAccount } from '../types/game';
import { M1_CLUES_3D } from '../data/gameData';
import {
  AgentRig,
  buildEcoAgentAvatar,
  buildInstancedForestAndRocks,
  buildZone1RiverFactory,
  buildZone2ToxicCity,
  buildZone3HopeForest,
  buildZone4VoiceLab,
  buildZone5EcoMonument,
  buildZoneBeacon,
} from './models';
import { buildMissionRoom, MissionRoomHandle } from './missionRooms';
import { createContactShadowTexture, createTerrainTexture } from './textures';

export interface EcoWorldCanvasProps {
  user: UserAccount | null;
  missions: MissionDef[];
  cameraMode: CameraMode;
  focusedMissionId: number;
  activeRoomId: number | null;
  m1CluesFound: string[];
  dpadVector: { x: number; z: number };
  onSelectMission: (missionId: number) => void;
  onCollectClue: (clue: Clue3D) => void;
  onHoverInfo: (label: string | null) => void;
  onProximityZoneChange?: (zoneId: number) => void;
}

// Pre-allocated math helpers (zero GC inside animation loop)
const _moveDir = new THREE.Vector3();
const _desiredCamPos = new THREE.Vector3();
const _desiredTarget = new THREE.Vector3();
const _forwardVec = new THREE.Vector3();
const _rightVec = new THREE.Vector3();
const _rayOrigin = new THREE.Vector2();

export function EcoWorldCanvas({
  user,
  missions,
  cameraMode,
  focusedMissionId,
  activeRoomId,
  m1CluesFound,
  dpadVector,
  onSelectMission,
  onCollectClue,
  onHoverInfo,
  onProximityZoneChange,
}: EcoWorldCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // Store latest props in refs so WebGL loop reads live state without tearing down scene
  const propsRef = useRef({
    user,
    missions,
    cameraMode,
    focusedMissionId,
    activeRoomId,
    m1CluesFound,
    dpadVector,
    onSelectMission,
    onCollectClue,
    onHoverInfo,
    onProximityZoneChange,
  });
  propsRef.current = {
    user,
    missions,
    cameraMode,
    focusedMissionId,
    activeRoomId,
    m1CluesFound,
    dpadVector,
    onSelectMission,
    onCollectClue,
    onHoverInfo,
    onProximityZoneChange,
  };
  const lastProxZoneRef = useRef<number>(0);

  // Ref for triggering avatar auto-walk to a clicked zone or ground point
  const navGoalRef = useRef<THREE.Vector3 | null>(null);
  const userOrbitingRef = useRef(false);
  const prevFocusRef = useRef<number>(focusedMissionId);
  const prevCamModeRef = useRef<CameraMode>(cameraMode);
  const prevRoomIdRef = useRef<number | null>(activeRoomId);

  useEffect(() => {
    if (prevRoomIdRef.current !== activeRoomId) {
      userOrbitingRef.current = false;
      prevRoomIdRef.current = activeRoomId;
    }
    if (
      prevFocusRef.current !== focusedMissionId ||
      prevCamModeRef.current !== cameraMode
    ) {
      userOrbitingRef.current = false;
      const targetMission = missions.find((m) => m.id === focusedMissionId);
      if (targetMission && (cameraMode === 'zone' || prevFocusRef.current !== focusedMissionId)) {
        // Walk agent near the selected zone (offset slightly toward plaza center)
        const [zx, , zz] = targetMission.position;
        const len = Math.hypot(zx, zz) || 1;
        const offsetX = zx === 0 && zz === 0 ? 0 : zx - (zx / len) * 3.8;
        const offsetZ = zx === 0 && zz === 0 ? 4.2 : zz - (zz / len) * 3.8;
        navGoalRef.current = new THREE.Vector3(offsetX, 0, offsetZ);
      }
      prevFocusRef.current = focusedMissionId;
      prevCamModeRef.current = cameraMode;
    }
  }, [focusedMissionId, cameraMode, activeRoomId, missions]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL Detection (GPU renderer string, never userAgent)
    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const skyColor = new THREE.Color(0x0c4a6e);
    scene.background = skyColor;
    scene.fog = new THREE.FogExp2(0x0c4a6e, 0.0085);

    // Studio Environment Reflection (PMREM RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.5, 240);
    camera.position.set(0, 26, 38);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.minPolarAngle = 0.25;
    controls.minDistance = 10;
    controls.maxDistance = 75;
    controls.target.set(0, 1.5, 0);

    controls.addEventListener('start', () => {
      userOrbitingRef.current = true;
    });

    // 2. Three-Point Warm/Cool Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x1e3a2f, 0.85);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.85);
    sunLight.position.set(28, 38, 22);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 110;
    const d = 34;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.55);
    rimLight.position.set(-25, 16, -28);
    scene.add(rimLight);

    // 3. Ocean & EcoWorld Island Terrain (inside islandWorldGroup so rooms can replace view cleanly)
    const islandWorldGroup = new THREE.Group();
    scene.add(islandWorldGroup);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const terrainTex = createTerrainTexture(maxAnisotropy);
    const shadowTex = createContactShadowTexture();

    const oceanMesh = new THREE.Mesh(
      new THREE.CircleGeometry(140, 48),
      new THREE.MeshStandardMaterial({
        color: 0x0369a1,
        roughness: 0.16,
        metalness: 0.35,
      })
    );
    oceanMesh.rotation.x = -Math.PI / 2;
    oceanMesh.position.y = -0.38;
    oceanMesh.receiveShadow = true;
    islandWorldGroup.add(oceanMesh);

    const islandMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(29.5, 31.5, 1.1, 48),
      new THREE.MeshStandardMaterial({
        map: terrainTex,
        roughness: 0.88,
        metalness: 0.02,
      })
    );
    islandMesh.position.y = -0.55;
    islandMesh.receiveShadow = true;
    islandWorldGroup.add(islandMesh);

    // Glowing Golden Adventure Trails connecting Plaza (0,0,0) to Zones 1–4
    const trailMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xca8a04,
      emissiveIntensity: 0.3,
      roughness: 0.5,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    propsRef.current.missions
      .filter((m) => m.id !== 5)
      .forEach((m) => {
        const pathCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.04, 0),
          new THREE.Vector3(m.position[0] * 0.5, 0.04, m.position[2] * 0.5 + 1.8),
          new THREE.Vector3(m.position[0], 0.04, m.position[2]),
        ]);
        const pathGeo = new THREE.TubeGeometry(pathCurve, 20, 0.55, 6, false);
        pathGeo.scale(1, 0.08, 1);
        const pathMesh = new THREE.Mesh(pathGeo, trailMat);
        pathMesh.position.y = 0.03;
        pathMesh.receiveShadow = true;
        islandWorldGroup.add(pathMesh);
      });

    // 4. Build All 5 Interactive 3D Zones & Perimeter Environment
    const zone1 = buildZone1RiverFactory(maxAnisotropy);
    islandWorldGroup.add(zone1.group);

    const zone2 = buildZone2ToxicCity(maxAnisotropy);
    islandWorldGroup.add(zone2.group);

    const zone3 = buildZone3HopeForest();
    islandWorldGroup.add(zone3.group);

    const zone4 = buildZone4VoiceLab();
    islandWorldGroup.add(zone4.group);

    const zone5 = buildZone5EcoMonument(maxAnisotropy);
    islandWorldGroup.add(zone5.group);

    buildInstancedForestAndRocks(
      islandWorldGroup,
      propsRef.current.missions.map((m) => m.position)
    );

    // Zone Waypoint Beacons
    const beacons = propsRef.current.missions.map((m) => {
      const b = buildZoneBeacon(m.id, m.shortTitle, `Misi ${m.id}`, m.color);
      b.group.position.set(m.position[0], 0, m.position[2]);
      islandWorldGroup.add(b.group);
      return { missionId: m.id, ...b };
    });

    // 5. Playable 3D Ejen Avatar
    let currentAvatarId: AvatarId = propsRef.current.user?.avatar || 'rimba';
    let agentRig: AgentRig = buildEcoAgentAvatar(currentAvatarId, shadowTex);
    agentRig.group.position.set(0, 0, 5.2);
    islandWorldGroup.add(agentRig.group);

    const rebuildAgentIfChanged = (nextId: AvatarId) => {
      if (nextId === currentAvatarId) return;
      const pos = agentRig.group.position.clone();
      const rotY = agentRig.group.rotation.y;
      islandWorldGroup.remove(agentRig.group);
      currentAvatarId = nextId;
      agentRig = buildEcoAgentAvatar(nextId, shadowTex);
      agentRig.group.position.copy(pos);
      agentRig.group.rotation.y = rotY;
      islandWorldGroup.add(agentRig.group);
    };

    // Cached 3D Virtual Mission Rooms (built lazily on first visit to keep startup fast)
    const roomCache = new Map<number, MissionRoomHandle>();
    const getOrBuildRoom = (roomId: number): MissionRoomHandle | null => {
      if (roomId < 1 || roomId > 5) return null;
      let handle = roomCache.get(roomId);
      if (!handle) {
        handle = buildMissionRoom(roomId as 1 | 2 | 3 | 4 | 5, maxAnisotropy);
        handle.group.visible = false;
        scene.add(handle.group);
        roomCache.set(roomId, handle);
      }
      return handle;
    };

    // 6. Keyboard & Pointer Raycasting Interaction
    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
      ) {
        return;
      }
      keys[e.code] = true;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        navGoalRef.current = null;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const groundRaycaster = new THREE.Raycaster();
    let pointerDownPos = { x: 0, y: 0 };
    let lastHoverTime = 0;

    const getInteractiveTargets = () => {
      const list: THREE.Object3D[] = beacons.map((b) => b.hitProxy);
      Object.values(zone1.clueMeshes).forEach((g) => {
        const hit = g.children.find((ch) => ch.userData.type === 'clue');
        if (hit) list.push(hit);
      });
      return list;
    };

    const updateMouseCoords = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _rayOrigin.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      _rayOrigin.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (propsRef.current.activeRoomId) {
        renderer.domElement.style.cursor = 'grab';
        propsRef.current.onHoverInfo(null);
        return;
      }
      const now = performance.now();
      if (now - lastHoverTime < 60) return;
      lastHoverTime = now;

      updateMouseCoords(e.clientX, e.clientY);
      raycaster.setFromCamera(_rayOrigin, camera);
      const hits = raycaster.intersectObjects(getInteractiveTargets(), false);

      if (hits.length > 0) {
        const ud = hits[0].object.userData;
        renderer.domElement.style.cursor = 'pointer';
        if (ud.type === 'zone') {
          const m = propsRef.current.missions.find((x) => x.id === ud.missionId);
          propsRef.current.onHoverInfo(m ? `Klik untuk buka Misi ${m.id}: ${m.title}` : null);
        } else if (ud.type === 'clue') {
          const clue = M1_CLUES_3D.find((c) => c.id === ud.clueId);
          propsRef.current.onHoverInfo(clue ? `🔍 Bukti 3D: ${clue.title}` : null);
        }
      } else {
        renderer.domElement.style.cursor = 'grab';
        propsRef.current.onHoverInfo(null);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (propsRef.current.activeRoomId) return;
      const moveDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (moveDist > 8) return; // Was a camera drag, not a click

      updateMouseCoords(e.clientX, e.clientY);
      raycaster.setFromCamera(_rayOrigin, camera);
      const hits = raycaster.intersectObjects(getInteractiveTargets(), false);

      if (hits.length > 0) {
        const ud = hits[0].object.userData;
        if (ud.type === 'clue') {
          const clue = M1_CLUES_3D.find((c) => c.id === ud.clueId);
          if (clue) {
            navGoalRef.current = new THREE.Vector3(clue.position[0], 0, clue.position[2] + 1.8);
            propsRef.current.onCollectClue(clue);
          }
          return;
        }
        if (ud.type === 'zone') {
          propsRef.current.onSelectMission(ud.missionId);
          return;
        }
      }

      // Click-to-walk on island ground if logged in as student
      if (propsRef.current.user?.role === 'murid') {
        groundRaycaster.setFromCamera(_rayOrigin, camera);
        const groundHits = groundRaycaster.intersectObject(islandMesh, false);
        if (groundHits.length > 0) {
          const pt = groundHits[0].point;
          const distFromCenter = Math.hypot(pt.x, pt.z);
          if (distFromCenter < 25) {
            navGoalRef.current = new THREE.Vector3(pt.x, 0, pt.z);
          }
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // WebGL Context Loss Safety
    const onContextLost = (ev: Event) => {
      ev.preventDefault();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    // Resize Handler
    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Pre-warm shaders on hardware GPUs
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 7. Continuous Animation & Physics Loop (Software-WebGL paced via afterDraw)
    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const {
        user: curUser,
        cameraMode: curCamMode,
        focusedMissionId: curFocusId,
        activeRoomId: curRoomId,
        m1CluesFound: curClues,
        dpadVector: curDpad,
        missions: curMissions,
      } = propsRef.current;

      // Switch between EcoWorld Island Map and dedicated 3D Virtual Mission Room
      const activeRoom = curRoomId ? getOrBuildRoom(curRoomId) : null;
      islandWorldGroup.visible = !activeRoom;
      roomCache.forEach((rm, rid) => {
        rm.group.visible = Boolean(activeRoom && rid === activeRoom.id);
      });

      if (activeRoom) {
        skyColor.setHex(activeRoom.bgColor);
        (scene.fog as THREE.FogExp2).color.setHex(activeRoom.fogColor);
        (scene.fog as THREE.FogExp2).density = 0.012;
        controls.minDistance = 4;
        controls.maxDistance = 24;
        controls.maxPolarAngle = Math.PI / 2.02;

        const mKey = `m${activeRoom.id}` as 'm1' | 'm2' | 'm3' | 'm4' | 'm5';
        const mp = curUser?.progress?.[mKey];
        const roomRestored = Boolean(mp && ('submitted' in mp ? mp.submitted : mp.completed));
        activeRoom.animate(elapsed, dt, roomRestored);

        if (!userOrbitingRef.current) {
          _desiredCamPos.set(...activeRoom.cameraPos);
          _desiredTarget.set(...activeRoom.cameraTarget);
          camera.position.x = THREE.MathUtils.damp(camera.position.x, _desiredCamPos.x, 5.2, dt);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, _desiredCamPos.y, 5.2, dt);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, _desiredCamPos.z, 5.2, dt);
          controls.target.x = THREE.MathUtils.damp(controls.target.x, _desiredTarget.x, 5.5, dt);
          controls.target.y = THREE.MathUtils.damp(controls.target.y, _desiredTarget.y, 5.5, dt);
          controls.target.z = THREE.MathUtils.damp(controls.target.z, _desiredTarget.z, 5.5, dt);
        }

        controls.update();
        renderer.render(scene, camera);

        if (isSoftwareGl) {
          afterDraw(tick);
        } else {
          frameId = requestAnimationFrame(tick);
        }
        return;
      } else {
        skyColor.setHex(0x0c4a6e);
        (scene.fog as THREE.FogExp2).color.setHex(0x0c4a6e);
        (scene.fog as THREE.FogExp2).density = 0.0085;
        controls.minDistance = 10;
        controls.maxDistance = 75;
        controls.maxPolarAngle = Math.PI / 2.15;
      }

      // Update Avatar appearance if student switched avatar
      if (curUser?.avatar) {
        rebuildAgentIfChanged(curUser.avatar);
      }

      // Show 3D avatar unless viewing in First-Person POV
      const isFpsMode = curUser?.role === 'murid' && curCamMode === 'firstPerson';
      agentRig.group.visible = !isFpsMode;

      // Keyboard / D-Pad / Click-to-Walk Avatar Movement
      let inputX = curDpad.x;
      let inputZ = curDpad.z;
      if (keys['KeyW'] || keys['ArrowUp']) inputZ -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) inputZ += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) inputX -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) inputX += 1;

      let isMoving = false;
      if (curUser?.role === 'murid' && (Math.abs(inputX) > 0.05 || Math.abs(inputZ) > 0.05)) {
        if (isFpsMode) {
          userOrbitingRef.current = false;
          // In First-Person POV: A/D rotates view, W/S walks forward/backward along facing vector
          if (Math.abs(inputX) > 0.05) {
            agentRig.group.rotation.y -= inputX * 2.4 * dt;
          }
          if (Math.abs(inputZ) > 0.05) {
            const rotY = agentRig.group.rotation.y;
            _moveDir.set(Math.sin(rotY), 0, Math.cos(rotY)).multiplyScalar(-inputZ);
            const speed = 9.5;
            agentRig.group.position.addScaledVector(_moveDir, speed * dt);
            const r = Math.hypot(agentRig.group.position.x, agentRig.group.position.z);
            if (r > 25.5) {
              agentRig.group.position.x *= 25.5 / r;
              agentRig.group.position.z *= 25.5 / r;
            }
            isMoving = true;
          }
        } else {
          // Camera-relative movement on XZ plane
          camera.getWorldDirection(_forwardVec);
          _forwardVec.y = 0;
          _forwardVec.normalize();
          _rightVec.crossVectors(_forwardVec, THREE.Object3D.DEFAULT_UP).normalize();

          _moveDir
            .set(0, 0, 0)
            .addScaledVector(_forwardVec, -inputZ)
            .addScaledVector(_rightVec, inputX);
          if (_moveDir.lengthSq() > 0.001) {
            _moveDir.normalize();
            const speed = 9.5;
            agentRig.group.position.addScaledVector(_moveDir, speed * dt);
            // Keep inside playable island radius (25.5)
            const r = Math.hypot(agentRig.group.position.x, agentRig.group.position.z);
            if (r > 25.5) {
              agentRig.group.position.x *= 25.5 / r;
              agentRig.group.position.z *= 25.5 / r;
            }
            const targetRot = Math.atan2(_moveDir.x, _moveDir.z);
            agentRig.group.rotation.y = THREE.MathUtils.damp(
              agentRig.group.rotation.y,
              targetRot,
              10,
              dt
            );
            isMoving = true;
          }
        }
      } else if (navGoalRef.current) {
        _moveDir.subVectors(navGoalRef.current, agentRig.group.position);
        _moveDir.y = 0;
        const dist = _moveDir.length();
        if (dist > 0.4) {
          _moveDir.normalize();
          const speed = 10.5;
          agentRig.group.position.addScaledVector(_moveDir, Math.min(speed * dt, dist));
          const targetRot = Math.atan2(_moveDir.x, _moveDir.z);
          agentRig.group.rotation.y = THREE.MathUtils.damp(
            agentRig.group.rotation.y,
            targetRot,
            10,
            dt
          );
          isMoving = true;
        } else {
          navGoalRef.current = null;
        }
      }

      // Avatar Walk Cycle & Jetpack Bobbing
      if (isMoving) {
        const swing = Math.sin(elapsed * 12) * 0.55;
        agentRig.leftLeg.rotation.x = swing;
        agentRig.rightLeg.rotation.x = -swing;
        agentRig.leftArm.rotation.x = -swing * 0.7;
        agentRig.rightArm.rotation.x = swing * 0.7;
        agentRig.group.position.y = Math.abs(Math.sin(elapsed * 12)) * 0.14;
      } else {
        agentRig.leftLeg.rotation.x = THREE.MathUtils.damp(agentRig.leftLeg.rotation.x, 0, 8, dt);
        agentRig.rightLeg.rotation.x = THREE.MathUtils.damp(agentRig.rightLeg.rotation.x, 0, 8, dt);
        agentRig.leftArm.rotation.x = THREE.MathUtils.damp(agentRig.leftArm.rotation.x, 0, 8, dt);
        agentRig.rightArm.rotation.x = THREE.MathUtils.damp(agentRig.rightArm.rotation.x, 0, 8, dt);
        agentRig.group.position.y = THREE.MathUtils.damp(agentRig.group.position.y, 0, 8, dt);
      }
      agentRig.jetCore.scale.y = 0.9 + Math.sin(elapsed * 8) * 0.15;

      // Proximity Zone Detection for Adaptive Ambient Music
      if (curUser?.role === 'murid' && propsRef.current.onProximityZoneChange) {
        let nearZone = 0;
        let bestDistSq = 64; // 8 units radius
        for (let i = 0; i < curMissions.length; i++) {
          const m = curMissions[i];
          const dx = agentRig.group.position.x - m.position[0];
          const dz = agentRig.group.position.z - m.position[2];
          const dSq = dx * dx + dz * dz;
          if (dSq < bestDistSq) {
            bestDistSq = dSq;
            nearZone = m.id;
          }
        }
        if (nearZone !== lastProxZoneRef.current) {
          lastProxZoneRef.current = nearZone;
          propsRef.current.onProximityZoneChange(nearZone);
        }
      }

      // Zone Visual Restoration States (Reflects real student progress!)
      const m1Done = Boolean(curUser?.progress?.m1.completed);
      const m2Done = Boolean(curUser?.progress?.m2.completed);
      const m3Done = Boolean(curUser?.progress?.m3.completed);
      const m4Done = Boolean(curUser?.progress?.m4.completed);

      // River cleans up from dark polluted sludge to vibrant blue when Misi 1 finishes
      zone1.riverMat.color.lerp(
        new THREE.Color(m1Done ? 0x0ea5e9 : 0x1e293b),
        Math.min(1, dt * 2.5)
      );
      zone1.riverMat.emissive.lerp(
        new THREE.Color(m1Done ? 0x0369a1 : 0x0f172a),
        Math.min(1, dt * 2.5)
      );
      zone1.sludgeStream.visible = !m1Done;

      // Update 3D Clue crystals in Zone 1 (turn bright green once collected)
      (['paip', 'ikan', 'bau'] as const).forEach((cid, idx) => {
        const g = zone1.clueMeshes[cid];
        const orb = g.getObjectByName('clueOrb') as THREE.Mesh | undefined;
        if (orb) {
          orb.rotation.y += dt * 1.8;
          orb.position.y = 1.05 + Math.sin(elapsed * 3 + idx) * 0.16;
          const found = curClues.includes(cid);
          const mat = orb.material as THREE.MeshStandardMaterial;
          if (found) {
            mat.color.setHex(0x22c55e);
            mat.emissive.setHex(0x22c55e);
          }
        }
      });

      // Zone 2 Smog Animation (Clears when Misi 2 completed)
      zone2.smogGroup.children.forEach((p) => {
        const mesh = p as THREE.Mesh;
        const baseY = mesh.userData.baseY as number;
        const phase = mesh.userData.phase as number;
        mesh.position.y = baseY + Math.sin(elapsed * 1.4 + phase) * 0.45;
        mesh.scale.setScalar(
          THREE.MathUtils.damp(mesh.scale.x, m2Done ? 0.05 : 1.0, 3, dt)
        );
        mesh.visible = !m2Done || mesh.scale.x > 0.1;
      });

      // Zone 3 Wind Turbine spin (Spins faster once Hutan Harapan restored)
      zone3.turbineBlades.rotation.z -= dt * (m3Done ? 2.6 : 0.7);

      // Zone 4 Makmal Suara harmonic wave rings
      zone4.dish.rotation.y = Math.sin(elapsed * 0.5) * 0.35;
      zone4.waveRings.forEach((ring, idx) => {
        const baseY = ring.userData.baseY as number;
        ring.position.y = baseY + Math.sin(elapsed * 2.5 + idx * 0.9) * 0.22;
        const pulseScale = 1 + Math.sin(elapsed * (m4Done ? 4 : 1.8) + idx) * 0.09;
        ring.scale.set(pulseScale, pulseScale, 1);
      });

      // Zone 5 Central Eco-Globe Monument rotation
      zone5.earthGlobe.rotation.y += dt * 0.35;
      zone5.goldRing.rotation.z += dt * 0.5;

      // Zone Beacons floating crystal animation & completion color
      beacons.forEach((b, idx) => {
        b.crystal.rotation.y += dt * 1.4;
        b.crystal.position.y = 4.6 + Math.sin(elapsed * 2.4 + idx) * 0.32;
        b.ring.rotation.z += dt * 0.3;
        const mKey = `m${b.missionId}` as 'm1' | 'm2' | 'm3' | 'm4' | 'm5';
        const mp = curUser?.progress?.[mKey];
        const done = Boolean(mp && ('submitted' in mp ? mp.submitted : mp.completed));
        const unlocked = (curUser?.unlockedMission ?? 1) >= b.missionId;
        const cMat = b.crystal.material as THREE.MeshPhysicalMaterial;
        if (done) {
          cMat.color.setHex(0xfacc15);
          cMat.emissive.setHex(0xeab308);
        } else if (!unlocked && curUser?.role === 'murid') {
          cMat.color.setHex(0x64748b);
          cMat.emissive.setHex(0x334155);
        }
      });

      // Camera Choreography (Smooth damping; pauses when user manually drags OrbitControls)
      if (!curUser) {
        // Login Backdrop: gentle scenic orbit around EcoWorld Island
        const angle = elapsed * 0.14;
        camera.position.set(Math.cos(angle) * 38, 22, Math.sin(angle) * 38);
        controls.target.set(0, 2, 0);
      } else if (!userOrbitingRef.current) {
        if (curCamMode === 'firstPerson') {
          controls.minDistance = 0.5;
          controls.maxDistance = 12;
          controls.maxPolarAngle = Math.PI * 0.82;
          const rotY = agentRig.group.rotation.y;
          const ax = agentRig.group.position.x;
          const ay = agentRig.group.position.y;
          const az = agentRig.group.position.z;
          _desiredCamPos.set(ax + Math.sin(rotY) * 0.25, 1.96 + ay, az + Math.cos(rotY) * 0.25);
          _desiredTarget.set(ax + Math.sin(rotY) * 7.0, 1.78 + ay, az + Math.cos(rotY) * 7.0);
        } else if (curCamMode === 'follow') {
          _desiredTarget.set(
            agentRig.group.position.x,
            1.6,
            agentRig.group.position.z
          );
          _desiredCamPos.set(
            agentRig.group.position.x,
            12.5,
            agentRig.group.position.z + 17
          );
        } else if (curCamMode === 'zone') {
          const zm = curMissions.find((m) => m.id === curFocusId) || curMissions[0];
          const [zx, , zz] = zm.position;
          _desiredTarget.set(zx, 2.0, zz);
          _desiredCamPos.set(zx + (zx >= 0 ? 11 : -11), 13.5, zz + 16);
        } else {
          // Overview
          _desiredTarget.set(0, 1.5, 0);
          _desiredCamPos.set(0, 27, 40);
        }

        const camDamp = curCamMode === 'firstPerson' ? 12.0 : 4.2;
        const tgtDamp = curCamMode === 'firstPerson' ? 14.0 : 5.0;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _desiredCamPos.x, camDamp, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _desiredCamPos.y, camDamp, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _desiredCamPos.z, camDamp, dt);

        controls.target.x = THREE.MathUtils.damp(controls.target.x, _desiredTarget.x, tgtDamp, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _desiredTarget.y, tgtDamp, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _desiredTarget.z, tgtDamp, dt);
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    // Cleanup on unmount
    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      controls.dispose();
      envRT.dispose();
      roomCache.forEach((rm) => rm.dispose());
      roomCache.clear();

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => mat.dispose());
          } else {
            m.material?.dispose();
          }
        }
      });

      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 z-0 w-full h-full select-none"
      aria-label="Dunia 3D Interaktif EcoWorld"
    />
  );
}
