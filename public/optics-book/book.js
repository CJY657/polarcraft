/* global THREE */
'use strict';

// Standalone optics book: ideal EM-wave/polarization models followed by calcite.
// Calcite uses near-normal incidence on parallel faces and the uniaxial index
// ellipsoid for e-ray walk-off, not arbitrary ray tracing.
const lessons = [
  {
    kind: 'wave',
    title: '光的本质', english: 'LIGHT IS AN ELECTROMAGNETIC WAVE',
    intro: '光不需要介质，也能穿越真空。\n电场与磁场相互垂直，\n一起向前传播。',
    heading: '看见的，是电磁场的周期变化。',
    body: '光是一种电磁波。自由空间中的平面电磁波里，电场 E、磁场 B 与传播方向两两垂直；E 与 B 同相变化。波长 λ 与频率 f 的乘积就是真空光速 c。',
    task: '拖动波长滑杆，比较波形与频率。\n隐藏磁场，只观察电场，再把它找回来。',
    note: '先看振动，再谈偏振。', figure: '电场与磁场，相伴前行', instruction: '调节波长与振幅；底部胶囊栏可暂停波动',
    caption: 'E 为朱红色，B 为灰蓝色；振幅数值仅用于画面比较。',
    extraTitle: '为什么偏振说的是电场？',
    extra: '在通常的光学材料与探测过程中，电场对物质的作用往往更直接，因此光学中通常用电场 E 的振动方向与端点轨迹描述偏振。磁场仍与电场相伴，并满足相应的电磁场关系。波长变短而传播速度不变时，频率升高；单光子能量 E = hf 也随之增大，但这不改变本页的波速。',
  },
  {
    kind: 'polarization',
    title: '偏振类型与表示', english: 'TRACE THE ELECTRIC FIELD',
    intro: '把电场分成两个正交分量。\n改变它们的振幅与相位，\n直线、圆和椭圆就出现了。',
    heading: '偏振态，是电场端点画出的轨迹。',
    body: '迎着光的传播方向观察，固定位置处的电场端点随时间运动。两个正交分量同相或反相时形成线偏振；等振幅且相位差为 ±90° 时形成圆偏振；一般情形是椭圆偏振。',
    task: '依次选择 45° 线、右旋圆与椭圆。\n再调节 δ、Eₓ 和 Eᵧ，验证你的判断。',
    note: '两个分量，一种轨迹。', figure: '从空间波动到端面投影', instruction: '拖动图示旋转视角；选择预设或调节三个滑杆',
    caption: '空间曲线展示传播，右端截面展示接收端看到的电场轨迹。',
    extraTitle: '怎样用参数表示偏振？',
    extra: '本页采用 Eₓ = Aₓ cosτ，Eᵧ = Aᵧ cos(τ + δ)。椭圆方位角 ψ = ½ atan2(2AₓAᵧcosδ, Aₓ²−Aᵧ²)，椭圆率角 χ = ½ arcsin[2AₓAᵧsinδ/(Aₓ²+Aᵧ²)]。左右旋名称依赖观察方向与相位约定；本页明确采用迎着光传播方向的接收端视角，并沿用 δ = 90° 为右旋、270° 为左旋的约定。',
  },
  {
    kind: 'brewster',
    title: '布儒斯特角', english: 'WHEN REFLECTION BECOMES POLARIZED',
    intro: '让光射向玻璃表面。\n一部分反射，一部分折射。\n某个角度，p 分量不再反射。',
    heading: '反射光，也会有选择。',
    body: '光从空气射向透明介质时，反射光包含垂直入射面的 s 分量与平行入射面的 p 分量。当反射光与折射光互相垂直时，p 分量的反射率为零，反射光只剩 s 偏振。这个入射角称为布儒斯特角，tan θB = n₂/n₁。',
    task: '拖动入射角，比较 Rₚ 与 Rₛ。\n点击「设为 θB」，再比较水和玻璃。',
    note: '找到一个角度，看见一种偏振。', figure: '让 p 分量从反射光中消失', instruction: '拖动三维装置调整视角；用滑杆改变入射角',
    caption: 'θ 均从法线计量；s 垂直入射面，p 平行入射面。',
    extraTitle: '为什么此时 p 分量不反射？',
    extra: '在布儒斯特角入射时，反射方向与折射方向互相垂直。介质中的受迫电偶极子在其振动方向上的辐射为零，这使平行入射面的 p 分量无法形成沿该方向传播的反射光。垂直入射面的 s 分量仍然可以反射，因此反射光变为线偏振光。本页采用空气到透明介质的非吸收、各向同性模型。',
  },
  {
    title: '一个字，两个像', english: 'ONE WORD, TWO IMAGES',
    intro: '把一块透明的冰洲石放在字上。\n奇妙的事情发生了：\n一个「光」字，变成了两个。',
    heading: '不是字变多了，是光分开了。',
    body: '冰洲石是透明的方解石，也是一种单轴晶体。光穿过它时，通常会分成寻常光 o 光与非常光 e 光。两条不同的光路，让同一个字有了两个像。',
    task: '先把晶体转到 90°，再放入检偏片。\n转动检偏片，能让其中一个像消失吗？',
    note: '先观察，再解释。', figure: '把晶体放在「光」字上', instruction: '拖动晶体，或把转角滑杆慢慢推到 90°',
    caption: 'o 像与 e 像来自同一个字；颜色只用于区分两束光。',
    extraTitle: '为什么会分成两束？',
    extra: '晶体对不同偏振方向的光具有不同的光学响应。o 光的折射率不随传播方向改变；e 光的有效折射率则与传播方向和光轴的夹角有关。进入晶体后，两种模式的传播路径可能不同，离开平行晶面后，两束出射光仍与入射光平行，但位置错开。',
  },
  {
    title: '转动晶体', english: 'FOLLOW THE TWO IMAGES',
    intro: '保持观察方向不变，\n缓缓转动冰洲石。\n跟着那个移动的像，一起看。',
    heading: '一个留下，一个绕行。',
    body: '保持晶面与观察方向不变，只绕竖直方向转动晶体。o 像保持原位，e 像随主平面方向改变而绕行；两像间距由厚度与离散角决定。',
    task: '依次转到 90° 与 180°。\n再改变厚度，比较双像间距。',
    note: '转晶体，看位置。', figure: '追踪双像的位置', instruction: '试到 90° 与 180°，再打开「更多实验条件」',
    caption: 'e 光的能量传播方向偏离波法线，这种偏离用离散角 δ 描述。',
    extraTitle: '位置改变，间距不变吗？',
    extra: '只改变晶体的方位角时，光轴与传播方向的夹角不变，所以离散角和双像间距也不变；改变的是双像连线的方向。增加晶体厚度，e 光在晶体内积累的横向位移增大，双像间距也随之增大。',
  },
  {
    title: '让一个像消失', english: 'A DIFFERENT WAY TO SEE',
    intro: '在眼睛与晶体之间，\n放入一片检偏片。\n转一转，让其中一个字隐去。',
    heading: '两个像，藏着两个方向。',
    body: '在本页近轴模型中，o 光与 e 光的线偏振方向互相垂直。转动检偏片，两像明暗此消彼长；转过 90°，明暗关系互换。',
    task: '试试检偏角 0°、45°、90°。\n再把入射光改为线偏振光。',
    note: '转检偏片，看明暗。', figure: '检偏片只让一个方向通过', instruction: '点击 0°、45°、90°，比较两像与偏振方向图',
    caption: 'θ 相对 o 光偏振方向；理想模型忽略吸收与界面反射。',
    extraTitle: '自然光与线偏振光',
    extra: '自然光进入晶体时，o / e 两个正交分量各占总光强的一半。线偏振光的分配由入射偏振角 φ 决定：晶体后分别为 cos²φ 与 sin²φ。检偏片再按马吕斯定律选择透射分量，因此 45° 并不总是让最终两像各为 25%；“各 25%”特指自然光入射。',
  },
  {
    title: '光的两种旅程', english: 'TWO PATHS, ONE DISCOVERY',
    intro: '从两个字，到两束光，\n从位置，到明暗。\n你已经看见了双折射。',
    heading: '光轴，是两条旅程相遇的方向。',
    body: '冰洲石的主折射率约为 nₒ = 1.658、nₑ = 1.486。沿光轴传播时，两种模式速度相同，不发生双折射，双像重合。',
    task: '切换波长，观察间距的细微变化。\n点击「沿光轴观察」，再恢复普通方向。',
    note: '答案，就在你手中。', figure: '同一束光，两条不同的路径', instruction: '切换波长，或点击「沿光轴观察」进行对照',
    caption: '光轴不是一条固定的几何线，而是晶体中的一个特殊方向。',
    extraTitle: '折射率也会随波长改变',
    extra: '本实验使用 400、550、589 nm 三组近似主折射率。波长改变时，nₒ、nₑ 以及由它们决定的离散角都会略有变化，所以双像间距也会细微改变。这是色散；最明显的双像变化仍来自晶体方向与厚度。',
  },
];

const wavelengths = {
  400: { nO: 1.681, nE: 1.497, name: '400 nm 蓝光' },
  550: { nO: 1.662, nE: 1.488, name: '550 nm 绿光' },
  589: { nO: 1.658, nE: 1.486, name: '589 nm 钠黄光' },
};
const polarizationPresets = {
  horizontal: { phase: 0, x: 1, y: 0 },
  linear: { phase: 0, x: 1, y: 1 },
  right: { phase: 90, x: 1, y: 1 },
  left: { phase: 270, x: 1, y: 1 },
  elliptical: { phase: 45, x: 1, y: .6 },
};
const brewsterMedia = {
  glass: { n: 1.5, name: '玻璃' },
  water: { n: 1.33, name: '水' },
  diamond: { n: 2.42, name: '金刚石' },
};

const tasks = [
  [
    { id: 'wave-length', text: '改变波长并比较频率', test: () => state.waveLength !== 550 },
    { id: 'wave-amplitude', text: '改变电场振幅', test: () => state.waveAmplitude !== 50 },
    { id: 'wave-b', text: '隐藏再显示磁场 B', test: () => !state.showB },
  ],
  [
    { id: 'pol-linear', text: '合成一种线偏振', test: () => polarizationInfo().isLinear },
    { id: 'pol-circle', text: '观察右旋圆偏振', test: () => polarizationInfo().isCircular && Math.abs(state.phaseDiff - 90) <= 2 },
    { id: 'pol-ellipse', text: '合成一种椭圆偏振', test: () => polarizationInfo().isElliptical },
  ],
  [
    { id: 'brew-angle', text: '改变入射角并比较反射率', test: () => state.brewsterAngle !== 45 },
    { id: 'brew-null', text: '在 θB 让 p 分量不反射', test: () => brewsterModel().atBrewster },
    { id: 'brew-medium', text: '换一种介质比较 θB', test: () => state.brewsterMedium !== 'glass' },
  ],
  [
    { id: '0-split', text: '看见分开的两个像', test: m => m.separation > .01 },
    { id: '0-turn', text: '把晶体转到 90° 附近', test: () => Math.abs(state.crystal - 90) <= 3 },
    { id: '0-polarize', text: '只留下明亮的 o 像', test: m => state.analyzer && nearAngle(state.angle, 0) && m.inputO > .1 },
  ],
  [
    { id: '1-quarter', text: '观察 90° 时的双像连线', test: () => Math.abs(state.crystal - 90) <= 3 },
    { id: '1-half', text: '继续转到 180° 附近', test: () => state.crystal >= 177 },
    { id: '1-thick', text: '改变厚度并比较间距', test: () => state.thickness !== 8 },
  ],
  [
    { id: '2-o', text: '让 e 像消失', test: m => state.analyzer && nearAngle(state.angle, 0) && m.inputE > .01 },
    { id: '2-equal', text: '让两个像同样明亮', test: m => state.analyzer && Math.abs(m.o - m.e) < .006 && m.o > .01 },
    { id: '2-e', text: '让 o 像消失', test: m => state.analyzer && nearAngle(state.angle, 90) && m.inputO > .01 },
  ],
  [
    { id: '3-color', text: '换一种入射波长', test: () => state.wavelength !== 589 },
    { id: '3-axis', text: '沿光轴让双像重合', test: () => state.axisAligned },
    { id: '3-return', text: '恢复双折射并再次分开', test: () => !state.axisAligned && state.completed.has('3-axis') },
  ],
];

