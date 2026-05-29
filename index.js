const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const express = require('express');
const app = express();

// ========================================================
// ⚙️ 核心配置（已幫你將 Token 與 頻道 ID 完全寫死）
// ========================================================
const ANGELA_TOKEN = "d39da4bcf2e20fa6e1f8e97f60817d597afc8a0cf2b9e8c308a88beaaf224840"; 
const DISCORD_CHANNEL_ID = "1402282604165730348"; 

// ========================================================
// 1. 公開端點網址（給 GitHub Action 鬧鐘敲門續命用）
// ========================================================
app.get('/', (req, res) => {
  res.send('管理員，Angela 正在運行中。邊獄公司分部情報監控系統已就緒。');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[系統] Angela 公開端點已於連接埠 ${port} 成功啟動。`);
});

// ========================================================
// 2. ANGELA 機器人核心邏輯（10秒高頻交叉巡邏）
// ========================================================
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let lastSteamId = null;
let lastTwitterId = null;

client.once('ready', () => {
  console.log(`[腦葉公司/邊獄分部] 監管者 Angela 已成功同步連線！`);
  
  // 啟動高頻率巡邏：每 10000 毫秒 (10秒) 交叉檢查一次最新消息
  executePatrol();
  setInterval(executePatrol, 10000);
});

async function executePatrol() {
  await checkSteamUpdates();
  await checkTwitterUpdates();
}

/**
 * 監控 Steam 官方公告 (Limbus Company)
 */
async function checkSteamUpdates() {
  try {
    const res = await fetch(`https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=1973530&count=1`);
    const data = await res.json();
    const latestNews = data.appnews.newsitems[0];

    if (!latestNews) return;

    if (latestNews.gid !== lastSteamId) {
      if (lastSteamId !== null) { 
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
    // 透過 RSSHub 公開 JSON 實例監控 LimbusCompany_B 推特
    const res = await fetch(`https://rsshub.app/twitter/user/LimbusCompany_B?format=json`);
    if (!res.ok) return; 
    
    const data = await res.json();
    const latestTweet = data.items[0];

    if (!latestTweet) return;

    if (latestTweet.id !== lastTwitterId) {
      if (lastTwitterId !== null) {
        const imageUrl = extractTwitterImg(latestTweet.content_html) || "https://images.mirror.tw/k8s-mirror-pub/2023/02/24/02e60f7e-128c-4a3a-a16f-7f78168e30b0-webp.jpg";
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
    const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
    if (!channel) {
      console.error(`[錯誤] 找不到頻道 ID: ${DISCORD_CHANNEL_ID}，請確認機器人已被邀請進該伺服器並擁有閱讀/發言權限。`);
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x820000) // 邊獄深紅
      .setAuthor({ name: authorName })
      .setTitle(title)
      .setURL(url)
      .setDescription(description)
      .setImage(imageUrl)
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    console.log(`[發送成功] 已將最新消息推送至頻道 ${DISCORD_CHANNEL_ID}。`);
  } catch (error) {
    console.error('[錯誤] 訊息發送失敗:', error.message);
  }
}

function extractSteamImg(content) {
  const match = content.match(/\[img\](.*?)\[\/img\]/);
  return match ? match[1] : null;
}

function extractTwitterImg(htmlContent) {
  if (!htmlContent) return null;
  const match = htmlContent.match(/<img[^>]+src="([^">]+)"/);
  return match ? match[1] : null;
}

// 🟢 拿著金鑰直接登入
client.login(ANGELA_TOKEN);
