import { Reminder } from "../models/Reminder.js";
import { memoryStore, isUsingMemoryFallback } from "./database.js";
import { infoCard } from "../ui/containers/infoCard.js";
import { logger } from "../utils/logger.js";
import { t } from "../utils/i18n.js";

/**
 * Schedule a new reminder
 */
export async function createReminder({ userId, channelId, guildId, reason, remindAt }) {
  const data = {
    userId,
    channelId,
    guildId,
    reason,
    remindAt,
    completed: false
  };

  if (isUsingMemoryFallback()) {
    const id = `remind_${Date.now()}_${Math.random()}`;
    memoryStore.reminders.set(id, data);
    return { ...data, _id: id };
  }

  const created = await Reminder.create(data);
  return created.toObject();
}

/**
 * Check and fire due reminders
 * @param {import('discord.js').Client} client
 */
export async function processDueReminders(client) {
  const now = new Date();

  if (isUsingMemoryFallback()) {
    for (const [id, rem] of memoryStore.reminders.entries()) {
      if (!rem.completed && new Date(rem.remindAt) <= now) {
        rem.completed = true;
        await sendReminderNotice(client, rem);
        memoryStore.reminders.delete(id);
      }
    }
    return;
  }

  const due = await Reminder.find({
    remindAt: { $lte: now },
    completed: false
  }).limit(20);

  for (const rem of due) {
    rem.completed = true;
    await rem.save();
    await sendReminderNotice(client, rem);
  }
}

async function sendReminderNotice(client, rem) {
  try {
    const channel = await client.channels.fetch(rem.channelId).catch(() => null);
    if (!channel?.isTextBased()) return;

    const payload = infoCard({
      title: "Scheduled Reminder",
      description: `<@${rem.userId}>: ${t("utility.remind_fired", { reason: rem.reason })}`
    });

    await channel.send(payload);
  } catch (err) {
    logger.debug({ err: err.message }, "Could not send reminder notice");
  }
}