const $ = id => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const requestedChapter = Number(new URLSearchParams(location.search).get('chapter'));
const initialPage = Number.isInteger(requestedChapter) && requestedChapter >= 0 && requestedChapter < lessons.length ? requestedChapter : 0;
const state = {
  open: false, page: initialPage, crystal: 0, analyzer: false, angle: 0,
  source: 'natural', sourceAngle: 45, wavelength: 589, thickness: 8,
  axisAligned: false, showRays: true, showAxis: true,
  paused: reducedMotion.matches, completed: new Set(),
  waveLength: 550, waveAmplitude: 50, showB: true,
  phaseDiff: 0, ampX: 1, ampY: 1,
  brewsterAngle: 45, brewsterMedium: 'glass',
};
let scene, camera, renderer, book, cover, leftHalf, crystal, analyzer, pageLeft, pageRight, turnLeaf;
let wordTexture, wordCanvas, wordPlane, beamO, beamE, photons, axisGuide, oLabel, eLabel;
let foundation, waveScene, polarizationScene, brewsterScene, waveBLayer, polarizationReceiver, polarizationStateLabel;
let waveE, waveB, waveERibbon, waveBRibbon, waveDimension, waveDimensionLabel;
let polarizationE, polarizationEx, polarizationEy, polarizationEllipse, polarizationRibbon, polarizationVector, polarizationEndpoint;
let brewsterIncidentRay, brewsterReflectedRay, brewsterRefractedRay, brewsterIncidentArc, brewsterRefractedArc, brewsterRightAngle;
let brewsterIncidentLabel, brewsterReflectedLabel, brewsterRefractedLabel, brewsterAngleLabel, brewsterRefractionAngleLabel;
let brewsterMediumLabel, brewsterStateLabel, brewsterIncidentS, brewsterIncidentP, brewsterReflectedS, brewsterReflectedP;
let brewsterFlow = [];
let waveDimensionArrowA, waveDimensionArrowB;
let waveEVectors = [], waveBVectors = [], waveFlow = [], polarizationFlow = [];
let opening = 0, targetOpening = 0, turn = 0, frame = 0, lastTime = 0, mobile = innerWidth <= 700;
let waveClock = 0;
let foundationReveal = 0, foundationDirty = true, lastFoundationUpdate = 0;
let polarizationDragging = false;
let motionPreference = reducedMotion.matches;
let photonPaths = { o: [], e: [] };
const ink = '#28303a', red = '#913e2c', paper = '#faf4e5';
const serif = 'BookSerif, "Noto Serif CJK SC", Georgia, serif';
const DEG = Math.PI / 180;
const AXIS_TILT = 38;
const FOUNDATION_Y = .9;
const POLARIZATION_RECEIVER_X = 1.35;
const POLARIZATION_DEFAULT_Y = -.62;
const BREWSTER_DEFAULT_Y = -.22;
const BREWSTER_SURFACE_Y = .58;
const foundationColors = { e: '#a3472e', b: '#327f91', x: '#327f91', y: '#75814c', axis: '#5f645b', gold: '#bd9134' };

function nearAngle(value, target) {
  return Math.min(Math.abs(value - target), Math.abs(value - target - 180)) <= 2;
}

function lessonKind() {
  return lessons[state.page].kind || 'calcite';
}

function polarizationInfo() {
  const delta = state.phaseDiff * DEG;
  const normalized = ((state.phaseDiff % 360) + 360) % 360;
  const hasX = state.ampX >= .05, hasY = state.ampY >= .05;
  const isZero = !hasX && !hasY;
  const isLinear = !isZero && (!hasX || !hasY || Math.abs(Math.sin(delta)) < .08);
  const isCircular = hasX && hasY && Math.abs(state.ampX - state.ampY) < .051 &&
    (Math.abs(normalized - 90) <= 2 || Math.abs(normalized - 270) <= 2);
  const isElliptical = !isZero && !isLinear && !isCircular;
  let type = '椭圆偏振';
  if (isZero) type = '零振幅 · 无偏振态';
  else if (isCircular) type = `${Math.abs(normalized - 90) <= 2 ? '右旋' : '左旋'}圆偏振`;
  else if (isLinear) {
    if (!hasX) type = '竖直线偏振';
    else if (!hasY) type = '水平线偏振';
    else {
      const rawAngle = Math.round(Math.atan2(state.ampY * Math.cos(delta), state.ampX) / DEG);
      const angle = (rawAngle + 180) % 180;
      type = `${angle}° 线偏振`;
    }
  }
  const denominator = state.ampX ** 2 + state.ampY ** 2;
  const psi = denominator < .0001 ? 0 : .5 * Math.atan2(2 * state.ampX * state.ampY * Math.cos(delta), state.ampX ** 2 - state.ampY ** 2) / DEG;
  const chi = denominator < .0001 ? 0 : .5 * Math.asin(Math.max(-1, Math.min(1, 2 * state.ampX * state.ampY * Math.sin(delta) / denominator))) / DEG;
  return { type, psi, chi, isLinear, isCircular, isElliptical };
}

function brewsterModel() {
  const n1 = 1, n2 = brewsterMedia[state.brewsterMedium].n;
  const theta1 = state.brewsterAngle * DEG;
  const theta2 = Math.asin(Math.max(-1,Math.min(1,n1 / n2 * Math.sin(theta1))));
  const cos1 = Math.cos(theta1), cos2 = Math.cos(theta2);
  const rs = ((n1 * cos1 - n2 * cos2) / (n1 * cos1 + n2 * cos2)) ** 2;
  const rp = ((n2 * cos1 - n1 * cos2) / (n2 * cos1 + n1 * cos2)) ** 2;
  const thetaB = Math.atan(n2 / n1);
  return {
    n1, n2, name: brewsterMedia[state.brewsterMedium].name,
    theta1, theta2, thetaB, rs, rp,
    atBrewster: Math.abs(theta1 - thetaB) < .0009 && rp < 1e-6,
  };
}

function walkoffAngle(nO, nE, tilt) {
  const beta = tilt * DEG;
  const b = 1 / (nO * nO) - 1 / (nE * nE);
  const horizontal = Math.sin(beta) * Math.cos(beta) * b;
  const vertical = 1 / (nE * nE) + Math.cos(beta) ** 2 * b;
  return Math.atan2(Math.abs(horizontal), vertical);
}

const BASE_SEPARATION = 8 * Math.tan(walkoffAngle(1.658, 1.486, AXIS_TILT));

function opticsModel() {
  const { nO, nE, name } = wavelengths[state.wavelength];
  const beta = (state.axisAligned ? 0 : AXIS_TILT) * DEG;
  const phi = state.crystal * DEG;
  const axis = new THREE.Vector3(Math.sin(beta) * Math.cos(phi), Math.cos(beta), Math.sin(beta) * Math.sin(phi));
  const b = 1 / (nO * nO) - 1 / (nE * nE);
  const kd = Math.cos(beta);
  const sx = axis.x * kd * b;
  const sy = 1 / (nE * nE) + axis.y * kd * b;
  const sz = axis.z * kd * b;
  const walkoff = Math.atan2(Math.hypot(sx, sz), sy);
  const separation = state.thickness * Math.tan(walkoff);
  const sourcePhi = state.sourceAngle * DEG;
  const inputO = state.source === 'natural' ? .5 : Math.cos(sourcePhi) ** 2;
  const inputE = state.source === 'natural' ? .5 : Math.sin(sourcePhi) ** 2;
  const theta = state.angle * DEG;
  const o = state.analyzer ? inputO * Math.cos(theta) ** 2 : inputO;
  const e = state.analyzer ? inputE * Math.sin(theta) ** 2 : inputE;
  const gamma = Math.PI / 2 - beta;
  const effectiveE = 1 / Math.sqrt(Math.sin(beta) ** 2 / (nE * nE) + Math.cos(beta) ** 2 / (nO * nO));
  return { nO, nE, name, axis, sx, sy, sz, walkoff, separation, inputO, inputE, o, e, effectiveE, gamma };
}

function intensities() {
  const model = opticsModel();
  return [model.o, model.e];
}

function canvas(width, height) {
  const element = document.createElement('canvas');
  element.width = width;
  element.height = height;
  return element;
}

function texture(element) {
  const map = new THREE.CanvasTexture(element);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  return map;
}

// Seeded paper, wood, and cloth surfaces are generated locally, with no image requests.
function materialTexture(kind) {
  const c = canvas(1024, 1024), ctx = c.getContext('2d');
  let seed = 731;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  ctx.fillStyle = kind === 'wood' ? '#cec3af' : kind === 'cloth' ? '#94a59c' : '#d5a427';
  ctx.fillRect(0, 0, 1024, 1024);
  if (kind === 'wood') {
    for (let i = 0; i < 2600; i++) {
      const y = random() * 1024, length = 80 + random() * 900, x = random() * 1024;
      ctx.strokeStyle = `rgba(${random() > .5 ? '83,65,40' : '255,250,230'},${.025 + random() * .13})`;
      ctx.lineWidth = .4 + random() * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + length * .3, y - 2, x + length * .6, y + 2, x + length, y + random() * 4);
      ctx.stroke();
    }
    ctx.strokeStyle = '#65564025';
    ctx.lineWidth = 2;
    [12, 340, 682].forEach(y => { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y + 1); ctx.stroke(); });
  } else {
    for (let i = 0; i < 1024; i += 2) {
      ctx.strokeStyle = i % 4 ? '#fff1' : '#24322713';
      ctx.lineWidth = .6;
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, 1024);
      ctx.moveTo(0, i); ctx.lineTo(1024, i);
      ctx.stroke();
    }
    for (let i = 0; i < 40000; i++) {
      ctx.fillStyle = random() > .5 ? '#fff2' : '#171b1715';
      ctx.fillRect(random() * 1024, random() * 1024, 1, 1);
    }
  }
  const map = texture(c);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  return map;
}

function box(w, h, d, material, x, y, z, parent = book) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function plane(w, d, map, x, y, z, parent = book) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map, roughness: .94, side: THREE.DoubleSide }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function printedSurface(mesh) {
  const map = mesh.material.map;
  mesh.material.dispose();
  mesh.material = new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide, toneMapped: false });
  return mesh;
}

function line(points, color, parent, opacity = 1) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p)));
  const mesh = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
  parent.add(mesh);
  return mesh;
}

