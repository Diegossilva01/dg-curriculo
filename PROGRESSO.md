# Trajetória — progresso para retomada

**Estado: parcial.** O editor local foi ampliado; ainda não há equivalência integral com a referência. Não publicar, cobrar ou alterar dg-conversa.

## Observado na referência

- [x] Landing `/lp/lbrpt01.aspx` → criador; galeria → novo/importar → contato; navegação por experiência, formação, habilidades, idiomas, resumo e conclusão.
- [x] Conclusão: prévia, renomear, baixar/imprimir/e-mail; seis modelos nomeados carregados, outros em placeholders; 24 cores + padrão; fonte, tamanhos e sete controles de formatação.
- [x] Bloqueio real ao clicar **Adicionar seção**: “Por favor, cadastre-se para finalizar seu currículo”, com Google/Facebook/e-mail. Nenhuma credencial fornecida; não contornado.
- [ ] Não confirmados integralmente: restante do catálogo/variações, valores/opções exatos de fontes, foto/enquadramento, sugestões por cargo, gestão de documentos e opções de exportação após autenticação. Não foi possível percorrer todos os formulários novos nesta rodada antes do bloqueio.

## Comparação com a implementação

| Opção | Estado no Trajetória |
|---|---|
| Galeria, cores e fluxo guiado | 10 layouts próprios; quatro preservados + seis inspirados nos observados; 24 cores da referência + padrão; fidelidade visual **parcial**, sem reprodução do catálogo inteiro |
| Dados pessoais e foto | Contato/endereço, imagem opcional, zoom e deslocamento horizontal/vertical; funcionalidades locais, enquadramento exato da referência não comparado |
| Experiência, formação, habilidades, resumo, idiomas | Editar, adicionar, excluir, reordenar; idiomas por nível; navegação e prévia mantêm os dados |
| Cursos, certificados, links, extras | Seções locais funcionais, inclusive personalizadas; não declarar equivalência com opções atrás do cadastro |
| Tipografia/layout | 6 fontes do sistema; tamanhos do texto, nome e títulos; espaçamentos, margens, recuo e espessura; opções exatas da referência pendentes |
| Ordem de seções | Mover e ocultar preservando conteúdo; modelos laterais agrupam contato/competências na coluna lateral |
| Sugestões/ajuda | Exemplos editáveis em 4 áreas e dicas; sem busca arbitrária por cargo, geração remota ou IA |
| Gestão de currículos | Criar, editar, renomear, duplicar e excluir rascunhos locais; backup JSON adiciona cópias sem substituir os existentes |
| Exportação | PDF pela impressão; TXT; DOCX real em uma coluna com foto e formatação básica; não há fidelidade de duas colunas no Word nem envio por e-mail |
| Conta e pagamento | Somente interfaces de integração em `business.js`; login/conta informam dependência, sem sessão falsa; cobrança desligada e testes livres |

## Verificação e preservação

- [x] Sintaxe dos arquivos da aplicação; 13 testes passaram.
- [x] Migração v1 → biblioteca v2 sem apagar a chave antiga; preservação entre modelos, currículos e etapas; duplicação/exclusão; reordenação/ocultação.
- [x] ZIP/XML do DOCX verificados com 60 experiências e marcador final; TXT longo; foto incluída no DOCX; entradas escapadas/validadas.
- [ ] QA real em Chrome/celular, enquadramento visual e PDF longo: `npm run test:browser` **não executou as verificações** porque o servidor de QA foi bloqueado por `EPERM` em `127.0.0.1:3311`. Não há confirmação de servidor ativo.
- [ ] Abrir PDF longo, confirmar última seção, margens em cada página e quebras nos modelos com coluna lateral. O teste de QA gera artefatos para essa revisão quando executado no Terminal normal.

## Retomar

