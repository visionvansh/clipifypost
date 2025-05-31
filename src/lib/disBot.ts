import { Client, IntentsBitField } from 'discord.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
let client: Client | null = null;

export async function initializeBot() {
  if (typeof window !== 'undefined') {
    console.warn('Discord bot initialization skipped in client-side environment');
    return;
  }

  if (client) {
    console.log('Bot already initialized');
    return;
  }

  client = new Client({
    intents: [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildMembers,
      IntentsBitField.Flags.GuildInvites,
    ],
  });

  client.on('ready', () => {
    console.log(`Bot logged in as ${client?.user?.tag}`);
  });

  client.on('guildMemberAdd', async (member) => {
    try {
      const invites = await member.guild.invites.fetch();
      const invite = invites.find((inv: any) => inv.uses > 0 && inv.inviterId);
      if (invite && invite.inviterId) {
        const inviter = await prisma.student.findUnique({ where: { discordId: invite.inviterId } });
        if (inviter) {
          await prisma.invite.create({
            data: {
              inviterId: inviter.id,
              invitedId: member.id,
              invitedUsername: member.user.tag,
              status: 'pending',
            },
          });
          await prisma.inviteStats.upsert({
            where: { studentId: inviter.id },
            update: { inviteCount: { increment: 1 } },
            create: { studentId: inviter.id, inviteCount: 1 },
          });
        }
      }
    } catch (error) {
      console.error('Error tracking invite:', error);
    }
  });

  try {
    await client.login(process.env.DISCORD_BOT_TOKEN);
    (global as any).discordClient = client; // Store client globally for other routes
  } catch (error) {
    console.error('Failed to login bot:', error);
    client = null;
    throw error;
  }
}