function drawText(ctx, text, x, y, size = 34, color = ink, weight = 400) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${serif}`;
  ctx.fillText(text, x, y);
}

function paragraph(ctx, text, x, y, maxWidth, size = 34, lineHeight = 58) {
  ctx.font = `400 ${size}px ${serif}`;
  ctx.fillStyle = ink;
  let row = '';
  // Keep decimal values and Latin units intact when wrapping Chinese printed copy.
  for (const ch of text.match(/\n|[A-Za-z0-9]+(?:\.[0-9]+)?|\s+|./gu)) {
    if (ch === '\n' || ctx.measureText(row + ch).width > maxWidth) {
      ctx.fillText(row, x, y);
      y += lineHeight;
      row = ch === '\n' ? '' : ch;
    } else row += ch;
  }
  if (row) ctx.fillText(row, x, y);
  return y + lineHeight;
}

function drawCrystalDiagram(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const a = [[-130,-35],[45,-75],[145,-5],[115,90],[-60,125],[-130,-35]];
  ctx.fillStyle = '#e4ece54a';
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  a.forEach(([px,py],i) => i ? ctx.lineTo(px,py) : ctx.moveTo(px,py));
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-130,-35); ctx.lineTo(-30,35); ctx.lineTo(145,-5);
  ctx.moveTo(-30,35); ctx.lineTo(-60,125); ctx.stroke();
  ctx.setLineDash([4,5]);
  ctx.beginPath(); ctx.moveTo(45,-75); ctx.lineTo(15,18); ctx.lineTo(115,90); ctx.stroke();
  ctx.setLineDash([]);
  for (let i = 0; i < 9; i++) {
    ctx.beginPath(); ctx.moveTo(120-i*4,20+i*5); ctx.lineTo(112-i*4,65+i*5);
    ctx.strokeStyle = '#28303a30'; ctx.stroke();
  }
  ctx.restore();
}

function paperCanvas(side) {
  const c = canvas(1000, 1400), ctx = c.getContext('2d'), lesson = lessons[state.page];
  ctx.fillStyle = paper;
  ctx.fillRect(0,0,1000,1400);
  const gradient = ctx.createLinearGradient(0,0,1000,0);
  if (side === 'left') {
    gradient.addColorStop(0,'#b9a2780d'); gradient.addColorStop(.84,'#fff0'); gradient.addColorStop(1,'#4e3b204a');
  } else {
    gradient.addColorStop(0,'#4e3b2045'); gradient.addColorStop(.12,'#fff0'); gradient.addColorStop(1,'#b9a2780c');
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,1000,1400);
  ctx.strokeStyle = '#96897470'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(80,94); ctx.lineTo(920,94); ctx.stroke();
  drawText(ctx,side === 'left' ? '光的实验手记' : '偏振光学 · 基础与双折射',80,70,23,'#69604f');
  ctx.textAlign = 'right';
  drawText(ctx,side === 'left' ? 'POLARCRAFT' : 'OPTICS / 01',920,70,23,'#69604f');
  ctx.textAlign = 'left';
  if (side === 'left') {
    drawText(ctx,`第 ${String(state.page+1).padStart(2,'0')} 讲   /   ${String(lessons.length).padStart(2,'0')}`,115,170,26,red);
    drawText(ctx,lesson.title,115,281,75,ink,600);
    drawText(ctx,lesson.english,119,333,22,'#736653');
    paragraph(ctx,lesson.intro,120,430,770,38,66);
    ctx.strokeStyle = '#a8997b80'; ctx.beginPath(); ctx.moveTo(120,643); ctx.lineTo(260,643); ctx.stroke();
    drawText(ctx,lesson.heading,120,712,34,ink,600);
    paragraph(ctx,lesson.body,120,778,750,31,53);
    drawText(ctx,'试一试',120,1040,30,red,600);
    paragraph(ctx,lesson.task,120,1098,750,30,53);
    drawText(ctx,lesson.note,120,1270,31,red);
  } else {
    const kind = lessonKind();
    drawText(ctx,kind === 'calcite' ? '观察与实验' : '原理与图示',100,177,26,red);
    drawText(ctx,lesson.figure,100,245,42,ink,600);
    drawText(ctx,lesson.instruction,100,299,25,'#706651');
    if (kind === 'calcite') {
      drawText(ctx,'o',135,1060,34,'#3c7186'); drawText(ctx,'寻常光',182,1060,28,ink);
      drawText(ctx,'e',560,1060,34,red); drawText(ctx,'非常光',607,1060,28,ink);
    } else if (kind === 'wave') {
      drawText(ctx,'E',135,1060,34,red); drawText(ctx,'电场',182,1060,28,ink);
      drawText(ctx,'B',560,1060,34,'#3c7186'); drawText(ctx,'磁场',607,1060,28,ink);
    } else if (kind === 'polarization') {
      drawText(ctx,'Eₓ',135,1060,34,'#3c7186'); drawText(ctx,'水平分量',205,1060,28,ink);
      drawText(ctx,'Eᵧ',560,1060,34,'#75814c'); drawText(ctx,'竖直分量',630,1060,28,ink);
    } else {
      drawText(ctx,'s',135,1060,34,'#3c7186'); drawText(ctx,'垂直入射面',182,1060,28,ink);
      drawText(ctx,'p',560,1060,34,red); drawText(ctx,'平行入射面',607,1060,28,ink);
    }
    paragraph(ctx,lesson.caption,100,1130,800,29,48);
    if (kind === 'wave') drawText(ctx,'c = λf = 2.998 × 10⁸ m/s',100,1235,31,red);
    else if (kind === 'polarization') drawText(ctx,'Eₓ = Aₓ cosτ     Eᵧ = Aᵧ cos(τ + δ)',100,1235,31,red);
    else if (kind === 'brewster') drawText(ctx,'tan θB = n₂ / n₁     θB + θ₂ = 90°',100,1235,31,red);
    else if (state.page === 5) drawText(ctx,'Iₒ = Iₒ,入 cos²θ     Iₑ = Iₑ,入 sin²θ',100,1235,31,red);
    else if (state.page === 6) drawText(ctx,'沿光轴：nₒ = nₑ(0°)，双像重合。',100,1235,29,red);
    else if (state.page === 4) drawText(ctx,'Δx = t · tan δ',100,1235,34,red);
    else drawText(ctx,'一块晶体，让光的两种旅程显现。',100,1235,29,red);
  }
  ctx.textAlign = side === 'left' ? 'left' : 'right';
  drawText(ctx,String(state.page*2+(side === 'left' ? 4 : 5)),side === 'left' ? 80 : 920,1348,27,'#69604f');
  return c;
}

function coverCanvas() {
  const c = canvas(1000,1400), ctx = c.getContext('2d');
  ctx.fillStyle = '#d5a427'; ctx.fillRect(0,0,1000,1400);
  for (let i = 0; i < 1000; i += 3) {
    ctx.strokeStyle = '#66490b12'; ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,1400); ctx.stroke();
  }
  for (let i = 0; i < 1400; i += 3) {
    ctx.strokeStyle = '#ffec9917'; ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(1000,i); ctx.stroke();
  }
  ctx.strokeStyle = '#88641e'; ctx.lineWidth = 2; ctx.strokeRect(43,43,914,1314);
  ctx.strokeStyle = '#f8d875'; ctx.strokeRect(49,49,902,1302); ctx.strokeRect(59,59,882,1282);
  ctx.textAlign = 'center';
  drawText(ctx,'光 的 实 验 手 记',500,180,27,'#6d501e');
  drawText(ctx,'一束光的',500,325,90,'#74532a',600);
  drawText(ctx,'两种旅程',500,445,90,'#74532a',600);
  drawText(ctx,'A little book of light',500,511,34,'#765929');
  ctx.fillStyle = '#f8f1dd'; ctx.fillRect(175,608,650,450);
  ctx.strokeStyle = '#8e6d2b'; ctx.strokeRect(165,598,670,470);
  ctx.strokeStyle = '#cbbd9f'; ctx.strokeRect(193,626,614,414);
  ctx.save(); ctx.translate(500,810); ctx.strokeStyle = '#a3472e'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-245,55); ctx.lineTo(-75,20); ctx.lineTo(235,-25); ctx.moveTo(-75,20); ctx.lineTo(235,115); ctx.stroke(); ctx.restore();
  drawCrystalDiagram(ctx,500,800,1.35);
  drawText(ctx,'冰洲石 · 双折射实验',500,1172,38,'#74532a');
  drawText(ctx,'POLARCRAFT',500,1245,24,'#74532a');
  return c;
}

function makeCrystal() {
  const group = new THREE.Group();
  // Parallel top/bottom rhombic faces with a sheared side, closer to calcite cleavage than a cube.
  const vertices = new Float32Array([
    -1.50,0,-1.10, 1.20,0,-1.10, 1.95,0,.95, -.75,0,.95,
    -1.05,1.35,-.85, 1.65,1.35,-.85, 2.40,1.35,1.20, -.30,1.35,1.20,
  ]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(vertices,3));
  geometry.setIndex([
    0,2,1, 0,3,2, 4,5,6, 4,6,7,
    0,1,5, 0,5,4, 1,2,6, 1,6,5,
    2,3,7, 2,7,6, 3,0,4, 3,4,7,
  ]);
  geometry.computeVertexNormals();
  const body = new THREE.Mesh(geometry,new THREE.MeshPhysicalMaterial({
    color: '#d8e8e2', transparent: true, opacity: .27, roughness: .12,
    metalness: .03, clearcoat: 1, clearcoatRoughness: .16,
    ior: 1.658, side: THREE.DoubleSide, depthWrite: false,
  }));
  body.castShadow = false;
  group.add(body);
  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry),new THREE.LineBasicMaterial({ color: ink, transparent: true, opacity: .84 })));
  for (let i = 0; i < 13; i++) {
    const z = -.95 + i * .15;
    line([[1.65,.55,z],[1.46,.12,z+.12]],'#64736c',group,.23);
  }
  group.position.set(2.7,.34,.2);
  book.add(group);
  return group;
}

function makeAnalyzer() {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5,.035,8,80),new THREE.MeshStandardMaterial({ color: '#343b3a', roughness: .7, metalness: .2 }));
  ring.rotation.x = -Math.PI / 2;
  group.add(ring);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.47,64),new THREE.MeshBasicMaterial({ color: '#657b7b', transparent: true, opacity: .15, side: THREE.DoubleSide, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2;
  group.add(disc);
  for (let x = -1.3; x <= 1.3; x += .17) {
    const z = Math.sqrt(1.42 ** 2 - x * x);
    line([[x,.01,-z],[x,.01,z]],'#51686b',group,.24);
  }
  for (let i = 0; i < 36; i++) {
    const a = i * Math.PI / 18, inner = i % 9 === 0 ? 1.34 : 1.40;
    line([[Math.cos(a)*inner,.025,Math.sin(a)*inner],[Math.cos(a)*1.47,.025,Math.sin(a)*1.47]],'#333b3b',group,.7);
  }
  line([[-1.34,.035,0],[1.34,.035,0]],'#913e2c',group,.9);
  box(.09,.07,.85,new THREE.MeshStandardMaterial({ color: '#494b42', roughness: .8 }),0,0,1.85,group);
  group.position.set(2.7,2.25,.2);
  group.visible = false;
  book.add(group);
  return group;
}

function makeLabel(text, color) {
  const c = canvas(256,96), ctx = c.getContext('2d');
  ctx.font = `44px ${serif}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#faf5e9dc';
  ctx.fillRect(32,14,192,64);
  ctx.fillStyle = color;
  ctx.fillText(text,128,61);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture(c), transparent: true, depthTest: false, toneMapped: false }));
  sprite.scale.set(1.15,.43,1);
  sprite.renderOrder = 10;
  book.add(sprite);
  return sprite;
}

function makeAxisGuide() {
  const group = new THREE.Group();
  const axisLine = new THREE.Line(new THREE.BufferGeometry(),new THREE.LineDashedMaterial({ color: '#6d4935', dashSize: .12, gapSize: .09, transparent: true, opacity: .9 }));
  axisLine.name = 'axis-line';
  group.add(axisLine);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(.09,.28,12),new THREE.MeshBasicMaterial({ color: '#6d4935' }));
  arrow.name = 'axis-arrow';
  group.add(arrow);
  const label = makeLabel('光轴','#6d4935');
  book.remove(label);
  group.add(label);
  label.name = 'axis-label';
  book.add(group);
  return group;
}

function updateAxisGuide(model) {
  const center = new THREE.Vector3(2.7,.34 + .675 * state.thickness / 8,.2);
  const start = center.clone().addScaledVector(model.axis,-1.75);
  const end = center.clone().addScaledVector(model.axis,1.75);
  const axisLine = axisGuide.getObjectByName('axis-line');
  axisLine.geometry.dispose();
  axisLine.geometry = new THREE.BufferGeometry().setFromPoints([start,end]);
  axisLine.computeLineDistances();
  const arrow = axisGuide.getObjectByName('axis-arrow');
  arrow.position.copy(end);
  arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),model.axis);
  const label = axisGuide.getObjectByName('axis-label');
  label.position.copy(end).addScaledVector(model.axis,.3);
}

function dynamicDiagramLine(count, color, parent, opacity = 1) {
  const geometry = new THREE.BufferGeometry();
  const attribute = new THREE.BufferAttribute(new Float32Array(count * 3), 3);
  attribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', attribute);
  const mesh = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity, toneMapped: false }));
  mesh.frustumCulled = false;
  parent.add(mesh);
  return mesh;
}

function setDiagramPoints(mesh, count, pointAt) {
  const positions = mesh.geometry.attributes.position;
  for (let i = 0; i < count; i++) {
    const [x,y,z] = pointAt(i / (count - 1), i);
    positions.setXYZ(i,x,y,z);
  }
  positions.needsUpdate = true;
}

function foundationMaterial(color, opacity = 1) {
  return new THREE.MeshBasicMaterial({
    color, transparent: opacity < 1, opacity, toneMapped: false,
    side: THREE.DoubleSide, depthWrite: opacity >= 1,
  });
}

// A real mesh stroke keeps the diagram legible at book scale; WebGL lines alone
// remain one pixel wide and made the old foundation scenes disappear into the paper.
function dynamicStroke(count, color, parent, radius = .02, opacity = 1) {
  const sides = 6;
  const geometry = new THREE.BufferGeometry();
  const attribute = new THREE.BufferAttribute(new Float32Array(count * sides * 3), 3);
  attribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', attribute);
  const indices = [];
  for (let i = 0; i < count - 1; i++) {
    for (let j = 0; j < sides; j++) {
      const a = i * sides + j, b = i * sides + (j + 1) % sides;
      const c = (i + 1) * sides + j, d = (i + 1) * sides + (j + 1) % sides;
      indices.push(a,c,b,b,c,d);
    }
  }
  geometry.setIndex(indices);
  const mesh = new THREE.Mesh(geometry,foundationMaterial(color,opacity));
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  mesh.userData.stroke = {
    count, sides, radius,
    points: Array.from({ length: count },() => new THREE.Vector3()),
  };
  parent.add(mesh);
  return mesh;
}

function setStrokePoints(mesh, pointAt) {
  const { count, sides, radius, points } = mesh.userData.stroke;
  for (let i = 0; i < count; i++) points[i].set(...pointAt(i / (count - 1)));
  const tangent = new THREE.Vector3(), normal = new THREE.Vector3(), binormal = new THREE.Vector3();
  const reference = new THREE.Vector3();
  const positions = mesh.geometry.attributes.position;
  for (let i = 0; i < count; i++) {
    tangent.subVectors(points[Math.min(i + 1,count - 1)],points[Math.max(0,i - 1)]);
    if (tangent.lengthSq() < 1e-8) tangent.set(1,0,0);
    else tangent.normalize();
    reference.set(0,0,Math.abs(tangent.z) < .9 ? 1 : 0);
    if (reference.lengthSq() === 0) reference.set(0,1,0);
    normal.crossVectors(tangent,reference).normalize();
    binormal.crossVectors(tangent,normal).normalize();
    for (let j = 0; j < sides; j++) {
      const angle = j / sides * Math.PI * 2;
      const nx = normal.x * Math.cos(angle) + binormal.x * Math.sin(angle);
      const ny = normal.y * Math.cos(angle) + binormal.y * Math.sin(angle);
      const nz = normal.z * Math.cos(angle) + binormal.z * Math.sin(angle);
      positions.setXYZ(i * sides + j,points[i].x + nx * radius,points[i].y + ny * radius,points[i].z + nz * radius);
    }
  }
  positions.needsUpdate = true;
}

