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

const THUMBNAIL = "https://files.catbox.moe/wpeovp.webp";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
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
      ADR: "safe"
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
  return "HD-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getExpireDate(time) {
  const now = new Date();
  if (time === "day") now.setDate(now.getDate() + 1);
  if (time === "week") now.setDate(now.getDate() + 7);
  if (time === "month") now.setMonth(now.getMonth() + 1);
  return now.toLocaleString("vi-VN");
}

function formatName(type) {
  if (type === "Migul_Lite") return "Migul VN (Lite)";
  if (type === "Migul_Pro") return "Migul VN (Pro)";
  return type;
}

// ===== EMBED =====
function box(text) {
  return `\`\`\`diff\n${text}\n\`\`\``;
}

function createEmbed(data) {
  const status = (s) =>
    s === "safe" ? box("+ 🟢 An Toàn") : box("- 🔴 Cập Nhật");

  return new EmbedBuilder()
    .setColor("#00ffae")
    .setTitle("🚀 TRẠNG THÁI HACK FREE FIRE")
    .setThumbnail(THUMBNAIL)
    .setDescription("📡 Hệ thống theo dõi theo thời gian thực\n\u200B")
    .addFields(
      { name: "💎 FLUORITE", value: status(data["Fluorite"]) },
      { name: "🔥 MIGUL VN", value: status(data["Migul VN"]) },
      { name: "⚡ SONIC", value: status(data["Sonic"]) },
      { name: "🎯 PROXY AIM", value: status(data["Proxy Aim"]) },
      { name: "🤖 DRIP ADR", value: status(data["ADR"]) },
      { name: "━━━━━━━━━━━━━━━━━━", value: "📢 Auto Update • Chính xác • Realtime" }
    )
    .setFooter({ text: "⚡ Premium Bot System - By Khánh" })
    .setTimestamp();
}

// ===== BUTTON =====
function createButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("edit_status").setLabel("⚙️ Trạng Thái").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("download_menu").setLabel("📥 Tải Hack").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("buy_proxy").setLabel("💰 Buy Key").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("reset_key").setLabel("♻️ Reset Key").setStyle(ButtonStyle.Danger)
    )
  ];
}

// ===== MENU =====
function statusToolMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("status_tool")
      .addOptions([
        { label: "Fluorite", value: "Fluorite" },
        { label: "Migul VN", value: "Migul VN" },
        { label: "Sonic", value: "Sonic" },
        { label: "Proxy Aim", value: "Proxy Aim" },
        { label: "ADR", value: "ADR" }
      ])
  );
}

function statusValueMenu(tool) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`status_value_${tool}`)
      .addOptions([
        { label: "🟢 An Toàn", value: "safe" },
        { label: "🔴 Cập Nhật", value: "update" }
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
        { label: "ADR", value: "adr" }
      ])
  );
}

// ===== BUY =====
function proxyMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("proxy_type")
      .addOptions([
        { label: "🔥 Proxy Vip", value: "Proxy_Vip" },
        { label: "💎 Fluorite", value: "Fluorite" },
        { label: "🔥 Migul VN", value: "Migul" },
        { label: "🧠 Drip ADR", value: "ADR" },
        { label: "⚡ Sonic", value: "Sonic" }
      ])
  );
}

function proxyVipMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("proxy_vip_type")
      .addOptions([
        { label: "🔥 Drag Anten", value: "Drag_Antena" },
        { label: "⚡ Drag NoAnten", value: "Drag_NoAntena" },
        { label: "🎯 Body NoAnten", value: "Body_NoAntena" },
        { label: "🎯 AimBụng Antena", value: "AimBung_Antena" },
        { label: "🎯 AimBụng No Antena", value: "AimBung_NoAntena" }
      ])
  );
}

function migulMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("migul_type")
      .addOptions([
        { label: "Lite", value: "Migul_Lite" },
        { label: "Pro", value: "Migul_Pro" }
      ])
  );
}

const prices = {
  Drag_Antena: { week: 100000, month: 200000 },
  Drag_NoAntena: { week: 125000, month: 225000 },
  Body_NoAntena: { week: 80000, month: 170000 },
  AimBung_Antena: { week: 100000, month: 200000 },
  AimBung_NoAntena: { week: 100000, month: 200000 },
  Fluorite: { day: 110000, week: 280000, month: 550000 },
  Migul_Lite: { day: 50000, week: 150000, month: 350000 },
  Migul_Pro: { day: 90000, week: 225000, month: 450000 },
  ADR: { week: 90000, month: 200000 },
  Sonic: { week: 90000, month: 200000 }
};

