import assert from 'node:assert/strict';
import test from 'node:test';

import { contactProfileStore } from '@/lib/contact-profile/store';
import type { LumiState } from '@/lib/lumi';
import { runLumiTurn } from '@/lib/lumi';
import { dialogScenarios } from './scenarios';

async function runDialog(id: string, turns: string[]) {
  const chatId = `test-${id}@c.us`;
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
    reply = decision.replyText;
    state = decision.nextState;
    handoff = Boolean(decision.handoffTriggered);
  }

  return { reply, state, handoff };
}

test('LUMI dialogs coverage', async () => {
  for (const scenario of dialogScenarios) {
    const result = await runDialog(scenario.id, scenario.turns);

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
});
