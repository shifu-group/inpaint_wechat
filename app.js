// app.js

App({
  onLaunch: function() {
    // 从本地缓存中获取日志数据
    var logs = wx.getStorageSync('logs') || [];
    logs.unshift(Date.now());
    wx.setStorageSync('logs', logs);

    // 调用获取用户信息的方法
    this.getUserInfo();
  },

  getUserInfo: function() {
    // 检查是否已经存在用户信息
    if (this.globalData.userInfo) {
      // 如果存在，直接返回
      return;
    }

    // 调用登录接口
    wx.login({
      success: (loginRes) => {
        // 获取用户信息
        wx.getUserInfo({
          withCredentials: false,
          success: (userRes) => {
            // 更新全局数据
            this.globalData.userInfo = userRes.userInfo;
            // console.log('User info:', userRes.userInfo);
          },
          fail: (userError) => {
            // 用户拒绝授权的处理逻辑
            // console.error('Failed to get user info:', userError);
          }
        });
      },
      fail: (loginError) => {
        // 登录失败的处理逻辑
        // console.error('Login failed:', loginError);
      }
    });
  },

  globalData: {
    userInfo: null
  }
});
