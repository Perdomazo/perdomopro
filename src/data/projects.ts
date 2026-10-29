import type { Locale } from '../i18n/config';

export type ProjectClassification = 'personal' | 'academic' | 'laboratory' | 'personal-site' | 'software-project';

export interface LocalizedProjectInfo {
  title: string;
  category: string;
  typeBadge: string;
  summary: string;
  highlightPill: string;
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
  pipelineHref?: string;
  preview?: { src: string; alt: Record<Locale, string> };
  content: Record<Locale, LocalizedProjectInfo>;
}

export const projectsData: readonly ProjectData[] = [
  {
    id: 'score-record',
    number: '01',
    classification: 'personal',
    technologies: ['Python', 'SQLite', 'Elo', 'Dixon–Coles'],
    href: 'https://github.com/Perdomazo/ScoreRecord',
    preview: {
      src: '/images/projects/scorerecord-overview.jpg',
      alt: { 'es-MX': 'Vista general de la aplicación ScoreRecord', en: 'Overview of the ScoreRecord application' },
    },
    content: {
      'es-MX': {
        title: 'ScoreRecord',
        category: 'SOFTWARE · DATOS',
        typeBadge: 'Proyecto personal',
        summary: 'Sistema en Python para ingesta de datos históricos, modelado probabilístico y evaluación trazable de pronósticos deportivos con almacenamiento relacional en SQLite.',
        highlightPill: 'Modelos Elo y Dixon–Coles · Registro reproducible de ejecuciones',
        problem: 'Analizar pronósticos de fútbol requiere organizar datos, modelos y evaluaciones de forma trazable.',
        built: 'Desarrollé un sistema en Python que reúne datos históricos, genera pronósticos y guarda la información necesaria para revisar cada ejecución. Su interfaz es solo de pronóstico; no es una aplicación de apuestas.',
        demonstrates: 'Ingesta y validación de datos, modelos Elo y Dixon–Coles, y registro de experimentos.',
      },
      en: {
        title: 'ScoreRecord',
        category: 'SOFTWARE · DATA',
        typeBadge: 'Personal project',
        summary: 'Python system for historical data ingestion, probabilistic modeling, and traceable evaluation of sports forecasts backed by SQLite relational storage.',
        highlightPill: 'Elo & Dixon–Coles models · Reproducible run tracking',
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
        category: 'BACKEND · API REST',
        typeBadge: 'Backend API',
        summary: 'API RESTful en Java 21 y Spring Boot diseñada bajo arquitectura limpia de tres capas (Controller, Service, Repository) para gestión transaccional de inventario en MySQL.',
        highlightPill: 'Arquitectura en 3 capas · Persistencia JPA/Hibernate + Swagger',
        problem: 'Un sistema de inventario necesita una forma consistente de consultar y administrar productos.',
        built: 'Diseñé y desarrollé una API REST en Java 21 para gestionar inventario, separando controladores, servicios y acceso a datos.',
        demonstrates: 'Diseño de API y arquitectura por capas con Spring Boot, JPA/Hibernate, MySQL y Swagger.',
      },
      en: {
        title: 'GadgetStock',
        category: 'BACKEND · REST API',
        typeBadge: 'Backend API',
        summary: 'Java 21 and Spring Boot RESTful API engineered with a clean 3-layer architecture (Controller, Service, Repository) for transactional inventory tracking over MySQL.',
        highlightPill: '3-layer clean architecture · JPA/Hibernate + OpenAPI/Swagger',
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
    href: 'https://github.com/Perdomazo/Adrian-Quant-Lab-',
    content: {
      'es-MX': {
        title: 'ETF Portfolio Analytics Tool',
        category: 'ALGORITMOS · ANÁLISIS',
        typeBadge: 'Aplicación Desktop',
        summary: 'Aplicación de escritorio para modelar y analizar portafolios con datos históricos del S&P 500, contrastando complejidad algorítmica y curvas de rendimiento con Matplotlib.',
        highlightPill: 'Benchmarking empírico: Divide & Conquer vs. Dynamic Programming',
        problem: 'Comparar algoritmos requiere observar tanto su resultado como su tiempo de ejecución.',
        built: 'Construí una aplicación de escritorio pequeña para analizar portafolios con datos del S&P 500 y comparar enfoques Divide and Conquer y Dynamic Programming.',
        demonstrates: 'Análisis de datos, visualización con Matplotlib y comparación empírica de algoritmos.',
      },
      en: {
        title: 'ETF Portfolio Analytics Tool',
        category: 'ALGORITHMS · ANALYTICS',
        typeBadge: 'Desktop App',
        summary: 'Desktop application to model and analyze portfolios using historical S&P 500 data, benchmarking algorithmic complexity and execution time curves with Matplotlib.',
        highlightPill: 'Empirical benchmarking: Divide & Conquer vs. Dynamic Programming',
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
        category: 'SISTEMAS · CONTENEDORES',
        typeBadge: 'PoC de Arquitectura',
        summary: 'Proof of Concept (PoC) de sistema de trading algorítmico contenerizado con Docker y Freqtrade para evaluar pipelines de ingesta financiera y ejecución aislada.',
        highlightPill: 'Sandbox de Arquitectura · Entorno reproducible en Docker',
        problem: 'Explorar un sistema de trading algorítmico exige entender cómo se organizan los datos, las pruebas y la operación.',
        built: 'Desarrollé un Proof of Concept (PoC) contenerizado con Freqtrade y Docker para evaluar la arquitectura de ingesta de datos financieros y operación aislada.',
        demonstrates: 'Diseño de entornos reproducibles con Docker e integración de pipelines de datos de mercado.',
      },
      en: {
        title: 'Adrian Quant Lab',
        category: 'SYSTEMS · CONTAINERS',
        typeBadge: 'Architecture PoC',
        summary: 'Containerized algorithmic trading Proof of Concept (PoC) built with Docker and Freqtrade to evaluate financial data ingestion pipelines and isolated runtime operations.',
        highlightPill: 'Architecture Sandbox · Reproducible Docker environment',
        problem: 'Exploring algorithmic trading systems means understanding how data, tests, and operations fit together.',
        built: 'I developed a containerized Proof of Concept (PoC) with Freqtrade and Docker to evaluate financial data ingestion pipelines and isolated execution.',
        demonstrates: 'Reproducible Docker environments and market data pipeline orchestration.',
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
    pipelineHref: 'https://github.com/Perdomazo/perdomopro/blob/main/.github/workflows/azure-static-web-apps.yml',
    preview: {
      src: '/images/projects/perdomopro-home.jpg',
      alt: { 'es-MX': 'Página de inicio de PerdomoPro', en: 'PerdomoPro homepage' },
    },
    content: {
      'es-MX': {
        title: 'PerdomoPro',
        category: 'WEB · CLOUD · CI/CD',
        typeBadge: 'Sitio en producción',
        summary: 'Plataforma web bilingüe de generación estática con API serverless integrada en Azure Functions y despliegue continuo automatizado hacia Azure Static Web Apps.',
        highlightPill: 'Pipeline CI/CD en GitHub Actions · Azure SWA + Serverless API',
        problem: 'Quería una presencia profesional que pudiera presentar mi trabajo y evolucionar junto con mis proyectos.',
        built: 'Diseñé y desarrollé esta página como sitio estático y gestiono su publicación en Azure Static Web Apps mediante GitHub Actions.',
        demonstrates: 'Construcción con Astro y TypeScript, estructura bilingüe y despliegue automatizado en Azure.',
      },
      en: {
        title: 'PerdomoPro',
        category: 'WEB · CLOUD · CI/CD',
        typeBadge: 'Live production',
        summary: 'Bilingual static web platform integrated with a serverless Azure Functions API and automated continuous delivery to Azure Static Web Apps.',
        highlightPill: 'GitHub Actions CI/CD pipeline · Azure SWA + Serverless API',
        problem: 'I wanted a professional presence to present my work and evolve alongside my projects.',
        built: 'I designed and built this static website and manage its deployment to Azure Static Web Apps through GitHub Actions.',
        demonstrates: 'Astro and TypeScript development, bilingual structure, and automated Azure deployment.',
      },
    },
  },
] as const;
