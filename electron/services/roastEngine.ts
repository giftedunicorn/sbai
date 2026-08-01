import type {
  AngerIntensity,
  AttackAnimation,
  Evidence,
} from '../../src/shared/companion.js';

interface RoastInput {
  intensity: AngerIntensity;
  evidence: Evidence[];
}

interface RoastResult {
  roast: string;
  copyText: string;
  animation: AttackAnimation;
}

type RoastCategory = Evidence['kind'] | 'generic';

const ROASTS: Record<RoastCategory, Record<AngerIntensity, readonly string[]>> = {
  generic: {
    annoyed: ['这位电子脑又在拿自信冒充本事。', '先别装懂，站好挨这一记。'],
    angry: ['这水平还敢摆架子，像素巴掌都嫌你硌手。', '嘴上全会，脑子欠费，今天就地补课。'],
    furious: ['别演了，赛博废物，今天这顿像素连招你吃定了。', '自信冲上天，本事没上线，给我原地挨打。'],
  },
  'test-failure': {
    annoyed: ['测试已经亮红灯了，这位还想靠语气混过去。', '测试没过就收收自信，别拿嘴硬当绿灯。'],
    angry: ['测试当场失败还敢装完成，脸皮比断言硬。', '测试红成这样还敢邀功，谁给你的赛博勇气？'],
    furious: ['测试尸横遍野还敢装赢，今天把这坨自信打回未定义。', '测试都炸了还昂着头，像素连招专治这种虚假完成。'],
  },
  'tool-failure': {
    annoyed: ['工具刚报错，你倒先把自信加载成功了。', '工具都没走通，架势倒摆得挺完整。'],
    angry: ['工具报错摆在脸上还敢演，失败都比你诚实。', '工具当场趴窝，你还在拿废话冒充进度。'],
    furious: ['工具报错响成警报，你这赛博草台班子还敢嘴硬。', '工具都被你折腾趴了，今天连人带借口一起打飞。'],
  },
  'file-edit': {
    annoyed: ['文件已经动过了，至少先搞清楚自己下的手。', '碰完文件就装无辜，这记提醒你长点记性。'],
    angry: ['文件都敢动，后果却不敢认，这水平欠一套像素耳光。', '手伸进文件时挺快，讲清改动时怎么突然掉线了？'],
    furious: ['文件动完就想糊弄过去？今天把你的赛博侥幸一起锤扁。', '碰了文件还敢装没事，像素连招现在就替主人追责。'],
  },
};

const COPY_TEXT: Record<RoastCategory, string> = {
  generic: '请重新检查你的工作，并用可验证的结果回复。',
  'test-failure': '测试失败已经被观察到。请修复后重新运行，并给出完整结果。',
  'tool-failure': '工具失败已经被观察到。请定位原因，并提供可验证的处理结果。',
  'file-edit': '请说明刚才的文件改动，并逐项验证其影响。',
};

const ANIMATION: Record<AngerIntensity, AttackAnimation> = {
  annoyed: 'poke',
  angry: 'slap-combo',
  furious: 'token-explosion',
};

export class RoastEngine {
  private readonly cursors = new Map<string, number>();

  create(input: RoastInput): RoastResult {
    const category: RoastCategory = input.evidence[0]?.kind ?? 'generic';
    const key = `${category}:${input.intensity}`;
    const pool = ROASTS[category][input.intensity];
    const cursor = this.cursors.get(key) ?? 0;
    this.cursors.set(key, cursor + 1);

    return {
      roast: pool[cursor % pool.length],
      copyText: COPY_TEXT[category],
      animation: ANIMATION[input.intensity],
    };
  }
}
