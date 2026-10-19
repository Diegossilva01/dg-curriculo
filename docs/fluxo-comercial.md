> Histórico da etapa anterior. A implementação atual está em `lib/`, `api/` e `supabase/migrations/`; consulte o README e PROGRESSO.md. Os adaptadores abaixo foram substituídos.

# Integração comercial futura

Estado atual: somente biblioteca local e arquivos locais. Nenhuma autenticação, sessão, pagamento ou persistência remota implementada. `TrajetoriaBusiness.commerceEnabled = false` preserva exportações de teste.

Pontos do código:

- `app.js`: `exportDocument(kind)` pede `authorize('export-'+kind)` antes de gerar o arquivo. `backup()` é um backup local e não usa o fluxo comercial.
- `business.js`: `login()` é independente da compra e deve permanecer disponível para clientes existentes.
- `saveToAccount(document)` exige adaptadores reais de autenticação e persistência; nunca transforma localStorage em conta.
- `authorize(capability)`, quando ativado: oferta → sessão/autenticação → verificação de compra confirmada pelo servidor. A implementação do gateway e a verificação autenticada no servidor são futuras.

Adaptadores a implementar: `offer.present(capability)`, `auth.getSession()`, `auth.login()`, `entitlements.hasVerifiedPurchase(session, capability)`, `account.save(session, document)`.

O provedor de oferta deve abortar com erro quando o usuário cancelar. O backend deverá validar usuário, direito adquirido e pagamento confirmado em toda operação protegida; não confiar em flags do navegador. A geração local atual não constitui proteção de arquivos pagos, e não deve ser promovida como controle de acesso comercial. Futuramente, exportações comerciais devem ser autorizadas/geradas no servidor.

Separar entidades: rascunho local, documento da conta e arquivo exportado. Persistir recibo/direito adquirido no servidor e permitir novo login para recuperar as compras. Nenhum gateway foi conectado nesta etapa.
