import * as THREE from 'three';
import { AvatarId } from '../types/game';
import {
  createEarthTexture,
  createFloatingLabelSprite,
  createMetalHazardTexture,
  createPlazaTileTexture,
} from './textures';

export interface AgentRig {
  group: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  jetCore: THREE.Mesh;
}

export function buildEcoAgentAvatar(
  avatarId: AvatarId,
  shadowTex: THREE.Texture
): AgentRig {
  const palette: Record<AvatarId, { suit: number; trim: number; visor: number }> = {
    rimba: { suit: 0x16a34a, trim: 0xf59e0b, visor: 0x38bdf8 },
    tirta: { suit: 0x0284c7, trim: 0x38bdf8, visor: 0xfde047 },
    bayu: { suit: 0x0d9488, trim: 0xfacc15, visor: 0x22d3ee },
    suara: { suit: 0xd97706, trim: 0xfde047, visor: 0x4ade80 },
  };
  const pal = palette[avatarId] || palette.rimba;

  const group = new THREE.Group();

  // Contact shadow disc grounded at y = 0.02
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 2.1),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
  group.add(shadow);

  const suitMat = new THREE.MeshStandardMaterial({
    color: pal.suit,
    roughness: 0.45,
    metalness: 0.15,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: pal.trim,
    roughness: 0.25,
    metalness: 0.65,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.65,
    metalness: 0.2,
  });
  const visorMat = new THREE.MeshPhysicalMaterial({
    color: pal.visor,
    roughness: 0.1,
    metalness: 0.1,
    emissive: pal.visor,
    emissiveIntensity: 0.35,
    clearcoat: 1.0,
  });

  // Boots + Legs (pivoted for walk cycle)
  const legGeo = new THREE.CapsuleGeometry(0.16, 0.42, 4, 10);
  const leftLeg = new THREE.Mesh(legGeo, darkMat);
  leftLeg.position.set(-0.22, 0.42, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, darkMat);
  rightLeg.position.set(0.22, 0.42, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  // Torso Jacket
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.33, 0.85, 14), suitMat);
  torso.position.y = 1.15;
  torso.castShadow = true;
  group.add(torso);

  // Chest Eco-Emblem Badge
  const emblem = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), trimMat);
  emblem.position.set(0, 1.25, 0.36);
  group.add(emblem);

  // Eco-Jetpack on back
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.55, 0.24), darkMat);
  pack.position.set(0, 1.2, -0.38);
  pack.castShadow = true;
  group.add(pack);

  const jetCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.14, 0.22, 12),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x22d3ee,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    })
  );
  jetCore.position.set(0, 0.92, -0.38);
  group.add(jetCore);

  // Arms
  const armGeo = new THREE.CapsuleGeometry(0.12, 0.44, 4, 8);
  const leftArm = new THREE.Mesh(armGeo, suitMat);
  leftArm.position.set(-0.5, 1.15, 0);
  leftArm.castShadow = true;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, suitMat);
  rightArm.position.set(0.5, 1.15, 0);
  rightArm.castShadow = true;
  group.add(rightArm);

  // Helmet / Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 18), trimMat);
  head.position.y = 1.9;
  head.castShadow = true;
  group.add(head);

  // Glowing Visor
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.2, 0.24),
    visorMat
  );
  visor.position.set(0, 1.92, 0.26);
  group.add(visor);

  // Species accent ears/crest based on avatarId
  if (avatarId === 'rimba' || avatarId === 'suara') {
    const earGeo = new THREE.ConeGeometry(0.12, 0.28, 6);
    const lEar = new THREE.Mesh(earGeo, suitMat);
    lEar.position.set(-0.22, 2.26, 0);
    lEar.rotation.z = 0.25;
    const rEar = new THREE.Mesh(earGeo, suitMat);
    rEar.position.set(0.22, 2.26, 0);
    rEar.rotation.z = -0.25;
    group.add(lEar, rEar);
  } else if (avatarId === 'tirta') {
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.34, 8), visorMat);
    fin.position.set(0, 2.28, -0.05);
    fin.rotation.x = -0.35;
    group.add(fin);
  } else if (avatarId === 'bayu') {
    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.38), trimMat);
    crest.position.set(0, 2.26, -0.04);
    group.add(crest);
  }

  return { group, leftLeg, rightLeg, leftArm, rightArm, jetCore };
}