function dynamicRibbon(count, color, parent, opacity) {
  const geometry = new THREE.BufferGeometry();
  const attribute = new THREE.BufferAttribute(new Float32Array(count * 2 * 3), 3);
  attribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', attribute);
  const indices = [];
  for (let i = 0; i < count - 1; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    indices.push(a,c,b,b,c,d);
  }
  geometry.setIndex(indices);
  const material = foundationMaterial(color,opacity);
  material.depthWrite = false;
  const mesh = new THREE.Mesh(geometry,material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  parent.add(mesh);
  return mesh;
}

function setRibbonPoints(mesh, count, edgeAt, baseAt) {
  const positions = mesh.geometry.attributes.position;
  for (let i = 0; i < count; i++) {
    const u = i / (count - 1);
    positions.setXYZ(i * 2,...baseAt(u));
    positions.setXYZ(i * 2 + 1,...edgeAt(u));
  }
  positions.needsUpdate = true;
}

function dashedLine(points, color, parent, opacity = .5) {
  const mesh = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points.map(point => new THREE.Vector3(...point))),
    new THREE.LineDashedMaterial({ color, dashSize: .09, gapSize: .065, transparent: true, opacity, toneMapped: false }),
  );
  mesh.computeLineDistances();
  parent.add(mesh);
  return mesh;
}

function makeFoundationTag(text, color, parent, x, y, z, width = 1.25) {
  const c = canvas(512,128), ctx = c.getContext('2d');
  const map = texture(c);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthTest: false, toneMapped: false }));
  sprite.position.set(x,y,z);
  sprite.scale.set(width,.32,1);
  sprite.renderOrder = 12;
  sprite.userData.setText = nextText => {
    if (sprite.userData.text === nextText) return;
    sprite.userData.text = nextText;
    ctx.clearRect(0,0,512,128);
    ctx.font = `500 58px ${serif}`;
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#faf5e9e8';
    ctx.strokeText(nextText,256,82,440);
    ctx.fillStyle = color;
    ctx.fillText(nextText,256,82,440);
    map.needsUpdate = true;
  };
  sprite.userData.setText(text);
  parent.add(sprite);
  return sprite;
}

function makeArrow(color, parent, opacity = .9) {
  const arrow = new THREE.ArrowHelper(new THREE.Vector3(0,1,0),new THREE.Vector3(),1,color,.1,.055);
  for (const material of [arrow.line.material,arrow.cone.material]) {
    material.transparent = true;
    material.opacity = opacity;
    material.toneMapped = false;
  }
  parent.add(arrow);
  return arrow;
}

function setArrow(arrow, origin, direction, length) {
  arrow.position.copy(origin);
  arrow.visible = length > .025;
  if (!arrow.visible) return;
  arrow.setDirection(direction);
  arrow.setLength(length,Math.min(.12,length * .38),Math.min(.065,length * .22));
}

function makeVectorSet(count, color, parent) {
  return Array.from({ length: count },() => makeArrow(color,parent,.76));
}

function makeFlowDots(parent, count = 5) {
  const coreGeometry = new THREE.SphereGeometry(.038,10,8);
  const haloGeometry = new THREE.SphereGeometry(.105,10,8);
  const coreMaterial = foundationMaterial(foundationColors.gold);
  const haloMaterial = foundationMaterial(foundationColors.gold,.12);
  haloMaterial.blending = THREE.AdditiveBlending;
  haloMaterial.depthWrite = false;
  return Array.from({ length: count },(_,i) => {
    const dot = new THREE.Group();
    dot.add(new THREE.Mesh(coreGeometry,coreMaterial),new THREE.Mesh(haloGeometry,haloMaterial));
    dot.userData.offset = i / count;
    parent.add(dot);
    return dot;
  });
}

function updateFlowDots(dots, startX, endX, y) {
  dots.forEach(dot => {
    const progress = (dot.userData.offset + waveClock * .17) % 1;
    dot.position.set(startX + (endX - startX) * progress,y,0);
  });
}

function makeOpticalRay(color, parent) {
  const group = new THREE.Group();
  const material = foundationMaterial(color,.92);
  const glowMaterial = foundationMaterial(color,.12);
  glowMaterial.blending = THREE.AdditiveBlending;
  glowMaterial.depthWrite = false;
  const core = new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,10),material);
  const glow = new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,10),glowMaterial);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(.065,.2,12),material);
  group.add(glow,core,arrow);
  parent.add(group);
  return { group, core, glow, arrow, material, glowMaterial };
}

function setOpticalRay(ray, start, end, intensity = 1) {
  setCylinder(ray.core,start,end,.018);
  setCylinder(ray.glow,start,end,.048);
  const direction = end.clone().sub(start).normalize();
  ray.arrow.position.copy(end);
  ray.arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);
  ray.material.opacity = .28 + .67 * intensity;
  ray.glowMaterial.opacity = .035 + .11 * intensity;
}

function makeDoubleArrow(color, parent) {
  const group = new THREE.Group();
  group.userData.forward = makeArrow(color,group,.95);
  group.userData.backward = makeArrow(color,group,.95);
  parent.add(group);
  return group;
}

function setDoubleArrow(group, center, direction, length = .19) {
  setArrow(group.userData.forward,center,direction,length);
  setArrow(group.userData.backward,center,direction.clone().negate(),length);
}

function makePropagationAxis(parent, endX) {
  dashedLine([[-2.18,FOUNDATION_Y,0],[endX,FOUNDATION_Y,0]],foundationColors.axis,parent,.62);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(.065,.22,12),foundationMaterial(foundationColors.axis));
  arrow.rotation.z = -Math.PI / 2;
  arrow.position.set(endX + .04,FOUNDATION_Y,0);
  parent.add(arrow);
}

function makeFoundation() {
  const group = new THREE.Group();
  group.position.set(2.7,.38,.12);
  book.add(group);

  waveScene = new THREE.Group();
  waveBLayer = new THREE.Group();
  polarizationScene = new THREE.Group();
  brewsterScene = new THREE.Group();
  waveScene.add(waveBLayer);
  group.add(waveScene,polarizationScene,brewsterScene);

  // Lesson 1: two translucent field curtains share one propagation axis.
  makePropagationAxis(waveScene,2.18);
  waveE = dynamicStroke(180,foundationColors.e,waveScene,.022);
  waveERibbon = dynamicRibbon(180,foundationColors.e,waveScene,.22);
  waveB = dynamicStroke(180,foundationColors.b,waveBLayer,.019);
  waveBRibbon = dynamicRibbon(180,foundationColors.b,waveBLayer,.19);
  waveEVectors = makeVectorSet(7,foundationColors.e,waveScene);
  waveBVectors = makeVectorSet(6,foundationColors.b,waveBLayer);
  waveFlow = makeFlowDots(waveScene,5);
  waveDimension = dynamicDiagramLine(2,foundationColors.axis,waveScene,.7);
  waveDimensionArrowA = new THREE.Mesh(new THREE.ConeGeometry(.035,.12,8),foundationMaterial(foundationColors.axis));
  waveDimensionArrowB = waveDimensionArrowA.clone();
  waveDimensionArrowA.rotation.z = Math.PI / 2;
  waveDimensionArrowB.rotation.z = -Math.PI / 2;
  waveScene.add(waveDimensionArrowA,waveDimensionArrowB);
  waveDimensionLabel = makeFoundationTag('λ',foundationColors.axis,waveScene,0,2.22,0,.72);
  makeFoundationTag('E  电场',foundationColors.e,waveScene,-1.7,1.88,0,1.18);
  makeFoundationTag('B  磁场',foundationColors.b,waveScene,-.95,1.0,1.0,1.18);
  makeFoundationTag('传播方向  k',foundationColors.axis,waveScene,1.46,.53,.12,1.5);
  line([[-2.05,FOUNDATION_Y,-.78],[-2.05,FOUNDATION_Y,.78]],foundationColors.b,waveBLayer,.25);
  line([[-2.05,.12,0],[-2.05,1.68,0]],foundationColors.e,waveScene,.25);

  // Lesson 2: rotate the whole optical diagram, not just the receiver, so the
  // receiving plane remains perpendicular to propagation and readable in 3D.
  polarizationScene.rotation.order = 'YXZ';
  polarizationScene.rotation.y = POLARIZATION_DEFAULT_Y;
  polarizationScene.scale.setScalar(.9);
  makePropagationAxis(polarizationScene,2.12);
  polarizationE = dynamicStroke(180,foundationColors.e,polarizationScene,.025);
  polarizationRibbon = dynamicRibbon(180,foundationColors.e,polarizationScene,.17);
  polarizationEx = dynamicStroke(180,foundationColors.x,polarizationScene,.012,.62);
  polarizationEy = dynamicStroke(180,foundationColors.y,polarizationScene,.012,.62);
  polarizationFlow = makeFlowDots(polarizationScene,4);
  makeFoundationTag('E',foundationColors.e,polarizationScene,-1.72,1.72,.1,.64);
  makeFoundationTag('Eₓ',foundationColors.x,polarizationScene,-1.7,.43,.98,.7);
  makeFoundationTag('Eᵧ',foundationColors.y,polarizationScene,-.82,1.7,.12,.7);

  polarizationReceiver = new THREE.Group();
  polarizationReceiver.position.set(POLARIZATION_RECEIVER_X,FOUNDATION_Y,0);
  polarizationScene.add(polarizationReceiver);
  const receiverDisc = new THREE.Mesh(new THREE.CircleGeometry(.98,72),foundationMaterial('#fffaf0',.16));
  receiverDisc.rotation.y = Math.PI / 2;
  receiverDisc.position.x = .035;
  receiverDisc.material.depthWrite = false;
  polarizationReceiver.add(receiverDisc);
  const receiverRing = new THREE.Mesh(new THREE.TorusGeometry(.98,.016,8,96),foundationMaterial(foundationColors.axis,.72));
  receiverRing.rotation.y = Math.PI / 2;
  polarizationReceiver.add(receiverRing);
  dashedLine([[0,-.84,0],[0,.84,0]],foundationColors.y,polarizationReceiver,.36);
  dashedLine([[0,0,-.84],[0,0,.84]],foundationColors.x,polarizationReceiver,.36);
  for (let i = 0; i < 24; i++) {
    const angle = i / 24 * Math.PI * 2;
    const inner = i % 6 === 0 ? .88 : .925;
    line([
      [0,Math.sin(angle) * inner,Math.cos(angle) * inner],
      [0,Math.sin(angle) * .98,Math.cos(angle) * .98],
    ],foundationColors.axis,polarizationReceiver,i % 6 === 0 ? .65 : .3);
  }
  line([[0,-.73,-.62],[0,-1.01,-.76]],foundationColors.axis,polarizationReceiver,.45);
  line([[0,-.73,.62],[0,-1.01,.76]],foundationColors.axis,polarizationReceiver,.45);
  polarizationEllipse = dynamicStroke(129,foundationColors.e,polarizationReceiver,.019);
  polarizationVector = makeArrow(foundationColors.e,polarizationReceiver,1);
  polarizationEndpoint = new THREE.Mesh(new THREE.SphereGeometry(.052,12,10),foundationMaterial(foundationColors.e));
  polarizationReceiver.add(polarizationEndpoint);
  polarizationStateLabel = makeFoundationTag('45° 线偏振',foundationColors.e,polarizationReceiver,0,1.28,0,1.62);

  // Lesson 3: a dielectric surface with three live ray paths and Fresnel markers.
  brewsterScene.rotation.order = 'YXZ';
  brewsterScene.rotation.y = BREWSTER_DEFAULT_Y;
  brewsterScene.scale.setScalar(.88);
  const slab = box(4.45,.6,2.15,new THREE.MeshPhysicalMaterial({
    color: '#8dbbc0', transparent: true, opacity: .2, roughness: .18,
    side: THREE.DoubleSide, depthWrite: false,
  }),0,BREWSTER_SURFACE_Y - .3,0,brewsterScene);
  const slabEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(slab.geometry),
    new THREE.LineBasicMaterial({ color: foundationColors.b, transparent: true, opacity: .42, toneMapped: false }),
  );
  slabEdges.position.copy(slab.position);
  brewsterScene.add(slabEdges);
  dashedLine([[0,-.05,0],[0,2.35,0]],foundationColors.axis,brewsterScene,.6);
  makeFoundationTag('法线',foundationColors.axis,brewsterScene,.16,2.24,0,.78);
  makeFoundationTag('空气  n₁ = 1',foundationColors.axis,brewsterScene,-1.35,1.03,.94,1.42);
  brewsterMediumLabel = makeFoundationTag('玻璃  n₂ = 1.50',foundationColors.b,brewsterScene,-.82,.12,1.13,1.65);
  brewsterStateLabel = makeFoundationTag('反射光包含 s 与 p 分量',foundationColors.e,brewsterScene,0,2.42,0,2.15);
  brewsterIncidentRay = makeOpticalRay(foundationColors.gold,brewsterScene);
  brewsterReflectedRay = makeOpticalRay(foundationColors.e,brewsterScene);
  brewsterRefractedRay = makeOpticalRay(foundationColors.b,brewsterScene);
  brewsterIncidentArc = dynamicDiagramLine(49,foundationColors.gold,brewsterScene,.9);
  brewsterRefractedArc = dynamicDiagramLine(49,foundationColors.b,brewsterScene,.9);
  brewsterRightAngle = dynamicDiagramLine(3,foundationColors.e,brewsterScene,1);
  brewsterIncidentLabel = makeFoundationTag('入射光',foundationColors.gold,brewsterScene,0,0,0,1.0);
  brewsterReflectedLabel = makeFoundationTag('反射光',foundationColors.e,brewsterScene,0,0,0,1.0);
  brewsterRefractedLabel = makeFoundationTag('折射光',foundationColors.b,brewsterScene,0,0,0,1.0);
  brewsterAngleLabel = makeFoundationTag('θ₁',foundationColors.axis,brewsterScene,0,0,0,.64);
  brewsterRefractionAngleLabel = makeFoundationTag('θ₂',foundationColors.axis,brewsterScene,0,0,0,.64);
  brewsterIncidentS = makeDoubleArrow(foundationColors.b,brewsterScene);
  brewsterIncidentP = makeDoubleArrow(foundationColors.e,brewsterScene);
  brewsterReflectedS = makeDoubleArrow(foundationColors.b,brewsterScene);
  brewsterReflectedP = makeDoubleArrow(foundationColors.e,brewsterScene);
  brewsterFlow = makeFlowDots(brewsterScene,9);
  brewsterFlow.forEach((dot,i) => {
    dot.userData.ray = ['incident','reflected','refracted'][i % 3];
    dot.userData.offset = Math.floor(i / 3) / 3;
  });
  return group;
}

