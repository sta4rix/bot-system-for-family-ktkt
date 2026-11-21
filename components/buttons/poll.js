import { recordVote, renderPollCard } from "../../services/pollService.js";
import { errorCard } from "../../ui/containers/errorCard.js";
import { t } from "../../utils/i18n.js";

export default {
  prefix: "poll",
  /**
   * @param {import('discord.js').ButtonInteraction} interaction
   * @param {import('../../client.js').KTKTBotClient} client
   * @param {object} context
   */
  async execute(interaction, client, { action, parts, locale }) {
    if (action === "vote") {
      // customId format: poll:vote:<messageId>:<optionIndex>
      const [, , messageId, optionIndexStr] = parts;
      const optionIndex = parseInt(optionIndexStr, 10);

      const targetMessageId = messageId === "new" ? interaction.message.id : messageId;
      const updatedPoll = await recordVote(targetMessageId, optionIndex, interaction.user.id);

      if (!updatedPoll) {
        return interaction.reply({
          ...errorCard({
            title: t("common.error", {}, locale),
            description: "This poll is closed or invalid.",
            ephemeral: true
          }),
          ephemeral: true
        });
      }

      const updatedPayload = renderPollCard(updatedPoll);
      await interaction.update(updatedPayload);
    }
  }
};
