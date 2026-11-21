import { successCard } from "../../ui/containers/successCard.js";
import { warnCard } from "../../ui/containers/warnCard.js";
import { errorCard } from "../../ui/containers/errorCard.js";
import { t } from "../../utils/i18n.js";

/** @type {Map<string, { onConfirm: Function, onCancel: Function }>} */
export const pendingConfirmations = new Map();

export default {
  prefix: "confirm",
  /**
   * @param {import('discord.js').ButtonInteraction} interaction
   * @param {import('../../client.js').KTKTBotClient} client
   * @param {object} context
   */
  async execute(interaction, client, { action: _action, parts, locale }) {
    // customId format: confirm:<yes|no>:<userId>:<actionId>
    const [, choice, targetUserId, actionId] = parts;

    // Strict ownership verification: only invoking user can press their buttons
    if (interaction.user.id !== targetUserId) {
      return interaction.reply({
        ...errorCard({
          title: t("common.error", {}, locale),
          description: t("common.not_for_you", {}, locale),
          ephemeral: true
        }),
        ephemeral: true
      });
    }

    const pending = pendingConfirmations.get(actionId);

    if (choice === "yes") {
      if (pending?.onConfirm) {
        await pending.onConfirm(interaction);
        pendingConfirmations.delete(actionId);
      } else {
        await interaction.update(
          successCard({
            title: t("common.confirmation", {}, locale),
            description: "Action confirmed and processed successfully."
          })
        );
      }
    } else {
      if (pending?.onCancel) {
        await pending.onCancel(interaction);
        pendingConfirmations.delete(actionId);
      } else {
        await interaction.update(
          warnCard({
            title: t("common.confirmation", {}, locale),
            description: "Operation was canceled by user request."
          })
        );
      }
    }
  }
};
