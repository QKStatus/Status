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

// ===== EMBED STATUS =====
function createEmbed(data) {
  const embed = new EmbedBuilder()
    .setTitle("📢 Thông Báo Update Hack")
    .setColor(0x00AEFF);

  const tools = ["Fluorite", "Migul VN", "Sonic", "Proxy Aim", "Cheat iOS"];

  tools.forEach(t => {
    const status = data[t] || "safe";
    const icon = status === "safe" ? "🟢" : "🔴";

    embed.addFields({
      name: `${t} : ${icon} ${status.toUpperCase()}`,
      value: "‎"
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

  // ===== BUY PROXY =====
  if (interaction.customId === "buy_proxy") {
    return interaction.reply({
      content: "💰 Chọn loại proxy:",
      components: [proxyMenu()],
      ephemeral: true
    });
  }

  if (interaction.customId === "proxy_type") {
    return interaction.update({
      content: "⏳ Chọn thời gian:",
      components: [timeMenu(interaction.values[0])]
    });
  }

  if (interaction.customId.startsWith("time_")) {
    const type = interaction.customId.replace("time_", "");
    const time = interaction.values[0];
    const price = prices[type][time];

    const orderId = generateOrderId();
    orders.set(interaction.user.id, { type, time, price, orderId });

    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setTitle("💳 Thanh toán")
          .addFields(
            { name: "🧾 Mã đơn", value: orderId },
            { name: "📦 Gói", value: `${type} (${time})` },
            { name: "💰 Giá", value: `${price}K` }
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
      .setTitle("📦 Đơn hàng")
      .addFields(
        { name: "🧾 Mã đơn", value: order.orderId },
        { name: "📦 Vật phẩm", value: `${order.type} (${order.time})` },
        { name: "💰 Giá", value: `${order.price}K` },
        { name: "📊 Trạng thái", value: "⏳ Chờ duyệt" }
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

  if (interaction.customId.startsWith("sendkey_")) {
    const userId = interaction.customId.split("_")[1];
    const key = interaction.fields.getTextInputValue("key");

    const order = orders.get(userId);
    const expire = getExpireDate(order.time);
    const user = await client.users.fetch(userId);

    await user.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🧾 Hoá đơn")
          .addFields(
            { name: "🧾 Mã đơn", value: order.orderId },
            { name: "📦 Vật phẩm", value: `${order.type} (${order.time})` },
            { name: "💰 Giá", value: `${order.price}K` },
            { name: "⏳ Thời gian", value: expire },
            { name: "🔑 Key", value: `\`${key}\`` }
          )
      ]
    });

    await interaction.message.edit({
      embeds: [
        new EmbedBuilder()
          .setTitle("📦 Đơn hàng")
          .addFields(
            { name: "🧾 Mã đơn", value: order.orderId },
            { name: "📦 Vật phẩm", value: `${order.type} (${order.time})` },
            { name: "💰 Giá", value: `${order.price}K` },
            { name: "📊 Trạng thái", value: "✅ Đã duyệt" }
          )
      ],
      components: []
    });

    return interaction.reply({ content: "Đã duyệt!", ephemeral: true });
  }

  // ===== TỪ CHỐI =====
  if (interaction.customId.startsWith("reject_")) {
    const userId = interaction.customId.split("_")[1];
    const order = orders.get(userId);
    const user = await client.users.fetch(userId);

    await user.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🧾 Hoá đơn")
          .addFields(
            { name: "🧾 Mã đơn", value: order.orderId },
            { name: "📦 Vật phẩm", value: `${order.type} (${order.time})` },
            { name: "💰 Giá", value: `${order.price}K` },
            { name: "🔑 Key", value: "`Bank để nhận key`" }
          )
      ]
    });

    await interaction.message.edit({
      embeds: [
        new EmbedBuilder()
          .setTitle("📦 Đơn hàng")
          .addFields(
            { name: "🧾 Mã đơn", value: order.orderId },
            { name: "📦 Vật phẩm", value: `${order.type} (${order.time})` },
            { name: "💰 Giá", value: `${order.price}K` },
            { name: "📊 Trạng thái", value: "❌ Đã từ chối" }
          )
      ],
      components: []
    });

    return interaction.reply({ content: "Đã từ chối!", ephemeral: true });
  }
});

client.login(TOKEN);
