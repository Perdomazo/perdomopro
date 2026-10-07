import type { Locale } from '../i18n/config';

export type ProjectClassification = 'personal' | 'academic' | 'laboratory' | 'personal-site' | 'software-project';

export interface LocalizedProjectInfo {
  title: string;
  category: string;
  typeBadge: string;
  problem: string;
  built: string;
  demonstrates: string;
}

export interface ProjectData {
  id: string;
  number: string;
  classification: ProjectClassification;
  technologies: readonly string[];
  href?: string;
  liveHref?: string;
  content: Record<Locale, LocalizedProjectInfo>;
}

export const projectsData: readonly ProjectData[] = [
  {
    id: 'score-record',
    number: '01',
    classification: 'personal',
    technologies: ['Python', 'SQLite', 'Elo', 'Dixon–Coles'],
    href: 'https://github.com/Perdomazo/ScoreRecord',
    content: {
      'es-MX': {
        title: 'ScoreRecord',
        category: 'SOFTWARE / DATOS / PRONÓSTICOS DEPORTIVOS',
        typeBadge: 'Proyecto personal',
        problem: 'Analizar pronósticos de fútbol requiere organizar datos, modelos y evaluaciones de forma trazable.',
        built: 'Desarrollé un sistema en Python que reúne datos históricos, genera pronósticos y guarda la información necesaria para revisar cada ejecución. Su interfaz es solo de pronóstico; no es una aplicación de apuestas.',
        demonstrates: 'Ingesta y validación de datos, modelos Elo y Dixon–Coles, y registro de experimentos.',
      },
      en: {
        title: 'ScoreRecord',
        category: 'SOFTWARE / DATA / SPORTS FORECASTING',
        typeBadge: 'Personal project',
        problem: 'Analyzing football forecasts requires traceable data, models, and evaluation runs.',
        built: 'I built a Python system that gathers historical data, generates forecasts, and stores information for reviewing each run. Its interface is forecast-only; it is not a betting app.',
        demonstrates: 'Data ingestion and validation, Elo and Dixon–Coles models, and experiment tracking.',
      },
    },
  },
  {
    id: 'gadgetstock',
    number: '02',
    classification: 'software-project',
    technologies: ['Java 21', 'Spring Boot', 'JPA / Hibernate', 'MySQL', 'Swagger'],
    href: 'https://github.com/Perdomazo/GadgetStock',
    content: {
      'es-MX': {
        title: 'GadgetStock',
        category: 'BACKEND / API REST / INVENTARIO',
        typeBadge: 'Proyecto de software',
        problem: 'Un sistema de inventario necesita una forma consistente de consultar y administrar productos.',
        built: 'Diseñé y desarrollé una API REST en Java 21 para gestionar inventario, separando controladores, servicios y acceso a datos.',
        demonstrates: 'Diseño de API y arquitectura por capas con Spring Boot, JPA/Hibernate, MySQL y Swagger.',
      },
      en: {
        title: 'GadgetStock',
        category: 'BACKEND / REST API / INVENTORY',
        typeBadge: 'Software project',
        problem: 'An inventory system needs a consistent way to query and manage products.',
        built: 'I designed and developed a Java 21 REST API for inventory management, separating controllers, services, and data access.',
        demonstrates: 'API design and layered architecture with Spring Boot, JPA/Hibernate, MySQL, and Swagger.',
      },
    },
  },
  {
    id: 'etf-portfolio-analytics',
    number: '03',
    classification: 'software-project',
    technologies: ['Python', 'Pandas', 'NumPy', 'NetworkX', 'Matplotlib', 'CustomTkinter'],
    content: {
      'es-MX': {
        title: 'ETF Portfolio Analytics Tool',
        category: 'PYTHON / ANÁLISIS / ALGORITMOS',
        typeBadge: 'Proyecto pequeño',
        problem: 'Comparar algoritmos requiere observar tanto su resultado como su tiempo de ejecución.',
        built: 'Construí una aplicación de escritorio pequeña para analizar portafolios con datos del S&P 500 y comparar enfoques Divide and Conquer y Dynamic Programming.',
        demonstrates: 'Análisis de datos, visualización con Matplotlib y comparación empírica de algoritmos.',
      },
      en: {
        title: 'ETF Portfolio Analytics Tool',
        category: 'PYTHON / ANALYTICS / ALGORITHMS',
        typeBadge: 'Small project',
        problem: 'Comparing algorithms means looking at both their results and their execution time.',
        built: 'I built a small desktop application to analyze portfolios using S&P 500 data and compare Divide and Conquer with Dynamic Programming approaches.',
        demonstrates: 'Data analysis, Matplotlib visualization, and empirical algorithm comparison.',
      },
    },
  },
  {
    id: 'adrian-quant-lab',
    number: '04',
    classification: 'laboratory',
    technologies: ['Python', 'Freqtrade', 'Docker'],
    href: 'https://github.com/Perdomazo/Adrian-Quant-Lab-',
    content: {
      'es-MX': {
        title: 'Adrian Quant Lab',
        category: 'PYTHON / INVESTIGACIÓN / MERCADOS',
        typeBadge: 'Laboratorio de aprendizaje',
        problem: 'Explorar un sistema de trading algorítmico exige entender cómo se organizan los datos, las pruebas y la operación.',
        built: 'Inicié un laboratorio de aprendizaje basado en Freqtrade. El alcance creció más de lo que podía completar y el proyecto quedó incompleto.',
        demonstrates: 'Una exploración técnica en curso, no un producto terminado ni una estrategia con resultados validados.',
      },
      en: {
        title: 'Adrian Quant Lab',
        category: 'PYTHON / RESEARCH / MARKETS',
        typeBadge: 'Learning lab',
        problem: 'Exploring algorithmic trading systems means understanding how data, tests, and operations fit together.',
        built: 'I started a learning lab based on Freqtrade. Its scope grew beyond what I could complete, so the project remains unfinished.',
        demonstrates: 'An ongoing technical exploration, not a finished product or a strategy with validated results.',
      },
    },
  },
  {
    id: 'perdomopro',
    number: '05',
    classification: 'personal-site',
    technologies: ['Astro', 'TypeScript', 'Tailwind CSS', 'GitHub Actions', 'Azure Static Web Apps'],
    href: 'https://github.com/Perdomazo/perdomopro',
    liveHref: 'https://perdomopro.com/',
    content: {
      'es-MX': {
        title: 'PerdomoPro',
        category: 'SITIO PERSONAL / SOFTWARE / CLOUD',
        typeBadge: 'Sitio activo',
        problem: 'Quería una presencia profesional que pudiera presentar mi trabajo y evolucionar junto con mis proyectos.',
        built: 'Diseñé y desarrollé esta página como sitio estático y gestiono su publicación en Azure Static Web Apps mediante GitHub Actions.',
        demonstrates: 'Construcción con Astro y TypeScript, estructura bilingüe y despliegue automatizado en Azure.',
      },
      en: {
        title: 'PerdomoPro',
        category: 'PERSONAL SITE / SOFTWARE / CLOUD',
        typeBadge: 'Live site',
        problem: 'I wanted a professional presence to present my work and evolve alongside my projects.',
        built: 'I designed and built this static website and manage its deployment to Azure Static Web Apps through GitHub Actions.',
        demonstrates: 'Astro and TypeScript development, bilingual structure, and automated Azure deployment.',
      },
    },
  },
] as const;
