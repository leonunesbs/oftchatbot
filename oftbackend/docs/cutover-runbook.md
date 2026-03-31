# Cutover runbook (big bang controlado)

## Pré-corte

1. Confirmar dark launch ativo (`OFTBACKEND_DARK_LAUNCH=true`).
2. Confirmar shadow mode ativo no `oftagenda` (`OFTBACKEND_PROXY_MODE=shadow`).
3. Verificar métricas por 24h:
   - erro 5xx < 1%
   - p95 < 500ms
   - divergência funcional < 0.5%.
4. Validar webhook replay e deduplicação em staging.

## Janela de corte

1. Congelar mudanças não relacionadas.
2. Ativar roteamento para backend novo (`OFTBACKEND_PROXY_MODE=active`).
3. Monitorar dashboards de:
   - latência
   - 4xx/5xx
   - eventos webhook processados.

## Rollback imediato

1. Retornar para legado (`OFTBACKEND_PROXY_MODE=off`).
2. Pausar consumers assíncronos do `oftbackend`.
3. Reconciliar eventos pendentes via rotina idempotente.
4. Abrir incidente e registrar divergências críticas.
