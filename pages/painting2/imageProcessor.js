// 设置 OpenCV wasm 文件路径
global.wasm_url = '/utils/opencv3.4.16.wasm.br';
// opencv_exec.js 会从 global.wasm_url 获取 wasm 路径
let cv = require('../../utils/opencv_exec.js');

// 异步加载图像数据
async function loadImage(imgUrl) {
  // 创建 2D 类型的离屏画布（需要微信基础库2.16.1以上）
  var offscreenCanvas = wx.createOffscreenCanvas({
    type: '2d'
  });
  const image = offscreenCanvas.createImage();

  await new Promise(function (resolve, reject) {
    image.onload = resolve;
    image.src = imgUrl;
  });

  offscreenCanvas.width = image.width;
  offscreenCanvas.height = image.height;

  // 在画布上绘制图像
  var ctx = offscreenCanvas.getContext('2d');
  ctx.drawImage(image, 0, 0, image.width, image.height);

  // 从画布获取图像数据
  var imgData = ctx.getImageData(0, 0, image.width, image.height);

  return imgData;

}

function convertToRGB(src) {
  const src_rgb = new cv.Mat();
  cv.cvtColor(src, src_rgb, cv.COLOR_RGBA2RGB);
  return src_rgb;
}

function changMaskColor(inputMask, selectColor) {
  const colorMap = {
    "#ff0000": {
      r: 255,
      g: 0,
      b: 0
    },
    "#ffff00": {
      r: 255,
      g: 255,
      b: 0
    },
    "#00CC00": {
      r: 0,
      g: 204,
      b: 0
    }
  };

  const selectedColor = colorMap[selectColor];

  if (selectedColor) {
    const {
      b,
      g,
      r
    } = selectedColor;
    const imgData = inputMask.data;

    for (let i = 0; i < imgData.length; i += 4) {
      if (imgData[i] === r && imgData[i + 1] === g && imgData[i + 2] === b) {
        imgData[i] = 255;
        imgData[i + 1] = 255;
        imgData[i + 2] = 255;
      };
    };
  } else {
    return;
  };
}

function convertAndResizeMask(inputMask, width, height) {
  const maskGrey = new cv.Mat();
  const mask = new cv.Mat();
  const dsize = new cv.Size(width, height); // 新尺寸
  cv.cvtColor(inputMask, maskGrey, cv.COLOR_BGR2GRAY);
  cv.bitwise_not(maskGrey, maskGrey);

  // 调整图像大小
  cv.resize(maskGrey, mask, dsize, 0, 0, cv.INTER_NEAREST);
  maskGrey.delete();
  return mask;
}

export async function cropImage(imageUrl, croppedImageData) {
  const originalImg = await loadImage(imageUrl);
  const src = cv.imread(originalImg);

  let x_min = Math.floor(croppedImageData.startX * originalImg.width);
  x_min = Math.min(Math.max(x_min, 0), src.cols);
  let y_min = Math.floor(croppedImageData.startY * originalImg.height);
  y_min = Math.min(Math.max(y_min, 0), src.rows);
  let width = Math.floor(originalImg.width / croppedImageData.scale) - 1;
  let height = Math.floor(originalImg.height / croppedImageData.scale) - 1;

  const croppedImg = src.roi(new cv.Rect(x_min, y_min, width, height));
  const croppedImageUrl = await saveImageDataToTempFile(croppedImg)
  return croppedImageUrl;
}