function updateFoundationGeometry() {
  if (!foundation || lessonKind() === 'calcite') return;
  if (lessonKind() === 'wave') {
    const amplitude = state.waveAmplitude / 50 * .64;
    const cycles = 2.35 * 550 / state.waveLength;
    const phase = waveClock * 1.45;
    const startX = -2.05, length = 4.1;
    const pointAt = (u, magnetic = false) => {
      const angle = Math.PI * 2 * cycles * u - phase;
      const displacement = amplitude * Math.sin(angle) * (magnetic ? .78 : 1);
      return magnetic
        ? [startX + length * u,FOUNDATION_Y,displacement]
        : [startX + length * u,FOUNDATION_Y + displacement,0];
    };
    const baseAt = u => [startX + length * u,FOUNDATION_Y,0];
    setStrokePoints(waveE,u => pointAt(u));
    setRibbonPoints(waveERibbon,180,u => pointAt(u),baseAt);
    setStrokePoints(waveB,u => pointAt(u,true));
    setRibbonPoints(waveBRibbon,180,u => pointAt(u,true),baseAt);
    waveEVectors.forEach((arrow,i) => {
      const u = (i + 1) / (waveEVectors.length + 1);
      const point = pointAt(u);
      const displacement = point[1] - FOUNDATION_Y;
      setArrow(arrow,new THREE.Vector3(point[0],FOUNDATION_Y,0),new THREE.Vector3(0,Math.sign(displacement) || 1,0),Math.abs(displacement));
    });
    waveBVectors.forEach((arrow,i) => {
      const u = (i + .65) / (waveBVectors.length + .3);
      const point = pointAt(u,true);
      setArrow(arrow,new THREE.Vector3(point[0],FOUNDATION_Y,0),new THREE.Vector3(0,0,Math.sign(point[2]) || 1),Math.abs(point[2]));
    });
    const span = length / cycles, center = -.12;
    setDiagramPoints(waveDimension,2,u => [center + (u - .5) * span,2.04,0]);
    waveDimensionArrowA.position.set(center - span / 2,2.04,0);
    waveDimensionArrowB.position.set(center + span / 2,2.04,0);
    waveDimensionLabel.position.x = center;
    waveBLayer.visible = state.showB;
    waveB.visible = state.showB;
    updateFlowDots(waveFlow,-2.12,2.12,FOUNDATION_Y);
    waveScene.userData.wavelengthSpan = span;
    return;
  }
  if (lessonKind() === 'brewster') {
    updateBrewsterGeometry();
    return;
  }
  const delta = state.phaseDiff * DEG;
  const phase = waveClock * 1.75;
  const exAt = tau => state.ampX * .76 * Math.cos(tau);
  const eyAt = tau => state.ampY * .76 * Math.cos(tau + delta);
  const startX = -2.05, endX = POLARIZATION_RECEIVER_X;
  const mainAt = u => {
    const tau = Math.PI * 4 * u - phase;
    return [startX + (endX - startX) * u,FOUNDATION_Y + eyAt(tau),exAt(tau)];
  };
  const baseAt = u => [startX + (endX - startX) * u,FOUNDATION_Y,0];
  setStrokePoints(polarizationE,mainAt);
  setRibbonPoints(polarizationRibbon,180,mainAt,baseAt);
  setStrokePoints(polarizationEx,u => {
    const tau = Math.PI * 4 * u - phase;
    return [startX + (endX - startX) * u,FOUNDATION_Y,exAt(tau)];
  });
  setStrokePoints(polarizationEy,u => {
    const tau = Math.PI * 4 * u - phase;
    return [startX + (endX - startX) * u,FOUNDATION_Y + eyAt(tau),0];
  });
  setStrokePoints(polarizationEllipse,u => {
    const tau = Math.PI * 2 * u;
    return [-.025,eyAt(tau),exAt(tau)];
  });
  const receiverTau = Math.PI * 4 - phase;
  const x = exAt(receiverTau), y = eyAt(receiverTau);
  const length = Math.hypot(x,y);
  const hasField = state.ampX >= .05 || state.ampY >= .05;
  polarizationE.visible = hasField;
  polarizationRibbon.visible = hasField;
  polarizationEx.visible = state.ampX >= .05;
  polarizationEy.visible = state.ampY >= .05;
  polarizationEllipse.visible = hasField;
  polarizationEndpoint.visible = hasField;
  polarizationFlow.forEach(dot => { dot.visible = hasField; });
  setArrow(polarizationVector,new THREE.Vector3(-.065,0,0),new THREE.Vector3(0,y,x).normalize(),length);
  polarizationEndpoint.position.set(-.065,y,x);
  updateFlowDots(polarizationFlow,startX,endX,FOUNDATION_Y);
}

function updateBrewsterGeometry() {
  const model = brewsterModel();
  const origin = new THREE.Vector3(0,BREWSTER_SURFACE_Y,0);
  const rayLength = 1.65, refractedLength = .58;
  const sin1 = Math.sin(model.theta1), cos1 = Math.cos(model.theta1);
  const sin2 = Math.sin(model.theta2), cos2 = Math.cos(model.theta2);
  const incidentStart = new THREE.Vector3(-rayLength * sin1,BREWSTER_SURFACE_Y + rayLength * cos1,0);
  const reflectedEnd = new THREE.Vector3(rayLength * sin1,BREWSTER_SURFACE_Y + rayLength * cos1,0);
  const refractedEnd = new THREE.Vector3(refractedLength * sin2,BREWSTER_SURFACE_Y - refractedLength * cos2,0);
  const naturalReflection = (model.rs + model.rp) / 2;
  setOpticalRay(brewsterIncidentRay,incidentStart,origin,1);
  setOpticalRay(brewsterReflectedRay,origin,reflectedEnd,Math.sqrt(naturalReflection));
  setOpticalRay(brewsterRefractedRay,origin,refractedEnd,Math.sqrt(1 - naturalReflection));
  const hasTransmission = 1 - naturalReflection > 1e-10;
  brewsterRefractedRay.group.visible = hasTransmission;
  brewsterRefractedLabel.visible = hasTransmission;

  brewsterIncidentLabel.position.copy(incidentStart).add(new THREE.Vector3(-.18,.17,0));
  brewsterReflectedLabel.position.copy(reflectedEnd).add(new THREE.Vector3(.18,.17,0));
  brewsterRefractedLabel.position.copy(refractedEnd).add(new THREE.Vector3(.32,-.04,0));
  setDiagramPoints(brewsterIncidentArc,49,u => {
    const angle = model.theta1 * u;
    return [-Math.sin(angle) * .44,BREWSTER_SURFACE_Y + Math.cos(angle) * .44,0];
  });
  setDiagramPoints(brewsterRefractedArc,49,u => {
    const angle = model.theta2 * u;
    return [Math.sin(angle) * .36,BREWSTER_SURFACE_Y - Math.cos(angle) * .36,0];
  });
  brewsterIncidentArc.visible = model.theta1 > .02;
  brewsterRefractedArc.visible = model.theta2 > .02;
  brewsterAngleLabel.visible = model.theta1 > .02;
  brewsterRefractionAngleLabel.visible = model.theta2 > .02;
  brewsterAngleLabel.position.set(-Math.sin(model.theta1 / 2) * .66,BREWSTER_SURFACE_Y + Math.cos(model.theta1 / 2) * .66,0);
  brewsterRefractionAngleLabel.position.set(Math.sin(model.theta2 / 2) * .56,BREWSTER_SURFACE_Y - Math.cos(model.theta2 / 2) * .56,0);

  const reflectedDirection = reflectedEnd.clone().sub(origin).normalize();
  const refractedDirection = refractedEnd.clone().sub(origin).normalize();
  const rightA = origin.clone().addScaledVector(reflectedDirection,.22);
  const rightB = rightA.clone().addScaledVector(refractedDirection,.22);
  const rightC = origin.clone().addScaledVector(refractedDirection,.22);
  setDiagramPoints(brewsterRightAngle,3,u => {
    const point = u === 0 ? rightA : u === .5 ? rightB : rightC;
    return point.toArray();
  });
  brewsterRightAngle.visible = model.atBrewster;

  const zAxis = new THREE.Vector3(0,0,1);
  const incidentCenter = new THREE.Vector3().lerpVectors(incidentStart,origin,.52);
  const reflectedCenter = new THREE.Vector3().lerpVectors(origin,reflectedEnd,.56);
  const incidentDirection = origin.clone().sub(incidentStart).normalize();
  const incidentP = new THREE.Vector3(-incidentDirection.y,incidentDirection.x,0).normalize();
  const reflectedP = new THREE.Vector3(-reflectedDirection.y,reflectedDirection.x,0).normalize();
  setDoubleArrow(brewsterIncidentS,incidentCenter,zAxis,.18);
  setDoubleArrow(brewsterIncidentP,incidentCenter,incidentP,.2);
  setDoubleArrow(brewsterReflectedS,reflectedCenter,zAxis,.18);
  setDoubleArrow(brewsterReflectedP,reflectedCenter,reflectedP,.2);
  brewsterReflectedS.visible = model.rs > .00001;
  brewsterReflectedP.visible = !model.atBrewster;
  brewsterStateLabel.userData.setText(model.atBrewster ? 'θ₁ = θB，p 分量不反射' : '反射光包含 s 与 p 分量');
  brewsterMediumLabel.userData.setText(`${model.name}  n₂ = ${model.n2.toFixed(2)}`);

  const paths = {
    incident: [incidentStart,origin],
    reflected: [origin,reflectedEnd],
    refracted: [origin,refractedEnd],
  };
  brewsterFlow.forEach(dot => {
    const path = paths[dot.userData.ray];
    const progress = (dot.userData.offset + waveClock * .2) % 1;
    dot.position.lerpVectors(path[0],path[1],progress);
    dot.visible = dot.userData.ray === 'refracted' ? hasTransmission : dot.userData.ray !== 'reflected' || naturalReflection > .00001;
  });
  brewsterScene.userData.perpendicular = Math.abs(reflectedDirection.dot(refractedDirection)) < 1e-6;
}

function makeBeam(color) {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .85, depthWrite: false, toneMapped: false });
  const glowMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .12, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const geometry = new THREE.CylinderGeometry(1,1,1,8);
  for (let i = 0; i < 2; i++) {
    const glow = new THREE.Mesh(geometry,glowMaterial);
    glow.name = `glow-${i}`;
    group.add(glow);
    const core = new THREE.Mesh(geometry,material);
    core.name = `core-${i}`;
    group.add(core);
  }
  group.userData.material = material;
  group.userData.glowMaterial = glowMaterial;
  book.add(group);
  return group;
}

