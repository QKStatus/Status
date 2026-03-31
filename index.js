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

// ===== MÃ ĐƠN =====
function generateOrderId() {
  return "HD" + Math.floor(Math.random() * 1000000);
}

// ===== HẠN =====
function getExpireDate(time) {
  const now = new Date();
  if (time === "week") now.setDate(now.getDate() + 7);
  if (time === "month") now.setMonth(now.getMonth() + 1);
  return now.toLocaleString("vi-VN");
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

// ===== PROXY =====
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
  console.log(`✅ ${client.user.tag}`);

  const data = loadData();
  const ch = await client.channels.fetch(CHANNEL_ID);

  if (data.messageId) {
    try {
      const msg = await ch.messages.fetch(data.messageId);
      await msg.edit({ embeds: [createEmbed(data)], components: createButtons() });
      return;
    } catch {}
  }

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

  // ===== DOWNLOAD =====
  if (interaction.customId === "download_menu") {
    return interaction.reply({
      content: "📥 Chọn tool để tải:",
      components: [downloadMenu()],
      ephemeral: true
    });
  }

  if (interaction.customId === "download_select") {
    await interaction.deferUpdate();

    const choice = interaction.values[0];

    const links = {
      flu: "https://www.mediafire.com/file/z1lnm953slckxl0/FF_1.120.1_1.8.1.ipa/file",
      migul: "https://www.mediafire.com/file/7xjc7fqb7xybbys/Free_Fire_1.120.1_1774083029.ipa/file",
      sonic: "https://www.mediafire.com/file/69ym6nmiye9cuwd/Free_Fire_1.120.1_1773767109.ipa/file"
    };

    if (choice === "proxy") {
      return interaction.editReply({
        content: "🔒 Proxy không có link tải.\n👉 Vui lòng mua để được cấp!",
        embeds: [],
        components: []
      });
    }

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("📥 Link tải")
          .setColor(0x00ff99)
          .setDescription(`[Click để tải](${links[choice]})`)
      ],
      components: []
    });
  }

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
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return interaction.reply({ content: "❌ Không phải admin", ephemeral: true });

    await interaction.deferUpdate();

    const tool = interaction.customId.replace("set_", "");
    data[tool] = interaction.values[0];
    saveData(data);

    const ch = await client.channels.fetch(CHANNEL_ID);
    const msg = await ch.messages.fetch(data.messageId);

    await msg.edit({ embeds: [createEmbed(data)], components: createButtons() });
  }

  // ===== BUY / APPROVE / DENY / KEY (giữ nguyên như bản trước) =====
});

client.login(TOKEN);