1. `npm start` no Terminal normal → aguardar mensagem e abrir `http://127.0.0.1:3000`.
2. Node 22 + Chrome em 9222: `npm run test:browser`. Usa porta 3311 e aba temporária, sem tocar nos rascunhos da porta 3000. Rever artefatos em `test-artifacts/`.
3. Com referência acessível sem ultrapassar cadastro, concluir comparação visual/modelos/fluxos faltantes. Login, persistência remota e gateway continuam como próxima etapa explícita.

Evidências em `docs/rea-inspecao-2026-10-19.json`: landing `ev_3adfb1d8701d96ffecf76e1bfd9ce78dd511f180596c6452b59b35f938d8a4df`; conclusão `ev_550424f9f41bfc6496f5f5a4a2a0a8623c3b3231fdd0d4ace2139b2dd597d108`; cadastro bloqueante `ev_ddfe2cc17f1eef54f252ff46044e5c426e4b9fd36784195b16a48a090a31ef70`; screenshot do modal `ev_ceca0e573e5cd529f213a76af65f926d1ecc0a1da96c9374d9220f44567c5a9b`. Capturas são limitadas ao observado, sem histórico completo de execução.

## Entrega atual — GitHub/Vercel, Auth e Checkout Pro

**Código preparado; homologação externa pendente. Não publicar nem cobrar nesta sessão.**

### Pronto no código

- [x] Editor preservado; rascunhos locais e versão remota separados. Backup e troca de modelo mantidos.
- [x] Build estático em `dist/`, Vercel Node Function em `api/handler.js`, configuração de deploy em `vercel.json`; sem processo permanente no MacBook.
- [x] Supabase Auth por API oficial: cadastro, login, logout, confirmação e recuperação PKCE. Nenhuma senha persistida pela aplicação.
- [x] Migração SQL `supabase/migrations/001_trajetoria.sql`: currículos por proprietário, RLS, pedidos, pagamentos, direitos, cota transacional, revisões e limites de requisição. **SQL ainda não aplicado num Supabase real.**
- [x] Conta: listar, abrir, salvar, renomear, duplicar e excluir; migração local idempotente sem substituir existentes, quando houver direito comprado. Sem compra, o conteúdo permanece local.
- [x] Checkout Pro Preferences: oferta configurável, pedido persistido, criação exclusiva de preferência, retornos aprovado/pendente/não concluído e consulta autenticada.
- [x] Webhook HMAC, consulta ao pagamento e conferência de pedido/usuário, recebedor, valor, moeda, ambiente e status; processamento transacional idempotente e revogação por reembolso/contestação implementados.
- [x] Arquivo final protegido por autenticação e direito no servidor; PDF A4 server-side implementado com Chromium. DOCX e TXT também gerados no servidor.
- [x] Sete páginas públicas próprias, metadados, links, sitemap/robots e canônicas por `APP_URL`. Indexação desativada por padrão; páginas privadas com noindex.
- [x] `.env.example` sem segredos e `.gitignore` atualizado. Não há remoto, push, deploy ou cobrança realizados.

### Verificações executadas

- [x] Corrigido o teste antigo que esperava o fluxo fictício anterior. `npm test`: **19 testes passaram**.
- [x] `npm run build`: passou, sete páginas públicas; `npm run check`: passou.
- [x] Testes locais: preservação/migração, dez etapas, modelos, reordenação, DOCX/ZIP/XML com texto longo, TXT, assinatura e conferências de pagamento, revogação mapeada, negação da API sem sessão e webhook sem assinatura.
- [x] `npm run test:services`: declarou **NÃO EXECUTADO** por ausência de Supabase e duas contas; isso não é aprovação do fluxo real.

### Bloqueios e pendências reais

