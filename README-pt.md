> **English speaker?** Read the [English version](README.md).

# Ficha de Personagem de QA — um portfólio ARPG

> E se o currículo de um engenheiro de QA fosse a tela de personagem de um RPG de ação?

[![CI](https://github.com/vladmirprates/arpg-character/actions/workflows/ci.yml/badge.svg)](https://github.com/vladmirprates/arpg-character/actions/workflows/ci.yml)
[![Deploy](https://github.com/vladmirprates/arpg-character/actions/workflows/deploy.yml/badge.svg)](https://github.com/vladmirprates/arpg-character/actions/workflows/deploy.yml)
![Acessibilidade](<https://img.shields.io/badge/a11y-WCAG_2.2_AA_(axe)-blue>)
![Stack](https://img.shields.io/badge/React_19-TypeScript-informational)

**▶ Jogue:** https://vladmirprates.github.io/arpg-character/

Sou **Vladmir Prates**, QA pleno que joga ARPGs demais (Path of Exile, Diablo, Last Epoch). Este projeto é a minha carreira em forma de ficha de personagem — e, mais importante, um pequeno produto construído e testado do jeito que eu gostaria que qualquer feature de jogo fosse testada.

## O que tem aqui

| Tela                                          | O que faz                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tela do personagem**                        | No layout do Path of Exile 1: ficha do personagem, uma aba de baú com os itens salvos e a janela de inventário — equipamentos na disposição e nos tamanhos exatos do PoE, sobre uma mochila de 12×5. Cada item é uma ferramenta ou característica do meu dia a dia de QA. Passe o mouse ou foque um item para ver o tooltip; **Ctrl+C copia** no formato clássico de texto de item de ARPG. A ficha é calculada, não digitada: os quatro atributos (Automação, Manual, Processo, Senso de Jogo) somam os pontos da árvore passiva da Minha Build, as cinco resistências (Código Espaguete, Incêndios em Produção, Prazos Apertados, Aumento de Escopo, Testes Instáveis) são a soma dos equipamentos, e todo item tem nível mínimo.                                                                                                                  |
| **Barra de ações**                            | Habilidades Q W E R T com atalhos reais, recarga animada e globos de Sanidade/Café. Usar habilidade gasta Café; acabou o Café, você recebe o clássico _“Café insuficiente”_.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Árvore passiva**                            | ~240 nós no estilo do PoE: caminhos de nós pequenos levando a clusters em roda e em hub, 62 notáveis, 13 maestrias e 16 keystones. Cada notável é uma habilidade ou ferramenta específica (Playwright, Appium, CI/CD, JMeter/k6, SQL, acessibilidade…), em Testes de Jogos, Testes Manuais, Automação de Testes, Estratégia e Liderança e quatro especialidades nas pontes; cada região termina numa keystone de Maestria. Duas abas: **Minha Build** (somente leitura) e **Monte a Sua**. Clique em qualquer nó para alocar o caminho mais curto até ele; passe o mouse para ver custo/reembolso; desalocar remove galhos desconectados. Builds ficam salvas e podem ser compartilhadas por link. Um Resumo da Build lista as keystones e maestrias e leva até cada uma; emblemas das regiões e uma nebulosa opcional mostram as áreas num relance. |
| **Encontre os Bugs**                          | Uma caça aos bugs opcional: ao começar, cinco bugs são plantados na página, de um visível (um item que você não poderia equipar no seu nível) a bugs funcionais que só aparecem quando você usa um recurso — um baú que salva a versão anterior do item, Ctrl+clique duplicando itens, habilidades que deixam o Café negativo. Encontre cada um com Inspecionar Elemento (Q), com mouse, toque ou teclado; cada achado registra o bug report com severidade e passos para reproduzir, e corrige a página.                                                                                                                                                                                                                                                                                                                                            |
| **Relatório de QA**                           | O relatório de qualidade do próprio site, gerado pela pipeline de deploy a partir dos resultados reais: testes de unidade e de propriedades, cobertura, testes end-to-end e de acessibilidade, notas do Lighthouse. O deploy é um portão de qualidade.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Diário de Missões e Cartas de Adivinhação** | Minha carreira como Atos, missões secundárias e provas; 37 recomendações de colegas no LinkedIn como cartas de adivinhação, cada uma com arte própria e um selo de como trabalhamos juntos (traduções sinalizadas, originais a um clique).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Bancada de criação**                        | Nove orbes com regras reais de crafting (raridade, limite de 3 prefixos / 3 sufixos, máximo de 6 afixos, corrupção com três resultados). Popup no estilo do PoE: pegue a moeda na aba de moedas (clique ou botão direito), clique no item para usar, Shift para mantê-la no cursor, Esc para devolver; ou arraste-a até o item. Guarde até 24 itens num baú persistente; arraste (ou clique, ou Ctrl+clique) qualquer item entre a mochila e o baú. No celular, tocar num orbe já o usa no item, com as moedas fixas ao alcance.                                                                                                                                                                                                                                                                                                                     |

E mais: inglês / português, efeitos sonoros na bancada de criação (com mudo), partículas e brasas no fundo (desligáveis com _Reduzir movimento_ ou pela configuração do sistema), e layout que funciona de celulares de 320px a monitores ultrawide — no celular o resumo da árvore vira uma gaveta para a árvore ocupar a tela.

## A parte de QA

O site é a amostra de trabalho, então a engenharia foi feita para ser verificada.

### Todo craft é reproduzível

O motor de crafting é uma **função pura com RNG semeado**. Um craft é descrito por `base + semente + orbes`, então a bancada consegue:

- **Copiar link de reprodução** — abre exatamente o mesmo item em qualquer máquina (`#craft=bug.2a.0458`).
- **Copiar relatório de bug** — um ticket pronto: ambiente (semente), passos numerados incluindo as tentativas que _falharam_, resultado obtido e o link de reprodução.

É a piada de QA levada a sério: o gerador de bug reports abre bug reports sobre os seus bug reports.

### Pirâmide de testes

| Camada                  | Ferramenta                     | O que garante                                                                                                                                                                                                                                                                                                      |
| ----------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unitário                | Vitest                         | As regras e mensagens de erro de cada orbe; alocação, caminhos e reembolsos da árvore; parsing de códigos compartilhados (entrada não confiável).                                                                                                                                                                  |
| Baseado em propriedades | fast-check                     | Milhares de sequências aleatórias de orbes por execução nunca geram um item ilegal; itens corrompidos só mudam com o Orbe da Reversão; qualquer sequência de cliques mantém a árvore conectada; todo código de receita e de build faz ida e volta.                                                                 |
| Componente              | Testing Library                | Comportamento da UI pela árvore de acessibilidade: papéis, nomes, anúncios em live regions, operação por teclado, persistência e recuperação de storage corrompido.                                                                                                                                                |
| Ponta a ponta           | Playwright (desktop + Pixel 7) | Fluxos em navegador real: criar → guardar → recarregar → reabrir, links de reprodução em outra aba, arrastar e soltar, área de transferência, compartilhamento de builds, a caça aos bugs completa (com relógio congelado), uso só com teclado, fluxos de toque no celular, sem rolagem horizontal de 320 a 412px. |
| Acessibilidade          | axe-core                       | Zero violações WCAG 2.2 A/AA na ficha, na árvore e na bancada, nos dois tamanhos de tela.                                                                                                                                                                                                                          |
| Regressão visual        | Screenshots do Playwright      | Diferença de pixels da ficha e da árvore, com baselines Linux mantidas pelo CI.                                                                                                                                                                                                                                    |
| Performance             | Lighthouse CI                  | Metas de nota (performance ≥ 0,9, acessibilidade e boas práticas ≥ 0,95) no site buildado antes do deploy, e de novo na URL publicada depois dele.                                                                                                                                                                 |

Os limites de cobertura são obrigatórios: **95% de linhas e funções** nas regras do jogo, mais um piso para o app inteiro, para que a cobertura possa subir mas nunca cair sem ninguém notar. Tudo roda no GitHub Actions em todo push e PR, e o deploy só publica se tudo passar.

### Bugs que esta reescrita encontrou

A versão antiga era JS puro. Reconstruí-la com testes revelou defeitos reais — o tipo de lista que eu entregaria para um time depois de um ciclo de testes:

- A animação de brilho da aura **nunca rodava**: o CSS apontava para `#aura1`, que não existia.
- Os tooltips da árvore usavam um tema e uma animação do Tippy cujo CSS **nunca era carregado**.
- Scripts de CDN **sem versão fixa** (`tippy.js@6`) e sem verificação de integridade.
- `initial-scale=0.6` encolhia a página no celular para esconder um layout de 431px — agora a suíte garante **zero rolagem horizontal** a partir de 320px.
- Erros de crafting apareciam na tela mas **nunca eram anunciados** para leitores de tela.
- Modais eram divs simples: o fundo continuava acessível para tecnologias assistivas.
- Itens salvos **sumiam ao recarregar** e não podiam ser removidos; “baú cheio” usava um `alert()` bloqueante.

…e os que os novos testes pegaram no código novo antes de publicar:

- Tooltips maiores que a tela podiam ficar **fora da tela** (teste unitário da matemática de posicionamento).
- Arrastar um orbe rápido **perdia o ponteiro** antes do primeiro evento de movimento (teste E2E de arrasto).
- Tooltips de elementos dentro de um `<dialog>` modal apareciam **por baixo dele** — a top layer vence qualquer `z-index` (E2E).
- A barra de ações fixa podia **cobrir o elemento focado** no celular (WCAG 2.4.11), descoberto quando o Playwright não conseguia tocar nele.
- Apertar Esc na carta ampliada **fechava a galeria inteira**: o React propaga eventos de um `<dialog>` aninhado para o pai (teste unitário).
- Limpar um storage adulterado **apagava o item duplicado plantado** antes que a caça aos bugs pudesse mostrá-lo (teste unitário do `normalize`).
- O axe apontou painéis com rolagem (registro de criação, diário de missões, relatório de QA) que **não rolavam pelo teclado**.
- A primeira versão rodava a **4 FPS**. Um trace mostrou que ~95% de cada frame ia para rasterizar um canvas de tela cheia com brasas desfocadas; refeito com CSS que roda só no compositor, chegou a 60 FPS (e mover a árvore parou de re-renderizar o React a cada movimento do mouse).

## Por dentro

- **React 19 + TypeScript (strict)**, build com Vite, deploy no GitHub Pages via Actions.
- **Regras do jogo sem framework** (`src/game/`): puras, determinísticas e totalmente testadas. O React só renderiza.
- **Conteúdo como dados tipados** (`src/data/`) com inglês e português lado a lado; tradução faltando é erro de compilação.
- **Sem `innerHTML`.** O texto dos itens usa uma mini-marcação (`[valor]`, `{destaque}`, `((aviso))`) renderizada como nós React.
- **Recursos nativos da plataforma** no lugar de bibliotecas: `<dialog>` para modais (focus trap, Esc e fundo inerte de graça), Web Audio para efeitos sintetizados, animações CSS só no compositor para os efeitos, container queries para o inventário.
- **Toda entrada não confiável é validada**: links compartilhados e `localStorage` são lidos de forma defensiva; itens do baú são recriados a partir da receita, então um storage adulterado não gera item ilegal.

## Rodando localmente

Requer Node.js 20+.

```bash
npm install
npm run dev            # http://localhost:5173
npm test               # testes unitários, de propriedades e de componentes
npm run test:coverage  # com limites de cobertura
npx playwright install chromium
npm run e2e            # ponta a ponta + acessibilidade (faz o build e sobe o app)
npm run qa:report      # tudo acima + Lighthouse, e gera o relatório de QA do app
```

### Alterando a “Minha Build”

Abra a árvore passiva → **Monte a Sua** → aloque os pontos → **Exportar código da build**, e cole o código em `MY_BUILD_CODE` no arquivo [`src/data/myBuild.ts`](src/data/myBuild.ts).

---

Ícones da árvore passiva por Lorc, Delapouite e colaboradores, de [game-icons.net](https://game-icons.net), sob licença [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).

**Vladmir Prates** — Engenheiro de QA · [LinkedIn](https://www.linkedin.com/in/vladmirprates/)

Todos os “bugs” dos itens são (quase) fictícios. 😉
