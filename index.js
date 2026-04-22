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
      "Tipa Migul": "safe",
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
  const map = {
    Drag_Antena: "Drag Antena",
    Drag_NoAntena: "Drag No Antena",
    Body_NoAntena: "Body No Antena",
    Bung_Antena: "Bụng Antena",
    Bung_NoAntena: "Bụng No Antena",
    Migul_Lite: "Migul VN [Lite]",
    Migul_Pro: "Migul VN [Pro]"
  };
  return map[type] || type;
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
      { name: "👑 FLUORITE", value: status(data["Fluorite"]) },
      { name: "💎 MIGUL VN", value: status(data["Migul VN"]) },
      { name: "⭐️ TIPA MIGUL", value: status(data["Tipa Migul"]) },
      { name: "🌐 PROXY AIM", value: status(data["Proxy Aim"]) },
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
      new ButtonBuilder().setCustomId("buy_proxy").setLabel("🛒 Buy Key").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("download_menu").setLabel("📥 Link Tải").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("edit_status").setLabel("👑 ADMIN").setStyle(ButtonStyle.Primary)
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
        { label: "Tipa Migul", value: "Tipa Migul" },
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
        { label: "Tipa Migul", value: "tipa" },
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
      .setPlaceholder("🛒 Chọn Key")
      .addOptions([
        { label: "🌐 Proxy Vip", value: "proxy_vip" },
        { label: "👑 Fluorite", value: "Fluorite" },
        { label: "💎 Migul VN", value: "Migul" },
        { label: "🤖 Drip ADR", value: "ADR" },
        { label: "⭐️ Tipa Migul", value: "Tipa_Migul" }
      ])
  );
}

function proxyVipMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("proxy_vip_type")
      .setPlaceholder("🌐 Select Proxy ")
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
  Body_NoAntena: { week: 90000, month: 180000 },
  Bung_Antena: { week: 100000, month: 200000 },
  Bung_NoAntena: { week: 100000, month: 200000 },

  Fluorite: { day: 110000, week: 280000, month: 550000 },
  Migul_Lite: { day: 50000, week: 150000, month: 350000 },
  Migul_Pro: { day: 90000, week: 225000, month: 450000 },
  ADR: { week: 90000, month: 200000 },
  Tipa_Migul: { week: 70000, month: 150000 }
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

// ===== READY (FIX RESET) =====
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
    } else {
      const msg = await ch.send({
        embeds: [createEmbed(data)],
        components: createButtons()
      });
      data.messageId = msg.id;
      saveData(data);
    }
  } catch {
    const msg = await ch.send({
      embeds: [createEmbed(data)],
      components: createButtons()
    });
    data.messageId = msg.id;
    saveData(data);
  }

  console.log("🤖 Bot online");
});

// ===== INTERACTION =====
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;

  // ===== ADMIN =====
  if (interaction.customId === "edit_status") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: "⚠️ Mày đéo phải Admin OK !?!", ephemeral: true });
    }
    return interaction.reply({ content: "⚙️ Chọn Hack:", components: [statusToolMenu()], ephemeral: true });
  }

  if (interaction.customId === "status_tool") {
    return interaction.update({
      content: "🛠 Edit:",
      components: [statusValueMenu(interaction.values[0])]
    });
  }

  if (interaction.customId.startsWith("status_value_")) {
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

    return interaction.update({ content: "✅ Đã chỉnh sửa!", components: [] });
  }

  // ===== DOWNLOAD =====
  if (interaction.customId === "download_menu") {
    return interaction.reply({ content: "📥 Chọn hack:", components: [downloadMenu()], ephemeral: true });
  }

  if (interaction.customId === "download_select") {
    await interaction.deferUpdate();

    const links = {
      flu: "https://www.mediafire.com/file/jwvk91kyhd1hdag/ob53_1.7.4.ipa/file",
      migul: "https://ipa.authtool.app/view/69e42db7e95f3e47a8152b8f",
      tipa: "Chưa Update",
      adr: "https://www.mediafire.com/file/bie03xh4vag0edx/DRIPCLIENT_V1.3.TP.apks/file"
    };

    if (interaction.values[0] === "proxy") {
      return interaction.editReply({ content: "🔒 Mua để được cấp Pem & Port!", components: [] });
    }

    return interaction.editReply({
      embeds: [new EmbedBuilder().setTitle("📥 Link tải").setDescription(links[interaction.values[0]])],
      components: []
    });
  }

  // ===== BUY =====
  if (interaction.customId === "buy_proxy") {
    return interaction.reply({ content: "🛒 Chọn loại:", components: [proxyMenu()], ephemeral: true });
  }

  if (interaction.customId === "proxy_type") {
    await interaction.deferUpdate();

    if (interaction.values[0] === "proxy_vip") {
      return interaction.editReply({
        content: "🔥 Chọn Proxy:",
        components: [proxyVipMenu()]
      });
    }

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

  if (interaction.customId === "proxy_vip_type") {
    await interaction.deferUpdate();
    return interaction.editReply({
      content: "⏳ Chọn thời gian:",
      components: [timeMenu(interaction.values[0])]
    });
  }

  if (interaction.customId === "migul_type") {
    await interaction.deferUpdate();
    return interaction.editReply({
      content: "⏳ Chọn thời gian:",
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
            { name: "💰 Giá", value: `${price.toLocaleString()}đ` },
            { name: "⚠️ Lưu ý", value: `Vui lòng bank xong mới Done` } 
          )
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("confirm_bank").setLabel("✅ Done").setStyle(ButtonStyle.Success)
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
        { name: "📦 Gói", value: `${formatName(order.type)} (${order.time})` },
        { name: "💰 Giá", value: `${order.price.toLocaleString()}đ` }
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`approve_${interaction.user.id}`).setLabel("🔑 Key").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`reject_${interaction.user.id}`).setLabel("❌ Huỷ").setStyle(ButtonStyle.Danger)
    );

    await logChannel.send({ embeds: [embed], components: [row] });

    await interaction.update({ components: [] });

    return interaction.followUp({ content: "🧾 Đã gửi đơn! Nếu xác nhận trước khi bank bot sẽ tự từ chối!", ephemeral: true });
  }

  // ===== APPROVE =====
