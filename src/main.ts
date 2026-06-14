import Phaser from 'phaser';
import './style.css';
import { BOXING_GLOVE_CURSOR } from './game/cursor';
import { StressSandboxScene } from './scenes/StressSandboxScene';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app mount node');
}

document.documentElement.style.setProperty('--boxing-glove-cursor', BOXING_GLOVE_CURSOR);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: app,
  backgroundColor: '#15171d',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 420 },
      debug: false,
    },
  },
  scene: [StressSandboxScene],
};

new Phaser.Game(config);
