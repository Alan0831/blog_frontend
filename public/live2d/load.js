var 引流 = [
  'https://space.bilibili.com/672328094',
  'https://www.bilibili.com/video/BV1FZ4y1F7HH',
  'https://www.bilibili.com/video/BV1FX4y1g7u8',
  'https://www.bilibili.com/video/BV1aK4y1P7Cg',
  'https://www.bilibili.com/video/BV17A411V7Uh',
  'https://www.bilibili.com/video/BV1JV411b7Pc',
  'https://www.bilibili.com/video/BV1AV411v7er',
  'https://www.bilibili.com/video/BV1564y1173Q',

  'https://www.bilibili.com/video/BV1MX4y1N75X',
  'https://www.bilibili.com/video/BV17h411U71w',
  'https://www.bilibili.com/video/BV1ry4y1Y71t',
  'https://www.bilibili.com/video/BV1Sy4y1n7c4',
  'https://www.bilibili.com/video/BV15y4y177uk',
  'https://www.bilibili.com/video/BV1PN411X7QW',
  'https://www.bilibili.com/video/BV1Dp4y1H7iB',
  'https://www.bilibili.com/video/BV1bi4y1P7Eh',
  'https://www.bilibili.com/video/BV1vQ4y1Z7C2',
  'https://www.bilibili.com/video/BV1oU4y1h7Sc'
];

// 切换夜间模式
function toggleNightMode() {
  const body = document.querySelector('body');
  const header = document.getElementsByClassName('header')[0];
  body.classList.toggle('dark');
  header.classList.toggle('dark');
  localStorage.setItem('isDark', body.classList.contains('dark')); // contains 方法判断是否包含某个类名
}

const initConfig = {
  mode: 'fixed',
  hidden: true,
  content: {
    link: 引流[Math.floor(Math.random() * 引流.length)],
    // link: 引流[Math.floor(Math.random() * 引流.length)],
    welcome: ['Hi!'],
    touch: '',
    skin: ['诶，想看看其他团员吗？', '替换后入场文本'],
    custom: [
      { selector: '.comment-form', text: 'Content Tooltip' },
      { selector: '.home-social a:last-child', text: 'Blog Tooltip' },
      { selector: '.list, .postname, .kbn-read, .kbn-article', type: 'read' },
      { selector: 'a, .link, .kbn-link', type: 'link' },
      { selector: '.kbn-qq, .kbn-weixin, .kbn-wechat, .kbn-email, kbn-chart', type: 'chart' },
      { selector: '.kbn-music', type: 'music' },
      { selector: '.kbn-custom', type: 'custom' }
    ],
    homeLink: '', // 首页链接
    homePort: '3000' // 首页domain端口号
  },
  night: 'toggleNightMode()',
  music: {
    volume: 0.35,
    autoplay: false,
    random: true,
    tracks: [
      {
        name: '狼之主',
        src: 'https://music.163.com/song/media/outer/url?id=1996527639.mp3'
      },
      {
        name: 'Reincarnation',
        src: 'https://music.163.com/song/media/outer/url?id=4952765.mp3'
      },
      {
        name: '登临意',
        src: 'https://music.163.com/song/media/outer/url?id=2014221206.mp3'
      },
      {
        name: '破缺对称',
        src: 'https://music.163.com/song/media/outer/url?id=3376594026.mp3'
      },
      {
        name: 'Mystic Light Quest',
        src: 'https://music.163.com/song/media/outer/url?id=2612747239.mp3'
      },
      {
        name: '离音',
        src: 'https://music.163.com/song/media/outer/url?id=1361747616.mp3'
      },
      {
        name: "Ne T'En Va Pas",
        src: 'https://music.163.com/song/media/outer/url?id=19107755.mp3'
      },
      {
        name: "Ich Lieb' Dich Immer Noch So Sehr",
        src: 'https://music.163.com/song/media/outer/url?id=20036323.mp3'
      }
    ]
  },
  model: ['/live2d/Diana/Diana.model3.json', '/live2d/Ava/Ava.model3.json'],
  tips: true,
  onModelLoad: onModelLoad
};

function loadLive2D() {
  pio_reference = new Paul_Pio(initConfig);

  pio_alignment = 'left';

  // Then apply style
  pio_refresh_style();
}