export function buildZoneBeacon(
  missionId: number,
  title: string,
  subtitle: string,
  colorHex: string
): { group: THREE.Group; crystal: THREE.Mesh; ring: THREE.Mesh; hitProxy: THREE.Mesh } {
  const group = new THREE.Group();
  const color = new THREE.Color(colorHex);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.4, 2.85, 36),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.65,
      side: THREE.DoubleSide,
      roughness: 0.3,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;
  group.add(ring);

  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.75, 0),
    new THREE.MeshPhysicalMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.5,
      roughness: 0.15,
      metalness: 0.3,
      clearcoat: 1,
    })
  );
  crystal.position.y = 4.6;
  crystal.castShadow = true;
  group.add(crystal);

  const label = createFloatingLabelSprite(`MISI ${missionId}: ${title}`, subtitle, colorHex);
  label.position.set(0, 6.4, 0);
  group.add(label);

  // Invisible simplified raycast hit box on layer 1
  const hitProxy = new THREE.Mesh(
    new THREE.CylinderGeometry(3.1, 3.1, 7.5, 12),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitProxy.position.y = 3.75;
  hitProxy.layers.set(1);
  hitProxy.userData = { type: 'zone', missionId };
  group.add(hitProxy);

  return { group, crystal, ring, hitProxy };
}

export function buildZone1RiverFactory(
  maxAnisotropy: number
): {
  group: THREE.Group;
  riverMesh: THREE.Mesh;
  riverMat: THREE.MeshStandardMaterial;
  sludgeStream: THREE.Mesh;
  clueMeshes: Record<'paip' | 'ikan' | 'bau', THREE.Group>;
} {
  const group = new THREE.Group();
  const hazardTex = createMetalHazardTexture(maxAnisotropy);

  // Winding River Bed passing along Zone 1
  const riverCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-23, 0.04, 4),
    new THREE.Vector3(-17, 0.04, 9),
    new THREE.Vector3(-12, 0.04, 14),
    new THREE.Vector3(-6, 0.04, 21),
  ]);
  const riverGeo = new THREE.TubeGeometry(riverCurve, 28, 2.7, 8, false);
  riverGeo.scale(1, 0.08, 1);

  const riverMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.18,
    metalness: 0.35,
    emissive: 0x0f172a,
    emissiveIntensity: 0.2,
  });
  const riverMesh = new THREE.Mesh(riverGeo, riverMat);
  riverMesh.position.y = 0.08;
  riverMesh.receiveShadow = true;
  group.add(riverMesh);

  // Textile Factory Building (multi-part composite)
  const factory = new THREE.Group();
  factory.position.set(-20.5, 0, 8);

  const hall = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 3.2, 4.2),
    new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.85, metalness: 0.05 })
  );
  hall.position.y = 1.6;
  hall.castShadow = true;
  hall.receiveShadow = true;
  factory.add(hall);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(3.8, 1.5, 4),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.55 })
  );
  roof.position.y = 3.9;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  factory.add(roof);

  const stack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.55, 5.4, 14),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5, metalness: 0.6 })
  );
  stack.position.set(-1.6, 2.7, -1.1);
  stack.castShadow = true;
  factory.add(stack);

  // Hazard band on chimney
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.47, 0.49, 0.7, 14),
    new THREE.MeshStandardMaterial({ map: hazardTex, roughness: 0.4 })
  );
  band.position.set(-1.6, 4.4, -1.1);
  factory.add(band);

  // Chemical discharge pipe aiming at river
  const pipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.32, 3.0, 12),
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.35, metalness: 0.8 })
  );
  pipe.rotation.z = Math.PI / 2.2;
  pipe.position.set(2.8, 1.1, 0.6);
  factory.add(pipe);

  const sludgeStream = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.35, 1.2, 10),
    new THREE.MeshStandardMaterial({
      color: 0x4c1d95,
      emissive: 0x7e22ce,
      emissiveIntensity: 0.55,
      roughness: 0.2,
    })
  );
  sludgeStream.position.set(4.1, 0.55, 0.6);
  factory.add(sludgeStream);

  group.add(factory);

  // Wooden Jetty + Pak Mail 3D NPC
  const jetty = new THREE.Group();
  jetty.position.set(-14.2, 0, 10.6);
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.22, 1.6),
    new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 })
  );
  deck.position.y = 0.35;
  deck.castShadow = true;
  jetty.add(deck);
  [-1.0, 1.0].forEach((px) => {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.65, 8),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
    );
    post.position.set(px, 0.25, 0.65);
    jetty.add(post);
  });

  // Pak Mail NPC figure
  const npcBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.34, 0.85, 12),
    new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.7 })
  );
  npcBody.position.set(0, 0.88, 0);
  npcBody.castShadow = true;
  jetty.add(npcBody);
  const npcHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 14, 14),
    new THREE.MeshStandardMaterial({ color: 0xfdba74, roughness: 0.6 })
  );
  npcHead.position.set(0, 1.5, 0);
  jetty.add(npcHead);
  const npcHat = new THREE.Mesh(
    new THREE.ConeGeometry(0.42, 0.24, 14),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 })
  );
  npcHat.position.set(0, 1.72, 0);
  jetty.add(npcHat);
  group.add(jetty);

  // 3 Interactive 3D Clue Hotspots in Zone 1
  const clueMeshes = {
    paip: createClue3DMarker('paip', [-16.6, 1.1, 8.6], 0xa855f7),
    ikan: createClue3DMarker('ikan', [-12.2, 0.55, 13.5], 0x38bdf8),
    bau: createClue3DMarker('bau', [-16.8, 1.1, 14.2], 0xfacc15),
  };
  Object.values(clueMeshes).forEach((m) => group.add(m));

  return { group, riverMesh, riverMat, sludgeStream, clueMeshes };
}

