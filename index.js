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
const resetOrders = new Map();

// ===== UTIL =====
function generateOrderId() {
  return "HD-" + Math.random().toString(36).substring(2, 8).toUpperCase();
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
    .addFields(
      { name: "💎 FLUORITE", value: status(data["Fluorite"]) },
      { name: "🔥 MIGUL VN", value: status(data["Migul VN"]) },
      { name: "⚡ SONIC", value: status(data["Sonic"]) },
      { name: "🎯 PROXY AIM", value: status(data["Proxy Aim"]) },
      { name: "🤖 DRIP ADR", value: status(data["ADR"]) }
    );
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
        { label: "Drag Anten", value: "Drag_Antena" },
        { label: "Drag NoAnten", value: "Drag_NoAntena" },
        { label: "Body NoAnten", value: "Body_NoAntena" },
        { label: "AimBụng Antena", value: "AimBung_Antena" },
        { label: "AimBụng No Antena", value: "AimBung_NoAntena" }
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
  Fluorite: { week: 280000, month: 550000 },
  Migul_Lite: { week: 150000, month: 350000 },
  Migul_Pro: { week: 225000, month: 450000 },
  ADR: { week: 90000, month: 200000 },
  Sonic: { week: 90000, month: 200000 }
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

// ===== RESET MENU =====
function resetProductMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("reset_product")
      .addOptions([
        { label: "Fluorite", value: "Fluorite" },
        { label: "Migul VN", value: "Migul" },
        { label: "Sonic", value: "Sonic" },
        { label: "Drip ADR", value: "ADR" },
        { label: "Proxy Vip", value: "Proxy_Vip" }
      ])
  );
}

function resetProxyMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("reset_proxy")
      .addOptions([
        { label: "Drag Anten", value: "Drag_Antena" },
        { label: "Drag NoAnten", value: "Drag_NoAntena" },
        { label: "Body NoAnten", value: "Body_NoAntena" },
        { label: "AimBụng Antena", value: "AimBung_Antena" },
        { label: "AimBụng No Antena", value: "AimBung_NoAntena" }
      ])
  );
}

function resetTimeMenu(type) {
  const p = prices[type];
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`reset_time_${type}`)
      .addOptions([
        { label: `Tuần - ${p.week}`, value: "week" },
        { label: `Tháng - ${p.month}`, value: "month" }
      ])
  );
}

// ===== INTERACTION =====
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;

  // ===== RESET =====
  if (interaction.customId === "reset_key") {
    return interaction.reply({ content: "Chọn sản phẩm:", components: [resetProductMenu()], ephemeral: true });
  }

  if (interaction.customId === "reset_product") {
    const type = interaction.values[0];
    resetOrders.set(interaction.user.id, { type });

    if (type === "Proxy_Vip") {
      return interaction.update({ content: "Chọn proxy:", components: [resetProxyMenu()] });
    }

    return interaction.update({ content: "Chọn thời gian:", components: [resetTimeMenu(type)] });
  }

  if (interaction.customId === "reset_proxy") {
    const data = resetOrders.get(interaction.user.id);
    data.type = interaction.values[0];
    return interaction.update({ content: "Chọn thời gian:", components: [resetTimeMenu(data.type)] });
  }

  if (interaction.customId.startsWith("reset_time_")) {
    const type = interaction.customId.replace("reset_time_", "");
    const time = interaction.values[0];
    const price = prices[type][time];
    const orderId = generateOrderId();

    resetOrders.set(interaction.user.id, { type, time, price, orderId });

    const modal = new ModalBuilder()
      .setCustomId("reset_modal")
      .setTitle("Nhập key");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("key").setLabel("Key").setStyle(TextInputStyle.Short)
      )
    );

    return interaction.showModal(modal);
  }

  if (interaction.customId === "reset_modal") {
    const data = resetOrders.get(interaction.user.id);
    const key = interaction.fields.getTextInputValue("key");

    const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);

    const embed = new EmbedBuilder()
      .setTitle("Hoá đơn Reset")
      .setColor("Yellow")
      .addFields(
        { name: "User", value: `<@${interaction.user.id}>` },
        { name: "Gói", value: data.type },
        { name: "Giá", value: `${data.price}` },
        { name: "Key", value: key },
        { name: "Trạng thái", value: "Chưa reset" }
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`approve_reset_${interaction.user.id}`).setLabel("Duyệt").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`reject_reset_${interaction.user.id}`).setLabel("Từ chối").setStyle(ButtonStyle.Danger)
    );

    await logChannel.send({ embeds: [embed], components: [row] });

    return interaction.reply({ content: "Đã gửi!", ephemeral: true });
  }

  if (interaction.customId.startsWith("approve_reset_")) {
    const userId = interaction.customId.split("_")[2];
    const user = await client.users.fetch(userId);

    const old = interaction.message.embeds[0];

    const updated = EmbedBuilder.from(old)
      .setColor("Green")
      .setFields(
        ...old.fields.filter(f => f.name !== "Trạng thái"),
        { name: "Trạng thái", value: "Đã reset" }
      );

    await interaction.message.edit({ embeds: [updated], components: [] });
    await user.send({ embeds: [updated] });

    return interaction.reply({ content: "Đã duyệt!", ephemeral: true });
  }

  if (interaction.customId.startsWith("reject_reset_")) {
    const userId = interaction.customId.split("_")[2];
    const user = await client.users.fetch(userId);

    const old = interaction.message.embeds[0];

    const updated = EmbedBuilder.from(old)
      .setColor("Red")
      .setFields(
        ...old.fields.filter(f => f.name !== "Trạng thái"),
        { name: "Trạng thái", value: "Chưa reset" }
      );

    await interaction.message.edit({ embeds: [updated], components: [] });
    await user.send({ embeds: [updated] });

    return interaction.reply({ content: "Đã từ chối!", ephemeral: true });
  }
});

client.login(TOKEN);
