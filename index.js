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
  TextInputStyle
} = require("discord.js");

const fs = require("fs");

// ===== ENV =====
const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const BANK_ACC = process.env.BANK_ACC;
const BANK_NAME = process.env.BANK_NAME || "MB";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
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
      "Proxy Aim": "safe"
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
  return "HD" + Math.floor(Math.random() * 1000000);
}

// ===== EMBED =====
function createEmbed(data) {
  const embed = new EmbedBuilder()
    .setTitle("📢 Thông Báo Update Hack")
    .setColor(0x00AEFF);

  ["Fluorite", "Migul VN", "Sonic", "Proxy Aim"].forEach(t => {
    const icon = data[t] === "safe" ? "🟢" : "🔴";
    embed.addFields({ name: t, value: `${icon} ${data[t].toUpperCase()}` });
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

function downloadMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("download_select")
      .addOptions([
        { label: "Fluorite", value: "flu" },
        { label: "Migul VN", value: "migul" },
        { label: "Sonic", value: "sonic" },
        { label: "Proxy", value: "proxy" }
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
        { label: `Week - ${p.week}K`, value: "week" },
        { label: `Month - ${p.month}K`, value: "month" }
      ])
  );
}

// ===== QR =====
function createQR(amount, userId, type, time, orderId) {
  const content = `HD:${orderId} | ${type} ${time} | ID${userId}`;
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

  // ===== STATUS =====
  if (interaction.customId === "edit_status") {
    return interaction.reply({
      content: "⚙️ Chức năng đang cập nhật...",
      ephemeral: true
    });
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
      sonic: "https://www.mediafire.com/file/yyy"
    };

    if (interaction.values[0] === "proxy") {
      return interaction.editReply({ content: "🔒 Phải mua mới có!", components: [] });
    }

    return interaction.editReply({
      embeds: [new EmbedBuilder().setTitle("📥 Link").setDescription(links[interaction.values[0]])],
      components: []
    });
  }

  // ===== BUY =====
  if (interaction.customId === "buy_proxy") {
    return interaction.reply({
      content: "💰 Chọn loại proxy:",
      components: [proxyMenu()],
      ephemeral: true
    });
  }

  if (interaction.customId === "proxy_type") {
    await interaction.deferUpdate();
    return interaction.editReply({
      content: "⏳ Chọn thời gian:",
      components: [timeMenu(interaction.values[0])]
    });
  }

  if (interaction.customId.startsWith("time_")) {
    await interaction.deferUpdate();

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

  // ===== SEND ADMIN =====
  if (interaction.customId === "confirm_bank") {
    const order = orders.get(interaction.user.id);
    if (!order) return interaction.reply({ content: "❌ Không có đơn!", ephemeral: true });

    const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setTitle("📩 Đơn hàng mới")
      .addFields(
        { name: "👤 Người mua", value: `<@${interaction.user.id}>` },
        { name: "📦 Gói", value: `${order.type} (${order.time})` },
        { name: "💰 Giá", value: `${order.price}K` },
        { name: "🧾 Mã đơn", value: order.orderId }
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`approve_${interaction.user.id}`).setLabel("✅ Duyệt").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`reject_${interaction.user.id}`).setLabel("❌ Từ chối").setStyle(ButtonStyle.Danger)
    );

    await logChannel.send({ embeds: [embed], components: [row] });

    return interaction.reply({ content: "🧾 Đã gửi admin!", ephemeral: true });
  }

  // ===== APPROVE =====
  if (interaction.customId.startsWith("approve_")) {
    const userId = interaction.customId.split("_")[1];

    const modal = new ModalBuilder()
      .setCustomId(`sendkey_${userId}`)
      .setTitle("Nhập key gửi khách");

    const input = new TextInputBuilder()
      .setCustomId("key")
      .setLabel("Nhập key")
      .setStyle(TextInputStyle.Short);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    return interaction.showModal(modal);
  }

  // ===== MODAL =====
  if (interaction.customId.startsWith("sendkey_")) {
    const userId = interaction.customId.split("_")[1];
    const key = interaction.fields.getTextInputValue("key");

    const user = await client.users.fetch(userId);

    await user.send(`🔑 Key của bạn: ${key}`);

    return interaction.reply({ content: "✅ Đã gửi key!", ephemeral: true });
  }

  // ===== REJECT =====
  if (interaction.customId.startsWith("reject_")) {
    const userId = interaction.customId.split("_")[1];
    const user = await client.users.fetch(userId);

    await user.send("Bỏ tiền ra đi sẽ có nhé em 😏");

    return interaction.reply({ content: "❌ Đã từ chối!", ephemeral: true });
  }
});

client.login(TOKEN);
