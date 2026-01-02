# 🛡️ QA Character Sheet & Crafting Bench

> Um portfólio interativo e gamificado combinando minha paixão por ARPGs com minha carreira em **Quality Assurance**.

![Project Status](https://img.shields.io/badge/Status-Complete-success)
![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen)
![Accessibility](https://img.shields.io/badge/A11y-WCAG_2.1-blue)

## 🎯 Sobre o Projeto

Este projeto é um experimento pessoal: **"E se o meu currículo fosse um Action RPG estilo Path of Exile, Diablo, Last Epoch, etc?"**

Como **QA Pleno**, meu objetivo foi sair da minha zona de conforto e unir o trabalho à diversão. Eu queria construir algo interativo para demonstrar minhas habilidades técnicas, mas também usar este projeto como um **laboratório de aprendizado**.

O foco não é apenas mostrar código, mas sim como aplico a **Mentalidade de QA** no desenvolvimento de software: garantindo que seja testável, acessível e bem estruturado desde o primeiro dia.

**Principais Funcionalidades:**
* **Árvore de Habilidades Passivas:** Um grafo interativo (com zoom/pan) que visualiza minhas competências de QA de forma lúdica.
* **Bancada de Crafting:** Um simulador totalmente funcional onde você usa "Orbs" para modificar *Relatórios de Bug* e *Casos de Teste*, aplicando regras de negócios reais (probabilidades, restrições de prefixos/sufixos). Basicamente uma réplica do sistema de crafting do Path of Exile.
* **Sistema de Inventário:** Slots de equipamento representando as ferramentas que uso diariamente (Jira, Playwright, etc.).

---

## 🛠️ O Que Aprendi e Apliquei (Destaques Técnicos)

Este projeto foi uma oportunidade para praticar conceitos avançados que valorizo na minha rotina diária de trabalho.

### 1. 🧪 Testes Automatizados (Jest)
Acredito que a qualidade deve ser garantida por código, não apenas esforço manual.
* Desacoplei a lógica de negócios (`CraftingSystem.js`) da interface (UI) para facilitar os testes.
* Criei **Testes Unitários** para validar probabilidades de itens e restrições de regras.
* Usei **Testes de Integração** para garantir que a interface responda corretamente às ações do usuário.

### 2. ♿ Acessibilidade (A11y)
Software de qualidade deve ser utilizável por todos. Me esforcei para aplicar as melhores práticas da WCAG:
* O projeto é **100% navegável via teclado** (Tab, Enter, Esc).
* Implementei **"Focus Traps"** (armadilhas de foco) nos modais para que usuários de teclado não se percam.
* Usei `roles` semânticas e `aria-labels` dinâmicos para que leitores de tela entendam o contexto (ex: os resultados do crafting são anunciados automaticamente).

### 3. 🏗️ Arquitetura e Organização
Tentei manter o código limpo e organizado para facilitar a manutenção futura.
* **Padrão MVC:** Separação clara entre Lógica (Model), Interface (View/Controller) e Dados.
* **Segurança:** Prevenção básica de XSS evitando manipulação insegura do DOM.

---

## 🚀 Como Rodar Localmente

Se você quiser testar a aplicação ou rodar a suíte de testes na sua máquina:

### Pré-requisitos
* **Node.js** (Necessário apenas para rodar os testes automatizados)
* Um navegador moderno.

### Instalação

1.  **Clone o repositório:**
    ```
    git clone https://github.com/vladmirprates/arpg-character.git
    cd arpg-character
    ```

2.  **Instale as dependências (para testes):**
    ```
    npm install
    ```

## 🟢 Rodando os Testes
Para ver a validação das regras de negócio em ação:

```bash
npm test
```
Você deverá ver todos os testes passando no terminal.

## Rodando a Aplicação
Como este projeto usa Módulos ES modernos, ele requer um servidor local simples.

Opção A: Usando Python

```
python -m http.server
```
Abra http://localhost:8000 no seu navegador.

Opção B: Usando VS Code

Instale a extensão Live Server.

Clique com o botão direito no index.html e selecione "Open with Live Server".

##📂 Estrutura do Projeto
```
/
|
│   ├── js/
│   │   ├── data/             # Dados Estáticos (Pool de Itens, Nós da Árvore, Textos)
│   │   ├── CraftingBench.js  # Controlador da Interface (UI)
│   │   ├── CraftingSystem.js # Lógica Pura (Regras do Jogo)
│   │   ├── PassiveTree.js    # Lógica do Grafo e Zoom
│   │   ├── main.js           # Ponto de Entrada
│   │   └── tooltips.js       # Configuração de Tooltips
│   ├── css/                  # Estilos e Responsividade
│   └── icons/                # Assets Visuais
├── tests/                    # Suíte de Testes (Jest)
│   ├── CraftingBench.test.js
│   ├── CraftingSystem.test.js
│   └── PassiveTree.test.js
├── index.html                # HTML Principal
├── package.json              # Config do NPM
└── babel.config.js           # Config do Babel (para o Jest)
```

### 👤 Autor
Vladmir Prates - QA Pleno

Hobbies: ARPGs, Jogos em geral, música e aprender novas tecnologias.

Este é um projeto de portfólio feito com carinho. Todos os "bugs" encontrados nos itens são (quase) puramente ficcionais. 😉
