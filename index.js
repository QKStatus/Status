require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  PermissionsBitField,
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
  intents: [GatewayIntentBits.Guilds]
});

function loadData() {
  return JSON.parse(fs.readFileSync("./data.json"));
}

function saveData(data) {
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
}

// ===== TEMP =====
const orders = new Map();

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

// ===== BUTTON =====
function createButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("edit_status").setLabel("⚙️ Trạng Thái").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("download_menu").setLabel("📥 Tải Tool").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("buy_proxy").setLabel("💰 Buy Proxy").setStyle(ButtonStyle.Success)
    )
  ];
}

// ===== MENU =====
function toolMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("select_tool")
      .addOptions(["Fluorite","Migul VN","Sonic","Proxy Aim"].map(t => ({label:t,value:t})))
  );
}

function statusMenu(tool) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`set_${tool}`)
      .addOptions([
        { label: "🟢 Safe", value: "safe" },
        { label: "🔴 Update", value: "update" }
      ])
  );
}

function proxyMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("proxy_type")
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
function createQR(amount, userId, type, time) {
  const nameMap = {
    drag_anten: "Drag Anten",
    drag_noanten: "Drag NoAnten",
    body_noanten: "Body NoAnten"
  };
  const content = `BUY ${nameMap[type]} ${time} ID${userId}`;
  return `https://img.vietqr.io/image/${BANK_NAME}-${BANK_ACC}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(content)}`;
}

// ===== READY =====
client.once("ready", async () => {
  console.log(`✅ ${client.user.tag}`);

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

  const data = loadData();

  // ===== STATUS =====
  if (interaction.customId === "edit_status") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return interaction.reply({ content: "❌ Không phải admin", ephemeral: true });

    return interaction.reply({ content: "Chọn tool:", components: [toolMenu()], ephemeral: true });
  }

  if (interaction.customId === "select_tool") {
    return interaction.update({
      content: "Chọn trạng thái:",
      components: [statusMenu(interaction.values[0])]
    });
  }

  if (interaction.customId.startsWith("set_")) {
    const tool = interaction.customId.replace("set_", "");
    data[tool] = interaction.values[0];
    saveData(data);

    const ch = await client.channels.fetch(CHANNEL_ID);
    const msg = await ch.messages.fetch(data.messageId);

    await msg.edit({ embeds: [createEmbed(data)], components: createButtons() });

    return interaction.update({ content: "✅ Đã cập nhật", components: [] });
  }

  // ===== BUY =====
  if (interaction.customId === "buy_proxy") {
    return interaction.reply({ content: "Chọn loại:", components: [proxyMenu()], ephemeral: true });
  }

  if (interaction.customId === "proxy_type") {
    return interaction.update({ content: "Chọn gói:", components: [timeMenu(interaction.values[0])] });
  }

  if (interaction.customId.startsWith("time_")) {
    const type = interaction.customId.replace("time_", "");
    const time = interaction.values[0];
    const price = prices[type][time];

    orders.set(interaction.user.id, { type, time, price });

    const qr = createQR(price, interaction.user.id, type, time);

    const confirm = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("confirm_bank").setLabel("✅ Xác nhận bank").setStyle(ButtonStyle.Success)
    );

    const embed = new EmbedBuilder()
      .setTitle("💳 Thanh toán")
      .setImage(qr)
      .addFields(
        { name: "Gói", value: `${type} (${time})` },
        { name: "Giá", value: `${price}K` }
      );

    return interaction.update({ embeds: [embed], components: [confirm] });
  }

  // ===== CONFIRM =====
  if (interaction.customId === "confirm_bank") {
    const order = orders.get(interaction.user.id);
    if (!order) return;

    const logCh = await client.channels.fetch(LOG_CHANNEL_ID);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`approve_${interaction.user.id}`).setLabel("✅ Duyệt").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`deny_${interaction.user.id}`).setLabel("❌ Từ chối").setStyle(ButtonStyle.Danger)
    );

    await logCh.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🧾 Đơn hàng")
          .addFields(
            { name: "User", value: `<@${interaction.user.id}>` },
            { name: "Gói", value: `${order.type} (${order.time})` },
            { name: "Giá", value: `${order.price}K` }
          )
      ],
      components: [row]
    });

    return interaction.reply({ content: "🧾 Đã gửi chờ admin duyệt", ephemeral: true });
  }

  // ===== DUYỆT =====
  if (interaction.customId.startsWith("approve_")) {
    const userId = interaction.customId.split("_")[1];

    const modal = new ModalBuilder()
      .setCustomId(`key_${userId}`)
      .setTitle("Nhập Key");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("key_input")
          .setLabel("Nhập key")
          .setStyle(TextInputStyle.Short)
      )
    );

    return interaction.showModal(modal);
  }

  // ===== SUBMIT KEY =====
  if (interaction.customId.startsWith("key_")) {
    const userId = interaction.customId.split("_")[1];
    const key = interaction.fields.getTextInputValue("key_input");

    const user = await client.users.fetch(userId);

    await user.send(`🔑 Key của bạn: **${key}**`);

    return interaction.reply({ content: "✅ Đã gửi key", ephemeral: true });
  }

  // ===== TỪ CHỐI =====
  if (interaction.customId.startsWith("deny_")) {
    const userId = interaction.customId.split("_")[1];

    const user = await client.users.fetch(userId);

    await user.send("❌ Không có đâu cháu ơi");

    return interaction.reply({ content: "❌ Đã từ chối", ephemeral: true });
  }
});

client.login(TOKEN);
