/**
 * Tiny Discord notifier — posts a message to the configured channel via
 * Discord's REST API using a bot token.
 *
 * No persistent gateway connection, no library — just a fetch.
 *
 * Required env: DISCORD_BOT_TOKEN, DISCORD_CHANNEL_ID
 *
 * Failures are logged but never thrown — a flaky Discord shouldn't break
 * the user's task/scroll write.
 */

const DISCORD_API = "https://discord.com/api/v10";

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  url?: string;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  timestamp?: string;
  footer?: { text: string };
}

export interface NotifyOptions {
  content?: string;
  embeds?: DiscordEmbed[];
}

export async function notifyDiscord(opts: NotifyOptions): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_ID;

  if (!token || !channelId) {
    // Quietly noop if not configured — keeps local dev clean for anyone
    // who hasn't set up Discord yet.
    return;
  }

  try {
    const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: opts.content,
        embeds: opts.embeds,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("Discord notify failed:", res.status, errText.slice(0, 300));
    }
  } catch (err: any) {
    console.error("Discord notify error:", err.message);
  }
}

// === Olympus palette translated to Discord embed colors (decimal) ===
export const DISCORD_COLORS = {
  gold: 0xb8893d, // antique gold
  olive: 0x5a7a32, // success
  amber: 0xb87333, // in progress
  wine: 0x8b1a1a, // error / overdue
  marble: 0xe8e3d3, // neutral
};