export async function scaleMask(maskFile, model, selectColor, isUp) {
  try {
    const originalMask = await loadImage(maskFile);
    const maskInput = cv.imread(originalMask);
    changMaskColor(maskInput, selectColor);
    cv.cvtColor(maskInput, maskInput, cv.COLOR_RGBA2RGB);
    cv.cvtColor(maskInput, maskInput, cv.COLOR_BGR2GRAY);
    let convertedMask = new cv.Mat();
    if (isUp) {
        convertedMask = model.maxPool2D(maskInput);
    } else {
        convertedMask = model.minPool2D(maskInput);
    }
    const colorMat = new cv.Mat.ones(convertedMask.rows, convertedMask.cols, cv.CV_8UC4);

    const colorMap = {
      "#ff0000": [255, 0, 0, 255],
      "#ffff00": [255, 255, 0, 255],
      "#00CC00": [0, 204, 0, 255],
    };
    const rgbaArray = colorMap[selectColor];
    if (rgbaArray) {
      colorMat.setTo(rgbaArray);
    } else {
      colorMat.setTo([255, 255, 255, 255]);
    }

    const resultMat = new cv.Mat();
    colorMat.copyTo(resultMat,convertedMask);
    const resultFilePath = await saveImageDataToTempFile(resultMat);
    maskInput.delete();
    convertedMask.delete();
    colorMat.delete();
    resultMat.delete();

    return resultFilePath;
  } catch (error) {
    console.error(error);
  }
}

// 执行图像修复
export async function inPaint(imageInfo, maskFile, model, selectColor) {
  try {
    const imageFile = imageInfo.isCropped ? imageInfo.croppedCover : imageInfo.cover;

    // 异步加载原始图像和掩码图像
    const originalImg = await loadImage(imageFile);

    const originalMask = await loadImage(maskFile);

    // 使用 OpenCV 读取图像数据
    const src = cv.imread(originalImg);
    const img = convertToRGB(src);

    // 使用 OpenCV 读取掩码图像
    const maskInput = cv.imread(originalMask);
    changMaskColor(maskInput, selectColor);

    // 将mask转成灰度图片并调整到图片大小一致
    const mask = convertAndResizeMask(maskInput, originalImg.width, originalImg.height);
    maskInput.delete();

    // 执行模型推理
    const resultImage = await model.execute(img, mask, src);

    let resultFilePath;
    if  (imageInfo.isCropped) {
      const mergedResultImage = await mergeCroppedImage(imageInfo, resultImage);
       resultFilePath = await saveImageDataToTempFile(mergedResultImage);
    } else {
      resultFilePath = await saveImageDataToTempFile(resultImage);
    };

    mask.delete();
    img.delete();
    src.delete();
    resultImage.delete();

    return resultFilePath;
  } catch (error) {
    console.error(error);
    wx.showToast({
      title: '运行失败',
      icon: 'error',
      duration: 2000
    })
    setTimeout(function () {
      wx.hideLoading()
    }, 200)
    throw error;
  }
}

async function mergeCroppedImage(imageInfo, croppedImage) {
  const originalImg = await loadImage(imageInfo.cover);
  const src = cv.imread(originalImg);

  let x_min = Math.floor(imageInfo.croppedImageData.startX * originalImg.width);
  x_min = Math.min(Math.max(x_min, 0), src.cols);
  let y_min = Math.floor(imageInfo.croppedImageData.startY * originalImg.height);
  y_min = Math.min(Math.max(y_min, 0), src.rows);
  let width = Math.floor(originalImg.width / imageInfo.croppedImageData.scale) - 1;
  let height = Math.floor(originalImg.height / imageInfo.croppedImageData.scale) - 1;
  croppedImage.copyTo(src.roi(new cv.Rect(x_min, y_min, width, height)));

  return src;
}

function saveImageDataToTempFile(image) {
  const base64Img = imageDataToDataURL(image);
  return new Promise((resolve, reject) => {
    // 生成临时文件路径
    const number = Math.random();
    const tempFilePath = wx.env.USER_DATA_PATH + '/pic_inpaint_' + number + '.png';
    wx.getFileSystemManager().writeFile({
      filePath: tempFilePath,
      data: base64Img.replace(/^data:image\/\w+;base64,/, ""),
      encoding: 'base64',
      success: (res) => {
        resolve(tempFilePath);
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

// 将 ImageData 转换为数据 URL
function imageDataToDataURL(input) {
  const offscreenCanvas = wx.createOffscreenCanvas({
    type: '2d',
    width: input.cols,
    height: input.rows
  });
  cv.imshow(offscreenCanvas, input);
  return offscreenCanvas.toDataURL();
}