- [ ] `npm install` bloqueado por `ENOTFOUND registry.npmjs.org`. Dependências PDF declaradas, mas não instaladas; sem lockfile gerado nesta sessão.
- [ ] Sem credenciais/projetos externos: cadastro/login/logout/recuperação reais, aplicação da migração, isolamento entre duas contas e migração na conta não homologados.
- [ ] Sem credenciais Mercado Pago: checkout sandbox, assinatura real, notificações repetidas no PostgreSQL, reembolso/chargeback e liberação de direitos **não validados**. Testes unitários não substituem homologação.
- [ ] PDF final de uma/várias páginas, texto selecionável/acentos/paginação e layouts laterais **não validados**. Renderizador não pôde ser instalado. O PDF de prévia do teste de navegador não valida o endpoint pago.
- [ ] QA real desktop/celular e deploy Vercel pendentes; sandbox anteriormente bloqueou portas locais com `EPERM`.
- [ ] Referência continua na conclusão com barreira de cadastro já registrada. Catálogo completo/fidelidade integral não confirmados, sem contornar acesso nem repetir inspeções concluídas.
- [ ] Definir preço, prazo, quantidade, recursos, política de cota/reembolso e dados comerciais. Checkout fica desativado/inoperante sem oferta completa; nenhuma promessa de valor, vitaliciedade ou acesso ilimitado foi inventada.

### Comandos para retomar no Terminal normal

```bash
cd /Users/macbook/curriculo-web
npm install
cp .env.example .env.local
# Configure .env.local e aplique o SQL no Supabase de TESTE.
# Nunca sobrescreva um .env.local existente com o comando acima.
npm run check
npm test
npm run build
npm run dev
```

Aguardar a mensagem de inicialização: inicial `http://127.0.0.1:3000/`, editor `http://127.0.0.1:3000/editor/`. Em outro Terminal, depois de configurar o serviço: `npm run test:browser` e `npm run test:services`. Instruções completas de Supabase, Mercado Pago, GitHub/Vercel/domínio, variáveis e decisões comerciais no README. Gere/revise o lockfile após instalar; nunca versione `.env.local`, credenciais ou dados pessoais.

Não considerar a entrega homologada até concluir os itens externos e a comparação visual pendente.

## Captação Google — ajustes desta rodada

- [x] Inicial focada em Pesquisa: proposta clara, CTA direto, gratuito/pago antes do início, exemplos em HTML/CSS e apresentação adaptada ao celular, sem imagens/fontes externas pesadas.
- [x] Conteúdo orgânico original preservado; canônicas, sitemap e exclusão de rotas pessoais testados em build com domínio de teste. Nenhuma página repetitiva por palavra-chave adicionada.
- [x] GTM configurável e desativado por padrão. Consentimento por categoria antes do carregamento; eventos com allowlist e URLs sem parâmetros pessoais.
- [x] Eventos de início, revisão/conclusão e checkout conectados às ações reais. Compra consulta API autenticada e só aceita recibo aprovado de produção. Pedido é Transaction ID; deduplicação local e instrução de deduplicação no Ads.
- [x] README e .env.example: IDs pendentes, tags/consentimento, conversões, validação e Search Console documentados. Editor, conta, pagamento e Vercel preservados.
- [x] 25 testes passaram, incluindo proteção dos eventos, negação sem consentimento, confirmação de compra, deduplicação e conteúdo/canônicas/sitemap. Sintaxe e build passaram.
- [ ] GTM/Google Ads/GA4/Tag Assistant reais não configurados nem validados: nenhum ID fornecido. Compra real e entrega da conversão ao Google não testadas.
- [ ] Validação visual real em celular, PageSpeed e indexação/Search Console dependem de deploy/domínio. Permanecem os bloqueios anteriores do PDF/pagamento externo; não houve cobrança, campanha ou publicação nesta sessão.

## Oferta de R$ 14,90 e separação prévia/final

