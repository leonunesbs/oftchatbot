export const clinicConfig = {
  name: "Clínica Oft Leonardo",
  timezone: "America/Fortaleza",
  hours: "Segunda a sexta, 8h às 18h. Sábado, 8h às 12h.",
  locations: [
    {
      id: "fortaleza-aldeota",
      name: "Fortaleza - Aldeota",
      address: "Avenida Santos Dumont, 0000 - Aldeota, Fortaleza - CE",
      mapsUrl: "https://maps.google.com/?q=Aldeota+Fortaleza",
    },
  ],
  pricingPolicy:
    "Os valores podem variar conforme tipo de atendimento e convênio. Para preço exato e cobertura, o atendimento humano confirma pelo WhatsApp.",
  lgpdNotice: "Seus dados serão usados apenas para agendamento.",
};

export const educationalFaq: Record<string, string> = {
  catarata:
    "Catarata é a opacificação do cristalino e pode causar visão embaçada, sensibilidade à luz e piora progressiva da visão.",
  retina:
    "Doenças da retina, como DMRI e descolamento, podem alterar visão central ou periférica e precisam de avaliação especializada.",
  glaucoma:
    "Glaucoma pode lesar o nervo óptico de forma silenciosa. A prevenção com acompanhamento oftalmológico é essencial.",
  "olho seco":
    "Olho seco costuma causar ardor, sensação de areia e oscilação visual. Ajustes de rotina e avaliação médica ajudam no controle.",
  exame:
    "Exames oftalmológicos comuns incluem refração, tonometria, mapeamento de retina e fundo de olho, conforme necessidade clínica.",
  "consulta oftalmologica":
    "Na consulta oftalmológica geral, o médico avalia queixa principal, acuidade visual e define exames complementares quando necessário.",
};
