import { NextRequest, NextResponse } from 'next/server';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import { getDiscordClient, initializeDiscordBot } from '../../../lib/discordBot';

interface CustomField {
  type: 'heading' | 'subheading';
  heading: string;
  value: string;
  valueStyle: string;
  valueSize: string;
}

interface RequestBody {
  channelId: string;
  templateType: string;
  title?: string;
  titleStyle?: string;
  titleColor?: string;
  description?: string;
  descriptionStyle?: string;
  descriptionSize?: string;
  descriptionColor?: string;
  footer?: string;
  customFields?: CustomField[];
  buttonLabel?: string;
  buttonUrl?: string;
  mainHeading?: string;
  subheading?: string;
  subheadingDescription?: string;
  message?: string;
  messageStyle?: string;
  messageSize?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (req.method !== 'POST') {
    return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
  }

  console.log('Received /api/send-message POST request');

  try {
    const body: RequestBody = await req.json();

    const {
      channelId,
      templateType,
      title,
      titleStyle,
      titleColor,
      description,
      descriptionStyle,
      descriptionSize,
      descriptionColor,
      footer,
      customFields,
      buttonLabel,
      buttonUrl,
      mainHeading,
      subheading,
      subheadingDescription,
      message,
      messageStyle,
      messageSize,
    } = body;

    const applyStyle = (text: string | null, style: string): string | null => {
      if (!text) return null;
      if (style === 'bold') return `**${text}**`;
      if (style === 'italic') return `*${text}*`;
      if (style === 'bold-italic') return `***${text}***`;
      return text;
    };

    const applySize = (text: string | null, style: string): string | null => {
      if (!text) return null;
      if (style === 'normal') return text;
      return `${style} ${text}`;
    };

    const addBullets = (value: string | null): string | null => {
      if (!value) return null;
      return value
        .split('\n')
        .map((line) => (line.trim() ? `- ${line.trim()}` : ''))
        .join('\n');
    };

    const validateAndFormatColor = (color: string | undefined): string => {
      if (!color || !color.match(/^#[0-9A-Fa-f]{6}$/)) {
        return '#FFD700'; // Default to yellow
      }
      return color;
    };

    const validateAndFormatUrl = (url: string | undefined): string => {
      if (!url) return 'https://example.com';
      if (!url.match(/^https?:\/\//)) {
        return `https://${url}`;
      }
      return url;
    };

    if (!channelId || typeof channelId !== 'string') {
      throw new Error('Invalid channel ID provided.');
    }

    let client = getDiscordClient();
    if (!client) {
      console.log('Discord client not initialized. Attempting to initialize...');
      client = await initializeDiscordBot();
      if (!client) {
        throw new Error('Failed to initialize Discord client.');
      }
    }

    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      throw new Error('Channel not found or is not a text channel.');
    }

    if (templateType === 'simple') {
      // Handle simple message (non-embedded)
      const validatedMessage =
        typeof message === 'string' && message.trim()
          ? applyStyle(message, messageStyle || 'none') || 'Default Message'
          : 'Default Message';
      await (channel as TextChannel).send({
        content: validatedMessage,
      });
    } else {
      // Handle embedded templates (Promotion, Rules, Announcement)
      const validatedTitle =
        typeof title === 'string' && title.trim()
          ? applyStyle(title.slice(0, 256), titleStyle || 'none')
          : 'Default Title';
      const validatedTitleColor = validateAndFormatColor(titleColor);
      const validatedDescription =
        typeof description === 'string' && description.trim()
          ? applySize(applyStyle(description, descriptionStyle || 'none'), descriptionSize || 'normal')
          : null;
      const validatedFooter =
        typeof footer === 'string' && footer.trim() ? footer : 'Clipify Post';

      const embed = new EmbedBuilder()
        .setColor(parseInt(validatedTitleColor.replace('#', ''), 16))
        .setTitle(validatedTitle);

      if (templateType === 'rules' || templateType === 'announcement') {
        if (mainHeading) {
          embed.addFields({
            name: mainHeading,
            value: '\u200B', // Zero-width space for empty value
            inline: false,
          });
        }
        if (subheading) {
          embed.addFields({
            name: templateType === 'rules' ? applyStyle(subheading, 'bold') || subheading : subheading,
            value: templateType === 'rules' && subheadingDescription
              ? addBullets(subheadingDescription) || '\u200B'
              : '\u200B',
            inline: true,
          });
        }
      } else {
        embed.setDescription(validatedDescription || 'No description provided');
      }

      if (customFields && Array.isArray(customFields)) {
        customFields.forEach((field: CustomField) => {
          if (field.heading && field.value) {
            const styledValue = applySize(
              applyStyle(addBullets(field.value), field.valueStyle),
              field.valueSize,
            );
            embed.addFields({
              name: field.heading,
              value: styledValue || 'No value',
              inline: field.type === 'subheading',
            });
          }
        });
      }

      embed.setFooter({ text: validatedFooter });

      if (buttonLabel && buttonUrl && buttonLabel.trim() && buttonUrl.trim()) {
        const button = new ButtonBuilder()
          .setLabel(buttonLabel.slice(0, 80))
          .setURL(validateAndFormatUrl(buttonUrl))
          .setStyle(ButtonStyle.Link)
          .setEmoji('💰');
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
        await (channel as TextChannel).send({ embeds: [embed], components: [row] });
      } else {
        await (channel as TextChannel).send({ embeds: [embed] });
      }
    }

    console.log(`Message sent successfully to channel ${channelId}`);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Error in /api/send-message:', err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}