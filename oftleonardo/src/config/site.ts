export const siteConfig = {
  name: "Leonardo Nunes",
  title: "Oftalmologista",
  crm: "CRM-CE 27.199 | CRM-PI 10.051",
  rqe: "RQE XXXXX",
  phone: "+5585999853811",
  email: "contato@oftleonardo.com.br",
  domains: ["oftleonardo.com.br"],
  canonical: "https://oftleonardo.com.br",
  partnerApps: {
    oftagenda:
      "https://agenda.oftleonardo.com.br/?utm_source=oftleonardo&utm_medium=referral&utm_campaign=crossdomain_seo",
  },
  /** Medição via GTM apenas (GA4, Ads, Meta etc. no container). */
  analytics: {
    gtmId: import.meta.env.PUBLIC_GTM_ID ?? "",
  },

  social: {
    instagram: "https://www.instagram.com/oftleonardo",
    threads: "https://www.threads.net/@oftleonardo",
    linkedin: "https://www.linkedin.com/in/oftleonardo",
    facebook: "https://www.facebook.com/leonunesbs",
    x: "https://x.com/oftleonardo",
  },

  meta: {
    title:
      "Leonardo Nunes · Oftalmologista | Consulta, Retina e Cirurgia de Catarata em Fortaleza",
    description:
      "Agende sua consulta com Leonardo Nunes, oftalmologista em Fortaleza especialista em retina e cirurgia de catarata. Avaliação detalhada, diagnóstico e acompanhamento de cada paciente com atendimento humanizado e tecnologia de alta precisão.",
    ogImage: "/og-image.png",
    ogImageWidth: 1200,
    ogImageHeight: 630,
    themeColor: "#3b82f6",
    keywords:
      "oftalmologista, retina, catarata, cirurgia de catarata, oftalmologia, Fortaleza, Leonardo Nunes, OCT, retinografia, glaucoma",
  },

  hero: {
    headline: "Oftalmologista · Clínico e Cirúrgico",
    subheadline:
      "Tecnologia de alta precisão e um atendimento que dedica tempo real para ouvir, examinar e orientar cada paciente com clareza e segurança.",
  },

  cities: [
    {
      name: "Fortaleza",
      state: "CE",
      slug: "fortaleza",
      whatsappNumber: "5585999853811",
      description:
        "Consultas oftalmológicas completas na capital cearense com avaliação detalhada, exames de alta resolução — incluindo OCT, retinografia e campimetria — e acesso a cirurgia de catarata e tratamento especializado de doenças da retina. Ambiente equipado para diagnóstico e acompanhamento em todas as faixas etárias. Atendimento particular e por convênios selecionados.",
      image: "",
      imageAlt:
        "Leonardo Nunes em consultório oftalmológico em Fortaleza com equipamentos de alta tecnologia",
      imageSuggestion:
        "Foto no consultório com equipamento (lâmpada de fenda, OCT ou retinógrafo)",
    },
    {
      name: "São Domingos do Maranhão",
      state: "MA",
      slug: "sao-domingos-do-maranhao",
      whatsappNumber: "5585999853811",
      description:
        "Atendimento oftalmológico de referência no interior do Maranhão, com a mesma excelência técnica e cuidado individualizado oferecido na capital. Avaliação ocular completa, diagnóstico e acompanhamento de doenças da retina, glaucoma e indicação cirúrgica de catarata. Atendimento especializado sem necessidade de deslocamento para grandes centros.",
      image: "",
      imageAlt:
        "Leonardo Nunes realizando atendimento oftalmológico em São Domingos do Maranhão",
      imageSuggestion: "Foto durante consulta ou exame de fundo de olho",
    },
    {
      name: "Fortuna",
      state: "MA",
      slug: "fortuna-ma",
      whatsappNumber: "5585999853811",
      description:
        "Oftalmologia completa em Fortuna com atendimento dedicado e humanizado. Consultas detalhadas, investigação de doenças oculares — incluindo catarata, glaucoma e alterações de retina — e acompanhamento contínuo para garantir a melhor conduta para a saúde dos seus olhos.",
      image: "",
      imageAlt:
        "Leonardo Nunes em atendimento humanizado na clínica de Fortuna",
      imageSuggestion: "Foto de jaleco em ambiente clínico acolhedor",
    },
  ],

  services: [
    {
      title: "Retina Clínica e Cirúrgica",
      slug: "retina",
      icon: "ScanEye",
      featured: true,
      shortDescription: "Subespecialidade de alta complexidade",
      description:
        "Diagnóstico e tratamento de doenças da retina como retinopatia diabética, degeneração macular relacionada à idade (DMRI), descolamento de retina e oclusões vasculares. Utilizo tomografia de coerência óptica (OCT), retinografia e angiografia para detecção precoce e definição da conduta mais segura. O acompanhamento é individualizado e baseado em protocolos atualizados, com o objetivo de preservar a sua visão a longo prazo.",
    },
    {
      title: "Cirurgia de Catarata",
      slug: "catarata",
      icon: "Sparkles",
      featured: true,
      shortDescription: "Técnica moderna e recuperação rápida",
      description:
        "A catarata é a principal causa de perda visual reversível em adultos acima de 60 anos. A cirurgia é realizada por facoemulsificação — técnica minimamente invasiva — com implante de lente intraocular personalizada. Toda a jornada é acompanhada de perto: avaliação pré-operatória completa, escolha da lente mais adequada ao seu perfil visual e seguimento pós-operatório rigoroso para garantir segurança e o melhor resultado possível.",
    },
    {
      title: "Oftalmologia Clínica",
      slug: "oftalmologia-clinica",
      icon: "Eye",
      featured: false,
      shortDescription: "Consulta completa e diagnóstico preciso",
      description:
        "Consulta oftalmológica minuciosa com avaliação da acuidade visual, refração, biomicroscopia, tonometria e fundoscopia. Cada exame é realizado com equipamentos de alta precisão e os resultados são explicados de forma clara. Indicado para investigação de queixas visuais, atualização de grau, detecção precoce de doenças silenciosas como glaucoma e retinopatia diabética, e acompanhamento de condições já diagnosticadas.",
    },
    {
      title: "Glaucoma",
      slug: "glaucoma",
      icon: "CircleGauge",
      featured: false,
      shortDescription: "Diagnóstico precoce e controle da pressão ocular",
      description:
        "Investigação e acompanhamento do glaucoma com tonometria, campimetria computadorizada, paquimetria e avaliação detalhada do nervo óptico. O glaucoma é uma doença silenciosa que pode causar perda irreversível da visão quando não diagnosticada a tempo. Pacientes acima de 40 anos, com histórico familiar ou portadores de diabetes e hipertensão devem manter acompanhamento regular. O tratamento é individualizado e pode incluir colírios, laser ou cirurgia.",
    },
    {
      title: "Mapeamento de Retina",
      slug: "mapeamento-de-retina",
      icon: "Scan",
      featured: false,
      shortDescription: "Avaliação detalhada do fundo de olho",
      description:
        "Exame completo da retina periférica e central para detecção de lesões, degenerações, roturas e alterações vasculares. Essencial para pacientes com diabetes, alta miopia, histórico de flashes luminosos ou moscas volantes. O mapeamento permite identificar alterações precoces e definir a necessidade de tratamento preventivo antes que a lesão evolua.",
    },
    {
      title: "Oftalmopediatria",
      slug: "oftalmopediatria",
      icon: "Baby",
      featured: false,
      shortDescription: "Cuidado ocular desde os primeiros anos",
      description:
        "Avaliação oftalmológica infantil com abordagem acolhedora e adaptada para cada faixa etária. Inclui teste do reflexo vermelho, avaliação de estrabismo, ambliopia e erros refrativos. A detecção precoce de problemas visuais na infância é fundamental para o desenvolvimento adequado da visão.",
    },
  ],

  differentials: [
    {
      title: "Atendimento Humanizado",
      icon: "Heart",
      description:
        "Consulta sem pressa, com escuta atenta e linguagem clara. Cada etapa do exame, o diagnóstico e o plano de tratamento são explicados para que você tome decisões com segurança e confiança. O tempo da consulta é dedicado inteiramente a você.",
    },
    {
      title: "Avaliação Minuciosa",
      icon: "ClipboardCheck",
      description:
        "Exame oftalmológico completo, com tempo dedicado para investigação detalhada de cada estrutura ocular. A avaliação inclui exames complementares quando indicado, com correlação clínica precisa para que nenhum detalhe passe despercebido.",
    },
    {
      title: "Tecnologia de Alta Precisão",
      icon: "Monitor",
      description:
        "Equipamentos de última geração — incluindo OCT, retinografia digital e campimetria computadorizada — que permitem diagnósticos mais precoces, planejamento cirúrgico mais seguro e acompanhamento com maior acurácia ao longo do tempo.",
    },
    {
      title: "Segurança em Cada Etapa",
      icon: "ShieldCheck",
      description:
        "Protocolos cirúrgicos rigorosos, técnicas validadas pela literatura médica e acompanhamento integral do pré ao pós-operatório. Cada procedimento segue padrões de segurança reconhecidos, com orientações claras em todas as etapas.",
    },
  ],

  howItWorks: [
    {
      step: 1,
      title: "Agendamento Rápido",
      description:
        'Clique em "Agendar Consulta", escolha sua cidade e envie uma mensagem pelo WhatsApp. A equipe responde em horário comercial para confirmar o melhor dia e horário.',
    },
    {
      step: 2,
      title: "Consulta Completa",
      description:
        "Avaliação oftalmológica detalhada, sem pressa, com exames de alta precisão realizados no próprio consultório. Cada achado é explicado de forma clara para que você compreenda sua condição e as opções disponíveis antes de qualquer decisão.",
    },
    {
      step: 3,
      title: "Diagnóstico e Conduta",
      description:
        "Você recebe um diagnóstico fundamentado e documentado, com orientações individualizadas, prescrição quando necessária e, se indicado, planejamento cirúrgico seguro e transparente, com todas as suas dúvidas esclarecidas.",
    },
    {
      step: 4,
      title: "Acompanhamento Contínuo",
      description:
        "Retornos programados de acordo com a sua condição e canal de comunicação aberto para dúvidas. O acompanhamento contínuo garante que o tratamento evolua da melhor forma e que sua visão seja preservada a longo prazo.",
    },
  ],

  faq: [
    {
      question: "A cirurgia de catarata é segura?",
      answer:
        "Sim. A cirurgia de catarata por facoemulsificação é um dos procedimentos mais realizados e seguros da medicina atual, com altas taxas de sucesso. É feita com anestesia local (colírio anestésico), dura em média 15 a 20 minutos e a recuperação visual é rápida. O Dr. Leonardo realiza avaliação pré-operatória completa, escolha individualizada da lente intraocular e acompanhamento pós-operatório rigoroso para garantir a melhor recuperação.",
    },
    {
      question: "O que é presbiopia (vista cansada) e como é tratada?",
      answer:
        "A presbiopia é a dificuldade natural para enxergar de perto que surge a partir dos 40 anos, causada pela perda gradual de flexibilidade do cristalino. O tratamento mais comum é o uso de óculos para leitura ou lentes multifocais. Em casos selecionados, pode ser considerado o implante de lente intraocular multifocal durante a cirurgia de catarata. Na consulta, o Dr. Leonardo avalia o grau, a saúde ocular completa e orienta a melhor opção para o seu perfil. Há também um guia completo sobre sintomas, diagnóstico e opções de correção na área Conteúdos do site, no artigo dedicado à presbiopia.",
    },
    {
      question: "Tenho diabetes. Com que frequência devo examinar os olhos?",
      answer:
        "Todo paciente com diabetes tipo 1 ou tipo 2 deve realizar exame de fundo de olho pelo menos uma vez por ano, mesmo sem queixas visuais. A retinopatia diabética é uma das principais causas de cegueira evitável e, em estágios iniciais, não apresenta sintomas. A detecção precoce com exames como OCT e retinografia permite iniciar o tratamento antes que haja perda de visão.",
    },
    {
      question: "Quais são as especialidades do Dr. Leonardo?",
      answer:
        "O Dr. Leonardo é médico oftalmologista com atuação em oftalmologia clínica, retina clínica e cirúrgica e cirurgia de catarata. Realiza consultas completas, exames especializados de retina (OCT, retinografia, angiografia) e procedimentos cirúrgicos com técnicas modernas e seguras.",
    },
    {
      question: "Em quais cidades o Dr. Leonardo atende?",
      answer:
        "O Dr. Leonardo atende em Fortaleza (CE), São Domingos do Maranhão (MA) e Fortuna (MA). O agendamento é feito pelo WhatsApp — basta escolher a cidade de preferência e a equipe confirma data e horário.",
    },
    {
      question: "O Dr. Leonardo atende por convênio?",
      answer:
        "Sim. Além de atendimento particular, o Dr. Leonardo aceita convênios selecionados, que podem variar por cidade. Entre em contato pelo WhatsApp para confirmar se o seu plano é atendido na localidade desejada.",
    },
    {
      question: "Como funciona a cirurgia de catarata?",
      answer:
        "A cirurgia é realizada pela técnica de facoemulsificação — um procedimento minimamente invasivo, com micro-incisão e implante de lente intraocular. A avaliação pré-operatória é completa, a escolha da lente é personalizada de acordo com o seu perfil visual e o acompanhamento pós-operatório é rigoroso, garantindo segurança e recuperação rápida.",
    },
    {
      question: "O que é o tratamento de retina e quando é necessário?",
      answer:
        "O tratamento de retina é indicado para doenças como retinopatia diabética, degeneração macular (DMRI), descolamento de retina e oclusões vasculares. O diagnóstico é feito com exames de alta resolução como OCT e angiografia, permitindo detecção precoce e definição da melhor conduta para preservar a visão de cada paciente.",
    },
    {
      question: "Com que frequência devo consultar um oftalmologista?",
      answer:
        "A recomendação é de pelo menos uma consulta anual para adultos. Pacientes com diabetes, hipertensão, histórico familiar de glaucoma ou acima de 40 anos devem manter acompanhamento regular, pois muitas doenças oculares são silenciosas e só são detectadas em exame de rotina. Crianças devem ter a primeira avaliação oftalmológica até os 3 anos de idade.",
    },
    {
      question: "Como faço para agendar uma consulta?",
      answer:
        'O agendamento é simples: clique no botão "Agendar Consulta" em qualquer lugar do site, selecione a cidade de atendimento e envie a mensagem pelo WhatsApp. A equipe retorna em horário comercial para confirmar o melhor dia e horário para você.',
    },
    {
      question: "Qual a diferença entre oftalmologista e optometrista?",
      answer:
        "Oftalmologista é o médico que cursou seis anos de medicina e completou residência médica em oftalmologia, sendo habilitado para diagnosticar, tratar clinicamente e operar doenças dos olhos. Já o optometrista é um profissional de saúde visual com formação em optometria, focado em exames de refração e adaptação de lentes, mas sem habilitação para realizar cirurgias ou prescrever medicamentos. O Dr. Leonardo é médico oftalmologista com registro no CRM e formação especializada em retina e catarata.",
    },
  ],

  navLinks: [
    { label: "Especialidades", href: "/#atuacao" },
    { label: "Atendimento", href: "/#atendimento" },
    { label: "Diferenciais", href: "/#diferenciais" },
    { label: "Consulta", href: "/#consulta" },
    { label: "FAQ", href: "/#faq" },
  ],

  insurance: [
    "Particular",
    "Convênios selecionados (consultar disponibilidade por cidade)",
  ],
} as const;

export type City = (typeof siteConfig.cities)[number];
export type Service = (typeof siteConfig.services)[number];
