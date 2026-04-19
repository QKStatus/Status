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
      new ButtonBuilder().setCustomId("buy_proxy").setLabel("💰 Buy Key").setStyle(ButtonStyle.Success)
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
        { label: "🔥 Drag Anten", value: "Drag_Antena" },
        { label: "⚡ Drag NoAnten", value: "Drag_NoAntena" },
        { label: "🎯 Body NoAnten", value: "Body_NoAntena" },

        { label: "💎 Fluorite", value: "Fluorite" },
        { label: "🔥 Migul VN", value: "Migul" },
        { label: "🧠 Drip ADR", value: "ADR" },
        { label: "⚡ Sonic", value: "Sonic" }
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

// ===== READY (FIX REDEPLOY) =====
client.once("ready", async () => {
  const data = loadData();
  const ch = await client.channels.fetch(CHANNEL_ID);

  try {
    if (data.messageId) {
      const msg = await ch.messages.fetch(data.messageId);

      await msg.edit({
        embeds: [createEmbed(data)],
        components: createButtons()
      });

      console.log("♻️ Updated embed cũ");
    } else {
      const msg = await ch.send({
        embeds: [createEmbed(data)],
        components: createButtons()
      });

      data.messageId = msg.id;
      saveData(data);

      console.log("✅ Gửi embed mới");
    }
  } catch {
    const msg = await ch.send({
      embeds: [createEmbed(data)],
      components: createButtons()
    });

    data.messageId = msg.id;
    saveData(data);

    console.log("⚠️ Tạo lại embed");
  }

  console.log("🤖 Bot online");
});

// ===== INTERACTION =====
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;

  // ===== BUY =====
  if (interaction.customId === "buy_proxy") {
    return interaction.reply({ content: "💰 Chọn loại:", components: [proxyMenu()], ephemeral: true });
  }

  if (interaction.customId === "proxy_type") {
    await interaction.deferUpdate();

    if (interaction.values[0] === "Migul") {
      return interaction.editReply({
        content: "🔥 Chọn phiên bản:",
        components: [migulMenu()]
      });
    }

    return interaction.editReply({
      content: "⏳ Chọn thời gian:",
      components: [timeMenu(interaction.values[0])]
    });
  }

  if (interaction.customId === "migul_type") {
    await interaction.deferUpdate();

    return interaction.editReply({
      content: "⏳ Chọn HSD:",
      components: [timeMenu(interaction.values[0])]
    });
  }

  if (interaction.customId.startsWith("time_")) {
    await interaction.deferUpdate();

    if (orders.has(interaction.user.id)) {
      return interaction.editReply({ content: "⚠️ Bạn đang có đơn chưa xử lý!", components: [] });
    }

    const type = interaction.customId.replace("time_", "");
    const time = interaction.values[0];
    const price = prices[type]?.[time];

    const orderId = generateOrderId();
    orders.set(interaction.user.id, { type, time, price, orderId });

    const qr = createQR(price, interaction.user.id, type, time, orderId);

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("💳 Thanh toán")
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
          new ButtonBuilder().setCustomId("confirm_bank").setLabel("✅ Xác nhận").setStyle(ButtonStyle.Success)
        )
      ]
    });
  }

  if (interaction.customId === "confirm_bank") {
    const order = orders.get(interaction.user.id);
    if (!order) return interaction.reply({ content: "❌ Đơn không tồn tại!", ephemeral: true });

    const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setTitle("📩 Đơn hàng")
      .addFields(
        { name: "🧾 Mã đơn", value: order.orderId },
        { name: "👤 Người mua", value: `<@${interaction.user.id}>` },
        { name: "📦 Vật phẩm", value: `${formatName(order.type)} (${order.time})` },
        { name: "💰 Giá", value: `${order.price.toLocaleString()}đ` }
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`approve_${interaction.user.id}`).setLabel("✅ Duyệt").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`reject_${interaction.user.id}`).setLabel("❌ Từ chối").setStyle(ButtonStyle.Danger)
    );

    await logChannel.send({ embeds: [embed], components: [row] });

    // 🔥 REMOVE BUTTON
    await interaction.update({ components: [] });

    return interaction.followUp({
      content: "🧾 Đã gửi đơn hàng. Vui lòng chờ duyệt!",
      ephemeral: true
    });
  }
});

client.login(TOKEN);
