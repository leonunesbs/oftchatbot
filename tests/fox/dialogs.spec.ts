import assert from 'node:assert/strict';
import test from 'node:test';

import { contactProfileStore } from '@/lib/contact-profile/store';
import type { LumiState } from '@/lib/lumi';
import { runLumiTurn } from '@/lib/lumi';
import { wrapWithFox } from '@/lib/fox/openai-wrap';
import { dialogScenarios } from '../lumi/scenarios';

type DialogResult = {
  reply: string;
  state: LumiState;
  handoff: boolean;
};

const deterministicReplyMarker = 'Resposta base determinística (preservar intenção e dados):';

function extractDeterministicReply(rawBody: unknown) {
  const body = rawBody as { input?: Array<{ content?: string }> };
  const userEntry = body.input?.[1];
  const content = typeof userEntry?.content === 'string' ? userEntry.content : '';
  const markerPosition = content.lastIndexOf(deterministicReplyMarker);
  if (markerPosition < 0) {
    return '';
  }
  return content.slice(markerPosition + deterministicReplyMarker.length).trim();
}

async function runFoxDialog(id: string, turns: string[]): Promise<DialogResult> {
  const chatId = `test-fox-${id}@c.us`;
  contactProfileStore.clearLumiSession(chatId);
  let reply = '';
  let state: LumiState = 'START';
  let handoff = false;

  for (const turn of turns) {
    const decision = await runLumiTurn({
      chatId,
      messageText: turn,
      contactName: 'Paciente Teste',
    });

    reply = await wrapWithFox({
      assistant: 'fire',
      userMessage: turn,
      deterministicReply: decision.replyText,
      contactName: 'Paciente Teste',
    });
    state = decision.nextState;
    handoff = Boolean(decision.handoffTriggered);
  }

  return { reply, state, handoff };
}

test('FOX dialogs coverage', async () => {
  const originalFetch = globalThis.fetch;
  let foxRequests = 0;

  globalThis.fetch = (async (_input: URL | RequestInfo, init?: RequestInit) => {
    foxRequests += 1;
    const parsedBody = init?.body ? JSON.parse(String(init.body)) : undefined;
    const deterministicReply = extractDeterministicReply(parsedBody);

    return new Response(
      JSON.stringify({
        output_text: deterministicReply,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }) as typeof fetch;

  try {
    for (const scenario of dialogScenarios) {
      const result = await runFoxDialog(scenario.id, scenario.turns);

      if (scenario.expectedState) {
        assert.equal(result.state, scenario.expectedState, `State mismatch in ${scenario.id}`);
      }
      if (scenario.expectHandoff !== undefined) {
        assert.equal(result.handoff, scenario.expectHandoff, `Handoff mismatch in ${scenario.id}`);
      }
      if (scenario.expectReplyIncludes) {
        for (const expectedText of scenario.expectReplyIncludes) {
          assert.ok(result.reply.includes(expectedText), `Reply in ${scenario.id} should include: ${expectedText}`);
        }
      }
    }

    assert.ok(foxRequests > 0, 'Fox wrapper should call OpenAI endpoint');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
