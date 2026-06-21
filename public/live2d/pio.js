/* ----

# Pio Plugin
# By: Dreamer-Paul
# Modify: journey-ad
# Last Update: 2021.5.4

一个支持更换 Live2D 模型的 Typecho 插件。

本代码为奇趣保罗原创，并遵守 GPL 2.0 开源协议。欢迎访问我的博客：https://paugram.com

---- */

var Paul_Pio = function (prop) {
  var that = this;

  var current = {
    idol: 0,
    menu: document.querySelector('.pio-container .pio-action'),
    canvas: document.getElementById('pio'),
    body: document.querySelector('.pio-container'),
    root: document.location.protocol + '//' + document.location.hostname + '/'
  };

  /* - 方法 */
  var modules = {
    // 更换模型
    idol: function () {
      current.idol < prop.model.length - 1 ? current.idol++ : (current.idol = 0);
      return current.idol;
    },
    // 创建内容
    create: function (tag, prop) {
      var e = document.createElement(tag);
      if (prop.class) e.className = prop.class;
      return e;
    },
    // 随机内容
    rand: function (arr) {
      return arr[Math.floor(Math.random() * arr.length + 1) - 1];
    },
    // 创建对话框方法
    render: function (text) {
      if (text.constructor === Array) {
        // 看板提示只按纯文本展示，避免文章标题、链接文本等外部内容拼进 innerHTML 后触发 XSS。
        dialog.textContent = modules.rand(text);
      } else if (text.constructor === String) {
        dialog.textContent = text;
      } else {
        dialog.textContent = '输入内容出现问题了 X_X';
      }

      dialog.classList.add('active');

      clearTimeout(this.t);
      this.t = setTimeout(function () {
        dialog.classList.remove('active');
      }, 3000);
    },
    // 移除方法
    destroy: function () {
      musicPlayer.stop();
      that.initHidden();
      localStorage.setItem('posterGirl', 0);
    },
    // 是否为移动设备
    isMobile: function () {
      var ua = window.navigator.userAgent.toLowerCase();
      ua = ua.indexOf('mobile') || ua.indexOf('android') || ua.indexOf('ios');

      return window.innerWidth < 500 || ua !== -1;
    }
  };
  this.modules = modules;
  this.destroy = modules.destroy;

  var elements = {
    home: modules.create('span', { class: 'pio-home' }),
    skin: modules.create('span', { class: 'pio-skin' }),
    music: modules.create('span', { class: 'pio-music' }),
    // info: modules.create('span', { class: 'pio-info' }),
    night: modules.create('span', { class: 'pio-night' }),
    close: modules.create('span', { class: 'pio-close' }),
    show: modules.create('div', { class: 'pio-show' })
  };

  var dialog = modules.create('div', { class: 'pio-dialog' });
  current.body.appendChild(dialog);
  current.body.appendChild(elements.show);

  var musicPanel = modules.create('div', { class: 'pio-music-panel' });
  var musicName = modules.create('div', { class: 'pio-music-panel__name' });
  var musicStatus = modules.create('div', { class: 'pio-music-panel__status' });
  var musicControls = modules.create('div', { class: 'pio-music-panel__controls' });
  var previousButton = modules.create('button', { class: 'pio-music-control pio-music-control--previous' });
  var playButton = modules.create('button', { class: 'pio-music-control pio-music-control--play' });
  var nextButton = modules.create('button', { class: 'pio-music-control pio-music-control--next' });

  musicPanel.setAttribute('aria-label', '音乐播放器');
  previousButton.type = 'button';
  previousButton.title = '上一首';
  previousButton.setAttribute('aria-label', '上一首');
  playButton.type = 'button';
  playButton.title = '播放';
  playButton.setAttribute('aria-label', '播放');
  nextButton.type = 'button';
  nextButton.title = '下一首';
  nextButton.setAttribute('aria-label', '下一首');
  musicControls.appendChild(previousButton);
  musicControls.appendChild(playButton);
  musicControls.appendChild(nextButton);
  musicPanel.appendChild(musicName);
  musicPanel.appendChild(musicStatus);
  musicPanel.appendChild(musicControls);
  elements.music.appendChild(musicPanel);

  // 音乐控制器：歌曲页地址不能直接播放，配置中使用对应歌曲 ID 的媒体地址。
  var musicPlayer = (function () {
    var musicConfig = prop.music || {};
    var tracks = Array.isArray(musicConfig.tracks) ? musicConfig.tracks.filter(function (track) {
      return track && track.src;
    }) : (musicConfig.src ? [{ name: musicConfig.name || '未命名音乐', src: musicConfig.src }] : []);
    var audio = tracks.length ? new Audio() : null;
    var currentIndex = musicConfig.random && tracks.length ? Math.floor(Math.random() * tracks.length) : 0;
    var playing = false;
    var loading = false;
    var waitingForInteraction = false;

    function currentTrack() {
      return tracks[currentIndex] || null;
    }

    function updateView(statusText) {
      var track = currentTrack();
      elements.music.classList.toggle('is-playing', playing);
      playButton.classList.toggle('is-playing', playing);
      elements.music.setAttribute('aria-label', playing ? '暂停音乐' : '播放音乐');
      elements.music.setAttribute('title', playing ? '暂停音乐' : '播放音乐');
      playButton.setAttribute('aria-label', playing ? '暂停' : '播放');
      playButton.setAttribute('title', playing ? '暂停' : '播放');
      musicName.textContent = track ? track.name : '暂无可播放音乐';
      musicStatus.textContent = statusText || (loading ? '正在加载' : (playing ? '正在播放' : '已暂停'));
    }

    function loadCurrentTrack() {
      if (!audio || !currentTrack()) return false;
      audio.src = currentTrack().src;
      audio.volume = Number(musicConfig.volume || 0.35);
      audio.load();
      updateView();
      return true;
    }

    function clearInteractionFallback() {
      if (!waitingForInteraction) return;
      waitingForInteraction = false;
      document.removeEventListener('pointerdown', resumeAfterInteraction);
      document.removeEventListener('keydown', resumeAfterInteraction);
    }

    function resumeAfterInteraction(event) {
      clearInteractionFallback();
      // 点击播放器自身时交给对应按钮处理，避免同一次点击触发两次播放切换。
      if (elements.music.contains(event.target)) return;
      play(false).then(function (started) {
        if (started) modules.render('正在播放：' + currentTrack().name);
      });
    }

    function waitForInteraction() {
      if (waitingForInteraction) return;
      waitingForInteraction = true;
      updateView('等待首次交互');
      document.addEventListener('pointerdown', resumeAfterInteraction);
      document.addEventListener('keydown', resumeAfterInteraction);
    }

    function play(isAutoplay) {
      if (!audio || !currentTrack()) {
        updateView('播放列表为空');
        modules.render('还没有配置可播放的音乐');
        return Promise.resolve(false);
      }

      if (!audio.src && !loadCurrentTrack()) return Promise.resolve(false);
      loading = true;
      updateView();
      return audio.play().then(function () {
        clearInteractionFallback();
        loading = false;
        playing = true;
        updateView();
        return true;
      }).catch(function (error) {
        loading = false;
        playing = false;
        if (isAutoplay && error && error.name === 'NotAllowedError') {
          waitForInteraction();
          return false;
        }
        updateView('加载失败');
        modules.render('音乐加载失败，可能受到网易云版权或外链限制');
        return false;
      });
    }

    function pause(showMessage) {
      clearInteractionFallback();
      playing = false;
      if (audio) audio.pause();
      loading = false;
      updateView();
      if (showMessage) modules.render('音乐暂停啦，想听的时候再叫我~');
    }

    function toggle() {
      if (playing) {
        pause(true);
        return;
      }

      play(false).then(function (started) {
        if (started) modules.render('正在播放：' + currentTrack().name);
      });
    }

    function changeTrack(step, autoplay) {
      if (!tracks.length) return;
      currentIndex = (currentIndex + step + tracks.length) % tracks.length;
      if (audio) audio.pause();
      playing = false;
      loading = false;
      loadCurrentTrack();
      modules.render('已切换到：' + currentTrack().name);
      if (autoplay) play(false);
    }

    if (audio) {
      audio.preload = 'none';
      audio.addEventListener('ended', function () {
        changeTrack(1, true);
      });
      loadCurrentTrack();
      if (musicConfig.autoplay && localStorage.getItem('posterGirl') !== '0') {
        window.setTimeout(function () {
          play(true).then(function (started) {
            if (started) modules.render('随机播放：' + currentTrack().name);
          });
        }, 0);
      }
    } else {
      updateView('播放列表为空');
    }

    return {
      toggle: toggle,
      previous: function () { changeTrack(-1, playing); },
      next: function () { changeTrack(1, playing); },
      stop: function () { pause(false); },
      isPlaying: function () { return playing; }
    };
  })();

  /* - 提示操作 */
  var action = {
    // 欢迎
    welcome: function () {
      if (document.referrer !== '' && document.referrer.indexOf(current.root) === -1) {
        var referrer = document.createElement('a');
        referrer.href = document.referrer;
        prop.content.referer ? modules.render(prop.content.referer.replace(/%t/, '“' + referrer.hostname + '”')) : modules.render('欢迎来看我的博客的朋友！');
      } else if (prop.tips) {
        var text,
          hour = new Date().getHours();

        if (hour > 22 || hour <= 5) {
          text = '你是夜猫子呀？这么晚还不睡觉，明天起的来嘛';
        } else if (hour > 5 && hour <= 8) {
          text = '早上好！';
        } else if (hour > 8 && hour <= 11) {
          text = '上午好！工作顺利嘛，不要久坐，多起来走动走动哦！';
        } else if (hour > 11 && hour <= 14) {
          text = '中午了，工作了一个上午，现在是午餐时间！';
        } else if (hour > 14 && hour <= 17) {
          text = '午后很容易犯困呢，今天的运动目标完成了吗？';
        } else if (hour > 17 && hour <= 19) {
          text = '傍晚了！窗外夕阳的景色很美丽呢，最美不过夕阳红~';
        } else if (hour > 19 && hour <= 21) {
          text = '晚上好，今天过得怎么样？';
        } else if (hour > 21 && hour <= 23) {
          text = '已经这么晚了呀，早点休息吧，晚安~';
        } else {
          text = '奇趣保罗说：这个是无法被触发的吧，哈哈';
        }

        modules.render(text);
      } else {
        modules.render(prop.content.welcome || '欢迎来到本站！');
      }
    },
    // 触摸
    touch: function () {
      current.canvas.onclick = function () {
        modules.render(prop.content.touch || ['你在干什么？', '再摸我就报警了！', 'HENTAI!', '不可以这样欺负我啦！']);
      };
    },
    // 右侧按钮
    buttons: function () {
      // 返回首页
      elements.home.onclick = function () {
        let link = current.root && current.root.split('/')[0] + '//' + current.root.split('/')[2];
        let port = location.port;
        location.href = port ? `${link}:${port}` : link;
      };
      elements.home.onmouseover = function () {
        modules.render(prop.content.home || '点击这里回到首页！');
      };
      current.menu.appendChild(elements.home);

      // 更换模型
      elements.skin.onclick = function () {
        that.model = loadlive2d('pio', prop.model[modules.idol()], model => {
          prop.onModelLoad && prop.onModelLoad(model);
          prop.content.skin && prop.content.skin[1] ? modules.render(prop.content.skin[1]) : modules.render('新衣服真漂亮~');
        });
      };
      elements.skin.onmouseover = function () {
        prop.content.skin && prop.content.skin[0] ? modules.render(prop.content.skin[0]) : modules.render('想看看我的新衣服吗？');
      };
      if (prop.model.length > 1) current.menu.appendChild(elements.skin);

      // 播放 / 暂停音乐
      if (prop.music !== false) {
        elements.music.setAttribute('role', 'button');
        elements.music.setAttribute('tabindex', '0');
        elements.music.onclick = function (event) {
          if (event.target !== elements.music) return;
          musicPlayer.toggle();
        };
        elements.music.onkeydown = function (event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            musicPlayer.toggle();
          }
        };
        elements.music.onmouseenter = function () {
          modules.render(musicPlayer.isPlaying() ? '要暂停音乐吗？' : '要来一点音乐吗？');
        };
        previousButton.onclick = function (event) {
          event.stopPropagation();
          musicPlayer.previous();
        };
        playButton.onclick = function (event) {
          event.stopPropagation();
          musicPlayer.toggle();
        };
        nextButton.onclick = function (event) {
          event.stopPropagation();
          musicPlayer.next();
        };
        current.menu.appendChild(elements.music);
      }

      // 关于我
      // elements.info.onclick = function () {
      //   window.open(prop.content.link || 'https://paugram.com/coding/add-poster-girl-with-plugin.html');
      // };
      // elements.info.onmouseover = function () {
      //   modules.render('想了解更多关于我的信息吗？');
      // };
      // current.menu.appendChild(elements.info);

      // 夜间模式
      if (prop.night) {
        elements.night.onclick = function () {
          // 不使用 eval 执行配置字符串，只允许调用全局无参函数，例如 toggleNightMode()。
          if (typeof prop.night === 'function') {
            prop.night();
            return;
          }

          const match = String(prop.night).match(/^([A-Za-z_$][\w$]*)\(\)$/);
          const nightHandler = match && window[match[1]];
          if (typeof nightHandler === 'function') nightHandler();
        };
        elements.night.onmouseover = function () {
          localStorage.getItem('isDark') == 'true' ? modules.render('克里斯开下灯') : modules.render('克里斯关下灯');
        };
        current.menu.appendChild(elements.night);
      }

      // 关闭看板娘
      elements.close.onclick = function () {
        modules.destroy();
      };
      elements.close.onmouseover = function () {
        modules.render(prop.content.close || 'QWQ 下次再见吧~');
      };
      current.menu.appendChild(elements.close);
    },
    // 自定义内容
    custom: function () {
      prop.content.custom.forEach(function (t) {
        if (!t.type) t.type = 'default';
        var e = document.querySelectorAll(t.selector);

        if (e.length) {
          for (var j = 0; j < e.length; j++) {
            if (t.type === 'read') {
              const text = (this.dataset && this.dataset.tip) || this.innerText || '这篇文章';
              e[j].onmouseover = function () {
                modules.render('想阅读 %t 吗？'.replace(/%t/, '“' + text + '”'));
              };
            } else if (t.type === 'link') {
              e[j].onmouseover = function () {
                const text = (this.dataset && this.dataset.tip) || this.innerText || '这个链接';
                modules.render('想前往 %t 吗？'.replace(/%t/, '“' + text + '”'));
              };
            } else if (t.type === 'chart') {
              e[j].onmouseover = function () {
                const text = (this.dataset && this.dataset.tip) || this.innerText || '';
                modules.render('想联系我 %t 吗？'.replace(/%t/, '“' + text + '”'));
              };
            } else if (t.type == 'music') {
              e[j].onmouseover = function () {
                const text = (this.dataset && this.dataset.tip) || this.innerText || '这个音乐';
                modules.render('想听听 %t 吗？'.replace(/%t/, '“' + text + '”'));
              };
            } else if (t.type == 'custom') {
              e[j].onmouseover = function () {
                const text = (this.dataset && this.dataset.tip) || this.innerText || '';
                modules.render('%t'.replace(/%t/, '“' + text + '”'));
              };
            } else if (t.text) {
              e[j].onmouseover = function () {
                modules.render(t.text);
              };
            }
          }
        }
      });
    }
  };

  /* - 运行 */
  var begin = {
    static: function () {
      current.body.classList.add('static');
    },
    fixed: function () {
      action.touch();
      action.buttons();
    },
    draggable: function () {
      action.touch();
      action.buttons();

      var body = current.body;
      body.onmousedown = function (downEvent) {
        var location = {
          x: downEvent.clientX - this.offsetLeft,
          y: downEvent.clientY - this.offsetTop
        };

        function move(moveEvent) {
          body.classList.add('active');
          body.classList.remove('right');
          body.style.left = moveEvent.clientX - location.x + 'px';
          body.style.top = moveEvent.clientY - location.y + 'px';
          body.style.bottom = 'auto';
        }

        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', function () {
          body.classList.remove('active');
          document.removeEventListener('mousemove', move);
        });
      };
    }
  };

  // 运行
  this.init = function (onlyText) {
    if (!(prop.hidden && modules.isMobile())) {
      if (!onlyText) {
        action.welcome();
        that.model = loadlive2d('pio', prop.model[0], model => {
          prop.onModelLoad && prop.onModelLoad(model);
        });
      }

      switch (prop.mode) {
        case 'static':
          begin.static();
          break;
        case 'fixed':
          begin.fixed();
          break;
        case 'draggable':
          begin.draggable();
          break;
      }

      if (prop.content.custom) action.custom();
    }
  };

  // 隐藏状态
  this.initHidden = function () {
    current.body.classList.add('hidden');
    dialog.classList.remove('active');

    elements.show.onclick = function () {
      current.body.classList.remove('hidden');
      localStorage.setItem('posterGirl', 1);
      that.init();
    };
  };

  localStorage.getItem('posterGirl') == 0 ? this.initHidden() : this.init();
};

// 请保留版权说明
if (window.console && window.console.log) {
  console.log('%c Pio %c https://paugram.com ', 'color: #fff; margin: 1em 0; padding: 5px 0; background: #673ab7;', 'margin: 1em 0; padding: 5px 0; background: #efefef;');
}
