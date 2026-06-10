import './imgPreview.less';
const ad = require('../../public/bilan.jpeg');
const close = require('../../public/close.png');

export const clickPreview = (src) => {
    let preimgPreviewDiv = document.querySelector('.img-preview');
    if (preimgPreviewDiv) {
        preimgPreviewDiv.remove();
    }
    let mask1 = document.createElement('div');
    let mask2 = document.createElement('div');
    let img = document.createElement('img');
    mask1.classList.add('previewMask', 'zindexhigher');
    mask2.classList.add('previewMask', 'zindexlower');
    img.classList.add('imgCenter');
    img.src = src;
    mask1.onclick = function () {
        mask1.remove();
        mask2.remove();
    }
    mask1.appendChild(img);
    document.body.appendChild(mask1);
    document.body.appendChild(mask2);
}

export const lookAnswerPreview = (callback) => {
    let preimgPreviewDiv = document.querySelector('.img-preview');
    if (preimgPreviewDiv) {
        preimgPreviewDiv.remove();
    }
    let mask1 = document.createElement('div');
    let mask2 = document.createElement('div');
    let adElement = document.createElement('div');
    let title = document.createElement('div');
    let imgElement = document.createElement('div');
    let img = document.createElement('img');
    let closeImg = document.createElement('img');

    mask1.classList.add('previewMask', 'zindexhigher');
    mask2.classList.add('previewMask', 'zindexlower');

    adElement.classList.add('imgCenter');
    title.textContent = '观看10秒广告即可查看答案哦~';

    img.src = ad;
    closeImg.src = close;
    imgElement.appendChild(img);

    let timeout = 10;
    let timer = setInterval(() => {
        if (timeout > 1) {
            timeout--;
            title.textContent = `观看${timeout}秒广告即可查看答案哦~`
        } else {
            callback && callback();
            mask1.remove();
            mask2.remove();
            clearInterval(timer);
        }
    }, 1000);

    title.classList.add('title');
    closeImg.classList.add('closeIcon');
    img.classList.add('adImg');

    closeImg.onclick = function () {
        mask1.remove();
        mask2.remove();
        clearInterval(timer);
    }

    adElement.appendChild(closeImg);
    adElement.appendChild(title);
    adElement.appendChild(imgElement);
    mask1.appendChild(adElement);
    document.body.appendChild(mask1);
    document.body.appendChild(mask2);
}