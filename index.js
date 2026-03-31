require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  PermissionsBitField
} = require("discord.js");

const fs = require("fs");

// ===== ENV =====
const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const BANK_ACC = process.env.BANK_ACC;
const BANK_NAME = process.env.BANK_NAME || "MB";

// ===== BOT =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== DATA =====
function loadData() {
  return JSON.parse(fs.readFileSync("./data.json"));
}

function saveData(data) {
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
}

// ===== ORDER TEMP =====
const orders = new Map();

// ===== EMBED PANEL =====
function createEmbed(data) {
  const embed = new EmbedBuilder()
    .setTitle("📢 Thông Báo Update Hack")
    .setColor(0x00AEFF);

  const tools = ["Fluorite", "Migul VN", "Sonic", "Proxy Aim"];

  tools.forEach(t => {
    let status = data[t];
    let icon = status === "safe" ? "🟢" : "🔴";

    embed.addFields({
      name: t,
      value: `${icon} ${status.toUpperCase()}`,
      inline: false
    });
  });

  return embed;
}

// ===== BUTTON =====
function createButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("edit_status")
        .setLabel("⚙️ Trạng Thái")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("download_menu")
        .setLabel("📥 Tải Tool")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("buy_proxy")
        .setLabel("💰 Buy Proxy")
        .setStyle(ButtonStyle.Success)
    )
  ];
}

// ===== MENU =====
function downloadMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("select_download")
      .setPlaceholder("Chọn tool")
      .addOptions([
        { label: "Fluorite", value: "Fluorite" },
        { label: "Migul VN", value: "Migul VN" },
        { label: "Sonic", value: "Sonic" },
        { label: "Proxy Aim", value: "Proxy Aim" }
      ])
  );
}

function proxyMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("proxy_type")
      .setPlaceholder("Chọn loại proxy")
      .addOptions([
        { label: "🔥 Drag Anten", value: "drag_anten" },
        { label: "⚡ Drag NoAnten", value: "drag_noanten" },
        { label: "🎯 Body NoAnten", value: "body_noanten" }
      ])
  );
}

const prices = {
  drag_anten: { week: 100, month: 200 },
  drag_noanten: { week: 125, month: 225 },
  body_noanten: { week: 80, month: 170 }
};

function timeMenu(type) {
  const price = prices[type];

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`time_${type}`)
      .setPlaceholder("Chọn gói")
      .addOptions([
        { label: `🗓 Week - ${price.week}K`, value: "week" },
        { label: `📆 Month - ${price.month}K`, value: "month" }
      ])
  );
}

// ===== QR =====
function createQR(amount, userId, type, time) {
  const nameMap = {
    drag_anten: "Drag Anten",
    drag_noanten: "Drag NoAnten",
    body_noanten: "Body NoAnten"
  };

  const content = `BUY ${nameMap[type]} ${time.toUpperCase()} ID${userId}`;

  return `https://img.vietqr.io/image/${BANK_NAME}-${BANK_ACC}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(content)}`;
}

// ===== READY =====
client.once("ready", async () => {
  console.log(`✅ ${client.user.tag}`);

  const data = loadData();
  const channel = await client.channels.fetch(CHANNEL_ID);

  const msg = await channel.send({
    embeds: [createEmbed(data)],
    components: createButtons()
  });

  data.messageId = msg.id;
  saveData(data);
});

// ===== INTERACTION =====
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  const data = loadData();

  // ===== DOWNLOAD =====
  if (interaction.customId === "download_menu") {
    return interaction.reply({
      content: "Chọn tool:",
      components: [downloadMenu()],
      ephemeral: true
    });
  }

  if (interaction.customId === "select_download") {
    const tool = interaction.values[0];

    const links = {
      "Fluorite": "https://www.mediafire.com/file/z1lnm953slckxl0/FF_1.120.1_1.8.1.ipa/file",
      "Migul VN": "https://www.mediafire.com/file/7xjc7fqb7xybbys/Free_Fire_1.120.1_1774083029.ipa/file",
      "Sonic": "https://www.mediafire.com/file/69ym6nmiye9cuwd/Free_Fire_1.120.1_1773767109.ipa/file",
      "Proxy Aim": "❌ Mua để có link"
    };

    return interaction.reply({
      content: `📥 ${tool}: ${links[tool]}`,
      ephemeral: true
    });
  }

  // ===== BUY =====
  if (interaction.customId === "buy_proxy") {
    return interaction.reply({
      content: "Chọn loại:",
      components: [proxyMenu()],
      ephemeral: true
    });
  }

  if (interaction.customId === "proxy_type") {
    const type = interaction.values[0];

    return interaction.update({
      content: "Chọn gói:",
      components: [timeMenu(type)]
    });
  }

  // ===== CHỌN GÓI =====
  if (interaction.customId.startsWith("time_")) {
    const type = interaction.customId.replace("time_", "");
    const time = interaction.values[0];

    const price = prices[type][time];
    const qr = createQR(price, interaction.user.id, type, time);

    orders.set(interaction.user.id, { type, time, price });

    const confirmBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirm_bank")
        .setLabel("✅ Xác nhận bank")
        .setStyle(ButtonStyle.Success)
    );

    const embed = new EmbedBuilder()
      .setTitle("💳 Thanh Toán Proxy")
      .addFields(
        { name: "👤 User", value: `<@${interaction.user.id}>` },
        { name: "📦 Gói", value: `${type} (${time})` },
        { name: "💰 Giá", value: `${price}K` }
      )
      .setImage(qr)
      .setColor("Blue");

    return interaction.update({
      embeds: [embed],
      components: [confirmBtn],
      content: ""
    });
  }

  // ===== CONFIRM =====
  if (interaction.customId === "confirm_bank") {
    const order = orders.get(interaction.user.id);

    if (!order) {
      return interaction.reply({
        content: "❌ Không có đơn hàng",
        ephemeral: true
      });
    }

    const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setTitle("🧾 Hoá Đơn Mua Proxy")
      .addFields(
        { name: "Tên người mua", value: `<@${interaction.user.id}>` },
        { name: "Vật phẩm mua", value: `${order.type} (${order.time})` },
        { name: "Giá trị", value: `${order.price}K` },
        { name: "Thời gian", value: `<t:${Math.floor(Date.now()/1000)}:F>` }
      )
      .setColor("Yellow");

    await logChannel.send({ embeds: [embed] });

    return interaction.reply({
      content: "🧾 Hoá đơn của bạn đã được tạo vui lòng đợi admin xác nhận và duyệt",
      ephemeral: true
    });
  }
});

// ===== START =====
client.login(TOKEN);
