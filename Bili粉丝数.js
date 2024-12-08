// 异步函数，用于获取粉丝数量
async function fetchFollowerCount(vmid) {
    try {
        const url = `https://api.bilibili.com/x/relation/stat?vmid=${vmid}&jsonp=jsonp`;
        const request = new Request(url);
        const response = await request.loadString();
        console.log(`Response: ${response}`);
        
        const json = JSON.parse(response);
        if (json.code === 0) {
            return json.data.follower.toString();
        } else {
            console.error(`API请求错误: ${json.message}`);
            return "0";
        }
    } catch (error) {
        console.error(`获取粉丝数量失败: ${error.message}`);
        return "0";
    }
}

// 获取粉丝数量
async function getFollowersData(vmid, upName) {
    console.log(`Fetching followers for vmid: ${vmid}, upName: ${upName}`);
    const followers = await fetchFollowerCount(vmid);
    console.log(`Fetched followers: ${followers}`);
    
    const fmKey = `bilibili_followers24HoursAgo_${upName}`; 
    const lastUpdateTimeKey = `bilibili_lastUpdateTime_${upName}`;
    
    const currentTime = new Date();
    console.log(`Current time: ${currentTime}`);
    
    const lastUpdateTime = Keychain.contains(lastUpdateTimeKey) 
        ? new Date(parseInt(Keychain.get(lastUpdateTimeKey))) 
        : new Date(0);
    console.log(`Last update time: ${lastUpdateTime}`);
    
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
async function createWidget(vmid, upMainPageUrl, upName, customColor) {
    const { followers, followersIncrease } = await getFollowersData(vmid, upName);

    const widget = new ListWidget();

    const customTextColor = new Color(customColor);
    const customBackgroundColor = new Color(customColor, 0.03); // 自定义颜色，透明度3%

    // 添加标题
    const title = widget.addText('B站粉丝数');
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
        if (Device.isUsingDarkAppearance()) {
            // 暗模式：背景色为黑色，条纹颜色为不透明10%的白色
            drawContext.setFillColor(i % 2 === 0 ? new Color("#000000") : new Color("#FFFFFF", 0.1));
        } else {
            // 亮模式：背景色为白色，条纹颜色为不透明3%的自定义颜色
            drawContext.setFillColor(i % 2 === 0 ? new Color("#FFFFFF") : customBackgroundColor);
        }
        drawContext.fillRect(new Rect(i * stripeWidth, 0, stripeWidth, drawContext.size.height));
    }

    widget.backgroundImage = drawContext.getImage();

    // 添加可爱元素
    widget.addSpacer(10);
    let emojiText;
    if (followersIncrease === 0) {
        emojiText = widget.addText(`💪🏻 ${upName}`);
    } else if (followersIncrease >= 1 && followersIncrease <= 10) {
        emojiText = widget.addText(`💖 ${upName}`);
    } else if (followersIncrease > 10) {
        emojiText = widget.addText(`🎉 ${upName}`);
    } else {
        emojiText = widget.addText(`💪🏻 ${upName}`);
    }
    emojiText.font = Font.systemFont(14);
    emojiText.textColor = customTextColor;

    // 设置点击跳转到B站的个人页面
    widget.url = upMainPageUrl;

    return widget;
}

// 检查系统颜色模式并设置默认值
function getWidgetBackgroundColor() {
    try {
        if (Device.isUsingDarkAppearance()) {
            return Color.black();
        } else {
            return Color.white();
        }
    } catch (error) {
        console.error(`读取系统颜色模式失败: ${error.message}`);
        // 默认使用亮模式
        return Color.white();
    }
}

// 主函数
async function main() {
    // UP主信息数组，包含 vmid、UP主名称和自定义颜色
    const upMasters = [
        {
            vmid: '1591442525', // UP主的vmid
            name: '四喜茶茶', // UP主名称
            color: "#FE4B82" // 自定义主题色
        },
        // 可以添加更多UP主
    ];

    try {
        for (const upMaster of upMasters) {
            const widget = await createWidget(
                upMaster.vmid, 
                `https://space.bilibili.com/${upMaster.vmid}`, // 使用B站个人空间链接
                upMaster.name, 
                upMaster.color
            );

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
