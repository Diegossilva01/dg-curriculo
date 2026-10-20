# Trajetória

Editor existente preservado, com páginas públicas estáticas e API Node serverless para Vercel. Supabase Auth/PostgreSQL e Mercado Pago Checkout Pro implementados por APIs oficiais. Nenhuma publicação, repositório remoto, push ou cobrança foi feito nesta sessão.

**Estado:** código e build preparados; integrações externas não homologadas. A oferta atual é R$ 14,90 por um currículo específico, por 30 dias, pagamento único, sem renovação automática ou desconto. A cobrança real permanece desativada. O build passou; PDF final e pagamentos não foram validados.

## Executar no Terminal normal

Node **22.17 ou superior**. Python 3 é usado somente no teste de integridade do DOCX.

```bash
cd /Users/macbook/curriculo-web
npm install
cp .env.example .env.local
# Preencha .env.local conforme as seções abaixo, sem ativar cobranças reais.
npm run check
npm test
npm run build
npm run dev
```

Depois da mensagem de inicialização, abra `http://127.0.0.1:3000` (inicial) ou `http://127.0.0.1:3000/editor/`. O servidor de desenvolvimento é `server.mjs`, não `server.js`. Na Vercel, a API é `api/handler.js`; não depende de um processo permanente nem do MacBook.

`npm install` não concluiu nesta sessão: `ENOTFOUND registry.npmjs.org`. As dependências do PDF estão declaradas no package.json; não há lockfile gerado. Execute a instalação no Terminal normal, confira o lockfile gerado e inclua-o no seu commit. O build estático e os testes locais não exigem essas dependências.

## O que foi preservado e acrescentado

- Editor com 16 layouts, paleta, foto/enquadramento, dados pessoais, experiências, formação, habilidades, idiomas, resumo, cursos, certificados, links e extras.
- Formatação, reordenação, prévia, rascunhos locais, duplicação, exclusão e backup JSON. Modelos trocados sem apagar campos.
- Conta: cadastro, login, logout, confirmação de e-mail e recuperação de senha usando Supabase Auth, com PKCE nos links. Senhas não são armazenadas pela aplicação.
- Página `/meus-curriculos/`: listagem, abrir, renomear, duplicar, salvar e excluir documentos da conta. O conteúdo é protegido no servidor; a listagem exibe somente metadados do próprio usuário.
- Migração local → conta: idempotente por proprietário e identificador local; nunca substitui um documento já existente durante a importação. Só persiste quando a compra libera o salvamento; os demais rascunhos continuam locais, aguardando compra. Login sozinho não vende nem libera o recurso pago.
- Checkout: oferta → login → pedido persistido → Checkout Pro → consulta autenticada do andamento → direito confirmado no servidor. O rascunho permanece no navegador e a volta restaura o currículo correspondente.
- Arquivos finais gerados pelo servidor após autenticação, compra válida e cota. Não há exportador DOCX entregue no diretório público. A prévia gratuita é visível no navegador e não pode ser tratada como DRM: o usuário sempre pode copiar o que vê. Os endpoints de arquivo final e os dados da conta têm verificação própria.

Mudanças locais depois de um salvamento exigem clicar **Salvar na conta** novamente; rascunho local e versão remota são distintos. Conflitos de revisão retornam 409, sem substituição silenciosa. Logout mantém rascunhos no dispositivo: em computador compartilhado, exclua-os se necessário.

## Supabase: banco e autenticação

1. Crie projetos separados para teste e produção.
2. Execute [001_trajetoria.sql](supabase/migrations/001_trajetoria.sql) e depois [002_specific_curriculum.sql](supabase/migrations/002_specific_curriculum.sql) pelo SQL Editor ou CLI. Se 001 já foi aplicada, execute somente 002 nesta atualização.
3. Em Auth, habilite e-mail/senha, confirmação de e-mail e configure SMTP para operação comercial. Configure políticas de senha e limites de envio no provedor.
4. Em URL Configuration, defina Site URL para sua `APP_URL`. Autorize os redirects exatos:
   - `https://SEU_DOMINIO/auth/callback`
   - `https://SEU_DOMINIO/auth/callback?recovery=1`
   - equivalentes locais somente no projeto de teste: `http://127.0.0.1:3000/auth/callback` e a variante de recuperação.
