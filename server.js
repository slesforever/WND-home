const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const express = require('express');
const app = express();

// --- 1. 建立公開端點 URL ---
app.get('/', (req, res) => {
  res.send('管理員，Angela 正在運行中。監控系統已就緒。');
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Angela 的公開端點已啟動");
});

// --- 2. Angela 機器人核心邏輯 ---
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let lastSteamId = null;

client.once('ready', () => {
  console.log(`[腦葉公司/邊獄分部] Angela 已就緒。`);
  
  // 每 10 秒巡邏一次 Steam
  setInterval(checkSteam, 10000); 
});

async function checkSteam() {
  try {
    const res = await fetch(`https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=1973530&count=1`);
    const data = await res.json();
    const news = data.appnews.newsitems[0];

    if (news && news.gid !== lastSteamId) {
      if (lastSteamId !== null) {
        const channel = await client.channels.fetch(process.env.CHANNEL_ID);
        const embed = new EmbedBuilder()
          .setColor(0x820000) // 邊獄紅
          .setAuthor({ name: 'Limbus Company 官方公告' })
          .setTitle(news.title)
          .setURL(news.url)
          .setImage(extractImg(news.contents) || "https://images.mirror.tw/k8s-mirror-pub/2023/02/24/02e60f7e-128c-4a3a-a16f-7f78168e30b0-webp.jpg")
          .setTimestamp();

        await channel.send({ embeds: [embed] });
      }
      lastSteamId = news.gid;
    }
  } catch (e) { console.error("巡邏出錯:", e); }
}

function extractImg(content) {
  const match = content.match(/\[img\](.*?)\[\/img\]/);
  return match ? match[1] : null;
}

// 在 Glitch 的 .env 檔案中填入你的 TOKEN
client.login(process.env.TOKEN);
