import Phaser from 'phaser';
import './style.css';
import { StressSandboxScene } from './scenes/StressSandboxScene';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app mount node');
}

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
