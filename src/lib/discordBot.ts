import { Client, GatewayIntentBits, EmbedBuilder, TextChannel } from 'discord.js';

// Single instance of Discord client
let discordClient: Client | null = null;

export async function initializeDiscordBot() {
  try {
    if (discordClient) {
      console.log('Discord bot already initialized');
      return discordClient;
    }

    discordClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
      ],
    });

    const TOKEN = process.env.TOKEN;
    const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID;

    if (!TOKEN) {
      console.error('TOKEN is missing in environment variables');
      throw new Error('Missing TOKEN in environment variables');
    }
    if (!WELCOME_CHANNEL_ID) {
      console.error('WELCOME_CHANNEL_ID is missing in environment variables');
      throw new Error('Missing WELCOME_CHANNEL_ID in environment variables');
    }

    discordClient.on('guildMemberAdd', async (member) => {
      try {
        console.log(`New member joined: ${member.user.tag}`);
        const welcomeChannel = await discordClient!.channels.fetch(WELCOME_CHANNEL_ID);
        if (!welcomeChannel) {
          console.error(`Welcome channel with ID ${WELCOME_CHANNEL_ID} not found`);
          return;
        }
        if (!welcomeChannel.isTextBased()) {
          console.error(`Channel with ID ${WELCOME_CHANNEL_ID} is not a text channel`);
          return;
        }

        const welcomeEmbed = new EmbedBuilder()
          .setColor('#FFD700')
          .setDescription(
            'We’re here to break the matrix and rewrite the rules—earning big by editing and posting. No limits, no excuses—just pure hustle and success. Let’s make it happen! 💰'
          )
          .setThumbnail(member.user.displayAvatarURL())
          .setFooter({ text: 'Clipify Post App' })
          .setTimestamp();

        await (welcomeChannel as TextChannel).send({
          content: `Welcome to Clipify Post, ${member}! 🚀`,
          embeds: [welcomeEmbed],
        });
        console.log(`Welcome message sent for ${member.user.tag} in channel ${WELCOME_CHANNEL_ID}`);
      } catch (err) {
        console.error(`Error sending welcome message for ${member.user.tag}:`, err);
      }
    });

    discordClient.once('ready', () => {
      console.log(`✅ Bot logged in as ${discordClient!.user?.tag} at ${new Date().toISOString()}`);
    });

    discordClient.on('error', (err) => {
      console.error('Discord client error:', err);
    });

    console.log('Attempting to login with bot token...');
    await discordClient.login(TOKEN);
    console.log('Bot initialized successfully');

    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Closing Discord client...');
      discordClient?.destroy();
      discordClient = null;
      process.exit(0);
    });

    return discordClient;
  } catch (err) {
    console.error('Error initializing Discord bot:', err);
    discordClient = null;
    throw err;
  }
}

export function getDiscordClient() {
  return discordClient;
}