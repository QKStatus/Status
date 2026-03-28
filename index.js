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

// ===== CONFIG =====
const TOKEN = "YOUR_BOT_TOKEN";
const CHANNEL_ID = "YOUR_CHANNEL_ID";

// ===== CREATE BOT =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== DATA =====
function loadData() {
  if (!fs.existsSync("./data.json")) {
    fs.writeFileSync("./data.json", JSON.stringify({
      "Fluorite": "safe",
      "Migul VN": "safe",
      "Sonic": "safe",
      "Proxy Aim": "safe",
      "messageId": null
    }, null, 2));
  }
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
    .setFooter({ text: "Auto Update System" })
    .setTimestamp();

  const tools = ["Fluorite", "Migul VN", "Sonic", "Proxy Aim"];

  tools.forEach(name => {
    let status = data[name] || "safe";
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

// ===== MENU TOOL =====
function toolMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("select_tool")
      .setPlaceholder("👉 Chọn tool")
      .addOptions([
        { label: "Fluorite", value: "Fluorite" },
        { label: "Migul VN", value: "Migul VN" },
        { label: "Sonic", value: "Sonic" },
        { label: "Proxy Aim", value: "Proxy Aim" }
      ])
  );
}

// ===== MENU STATUS =====
function statusMenu(tool) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`set_${tool}`)
      .setPlaceholder(`👉 Chọn trạng thái cho ${tool}`)
      .addOptions([
        { label: "🟢 Safe", value: "safe" },
        { label: "🔴 Update", value: "update" }
      ])
  );
}

// ===== READY =====
client.once("ready", async () => {
  console.log(`✅ Bot chạy: ${client.user.tag}`);

  const data = loadData();
  let channel;

  try {
    channel = await client.channels.fetch(CHANNEL_ID);
  } catch {
    console.log("❌ Sai CHANNEL_ID");
    return;
  }

  let message = null;

  if (data.messageId) {
    try {
      message = await channel.messages.fetch(data.messageId);
    } catch {
      message = null;
    }
  }

  // nếu chưa có panel thì tạo
  if (!message) {
    message = await channel.send({
      embeds: [createEmbed(data)],
      components: [createButtons()]
    });

    data.messageId = message.id;
    saveData(data);

    console.log("✅ Đã tạo panel mới");
  } else {
    await message.edit({
      embeds: [createEmbed(data)],
      components: [createButtons()]
    });

    console.log("♻️ Đã cập nhật panel");
  }
});

// ===== INTERACTION =====
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  const data = loadData();

  // ===== BUTTON =====
  if (interaction.isButton()) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: "❌ Bạn không phải admin",
        ephemeral: true
      });
    }

    if (interaction.customId === "edit_status") {
      return interaction.reply({
        content: "🔽 Chọn tool:",
        components: [toolMenu()],
        ephemeral: true
      });
    }
  }

  // ===== SELECT =====
  if (interaction.isStringSelectMenu()) {

    // chọn tool
    if (interaction.customId === "select_tool") {
      const tool = interaction.values[0];

      return interaction.update({
        content: `⚙️ Chọn trạng thái cho ${tool}:`,
        components: [statusMenu(tool)]
      });
    }

    // set status
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
        content: `✅ Đã cập nhật ${tool} → ${status.toUpperCase()}`,
        components: []
      });
    }
  }
});

// ===== ERROR HANDLE =====
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

// ===== LOGIN =====
client.login(TOKEN);