5. Use os links padrão do Supabase e o fluxo PKCE implementado. Abra confirmação/recuperação no navegador onde iniciou a solicitação; o verificador fica no sessionStorage. Se perdeu esse navegador, solicite outro link. Não habilite retorno implícito por fragmento como alternativa.
6. Configure `SUPABASE_URL`, chave pública `SUPABASE_PUBLISHABLE_KEY` e a chave administrativa **legada service_role JWT** em `SUPABASE_SERVICE_ROLE_KEY`, exclusivamente no servidor. A política CSP aceita o domínio padrão `*.supabase.co`; se usar um domínio customizado, ajuste `connect-src` em vercel.json.

Tabelas: `resumes`, `orders`, `payment_records`, `entitlements`, `entitlement_documents`, `request_limits`. RLS ativado, proprietário por `auth.uid()`, sem mutações por clientes. As funções de compra/grant/gravação são restritas à service_role e os handlers validam o usuário por `/auth/v1/user`, sem confiar em JWT apenas decodificado.

O acesso direto ao conteúdo via RLS é conservador e aceita direitos de produção; o teste usa a API, que verifica explicitamente o modo `test`. Contas de outro usuário não podem ler conteúdo em nenhum modo. Exclusão do próprio documento é permitida pela API mesmo após expiração. Não há exclusão automática de conta; pedidos de exclusão completa exigem atendimento administrativo.

## Mercado Pago: configuração e limites

Implementação por Preferences API do **Checkout Pro**, pagamento único. Não usa Orders API para criar a preferência.

1. Crie a aplicação Mercado Pago e use credenciais/contas compradora e vendedora de **teste**. Separe aplicação, segredo e banco de produção.
2. Configure `MP_ACCESS_TOKEN`, `MP_COLLECTOR_ID`, `MP_WEBHOOK_SECRET` e `MP_MODE=test`.
3. Configure Webhooks na aplicação para `https://SUA_APP_URL/api/webhook`, tópico `payment` e tópico de contestações `topic_chargebacks_wh`. O código usa a assinatura `x-signature`, o `x-request-id` e `data.id` da query; não aceita webhook de pagamento sem assinatura.
4. Configure as mesmas variáveis em Preview/Teste na Vercel. Para testar o checkout, `APP_URL` precisa ser HTTPS acessível ao Mercado Pago. As URLs de retorno são `/pagamento/aprovado`, `/pagamento/pendente` e `/pagamento/nao-concluido`.
5. Confira a oferta fixa descrita abaixo e preencha os dados comerciais. Só depois habilite `PAYMENTS_ENABLED=true` **em teste**. O servidor fixa R$ 14,90 / um currículo específico / 30 dias, sem renovação automática nem desconto.
6. Faça compra sandbox, confirme webhook e acesso e teste duplicatas, reembolso, contestação e atraso. A URL de sucesso não libera nada: o servidor consulta a API do pagamento e compara recebedor, referência, metadata do proprietário, valor, moeda, modo e status.

Notificações repetidas atualizam o snapshot por pagamento, sob lock do pedido; concessão única por pedido não renova prazo em replay. A assinatura antiga pode ser reprocessada com segurança: o estado atual é sempre consultado na API. Status pendente/rejeitado não gera direito. Abertura de mediação, chargeback e reembolso parcial/total revogam o acesso ligado à compra; replay de `approved` não reativa um pedido revogado. Outra compra válida independente permanece disponível. A regra técnica só pode ser ativada com `REFUND_POLICY=revoke_on_refund_or_dispute` explícito e deve ser refletida nas condições comerciais.

Antes de salvar/ler conteúdo ou exportar, a API reconsulta pagamentos aprovados para detectar webhook perdido. Falha na consulta não libera o recurso. A compra é vinculada transacionalmente ao identificador do currículo presente no pedido, desde a confirmação. Ela não pode ser usada primeiro em outro rascunho. Excluir o currículo não transfere a compra para outro. Pedido/checkout usa chave estável e claim exclusivo no banco. Se houver resultado de rede incerto na criação da preferência, a tentativa não é repetida cegamente: o pedido precisa ser conferido no painel/API e reconciliado pelo operador antes de liberar uma nova tentativa.