- [x] Oferta fixada no servidor: R$ 14,90 por um currículo específico, 30 dias a partir da confirmação, pagamento único, sem renovação automática e sem desconto. Exibida ao salvar/baixar/imprimir final, mesmo com cobrança desligada.
- [x] Prévia preserva layout e conteúdo, com marca d’água textual visível e repetida na galeria, painel e ampliação. Ctrl+P usa a cópia marcada, com overlay fixo repetido nas páginas. Não se bloqueiam seleção, botão direito ou atalhos; não se promete impedir captura de tela.
- [x] Exportação recebe somente ID do registro da conta + formato. Servidor verifica autenticação, proprietário, permissão daquele currículo, validade e pagamento; conteúdo vem do banco, sem confiar no payload/localStorage.
- [x] Arquivos finais limpos somente na resposta autenticada; nenhum PDF/DOCX antecipado ou URL pública. Impressão final abre PDF autorizado; a impressão da página permanece marcada, inclusive após comprar.
- [x] Migração `002_specific_curriculum.sql` vincula a compra ao currículo do pedido e impede transferência para outro rascunho. Aplicar depois de 001; não reinicia os prazos existentes.
- [x] Rascunhos preservados durante login/checkout; revisão salva na conta antes da exportação, com controle de conflito.
- [x] 31 testes locais passaram, incluindo negação de PDF/DOCX/TXT sem compra, por outra conta, com acesso expirado e para outro currículo, usando transporte de serviços controlado em memória. Testado também conteúdo vindo do servidor e rejeição de `paid=true`/payload antigo.
- [ ] Migração 002, isolamento e expiração em Supabase real, pagamento real/sandbox e inspeção visual de marcas/PDF/print ainda não homologados neste ambiente. Testes locais não substituem essas verificações.
- [x] `PAYMENTS_ENABLED=false` e `MP_PRODUCTION_VALIDATED=false` no exemplo. Produção exige ambos os gates explícitos; nenhuma cobrança ativada.

## Preparação para dg-curriculo

- Verificado antes de qualquer configuração: a pasta não tinha `.git`; portanto não havia remote local. Nenhum remote foi criado, nenhum push foi executado.
- `.gitignore` revisado: exclui dependências, build, ambientes privados, Vercel, relatórios, caches e temporários. Preserva `.env.example`, `package-lock.json`, código, migrações e documentação. Lockfile compatível com as dependências declaradas. Varredura básica não encontrou padrões de credenciais; não constitui auditoria completa de segredos.
- Bloqueio: `git init -b main` retornou `.git: Operation not permitted` nesta sessão. Commit ainda não criado. A consulta da identidade Git não retornou nome/e-mail; configurar uma identidade real se o Git solicitar. Não foram alteradas configurações globais.
- No Terminal normal, preparar e revisar o commit:

```bash
cd /Users/macbook/curriculo-web
git init -b main
git status --short --ignored
git check-ignore node_modules/ dist/ .env.local
git check-ignore .env.example # esperado: sem saída, exit 1
git add .
git diff --cached --stat
git diff --cached --check
# Confira os arquivos antes do commit. Se faltar identidade, configure
# git config user.name "SEU NOME"
# git config user.email "SEU EMAIL GIT OU NOREPLY DO GITHUB"
git commit -m "feat: prepara Trajetória para publicação"
```

- Instalação e retomada das verificações: `npm ci`, `npm run check`, `npm test`, `npm run build`; desenvolvimento: `npm run dev`. As verificações funcionais anteriores permanecem registradas acima; PDF e pagamento externo não foram validados nesta preparação.
- Próximo passo: obter a URL exata de `dg-curriculo`, consultar o conteúdo remoto antes de associar/enviar e preservar qualquer histórico existente. Não usar force push.

### Envio autorizado ao GitHub

- Destino informado e envio autorizado: `https://github.com/Diegossilva01/dg-curriculo`.
- Nova tentativa: `git ls-remote` falhou com `Could not resolve host: github.com`; não foi possível determinar se o remoto contém histórico. `git init -b main` continuou bloqueado com `.git: Operation not permitted`. Não houve commit, configuração de remote ou push.
- Executar os comandos fornecidos na conversa no Terminal normal: consultar refs remotas primeiro, parar se houver conteúdo, revisar staging e enviar sem force somente quando vazio. Se houver histórico remoto, integrá-lo após inspeção; não sobrescrever.
