import assert from "node:assert/strict";
import test from "node:test";

import { contactProfileStore } from "@/lib/contact-profile/store";
import { runLumiTurn } from "@/lib/lumi";

test("sugere Fortaleza quando DDD 85 e detectado", async () => {
  const chatId = "5585988877766@c.us";
  contactProfileStore.clearLumiSession(chatId);

  await runLumiTurn({
    chatId,
    messageText: "quero agendar",
    contactName: "Paciente Teste",
  });

  const decision = await runLumiTurn({
    chatId,
    messageText: "sou Maria Alves",
    contactName: "Paciente Teste",
  });

  assert.equal(decision.nextState, "SCHEDULING_COLLECT_LOCATION");
  assert.ok(
    decision.replyText.includes("DDD e 85"),
    "A resposta deve mencionar o DDD 85",
  );
  assert.ok(
    decision.replyText.toLowerCase().includes("fortaleza"),
    "A resposta deve sugerir Fortaleza",
  );
});