function timeMenu(type) {
  const p = prices[type];
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`time_${type}`)
      .addOptions([
        ...(p.day ? [{ label: `Ngày - ${p.day}`, value: "day" }] : []),
        ...(p.week ? [{ label: `Tuần - ${p.week}`, value: "week" }] : []),
        ...(p.month ? [{ label: `Tháng - ${p.month}`, value: "month" }] : [])
      ])
  );
}

// ===== QR =====
function createQR(amount, userId, type, time, orderId) {
  const content = `${orderId} ${type} ${time} ID${userId}`;
  return `https://img.vietqr.io/image/${BANK_NAME}-${BANK_ACC}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(content)}`;
}

// ===== READY =====
client.once("ready", async () => {
  const data = loadData();
  const ch = await client.channels.fetch(CHANNEL_ID);

  let msg;
  try {
    if (data.messageId) {
      msg = await ch.messages.fetch(data.messageId);
      await msg.edit({ embeds: [createEmbed(data)], components: createButtons() });
    } else {
      msg = await ch.send({ embeds: [createEmbed(data)], components: createButtons() });
      data.messageId = msg.id;
      saveData(data);
    }
  } catch {
    msg = await ch.send({ embeds: [createEmbed(data)], components: createButtons() });
    data.messageId = msg.id;
    saveData(data);
  }

  console.log("🤖 Bot online");
});

// ===== INTERACTION =====
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;

  // ===== RESET KEY =====
  if (interaction.customId === "reset_key") {
    const modal = new ModalBuilder()
      .setCustomId("resetkey_modal")
      .setTitle("Reset Key");

    const input = new TextInputBuilder()
      .setCustomId("old_key")
      .setLabel("Nhập key cần reset")
      .setStyle(TextInputStyle.Short);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    return interaction.showModal(modal);
  }

  if (interaction.customId === "resetkey_modal") {
    const key = interaction.fields.getTextInputValue("old_key");

    const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setTitle("♻️ Yêu cầu Reset Key")
      .addFields(
        { name: "👤 User", value: `<@${interaction.user.id}>` },
        { name: "🔑 Key", value: `\`${key}\`` }
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`approve_reset_${interaction.user.id}`).setLabel("✅ Duyệt").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`reject_reset_${interaction.user.id}`).setLabel("❌ Từ chối").setStyle(ButtonStyle.Danger)
    );

    await logChannel.send({ embeds: [embed], components: [row] });

    return interaction.reply({ content: "📩 Đã gửi yêu cầu!", ephemeral: true });
  }

  if (interaction.customId.startsWith("approve_reset_")) {
    const userId = interaction.customId.split("_")[2];
    const user = await client.users.fetch(userId);

    await user.send("✅ Key đã được reset!");

    return interaction.update({ components: [] });
  }

  if (interaction.customId.startsWith("reject_reset_")) {
    const userId = interaction.customId.split("_")[2];
    const user = await client.users.fetch(userId);

    await user.send("❌ Reset bị từ chối!");

    return interaction.update({ components: [] });
  }

  // ===== BUY =====
  if (interaction.customId === "buy_proxy") {
    return interaction.reply({ content: "💰 Chọn loại:", components: [proxyMenu()], ephemeral: true });
  }

  if (interaction.customId === "proxy_type") {
    await interaction.deferUpdate();

    if (interaction.values[0] === "Migul") {
      return interaction.editReply({ content: "🔥 Chọn phiên bản:", components: [migulMenu()] });
    }

    if (interaction.values[0] === "Proxy_Vip") {
      return interaction.editReply({ content: "🔥 Chọn loại Proxy:", components: [proxyVipMenu()] });
    }

    return interaction.editReply({ content: "⏳ Chọn thời gian:", components: [timeMenu(interaction.values[0])] });
  }

  if (interaction.customId === "proxy_vip_type") {
    await interaction.deferUpdate();
    return interaction.editReply({ content: "⏳ Chọn thời gian:", components: [timeMenu(interaction.values[0])] });
  }

  if (interaction.customId === "migul_type") {
    await interaction.deferUpdate();
    return interaction.editReply({ content: "⏳ Chọn HSD:", components: [timeMenu(interaction.values[0])] });
  }
});

client.login(TOKEN);
