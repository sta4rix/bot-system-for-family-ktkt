import { updateGuildConfig, getGuildConfig } from "../../services/guildService.js";
import { successCard } from "../../ui/containers/successCard.js";

export default {
  prefix: "welcome",
  /**
   * @param {import('discord.js').ModalSubmitInteraction} interaction
   * @param {import('../../client.js').KTKTBotClient} client
   * @param {object} context
   */
  async execute(interaction, client, { action, fields, locale: _locale }) {
    if (action === "setup") {
      const channelId = fields.getTextInputValue("channel_id")?.trim();
      const message = fields.getTextInputValue("message")?.trim();

      const config = await getGuildConfig(interaction.guildId);
      const welcome = {
        ...(config.welcome || {}),
        enabled: true,
        channelId: channelId || config.welcome?.channelId,
        message: message || config.welcome?.message
      };

      await updateGuildConfig(interaction.guildId, { welcome });

      return interaction.reply(
        successCard({
          title: "Welcome Setup Complete",
          description: "Welcome settings have been updated successfully.",
          fields: [
            { name: "Channel", value: `<#${welcome.channelId}>` },
            { name: "Message Template", value: welcome.message || "Default template" }
          ],
          ephemeral: true
        })
      );
    }
  }
};
