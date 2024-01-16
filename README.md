# 照片修复小小助手 (Inpaint_wechat)
照片修复小小助手是一款基于微信AI能力的微信小程序，实现了图片选定区域的消除修复功能，纯客户端实现，无服务端。


本程序借鉴了 MI-GAN 原项目和 inpaint_web 网页实现项目的逻辑以及部分代码。

鉴于微信小程序仅支持有限的算子，为了弥补这一限制，本程序采用了 WebAssembly (wasm) 技术，并结合适配微信的 OpenCV 技术，以实现对模型的预处理和后处理。

Inpaint_wechat is a WeChat mini-program based on the WeChat AI capabilities, implementing the functionality of inpainting and repairing selected areas in images,  which is purely implemented by the client and has no server.


The program draws inspiration from the logic and some code of the original MI-GAN project and inpaint_web project.

Given the limited support for operators in WeChat mini-programs, to address this constraint, the program utilizes WebAssembly (wasm) technology. 
Additionally, it integrates with WeChat-adapted OpenCV techniques to achieve model preprocessing and post-processing. 

## 特点： 快速P图，P图，去水印，去字幕，P掉游客，修复照片等

## Video Demo（视频演示）


https://github.com/shifu-group/inpaint_wechat/assets/104042064/06260321-8666-4950-bf9d-116485d5dc0a


## Demo(1.选择图片  2.选择区域  3.消除)
![照片修复小助手](media/merge.jpg)
## QR Code for the Wechat App （扫描微信小程序二维码打开小程序）
![照片修复小助手](images/mini_code.jpg)

## Operation Tips (操作建议)

1. Multiple inpainting operations can be performed on the target area until satisfactory results are achieved.

可以对目标区域进行连续的多次消除操作，直到对结果满意为止。

2. If you are not satisfied with the current result, you can use "undo" to cancel the operation and then reselect the area. 
Please note that this operation is irreversible.

如果对当前结果不满意，可以用“回退”来取消操作，再重新选择区域。注意此操作不可逆。

## Contact

[![Twitter Follow](https://img.shields.io/twitter/follow/zhiyuan?style=social)](https://x.com/zhiyuan54030554)

[📺 bilibili](https://space.bilibili.com/2031846058)

## Reference

- The MI-GAN model

https://github.com/Picsart-AI-Research/MI-GAN

- The inpaint-web repository

https://github.com/lxfater/inpaint-web

- Adapted opencv for WeChat

https://github.com/sanyuered/WeChat-MiniProgram-AR-WASM
