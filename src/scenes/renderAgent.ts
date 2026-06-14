import Phaser from 'phaser';
import type { AgentExpression } from '../game/types';

export interface AgentParts {
  root: Phaser.GameObjects.Container;
  faceText: Phaser.GameObjects.Text;
  body: Phaser.GameObjects.Graphics;
}

const FACE_BY_EXPRESSION: Record<AgentExpression, string> = {
  dazed: '@_@',
  spinner: '◌_◌',
  'blank-confidence': '0_0',
  'fake-smile': '^_^',
  panic: '!_!',
};

export function createAgentDoll(scene: Phaser.Scene, x: number, y: number): AgentParts {
  const root = scene.add.container(x, y);
  const body = scene.add.graphics();

  body.lineStyle(6, 0x08090d, 1);
  body.fillStyle(0x7c86ff, 1);
  body.fillRoundedRect(-58, -8, 116, 118, 28);
  body.strokeRoundedRect(-58, -8, 116, 118, 28);

  body.fillStyle(0x9aa4ff, 1);
  body.fillRoundedRect(-92, 0, 34, 92, 17);
  body.strokeRoundedRect(-92, 0, 34, 92, 17);
  body.fillRoundedRect(58, 0, 34, 92, 17);
  body.strokeRoundedRect(58, 0, 34, 92, 17);

  body.fillStyle(0x606cff, 1);
  body.fillRoundedRect(-44, 98, 36, 66, 18);
  body.strokeRoundedRect(-44, 98, 36, 66, 18);
  body.fillRoundedRect(8, 98, 36, 66, 18);
  body.strokeRoundedRect(8, 98, 36, 66, 18);

  body.fillStyle(0xf3f6ff, 1);
  body.fillRoundedRect(-55, -88, 110, 78, 22);
  body.strokeRoundedRect(-55, -88, 110, 78, 22);

  body.lineStyle(5, 0xe8edff, 1);
  body.strokeCircle(0, -122, 32);
  body.lineStyle(5, 0x7c86ff, 1);
  body.beginPath();
  body.arc(0, -122, 32, Phaser.Math.DegToRad(260), Phaser.Math.DegToRad(20));
  body.strokePath();

  const faceText = scene.add
    .text(0, -49, FACE_BY_EXPRESSION['blank-confidence'], {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: '22px',
      color: '#08090d',
      fontStyle: '900',
    })
    .setOrigin(0.5);

  root.add([body, faceText]);
  root.setSize(190, 260);
  scene.physics.add.existing(root);

  const physicsBody = root.body as Phaser.Physics.Arcade.Body;
  physicsBody.setCollideWorldBounds(true, 0.8, 0.8);
  physicsBody.setSize(130, 220);
  physicsBody.setOffset(-65, -100);

  return { root, faceText, body };
}

export function setAgentExpression(parts: AgentParts, expression: AgentExpression): void {
  parts.faceText.setText(FACE_BY_EXPRESSION[expression]);
}
