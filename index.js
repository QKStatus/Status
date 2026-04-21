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
  intents: [GatewayIntentBits.Guilds]
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
  if (time === "week") now.setDate(now.getDate() + 7);
  if (time === "month") now.setMonth(now.getMonth() + 1);
  return now.toLocaleString("vi-VN");
}

function formatName(type) {
  const map = {
    Drag_Antena: "🔥 Drag Antena",
    Drag_NoAntena: "⚡ Drag No Antena",
    Body_NoAntena: "🎯 Body No Antena",
    Bung_Antena: "💪 Bụng Antena",
    Bung_NoAntena: "💪 Bụng No Antena",
    Fluorite: "💎 Fluorite",
    Migul_Lite: "🔥 Migul Lite",
    Migul_Pro: "🔥 Migul Pro",
    ADR: "🧠 Drip ADR",
    Sonic: "⚡ Sonic"
  };
  return map[type] || type;
}

async function safeSend(user, data) {
  try { await user.send(data); } catch {}
}

// ===== EMBED UI XỊN =====
function createEmbed(data) {
  const s = (v) => (v === "safe" ? "🟢 Hoạt động" : "🔴 Update");

  return new EmbedBuilder()
    .setColor("#060b26")
    .setTitle("🚀 FREE FIRE PREMIUM SHOP")
    .setThumbnail(THUMBNAIL)
    .setDescription(`
📡 **Realtime System**
━━━━━━━━━━━━━━━━━━
💎 Fluorite: ${s(data["Fluorite"])}
🔥 Migul VN: ${s(data["Migul VN"])}
⚡ Sonic: ${s(data["Sonic"])}
🎯 Proxy Aim: ${s(data["Proxy Aim"])}
🤖 ADR: ${s(data["ADR"])}
━━━━━━━━━━━━━━━━━━
💡 **Chọn chức năng bên dưới**
`)
    .setFooter({ text: "⚡ Premium Bot • Auto • Realtime" })
    .setTimestamp();
}

// ===== BUTTON =====
function createButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("edit_status").setLabel("⚙️ Trạng Thái").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("download_menu").setLabel("📥 Tải Hack").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("buy_proxy").setLabel("💰 Buy Key").setStyle(ButtonStyle.Success)
    )
  ];
}

// ===== MENU =====
function proxyMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("proxy_type")
      .setPlaceholder("💰 Chọn sản phẩm")
      .addOptions([
        { label: "Proxy Vip", description: "Full tính năng", value: "proxy_vip", emoji: "💎" },
        { label: "Fluorite", value: "Fluorite" },
        { label: "Migul VN", value: "Migul" },
        { label: "ADR", value: "ADR" },
        { label: "Sonic", value: "Sonic" }
      ])
  );
}

function proxyVipMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("proxy_vip_type")
      .setPlaceholder("🔥 Chọn Proxy Vip")
      .addOptions([
        { label: "Drag Antena", value: "Drag_Antena" },
        { label: "Drag No Antena", value: "Drag_NoAntena" },
        { label: "Body No Antena", value: "Body_NoAntena" },
        { label: "Bụng Antena", value: "Bung_Antena" },
        { label: "Bụng No Antena", value: "Bung_NoAntena" }
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

// ===== PRICES =====
const prices = {
  Drag_Antena: { week: 100000, month: 200000 },
  Drag_NoAntena: { week: 125000, month: 225000 },
  Body_NoAntena: { week: 80000, month: 170000 },
  Bung_Antena: { week: 100000, month: 200000 },
  Bung_NoAntena: { week: 100000, month: 200000 },

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
      .setPlaceholder("⏳ Chọn thời gian")
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

  const msg = await ch.send({
    embeds: [createEmbed(data)],
    components: createButtons()
  });

  data.messageId = msg.id;
  saveData(data);

  console.log("🤖 Bot online");
});

// ===== INTERACTION =====
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;

  // BUY
  if (interaction.customId === "buy_proxy") {
    return interaction.reply({ content: "💰 Chọn sản phẩm:", components: [proxyMenu()], ephemeral: true });
  }

  if (interaction.customId === "proxy_type") {
    await interaction.deferUpdate();

    if (interaction.values[0] === "proxy_vip") {
      return interaction.editReply({ content: "🔥 Chọn Proxy Vip:", components: [proxyVipMenu()] });
    }

    if (interaction.values[0] === "Migul") {
      return interaction.editReply({ content: "🔥 Chọn phiên bản:", components: [migulMenu()] });
    }

    return interaction.editReply({ content: "⏳ Chọn thời gian:", components: [timeMenu(interaction.values[0])] });
  }

  if (interaction.customId === "proxy_vip_type") {
    await interaction.deferUpdate();
    return interaction.editReply({ content: "⏳ Chọn thời gian:", components: [timeMenu(interaction.values[0])] });
  }

  if (interaction.customId === "migul_type") {
    await interaction.deferUpdate();
    return interaction.editReply({ content: "⏳ Chọn thời gian:", components: [timeMenu(interaction.values[0])] });
  }

  if (interaction.customId.startsWith("time_")) {
    await interaction.deferUpdate();

    orders.delete(interaction.user.id);

    const type = interaction.customId.replace("time_", "");
    const time = interaction.values[0];
    const price = prices[type][time];

    const orderId = generateOrderId();
    orders.set(interaction.user.id, { type, time, price, orderId });

    const qr = createQR(price, interaction.user.id, type, time, orderId);

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor("#22c55e")
          .setTitle("💳 THANH TOÁN")
          .setDescription(`📌 Nội dung CK: \`${orderId}\``)
          .setImage(qr)
          .addFields(
            { name: "🧾 Mã đơn", value: orderId },
            { name: "📦 Gói", value: `${formatName(type)} (${time})` },
            { name: "💰 Giá", value: `${price.toLocaleString()}đ` }
          )
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("confirm_bank").setLabel("✅ Đã chuyển khoản").setStyle(ButtonStyle.Success)
        )
      ]
    });
  }

  if (interaction.customId === "confirm_bank") {
    const order = orders.get(interaction.user.id);
    if (!order) return;

    const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("📩 Đơn hàng")
          .addFields(
            { name: "🧾 Mã đơn", value: order.orderId },
            { name: "👤 Người mua", value: `<@${interaction.user.id}>` },
            { name: "📦 Gói", value: `${formatName(order.type)} (${order.time})` },
            { name: "💰 Giá", value: `${order.price.toLocaleString()}đ` }
          )
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`approve_${interaction.user.id}`).setLabel("Duyệt").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`reject_${interaction.user.id}`).setLabel("Từ chối").setStyle(ButtonStyle.Danger)
        )
      ]
    });

    return interaction.reply({ content: "🧾 Đã gửi đơn!", ephemeral: true });
  }
});

client.login(TOKEN);
