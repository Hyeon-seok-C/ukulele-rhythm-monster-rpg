import { WORLDS } from './data.js';

/** 모험 지도 전체 배경 (스테이지 1~5 일러스트) */
export const ADVENTURE_MAP_BG = 'assets/backgrounds/adventure_map_bg.png';

/** @type {Record<number, { scene: string, label: string, labelEn: string, bg: string, mapIcon: string, desc: string, monsters: string[] }>} */
export const WORLD_SCENES = {
  1: {
    scene: 'scene-forest',
    label: '숲의 리듬',
    labelEn: 'Rhythm of the Forest',
    bg: 'assets/backgrounds/world1_forest_bg.png',
    mapIcon: 'assets/backgrounds/forest_stage_icon.png',
    desc: '푸른 숲. 슬라임부터 리듬 토끼까지, 보스는 비트 베어.',
    monsters: ['슬라임', '아기 슬라임', '버섯몬', '숲 고블린', '리듬 토끼', '보스: 비트 베어'],
  },
  2: {
    scene: 'scene-cave',
    label: '동굴의 박자',
    labelEn: 'Beat of the Cave',
    bg: 'assets/backgrounds/world_02_cave_bg.png',
    mapIcon: 'assets/backgrounds/cave_stage_icon.png',
    desc: '수정 동굴. 박쥐·해골 병사 후 보스 동굴 오크.',
    monsters: ['박쥐', '수정게', '해골 병사', '수정골렘', '지휘자박쥐', '보스: 동굴 오크'],
  },
  3: {
    scene: 'scene-volcano',
    label: '화산의 스트림',
    labelEn: 'Stream of the Volcano',
    bg: 'assets/backgrounds/world_03_volcano_bg.png',
    mapIcon: 'assets/backgrounds/volcano_stage_icon.png',
    desc: '붉은 화산. 화염 정령 다음 보스 비트 피닉스.',
    monsters: ['불도마뱀', '화염 정령', '용암게', '마그마골렘', '보스: 비트 피닉스'],
  },
  4: {
    scene: 'scene-dark-cave',
    label: '어둠의 동굴',
    labelEn: 'Cave of Darkness',
    bg: 'assets/backgrounds/world_04_darktempo_bg.png',
    mapIcon: 'assets/backgrounds/dark_stage_icon.png',
    desc: '깊은 어둠의 동굴. 암흑 마법사·그림자 도적·어둠의 어릿광대·데스 나이트, 보스 템포 로드.',
    monsters: ['암흑 마법사', '그림자 도적', '어둠의 어릿광대', '데스 나이트', '보스: 템포 로드'],
  },
  5: {
    scene: 'scene-kingdom',
    label: '메트로놈 왕국',
    labelEn: 'Kingdom of Metronome',
    bg: 'assets/backgrounds/world_05_metronome_castle_bg.png',
    mapIcon: 'assets/backgrounds/metronome_castle_icon.png',
    desc: '황금 왕국. 메트론·비트 가디언·리듬 골렘, 보스 크로노 드래곤, 최종 보스 메트로놈 킹.',
    monsters: ['메트론', '비트 가디언', '리듬 골렘', '보스: 크로노 드래곤', '최종보스: 메트로놈 킹'],
  },
};

export function getWorldScene(worldId) {
  const scene = WORLD_SCENES[worldId] ?? WORLD_SCENES[1];
  const world = WORLDS.find((w) => w.id === worldId);
  return {
    ...scene,
    desc: world?.desc ?? scene.desc,
  };
}

/** 2인 대결 전용 — 몬스터·월드와 무관한 무대 */
export const DUEL_SCENE = {
  scene: 'scene-duel',
  label: '리듬 대결장',
  labelEn: 'Rhythm Duel Arena',
  bg: 'assets/backgrounds/duel-arena.svg',
  desc: '드럼 소년 vs 피아노 소년 — 리듬으로 승부!',
};

export function getDuelScene() {
  return DUEL_SCENE;
}
