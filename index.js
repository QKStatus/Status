require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField
} = require("discord.js");

const fs = require("fs");

// ===== ENV =====
const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const BANK_ACC = process.env.BANK_ACC;
const BANK_NAME = process.env.BANK_NAME || "MB";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// ===== DATA =====
function loadData() {
  try {
    return JSON.parse(fs.readFileSync("./data.json"));
  } catch {
    return {
      Fluorite: "safe",
      "Migul VN": "safe",
      Sonic: "safe",
      "Proxy Aim": "safe",
      "Cheat iOS": "safe" // thêm
    };
  }
}

function saveData(data) {
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
}

// ===== TEMP =====
const orders = new Map();

// ===== UTIL =====
function generateOrderId() {
  let id;
  do {
    id = "HD-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  } while ([...orders.values()].some(o => o.orderId === id));
  return id;
}

function getExpireDate(time) {
  const now = new Date();
  if (time === "week") now.setDate(now.getDate() + 7);
  if (time === "month") now.setMonth(now.getMonth() + 1);
  return now.toLocaleString("vi-VN");
}

// ===== EMBED (ĐẸP HƠN) =====
function createEmbed(data) {
  const embed = new EmbedBuilder()
    .setTitle("🚀 TRẠNG THÁI TOOL HACK")
    .setDescription("📢 Cập nhật mới nhất\n🟢 SAFE | 🔴 UPDATE")
    .setColor(0x00AEFF)
    .setThumbnail("https://i.imgur.com/AfFp7pu.png")
    .setFooter({ text: "⚡ Update liên tục mỗi ngày" });

  const tools = ["Fluorite", "Migul VN", "Sonic", "Proxy Aim", "Cheat iOS"];

  tools.forEach(t => {
    const icon = data[t] === "safe" ? "🟢" : "🔴";
    embed.addFields({
      name: `⚙️ ${t}`,
      value: `${icon} **${data[t].toUpperCase()}**`,
      inline: true
    });
  });

  return embed;
}

// ===== UI =====
function createButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("edit_status").setLabel("⚙️ Trạng Thái").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("download_menu").setLabel("📥 Tải Tool").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("buy_proxy").setLabel("💰 Buy Proxy").setStyle(ButtonStyle.Success)
    )
  ];
}

// ===== STATUS MENU =====
function statusToolMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("status_tool")
      .addOptions([
        { label: "Fluorite", value: "Fluorite" },
        { label: "Migul VN", value: "Migul VN" },
        { label: "Sonic", value: "Sonic" },
        { label: "Proxy Aim", value: "Proxy Aim" },
        { label: "Cheat iOS", value: "Cheat iOS" }
      ])
  );
}

function statusValueMenu(tool) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`status_value_${tool}`)
      .addOptions([
        { label: "🟢 SAFE", value: "safe" },
        { label: "🔴 UPDATE", value: "update" }
      ])
  );
}

// ===== DOWNLOAD =====
function downloadMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("download_select")
      .addOptions([
        { label: "Fluorite", value: "flu" },
        { label: "Migul VN", value: "migul" },
        { label: "Sonic", value: "sonic" },
        { label: "Proxy", value: "proxy" },
        { label: "Cheat iOS", value: "ios" }
      ])
  );
}

// ===== BUY =====
function proxyMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("proxy_type")
      .addOptions([
        { label: "🔥 Drag Anten", value: "Drag_Antena" },
        { label: "⚡ Drag NoAnten", value: "Drag_NoAntena" },
        { label: "🎯 Body NoAnten", value: "Body_NoAntena" }
      ])
  );
}

const prices = {
  Drag_Antena: { week: 100000, month: 200000 },
  Drag_NoAntena: { week: 125000, month: 225000 },
  Body_NoAntena: { week: 80000, month: 170000 }
};

function timeMenu(type) {
  const p = prices[type];
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`time_${type}`)
      .addOptions([
        { label: `Week - ${p.week}K`, value: "week" },
        { label: `Month - ${p.month}K`, value: "month" }
      ])
  );
}

// ===== QR =====
function createQR(amount, userId, type, time, orderId) {
  const content = `${orderId} | ${type} ${time} | ID${userId}`;
  return `https://img.vietqr.io/image/${BANK_NAME}-${BANK_ACC}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(content)}`;
}

// ===== READY =====
client.once("ready", async () => {
  const data = loadData();
  const ch = await client.channels.fetch(CHANNEL_ID);

  const msg = await ch.send({
    embeds: [createEmbed(data)],
    components: createButtons()
  });

  data.messageId = msg.id;
  saveData(data);

  console.log("✅ Bot đã online");
});

// ===== INTERACTION =====
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;

  // ===== STATUS ADMIN =====
  if (interaction.customId === "edit_status") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: "❌ Chỉ admin!", ephemeral: true });
    }
    return interaction.reply({ content: "⚙️ Chọn tool:", components: [statusToolMenu()], ephemeral: true });
  }

  if (interaction.customId === "status_tool") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: "❌ Không có quyền!", ephemeral: true });
    }
    return interaction.update({
      content: "🔧 Chọn trạng thái:",
      components: [statusValueMenu(interaction.values[0])]
    });
  }

  if (interaction.customId.startsWith("status_value_")) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: "❌ Không có quyền!", ephemeral: true });
    }

    const tool = interaction.customId.replace("status_value_", "");
    const value = interaction.values[0];

    const data = loadData();
    data[tool] = value;
    saveData(data);

    const channel = await client.channels.fetch(CHANNEL_ID);
    const msg = await channel.messages.fetch(data.messageId);

    await msg.edit({
      embeds: [createEmbed(data)],
      components: createButtons()
    });

    return interaction.update({ content: "✅ Đã cập nhật!", components: [] });
  }

  // ===== DOWNLOAD =====
  if (interaction.customId === "download_menu") {
    return interaction.reply({ content: "📥 Chọn tool:", components: [downloadMenu()], ephemeral: true });
  }

  if (interaction.customId === "download_select") {
    await interaction.deferUpdate();

    const links = {
      flu: "https://www.mediafire.com/file/z1lnm953slckxl0/FF.ipa",
      migul: "https://www.mediafire.com/file/xxx",
      sonic: "https://www.mediafire.com/file/yyy",
      ios: "https://www.mediafire.com/file/iosfile"
    };

    if (interaction.values[0] === "proxy") {
      return interaction.editReply({ content: "🔒 Phải mua!", components: [] });
    }

    const data = loadData();

    const map = {
      flu: "Fluorite",
      migul: "Migul VN",
      sonic: "Sonic",
      ios: "Cheat iOS"
    };

    const name = map[interaction.values[0]];
    const status = data[name];
    const icon = status === "safe" ? "🟢" : "🔴";

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`📥 ${name}`)
          .setDescription(`${icon} **${status.toUpperCase()}**\n\n🔗 ${links[interaction.values[0]]}`)
      ],
      components: []
    });
  }

  // (PHẦN MUA + DUYỆT + REJECT GIỮ NGUYÊN NHƯ TRƯỚC)
});

client.login(TOKEN);
