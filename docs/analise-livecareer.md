# Análise do LiveCareer

Observação em 19/10/2026, pelo REA, reutilizando Chrome em http://127.0.0.1:9222.

## Evidência observada

- Página pública https://www.livecareer.com.br/: descreve modelos, preenchimento guiado, sugestões, edição em tempo real e exportação. Evidence: ev_8aba496180624d52f5f118cd590bad8d5666a41bf29d7d670b4629809fd55880.
- Entrada https://www.livecareer.com.br/criar-cv: apresenta personalização, conteúdo assistido e formatos PDF, DOCX e TXT; botão Começar. Evidence: ev_0386f21aaf563f78096a92cd49261029c6d6e2baf832cfdd8772a26a59bdcb97.
- Após clicar em Começar: rota /criar-cv/escolher-modelo, galeria de modelos, cores e exemplos de seções de currículo. Evidence: ev_9e1d6b288e54f80b29a8c3620f15e0201234398330588fdd73287e4c0f0eb756.

A descrição pública de recursos não comprova o funcionamento interno deles. Não foram testados cadastro, pagamento, IA, edição após seleção de modelo nem downloads do LiveCareer. As capturas não incluem histórico de rede completo nem identidade dos artefatos do servidor.

## Decisões da implementação local

Trajetória usa identidade e código próprios. O editor tem dados pessoais, experiência, formação, habilidades e idiomas, resumo, modelo/cores e revisão. O preenchimento começa pelos dados pessoais; os modelos podem ser trocados sem perder conteúdo. Há três layouts, cinco cores, textos de exemplo editáveis e prévia ao digitar.

O salvamento usa localStorage, com backup JSON importável. PDF usa impressão nativa do navegador, com CSS A4 e texto selecionável. Há download TXT. Não foram implementados IA remota, DOCX, contas, cobrança ou sincronização entre dispositivos.

## Comparação e ajustes em 19/10/2026

A captura visual da galeria mostrou cabeçalho azul-marinho, conteúdo centralizado, amostras de página completas em quatro colunas, cores acima da galeria e seleção com contorno azul. Evidence: ev_cebccd7383a47e37f384d4cb553804f345efb023937676d16d750c265c1dc754.

Ao selecionar o primeiro modelo, o site mostrou uma escolha entre novo currículo e importação; depois de escolher novo e continuar, abriu /criar-cv/secao/cntc com formulário, barra lateral e prévia. Evidence: ev_8c1fd5ca695e4bf387793e7727ae4e3680b6d16a67cd97ba1472769c0afc0d98 e ev_2423daeb2605d767e7307f5bd289f436852e01de22028e12b365333d2f1e051e.

A implementação agora inicia com galeria para currículos vazios, preserva a edição dos currículos existentes, usa amostras completas e oferece criação ou abertura de backup JSON. Foram adicionados um quarto modelo com coluna lateral, mais cores, cabeçalho e navegação azul-marinho e botões verdes. O editor exige nome, sobrenome e e-mail ao continuar. A identidade continua própria. A importação é de backup JSON, sem extração de PDF/DOCX. Não foram reproduzidos fotos, IA, pagamentos nem todos os modelos da referência.

O Chrome remoto permaneceu acessível pelo REA. O servidor local não pôde iniciar: `listen EPERM: operation not permitted 127.0.0.1:3000`. A abertura pelo sistema falhou com `Unable to find application named 'Google Chrome'`; o Chrome acessível por CDP não corresponde a um aplicativo local disponível ao comando `open`. Não foi possível abrir ou comparar visualmente a implementação local nesse ambiente.
