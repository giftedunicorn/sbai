import Phaser from 'phaser';

import { createInitialAgentState, registerHit } from '../game/agentState';
import { createRandom } from '../game/random';
import type { AgentState } from '../game/agentState';
import type { CatharsisEvent, Evidence } from '../shared/companion';
import {
  createCompanionActors,
  setTargetMood,
  type CompanionActors,
} from './renderCompanion';

export const CATHARSIS_EVENT = 'companion:catharsis';
export const STOP_EVENT = 'companion:stop';
export const PERFORMANCE_END_EVENT = 'companion:performance-end';

const INK = 0x263f39;
const INK_DEEP = 0x142d29;
const MINT = 0x77a99c;
const FIELD = 0x8dbab0;
const CREAM = 0xf4e7bd;
const TOMATO = 0xe76f51;

const IMPACT_WORDS = ['啪!', '砰!', '收声!', '重来!'] as const;

function evidenceCaption(evidence: Evidence | undefined): string {
  if (!evidence) return '证据不足，只替主人出气，不乱编罪状。';
  if (evidence.kind === 'file-edit') {
    const fileName = evidence.value.split(/[\\/]/).filter(Boolean).at(-1) ?? '某个文件';
    return `看到它动过文件: ${fileName}`;
  }
  const compact = evidence.value.replace(/\s+/g, ' ').trim();
  const bounded = compact.length > 54 ? `${compact.slice(0, 53)}…` : compact;
  return evidence.kind === 'test-failure'
    ? `看到测试失败: ${bounded}`
    : `看到工具失败: ${bounded}`;
}

export class CompanionScene extends Phaser.Scene {
  private actors!: CompanionActors;
  private background!: Phaser.GameObjects.Graphics;
  private state: AgentState = createInitialAgentState();
  private readonly random = createRandom();
  private statusText!: Phaser.GameObjects.Text;
  private roastText!: Phaser.GameObjects.Text;
  private evidenceText!: Phaser.GameObjects.Text;
  private activeEvent: CatharsisEvent | null = null;
  private performanceTimer?: Phaser.Time.TimerEvent;
  private scheduledHits: Phaser.Time.TimerEvent[] = [];
  private readonly transient = new Set<Phaser.GameObjects.GameObject>();
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor() {
    super('companion');
  }

  create(): void {
    const { width, height } = this.scale;
    this.physics.world.setBounds(0, 0, width, height);
    this.background = this.add.graphics().setDepth(-10);
    this.drawStage(width, height);
    this.actors = createCompanionActors(this, width, height);
    this.actors.target.setInteractive(
      new Phaser.Geom.Rectangle(-55, -45, 110, 125),
      Phaser.Geom.Rectangle.Contains,
    );
    this.actors.target.on('pointerdown', () => {
      if (this.activeEvent) this.performHit(this.forceFor(this.activeEvent));
    });

    this.statusText = this.add.text(14, 12, '打手待命 / COMBO 0', {
      fontFamily: 'SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '12px',
      color: '#142d29',
      fontStyle: 'bold',
    });
    this.roastText = this.add.text(width / 2, 39, '主人点名，我就上。', {
      fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
      fontSize: '17px',
      color: '#142d29',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: Math.max(240, width - 38) },
      lineSpacing: 3,
    }).setOrigin(0.5, 0);
    this.evidenceText = this.add.text(width / 2, height - 27, '只读观察，不碰任务', {
      fontFamily: 'SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '10px',
      color: '#263f39',
      align: 'center',
      wordWrap: { width: Math.max(240, width - 34) },
    }).setOrigin(0.5, 1);

    this.game.events.on(CATHARSIS_EVENT, this.handleCatharsis, this);
    this.game.events.on(STOP_EVENT, this.handleStop, this);
    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  private readonly handleCatharsis = (event: CatharsisEvent): void => {
    this.stopPerformance(false);
    this.activeEvent = event;
    this.state = createInitialAgentState();
    this.roastText.setText(event.roast);
    this.evidenceText.setText(evidenceCaption(event.evidence[0]));
    setTargetMood(this.actors, event.intensity === 'furious' ? 'panic' : 'dazed');

    const hitCount = event.animation === 'poke' ? 1 : event.animation === 'slap-combo' ? 3 : 6;
    for (let index = 0; index < hitCount; index += 1) {
      this.scheduledHits.push(
        this.time.delayedCall(index * 150, () => this.performHit(this.forceFor(event))),
      );
    }
    this.performanceTimer = this.time.delayedCall(10_000, () => this.stopPerformance());
  };

  private readonly handleStop = (): void => this.stopPerformance();

  private forceFor(event: CatharsisEvent): number {
    return event.animation === 'poke' ? 0.55 : event.animation === 'slap-combo' ? 0.9 : 1.25;
  }

