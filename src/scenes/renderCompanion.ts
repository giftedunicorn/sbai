import Phaser from 'phaser';

export type TargetMood = 'idle' | 'dazed' | 'panic';

export interface CompanionActors {
  companion: Phaser.GameObjects.Container;
  target: Phaser.GameObjects.Container;
  targetFace: Phaser.GameObjects.Graphics;
  companionHome: Phaser.Math.Vector2;
  targetHome: Phaser.Math.Vector2;
}

const INK = 0x263f39;
const INK_DEEP = 0x142d29;
const MINT = 0x77a99c;
const FIELD = 0x8dbab0;
const CREAM = 0xf4e7bd;
const TOMATO = 0xe76f51;

function drawTargetFace(face: Phaser.GameObjects.Graphics, mood: TargetMood): void {
  face.clear();
  face.fillStyle(INK_DEEP, 1);
  if (mood === 'dazed') {
    face.fillRect(-21, -5, 13, 4);
    face.fillRect(-17, -9, 4, 13);
    face.fillRect(8, -5, 13, 4);
    face.fillRect(13, -9, 4, 13);
    face.fillRect(-8, 12, 16, 4);
    return;
  }
  if (mood === 'panic') {
    face.fillRect(-22, -9, 8, 12);
    face.fillRect(14, -9, 8, 12);
    face.fillRect(-10, 10, 20, 5);
    face.fillRect(-6, 6, 12, 13);
    face.fillStyle(MINT, 1);
    face.fillRect(-2, 10, 4, 5);
    return;
  }
  face.fillRect(-22, -5, 10, 5);
  face.fillRect(12, -5, 10, 5);
  face.fillRect(-10, 12, 20, 4);
}

function createTarget(scene: Phaser.Scene, x: number, y: number) {
  const root = scene.add.container(x, y);
  const body = scene.add.graphics();
  body.fillStyle(INK_DEEP, 0.22);
  body.fillRect(-42, 61, 92, 11);

  body.fillStyle(INK, 1);
  body.fillRect(-38, 32, 18, 34);
  body.fillRect(20, 32, 18, 34);
  body.fillRect(-48, 63, 33, 11);
  body.fillRect(15, 63, 33, 11);

  body.fillStyle(CREAM, 1);
  body.fillRect(-47, -12, 94, 64);
  body.fillStyle(INK, 1);
  body.fillRect(-47, -12, 94, 7);
  body.fillRect(-47, 45, 94, 7);
  body.fillRect(-47, -5, 7, 50);
  body.fillRect(40, -5, 7, 50);
  body.fillStyle(FIELD, 1);
  body.fillRect(-33, 1, 66, 35);

  body.fillStyle(INK_DEEP, 1);
  body.fillRect(-5, -28, 10, 16);
  body.fillRect(-18, -34, 36, 7);
  body.fillStyle(TOMATO, 1);
  body.fillRect(21, -9, 12, 7);

  const face = scene.add.graphics();
  face.setPosition(0, 17);
  drawTargetFace(face, 'idle');
  root.add([body, face]);
  root.setSize(110, 120);
  scene.physics.add.existing(root);
  const physicsBody = root.body as Phaser.Physics.Arcade.Body;
  physicsBody.setAllowGravity(false);
  physicsBody.setCollideWorldBounds(true, 0.65, 0.65);
  physicsBody.setDrag(500, 500);
  physicsBody.setMaxVelocity(520, 420);
  physicsBody.setSize(94, 108);
  physicsBody.setOffset(-47, -34);
  return { root, face };
}

function createSidekick(scene: Phaser.Scene, x: number, y: number) {
  const root = scene.add.container(x, y);
  const body = scene.add.graphics();
  body.fillStyle(INK_DEEP, 0.22);
  body.fillRect(-35, 61, 78, 10);

  body.fillStyle(INK, 1);
  body.fillRect(-30, 35, 21, 32);
  body.fillRect(10, 35, 21, 32);
  body.fillRect(-37, 63, 32, 10);
  body.fillRect(5, 63, 32, 10);

  body.fillStyle(TOMATO, 1);
  body.fillRect(-39, -3, 78, 50);
  body.fillStyle(INK, 1);
  body.fillRect(-39, 40, 78, 7);
  body.fillRect(-39, -3, 7, 50);
  body.fillRect(32, -3, 7, 50);
  body.fillRect(-4, -3, 8, 50);

  body.fillStyle(CREAM, 1);
  body.fillRect(-30, -42, 60, 39);
  body.fillStyle(INK_DEEP, 1);
  body.fillRect(-34, -49, 68, 13);
  body.fillRect(-34, -42, 9, 18);
  body.fillRect(-22, -25, 9, 5);
  body.fillRect(13, -25, 9, 5);
  body.fillRect(-12, -12, 24, 5);

  body.fillStyle(TOMATO, 1);
  body.fillRect(34, 2, 25, 21);
  body.fillStyle(INK, 1);
  body.fillRect(34, 2, 25, 6);
  body.fillRect(34, 17, 25, 6);
  body.fillRect(53, 8, 6, 9);

  root.add(body);
  root.setSize(100, 125);
  return root;
}

export function createCompanionActors(
  scene: Phaser.Scene,
  width: number,
  height: number,
): CompanionActors {
  const floorY = Math.max(160, height - 72);
  const companionHome = new Phaser.Math.Vector2(width * 0.25, floorY);
  const targetHome = new Phaser.Math.Vector2(width * 0.7, floorY);
  const target = createTarget(scene, targetHome.x, targetHome.y);
  const companion = createSidekick(scene, companionHome.x, companionHome.y);
  return {
    companion,
    target: target.root,
    targetFace: target.face,
    companionHome,
    targetHome,
  };
}

export function setTargetMood(parts: CompanionActors, mood: TargetMood): void {
  drawTargetFace(parts.targetFace, mood);
}