function setCylinder(mesh, a, b, radius) {
  const direction = b.clone().sub(a);
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.scale.set(radius,direction.length(),radius);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());
}

function updateBeam(group, points, intensity) {
  const opacity = Math.min(1,intensity * 2);
  group.userData.material.opacity = .18 + .74 * opacity;
  group.userData.glowMaterial.opacity = .04 + .14 * opacity;
  for (let i = 0; i < 2; i++) {
    setCylinder(group.getObjectByName(`core-${i}`),points[i],points[i+1],.014);
    setCylinder(group.getObjectByName(`glow-${i}`),points[i],points[i+1],.047);
  }
}

function drawWord(model) {
  const ctx = wordCanvas.getContext('2d');
  ctx.fillStyle = paper; ctx.fillRect(0,0,1000,800);
  ctx.fillStyle = '#fff9eb'; ctx.fillRect(60,95,880,650);
  ctx.strokeStyle = '#a8997a'; ctx.lineWidth = 2; ctx.strokeRect(75,110,850,620);
  ctx.textAlign = 'center';
  const a = state.crystal * DEG;
  const offset = Math.min(220,145 * model.separation / BASE_SEPARATION);
  const ex = 430 + offset * Math.cos(a), ey = 430 + offset * Math.sin(a);
  ctx.font = `140px ${serif}`;
  if (offset < .5) {
    ctx.globalAlpha = Math.min(1,2 * (model.o + model.e));
    ctx.fillStyle = ink;
    ctx.fillText('光',430,430);
  } else {
    if (model.o > .001) {
      ctx.globalAlpha = Math.min(1,model.o * 2);
      ctx.fillStyle = '#304653'; ctx.fillText('光',430,430);
    }
    if (model.e > .001) {
      ctx.globalAlpha = Math.min(1,model.e * 2);
      ctx.fillStyle = '#55463b'; ctx.fillText('光',ex,ey);
    }
  }
  ctx.globalAlpha = 1;
  ctx.font = `25px ${serif}`;
  ctx.fillStyle = '#326f86'; ctx.fillText('o',375,495);
  if (offset >= .5) { ctx.fillStyle = '#a3442e'; ctx.fillText('e',ex + 48,ey + 65); }
  if (offset > 35) {
    ctx.strokeStyle = '#8e816b88'; ctx.lineWidth = 1.5; ctx.setLineDash([5,6]);
    ctx.beginPath(); ctx.moveTo(430,555); ctx.lineTo(430 + (ex - 430),555 + (ey - 430)); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.font = `22px ${serif}`;
  ctx.fillStyle = '#6e624f';
  const caption = offset < .5 ? '沿光轴传播 · 双像重合' : `平行晶面近轴模型 · Δx ≈ ${model.separation.toFixed(2)} mm`;
  ctx.fillText(caption,500,665);
  wordTexture.needsUpdate = true;
}

function updateTasks(model) {
  if (state.open) {
    for (const task of tasks[state.page]) {
      if (task.test(model)) state.completed.add(task.id);
    }
  }
  const current = tasks[state.page];
  $('tasks').innerHTML = current.map(task => `<li class="${state.completed.has(task.id) ? 'done' : ''}">${task.text}</li>`).join('');
  const complete = current.filter(task => state.completed.has(task.id)).length;
  $('task-progress').textContent = `${complete} / ${current.length}`;
}

function updateFoundationControls() {
  const kind = lessonKind();
  if (kind === 'wave') {
    $('wave-length').value = state.waveLength;
    $('wave-amplitude').value = state.waveAmplitude;
    $('wave-length-value').textContent = `${state.waveLength} nm`;
    $('wave-amplitude-value').textContent = state.waveAmplitude;
    $('show-b').checked = state.showB;
    $('wave-frequency').textContent = `${(2.998e8 / (state.waveLength * 1e-9) / 1e14).toFixed(2)} × 10¹⁴ Hz`;
    updateTasks(null);
    $('observation').textContent = observationText(null);
    updateTranscript(null);
    return;
  }
  if (kind === 'brewster') {
    const model = brewsterModel();
    $('brewster-medium').value = state.brewsterMedium;
    $('brewster-angle').value = state.brewsterAngle;
    $('brewster-angle-value').textContent = `${state.brewsterAngle.toFixed(1)}°`;
    $('brewster-theta-b').textContent = `${(model.thetaB / DEG).toFixed(1)}°`;
    $('brewster-theta-2').textContent = `${(model.theta2 / DEG).toFixed(1)}°`;
    $('brewster-rp').textContent = `${(model.rp * 100).toFixed(2)}%`;
    $('brewster-rs').textContent = `${(model.rs * 100).toFixed(2)}%`;
    $('brewster-set').setAttribute('aria-pressed',String(model.atBrewster));
    document.querySelectorAll('[data-brewster-angle]').forEach(button => {
      button.setAttribute('aria-pressed',String(Number(button.dataset.brewsterAngle) === state.brewsterAngle));
    });
    updateTasks(null);
    $('observation').textContent = observationText(null);
    updateTranscript(null);
    return;
  }
  const info = polarizationInfo();
  if (polarizationStateLabel) polarizationStateLabel.userData.setText(info.type);
  $('phase-diff').value = state.phaseDiff;
  $('amp-x').value = state.ampX;
  $('amp-y').value = state.ampY;
  $('phase-diff-value').textContent = `${state.phaseDiff}°`;
  $('amp-x-value').textContent = state.ampX.toFixed(1);
  $('amp-y-value').textContent = state.ampY.toFixed(1);
  $('polarization-state').textContent = info.type;
  $('ellipse-psi').textContent = `${info.psi.toFixed(1)}°`;
  $('ellipse-chi').textContent = `${info.chi.toFixed(1)}°`;
  document.querySelectorAll('[data-polarization]').forEach(button => {
    const preset = polarizationPresets[button.dataset.polarization];
    const active = preset.phase === state.phaseDiff && Math.abs(preset.x - state.ampX) < .001 && Math.abs(preset.y - state.ampY) < .001;
    button.setAttribute('aria-pressed',String(active));
  });
  updateTasks(null);
  $('observation').textContent = observationText(null);
  updateTranscript(null);
}

function observationText(model) {
  if (lessonKind() === 'wave') {
    if (!state.showB) return '现在只显示电场 E。打开磁场，确认它与电场和传播方向垂直。';
    return `λ = ${state.waveLength} nm，f = ${(2.998e8 / (state.waveLength * 1e-9) / 1e14).toFixed(2)} × 10¹⁴ Hz；E 与 B 同相传播。`;
  }
  if (lessonKind() === 'polarization') {
    const info = polarizationInfo();
    return `当前为${info.type}：δ = ${state.phaseDiff}°，Aₓ = ${state.ampX.toFixed(1)}，Aᵧ = ${state.ampY.toFixed(1)}。`;
  }
  if (lessonKind() === 'brewster') {
    const model = brewsterModel();
    if (model.atBrewster) return `θ₁ = θB = ${(model.thetaB / DEG).toFixed(1)}°，反射与折射垂直，Rₚ = 0，反射光只剩 s 偏振。`;
    return `当前 Rₚ = ${(model.rp * 100).toFixed(2)}%，Rₛ = ${(model.rs * 100).toFixed(2)}%；θB = ${(model.thetaB / DEG).toFixed(1)}°。`;
  }
  if (state.axisAligned) return '沿光轴传播：两种模式速度相同，δ = 0°，双像重合。';
  if (state.analyzer && model.e < .005 && model.o > .005) return '检偏片挡住了 e 光：现在只剩 o 像。';
  if (state.analyzer && model.o < .005 && model.e > .005) return '检偏片挡住了 o 光：现在只剩 e 像。';
  if (state.analyzer && Math.abs(model.o - model.e) < .006) return `两像现在等亮，各占总入射光强的 ${Math.round(model.o * 100)}%。`;
  if (state.source === 'linear' && !state.analyzer) return `线偏振入射：晶体后 o 光 ${Math.round(model.inputO * 100)}%，e 光 ${Math.round(model.inputE * 100)}%。`;
  return `双像连线随晶体转动；当前厚度下，间距约为 ${model.separation.toFixed(2)} mm。`;
}

function updateExperiment() {
  const kind = lessonKind();
  if (kind !== 'calcite') foundationDirty = true;
  $('calcite-controls').hidden = kind !== 'calcite';
  $('wave-controls').hidden = kind !== 'wave';
  $('polarization-controls').hidden = kind !== 'polarization';
  $('brewster-controls').hidden = kind !== 'brewster';
  $('experiment-title').textContent = kind === 'wave' ? '观察电磁波' : kind === 'polarization' ? '合成偏振态' : kind === 'brewster' ? '观察布儒斯特角' : '动手试一试';
  if (kind !== 'calcite') {
    updateFoundationControls();
    return;
  }
  updateCalciteExperiment();
}

function updateCalciteExperiment() {
  const model = opticsModel();
  $('crystal-value').textContent = `${state.crystal}°`;
  $('analyzer-value').textContent = `${state.angle}°`;
  $('source-value').textContent = `${state.sourceAngle}°`;
  $('thickness-value').textContent = `${state.thickness} mm`;
  $('o-value').textContent = `${Math.round(model.o * 100)}%`;
  $('e-value').textContent = `${Math.round(model.e * 100)}%`;
  $('o-bar').style.transform = `scaleX(${model.o})`;
  $('e-bar').style.transform = `scaleX(${model.e})`;
  $('analyzer-control').hidden = !state.analyzer;
  $('source-control').hidden = state.source !== 'linear';
  $('crystal-angle').value = state.crystal;
  $('analyzer-angle').value = state.angle;
  $('source-angle').value = state.sourceAngle;
  $('thickness').value = state.thickness;
  $('wavelength').value = state.wavelength;
  $('source').value = state.source;
  $('analyzer').checked = state.analyzer;
  $('show-rays').checked = state.showRays;
  $('show-axis').checked = state.showAxis;
  $('axis-mode').setAttribute('aria-pressed',String(state.axisAligned));
  $('axis-mode').innerHTML = state.axisAligned ? '恢复普通方向 <span>重新产生双像</span>' : '沿光轴观察 <span>双像重合</span>';
  document.querySelectorAll('[data-angle]').forEach(button => button.setAttribute('aria-pressed',String(Number(button.dataset.angle) === state.angle)));
  $('dial-axes').setAttribute('transform',`rotate(${-state.crystal} 50 50)`);
  $('dial-analyzer').setAttribute('transform',`rotate(${-(state.crystal + state.angle)} 50 50)`);
  $('dial-analyzer').style.display = state.analyzer ? '' : 'none';
  $('index-value').textContent = `${model.nO.toFixed(3)} / ${model.nE.toFixed(3)}`;
  $('walkoff-value').textContent = `${(model.walkoff / DEG).toFixed(2)}°`;
  $('separation-value').textContent = `${model.separation.toFixed(2)} mm`;
  $('observation').textContent = observationText(model);
  updateTasks(model);
  updateTranscript(model);
  if (!crystal) return;

  crystal.rotation.y = -state.crystal * DEG;
  crystal.scale.y = state.thickness / 8;
  analyzer.rotation.y = -(state.crystal + state.angle) * DEG;
  updateAxisGuide(model);
  drawWord(model);

  const bottom = new THREE.Vector3(2.7,.36,.2);
  const height = 1.35 * state.thickness / 8;
  const topY = .34 + height;
  const oTop = new THREE.Vector3(2.7,topY,.2);
  const eTop = new THREE.Vector3(2.7 + model.sx / model.sy * height,topY,.2 + model.sz / model.sy * height);
  const analyzerY = topY + .62;
  analyzer.position.set(2.7,analyzerY,.2);
  const oEnd = new THREE.Vector3(2.7,analyzerY + .85,.2);
  const eEnd = new THREE.Vector3(eTop.x,analyzerY + .85,eTop.z);
  photonPaths = { o: [bottom,oTop,oEnd], e: [bottom,eTop,eEnd] };
  updateBeam(beamO,photonPaths.o,state.axisAligned ? model.o + model.e : model.o);
  updateBeam(beamE,photonPaths.e,model.e);
  oLabel.position.copy(oEnd).add(new THREE.Vector3(-.72,.18,0));
  eLabel.position.copy(eEnd).add(new THREE.Vector3(.78,.18,0));
}

function updateTranscript(model = opticsModel()) {
  const lesson = lessons[state.page];
  if (lessonKind() === 'wave') {
    const frequency = 2.998e8 / (state.waveLength * 1e-9) / 1e14;
    $('transcript-content').innerHTML = `
      <h2>${lesson.title}</h2>
      <p>${lesson.intro.replaceAll('\n','<br>')}</p>
      <h3>${lesson.heading}</h3>
      <p>${lesson.body}</p>
      <h3>试一试</h3>
      <p>${lesson.task.replaceAll('\n','<br>')}</p>
      <p>${lesson.caption}</p>
      <h3>${lesson.extraTitle}</h3>
      <p>${lesson.extra}</p>
      <h3>本页的波动关系</h3>
      <p class="formula">c = λf；真空中 c = 2.998 × 10⁸ m/s。E ⊥ B ⊥ k，E 与 B 同相。</p>
      <p>图示采用真空中的理想单色平面波。屏幕上的振幅、空间尺度与播放速度用于观察波形，不按真实光速或实际场强绘制。</p>
      <p class="current-reading"><strong>当前读数</strong><br>波长 λ = ${state.waveLength} nm；频率 f = ${frequency.toFixed(2)} × 10¹⁴ Hz；画面电场振幅 = ${state.waveAmplitude}；磁场 B ${state.showB ? '已显示' : '已隐藏'}。</p>`;
    return;
  }
  if (lessonKind() === 'brewster') {
    const model = brewsterModel();
    $('transcript-content').innerHTML = `
      <h2>${lesson.title}</h2>
      <p>${lesson.intro.replaceAll('\n','<br>')}</p>
      <h3>${lesson.heading}</h3>
      <p>${lesson.body}</p>
      <h3>试一试</h3>
      <p>${lesson.task.replaceAll('\n','<br>')}</p>
      <p>${lesson.caption}</p>
      <h3>${lesson.extraTitle}</h3>
      <p>${lesson.extra}</p>
      <h3>角度与反射率</h3>
      <p class="formula">tan θB = n₂/n₁；n₁sinθ₁ = n₂sinθ₂。<br>θ₁ = θB 时，θ₁ + θ₂ = 90°，Rₚ = 0。</p>
      <p>本页使用菲涅耳公式计算非吸收、各向同性介质的反射率，n₁ = 1 表示空气。折射率使用可见光下的近似值，忽略色散与吸收。入射角和折射角均从法线计量。</p>
      <p class="current-reading"><strong>当前读数</strong><br>${model.name}：n₂ = ${model.n2.toFixed(2)}；入射角 θ₁ = ${(model.theta1 / DEG).toFixed(1)}°；折射角 θ₂ = ${(model.theta2 / DEG).toFixed(1)}°；θB = ${(model.thetaB / DEG).toFixed(1)}°。<br>Rₚ = ${(model.rp * 100).toFixed(3)}%；Rₛ = ${(model.rs * 100).toFixed(3)}%。${model.atBrewster ? '当前处于布儒斯特角，反射光只剩 s 偏振。' : '当前不在布儒斯特角。'}</p>`;
    return;
  }
  if (lessonKind() === 'polarization') {
    const info = polarizationInfo();
    $('transcript-content').innerHTML = `
      <h2>${lesson.title}</h2>
      <p>${lesson.intro.replaceAll('\n','<br>')}</p>
      <h3>${lesson.heading}</h3>
      <p>${lesson.body}</p>
      <h3>试一试</h3>
      <p>${lesson.task.replaceAll('\n','<br>')}</p>
      <p>${lesson.caption}</p>
      <h3>${lesson.extraTitle}</h3>
      <p>${lesson.extra}</p>
      <h3>两个分量如何合成</h3>
      <p class="formula">Eₓ = Aₓ cosτ；Eᵧ = Aᵧ cos(τ + δ)。<br>δ = 0° 或 180° 时为线偏振；等振幅且 δ = 90° 或 270° 时为圆偏振。</p>
      <p>空间曲线与右端投影使用同一组参数。动画暂停后轨迹仍保留，便于比较；ψ 表示椭圆主轴方位，χ 表示椭圆率与旋向。振幅为 0 的极限情形退化为单轴线偏振。</p>
      <p class="current-reading"><strong>当前状态</strong><br>${info.type}；δ = ${state.phaseDiff}°；Aₓ = ${state.ampX.toFixed(1)}；Aᵧ = ${state.ampY.toFixed(1)}；ψ = ${info.psi.toFixed(1)}°；χ = ${info.chi.toFixed(1)}°。<br>旋向采用迎着光传播方向的接收端视角。</p>`;
    return;
  }
  const sourceFormula = state.source === 'natural'
    ? '自然光：晶体后 Iₒ,入 = Iₑ,入 = ½I入。'
    : `线偏振光：晶体后 Iₒ,入 = I入 cos²φ，Iₑ,入 = I入 sin²φ；当前 φ = ${state.sourceAngle}°。`;
  const analyzerFormula = state.analyzer
    ? '放入检偏片后：Iₒ = Iₒ,入 cos²θ，Iₑ = Iₑ,入 sin²θ。'
    : '当前未放入检偏片，屏上光强等于晶体后的两个分量。';
  $('transcript-content').innerHTML = `
    <h2>${lesson.title}</h2>
    <p>${lesson.intro.replaceAll('\n','<br>')}</p>
    <h3>${lesson.heading}</h3>
    <p>${lesson.body}</p>
    <h3>试一试</h3>
    <p>${lesson.task.replaceAll('\n','<br>')}</p>
    <p>${lesson.caption}</p>
    <h3>${lesson.extraTitle}</h3>
    <p>${lesson.extra}</p>
    <h3>本页的光强关系</h3>
    <p class="formula">${sourceFormula}<br>${analyzerFormula}<br>θ 相对 o 光偏振方向；φ 也相对 o 光偏振方向。</p>
    <p>双像间距采用平行晶面、近轴入射模型：Δx = t · tan δ。e 光离散角由单轴晶体的折射率椭球计算；出射光与入射光平行。它不代替任意晶体形状与任意入射方向下的完整光线追迹。</p>
    <p class="current-reading"><strong>当前读数</strong><br>
      ${model.name}；nₒ = ${model.nO.toFixed(3)}，nₑ = ${model.nE.toFixed(3)}；e 光有效折射率约 ${model.effectiveE.toFixed(3)}。<br>
      晶体转角 ${state.crystal}°；厚度 ${state.thickness} mm；离散角 ${(model.walkoff / DEG).toFixed(2)}°；双像间距约 ${model.separation.toFixed(2)} mm。<br>
      ${state.axisAligned ? '正在沿光轴观察，双像重合。' : '当前为非光轴方向。'}检偏片${state.analyzer ? `已放入，θ = ${state.angle}°` : '未放入'}。<br>
      屏上 o 像 ${Math.round(model.o * 100)}%，e 像 ${Math.round(model.e * 100)}%（均相对总入射光强）。
    </p>`;
}

function updatePages() {
  for (const [mesh,side] of [[pageLeft,'left'],[pageRight,'right']]) {
    mesh.material.map.dispose();
    mesh.material.map = texture(paperCanvas(side));
    mesh.material.needsUpdate = true;
  }
}

function syncUI() {
  $('open-book').hidden = state.open;
  $('experiment').hidden = !state.open;
  $('previous').disabled = !state.open || state.page === 0;
  $('next').disabled = state.open && state.page === lessons.length - 1;
  $('next').setAttribute('aria-label',state.open ? '下一页' : '打开实验书');
  $('close-book').disabled = !state.open;
  $('page-title').textContent = state.open ? lessons[state.page].title : '一束光的两种旅程';
  $('page-count').textContent = state.open ? `${String(state.page+1).padStart(2,'0')} / ${String(lessons.length).padStart(2,'0')} · ${lessonKind() === 'calcite' ? '冰洲石实验' : '偏振基础'}` : '从光的本质到双折射';
  $('text-toggle').textContent = state.open ? '阅读本页' : '文字版';
  $('motion').setAttribute('aria-pressed',String(state.paused));
  $('motion').setAttribute('aria-label',state.paused ? '播放动画' : '暂停动画');
  $('motion-symbol').setAttribute('d',state.paused ? 'm8 5 11 7-11 7Z' : 'M9 6v12M15 6v12');
  document.querySelectorAll('[data-page]').forEach(button => {
    if (state.open && Number(button.dataset.page) === state.page) button.setAttribute('aria-current','page');
    else button.removeAttribute('aria-current');
  });
  $('announcement').textContent = state.open ? `第 ${state.page + 1} 页：${lessons[state.page].title}` : '实验书已合上';
  updateExperiment();
}

function resetLesson() {
  if (polarizationScene) {
    polarizationScene.rotation.x = 0;
    polarizationScene.rotation.y = POLARIZATION_DEFAULT_Y;
  }
  if (brewsterScene) {
    brewsterScene.rotation.x = 0;
    brewsterScene.rotation.y = BREWSTER_DEFAULT_Y;
  }
  state.waveLength = 550;
  state.waveAmplitude = 50;
  state.showB = true;
  state.phaseDiff = 0;
  state.ampX = 1;
  state.ampY = 1;
  state.brewsterAngle = 45;
  state.brewsterMedium = 'glass';
  state.analyzer = state.page === 5;
  state.crystal = 0;
  state.angle = 0;
  state.source = 'natural';
  state.sourceAngle = 45;
  state.wavelength = 589;
  state.thickness = 8;
  state.axisAligned = false;
  state.showRays = true;
  state.showAxis = true;
}

function openBook(page = initialPage) {
  state.open = true;
  state.page = page;
  foundationReveal = reducedMotion.matches ? 1 : 0;
  targetOpening = 1;
  resetLesson();
  $('advanced').open = page === 6;
  updatePages();
  syncUI();
  hideContents();
}

function goPage(page) {
  if (page < 0 || page >= lessons.length) return;
  if (!state.open) { openBook(page); return; }
  if (turnLeaf.children.length) {
    const old = turnLeaf.children[0];
    old.material.map.dispose(); old.material.dispose(); old.geometry.dispose();
    turnLeaf.remove(old);
  }
  printedSurface(plane(5.38,7.35,texture(paperCanvas('right')),2.73,0,0,turnLeaf));
  state.page = page;
  foundationReveal = reducedMotion.matches ? 1 : 0;
  resetLesson();
  $('advanced').open = page === 6;
  turn = reducedMotion.matches ? 0 : 1;
  updatePages();
  syncUI();
  hideContents();
}

function hideContents() {
  $('contents').hidden = true;
  $('contents-toggle').setAttribute('aria-expanded','false');
}

function setupScene() {
  renderer = new THREE.WebGLRenderer({ canvas: $('scene'), antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#cfc5b3');
  camera = new THREE.OrthographicCamera(-8,8,6,-6,.1,100);
  scene.add(new THREE.HemisphereLight('#fff8e5','#9e9f8e',1.6));
  const sun = new THREE.DirectionalLight('#fff6df',2.2);
  sun.position.set(-5,12,-5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left = -13; sun.shadow.camera.right = 13; sun.shadow.camera.top = 13; sun.shadow.camera.bottom = -13;
  sun.shadow.normalBias = .025; sun.shadow.bias = -.0003; sun.shadow.radius = 6;
  scene.add(sun);
  const wood = materialTexture('wood'); wood.repeat.set(3,3);
  plane(65,55,wood,0,-.25,0,scene);
  const mat = materialTexture('cloth'); mat.repeat.set(4,3);
  const pad = box(17,.06,12,new THREE.MeshStandardMaterial({ map: mat, roughness: 1 }),0,-.17,0,scene);
  pad.rotation.y = -.12;
  book = new THREE.Group();
  scene.add(book);
  const cloth = new THREE.MeshStandardMaterial({ map: materialTexture('cover'), roughness: .87 });
  const pages = new THREE.MeshStandardMaterial({ color: '#e5ddc9', roughness: 1 });
  box(5.65,.13,7.7,cloth,2.8,-.06,0);
  box(5.38,.27,7.35,pages,2.73,.12,0);
  leftHalf = new THREE.Group(); book.add(leftHalf);
  box(5.65,.13,7.7,cloth,-2.8,-.06,0,leftHalf);
  box(5.38,.27,7.35,pages,-2.73,.12,0,leftHalf);
  pageLeft = printedSurface(plane(5.38,7.35,texture(paperCanvas('left')),-2.73,.28,0,leftHalf));
  pageRight = printedSurface(plane(5.38,7.35,texture(paperCanvas('right')),2.73,.28,0));
  turnLeaf = new THREE.Group(); turnLeaf.position.y = .28; book.add(turnLeaf); turnLeaf.visible = false;
  for (let i = 0; i < 6; i++) {
    const y = .005 + i * .042;
    line([[.07,y,3.68],[5.42,y,3.68]],'#998b72',book,.3);
    line([[-5.42,y,3.68],[-.07,y,3.68]],'#998b72',leftHalf,.3);
  }
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,7.6,20),cloth);
  spine.rotation.x = Math.PI / 2; spine.position.y = .02; book.add(spine);
  cover = new THREE.Group(); cover.position.set(0,.34,0); book.add(cover);
  box(5.65,.13,7.7,cloth,2.8,.02,0,cover);
  printedSurface(plane(5.57,7.6,texture(coverCanvas()),2.8,.09,0,cover));
  const bookmark = new THREE.Mesh(new THREE.PlaneGeometry(.26,1.2),new THREE.MeshStandardMaterial({ color: '#903c2b', side: THREE.DoubleSide, roughness: 1 }));
  bookmark.rotation.x = -Math.PI / 2; bookmark.position.set(.18,.02,3.95); book.add(bookmark);
  wordCanvas = canvas(1000,800);
  wordTexture = texture(wordCanvas);
  wordPlane = printedSurface(plane(4.35,2.8,wordTexture,2.72,.30,.2));
  crystal = makeCrystal();
  analyzer = makeAnalyzer();
  foundation = makeFoundation();
  beamO = makeBeam('#3c91aa');
  beamE = makeBeam('#c15b37');
  axisGuide = makeAxisGuide();
  oLabel = makeLabel('o 光','#326f86');
  eLabel = makeLabel('e 光','#a3442e');
  photons = new THREE.Group();
  book.add(photons);
  for (let i = 0; i < 12; i++) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),new THREE.MeshBasicMaterial({ color: i % 2 ? '#d77847' : '#7bc0d0', transparent: true, opacity: .95, depthWrite: false, toneMapped: false }));
    dot.userData.progress = i / 12;
    photons.add(dot);
  }
  updateExperiment();
  resize();
}

