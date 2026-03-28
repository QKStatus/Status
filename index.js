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

if (!TOKEN || !CHANNEL_ID) {
  console.log("❌ Thiếu TOKEN hoặc CHANNEL_ID trong .env");
  process.exit(0);
}

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

// ===== EMBED =====
function createEmbed(data) {
  const embed = new EmbedBuilder()
    .setTitle("📢 Status Tools")
    .setColor(0x00AEFF)
    .setTimestamp();

  const tools = ["Fluorite", "Migul VN", "Sonic", "Proxy Aim"];

  tools.forEach(name => {
    let status = data[name];
    let icon = status === "safe" ? "🟢" : "🔴";
    let text = status === "safe" ? "Safe" : "Update";

    embed.addFields({
      name: `🔹 ${name}`,
      value: `Status: ${icon} ${text}`,
      inline: false
    });
  });

  return embed;
}

// ===== BUTTON =====
function createButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("edit_status")
      .setLabel("⚙️ Chỉnh trạng thái")
      .setStyle(ButtonStyle.Primary)
  );
}

// ===== MENU =====
function toolMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("select_tool")
      .setPlaceholder("Chọn tool")
      .addOptions([
        { label: "Fluorite", value: "Fluorite" },
        { label: "Migul VN", value: "Migul VN" },
        { label: "Sonic", value: "Sonic" },
        { label: "Proxy Aim", value: "Proxy Aim" }
      ])
  );
}

function statusMenu(tool) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`set_${tool}`)
      .setPlaceholder(`Chọn trạng thái cho ${tool}`)
      .addOptions([
        { label: "🟢 Safe", value: "safe" },
        { label: "🔴 Update", value: "update" }
      ])
  );
}

// ===== READY =====
client.once("ready", async () => {
  console.log(`✅ Bot online: ${client.user.tag}`);

  const data = loadData();
  const channel = await client.channels.fetch(CHANNEL_ID);

  let message = null;

  if (data.messageId) {
    try {
      message = await channel.messages.fetch(data.messageId);
    } catch {}
  }

  if (!message) {
    message = await channel.send({
      embeds: [createEmbed(data)],
      components: [createButtons()]
    });

    data.messageId = message.id;
    saveData(data);
  } else {
    await message.edit({
      embeds: [createEmbed(data)],
      components: [createButtons()]
    });
  }
});

// ===== INTERACTION =====
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  const data = loadData();

  if (interaction.isButton()) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: "❌ Không phải admin", ephemeral: true });
    }

    return interaction.reply({
      content: "Chọn tool:",
      components: [toolMenu()],
      ephemeral: true
    });
  }

  if (interaction.customId === "select_tool") {
    const tool = interaction.values[0];

    return interaction.update({
      content: `Chọn trạng thái cho ${tool}:`,
      components: [statusMenu(tool)]
    });
  }

  if (interaction.customId.startsWith("set_")) {
    const tool = interaction.customId.replace("set_", "");
    const status = interaction.values[0];

    data[tool] = status;
    saveData(data);

    const channel = await client.channels.fetch(CHANNEL_ID);
    const message = await channel.messages.fetch(data.messageId);

    await message.edit({
      embeds: [createEmbed(data)],
      components: [createButtons()]
    });

    return interaction.update({
      content: `✅ ${tool} → ${status}`,
      components: []
    });
  }
});

// ===== ERROR =====
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

// ===== START =====
client.login(TOKEN).catch(err => {
  console.error("❌ Lỗi TOKEN:", err.message);
});
