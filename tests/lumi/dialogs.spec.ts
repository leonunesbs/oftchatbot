import assert from 'node:assert/strict';
import test from 'node:test';

import { contactProfileStore } from '@/lib/contact-profile/store';
import type { LumiState } from '@/lib/lumi';
import { runLumiTurn } from '@/lib/lumi';

type DialogScenario = {
  id: string;
  turns: string[];
  expectedState?: LumiState;
  expectReplyIncludes?: string[];
  expectHandoff?: boolean;
};

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

const scenarios: DialogScenario[] = [
  {
    id: '01-greeting',
    turns: ['Oi Lumi'],
    expectedState: 'TRIAGE',
    expectReplyIncludes: ['Lumi'],
  },
  {
    id: '02-hours',
    turns: ['qual horario de atendimento'],
    expectedState: 'FAQ_ROUTER',
    expectReplyIncludes: ['segunda'],
  },
  {
    id: '03-location',
    turns: ['onde fica a clínica?'],
    expectedState: 'FAQ_ROUTER',
    expectReplyIncludes: ['Fortaleza'],
  },
  {
    id: '04-catarata',
    turns: ['vocês explicam catarata?'],
    expectedState: 'FAQ_ROUTER',
    expectReplyIncludes: ['educativa'],
  },
  {
    id: '05-retina-typo',
    turns: ['tenho duvida de retna'],
    expectedState: 'FAQ_ROUTER',
    expectReplyIncludes: ['retina'],
  },
  {
    id: '06-glaucoma',
    turns: ['quero saber sobre glaucoma'],
    expectedState: 'FAQ_ROUTER',
    expectReplyIncludes: ['Glaucoma'],
  },
  {
    id: '07-olho-seco',
    turns: ['olho seco o que é'],
    expectedState: 'FAQ_ROUTER',
    expectReplyIncludes: ['Olho seco'],
  },
  {
    id: '08-exames',
    turns: ['quais exames vocês fazem'],
    expectedState: 'FAQ_ROUTER',
    expectReplyIncludes: ['Exames'],
  },
  {
    id: '09-urgent-dor',
    turns: ['estou com dor ocular intensa'],
    expectedState: 'END',
    expectReplyIncludes: ['pronto atendimento'],
    expectHandoff: true,
  },
  {
    id: '10-urgent-vision',
    turns: ['perdi a visao de repente'],
    expectedState: 'END',
    expectReplyIncludes: ['imediatamente'],
    expectHandoff: true,
  },
  {
    id: '11-urgent-trauma',
    turns: ['levei um trauma no olho'],
    expectedState: 'END',
    expectReplyIncludes: ['pronto atendimento'],
    expectHandoff: true,
  },
  {
    id: '12-urgent-flashes',
    turns: ['vejo flashs e sombras'],
    expectedState: 'END',
    expectReplyIncludes: ['pronto atendimento'],
    expectHandoff: true,
  },
  {
    id: '13-urgent-chemical',
    turns: ['caiu produto químico no olho'],
    expectedState: 'END',
    expectReplyIncludes: ['lave com água'],
    expectHandoff: true,
  },
  {
    id: '14-direct-human',
    turns: ['quero falar com humano'],
    expectedState: 'HANDOFF_WHATSAPP',
    expectReplyIncludes: ['atendimento humano'],
    expectHandoff: true,
  },
  {
    id: '15-pricing-human',
    turns: ['qual o preço da consulta?'],
    expectedState: 'HANDOFF_WHATSAPP',
    expectReplyIncludes: ['valores'],
    expectHandoff: true,
  },
  {
    id: '16-insurance-human',
    turns: ['aceita convênio unimed?'],
    expectedState: 'HANDOFF_WHATSAPP',
    expectReplyIncludes: ['convênios'],
    expectHandoff: true,
  },
  {
    id: '17-reschedule-human',
    turns: ['quero reagendar'],
    expectedState: 'HANDOFF_WHATSAPP',
    expectReplyIncludes: ['reagendamento'],
    expectHandoff: true,
  },
  {
    id: '18-cancel-human',
    turns: ['preciso cancelar'],
    expectedState: 'HANDOFF_WHATSAPP',
    expectReplyIncludes: ['cancelamento'],
    expectHandoff: true,
  },
  {
    id: '19-schedule-start',
    turns: ['quero agendar consulta'],
    expectedState: 'SCHEDULING_COLLECT_NAME',
    expectReplyIncludes: ['prefere ser chamado'],
  },
  {
    id: '20-multi-entity',
    turns: ['quero agendar, sou Leo Nunes, meu telefone é 85988887777, fortaleza, consulta geral, quinta à tarde'],
    expectedState: 'SCHEDULING_SHOW_DATES',
    expectReplyIncludes: ['agenda disponível'],
  },
  {
    id: '21-natural-flow',
    turns: ['quero agendar', 'sou Ana Clara', '85999998888', 'Fortaleza', 'catarata', '2026-03-15 tarde'],
    expectedState: 'SCHEDULING_SHOW_DATES',
    expectReplyIncludes: ['próximos dias'],
  },
  {
    id: '22-slot-select',
    turns: [
      'quero agendar',
      'me chamo Bruno Silva',
      '85999997777',
      'Fortaleza',
      'consulta geral',
      '15/03 tarde',
      '1',
      '1',
    ],
    expectedState: 'SCHEDULING_CONFIRM',
    expectReplyIncludes: ['Posso confirmar'],
  },
  {
    id: '23-confirmation-yes',
    turns: [
      'quero agendar',
      'me chamo Carla Dias',
      '85999996666',
      'Fortaleza',
      'retina',
      '15/03 tarde',
      '1',
      '1',
      'sim',
    ],
    expectedState: 'END',
    expectReplyIncludes: ['pré-agendada'],
  },
  {
    id: '24-confirmation-ok',
    turns: [
      'quero agendar',
      'nome Diego Castro',
      '85999995555',
      'Fortaleza',
      'glaucoma',
      '15/03 manhã',
      '1',
      '1',
      'ok',
    ],
    expectedState: 'END',
    expectReplyIncludes: ['Protocolo'],
  },
  {
    id: '25-flow-detour',
    turns: [
      'quero agendar',
      'antes, qual horario de atendimento?',
      'sou Fernanda Lima',
      '85999994444',
      'Fortaleza',
      'consulta geral',
      '15/03 manhã',
    ],
    expectedState: 'SCHEDULING_SHOW_DATES',
    expectReplyIncludes: ['agenda disponível'],
  },
  {
    id: '26-emoji-and-typo',
    turns: [
      'oiii 😄 quero agendarr consuta',
      'sou Gabriel Sousa',
      '85999993333',
      'fortaleza',
      'consulta geral',
      'amanha a tarde',
    ],
    expectedState: 'SCHEDULING_SHOW_DATES',
    expectReplyIncludes: ['event_types'],
  },
  {
    id: '27-invalid-phone-once',
    turns: [
      'quero agendar',
      'me chamo Helena Prado',
      '123',
      '85999992222',
      'Fortaleza',
      'consulta geral',
      '15/03 tarde',
    ],
    expectedState: 'SCHEDULING_SHOW_DATES',
    expectReplyIncludes: ['agenda disponível'],
  },
  {
    id: '28-invalid-email-handoff',
    turns: [
      'quero agendar',
      'nome Igor Melo',
      '85999991111',
      'Fortaleza',
      'consulta geral',
      '15/03 tarde',
      'email errado',
      'email errado de novo',
    ],
    expectedState: 'HANDOFF_WHATSAPP',
    expectReplyIncludes: ['WhatsApp'],
    expectHandoff: true,
  },
  {
    id: '29-clinical-guardrail',
    turns: ['qual remedio devo tomar para catarata'],
    expectedState: 'HANDOFF_WHATSAPP',
    expectReplyIncludes: ['não posso diagnosticar'],
    expectHandoff: true,
  },
  {
    id: '30-fallback-outscope',
    turns: ['vocês fazem imposto de renda?'],
    expectedState: 'TRIAGE',
    expectReplyIncludes: ['Posso te ajudar'],
  },
  {
    id: '31-name-without-prefix',
    turns: ['quero agendar', 'Leonardo'],
    expectedState: 'SCHEDULING_COLLECT_LOCATION',
    expectReplyIncludes: ['local'],
  },
];

test('LUMI dialogs coverage', async () => {
  for (const scenario of scenarios) {
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
