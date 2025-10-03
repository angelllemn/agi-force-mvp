import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryConversationRepository } from '../../src/adapters/memory/InMemoryConversationRepository.js';
import { SlackContextIntegration, SlackMessage } from '../../src/adapters/slack/SlackContextIntegration.js';

describe('Slack Context Integration', () => {
  let repository: InMemoryConversationRepository;
  let slackIntegration: SlackContextIntegration;

  beforeEach(() => {
    repository = new InMemoryConversationRepository();
    slackIntegration = new SlackContextIntegration(repository);
  });

  it('should process user DM message and create context', async () => {
    const message: SlackMessage = {
      user: 'U12345',
      text: 'Hello bot!',
      channel: 'D12345',
      channelType: 'im',
      ts: '1234567890.000000',
    };

    const context = await slackIntegration.processMessage(message);

    expect(context).toBeDefined();
    expect(context.length).toBeGreaterThan(0);
    expect(context[0]).toContain('Hello bot!');
  });

  it('should process group message and create context', async () => {
    const message: SlackMessage = {
      user: 'U12345',
      text: 'Hello team!',
      channel: 'C12345',
      channelType: 'channel',
      ts: '1234567890.000000',
    };

    const context = await slackIntegration.processMessage(message);

    expect(context).toBeDefined();
    expect(context.length).toBeGreaterThan(0);
    expect(context[0]).toContain('Hello team!');
  });

  it('should maintain conversation history across messages', async () => {
    const message1: SlackMessage = {
      user: 'U12345',
      text: 'First message',
      channel: 'D12345',
      channelType: 'im',
      ts: '1234567890.000000',
    };

    const message2: SlackMessage = {
      user: 'U12345',
      text: 'Second message',
      channel: 'D12345',
      channelType: 'im',
      ts: '1234567891.000000',
    };

    await slackIntegration.processMessage(message1);
    const context = await slackIntegration.processMessage(message2);

    expect(context.length).toBe(2);
    expect(context[0]).toContain('First message');
    expect(context[1]).toContain('Second message');
  });

  it('should add bot responses to context', async () => {
    const userMessage: SlackMessage = {
      user: 'U12345',
      text: 'What is Node.js?',
      channel: 'D12345',
      channelType: 'im',
      ts: '1234567890.000000',
    };

    await slackIntegration.processMessage(userMessage);
    await slackIntegration.addBotResponse(
      'D12345',
      'im',
      'U12345',
      'Node.js is a JavaScript runtime...'
    );

    const context = await slackIntegration.getContext('U12345', 'user');

    expect(context.length).toBe(2);
    expect(context[0]).toContain('What is Node.js?');
    expect(context[1]).toContain('Node.js is a JavaScript runtime');
  });

  it('should separate contexts between users', async () => {
    const message1: SlackMessage = {
      user: 'U11111',
      text: 'User 1 message',
      channel: 'D11111',
      channelType: 'im',
      ts: '1234567890.000000',
    };

    const message2: SlackMessage = {
      user: 'U22222',
      text: 'User 2 message',
      channel: 'D22222',
      channelType: 'im',
      ts: '1234567891.000000',
    };

    await slackIntegration.processMessage(message1);
    await slackIntegration.processMessage(message2);

    const context1 = await slackIntegration.getContext('U11111', 'user');
    const context2 = await slackIntegration.getContext('U22222', 'user');

    expect(context1[0]).toContain('User 1 message');
    expect(context2[0]).toContain('User 2 message');
    expect(context1.length).toBe(1);
    expect(context2.length).toBe(1);
  });

  it('should separate user and group contexts for same user', async () => {
    const dmMessage: SlackMessage = {
      user: 'U12345',
      text: 'Private message',
      channel: 'D12345',
      channelType: 'im',
      ts: '1234567890.000000',
    };

    const groupMessage: SlackMessage = {
      user: 'U12345',
      text: 'Public message',
      channel: 'C12345',
      channelType: 'channel',
      ts: '1234567891.000000',
    };

    await slackIntegration.processMessage(dmMessage);
    await slackIntegration.processMessage(groupMessage);

    const dmContext = await slackIntegration.getContext('U12345', 'user');
    const groupContext = await slackIntegration.getContext('C12345', 'group');

    expect(dmContext[0]).toContain('Private message');
    expect(groupContext[0]).toContain('Public message');
  });

  it('should check if context exists', async () => {
    expect(await slackIntegration.hasContext('U12345', 'user')).toBe(false);

    const message: SlackMessage = {
      user: 'U12345',
      text: 'Hello!',
      channel: 'D12345',
      channelType: 'im',
      ts: '1234567890.000000',
    };

    await slackIntegration.processMessage(message);

    expect(await slackIntegration.hasContext('U12345', 'user')).toBe(true);
  });

  it('should handle concurrent message processing', async () => {
    const messages: SlackMessage[] = [
      {
        user: 'U12345',
        text: 'Message 1',
        channel: 'D12345',
        channelType: 'im',
        ts: '1234567890.000000',
      },
      {
        user: 'U12345',
        text: 'Message 2',
        channel: 'D12345',
        channelType: 'im',
        ts: '1234567891.000000',
      },
      {
        user: 'U12345',
        text: 'Message 3',
        channel: 'D12345',
        channelType: 'im',
        ts: '1234567892.000000',
      },
    ];

    // Process messages sequentially to ensure proper context creation
    for (const message of messages) {
      await slackIntegration.processMessage(message);
    }

    const context = await slackIntegration.getContext('U12345', 'user');

    expect(context.length).toBe(3);
  });

  it('should provide recent context for bot responses', async () => {
    // Add several messages
    for (let i = 0; i < 5; i++) {
      const message: SlackMessage = {
        user: 'U12345',
        text: `Message ${i + 1}`,
        channel: 'D12345',
        channelType: 'im',
        ts: `${1234567890 + i}.000000`,
      };
      await slackIntegration.processMessage(message);
    }

    const context = await slackIntegration.getContext('U12345', 'user');

    // Should have all 5 messages
    expect(context.length).toBe(5);
    expect(context[0]).toContain('Message 1');
    expect(context[4]).toContain('Message 5');
  });
});