function createClue3DMarker(
  clueId: 'paip' | 'ikan' | 'bau',
  pos: [number, number, number],
  color: number
): THREE.Group {
  const g = new THREE.Group();
  g.position.set(...pos);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.52, 0.5, 12),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.5 })
  );
  base.position.y = 0.25;
  g.add(base);

  const orb = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.48, 0),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    })
  );
  orb.position.y = 1.05;
  orb.name = 'clueOrb';
  g.add(orb);

  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 10, 10),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hit.position.y = 0.9;
  hit.layers.set(1);
  hit.userData = { type: 'clue', clueId };
  g.add(hit);

  return g;
}

export function buildZone2ToxicCity(maxAnisotropy: number): {
  group: THREE.Group;
  smogGroup: THREE.Group;
} {
  const group = new THREE.Group();
  const hazardTex = createMetalHazardTexture(maxAnisotropy);

  const base = new THREE.Group();
  base.position.set(-14, 0, -12);

  // Industrial Plant
  const plant = new THREE.Mesh(
    new THREE.BoxGeometry(5.5, 3.6, 4.5),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7, metalness: 0.3 })
  );
  plant.position.set(-1.5, 1.8, -1.5);
  plant.castShadow = true;
  plant.receiveShadow = true;
  base.add(plant);

  // Twin Smokestacks
  [-2.6, -0.4].forEach((cx) => {
    const ch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.58, 6.2, 14),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.45, metalness: 0.6 })
    );
    ch.position.set(cx, 3.1, -2.1);
    ch.castShadow = true;
    base.add(ch);

    const stripe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.48, 0.7, 14),
      new THREE.MeshStandardMaterial({ map: hazardTex, roughness: 0.4 })
    );
    stripe.position.set(cx, 5.2, -2.1);
    base.add(stripe);
  });

  // City School / Eco Tower
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 5.0, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.55, metalness: 0.25 })
  );
  tower.position.set(3.2, 2.5, 0.8);
  tower.castShadow = true;
  base.add(tower);

  const glassBand = new THREE.Mesh(
    new THREE.BoxGeometry(3.5, 0.65, 3.3),
    new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.2,
      clearcoat: 1,
    })
  );
  glassBand.position.set(3.2, 3.4, 0.8);
  base.add(glassBand);

  // Composite Vehicle on road
  const car = new THREE.Group();
  car.position.set(1.2, 0, 3.4);
  const chassis = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.65, 1.1),
    new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3, metalness: 0.5 })
  );
  chassis.position.y = 0.5;
  chassis.castShadow = true;
  car.add(chassis);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.5, 0.96),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.3 })
  );
  cabin.position.set(-0.1, 1.0, 0);
  car.add(cabin);
  [
    [-0.65, 0.25, 0.55],
    [0.65, 0.25, 0.55],
    [-0.65, 0.25, -0.55],
    [0.65, 0.25, -0.55],
  ].forEach(([wx, wy, wz]) => {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.2, 12),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
    );
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(wx, wy, wz);
    car.add(wheel);
  });
  base.add(car);

  // Animated smog puffs
  const smogGroup = new THREE.Group();
  const smogMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.95,
    transparent: true,
    opacity: 0.72,
  });
  for (let i = 0; i < 8; i++) {
    const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75 + (i % 3) * 0.25, 1), smogMat);
    puff.position.set(i % 2 === 0 ? -2.6 : -0.4, 6.4 + (i % 4) * 1.1, -2.1 + (i % 2) * 0.4);
    puff.userData.baseY = puff.position.y;
    puff.userData.phase = i * 0.85;
    smogGroup.add(puff);
  }
  base.add(smogGroup);

  group.add(base);
  return { group, smogGroup };
}

