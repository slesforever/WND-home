const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const express = require('express');
const app = express();

// ========================================================
// 1. ANGELA WEB ENDPOINT (公開端點設定)
// ========================================================

app.get('/', (req, res) => {
  res.send('管理員，Angela 正在運行中。邊獄公司分部情報監控系統已就緒。');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[系統] Angela 公開端點已於連接埠 ${port} 成功啟動。`);
});

// ========================================================
// 2. ANGELA BOT CORE (機器人核心邏輯)
// ========================================================

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// 紀錄最後一次發布的訊息 ID，防止重啟時重複發送
let lastSteamId = null;
let lastTwitterId = null;

client.once('ready', () => {
  console.log(`[腦葉公司/邊獄分部] 監管者 Angela 已成功同步連線。`);
  
  // 啟動高頻率巡邏：每 10000 毫秒 (10秒) 檢查一次最新消息
  executePatrol();
  setInterval(executePatrol, 10000);
});

/**
 * 核心巡邏排程
 */
async function executePatrol() {
  await checkSteamUpdates();
  await checkTwitterUpdates();
}

/**
 * 監控 Steam 官方公告
 */
async function checkSteamUpdates() {
  try {
    // 呼叫 Steam 官方 API 獲取 Limbus Company (AppID: 1973530) 的最新 1 則公告
    const res = await fetch(`https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=1973530&count=1`);
    const data = await res.json();
    const latestNews = data.appnews.newsitems[0];

    if (!latestNews) return;

    // 如果偵測到新文章 ID
    if (latestNews.gid !== lastSteamId) {
      if (lastSteamId !== null) { // 確保不是機器人剛啟動時的舊公告
        const imageUrl = extractSteamImg(latestNews.contents) || "https://images.mirror.tw/k8s-mirror-pub/2023/02/24/02e60f7e-128c-4a3a-a16f-7f78168e30b0-webp.jpg";
        await sendDiscordEmbed(
          'Limbus Company 官方公告 (Steam)',
          latestNews.title,
          latestNews.url,
          imageUrl,
          '「發現新情報。管理員，請確認各部門的配置。」'
        );
      }
      lastSteamId = latestNews.gid;
    }
  } catch (error) {
    console.error('[錯誤] Steam 巡邏異常:', error.message);
  }
}

/**
 * 監控 Twitter (X) 官方推文
 */
async function checkTwitterUpdates() {
  try {
    // 使用 RSSHub 的公開免認證 JSON 轉換端點，監控 LimbusCompany_B 帳號
    // 這裡直接要求回傳 json 格式，比解析 xml 更加輕量且穩定
    const res = await fetch(`https://rsshub.app/twitter/user/LimbusCompany_B?format=json`);
    
    if (!res.ok) return; // 遇到 RSSHub 節點繁忙時直接跳過，靜待下個 10 秒
    const data = await res.json();
    const latestTweet = data.items[0];

    if (!latestTweet) return;

    // 比對推文唯一識別碼 (通常為網址或 id)
    if (latestTweet.id !== lastTwitterId) {
      if (lastTwitterId !== null) {
        // 從 RSSHub 回傳的 html 內容中撈出推文附帶的第一張媒體圖片
        const imageUrl = extractTwitterImg(latestTweet.content_html) || "https://images.mirror.tw/k8s-mirror-pub/2023/02/24/02e60f7e-128c-4a3a-a16f-7f78168e30b0-webp.jpg";
        
        // 清理一下標題，避免太過冗長
        const cleanTitle = latestTweet.title.length > 60 ? latestTweet.title.substring(0, 60) + '...' : latestTweet.title;

        await sendDiscordEmbed(
          'Limbus Company 官方推特 (X)',
          cleanTitle,
          latestTweet.url,
          imageUrl,
          '「X (Twitter) 分部傳回了即時觀測報告。」'
        );
      }
      lastTwitterId = latestTweet.id;
    }
  } catch (error) {
    console.error('[錯誤] Twitter 巡邏異常:', error.message);
  }
}

/**
 * 執行 Discord Embed 訊息發送
 */
async function sendDiscordEmbed(authorName, title, url, imageUrl, description) {
  try {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(0x820000) // 罪惡與奢華的標誌深紅色
      .setAuthor({ name: authorName })
      .setTitle(title)
      .setURL(url)
      .setDescription(description)
      .setImage(imageUrl)
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    console.log(`[發送成功] 已將最新消息推送至指定頻道。`);
  } catch (error) {
    console.error('[錯誤] 訊息發送失敗:', error.message);
  }
}

/**
 * 工具：解析 Steam BBCode 格式中的首張圖片 [img]url[/img]
 */
function extractSteamImg(content) {
  const match = content.match(/\[img\](.*?)\[\/img\]/);
  return match ? match[1] : null;
}

/**
 * 工具：解析 HTML 字串中標籤的 src 屬性 (Twitter 圖片)
 */
function extractTwitterImg(htmlContent) {
  if (!htmlContent) return null;
  const match = htmlContent.match(/<img[^>]+src="([^">]+)"/);
  return match ? match[1] : null;
}

// 讀取安全性環境變數並啟動 Angela
client.login(process.env.TOKEN);
