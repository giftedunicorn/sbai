import Phaser from 'phaser';
import type { AgentExpression } from '../game/types';

export interface AgentParts {
  root: Phaser.GameObjects.Container;
  faceText: Phaser.GameObjects.Text;
  body: Phaser.GameObjects.Graphics;
}

const FACE_BY_EXPRESSION: Record<AgentExpression, string> = {
  dazed: 'x  x',
  spinner: '@  @',
  'blank-confidence': '-  -',
  'fake-smile': '^  ^',
  panic: 'o  o',
};

export function createAgentDoll(scene: Phaser.Scene, x: number, y: number): AgentParts {
  const root = scene.add.container(x, y);
  const body = scene.add.graphics();

  body.lineStyle(6, 0x08090d, 1);

  body.fillStyle(0xf1b884, 1);
  body.fillEllipse(-61, -59, 20, 30);
  body.strokeEllipse(-61, -59, 20, 30);
  body.fillEllipse(61, -59, 20, 30);
  body.strokeEllipse(61, -59, 20, 30);

  body.fillStyle(0xf2c196, 1);
  body.fillRoundedRect(-16, -18, 32, 28, 12);
  body.strokeRoundedRect(-16, -18, 32, 28, 12);

  body.fillStyle(0xf2c196, 1);
  body.fillRoundedRect(-52, -108, 104, 92, 32);
  body.strokeRoundedRect(-52, -108, 104, 92, 32);

  body.fillStyle(0x2f221a, 1);
  body.fillRoundedRect(-49, -115, 98, 38, 21);
  body.strokeRoundedRect(-49, -115, 98, 38, 21);
  body.fillTriangle(-50, -83, -28, -113, -8, -83);
  body.fillTriangle(-20, -86, 4, -116, 24, -85);
  body.fillTriangle(18, -86, 40, -111, 51, -84);

  body.lineStyle(4, 0x08090d, 1);
  body.beginPath();
  body.moveTo(-5, -68);
  body.lineTo(-12, -48);
  body.lineTo(0, -45);
  body.strokePath();
  body.beginPath();
  body.arc(0, -35, 12, Phaser.Math.DegToRad(15), Phaser.Math.DegToRad(165));
  body.strokePath();

  body.lineStyle(6, 0x08090d, 1);
  body.fillStyle(0x364152, 1);
  body.fillRoundedRect(-66, -2, 132, 120, 25);
  body.strokeRoundedRect(-66, -2, 132, 120, 25);
  body.lineStyle(4, 0x9fb0c8, 1);
  body.beginPath();
  body.moveTo(-23, 0);
  body.lineTo(0, 26);
  body.lineTo(23, 0);
  body.strokePath();
  body.lineStyle(5, 0x08090d, 1);

  body.fillStyle(0x4f6280, 1);
  body.fillRoundedRect(-98, 4, 34, 92, 17);
  body.strokeRoundedRect(-98, 4, 34, 92, 17);
  body.fillRoundedRect(64, 4, 34, 92, 17);
  body.strokeRoundedRect(64, 4, 34, 92, 17);

  body.fillStyle(0xf2c196, 1);
  body.fillCircle(-81, 102, 17);
  body.strokeCircle(-81, 102, 17);
  body.fillCircle(81, 102, 17);
  body.strokeCircle(81, 102, 17);

  body.fillStyle(0x252a35, 1);
  body.fillRoundedRect(-45, 105, 34, 64, 15);
  body.strokeRoundedRect(-45, 105, 34, 64, 15);
  body.fillRoundedRect(11, 105, 34, 64, 15);
  body.strokeRoundedRect(11, 105, 34, 64, 15);

  body.fillStyle(0x10131a, 1);
  body.fillRoundedRect(-54, 157, 48, 18, 9);
  body.strokeRoundedRect(-54, 157, 48, 18, 9);
  body.fillRoundedRect(6, 157, 48, 18, 9);
  body.strokeRoundedRect(6, 157, 48, 18, 9);

  body.lineStyle(5, 0xe8edff, 1);
  body.strokeCircle(0, -143, 30);
  body.lineStyle(5, 0x9fb0c8, 1);
  body.beginPath();
  body.arc(0, -143, 30, Phaser.Math.DegToRad(260), Phaser.Math.DegToRad(20));
  body.strokePath();

  const faceText = scene.add
    .text(0, -66, FACE_BY_EXPRESSION['blank-confidence'], {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: '20px',
      color: '#08090d',
      fontStyle: '900',
    })
    .setOrigin(0.5);

  root.add([body, faceText]);
  root.setSize(190, 260);
  scene.physics.add.existing(root);

  const physicsBody = root.body as Phaser.Physics.Arcade.Body;
  physicsBody.setCollideWorldBounds(true, 0.8, 0.8);
  physicsBody.setAllowGravity(false);
  physicsBody.setDrag(320, 320);
  physicsBody.setBounce(0.7, 0.7);
  physicsBody.setMaxVelocity(620, 520);
  physicsBody.setSize(130, 220);
  physicsBody.setOffset(-65, -100);

  return { root, faceText, body };
}

export function setAgentExpression(parts: AgentParts, expression: AgentExpression): void {
  parts.faceText.setText(FACE_BY_EXPRESSION[expression]);
}