function resize() {
  if (!renderer) return;
  mobile = innerWidth <= 700;
  renderer.setSize(innerWidth,innerHeight);
  const aspect = innerWidth / innerHeight;
  const width = mobile ? 7.3 : innerWidth < 1100 ? 16.8 : 16;
  camera.left = -width / 2; camera.right = width / 2;
  camera.top = width / aspect / 2; camera.bottom = -width / aspect / 2;
  camera.updateProjectionMatrix();
}

function pointOnPath(points, progress) {
  const split = .46;
  if (progress < split) return new THREE.Vector3().lerpVectors(points[0],points[1],progress / split);
  return new THREE.Vector3().lerpVectors(points[1],points[2],(progress - split) / (1 - split));
}

function render(time) {
  frame = requestAnimationFrame(render);
  const dt = Math.min((time-lastTime)/1000,.05);
  lastTime = time;
  if (document.hidden) return;
  if (motionPreference !== reducedMotion.matches) {
    motionPreference = reducedMotion.matches;
    state.paused = motionPreference;
    syncUI();
  }
  if (reducedMotion.matches) opening = targetOpening;
  else opening += (targetOpening-opening) * Math.min(dt*4.5,1);
  if (Math.abs(targetOpening-opening) < .001) opening = targetOpening;
  cover.rotation.z = opening * Math.PI;
  cover.position.y = .34 - .5 * opening;
  leftHalf.visible = opening > .02;
  const show = opening > .94;
  const model = opticsModel();
  const kind = lessonKind();
  const calciteShow = show && kind === 'calcite';
  foundation.visible = show && kind !== 'calcite';
  waveScene.visible = kind === 'wave';
  polarizationScene.visible = kind === 'polarization';
  brewsterScene.visible = kind === 'brewster';
  wordPlane.visible = calciteShow;
  crystal.visible = calciteShow;
  analyzer.visible = calciteShow && state.analyzer;
  axisGuide.visible = calciteShow && state.showAxis;
  beamO.visible = calciteShow && state.showRays && (state.axisAligned ? model.o + model.e : model.o) > .002;
  beamE.visible = calciteShow && state.showRays && !state.axisAligned && model.e > .002;
  photons.visible = calciteShow && state.showRays;
  oLabel.visible = calciteShow && state.showRays;
  eLabel.visible = calciteShow && state.showRays && !state.axisAligned;
  if (!state.paused && kind !== 'calcite') waveClock += dt;
  if (foundation.visible) {
    foundationReveal = reducedMotion.matches ? 1 : Math.min(1,foundationReveal + dt * 1.65);
    const lift = 1 - (1 - foundationReveal) ** 3;
    foundation.scale.y = Math.max(.001,lift);
    if (foundationDirty || (!state.paused && time - lastFoundationUpdate >= 32)) {
      updateFoundationGeometry();
      foundationDirty = false;
      lastFoundationUpdate = time;
    }
  }
  const sceneCursor = show && (kind === 'polarization' || kind === 'brewster') ? (polarizationDragging ? 'grabbing' : 'grab') : 'default';
  if ($('scene').style.cursor !== sceneCursor) $('scene').style.cursor = sceneCursor;
  turn = Math.max(0,turn-dt*2);
  turnLeaf.visible = turn > 0 && show;
  turnLeaf.rotation.z = (1-turn) * Math.PI;
  const targetX = mobile ? 2.7 : 2.7 * (1-opening) + .65 * opening;
  const targetZ = mobile ? (state.open ? 1.1 : -.25) : 0;
  camera.position.set(targetX + (1-opening)*7 + .6*opening,14 + opening*3,10.8 - opening*2);
  camera.lookAt(targetX,0,targetZ);
  book.rotation.y = -.12 * (1-opening);
  if (!state.paused && photonPaths.o.length) {
    photons.children.forEach((dot,i) => {
      dot.userData.progress = (dot.userData.progress + dt * .18) % 1;
      const ordinary = i % 2 === 0;
      const intensity = ordinary ? model.o : model.e;
      dot.visible = intensity > .01 && (ordinary || !state.axisAligned);
      dot.material.opacity = Math.min(1,intensity * 2);
      dot.position.copy(pointOnPath(ordinary ? photonPaths.o : photonPaths.e,dot.userData.progress));
    });
  }
  renderer.render(scene,camera);
}