export function buildZone3HopeForest(): {
  group: THREE.Group;
  turbineBlades: THREE.Group;
} {
  const group = new THREE.Group();
  const base = new THREE.Group();
  base.position.set(13, 0, -12);

  // Ranger Wooden Eco-Cabin
  const cabinBody = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 2.3, 3.0),
    new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 })
  );
  cabinBody.position.set(-2.2, 1.15, 0.5);
  cabinBody.castShadow = true;
  cabinBody.receiveShadow = true;
  base.add(cabinBody);

  const cabinRoof = new THREE.Mesh(
    new THREE.ConeGeometry(3.0, 1.6, 4),
    new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 })
  );
  cabinRoof.position.set(-2.2, 3.05, 0.5);
  cabinRoof.rotation.y = Math.PI / 4;
  cabinRoof.castShadow = true;
  base.add(cabinRoof);

  // Wind Turbine Tower
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.38, 6.8, 12),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.4 })
  );
  mast.position.set(3.2, 3.4, -1.8);
  mast.castShadow = true;
  base.add(mast);

  const nacelle = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.65, 1.3),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25, metalness: 0.5 })
  );
  nacelle.position.set(3.2, 6.8, -1.6);
  base.add(nacelle);

  const turbineBlades = new THREE.Group();
  turbineBlades.position.set(3.2, 6.8, -0.9);
  for (let i = 0; i < 3; i++) {
    const bladeHolder = new THREE.Group();
    bladeHolder.rotation.z = (i * Math.PI * 2) / 3;
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 2.6, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.3 })
    );
    blade.position.y = 1.3;
    blade.castShadow = true;
    bladeHolder.add(blade);
    turbineBlades.add(bladeHolder);
  }
  base.add(turbineBlades);

  // Solar Panel Array
  for (let i = 0; i < 2; i++) {
    const stand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 1.1, 8),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 })
    );
    stand.position.set(2.0 + i * 2.2, 0.55, 2.4);
    base.add(stand);

    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.1, 1.2),
      new THREE.MeshPhysicalMaterial({
        color: 0x0c4a6e,
        roughness: 0.15,
        metalness: 0.6,
        clearcoat: 1,
      })
    );
    panel.position.set(2.0 + i * 2.2, 1.15, 2.4);
    panel.rotation.x = 0.45;
    base.add(panel);
  }

  group.add(base);
  return { group, turbineBlades };
}