// ===== APPROVE BUTTON =====
if (interaction.customId.startsWith("approve_")) {
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({ content: "❌ Chỉ admin!", ephemeral: true });
  }

  const userId = interaction.customId.split("_")[1];

  const modal = new ModalBuilder()
    .setCustomId(`sendkey_${userId}`)
    .setTitle("Nhập key");

  const input = new TextInputBuilder()
    .setCustomId("key")
    .setLabel("Key")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(input));

  return interaction.showModal(modal);
}


// ===== MODAL SUBMIT (SEND KEY) =====
if (interaction.isModalSubmit() && interaction.customId.startsWith("sendkey_")) {
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({ content: "❌ Chỉ admin!", ephemeral: true });
  }

  const userId = interaction.customId.split("_")[1];
  const key = interaction.fields.getTextInputValue("key");

  const order = orders.get(userId);
  if (!order) {
    return interaction.reply({ content: "❌ Đơn không tồn tại!", ephemeral: true });
  }

  const expire = getExpireDate(order.time);

  try {
    const user = await client.users.fetch(userId);

    await user.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🧾 Hoá đơn")
          .setColor("Green")
          .addFields(
            { name: "🧾 Mã đơn", value: order.orderId },
            { name: "📦 Gói", value: `${formatName(order.type)} (${order.time})` },
            { name: "💰 Giá", value: `${order.price.toLocaleString()}đ` },
            { name: "⏳ HSD", value: expire },
            { name: "🔑 Key", value: `\`${key}\`` },
            { name: "✅ Trạng thái", value: "Đã duyệt" }
          )
      ]
    });
  } catch (err) {
    return interaction.reply({
      content: "❌ Không thể gửi DM cho user (user tắt DM)!",
      ephemeral: true
    });
  }

  // ===== UPDATE EMBED ADMIN =====
  const oldEmbed = interaction.message.embeds[0];

  const updatedEmbed = EmbedBuilder.from(oldEmbed)
    .setColor("Green")
    .setFields(
      ...oldEmbed.fields.filter(f => !f.name.includes("Trạng thái")),
      { name: "✅ Trạng thái", value: "Đã duyệt" }
    );

  await interaction.message.edit({
    embeds: [updatedEmbed],
    components: []
  });

  orders.delete(userId);

  return interaction.reply({ content: "✅ Đã duyệt!", ephemeral: true });
}

  // ===== REJECT =====
if (interaction.customId.startsWith("reject_")) {
  const userId = interaction.customId.split("_")[1];
  const order = orders.get(userId);

  if (!order) {
    return interaction.reply({ content: "❌ Đơn không tồn tại!", ephemeral: true });
  }

  const user = await client.users.fetch(userId);
  const expire = getExpireDate(order.time);

  // 🔑 Có thể random key fake hoặc để "Không có"
  const fakeKey = "NULL-KEY-REJECT";

  // ===== GỬI EMBED GIỐNG DUYỆT =====
  await user.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("🧾 Hoá đơn")
        .setColor("Red")
        .addFields(
          { name: "🧾 Mã đơn", value: order.orderId },
          { name: "📦 Gói", value: `${formatName(order.type)} (${order.time})` },
          { name: "💰 Giá", value: `${order.price.toLocaleString()}đ` },
          { name: "⏳ HSD", value: expire },
          { name: "⚠️ Cảnh báo", value: `Đơn đã bị huỷ` }
        )
    ]
  });

  // ===== UPDATE EMBED ADMIN =====
  const oldEmbed = interaction.message.embeds[0];
  const updatedEmbed = EmbedBuilder.from(oldEmbed)
    .setColor("Red")
    .setFields(
      ...oldEmbed.fields.filter(f => !f.name.includes("Trạng thái")),
      { name: "❌ Trạng thái", value: "Đã từ chối" }
    );

  await interaction.message.edit({ embeds: [updatedEmbed], components: [] });

  orders.delete(userId);

  return interaction.reply({ content: "❌ Đã từ chối!", ephemeral: true });
}
});

client.login(TOKEN);
