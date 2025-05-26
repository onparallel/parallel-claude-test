import { inject, injectable } from "inversify";
import { isNonNullish, pick } from "remeda";
import { CONFIG, Config } from "../../config";
import { RateLimitGuard } from "../../workers/helpers/RateLimitGuard";
import { FETCH_SERVICE, FetchService } from "../FetchService";
import {
  AdverseMediaArticle,
  EntitySuggestionResponseItem,
  IAdverseMediaSearchClient,
  SearchTerm,
} from "./AdverseMediaSearchClient";
import { extractMediaTopics } from "./utils";

const KEYWORDS = [
  "bribe*",
  "soborn*",
  "white collar crime",
  "delito de cuello blanco",
  "guante blanco",
  "convict*",
  "condena*",
  "corrupt*",
  "corrup*",
  "crime",
  "crimen",
  "criminal",
  "defendant",
  "acusad*",
  "fraud*",
  "illegal",
  "ilegal",
  "insider deal*",
  "información privilegiada",
  "insider trad*",
  "launder*",
  "blanque*",
  "plaintiff",
  "demanda*",
  "prosecut*",
  "fiscal*",
  "terror*",
  "account monitor",
  "monitorización de cuentas",
  "cuenta* monitor*",
  "account freeze",
  "congelación de cuentas",
  "cuenta* congel*",
  "disgorgement",
  "restitución de beneficios",
  "FATF report",
  "informe GAFI",
  "violation",
  "infracción",
  "market manipulat*",
  "manipulación de* mercado*",
  "fraud",
  "fraude",
  "regulatory scrutiny",
  "escrutinio regulatorio",
  "suspicious transaction",
  "transacción sospechosa",
  "suspicious banking activity",
  "actividad bancaria sospechosa",
  "suspicious financial activity",
  "actividad financiera sospechosa",
  "MVTS",
  "embezzl*",
  "malvers*",
  "tax avoidance",
  "elusión fiscal",
  "tax evasion",
  "evasión fiscal",
  "illegal profit",
  "beneficio ilícito",
  "organised criminal activity",
  "actividad criminal organizada",
  "ML offense",
  "ML offence",
  "money laundering",
  "blanqueo de capitales",
  "terrorist financing",
  "financiación del terrorismo",
  "CTF charges",
  "cargos CTF",
  "politically exposed person",
  "persona políticamente expuesta",
  "financial intelligence unit",
  "unidad de inteligencia financiera",
  "PEP",
  "PRP",
  "court costs",
  "costas judiciales",
  "illegal kickbacks",
  "comisiones ilegales",
  "financial kickback*",
  "comisión financiera*",
  "financial protocol breach",
  "incumplimiento de protocolo financiero",
  "investigat*",
  "probe*",
  "investigac*",
  "plaintiff*",
  "demandant*",
  "embezz*",
  "anti-compet*",
  "anticompet*",
  "anti-trust",
  "antitrust",
  "antimonopolio",
  "banned",
  "prohibido",
  "blacklist*",
  "lista negra",
  "complaint",
  "reclama*",
  "enjuicia*",
  "juici*",
  "judici*",
  "fined",
  "multado",
  "prohibit*",
  "prohib*",
  "monopoly",
  "monopolio",
  "revoked",
  "revoca*",
  "settlement",
  "acuerdo",
  "suspicious activity",
  "actividad sospechosa",
  "violate*",
  "viola*",
  "watchdog",
  "organismo de supervisión",
  "allegat*",
  "alegac*",
  "allege*",
  "aleg*",
  "controvers*",
  "claim*",
  "reclam*",
  "crackdown",
  "represión",
  "critic*",
  "dispute*",
  "disputa*",
  "injunction*",
  "medida cautelar*",
  "leak*",
  "filtrac*",
  "legal*",
  "redact*",
  "scam",
  "estafa",
  "scandal",
  "escándalo",
  "taint*",
  "mancill*",
  "undercover",
  "encubierto",
  "conceal*",
  "ocult*",
  "falsif*",
  "falsific*",
  "public opposition",
  "oposición pública",
  "smear campaign",
  "campaña de difamación",
  "counterclaim*",
  "reconvenc*",
  "bearer shares",
  "acciones al portador",
  "corporate service provider",
  "proveedor de servicios corporativos",
  "nominee director",
  "director nominal",
  "nominee shareholder",
  "accionista nominal",
  "offshore account",
  "cuenta* offshore",
  "shadow director",
  "director en la sombra",
  "shell bank",
  "banco fantasma",
  "shell compan*",
  "sociedad pantalla*",
  "shell corp*",
  "empresa pantalla*",
  "slush fund",
  "fondo opaco",
  "special purpose vehicle",
  "vehículo de propósito especial",
  "tax haven",
  "paraíso* fiscal*",
  "untraceable",
  "imposible de rastrear",
  "tax concealment",
  "ocultación fiscal",
  "tax dodger",
  "evas* fiscal",
  "extremis",
  "radicals",
  "radicales",
  "jihad",
  "yihad",
  "taliban",
  "talibán",
  "isis",
  "ISIS",
  "al-qaeda",
  "Al-Qaeda",
  "boko haram",
  "Boko Haram",
  "islamic state",
  "Estado Islámico",
  "three percenter",
  "tres por ciento",
  "atomwaffen division",
  "División Atomwaffen",
  "asov battalions",
  "batallones Azov",
  "proud boys",
  "Proud Boys",
  "counterterrorism",
  "contraterroris*",
  "domestic violent extremism",
  "violen* doméstic*",
  "right-wing violence",
  "violencia de ultraderecha",
  "neo nazi*",
  "neonazi*",
  "lone wolf",
  "lobo solitario",
  "digital terrorism",
  "terrorismo digital",
  "white supremac*",
  "supremac* blanc*",
  "hate speech",
  "discurso de odio",
  "ethnonationalist",
  "etnonacionalista",
  "financial conduct authority",
  "autoridad de conducta financiera",
  "FINCEN",
  "sanction*",
  "sanción",
  "sancion*",
  "embargo",
  "OFAC",
  "payment stripping",
  "eliminación de pagos",
  "trade restriction*",
  "restricción comercial*",
  "Restrictive Measures",
  "medidas restrictivas",
  "medida* preven*",
  "houthis",
  "hutíes",
  "yemen",
  "Yemen",
  "DPRK",
  "RPDC",
  "north korea",
  "Corea del Norte",
  "apprehend*",
  "deten*",
  "arrest*",
  "charge*",
  "acusac*",
  "class action",
  "demanda colectiva",
  "court case",
  "caso judicial",
  "defence",
  "defense",
  "defensa",
  "detention",
  "detención",
  "detenid*",
  "indict*",
  "acus*",
  "charges",
  "cargos",
  "acquittal",
  "absolución",
  "absuel*",
  "imprison*",
  "incarcerat*",
  "encarcel*",
  "maximum sentence",
  "pena máxima",
  "sentence*",
  "sentencia*",
  "jurors",
  "jury",
  "jurado*",
  "judge",
  "juez",
  "magistrad*",
  "tribunal",
  "litigation",
  "litigio",
  "plea deal",
  "culpa*",
  "sue*",
  "demand*",
  "lawsuit",
  "demanda",
  "verdict",
  "veredicto",
  "burglar*",
  "ladron*",
  "conspir*",
  "drug deal",
  "tráfico de drogas",
  "smuggling",
  "contrabando",
  "manslaughter",
  "homicidio imprudente",
  "homicide",
  "homicidio",
  "larceny",
  "hurto",
  "murder",
  "asesinato",
  "paedophil*",
  "pedófil*",
  "peder*",
  "prostitution",
  "prostitución",
  "robber*",
  "rob*",
  "rape",
  "violación",
  "viol*",
  "felon",
  "delincuente",
  "sexual assault",
  "agresión sexual",
  "grand threft",
  "hurto mayor",
  "harassment",
  "acoso",
  "molestation",
  "sex abuse",
  "abuso sexual",
  "human trafficking",
  "trata de seres humanos",
  "abuse",
  "abuso",
  "violent crime*",
  "delito violento*",
  "conflict of interest",
  "conflicto de intereses",
  "disqualifi*",
  "descalific*",
  "termination*",
  "despido*",
  "demotion*",
  "demoted",
  "degrada*",
  "cronyism",
  "amiguismo",
  "coloca*",
  "resign*",
  "dimi*",
  "mismanagement",
  "mala gestión",
  "malpractice",
  "negligencia profesional",
  "corporate malfeasance",
  "mala praxis corporativa",
  "unethical business",
  "negocio poco ético",
  "dishonest*",
  "deshonest*",
  "exploitative",
  "explotador",
  "misconduct",
  "mala conducta",
  "nepotism",
  "nepotismo",
  "sack",
  "despido",
  "suspend*",
  "amnesty international",
  "Amnistía Internacional",
  "centre for investigative journalism",
  "centro de periodismo de investigación",
  "corrupt watch",
  "anticorrupción",
  "stolen asset recovery",
  "recuperación de activos",
  "tax justice network",
  "red de justicia fiscal",
  "wikileaks",
  "WikiLeaks",
  "exploit*",
  "explot*",
  "slave labour",
  "slave labor",
  "trabajo esclavo",
  "esclav*",
  "picket lines",
  "piquetes",
  "unionisation",
  "unionization",
  "sindicalización",
  "job cuts",
  "recortes de empleo",
  "redundan*",
  "strike action",
  "workers on strike",
  "huelga",
  "trade union",
  "sindicato",
  "working conditions",
  "condiciones laborales",
  "arms deal*",
  "venta de armas*",
  "armas",
  "correspondent bank*",
  "banco corresponsal*",
  "militia",
  "milicia",
  "pollut*",
  "contamin*",
  "toxic dump",
  "vertido*",
  "toxin*",
  "toxina*",
  "contamination",
  "contaminación",
  "envrionmental damage",
  "daño ambiental",
  "explosion",
  "explosión",
  "fracking",
  "hazard*",
  "peligro*",
  "activist protest",
  "protesta de activistas",
  "ecocide",
  "ecocidio",
  "extractive industry",
  "industria extractiva",
  "coercion",
  "coacción",
  "amenaz*",
  "fraudulent conveyance",
  "transferencia fraudulenta",
  "arraignment",
  "lectura de cargos",
  "market rigging",
  "manipulación de mercado",
  "financial impropriety",
  "irregularidad financiera",
  "judicial proceedings",
  "procesos judiciales",
  "terrorist fund support",
  "financiación terrorista",
  "alternative remittance system",
  "sistema alternativo de remesas",
];
interface OPointDocument {
  id_site: number;
  id_article: number;
  unix_timestamp?: number;
  first_source?: {
    id: number;
    name?: string;
    sitename?: string;
    url?: string;
    siteurl?: string;
  };
  header?: {
    matches: boolean;
    text: string;
  };
  summary?: {
    matches: boolean;
    text: string;
  };
  body?: {
    matches: boolean;
    text: string;
  };
  quotes?: {
    matches: boolean;
    text: string;
  }[];
  articleimages?: {
    count: number;
    articleimage: { url: string }[];
  };
  url?: string;
  orig_url?: string;
  author?: string;
}

