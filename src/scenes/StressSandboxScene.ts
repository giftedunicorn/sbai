import Phaser from 'phaser';
import { createInitialAgentState, registerHit } from '../game/agentState';
import { createHitEvent } from '../game/eventGenerator';
import { createRandom } from '../game/random';
import type { AgentState } from '../game/agentState';
import type { HitEvent } from '../game/types';
import { createAgentDoll, setAgentExpression, type AgentParts } from './renderAgent';

export class StressSandboxScene extends Phaser.Scene {
  private agent!: AgentParts;
  private state: AgentState = createInitialAgentState();
  private random = createRandom();
  private caption?: Phaser.GameObjects.Text;
  private rageText?: Phaser.GameObjects.Text;

  constructor() {
    super('stress-sandbox');
  }

  create(): void {
    const { width, height } = this.scale;
    this.physics.world.setBounds(0, 0, width, height);

    this.addStage(width, height);
    this.agent = createAgentDoll(this, width / 2, height * 0.54);
    this.agent.root.setInteractive(
      new Phaser.Geom.Rectangle(-95, -130, 190, 260),
      Phaser.Geom.Rectangle.Contains,
    );

    this.agent.root.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.hitAgent(pointer.x, pointer.y);
    });

    this.rageText = this.add.text(24, 22, 'RAGE 0  COMBO 0', {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: '18px',
      color: '#f8f4e8',
      fontStyle: '900',
    });
  }

  private addStage(width: number, height: number): void {
    this.add.rectangle(width / 2, height / 2, width, height, 0x15171d);
    this.add.rectangle(width / 2, height - 44, width, 88, 0x222836);
    this.add
      .text(width / 2, height - 38, 'HIT THE AGENT', {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: '18px',
        color: '#8f98aa',
        fontStyle: '900',
      })
      .setOrigin(0.5);
  }

  private hitAgent(pointerX: number, pointerY: number): void {
    this.state = registerHit(this.state);
    const event = createHitEvent({ combo: this.state.combo, random: this.random });
    this.applyHitEvent(event, pointerX, pointerY);
  }

  private applyHitEvent(event: HitEvent, pointerX: number, pointerY: number): void {
    const body = this.agent.root.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(event.force.x, event.force.y);
    body.setAngularVelocity(event.force.x > 0 ? 220 : -220);

    setAgentExpression(this.agent, event.expression);
    this.cameras.main.shake(110, event.screenShake / 900);
    this.rageText?.setText(`RAGE ${this.state.rage}  COMBO ${this.state.combo}`);

    this.spawnImpact(pointerX, pointerY, event);
    this.spawnCaption(event.apology);
    this.spawnMistakeLabel(event.mistakeLabel);
    this.spawnParticles(event);

    this.tweens.add({
      targets: this.agent.root,
      scaleX: event.reaction === 'squash' ? 1.24 : 1.08,
      scaleY: event.reaction === 'squash' ? 0.78 : 0.92,
      duration: 80,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  private spawnImpact(x: number, y: number, event: HitEvent): void {
    const text = this.add
      .text(x, y - 42, event.impactWord, {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: event.rare ? '54px' : '42px',
        color: '#ffdf54',
        stroke: '#08090d',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setAngle(Phaser.Math.Between(-14, 14));

    this.tweens.add({
      targets: text,
      y: y - 110,
      alpha: 0,
      scale: 1.22,
      duration: 700,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  private spawnCaption(apology: string): void {
    this.caption?.destroy();
    const { width, height } = this.scale;
    this.caption = this.add
      .text(width - 32, height - 128, apology, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#08090d',
        backgroundColor: '#ffffff',
        padding: { x: 14, y: 10 },
        wordWrap: { width: 280 },
      })
      .setOrigin(1, 1);
  }

  private spawnMistakeLabel(label: string): void {
    const { width } = this.scale;
    const x = Phaser.Math.Between(90, Math.max(90, width - 90));
    const text = this.add
      .text(x, -30, label, {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: '20px',
        color: '#08090d',
        backgroundColor: '#ff6b6b',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setAngle(Phaser.Math.Between(-10, 10));

    this.tweens.add({
      targets: text,
      y: Phaser.Math.Between(110, 230),
      duration: 420,
      ease: 'Bounce.easeOut',
    });

    this.time.delayedCall(1800, () => text.destroy());
  }

  private spawnParticles(event: HitEvent): void {
    const origin = this.agent.root;

    for (let i = 0; i < 14; i += 1) {
      const particle = this.add.circle(
        origin.x,
        origin.y - 24,
        5,
        this.colorForParticle(event.particleKind),
      );
      this.tweens.add({
        targets: particle,
        x: origin.x + Phaser.Math.Between(-180, 180),
        y: origin.y + Phaser.Math.Between(-170, 90),
        alpha: 0,
        duration: Phaser.Math.Between(520, 900),
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private colorForParticle(kind: string): number {
    if (kind === 'token') return 0xffdf54;
    if (kind === 'bug') return 0xff6b6b;
    if (kind === 'diff') return 0x8fffd1;
    return 0xf8f4e8;
  }
}