export function buildZone4VoiceLab(): {
  group: THREE.Group;
  waveRings: THREE.Mesh[];
  dish: THREE.Group;
} {
  const group = new THREE.Group();
  const base = new THREE.Group();
  base.position.set(15, 0, 10);

  // Acoustic Stage Plinth
  const stage = new THREE.Mesh(
    new THREE.CylinderGeometry(4.2, 4.6, 0.7, 24),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.5 })
  );
  stage.position.y = 0.35;
  stage.receiveShadow = true;
  base.add(stage);

  // Translucent Acoustic Dome Shell
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(3.4, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshPhysicalMaterial({
      color: 0xa855f7,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
      clearcoat: 1,
    })
  );
  dome.position.y = 0.7;
  dome.renderOrder = 2;
  base.add(dome);

  // Golden Microphone Podium inside dome
  const micStand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.2, 2.0, 12),
    new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.85, roughness: 0.2 })
  );
  micStand.position.y = 1.7;
  base.add(micStand);

  const micHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xfacc15,
      emissiveIntensity: 0.4,
      metalness: 0.9,
      roughness: 0.2,
    })
  );
  micHead.position.y = 2.85;
  base.add(micHead);

  // Broadcast Satellite Dish
  const dish = new THREE.Group();
  dish.position.set(-3.2, 0, -2.5);
  const dishPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.26, 2.8, 10),
    new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.3 })
  );
  dishPole.position.y = 1.4;
  dish.add(dishPole);

  const dishBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(1.3, 0.2, 0.65, 18),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.5, roughness: 0.25 })
  );
  dishBowl.position.set(0, 3.0, 0.2);
  dishBowl.rotation.x = Math.PI / 3;
  dish.add(dishBowl);
  base.add(dish);

  // Harmonic floating rings
  const waveRings: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(
      new THREE.TorusGeometry(1.4 + i * 0.7, 0.07, 10, 36),
      new THREE.MeshStandardMaterial({
        color: 0xc084fc,
        emissive: 0xa855f7,
        emissiveIntensity: 0.85,
        roughness: 0.2,
      })
    );
    r.rotation.x = Math.PI / 2;
    r.position.y = 3.6 + i * 0.65;
    r.userData.baseY = r.position.y;
    waveRings.push(r);
    base.add(r);
  }

  group.add(base);
  return { group, waveRings, dish };
}

export function buildZone5EcoMonument(maxAnisotropy: number): {
  group: THREE.Group;
  earthGlobe: THREE.Mesh;
  goldRing: THREE.Mesh;
} {
  const group = new THREE.Group();
  const plazaTex = createPlazaTileTexture(maxAnisotropy);
  const earthTex = createEarthTexture(maxAnisotropy);

  // Central Plaza Floor
  const plaza = new THREE.Mesh(
    new THREE.CylinderGeometry(6.8, 7.2, 0.32, 36),
    new THREE.MeshStandardMaterial({ map: plazaTex, roughness: 0.6, metalness: 0.1 })
  );
  plaza.position.y = 0.16;
  plaza.receiveShadow = true;
  group.add(plaza);

  // Pedestal
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(1.7, 2.2, 1.35, 16),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.65 })
  );
  plinth.position.y = 0.98;
  plinth.castShadow = true;
  group.add(plinth);

  // Rotating Earth Globe
  const earthGlobe = new THREE.Mesh(
    new THREE.SphereGeometry(1.85, 32, 32),
    new THREE.MeshStandardMaterial({
      map: earthTex,
      roughness: 0.35,
      metalness: 0.15,
    })
  );
  earthGlobe.position.y = 3.9;
  earthGlobe.castShadow = true;
  group.add(earthGlobe);

  // Tilted Golden Orbital Ring
  const goldRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.55, 0.11, 14, 48),
    new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.45,
      metalness: 0.9,
      roughness: 0.15,
    })
  );
  goldRing.position.y = 3.9;
  goldRing.rotation.x = Math.PI / 3;
  group.add(goldRing);

  return { group, earthGlobe, goldRing };
}

