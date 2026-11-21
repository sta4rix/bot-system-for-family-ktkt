import { paginator } from "../../ui/paginator.js";

export default {
  prefix: "page",
  /**
   * @param {import('discord.js').ButtonInteraction} interaction
   * @param {import('../../client.js').KTKTBotClient} client
   * @param {object} context
   */
  async execute(interaction, client, { action, payload, parts }) {
    // customId format: page:<action>:<userId>:<sessionId>
    const [, , , sessionId] = parts;
    await paginator.handleButton(interaction, action, sessionId || payload);
  }
};