interface OPointSearchResponse {
  searchresult: {
    documents: number;
    document: OPointDocument[];
    generated_timestamp: number;
  };
}

interface OPointSuggestResponse {
  results: { id: string; name: string }[];
}

const ARTICLE_ID_REGEX = /^OPOINT\/(\d+)-(\d+)$/;

@injectable()
export class OPointClient implements IAdverseMediaSearchClient {
  private rateLimit: RateLimitGuard;

  constructor(
    @inject(CONFIG) private config: Config,
    @inject(FETCH_SERVICE) private fetch: FetchService,
  ) {
    this.rateLimit = new RateLimitGuard(200); // 200 requests per second
  }

  private async apiCall<TResult>(method: string, uri: string, body?: any): Promise<TResult> {
    const response = await this.fetch.fetch(`https://api.opoint.com/${uri}`, {
      method,
      headers: {
        Authorization: `Token ${this.config.adverseMedia.oPoint.token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (response.ok) {
      return await response.json();
    }

    throw new Error(`OPoint API call failed: ${response.status} ${response.statusText}`);
  }

  async searchEntities(
    searchTerm: string,
    opts?: { excludeIds?: string[] },
  ): Promise<EntitySuggestionResponseItem[]> {
    // this is how we are supposed to filter out entities, but it doesn't work
    // const selectedFilters = opts?.excludeIds?.length
    //   ? opts.excludeIds.map((id) => `-ent:${id}`).join(",")
    //   : "nometa";

    const selectedFilters = "nometa";

    // as filters are not working, we need to add the number of excluded entities to the results count
    // and then filter out the excluded entities after the results are returned
    const resultsCount = 5 + (opts?.excludeIds?.length ?? 0);

    const response = await this.apiCall<OPointSuggestResponse>(
      "GET",
      `suggest/en_GB_1/single/${resultsCount}/0/0/2147483647:65536/${selectedFilters}/${searchTerm}`,
    );

    return response.results
      .map(pick(["id", "name"]))
      .filter((r) => !opts?.excludeIds?.includes(r.id))
      .slice(0, 5);
  }

  async searchArticles(searchTerms: SearchTerm[], opts?: { excludeArticles?: string[] }) {
    await this.rateLimit.waitUntilAllowed();
    const response = await this.apiCall<OPointSearchResponse>("POST", "search/", {
      searchterm: this.buildSearchTerm(searchTerms, opts?.excludeArticles),
      params: {
        requestedarticles: 100,
        main: {
          header: 1,
        },
        groupidentical: true,
        identical: {
          inherit: true,
        },
        includeidentical: false,
      },
    });

    return {
      totalCount: response.searchresult.documents,
      items: response.searchresult.document.map(this.mapArticle),
      createdAt: new Date(response.searchresult.generated_timestamp * 1_000),
    };
  }

  async fetchArticle(id: string, searchTerms?: SearchTerm[] | null) {
    const idMatch = id.match(ARTICLE_ID_REGEX);
    if (!idMatch) {
      throw new Error(`Invalid OPoint article ID format: ${id}`);
    }

    const [, idSite, idArticle] = idMatch;
    await this.rateLimit.waitUntilAllowed();
    const response = await this.apiCall<OPointSearchResponse>("POST", "search/", {
      // search terms are used to build quotes and match tags
      ...(searchTerms ? { searchterm: this.buildSearchTerm(searchTerms) } : {}),
      params: {
        requestedarticles: 1,
        articles: [
          {
            id_site: parseInt(idSite),
            id_article: parseInt(idArticle),
          },
        ],
        main: {
          header: 1,
          summary: 1,
          text: 2,
          quotes: 2,
          matches: true,
        },
      },
    });

    if (response.searchresult.document.length === 0) {
      throw new Error("ARTICLE_NOT_FOUND");
    }

    return this.mapArticle(response.searchresult.document[0]);
  }

  private buildSearchTerm(searchTerms: SearchTerm[], excludeArticleIds: string[] = []) {
    const search = searchTerms.map(this.mapTerm);
    const mediaTopics = extractMediaTopics([
      "medtop:16000000", // conflict, war and peace
      "medtop:02000000", // crime, law and justice
      "medtop:11000000", // politics and government
    ]).map(this.mapMediaTopic);

    const keywords = KEYWORDS.map((k) => `"${k}"`);

    const excludedArticles = excludeArticleIds.map((id) => {
      const idMatch = id.match(ARTICLE_ID_REGEX);
      if (!idMatch) {
        throw new Error(`Invalid OPoint article ID format: ${id}`);
      }

      const [, idSite, idArticle] = idMatch;

      return `id:${idSite}_${idArticle}`;
    });

    return (
      `(${search.join(" OR ")})` +
      ` AND (${keywords.join(" OR ")})` +
      ` AND (${mediaTopics.join(" OR ")})` +
      (excludedArticles.length > 0 ? ` ANDNOT (${excludedArticles.join(" OR ")})` : "")
    );
  }

  private mapMediaTopic(topic: string) {
    const match = topic.match(/^medtop:(\d{8})$/);
    if (!match) {
      throw new Error(`Invalid mediatopic format: ${topic}`);
    }

    return `topic:${parseInt(match[1]) + 100_000_000}`;
  }

  private mapTerm(item: SearchTerm) {
    if (isNonNullish(item.entityId)) {
      const ent = `ent:${item.entityId}`;
      const label = item.label ? `"${item.label}"` : null;
      // add label if present, this way we are able to extract <match/> tags and quotes
      return [ent, label].filter(isNonNullish).join(" OR ");
    }

    if (isNonNullish(item.wikiDataId)) {
      const ent = `ent:${parseInt(item.wikiDataId.replace(/^[A-Za-z]/g, "")) + 1_000_000_000}`;
      const label = item.label ? `"${item.label}"` : null;
      // add label if present, this way we are able to extract <match/> tags and quotes
      return [ent, label].filter(isNonNullish).join(" OR ");
    }

    if (isNonNullish(item.term)) {
      return `"${item.term}"`;
    }

    throw new Error(`Invalid search term: ${JSON.stringify(item)}`);
  }

  private mapArticle(article: OPointDocument): AdverseMediaArticle {
    return {
      id: `OPOINT/${article.id_site}-${article.id_article}`,
      source: article.first_source?.sitename,
      url: article.orig_url,
      author: article.author,
      quotes: article.quotes?.map((q) => q.text),
      header: article.header?.text,
      body: article.body?.text,
      summary: article.summary?.text,
      timestamp: article.unix_timestamp,
      images:
        article.articleimages?.articleimage
          .filter((i) => i.url.startsWith("https://"))
          .map((i) => i.url) ?? [],
    };
  }
}