export function buildInstancedForestAndRocks(
  scene: THREE.Object3D,
  zoneCenters: [number, number, number][]
): void {
  // Instanced Pines around Island Perimeter & Zone 3 Hope Forest
  const treePositions: { x: number; z: number; scale: number }[] = [];

  for (let i = 0; i < 65; i++) {
    const angle = (i / 65) * Math.PI * 2;
    const radius = 23.5 + (i % 4) * 1.4;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    treePositions.push({ x, z, scale: 0.85 + (i % 5) * 0.1 });
  }
  // Extra lush trees in Zone 3 (Hutan Harapan at [13, 0, -12])
  const extraTrees = [
    [9, -15],
    [16, -16],
    [18, -9],
    [11, -8],
    [15, -14],
    [8, -11],
    [19, -13],
    [12, -17],
  ];
  extraTrees.forEach(([x, z], idx) => {
    // Keep away from exact center of Zone 3 cabin/turbine
    if (zoneCenters) {
      treePositions.push({ x, z, scale: 1.0 + (idx % 3) * 0.15 });
    }
  });

  const count = treePositions.length;
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.34, 1.8, 8);
  trunkGeo.translate(0, 0.9, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
  trunkInst.castShadow = true;

  const crownGeo = new THREE.ConeGeometry(1.3, 3.2, 8);
  crownGeo.translate(0, 3.0, 0);
  const crownMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 });
  const crownInst = new THREE.InstancedMesh(crownGeo, crownMat, count);
  crownInst.castShadow = true;

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  treePositions.forEach((p, idx) => {
    dummy.position.set(p.x, 0, p.z);
    dummy.rotation.y = idx * 0.7;
    dummy.scale.setScalar(p.scale);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(idx, dummy.matrix);
    crownInst.setMatrixAt(idx, dummy.matrix);

    // Subtle green variation per tree
    color.setHSL(0.36 + (idx % 5) * 0.015, 0.65, 0.32 + (idx % 4) * 0.04);
    crownInst.setColorAt(idx, color);
  });

  trunkInst.instanceMatrix.needsUpdate = true;
  crownInst.instanceMatrix.needsUpdate = true;
  if (crownInst.instanceColor) crownInst.instanceColor.needsUpdate = true;
  trunkInst.computeBoundingSphere();
  crownInst.computeBoundingSphere();

  scene.add(trunkInst, crownInst);

  // Natural Coastal Rocks around the Island Shoreline (InstancedMesh)
  const rockCount = 34;
  const rockGeo = new THREE.DodecahedronGeometry(1.1, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.88, metalness: 0.05 });
  const rockInst = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
  rockInst.castShadow = true;
  rockInst.receiveShadow = true;

  for (let i = 0; i < rockCount; i++) {
    const a = (i / rockCount) * Math.PI * 2 + 0.15;
    const r = 27.5 + (i % 3) * 0.9;
    dummy.position.set(Math.cos(a) * r, 0.25, Math.sin(a) * r);
    dummy.rotation.set(i * 0.4, i * 0.9, 0);
    dummy.scale.set(1.1 + (i % 3) * 0.3, 0.65 + (i % 2) * 0.3, 1.0 + (i % 4) * 0.2);
    dummy.updateMatrix();
    rockInst.setMatrixAt(i, dummy.matrix);
  }
  rockInst.instanceMatrix.needsUpdate = true;
  rockInst.computeBoundingSphere();
  scene.add(rockInst);
}