function bindEvents() {
  $('open-book').onclick = () => openBook();
  $('next').onclick = () => state.open ? goPage(state.page+1) : openBook();
  $('previous').onclick = () => goPage(state.page-1);
  $('close-book').onclick = () => { state.open = false; targetOpening = 0; syncUI(); hideContents(); };
  $('contents-toggle').onclick = () => {
    const hidden = !$('contents').hidden;
    $('contents').hidden = hidden;
    $('contents-toggle').setAttribute('aria-expanded',String(!hidden));
  };
  document.querySelectorAll('[data-page]').forEach(button => button.onclick = () => goPage(Number(button.dataset.page)));
  $('wave-length').oninput = event => { state.waveLength = Number(event.target.value); updateExperiment(); };
  $('wave-amplitude').oninput = event => { state.waveAmplitude = Number(event.target.value); updateExperiment(); };
  $('show-b').onchange = event => { state.showB = event.target.checked; updateExperiment(); };
  $('phase-diff').oninput = event => { state.phaseDiff = Number(event.target.value); updateExperiment(); };
  $('amp-x').oninput = event => { state.ampX = Number(event.target.value); updateExperiment(); };
  $('amp-y').oninput = event => { state.ampY = Number(event.target.value); updateExperiment(); };
  document.querySelectorAll('[data-polarization]').forEach(button => button.onclick = () => {
    const preset = polarizationPresets[button.dataset.polarization];
    state.phaseDiff = preset.phase;
    state.ampX = preset.x;
    state.ampY = preset.y;
    updateExperiment();
  });
  $('brewster-angle').oninput = event => { state.brewsterAngle = Number(event.target.value); updateExperiment(); };
  $('brewster-medium').onchange = event => { state.brewsterMedium = event.target.value; updateExperiment(); };
  $('brewster-set').onclick = () => { state.brewsterAngle = brewsterModel().thetaB / DEG; updateExperiment(); };
  document.querySelectorAll('[data-brewster-angle]').forEach(button => button.onclick = () => {
    state.brewsterAngle = Number(button.dataset.brewsterAngle);
    updateExperiment();
  });
  $('crystal-angle').oninput = event => { state.crystal = Number(event.target.value); updateExperiment(); };
  $('analyzer-angle').oninput = event => { state.angle = Number(event.target.value); updateExperiment(); };
  $('source-angle').oninput = event => { state.sourceAngle = Number(event.target.value); updateExperiment(); };
  $('thickness').oninput = event => { state.thickness = Number(event.target.value); updateExperiment(); };
  $('analyzer').onchange = event => { state.analyzer = event.target.checked; updateExperiment(); };
  $('wavelength').onchange = event => { state.wavelength = Number(event.target.value); updateExperiment(); };
  $('source').onchange = event => { state.source = event.target.value; updateExperiment(); };
  $('show-rays').onchange = event => { state.showRays = event.target.checked; updateExperiment(); };
  $('show-axis').onchange = event => { state.showAxis = event.target.checked; updateExperiment(); };
  $('axis-mode').onclick = () => { state.axisAligned = !state.axisAligned; updateExperiment(); };
  document.querySelectorAll('[data-angle]').forEach(button => button.onclick = () => { state.angle = Number(button.dataset.angle); updateExperiment(); });
  $('reset').onclick = () => { resetLesson(); syncUI(); };
  $('panel-toggle').onclick = () => {
    const collapsed = $('experiment').classList.toggle('is-collapsed');
    $('panel-toggle').textContent = collapsed ? '展开' : '收起';
    $('panel-toggle').setAttribute('aria-expanded',String(!collapsed));
    $('panel-toggle').setAttribute('aria-label',collapsed ? '展开实验控制' : '收起实验控制');
  };
  $('motion').onclick = () => { state.paused = !state.paused; syncUI(); };
  function showText(show) {
    $('transcript').hidden = !show;
    $('text-toggle').setAttribute('aria-expanded',String(show));
    if (show) $('text-close').focus();
    else $('text-toggle').focus();
  }
  $('text-toggle').onclick = () => showText($('transcript').hidden);
  $('text-close').onclick = () => showText(false);
  document.addEventListener('keydown',event => {
    if (event.key === 'Escape') {
      if (!$('transcript').hidden) showText(false);
      hideContents();
      return;
    }
    if (event.target.matches('input,button,select,summary') || !$('transcript').hidden) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); state.open ? goPage(state.page+1) : openBook(); }
    if (event.key === 'ArrowLeft' && state.open) { event.preventDefault(); goPage(state.page-1); }
  });
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  let drag = null;
  $('scene').addEventListener('pointerdown',event => {
    if (!state.open || opening < .94) return;
    if (lessonKind() === 'polarization' || lessonKind() === 'brewster') {
      const orbitScene = lessonKind() === 'polarization' ? polarizationScene : brewsterScene;
      drag = {
        type: 'polarization', scene: orbitScene, x: event.clientX, y: event.clientY,
        rotationX: orbitScene.rotation.x, rotationY: orbitScene.rotation.y,
      };
      polarizationDragging = true;
      $('scene').setPointerCapture(event.pointerId);
      return;
    }
    if (lessonKind() !== 'calcite') return;
    pointer.set(event.clientX/innerWidth*2-1,-event.clientY/innerHeight*2+1);
    raycaster.setFromCamera(pointer,camera);
    if (!raycaster.intersectObject(crystal,true).length) return;
    drag = { type: 'crystal', x: event.clientX, angle: state.crystal };
    $('scene').setPointerCapture(event.pointerId);
  });
  $('scene').addEventListener('pointermove',event => {
    if (!drag) return;
    if (drag.type === 'polarization') {
      drag.scene.rotation.y = drag.rotationY + (event.clientX - drag.x) * .006;
      drag.scene.rotation.x = Math.max(-.42,Math.min(.42,drag.rotationX + (event.clientY - drag.y) * .004));
      return;
    }
    state.crystal = Math.round(((drag.angle + (event.clientX-drag.x)*.6) % 180 + 180) % 180);
    updateExperiment();
  });
  const endDrag = () => { drag = null; polarizationDragging = false; };
  $('scene').addEventListener('pointerup',endDrag);
  $('scene').addEventListener('pointercancel',endDrag);
  $('scene').addEventListener('lostpointercapture',endDrag);
  window.addEventListener('resize',resize);
  $('scene').addEventListener('webglcontextlost',event => {
    event.preventDefault();
    cancelAnimationFrame(frame);
    $('loading').hidden = false;
    $('loading').textContent = '3D 显示已中断，可点击右上角阅读文字版。';
  });
  window.addEventListener('pagehide',() => { cancelAnimationFrame(frame); frame = 0; });
  window.addEventListener('pageshow',() => { if (!frame) { lastTime = performance.now(); frame = requestAnimationFrame(render); } });
}

async function init() {
  try {
    await document.fonts.load('32px BookSerif');
    setupScene();
    bindEvents();
    syncUI();
    $('loading').hidden = true;
    requestAnimationFrame(render);
  } catch (error) {
    $('loading').textContent = '浏览器未能启动 3D 显示，仍可阅读实验文字版。';
    $('open-book').hidden = true;
    $('next').disabled = true;
    $('motion').disabled = true;
    $('contents-toggle').disabled = true;
    updateTranscript();
    $('transcript').hidden = false;
    $('text-toggle').setAttribute('aria-expanded','true');
    $('text-close').onclick = () => { $('transcript').hidden = true; $('text-toggle').setAttribute('aria-expanded','false'); };
    $('text-toggle').onclick = () => {
      $('transcript').hidden = !$('transcript').hidden;
      $('text-toggle').setAttribute('aria-expanded',String(!$('transcript').hidden));
    };
    console.error('Calcite preview initialization failed:',error);
  }
}

init();
