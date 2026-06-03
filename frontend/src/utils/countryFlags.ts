/**
 * Mapeamento de nomes de seleções (como estão no banco) para códigos ISO 3166-1 alpha-2.
 * Usado para gerar URLs de bandeiras via flagcdn.com
 */
const countryCodeMap: Record<string, string> = {
  'Afghanistan': 'af',
  'Albania': 'al',
  'Algeria': 'dz',
  'Argentina': 'ar',
  'Australia': 'au',
  'Austria': 'at',
  'Belgium': 'be',
  'Bolivia': 'bo',
  'Bosnia and Herzegovina': 'ba',
  'Brazil': 'br',
  'Cameroon': 'cm',
  'Canada': 'ca',
  'Chile': 'cl',
  'China PR': 'cn',
  'Colombia': 'co',
  'Congo DR': 'cd',
  'Costa Rica': 'cr',
  'Croatia': 'hr',
  'Cuba': 'cu',
  'Curaçao': 'cw',
  'Czechia': 'cz',
  'Czech Republic': 'cz',
  'Denmark': 'dk',
  'Ecuador': 'ec',
  'Egypt': 'eg',
  'England': 'gb-eng',
  'Finland': 'fi',
  'France': 'fr',
  'Germany': 'de',
  'Ghana': 'gh',
  'Greece': 'gr',
  'Haiti': 'ht',
  'Honduras': 'hn',
  'Hungary': 'hu',
  'Iceland': 'is',
  'India': 'in',
  'Indonesia': 'id',
  'IR Iran': 'ir',
  'Iran': 'ir',
  'Iraq': 'iq',
  'Ireland': 'ie',
  'Israel': 'il',
  'Italy': 'it',
  'Ivory Coast': 'ci',
  "Côte d'Ivoire": 'ci',
  'Jamaica': 'jm',
  'Japan': 'jp',
  'Jordan': 'jo',
  'Kenya': 'ke',
  'Korea Republic': 'kr',
  'South Korea': 'kr',
  'Mexico': 'mx',
  'Morocco': 'ma',
  'Netherlands': 'nl',
  'New Zealand': 'nz',
  'Nigeria': 'ng',
  'North Macedonia': 'mk',
  'Norway': 'no',
  'Oman': 'om',
  'Panama': 'pa',
  'Paraguay': 'py',
  'Peru': 'pe',
  'Philippines': 'ph',
  'Poland': 'pl',
  'Portugal': 'pt',
  'Qatar': 'qa',
  'Romania': 'ro',
  'Russia': 'ru',
  'Saudi Arabia': 'sa',
  'Scotland': 'gb-sct',
  'Senegal': 'sn',
  'Serbia': 'sr',
  'Slovakia': 'sk',
  'Slovenia': 'si',
  'South Africa': 'za',
  'Spain': 'es',
  'Sweden': 'se',
  'Switzerland': 'ch',
  'Thailand': 'th',
  'Tunisia': 'tn',
  'Türkiye': 'tr',
  'Turkey': 'tr',
  'Ukraine': 'ua',
  'United Arab Emirates': 'ae',
  'Uruguay': 'uy',
  'USA': 'us',
  'United States': 'us',
  'Uzbekistan': 'uz',
  'Venezuela': 've',
  'Vietnam': 'vn',
  'Wales': 'gb-wls',
}

/**
 * Retorna a URL da bandeira para um nome de seleção.
 * Usa flagcdn.com (gratuito, sem API key, com CDN global).
 *
 * @param teamName - Nome do time como está no banco (ex: "Brazil", "Korea Republic")
 * @param width - Largura da imagem em pixels (default: 80)
 * @returns URL da bandeira ou null se o time não for encontrado
 */
export function getFlagUrl(teamName: string, width = 80): string | null {
  const code = countryCodeMap[teamName]
  if (!code) return null
  return `https://flagcdn.com/w${width}/${code}.png`
}

/**
 * Retorna o código ISO de um time (útil para usar com emoji flags ou outras libs).
 */
export function getCountryCode(teamName: string): string | null {
  return countryCodeMap[teamName] ?? null
}