function onModelLoad(model) {
  const container = document.getElementById('pio-container');
  const canvas = document.getElementById('pio');
  const modelNmae = model.internalModel.settings.name;
  const coreModel = model.internalModel.coreModel;
  const motionManager = model.internalModel.motionManager;

  let touchList = [
    {
      text: '好痒~',
      motion: 'Idle'
    },
    {
      text: '别点了~',
      motion: 'Idle'
    }
  ];

  function playAction(action) {
    action.text && pio_reference.modules.render(action.text);
    action.motion && pio_reference.model.motion(action.motion);

    if (action.from && action.to) {
      Object.keys(action.from).forEach(id => {
        const hidePartIndex = coreModel._partIds.indexOf(id);
        TweenLite.to(coreModel._partOpacities, 0.6, { [hidePartIndex]: action.from[id] });
        // coreModel._partOpacities[hidePartIndex] = action.from[id]
      });

      motionManager.once('motionFinish', data => {
        Object.keys(action.to).forEach(id => {
          const hidePartIndex = coreModel._partIds.indexOf(id);
          TweenLite.to(coreModel._partOpacities, 0.6, { [hidePartIndex]: action.to[id] });
          // coreModel._partOpacities[hidePartIndex] = action.to[id]
        });
      });
    }
  }

  canvas.onclick = function () {
    if (motionManager.state.currentGroup !== 'Idle') return;

    const action = pio_reference.modules.rand(touchList);
    playAction(action);
  };

  if (modelNmae === 'Diana') {
    container.dataset.model = 'Diana';
    initConfig.content.skin[1] = ['我是吃货担当 嘉然 Diana~'];
    playAction({ motion: 'Tap抱阿草-左手' });

    touchList = [
      {
        text: '嘉心糖屁用没有',
        motion: 'Tap生气 -领结'
      },
      {
        text: '有人急了，但我不说是谁~',
        motion: 'Tap= =  左蝴蝶结'
      },
      {
        text: '呜呜...呜呜呜....',
        motion: 'Tap哭 -眼角'
      },
      {
        text: '想然然了没有呀~',
        motion: 'Tap害羞-中间刘海'
      },
      {
        text: '阿草好软呀~',
        motion: 'Tap抱阿草-左手'
      },
      {
        text: '不要再戳啦！好痒！',
        motion: 'Tap摇头- 身体'
      },
      {
        text: '嗷呜~~~',
        motion: 'Tap耳朵-发卡'
      },
      {
        text: 'zzZ。。。',
        motion: 'Leave'
      },
      {
        text: '哇！好吃的！',
        motion: 'Tap右头发'
      }
    ];
  } else if (modelNmae === 'Ava') {
    container.dataset.model = 'Ava';
    initConfig.content.skin[1] = ['我是拉胯 Gamer 担当 向晚 AvA~'];
    playAction({
      motion: 'Tap左眼',
      from: {
        Part15: 1
      },
      to: {
        Part15: 0
      }
    });

    touchList = [
      {
        text: '水母 水母~ 只是普通的生物',
        motion: 'Tap右手'
      },
      {
        text: '可爱的鸽子鸽子~我喜欢你~',
        motion: 'Tap胸口项链',
        from: {
          Part12: 1
        },
        to: {
          Part12: 0
        }
      },
      {
        text: '好...好兄弟之间喜欢很正常啦',
        motion: 'Tap中间刘海',
        from: {
          Part12: 1
        },
        to: {
          Part12: 0
        }
      },
      {
        text: '啊啊啊！怎么推流辣',
        motion: 'Tap右眼',
        from: {
          Part16: 1
        },
        to: {
          Part16: 0
        }
      },
      {
        text: '你怎么老摸我，我的身体是不是可有魅力',
        motion: 'Tap嘴'
      },
      {
        text: 'AAAAAAAAAAvvvvAAA 向晚！',
        motion: 'Tap左眼',
        from: {
          Part15: 1
        },
        to: {
          Part15: 0
        }
      }
    ];
    canvas.width = model.width * 1.2;
    const hideParts = [
      'Part5', // 晕
      'neko', // 喵喵拳
      'game', // 左手游戏手柄
      'Part15', // 墨镜
      'Part21', // 右手小臂
      'Part22', // 左手垂下
      'Part', // 双手抱拳
      'Part16', // 惊讶特效
      'Part12' // 小心心
    ];
    const hidePartsIndex = hideParts.map(id => coreModel._partIds.indexOf(id));
    hidePartsIndex.forEach(idx => {
      coreModel._partOpacities[idx] = 0;
    });
  }
}

var pio_reference;
// 兼容普通脚本与首屏后的动态加载：页面已完成时直接初始化，否则等待 load 事件。
if (document.readyState === 'complete') {
  loadLive2D();
} else {
  window.addEventListener('load', loadLive2D, { once: true });
}