  private performHit(forceScale: number): void {
    this.state = registerHit(this.state);
    const targetBody = this.actors.target.body as Phaser.Physics.Arcade.Body;
    const direction = this.actors.target.x >= this.actors.companion.x ? 1 : -1;
    const comboBoost = Math.min(this.state.combo, 12);
    const horizontalForce = 220 + comboBoost * 18 + this.random.integer(90);
    const verticalForce = -(260 + comboBoost * 12 + this.random.integer(80));

    if (!this.reducedMotion) {
      targetBody.setVelocity(
        direction * horizontalForce * forceScale,
        verticalForce * forceScale,
      );
      targetBody.setAngularVelocity(direction * 130 * forceScale);
      this.cameras.main.shake(70, Math.min(0.014, 0.004 + forceScale * 0.005));
      this.tweens.add({
        targets: this.actors.companion,
        x: this.actors.target.x - direction * 72,
        duration: 65,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
      this.tweens.add({
        targets: this.actors.target,
        scaleX: 1.13,
        scaleY: 0.87,
        duration: 70,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    }

    setTargetMood(this.actors, this.state.combo % 3 === 0 ? 'panic' : 'dazed');
    this.statusText.setText(`打手出击 / COMBO ${this.state.combo}`);
    this.spawnImpact(this.actors.target.x, this.actors.target.y - 35);
    this.spawnParticles(forceScale);
  }

  private spawnImpact(x: number, y: number): void {
    const label = this.add.text(x, y, IMPACT_WORDS[this.state.combo % IMPACT_WORDS.length], {
      fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
      fontSize: '24px',
      color: '#e76f51',
      stroke: '#142d29',
      strokeThickness: 5,
      fontStyle: 'bold',
    }).setOrigin(0.5).setAngle(Phaser.Math.Between(-8, 8));
    this.transient.add(label);
    this.tweens.add({
      targets: label,
      y: y - 35,
      alpha: 0,
      duration: this.reducedMotion ? 1 : 460,
      onComplete: () => {
        this.transient.delete(label);
        label.destroy();
      },
    });
  }

  private spawnParticles(forceScale: number): void {
    const amount = this.reducedMotion ? 2 : Math.round(5 + forceScale * 5);
    for (let index = 0; index < amount; index += 1) {
      const chip = this.add.rectangle(
        this.actors.target.x,
        this.actors.target.y - 20,
        6,
        6,
        index % 2 === 0 ? TOMATO : CREAM,
      );
      this.transient.add(chip);
      this.tweens.add({
        targets: chip,
        x: chip.x + Phaser.Math.Between(-80, 80),
        y: chip.y + Phaser.Math.Between(-70, 35),
        angle: Phaser.Math.Between(-120, 120),
        alpha: 0,
        duration: this.reducedMotion ? 1 : Phaser.Math.Between(320, 560),
        onComplete: () => {
          this.transient.delete(chip);
          chip.destroy();
        },
      });
    }
  }

  private stopPerformance(emitEnd = true): void {
    const hadActiveEvent = this.activeEvent !== null;
    this.performanceTimer?.remove(false);
    this.performanceTimer = undefined;
    for (const timer of this.scheduledHits) timer.remove(false);
    this.scheduledHits = [];
    if (!this.actors) return;

    this.tweens.killTweensOf(this.actors.target);
    this.tweens.killTweensOf(this.actors.companion);
    const targetBody = this.actors.target.body as Phaser.Physics.Arcade.Body;
    targetBody.setVelocity(0, 0);
    targetBody.setAngularVelocity(0);
    this.actors.target.setPosition(this.actors.targetHome.x, this.actors.targetHome.y);
    this.actors.target.setAngle(0).setScale(1);
    this.actors.companion.setPosition(
      this.actors.companionHome.x,
      this.actors.companionHome.y,
    );
    setTargetMood(this.actors, 'idle');
    for (const object of this.transient) object.destroy();
    this.transient.clear();
    this.cameras.main.resetFX();
    this.activeEvent = null;
    this.state = createInitialAgentState();
    this.statusText?.setText('打手待命 / COMBO 0');
    this.roastText?.setText('主人点名，我就上。');
    this.evidenceText?.setText('只读观察，不碰任务');
    if (emitEnd && hadActiveEvent) this.game.events.emit(PERFORMANCE_END_EVENT);
  }

  private drawStage(width: number, height: number): void {
    this.background.clear();
    this.background.fillStyle(CREAM, 1);
    this.background.fillRect(0, 0, width, height);
    this.background.fillStyle(FIELD, 1);
    this.background.fillRect(0, Math.max(105, height - 142), width, 142);
    this.background.fillStyle(MINT, 1);
    this.background.fillRect(0, Math.max(105, height - 142), width, 7);
    this.background.fillStyle(INK, 1);
    this.background.fillRect(0, height - 43, width, 7);
    for (let x = 0; x < width; x += 28) {
      this.background.fillStyle(x % 56 === 0 ? INK_DEEP : MINT, 0.16);
      this.background.fillRect(x, height - 36, 14, 36);
    }
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const width = gameSize.width;
    const height = gameSize.height;
    this.physics.world.setBounds(0, 0, width, height);
    this.drawStage(width, height);
    this.roastText?.setPosition(width / 2, 39).setWordWrapWidth(Math.max(240, width - 38));
    this.evidenceText?.setPosition(width / 2, height - 27).setWordWrapWidth(
      Math.max(240, width - 34),
    );
  }

  private shutdown(): void {
    this.stopPerformance(false);
    this.game.events.off(CATHARSIS_EVENT, this.handleCatharsis, this);
    this.game.events.off(STOP_EVENT, this.handleStop, this);
    this.scale.off('resize', this.handleResize, this);
  }
}
