import './imgPreview.less';
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