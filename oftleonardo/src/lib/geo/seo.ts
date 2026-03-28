export function buildHomeSeoFromCity(cityName: string) {
  const title = `Leonardo Nunes · Oftalmologista em ${cityName} | Consulta, Retina e Catarata`;
  const description = `Agende sua consulta com Leonardo Nunes, oftalmologista em ${cityName}, especialista em retina e cirurgia de catarata. Avaliação detalhada, diagnóstico preciso e acompanhamento humanizado. Guias educativos sobre catarata, retina, glaucoma e exames oftalmológicos.`;

  return {
    title,
    description,
  };
}
