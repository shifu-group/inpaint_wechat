//获取应用实例
const app = getApp()
Page({
    data: {
        src: '',
        width: 250, //宽度
        height: 450, //高度
        disable_rotate: true , //是否禁用旋转
        disable_ratio: false, //锁定比例
        limit_move: true, //是否限制移动
        disable_width: true,
        disable_height: true,
        max_width: 250,
        max_height: 250,
        max_scale: 16,
        min_scale: 1
    },

    attached() {
        console.log("aa");
    },

    onLoad: function (options) {
        const width = Math.round( options.width * 0.95);
        const height = Math.round( options.height * 0.95);
        this.cropper = this.selectComponent("#image-cropper");
        this.setData({
            width: width,
            height: height,
            max_width: width,
            max_height: height
        });
        this.cropper.setCutCenter();
        this.setData({
             src: options.imgSrc
        });
    },

    cropperload(e) {
        // console.log('cropper加载完成');
    },

    loadimage(e) {
        wx.hideLoading();
        // console.log('图片');
    },

    clickcut(e) {
        console.log(e.detail);
        //图片预览
        wx.previewImage({
            current: e.detail.url, // 当前显示图片的http链接
            urls: [e.detail.url] // 需要预览的图片http链接列表
        })
    },

    submit() {
        this.cropper.getImgData((obj) => {
            const pages = getCurrentPages();
            const previousPage = pages[pages.length - 2];
            if (previousPage) {
                // 将参数传递给上一个页面 A
                const imageRoi = this.calculateImageRoi(obj.imageData);
                previousPage.setData({
                    _isCropChanged: true,
                    croppedImageData: imageRoi,
                });
            };
            getApp().globalData.returnFromCropper = true;
            wx.navigateBack({
                delta: 1,
            });
        });
    },

    calculateImageRoi(imageData) {
        const startX = (imageData.cut_left - (imageData.img_left - this.data.width * imageData.scale / 2)) / (this.data.width * imageData.scale);
        const startY = (imageData.cut_top - (imageData.img_top - this.data.height * imageData.scale / 2)) / (this.data.height * imageData.scale);
        const imageRoi = {
            startX: startX,
            startY: startY,
            scale: imageData.scale
        };
        return imageRoi;
    },

    cancel() {
        const pages = getCurrentPages();
        const previousPage = pages[pages.length - 2];
        if (previousPage) {
            // 将参数传递给上一个页面 A
            previousPage.setData({
            _isCropChanged: false,
            });
        };
        getApp().globalData.returnFromCropper = true;
        wx.navigateBack({
            delta: 1,
       });
    },

    enlarge() {
        this.cropper.setTransform({
            scale: 0.20
        });
    },
    end(e) {
        clearInterval(this.data[e.currentTarget.dataset.type]);
    },
})