import type { L, Locale } from "../i18n/types";

/**
 * LinkedIn recommendations as PoE divination cards. The card name is a short title drawn from what
 * the person said; their quote is the flavour text. Originals are kept verbatim (typos included —
 * they are quotes); `translation` is mine and the card says so.
 */

export type Relation = "sameTeam" | "otherTeam" | "otherCompany" | "manager";

export interface Recommendation {
  id: string;
  title: L;
  name: string;
  role: L;
  /** "YYYY-MM-DD", when it was written. */
  date: string;
  relation: Relation;
  /** Language the recommendation was written in. */
  lang: Locale;
  original: string;
  /** Translation into the other language. */
  translation: string;
  /** Card art: a game-icons.net name matched to the card's title (bundled by scripts/extract-tree-icons.mjs). */
  artIcon: string;
}

const same = (s: string): L => ({ en: s, pt: s });

/** Newest first. */
export const RECOMMENDATIONS: Recommendation[] = [
  {
    id: "lucas-duarte",
    title: { en: "The Foreseer", pt: "O Vidente" },
    name: "Lucas Duarte",
    role: { en: "Senior QA Engineer", pt: "QA Engineer Sênior" },
    date: "2025-04-30",
    relation: "sameTeam",
    lang: "pt",
    original:
      "Tive o privilégio de trabalhar com o Vladmir e posso afirmar com segurança que se trata de um dos profissionais mais comprometidos e competentes que já conheci na área de Quality Assurance. Vladmir tem uma visão analítica apurada, atenção aos detalhes e uma capacidade impressionante de antever possíveis falhas. Sua abordagem nos testes manuais e automatizados, agregou imenso valor à qualidade do nosso trabalho. Um dos pontos que se destaca é pelo espírito colaborativo e comunicação, sempre disposto a ajudar, discutir e sugerir melhorias.",
    translation:
      "I had the privilege of working with Vladmir and can safely say he is one of the most committed and competent Quality Assurance professionals I have ever met. Vladmir has a sharp analytical eye, attention to detail and an impressive ability to anticipate possible failures. His approach to manual and automated testing added immense value to the quality of our work. One of his standout traits is his collaborative spirit and communication, always willing to help, discuss and suggest improvements.",
    artIcon: "crystal-ball",
  },
  {
    id: "rodrigo-lobo",
    title: { en: "The Overlooked Scenario", pt: "O Cenário Esquecido" },
    name: "Rodrigo Lobo",
    role: same("QA Automation Engineer"),
    date: "2025-04-29",
    relation: "sameTeam",
    lang: "pt",
    original:
      "Tive a oportunidade de conhecer e trabalhar com o Vladmir como Analista de QA, e foi uma experiência extremamente positiva. Muito parceiro e comunicativo, ele demonstrou grande atenção aos detalhes, sempre buscando garantir a melhor cobertura e confiabilidade nos testes, identificando cenários muitas vezes negligenciados. Trabalhamos juntos com a stack Java, Cucumber, Playwright e Allure, onde ele mostrou domínio técnico e proatividade na automação de testes. Sempre comprometido, contribuiu com sugestões valiosas para melhorias de processos e boas práticas. Além disso, sua vontade constante de aprender e compartilhar conhecimento eleva o desempenho de toda a equipe.",
    translation:
      "I had the opportunity to meet and work with Vladmir as a QA Analyst, and it was an extremely positive experience. A great partner and communicator, he showed great attention to detail, always seeking the best coverage and reliability in tests and identifying scenarios that are often overlooked. We worked together with Java, Cucumber, Playwright and Allure, where he showed technical mastery and proactivity in test automation. Always committed, he contributed valuable suggestions for process improvements and best practices. On top of that, his constant drive to learn and share knowledge raises the performance of the whole team.",
    artIcon: "magnifying-glass",
  },
  {
    id: "eric-amaro-lopes",
    title: { en: "The Creative Fix", pt: "O Conserto Criativo" },
    name: "Eric Amaro Lopes",
    role: { en: "Senior Quality Assurance Engineer", pt: "Quality Assurance Engineer Sênior" },
    date: "2025-04-29",
    relation: "sameTeam",
    lang: "pt",
    original:
      "Tenho o prazer de recomendar o Vladimir, uma pessoa excepcional e um profissional dedicado. Sua expertise, comprometimento e atitude positiva fazem toda a diferença no ambiente de trabalho. Sempre disposto a ajudar, ele traz soluções criativas e eficientes para qualquer desafio. Trabalhar com o Vladimir foi uma experiência enriquecedora, e tenho certeza de que ele continuará conquistando grandes resultados em seus próximos projetos. Recomendo fortemente!",
    translation:
      "I'm pleased to recommend Vladmir, an exceptional person and a dedicated professional. His expertise, commitment and positive attitude make all the difference at work. Always willing to help, he brings creative and efficient solutions to any challenge. Working with Vladmir was an enriching experience, and I'm sure he will keep achieving great results in his next projects. Highly recommended!",
    artIcon: "light-bulb",
  },
  {
    id: "erika-schneider",
    title: { en: "The Calm in the Storm", pt: "A Calmaria na Tempestade" },
    name: "Erika Ferrari Viviani Schneider",
    role: same("Strategic Transformation Manager"),
    date: "2025-03-10",
    relation: "sameTeam",
    lang: "pt",
    original:
      "Tive a honra de atuar ao lado do Vladmir em um projeto de elevada complexidade, de inovação disruptiva e que irá contribuir para a mudança na matriz energética e forma de comercialização desse ativo fundamental à sociedade. Vladmir, sempre sereno e equilibrado, trouxe razão a questões acaloradas e quality by design ao produto. A quem vir esta recomendação, saiba que ter o Vladmir no time é integrar competências humanas e técnicas numa só pessoa, que recomendo de olhos fechados.",
    translation:
      "I had the honour of working alongside Vladmir on a highly complex, disruptively innovative project that will help change the energy matrix and the way this asset, fundamental to society, is traded. Always calm and balanced, Vladmir brought reason to heated discussions and quality by design to the product. To whoever reads this: having Vladmir on the team means getting human and technical skills in one person. I recommend him with my eyes closed.",
    artIcon: "meditation",
  },
  {
    id: "leonardo-nascimento",
    title: { en: "The Clear Stance", pt: "A Posição Clara" },
    name: "Leonardo Cesar Nascimento",
    role: { en: "Salesforce Consultant", pt: "Consultor Salesforce" },
    date: "2025-02-21",
    relation: "sameTeam",
    lang: "pt",
    original:
      "Tive o prazer de trabalhar com Vladmir em um Projeto de Implantação do Salesforce, onde ele atuou na posição de QA. Desde o início, demonstrou ser um profissional extremamente proativo e comprometido com a qualidade das entregas, sempre atento aos detalhes e garantindo que os processos fossem seguidos da melhor forma possível.\n\nAlém de sua excelência técnica, um dos seus grandes diferenciais foi o posicionamento claro e objetivo diante das decisões tomadas no projeto, sempre com o foco em preservar o alinhamento do time e evitar impactos negativos nas entregas. Essa postura foi essencial para manter a equipe bem informada e o projeto no caminho certo.\n\nPelo seu profissionalismo, dedicação e capacidade de colaboração, recomendo fortemente o Vladmir e tenho certeza de que será um grande ativo para qualquer equipe!",
    translation:
      "I had the pleasure of working with Vladmir on a Salesforce implementation project, where he was the QA. From the start he proved to be extremely proactive and committed to the quality of the deliveries, always attentive to detail and making sure processes were followed in the best possible way.\n\nBeyond his technical excellence, one of his big differentiators was his clear and objective stance on the project's decisions, always focused on keeping the team aligned and avoiding negative impacts on deliveries. That attitude was essential to keep the team well informed and the project on track.\n\nFor his professionalism, dedication and collaboration, I strongly recommend Vladmir, and I'm sure he will be a great asset to any team!",
    artIcon: "flag-objective",
  },
  {
    id: "natarajan-kanakasabapathy",
    title: { en: "The Extra Mile", pt: "A Milha Extra" },
    name: "Natarajan Kanakasabapathy",
    role: { en: "Engineering Architect", pt: "Arquiteto de Engenharia" },
    date: "2024-08-05",
    relation: "sameTeam",
    lang: "en",
    original:
      "Vladmir is technically good and it was good working with him..He always strived for quality and willing to travel extra mile for learning and accomplishing the task\nWishing you all the very best Valdmir",
    translation:
      "Vladmir é tecnicamente bom e foi ótimo trabalhar com ele. Sempre buscou qualidade e esteve disposto a ir além para aprender e concluir a tarefa. Desejo tudo de melhor, Vladmir.",
    artIcon: "boot-prints",
  },
  {
    id: "lucas-sebe",
    title: { en: "The Meticulous Strategy", pt: "A Estratégia Meticulosa" },
    name: "Lucas Sebe",
    role: same("Quality Assurance"),
    date: "2024-06-04",
    relation: "sameTeam",
    lang: "en",
    original:
      "I had the pleasure of working with Vladmir, where he was an invaluable asset to our Quality Assurance team. His meticulous testing strategies and attention to detail have greatly improved our project outcomes. A team player, Vladmir's contributions have been pivotal to our success. I wholeheartedly endorse his expertise.",
    translation:
      "Tive o prazer de trabalhar com o Vladmir, que foi um ativo inestimável para o nosso time de Quality Assurance. Suas estratégias de teste meticulosas e sua atenção aos detalhes melhoraram muito os resultados dos nossos projetos. Com espírito de equipe, as contribuições do Vladmir foram fundamentais para o nosso sucesso. Endosso sua expertise de todo o coração.",
    artIcon: "chess-knight",
  },
  {
    id: "renan-sousa",
    title: { en: "Two Years of Tests", pt: "Dois Anos de Testes" },
    name: "Renan Sousa",
    role: { en: "Mid-level Test Analyst", pt: "Analista de Testes Pleno" },
    date: "2024-05-23",
    relation: "sameTeam",
    lang: "pt",
    original:
      "Trabalhei com o Vladmir por um período de 2 anos, atuando em conjunto na realização e manutenção de testes, com ótima visão de negócio e solução de problemas, sempre solícito e disposto a apoiar com dúvidas. Uma pessoa excepcional, e excelente profissional !",
    translation:
      "I worked with Vladmir for 2 years, running and maintaining tests together. Great business vision and problem solving, always helpful and willing to support with questions. An exceptional person and an excellent professional!",
    artIcon: "hourglass",
  },
  {
    id: "gabriel-henrique",
    title: { en: "The Reliable Automator", pt: "O Automatizador Confiável" },
    name: "Gabriel Henrique",
    role: { en: "Systems Analyst", pt: "Analista de Sistemas" },
    date: "2024-05-21",
    relation: "otherTeam",
    lang: "pt",
    original:
      "Recomendo Vladmir como um excelente profissional na área de automatização de testes. Trabalhamos juntos e pude constatar sua dedicação, conhecimento e habilidade em encontrar soluções eficientes para garantir a qualidade dos produtos. Ele é um colaborador comprometido e confiável, com ótima capacidade de trabalho em equipe. Certamente seria uma ótima adição para qualquer equipe de automação de testes.",
    translation:
      "I recommend Vladmir as an excellent test automation professional. We worked together and I saw his dedication, knowledge and skill at finding efficient solutions to ensure product quality. He is a committed, reliable colleague and a great team player. He would certainly be a great addition to any test automation team.",
    artIcon: "robot-golem",
  },
  {
    id: "haribaskar-r",
    title: { en: "The Resourceful", pt: "O Engenhoso" },
    name: "Haribaskar R",
    role: { en: "Manager at Cognizant", pt: "Gerente na Cognizant" },
    date: "2024-05-06",
    relation: "otherTeam",
    lang: "en",
    original:
      "I highly recommend Vladimir. He's a resourceful problem-solver with a keen ability to automate tasks using Selenium and Java. His passion lies in finding efficient solutions, and he consistently demonstrates a knack for breaking down challenges and developing effective approaches. Vladimir would be a valuable asset to any team seeking an automation expert with a results-oriented mindset.",
    translation:
      "Recomendo muito o Vladmir. Ele resolve problemas com engenhosidade e tem grande habilidade para automatizar tarefas com Selenium e Java. Sua paixão é encontrar soluções eficientes, e ele demonstra com constância um talento para decompor desafios e criar abordagens eficazes. O Vladmir seria um ativo valioso para qualquer time que busque um especialista em automação com foco em resultados.",
    artIcon: "toolbox",
  },
  {
    id: "ricardo-varela",
    title: { en: "The Ever-Learning", pt: "O Eterno Aprendiz" },
    name: "Ricardo Varela",
    role: same("QA Engineer"),
    date: "2024-05-05",
    relation: "otherTeam",
    lang: "pt",
    original:
      "Vladimir é proativo e possui habilidades técnicas impressionantes, sempre buscando aperfeiçoar-se e expandir seu conhecimento. Seu comprometimento e sua disposição para enfrentar novos desafios o tornam um colaborador valioso em qualquer empresa.",
    translation:
      "Vladmir is proactive and has impressive technical skills, always looking to improve and expand his knowledge. His commitment and willingness to take on new challenges make him a valuable colleague at any company.",
    artIcon: "book-cover",
  },
  {
    id: "emerson-parisotto",
    title: { en: "Value Delivered", pt: "Valor Entregue" },
    name: "Emerson Parisotto",
    role: same("Quality Architect · QA Chapter Lead"),
    date: "2024-04-26",
    relation: "manager",
    lang: "pt",
    original:
      "Vladmir é muito esforçado e pró-ativo. Tem uma ótima capacidade técnica, sempre disposto a encarar novos desafios, adquirir novos conhecimentos e práticas com o objetivo de entregar valor ao cliente.",
    translation:
      "Vladmir is very hard-working and proactive. He has great technical ability and is always willing to face new challenges and pick up new knowledge and practices to deliver value to the client.",
    artIcon: "cut-diamond",
  },
  {
    id: "rodrigo-ferrari",
    title: { en: "Ownership", pt: "O Dono da Entrega" },
    name: "Rodrigo Ferrari",
    role: { en: "Senior Product Manager", pt: "Product Manager Sênior" },
    date: "2023-01-16",
    relation: "sameTeam",
    lang: "pt",
    original:
      "Trabalhei com o Vladmir em iniciativas estratégicas para o Riachuelo Marketplace, e destaco as seguintes skills como pontos fortes do seu perfil profissional:\n- facilidade na absorção de conhecimento (tanto técnico, quanto sobre o negócio);\n- ownership (comprometido e dedicado com a qualidade da entrega);\n- trabalho em equipe;",
    translation:
      "I worked with Vladmir on strategic initiatives for Riachuelo Marketplace, and I'd highlight these strengths of his profile:\n- picks up knowledge easily (both technical and business);\n- ownership (committed and dedicated to the quality of the delivery);\n- teamwork.",
    artIcon: "key",
  },
  {
    id: "everton-godinho",
    title: { en: "The Barrier Breaker", pt: "O Quebrador de Barreiras" },
    name: "Everton Godinho",
    role: same("Tech Manager"),
    date: "2023-01-05",
    relation: "manager",
    lang: "pt",
    original:
      "Um profissional muito comunicativo com grande facilidade para se aproximar  do time e absorver conhecimentos relacionados a negócios. A sua interação geralmente rompe barreiras e acaba apoiando todo o time focando no resultado final.",
    translation:
      "A very communicative professional who easily connects with the team and picks up business knowledge. His interaction usually breaks down barriers and ends up supporting the whole team, focused on the end result.",
    artIcon: "broken-wall",
  },
  {
    id: "luis-lima",
    title: { en: "The Critical Eye", pt: "O Olhar Crítico" },
    name: "Luis Lima",
    role: { en: "Senior Systems Analyst", pt: "Analista de Sistemas Sr." },
    date: "2022-12-20",
    relation: "sameTeam",
    lang: "pt",
    original:
      "Durante o período qual atuamos em projetos ele sempre demonstrou ser um profissional observador e de olhar crítico no sentido de entregar um trabalho de alta qualidade. Além, disto mostrou ter um relacionamento interpessoal com todos.",
    translation:
      "While we worked on projects together, he always proved to be an observant professional with a critical eye for delivering high-quality work. He also got along well with everyone.",
    artIcon: "spectacles",
  },
  {
    id: "lauro-vargas",
    title: { en: "The Motivated", pt: "O Motivado" },
    name: "Lauro Vargas",
    role: { en: "IT Executive Manager", pt: "Gerente Executivo de TI" },
    date: "2022-12-19",
    relation: "otherCompany",
    lang: "pt",
    original:
      "Vlad é um excelente profissional, uma pessoa interessada, motivada e envolvida na organização, contribuindo ativamente para lançar desafios e concretizar objetivos.",
    translation:
      "Vlad is an excellent professional: an interested, motivated person who is involved in the organisation, actively helping to set challenges and achieve goals.",
    artIcon: "flame",
  },
  {
    id: "willian-ramos",
    title: { en: "The User's Champion", pt: "O Campeão do Usuário" },
    name: "Willian Ramos",
    role: { en: "Test/QA Analyst at Novigilab", pt: "Analista de Teste/QA na Novigilab" },
    date: "2022-12-08",
    relation: "sameTeam",
    lang: "pt",
    original:
      "O Vladmir é um profissional muito competente, dedicado e sempre aberto a novos desafios. Sempre disposto a ajudar, compartilhar conhecimento e aprender com todos. Tem um aprendizado muito rápido e se preocupa com a experiência do usuário dedicando-se sempre ao melhor nível de entrega nos projetos em que atua.",
    translation:
      "Vladmir is a very competent, dedicated professional, always open to new challenges. Always willing to help, share knowledge and learn from everyone. He learns very fast and cares about the user experience, always aiming for the best possible delivery on his projects.",
    artIcon: "trophy-cup",
  },
  {
    id: "guilherme-henrique",
    title: { en: "The Curious", pt: "O Curioso" },
    name: "Guilherme Henrique",
    role: same("QA · Quality Assurance"),
    date: "2022-12-08",
    relation: "otherTeam",
    lang: "pt",
    original:
      "Vladmir é um cara esforçado, responsável e muito comunicativo! Sempre mostrou ser um cara interessado em ajudar e curioso em aprender novos assuntos.",
    translation:
      "Vladmir is a hard-working, responsible and very communicative guy! He always showed he was keen to help and curious to learn new things.",
    artIcon: "owl",
  },
  {
    id: "ricardo-ribeiro",
    title: { en: "Beyond Duty", pt: "Além do Dever" },
    name: "Ricardo Ribeiro",
    role: { en: "Full Stack Developer at CBYK", pt: "Full Stack Developer na CBYK" },
    date: "2022-12-08",
    relation: "sameTeam",
    lang: "pt",
    original:
      "O Vladmir é um profissional excelente e muito atencioso á detalhes. Tive a oportunidade de trabalhar com ele na Crefisa, onde o mesmo desempenhou um papel crucial em todo o processo desde o entendimento do produto e desenvolvimento até a entrega, fazendo além do seu dever para garantir a melhor qualidade do produto final.",
    translation:
      "Vladmir is an excellent professional and very attentive to detail. I had the opportunity to work with him at Crefisa, where he played a crucial role in the whole process, from understanding the product and development through to delivery, going beyond his duty to ensure the best quality of the final product.",
    artIcon: "mountain-climbing",
  },
  {
    id: "fernanda-loucao",
    title: { en: "The Partnership", pt: "A Parceria" },
    name: "Fernanda M Loução",
    role: { en: "Senior Business Analyst", pt: "Analista de Negócios Sênior" },
    date: "2022-12-08",
    relation: "otherTeam",
    lang: "pt",
    original:
      "Vladmir além de ser uma ótima pessoa é um excelente profissional. Em pouco tempo que trabalhamos juntos, demonstrou conhecimento, habilidade, comprometimento e parceria com o time. Detalhista e comprometido sempre teve ótimo relacionamento interpessoal e entregas de qualidade.",
    translation:
      "Besides being a great person, Vladmir is an excellent professional. In the short time we worked together he showed knowledge, skill, commitment and partnership with the team. Detail-oriented and committed, he always had great relationships with people and delivered quality work.",
    artIcon: "shaking-hands",
  },
  {
    id: "luiz-carlos-perillo",
    title: { en: "The Committed", pt: "O Comprometido" },
    name: "Luiz Carlos Perillo",
    role: {
      en: "Operations & Organizational Transformation Executive",
      pt: "Executivo de Operações e Transformação Organizacional",
    },
    date: "2022-12-06",
    relation: "otherTeam",
    lang: "pt",
    original:
      "Wladmir é um excelente profissional, com muita capacidade técnica, extremamente comprometido com a empresa, sabe trabalhar em grupo , muito participativo no contexto de equipe e sempre disposto a ajudar os amigos.",
    translation:
      "Vladmir is an excellent professional with strong technical ability, extremely committed to the company. He works well in a group, takes an active part in the team and is always willing to help his friends.",
    artIcon: "anchor",
  },
  {
    id: "sergio-oliveira",
    title: { en: "Above the Average", pt: "Acima da Média" },
    name: "Sergio Oliveira",
    role: { en: "IT Executive · Head of Technology", pt: "Executivo de TI · Head de Tecnologia" },
    date: "2022-12-02",
    relation: "sameTeam",
    lang: "pt",
    original:
      "Vladimir tem clareza de visao e suas opinioes sao sempre muito assertivas.\nSua participação nos projetos ajuda a descobrir antecipadamente situacoes nao previstas e discutidas, evitando riscos financeiros e riscos de prazo. Apoia tambem fortemente junto aos desenvolcedores visando obter codigos de qualidade e melhores praticas de desenvolvimento.\nSem nenhuma duvida  trata se de um profissional diferenciado e acima da media de mercado.",
    translation:
      "Vladmir has clarity of vision and his opinions are always very assertive.\nHis involvement in projects helps uncover unforeseen, undiscussed situations early, avoiding financial and schedule risks. He also strongly supports the developers in achieving quality code and better development practices.\nWithout a doubt, he is a distinctive professional, above the market average.",
    artIcon: "upgrade",
  },
  {
    id: "rafael-passaro",
    title: { en: "The Clear Word", pt: "A Palavra Clara" },
    name: "Rafael Ramos Pássaro",
    role: same("Scrum Master"),
    date: "2022-12-01",
    relation: "sameTeam",
    lang: "pt",
    original:
      "Vladmir é um profissional dedicado e detalhista. \nComunica-se de maneira clara e objetiva.\nContribui muito para o projeto e para um bom ambiente de trabalho!",
    translation:
      "Vladmir is a dedicated, detail-oriented professional.\nHe communicates clearly and objectively.\nHe contributes a lot to the project and to a good working environment!",
    artIcon: "megaphone",
  },
  {
    id: "max-bezerra-silva",
    title: { en: "The Exceptional Partner", pt: "O Parceiro Excepcional" },
    name: "Max Bezerra Silva",
    role: same("Software Developer"),
    date: "2022-12-01",
    relation: "otherTeam",
    lang: "pt",
    original:
      "Um parceiro de trabalho excepcional. Bastante dedicado e comprometido com as entregas de projeto. Sempre se mostrou interessado em aprender e compartilhar experiências profissionais. Uma honra ter divido esse tempo juntos.",
    translation:
      "An exceptional work partner. Very dedicated and committed to project deliveries. Always keen to learn and share professional experiences. An honour to have shared that time together.",
    artIcon: "team-idea",
  },
  {
    id: "andre-madeira",
    title: { en: "Every Detail", pt: "Cada Detalhe" },
    name: "André Madeira",
    role: { en: "Lead QA Engineer at nstech", pt: "Lead QA Engineer na nstech" },
    date: "2022-12-01",
    relation: "otherCompany",
    lang: "pt",
    original:
      "Vladimir é uma pessoa incrível e um excelente profissional, na área de qualidade, no período que atuamos juntos, se preocupada em cada detalhe desde a execução de testes até a experiência do usuário. Tem grande potencial para alcançar grandes alvos e seguir em crescimento em seu desenvolvimento profissional.",
    translation:
      "Vladmir is an amazing person and an excellent quality professional. While we worked together, he cared about every detail, from test execution to the user experience. He has great potential to reach big goals and keep growing professionally.",
    artIcon: "microscope",
  },
  {
    id: "joicy-lima",
    title: { en: "Full Understanding", pt: "Compreensão Completa" },
    name: "Joicy Lima",
    role: { en: "Senior Product Manager", pt: "Product Manager Sênior" },
    date: "2022-08-26",
    relation: "sameTeam",
    lang: "pt",
    original:
      "Pelo tempo que trabalhamos junto pude perceber que o Vlad é um excelente profissional. Sempre se mostrando interessado em compreender completamente as demandas e também muito participativo nas discussões para que pudesse realizar suas atividades com excelência. Foi um prazer trabalhar contigo!",
    translation:
      "In the time we worked together I could see that Vlad is an excellent professional. Always keen to fully understand the requirements and very active in discussions, so he could do his work with excellence. It was a pleasure working with you!",
    artIcon: "brain",
  },
  {
    id: "marcel-grilo",
    title: { en: "The Adaptable", pt: "O Adaptável" },
    name: "Marcel Mendonça Grilo",
    role: same("System Manager · Software Architect"),
    date: "2022-08-10",
    relation: "otherCompany",
    lang: "pt",
    original:
      "Um profissional muito bom, aprendeu rápido o negócio, que por si só não é tão simples. Propôs mudanças e soube lidar tanto com fatores positivos e negativos.\nSe posicionou e se adaptou junto do negócio e das mudanças dos times.",
    translation:
      "A very good professional who learned the business fast, and the business itself is not that simple. He proposed changes and handled both the positives and the negatives.\nHe took a stance and adapted along with the business and the changes in the teams.",
    artIcon: "chameleon-glyph",
  },
  {
    id: "claudio-silva",
    title: { en: "The Quick Study", pt: "O Aprendiz Veloz" },
    name: "Claudio Wilson Damião Silva",
    role: { en: "Senior QA", pt: "QA Sênior" },
    date: "2022-08-09",
    relation: "sameTeam",
    lang: "pt",
    original:
      "Ótimo profissional. Muito dedicado e detalhista, e absorveu tanto os conhecimentos técnicos quanto de negócio de forma bem rápida. E acima de tudo é uma ótima pessoa.",
    translation:
      "Great professional. Very dedicated and detail-oriented, and he picked up both the technical and the business knowledge very quickly. Above all, he's a great person.",
    artIcon: "sprint",
  },
  {
    id: "alexandre-pinheiro",
    title: { en: "Learn and Teach", pt: "Aprender e Ensinar" },
    name: "Alexandre Gallo Pinheiro",
    role: { en: "Technology Leader", pt: "Coordenador de Tecnologia" },
    date: "2022-08-09",
    relation: "sameTeam",
    lang: "pt",
    original:
      "Profissional com perfil e conduta admirável, plenamente capaz em aprender e ensinar, trabalhou muito bem com todos os times na área do Marketplace, onde tive a oportunidade de interagir com o mesmo. Tem muita vontade de fazer acontecer e é um grande companheiro!",
    translation:
      "A professional with an admirable profile and conduct, fully able to learn and to teach. He worked very well with every team in the Marketplace area, where I had the chance to work with him. He has a real drive to make things happen and is a great companion!",
    artIcon: "teacher",
  },
  {
    id: "giulia-savignano",
    title: { en: "The Questioner", pt: "O Questionador" },
    name: "Giulia Savignano",
    role: same("Tech Lead · .NET / C#"),
    date: "2022-08-05",
    relation: "sameTeam",
    lang: "pt",
    original:
      "É muito bom trabalhar com pessoas interessadas, questionadoras e prontas para ajudar no que for necessário. E o Vlad é assim, um excelente profissional com quem pude trabalhar e espero trabalhar novamente no futuro.",
    translation:
      "It's great to work with people who are interested, ask questions and are ready to help with whatever is needed. Vlad is like that: an excellent professional I was able to work with and hope to work with again in the future.",
    artIcon: "uncertainty",
  },
  {
    id: "lucas-gois-da-silva",
    title: { en: "The Uncomplicated", pt: "O Descomplicado" },
    name: "Lucas Gois da Silva",
    role: {
      en: "Senior Test Automation Analyst at Riachuelo",
      pt: "Analista de Testes Automatizados Sênior na Riachuelo",
    },
    date: "2022-08-04",
    relation: "sameTeam",
    lang: "pt",
    original:
      "Trabalhei com o Vladmir em um projeto para a Riachuelo, o considero um ótimo profissional, com excelente relação interpessoal, contínua preocupação com seu desenvolvimento e sempre com uma visão muito prática e descomplicada de processos. Recomendo fortemente seu trabalho!\nPS: Um cara Gente fina demais mesmo.",
    translation:
      "I worked with Vladmir on a project for Riachuelo. I consider him a great professional, with excellent people skills, constant care for his own growth and a very practical, uncomplicated view of processes. I strongly recommend his work!\nPS: A genuinely great guy.",
    artIcon: "feather",
  },
  {
    id: "gabriel-brandao",
    title: { en: "Creative Under Pressure", pt: "Criativo no Imprevisto" },
    name: "Gabriel Brandão",
    role: { en: "Developer at Itaú · .NET", pt: "Desenvolvedor no Itaú · .NET" },
    date: "2022-08-03",
    relation: "sameTeam",
    lang: "pt",
    original:
      "Tive a grande oportunidade de trabalhar com o Vlad como colega de equipe durante alguns meses. Desde o primeiro momento o Vlad se mostrou uma pessoa extremamente colaborativa, querendo conhecer e participar ativamente dos processos do time. É uma pessoa comprometida que se preocupa com a qualidade do trabalho da equipe e com a entrega de valor ao cliente final, é criativo diante imprevistos e tem facilidade no aprendizado de novas ferramentas e processos. É um grande profissional!!!",
    translation:
      "I had the great opportunity to work with Vlad as a teammate for a few months. From the very first moment he was extremely collaborative, wanting to learn about and actively take part in the team's processes. He is committed and cares about the quality of the team's work and about delivering value to the end customer, he's creative when the unexpected happens, and he learns new tools and processes easily. A great professional!!!",
    artIcon: "sparkles",
  },
  {
    id: "augusto-cruz",
    title: { en: "The Business Rules", pt: "As Regras do Negócio" },
    name: "Augusto Cruz",
    role: same("Backend Developer · .NET / C#"),
    date: "2022-07-29",
    relation: "sameTeam",
    lang: "pt",
    original:
      "Vladmir tem grande responsabilidade com suas entregas, sempre esteve em busca de adquirir mais conhecimento e de conhecer ainda mais todas as regras do negócio. Tem facilidade na comunicação e consegue apoiar todos em garantir a qualidade no software.",
    translation:
      "Vladmir takes great responsibility for his deliveries and was always looking to gain more knowledge and learn every business rule even better. He communicates easily and helps everyone ensure software quality.",
    artIcon: "scroll-unfurled",
  },
  {
    id: "marcelo-ferreira",
    title: { en: "Affectionately Known as Vlad", pt: "Carinhosamente Vlad" },
    name: "Marcelo Valério Ferreira",
    role: { en: "Senior Software Engineer", pt: "Engenheiro de Software Sênior" },
    date: "2022-07-29",
    relation: "sameTeam",
    lang: "pt",
    original:
      "Carinhosamente conhecido como Vlad, é um profissional de fácil comunicação, inteligente e de rápida absorção de regras de negócios. Carrega um excelente comprometimento e resiliência nos desafios do trabalho, gostei bastante de ter trabalhado ao lado deste cara.",
    translation:
      "Affectionately known as Vlad, he is an easy-to-talk-to, intelligent professional who absorbs business rules quickly. He brings excellent commitment and resilience to the challenges of the job. I really enjoyed working alongside this guy.",
    artIcon: "hearts",
  },
  {
    id: "julio-nietto",
    title: { en: "The Investigator", pt: "O Investigador" },
    name: "Julio Cesar Nietto",
    role: same("Solution Architect · Quality Engineering"),
    date: "2022-07-29",
    relation: "manager",
    lang: "pt",
    original:
      "Profissional que sabe se relacionar bem com a equipe, pontuando os problemas e desafios a serem vencidos. Um ótimo analista de QA com muito potencial de desenvolvimento. \nSabe investigar, documentar e testar as tarefas do dia a dia, fazendo muito bem o papel de Testes Funcionais. \nAprendendo automação de testes com RobotFramework. \nRecomendo Vladmir Prates.",
    translation:
      "A professional who relates well to the team, pointing out the problems and challenges to overcome. A great QA analyst with a lot of potential for growth.\nHe knows how to investigate, document and test day-to-day tasks, doing functional testing very well.\nLearning test automation with Robot Framework.\nI recommend Vladmir Prates.",
    artIcon: "fedora",
  },
  {
    id: "dani-duarte",
    title: { en: "The Best Solution", pt: "A Melhor Solução" },
    name: "Danì Dúàrte",
    role: { en: "Senior Front-End Developer · React", pt: "Desenvolvedora Front-End React Sênior" },
    date: "2022-07-28",
    relation: "sameTeam",
    lang: "pt",
    original:
      "O Vladmir é um excelente profissional, protivo, responsável, sempre em busca da melhor solução para resolver problemas. Super recomendo, um ótimo profissional, e excelente pessoa para se ter no time",
    translation:
      "Vladmir is an excellent professional, proactive and responsible, always looking for the best way to solve problems. Highly recommended: a great professional and an excellent person to have on the team.",
    artIcon: "jigsaw-piece",
  },
  {
    id: "diego-bulhosa",
    title: { en: "Critical Paths Automated", pt: "Pontos Críticos Automatizados" },
    name: "Diego Bulhosa",
    role: { en: "Senior Front-end Developer at Riachuelo", pt: "Desenvolvedor Front-end Sênior na Riachuelo" },
    date: "2022-07-26",
    relation: "sameTeam",
    lang: "pt",
    original:
      "Excelente Analista de testes, responsável por automações e testes. Trabalho de excelência! Automatizou pontos críticos da nossa aplicação principal.",
    translation:
      "Excellent test analyst, responsible for automation and testing. Excellent work! He automated critical parts of our main application.",
    artIcon: "processor",
  },
];

/** Where all of them can be checked. */
export const RECOMMENDATIONS_SOURCE = "https://www.linkedin.com/in/vladmirprates/details/recommendations/";