**Não testado aqui:** APIs reais, formatos reais de notificações de contestação, homologação sandbox, migração SQL em Supabase e concorrência/replay no PostgreSQL. Os testes unitários não substituem esses testes.

## Variáveis de ambiente

Todas estão em [.env.example](.env.example), sem segredos.

| Variável | Uso |
|---|---|
| `APP_URL` | Origem pública única, sem caminho/barra final. HTTPS em produção/checkout; rebuild ao trocar domínio |
| `SEO_INDEXABLE` | `false` por padrão. `true` somente quando quiser indexar produção |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | URL e chave pública do Auth; expostas pelo endpoint público de configuração |
| `SUPABASE_SERVICE_ROLE_KEY` | JWT administrativo legado, somente servidor |
| `MP_MODE` | `test` ou `production`; direitos não atravessam ambientes |
| `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `MP_COLLECTOR_ID` | Credenciais e identidade do recebedor, somente servidor |
| `PAYMENTS_ENABLED` | Manter `false` até configuração e homologação |
| `MP_PRODUCTION_VALIDATED` | `false` por padrão; produção exige confirmação explícita futura, além de PAYMENTS_ENABLED |
| `OFFER_VERSION`, `OFFER_TITLE` | Identificador imutável e descrição da oferta; altere a versão ao mudar a oferta |
| `PRICE_CENTS` | Oferta atual: `1490`. Divergência em relação à oferta do servidor desabilita o checkout |
| `ACCESS_DURATION_DAYS` | Oferta atual: `30` dias após confirmação; não há renovação automática |
| `RESUME_LIMIT` | Oferta atual: `1`, fixo ao currículo indicado no pedido |
| `QUOTA_POLICY` | `distinct_documents`; cota por currículo diferente, sem reposição pela exclusão |
| `REFUND_POLICY` | `revoke_on_refund_or_dispute`, conforme regra acima |
| `OFFER_CAPABILITIES` | Lista escolhida de `save,export_pdf,export_docx,export_txt` |
| `SELLER_NAME`, `SELLER_DOCUMENT`, `LEGAL_ADDRESS`, `CONTACT_EMAIL`, `PRIVACY_EMAIL` | Dados comerciais e de atendimento a preencher e revisar antes da venda |
| `CHROMIUM_EXECUTABLE_PATH` | Caminho do Chrome local para testar PDF em macOS/Windows. Na Vercel Linux, deixar vazio e usar o pacote Chromium |
| `TEST_APP_URL`, `TEST_A_EMAIL`, `TEST_A_PASSWORD`, `TEST_B_EMAIL`, `TEST_B_PASSWORD` | Opcionais, apenas integração com duas contas de teste; nunca versionar |

Preço, prazo e quantidade estão definidos: R$ 14,90, um currículo específico, 30 dias após a confirmação. Edição, troca de modelos e novos downloads desse currículo são liberados durante o prazo. Pagamento único, sem renovação automática e sem desconto. Faltam dados comerciais, configuração e homologação do Mercado Pago. Mantenha PAYMENTS_ENABLED=false e MP_PRODUCTION_VALIDATED=false enquanto essas etapas não forem concluídas.

## PDF e verificações

PDF usa Chromium no servidor, A4, margens por página, texto Unicode selecionável e imagens locais, sem acesso externo durante a renderização. DOCX é OOXML real editável em uma coluna; TXT contém as seções visíveis. **PDF ainda não validado**: instalação do Chromium foi bloqueada e não houve renderização de uma/várias páginas nesta sessão.

```bash
npm run check
npm test
npm run build
npm run dev
# Em outro Terminal, com Chrome em 9222:
npm run test:browser
# Após configurar Supabase e duas contas de TESTE:
npm run test:services
```

`test:browser` usa origem de QA em 3311 e uma aba temporária. Exercita editor/recarga/celular/foto e gera PDF da **prévia**, não da função paga. Para homologar o PDF final, execute uma compra sandbox, exporte uma página e várias páginas por `/api/export`, confira o último marcador, acentos, seleção do texto, margens e cada modelo lateral. O servidor de QA foi bloqueado anteriormente com `EPERM`.

`test:services` declara os testes não executados se faltarem variáveis. Sem documento salvo por uma compra de teste, não afirma isolamento de conteúdo validado. Para testar integralmente: salve documento em A; confirme negação em B e anon; retorne do checkout sem perder o rascunho; repita webhook assinado; confirme direito único/prazo inalterado; teste reembolso e exportação recusada depois da revogação. Nunca injete `paid=true` nem crie compra fictícia no banco para homologar o pagamento.

## GitHub, Vercel e domínio

1. Instale dependências, execute os comandos acima e revise `.gitignore`. Não adicione `.env.local`, credenciais, backups, PDFs, DOCX ou dados pessoais. Gere/revise o lockfile no Terminal com rede.
2. Você pode inicializar o Git e criar o repositório pelo seu fluxo habitual. **Nenhum remoto foi criado e nenhum push foi feito aqui.**
3. Na Vercel, importe o repositório. Preset **Other**, Node 22, install `npm install`, build `npm run build`, output `dist`; o vercel.json declara a função Node e inclui os binários do Chromium.
4. Configure variáveis separadas para Preview e Production; teste com banco/MP de teste e `SEO_INDEXABLE=false`. Verifique os limites do seu plano e o empacotamento/tamanho da função PDF. O deploy Vercel não foi executado aqui.
5. Ao configurar o domínio, use o mesmo valor HTTPS em `APP_URL`, Supabase Site URL/redirects e webhook do Mercado Pago; faça novo build. Não há localhost em URLs de produção geradas.
6. Ative indexação apenas na produção definitiva com `SEO_INDEXABLE=true`. Cadastre uma propriedade de domínio no Google Search Console, faça a verificação DNS indicada pelo serviço e envie `/sitemap.xml`. Conta, editor, auth, API e retorno de pagamento têm noindex; o dado pessoal é protegido por autenticação/RLS, não por robots.txt.
7. Revise os dados de contato, privacidade, retenção e condições de compra antes de vender. As páginas são conteúdo próprio, com campos comerciais pendentes explicitamente indicados, não políticas copiadas.

Páginas públicas: `/`, `/modelos-de-curriculo/`, `/primeiro-emprego/`, `/jovem-aprendiz/`, `/contato/`, `/privacidade/`, `/condicoes-de-compra/`. São HTML estático legível sem JavaScript, com links internos, metadados, sitemap e canônicas quando `APP_URL` estiver definida. Previews ficam fora da indexação por padrão.

## Referências e retomada

O bloqueio de cadastro da referência foi preservado, sem nova tentativa de contorno. O catálogo inteiro e a fidelidade visual integral ainda não foram confirmados. Veja [PROGRESSO.md](PROGRESSO.md).

Fontes oficiais consultadas: [Supabase Auth](https://supabase.com/docs/guides/auth/passwords), [contrato REST do Auth](https://github.com/supabase/auth/blob/master/openapi.yaml), [Preferences do Checkout Pro](https://www.mercadopago.com.br/developers/en/docs/checkout-pro-preferences/create-payment-preference), [Webhooks](https://www.mercadopago.com.br/developers/en/docs/checkout-pro-orders/resources/notifications/webhooks), [Vercel Node](https://vercel.com/docs/functions/runtimes/node-js), [Chromium serverless](https://github.com/Sparticuz/chromium). Nenhuma dessas integrações é considerada homologada apenas pela consulta à documentação.

## Google Ads, GTM e tráfego orgânico

A hospedagem continua na **Vercel**, com código no **GitHub** e domínio próprio. Não há Google Sites/Apps Script, campanhas criadas ou anúncios ativados.

### Inicial para anúncios de Pesquisa

A primeira tela informa que montagem/edição/prévia são gratuitas e salvar na conta/exportar são pagos. Há CTA direto ao editor, exemplos leves de modelos em HTML/CSS, explicação do fluxo e links para os guias originais. No celular o CTA ocupa a largura disponível, não há imagem pesada no topo e os exemplos podem ser percorridos horizontalmente. Não há promessa de contratação, preço inventado ou anúncio de download gratuito.

### Onde configurar os IDs

No ambiente de produção da Vercel, preencha os **valores reais** e faça novo build:

| Variável | Valor a fornecer |
|---|---|
| `GTM_CONTAINER_ID` | ID real do contêiner Web do Google Tag Manager; vazio por padrão |
| `MEASUREMENT_ENABLED` | `true` para habilitar; padrão `false` |
| `MEASUREMENT_ALLOW_NONPRODUCTION` | `false` em uso normal; `true` apenas para testar no Tag Assistant, preferencialmente com contêiner separado |
| `APP_URL` | Origem HTTPS do domínio próprio, sem caminho |
| `SEO_INDEXABLE` | `true` apenas na produção definitiva; `false` em testes/previews |

Os IDs/labels de conversão do Google Ads e, se usado, o Measurement ID do GA4 são inseridos **no GTM**, não no código e não como credenciais do backend. Nenhum ID foi preenchido. A CSP em vercel.json permite os endpoints Google usados pelos templates de tags; confira violações no navegador ao homologar e autorize apenas domínios oficiais necessários.

### Consentimento e dados permitidos

`web/measurement.js` implementa medição básica por consentimento: nenhum contêiner é carregado antes de permitir medição. É possível permitir uso e anúncios separadamente ou escolher somente o necessário; mudar a preferência não bloqueia editor, login ou pagamento. Os defaults de `analytics_storage`, `ad_storage`, `ad_user_data` e `ad_personalization` são negados antes de carregar as tags. Personalização de anúncios permanece negada.

Os eventos têm allowlist: nome do evento, categoria da página e URL normalizada sem query/fragmento; no checkout/compra, apenas ID do pedido, valor e moeda vindos do servidor. Não são enviados nome, e-mail, telefone, senha, identificador da conta, identificador do currículo, texto do currículo, cargo ou nome do arquivo. A URL de recuperação, códigos de autenticação e parâmetros da página de retorno não entram no `page_location`; `page_referrer` é vazio. Os marcadores de deduplicação ficam locais e não são enviados.

**O contêiner GTM é código de terceiros com acesso à página.** Para preservar essa restrição, não publique tags que leiam DOM, formulários, Click Text, localStorage, sessão, dados fornecidos pelo usuário ou URL/referrer brutos. Desative medição automática de formulários e conversões otimizadas/Enhanced Conversions. Não configure `user_id`, user properties pessoais ou captura automática de dados do usuário. A allowlist da aplicação não torna seguro um contêiner configurado para coletar outros dados.

### Eventos e configuração das conversões

| Evento | Momento e significado |
|---|---|
| `resume_start` | Pessoa escolhe começar o preenchimento. Uma vez por rascunho neste navegador, sem transmitir seu ID |
| `resume_complete` | Primeira chegada à revisão final com os campos básicos preenchidos. Não é aprovação de qualidade, exportação ou compra |
| `begin_checkout` | Pedido/preferência criados pelo servidor, imediatamente antes de abrir Mercado Pago. Não ocorre só ao ver a oferta |
| `purchase` | API autenticada reconcilia o pagamento e retorna pedido aprovado em **produção**, com valor/moeda e `transaction_id` derivados do banco |

`purchase` nunca depende de `status=approved`, do nome da página de sucesso ou de um flag local `pago=true`. Pedidos pendentes, revogados, de teste ou executados em Preview não produzem recibo de conversão de compra. O cliente faz consulta autenticada adicional antes de registrar a compra. Sem retorno do usuário à página, consentimento ou com bloqueio de tags, a conversão de navegador pode não chegar ao Google; o status financeiro continua correto no banco. Não foi implementada importação offline/server-to-server para publicidade.

No GTM:

1. Crie variáveis da camada de dados: `page_kind`, `page_location`, `page_referrer`, `analytics_consent`, `ads_consent`, `transaction_id`, `value`, `currency`.
2. Crie acionadores de Evento personalizado para os quatro nomes da tabela. Use `measurement_ready` para inicializar a configuração da medição; `measurement_consent_updated` atualiza as preferências. Configure verificações de consentimento nas tags.
3. Para GA4 opcional, configure a Google tag com o ID real, `send_page_view=false`, `page_location` e `page_referrer` das variáveis seguras e título fixo “Trajetória”. Desative enhanced measurement de formulários, URLs/histórico e captura de dados do usuário. Dispare eventos GA4 somente quando `analytics_consent=true`, respeitando também as verificações de consentimento.
4. Para Google Ads, configure a tag de acompanhamento de conversões com **ID e label reais**. Acione em `purchase`, quando `ads_consent=true`; valor=`value`, moeda=`currency`, **Transaction ID=`transaction_id`**. Configure o Conversion Linker conforme a documentação do Google e o consentimento, para associar os identificadores de clique. Não use URLs brutas como parâmetros dos eventos.
5. Trate compra como conversão principal. Início, revisão e checkout são microconversões secundárias. Escolha uma fonte principal de compra: tag direta do Ads **ou** importação do GA4; não contabilize ambas como compras principais.
6. O mesmo pedido mantém o mesmo `transaction_id`. O cliente evita repetir eventos após recarga/consulta, e o Ads deduplica o mesmo ID dentro da mesma ação de conversão. Se limpar armazenamento ou trocar de dispositivo, a deduplicação do Google continua necessária. Não use nome/e-mail nem ID aleatório por recarga como Transaction ID.

### Validar antes de ativar anúncios

- Execute `npm run check`, `npm test` e `npm run build`; em staging, use contêiner de teste e `MEASUREMENT_ALLOW_NONPRODUCTION=true`.
- No Tag Assistant e na aba Network, confirme que **Somente necessário** não carrega o GTM e não envia eventos. Aceite a medição, confira consentimentos e eventos. Teste a alteração/revogação das preferências.
- Confira que `resume_start`, `resume_complete` e `begin_checkout` correspondem às ações reais; nenhuma variável/evento deve conter campos do formulário ou URL com tokens, e-mail ou parâmetros pessoais.
- Pedido pendente ou mera URL de sucesso não deve disparar compra. Pagamento sandbox também não deve contar como compra real. O teste local cobre esses guardas e a deduplicação, mas não valida a entrega ao Google.
- A validação ponta a ponta da conversão principal exige uma compra de produção autorizada e confirmada pelo servidor, com consentimento e tags corretas, posteriormente. Não foi feita nesta sessão. Reabrir o mesmo pedido não deve gerar uma segunda conversão. Não altere o banco para fingir pagamento aprovado.
- Valide visualmente a inicial em celular e computador e o carregamento com Lighthouse/PageSpeed depois do deploy. Não há pontuação de desempenho nem campanhas homologadas nesta entrega.

### Orgânico e Search Console

As páginas de modelos, primeiro emprego e jovem aprendiz continuam com conteúdo original, exemplos distintos e links para o editor; não foram criadas variações repetitivas por palavra-chave. O HTML público contém o conteúdo sem depender de JavaScript. A medição é opcional e não altera sua rastreabilidade.

Configure `APP_URL` com o domínio definitivo e `SEO_INDEXABLE=true` somente em produção; faça rebuild. Confira as canônicas, `/robots.txt` e `/sitemap.xml` gerados com esse domínio. Preview é noindex por padrão e não deve ser enviado ao Google. No Search Console, adicione uma propriedade de domínio, crie no DNS o registro TXT fornecido pelo Google, confirme a propriedade e envie a URL do sitemap; use Inspeção de URL nas páginas públicas. Indexação e posição na busca não são garantidas.

Contas, currículos, editor, autenticação, retornos de checkout e API não entram no sitemap e mantêm noindex. Os dados pessoais continuam protegidos por autenticação, verificação do proprietário e RLS; robots.txt não é controle de acesso.

Pendências externas: domínio e DNS, publicação Vercel/GitHub pelo responsável, IDs e tags reais, consentimentos testados no contêiner, configuração das ações de conversão, homologação dos pagamentos e validação pelo Tag Assistant/Search Console. Nada disso foi ativado automaticamente.

Referências oficiais para configuração: [camada de dados do GTM](https://developers.google.com/tag-platform/tag-manager/datalayer), [Consent Mode básico](https://developers.google.com/tag-platform/security/guides/consent?consentmode=basic), [deduplicação por Transaction ID no Ads](https://support.google.com/google-ads/answer/6386790).


## Oferta e proteção da prévia — atualização atual

**R$ 14,90 por um currículo específico.** Pagamento único, sem renovação automática e sem desconto. São 30 dias, contados da confirmação, para editar, trocar modelos, salvar na conta e baixar/imprimir novamente esse currículo. Outro currículo exige outra compra. A oferta vem de `CURRENT_OFFER` em `lib/config.mjs`, inclusive enquanto o pagamento está desativado; não depende de valores informados pelo navegador.

A apresentação da prévia foi mantida, com textos de marca d’água visíveis e repetidos sobre o conteúdo. Galeria com dados do usuário, prévia lateral e diálogo ampliado usam o mesmo markup marcado. O evento nativo `beforeprint` atualiza a cópia marcada e a marca d’água é repetida por página na impressão do navegador; não depende de “imprimir planos de fundo”. Não há cópia limpa oculta no DOM. Seleção, botão direito e atalhos não são bloqueados. Isso não impede capturas de tela, cópia ou alterações locais pelo usuário; não é DRM.

Salvar na conta, baixar ou usar o botão de impressão final passa pela oferta e pela autorização. Quem já tem compra válida do mesmo currículo não precisa pagar novamente. O botão de impressão final abre o PDF limpo do servidor após autorização; se o navegador bloquear a nova aba, o PDF é baixado para impressão pelo visualizador. Ctrl+P na página continua imprimindo a prévia marcada, sem ser bloqueado.

A exportação é `POST /api/export` com `{resumeId, format}`. O servidor autentica, carrega o currículo por `id + user_id`, verifica o direito comprado do `client_id` daquele registro e sua validade e reconcilia o pagamento antes de gerar o arquivo. O conteúdo usado vem do PostgreSQL; `data`, `documentKey` ou `paid=true` no payload não fornecem propriedade nem conteúdo ao exportador. A aplicação salva a revisão atual na conta antes de pedir a exportação, sem perder o rascunho local em caso de erro/conflito.

Não há URL pública do arquivo final, pré-geração de PDF/DOCX no navegador ou armazenamento público desses documentos. A resposta é privada (`Cache-Control: no-store`) e entregue como arquivo. Um Blob URL local pode existir **depois** da autorização, para o usuário abrir/imprimir seu PDF; não é uma URL pública antecipada.

Sem a migração 002, a função específica de autorização não existe e a API recusa a operação, sem retornar arquivos. Aplique a migração **002**: ela vincula cada concessão ao currículo do pedido e impede transferir uma compra para outro rascunho. A migração não reinicia prazos de compras existentes. As políticas e RPCs verificam proprietário, estado aprovado, ambiente, revogação, início e expiração. A chave administrativa continua somente no servidor.

Verificação desta atualização: testes da aplicação exercitam os três formatos sem compra, outra conta, direito expirado e compra de outro currículo, com transporte Supabase/Mercado Pago controlado em memória. Também verificam rejeição do payload antigo, uso do conteúdo persistido e a marcação repetida da prévia. **Esses testes não equivalem a aplicar a migração em PostgreSQL real, usar duas contas reais ou validar visualmente o PDF/print no Chrome.** Sem credenciais/Chromium esses itens continuam pendentes.

Para testes externos opcionais, `TEST_UNPAID_RESUME_ID` e `TEST_EXPIRED_RESUME_ID` podem apontar para documentos próprios da conta A em um projeto de teste. Não crie pagamentos fictícios para homologar Mercado Pago. Cobrança real permanece desligada.


## Assistente guiado e modelos profissionais

A criação de um novo currículo começa na galeria de modelos. Depois da escolha, o usuário pode preencher manualmente ou responder às sete etapas do assistente. Executivo, Corporativo, Minimalista, Acadêmico, Técnico e Editorial complementam os modelos existentes.

O assistente é programado e funciona no navegador: não utiliza uma API de IA generativa, não exige chave e não envia as respostas a outro provedor. Ele organiza os dados e propõe um resumo com base somente no objetivo, experiência e habilidades informados. A opção de primeiro emprego não cria experiências fictícias. O resumo pode ser substituído antes da montagem.

As respostas ficam em armazenamento local por rascunho. A finalização cria outro rascunho, preserva o documento anterior e abre a prévia para revisão. Pagamento e verificação de acesso continuam obrigatórios para salvar na conta ou exportar. Os arquivos `assistant-core.js` e `assistant.js` são copiados pelo build para `/assets/`.
