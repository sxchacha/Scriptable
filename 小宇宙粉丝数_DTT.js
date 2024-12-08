// 异步函数，用于获取粉丝数量
async function fetchFollowerCount(url) {
  try {
      const request = new Request(url);
      const response = await request.loadString();
      console.log(`Response: ${response}`);
      const html = response;
      let re = /digit\">[0-9]+/;
      let followerLenRe = re.exec(html);
      
      if (!followerLenRe) {
          console.log("未找到粉丝数量");
          return "0";
      }
      
      return followerLenRe[0].replace('digit\">', '');
  } catch (error) {
      console.error(`获取粉丝数量失败: ${error.message}`);
      return "0";
  }
}

// 获取粉丝数量
async function getFollowersData(url, podcastName) {
  const followers = await fetchFollowerCount(url);
  // 使用节目名称作为键值存储的唯一标识符
  const fmKey = `xyz01_followers24HoursAgo_${podcastName}`; 
  const lastUpdateTimeKey = `xyz01_lastUpdateTime_${podcastName}`;
  
  const currentTime = new Date();
  const lastUpdateTime = Keychain.contains(lastUpdateTimeKey) 
      ? new Date(parseInt(Keychain.get(lastUpdateTimeKey))) 
      : new Date(0);
  const startOfToday = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate());
  const followers24HoursAgo = Keychain.contains(fmKey) 
      ? parseInt(Keychain.get(fmKey)) 
      : parseInt(followers) || 0;

  if (currentTime >= startOfToday && lastUpdateTime < startOfToday) {
      Keychain.set(fmKey, followers.toString());
      Keychain.set(lastUpdateTimeKey, currentTime.getTime().toString());
  }

  const followersIncrease = parseInt(followers) - followers24HoursAgo;

  return {
      followers,
      followersIncrease
  };
}

// 创建小组件
async function createWidget(url, upMainPageUrl, podcastName, customColor) {
  const { followers, followersIncrease } = await getFollowersData(url, podcastName);

  const widget = new ListWidget();

  const customTextColor = new Color(customColor);
  const customBackgroundColor = new Color(customColor, 0.05);

  // 添加标题
  const title = widget.addText('小宇宙粉丝数');
  title.font = Font.boldSystemFont(16);
  title.textColor = customTextColor;

  // 添加粉丝数量
  widget.addSpacer(10);
  const followerText = widget.addText(`${followers}`);
  followerText.font = Font.boldRoundedSystemFont(36);
  followerText.textColor = customTextColor;

  // 添加粉丝增长数量
  widget.addSpacer(10);
  let increaseText;
  if (followersIncrease >= 0) {
      increaseText = widget.addText(`今日新增 +${followersIncrease}`);
  } else {
      increaseText = widget.addText(`今日新增 ${followersIncrease} 你已经很棒了👍`);
  }
  increaseText.font = Font.systemFont(12);
  increaseText.textColor = customTextColor;

  // 设置背景颜色为条纹
  const drawContext = new DrawContext();
  drawContext.size = new Size(300, 300);
  drawContext.opaque = false;
  drawContext.respectScreenScale = true;

  const stripeWidth = 10;
  for (let i = 0; i < drawContext.size.width / stripeWidth; i++) {
      drawContext.setFillColor(i % 2 === 0 ? customBackgroundColor : new Color("#FFFFFF", 0.1));
      drawContext.fillRect(new Rect(i * stripeWidth, 0, stripeWidth, drawContext.size.height));
  }

  widget.backgroundImage = drawContext.getImage();

  // 添加可爱元素
  widget.addSpacer(10);
  let emojiText;
  if (followersIncrease === 0) {
      emojiText = widget.addText(`💪🏻 ${podcastName}`);
  } else if (followersIncrease >= 1 && followersIncrease <= 10) {
      emojiText = widget.addText(`💖 ${podcastName}`);
  } else if (followersIncrease > 10) {
      emojiText = widget.addText(`🎉 ${podcastName}`);
  } else {
      emojiText = widget.addText(`💪🏻 ${podcastName}`);
  }
  emojiText.font = Font.systemFont(14);
  emojiText.textColor = customTextColor;

  // 设置点击跳转到小宇宙 app 的个人页面
  widget.url = upMainPageUrl;

  return widget;
}

// 主函数
async function main() {
  // 节目信息数组，包含 URL、节目名称和自定义颜色
  const podcasts = [
      {
          url: 'https://www.xiaoyuzhoufm.com/podcast/64901bbf86eb9d7e47b75cf0', // 节目 URL
          name: 'DTT 设计师', // 节目名称
          color: "#13C9BC" // 自定义主题色
      },
      // 可以添加更多节目
  ];

  try {
      for (const podcast of podcasts) {
          const widget = await createWidget(
              podcast.url, 
              podcast.url, // 使用相同的 URL 作为跳转链接
              podcast.name, 
              podcast.color
          );

          // 判断是否为黑夜模式
          if (Device.isUsingDarkAppearance()) {
              const drawContext = new DrawContext();
              drawContext.size = new Size(300, 300);
              drawContext.opaque = false;
              drawContext.respectScreenScale = true;

              const stripeWidth = 10;
              for (let i = 0; i < drawContext.size.width / stripeWidth; i++) {
                  drawContext.setFillColor(i % 2 === 0 ? new Color("#000000") : new Color("#FFFFFF", 0.1));
                  drawContext.fillRect(new Rect(i * stripeWidth, 0, stripeWidth, drawContext.size.height));
              }

              widget.backgroundImage = drawContext.getImage();
          } else {
              widget.backgroundColor = new Color("#FFFFFF"); // 白天模式背景色
          }

          // 保存小组件
          Script.setWidget(widget);
          widget.presentSmall();
      }
  } catch (error) {
      console.error(`小组件创建失败: ${error.message}`);
      // 创建一个错误提示小组件
      const errorWidget = new ListWidget();
      errorWidget.addText("小组件加载失败");
      Script.setWidget(errorWidget);
  }
}

// 运行主函数
main();