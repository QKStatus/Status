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
      "Cheat iOS": "safe"
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

// ===== EMBED TRẠNG THÁI =====
function createEmbed(data) {
  const embed = new EmbedBuilder()
    .setTitle("🚀 TRẠNG THÁI HACK")
    .setDescription("📢 Cập nhật mới nhất\n🟢 SAFE | 🔴 UPDATE\n")
    .setColor(0x00AEFF);

  const tools = ["Fluorite", "Migul VN", "Sonic", "Proxy Aim", "Cheat iOS"];

  let desc = "";
  tools.forEach(t => {
    const status = data[t] || "safe";
    const icon = status === "safe" ? "🟢" : "🔴";
    desc += `**${t}** : ${icon} ${status.toUpperCase()}\n`;
  });

  embed.setDescription(embed.data.description + "\n" + desc);
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
        { label: "🟢 An Toàn", value: "safe" },
        { label: "🔴 Cập Nhật", value: "update" }
      ])
  );
}

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
        { label: `Tuần - ${p.week}`, value: "week" },
        { label: `Tháng - ${p.month}`, value: "month" }
      ])
  );
}

// ===== QR =====
function createQR(amount, userId, type, time, orderId) {
  const content = `${orderId} | ${type} ${time} | ID${userId}`;
  return `https://img.vietqr.io/image/${BANK_NAME}-${BANK_ACC}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(content)}`;
}

// ===== READY =====
client.once("clientReady", async () => {
  const data = loadData();
  const ch = await client.channels.fetch(CHANNEL_ID);

  const msg = await ch.send({
    embeds: [createEmbed(data)],
    components: createButtons()
  });

  data.messageId = msg.id;
  saveData(data);
});

// ===== INTERACTION =====
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;

  // ===== BUY PROXY (FIX) =====
  if (interaction.customId === "buy_proxy") {
    return interaction.reply({
      content: "💰 Chọn proxy:",
      components: [proxyMenu()],
      ephemeral: true
    }).catch(() => {});
  }

  if (interaction.customId === "proxy_type") {
    await interaction.deferUpdate().catch(() => {});
    return interaction.editReply({
      content: "⏳ Chọn HSD:",
      components: [timeMenu(interaction.values[0])]
    });
  }

  if (interaction.customId.startsWith("time_")) {
    await interaction.deferUpdate().catch(() => {});

    const type = interaction.customId.replace("time_", "");
    const time = interaction.values[0];
    const price = prices[type][time];

    const orderId = generateOrderId();
    orders.set(interaction.user.id, { type, time, price, orderId });

    const qr = createQR(price, interaction.user.id, type, time, orderId);

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("💳 Thanh toán")
          .setImage(qr)
          .addFields(
            { name: "🧾 Mã đơn", value: orderId },
            { name: "📦 Gói", value: `${type} (${time})` },
            { name: "💰 Giá", value: `${price}` }
          )
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("confirm_bank").setLabel("✅ Xác nhận").setStyle(ButtonStyle.Success)
        )
      ]
    });
  }

  // ===== GỬI ADMIN =====
  if (interaction.customId === "confirm_bank") {
    const order = orders.get(interaction.user.id);
    const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setTitle("📦 Đơn hàng mới")
      .addFields(
        { name: "🧾 Mã đơn", value: order.orderId },
        { name: "👤 Người mua", value: `<@${interaction.user.id}>` },
        { name: "📦 Vật phẩm", value: `${order.type} (${order.time})` },
        { name: "💰 Giá", value: `${order.price}` }
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`approve_${interaction.user.id}`).setLabel("Duyệt").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`reject_${interaction.user.id}`).setLabel("Từ chối").setStyle(ButtonStyle.Danger)
    );

    await logChannel.send({ embeds: [embed], components: [row] });
    return interaction.reply({ content: "Đã gửi admin!", ephemeral: true });
  }

  // ===== DUYỆT =====
  if (interaction.customId.startsWith("approve_")) {
    const userId = interaction.customId.split("_")[1];

    const modal = new ModalBuilder()
      .setCustomId(`sendkey_${userId}`)
      .setTitle("Nhập key");

    const input = new TextInputBuilder()
      .setCustomId("key")
      .setLabel("Key")
      .setStyle(TextInputStyle.Short);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  // ===== GỬI KEY + UPDATE EMBED =====
  if (interaction.customId.startsWith("sendkey_")) {
    const userId = interaction.customId.split("_")[1];
    const key = interaction.fields.getTextInputValue("key");

    const order = orders.get(userId);
    const expire = getExpireDate(order.time);
    const user = await client.users.fetch(userId);

    await user.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🔰 Đơn Hàng Của Bạn")
          .addFields(
            { name: "🧾 Mã đơn", value: order.orderId },
            { name: "📦 Vật phẩm", value: `${order.type} (${order.time})` },
            { name: "💰 Giá", value: `${order.price}K` },
            { name: "⏳ Thời gian", value: expire },
            { name: "🔑 Key", value: `${key}` }
          )
      ]
    });

    // update admin embed
    await interaction.message.edit({
      embeds: [
        new EmbedBuilder()
          .setTitle("✅ Đã Duyệt Đơn Hàng")
          .addFields(
            { name: "🧾 Mã đơn", value: order.orderId },
            { name: "📦 Vật phẩm", value: `${order.type} (${order.time})` }
            { name: "💰 Giá", value: `${order.price}K` },
            { name: "⏳ Thời gian", value: expire },
            { name: "🔑 Key", value: key }
          )
      ],
      components: []
    });

    return interaction.reply({ content: "Đã Duyệt Đơn Hàng", ephemeral: true });
  }

  // ===== TỪ CHỐI =====
  if (interaction.customId.startsWith("reject_")) {
    const userId = interaction.customId.split("_")[1];
    const order = orders.get(userId);
    const user = await client.users.fetch(userId);

    await user.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌ Bị từ chối")
          .addFields(
             { name: "🧾 Mã đơn", value: order.orderId },
            { name: "📦 Vật phẩm", value: `${order.type} (${order.time})` }
            { name: "💰 Giá", value: `${order.price}K` },
            { name: "⏳ Thời gian", value: expire },
            { name: "🔑 Key", value: "Bank đi rồi ah duyệt key cho }
          )
      ]
    });

    await interaction.message.edit({
      embeds: [new EmbedBuilder().setTitle("❌ Đã Huỷ Đơn Hàng")],
      components: []
    });

    return interaction.reply({ content: "Đã Huỷ Đơn Hàng!", ephemeral: true });
  }
});

client.login(TOKEN);
