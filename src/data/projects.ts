import type { Locale } from '../i18n/config';

export type ProjectClassification = 'professional' | 'academic' | 'personal' | 'laboratory';

export interface LocalizedProjectInfo {
  title: string;
  tagline: string;
  category: string;
  description: string;
  context: string;
  statusLabel: string;
  typeBadge: string;
}

export interface ProjectData {
  id: string;
  number: string;
  classification: ProjectClassification;
  technologies: readonly string[];
  diagramFlow: readonly string[];
  href?: string;
  content: Record<Locale, LocalizedProjectInfo>;
}

export const projectsData: readonly ProjectData[] = [
  {
    id: 'azure-web-modernization',
    number: '01',
    classification: 'professional',
    technologies: ['Azure', 'Azure Static Web Apps', 'IIS', 'AWS', 'GitHub Actions', 'DNS'],
    diagramFlow: ['IIS / AWS', 'GitHub Actions CI/CD', 'Azure SWA', 'DNS Traffic'],
    content: {
      'es-MX': {
        title: 'Azure / Web Modernization',
        tagline: 'Modernización y transición hacia infraestructura cloud',
        category: 'Cloud / Infraestructura / Web',
        description:
          'Migración y modernización de aplicaciones web desde entornos basados en IIS y AWS hacia servicios gestionados en Microsoft Azure.',
        context:
          'Exposición técnica práctica en soporte e infraestructura orientada a transición cloud, automatización con GitHub Actions y gestión de DNS.',
        statusLabel: 'Exposición profesional en infraestructura',
        typeBadge: 'Experiencia práctica',
      },
      en: {
        title: 'Azure / Web Modernization',
        tagline: 'Web infrastructure migration & cloud modernization',
        category: 'Cloud / Infrastructure / Web',
        description:
          'Migration and modernization of web applications from legacy IIS and AWS-based servers toward managed Microsoft Azure cloud services.',
        context:
          'Practical hands-on exposure in technical infrastructure: DNS zone management, GitHub Actions automated CI/CD deployments, and web service re-configuration.',
        statusLabel: 'Professional infrastructure exposure',
        typeBadge: 'Practical experience',
      },
    },
  },
  {
    id: 'iot-industrial-monitoring',
    number: '02',
    classification: 'academic',
    technologies: ['IoT', 'Raspberry Pi', 'Sensors', 'Edge Computing', 'AI', 'Cloud'],
    diagramFlow: ['Sensores Emisiones', 'Raspberry Pi Edge', 'Buffer Local', 'Cloud Telemetry'],
    content: {
      'es-MX': {
        title: 'IoT Industrial Monitoring',
        tagline: 'Arquitectura conceptual de telemetría y computación en el borde',
        category: 'IoT / Edge / AI',
        description:
          'Proyecto académico de arquitectura IoT orientado al monitoreo de emisiones en procesos industriales mediante sensores y computación perimetral.',
        context:
          'Diseño conceptual y formativo en la Universidad de Guadalajara. Aborda la captura de señales físicas, filtrado local en Raspberry Pi y preparación de telemetría para análisis en la nube.',
        statusLabel: 'Proyecto académico conceptual',
        typeBadge: 'Académico / Conceptual',
      },
      en: {
        title: 'IoT Industrial Monitoring',
        tagline: 'Conceptual industrial telemetry & edge architecture',
        category: 'IoT / Edge / AI',
        description:
          'Academic IoT architecture project focused on monitoring industrial process emissions through sensor arrays and edge computing nodes.',
        context:
          'Conceptual university engineering project at Universidad de Guadalajara. Explores signal acquisition, local filtering on Raspberry Pi, and telemetry staging for cloud analytics.',
        statusLabel: 'Conceptual academic project',
        typeBadge: 'Academic / Conceptual',
      },
    },
  },
  {
    id: 'gastup',
    number: '03',
    classification: 'personal',
    technologies: ['React Native', 'SQLite', 'Mobile', 'Local-first'],
    diagramFlow: ['UI React Native', 'Transacciones SQLite', 'Motor Local-first', 'Análisis Offline'],
    content: {
      'es-MX': {
        title: 'GastUp↑',
        tagline: 'Gestión financiera personal con persistencia local',
        category: 'Mobile / Software',
        description:
          'Aplicación móvil personal en desarrollo conceptual para el control y análisis financiero individual con arquitectura offline-first.',
        context:
          'Arquitectura bajo el principio local-first con persistencia directa en SQLite. Privacidad de datos por diseño, cero dependencia de servidores remotos para operaciones esenciales y respuesta inmediata.',
        statusLabel: 'En desarrollo conceptual',
        typeBadge: 'Proyecto personal',
      },
      en: {
        title: 'GastUp↑',
        tagline: 'Local-first personal finance mobile application',
        category: 'Mobile / Software',
        description:
          'Personal mobile application in conceptual development for immediate expense tracking, categorization, and financial analysis.',
        context:
          'Engineered around local-first architecture with direct SQLite persistence. Complete data privacy by design, zero mandatory cloud connectivity for daily logs, and sub-millisecond response.',
        statusLabel: 'Conceptual development',
        typeBadge: 'Personal project',
      },
    },
  },
  {
    id: 'perdomopro',
    number: '04',
    classification: 'laboratory',
    technologies: ['Astro', 'TypeScript', 'Tailwind CSS', 'GSAP', 'Azure', 'GitHub Actions'],
    diagramFlow: ['Astro 5 Islands', 'Tailwind 4 Tokens', 'GitHub Actions', 'Azure SWA'],
    href: 'https://perdomopro.com',
    content: {
      'es-MX': {
        title: 'PerdomoPro',
        tagline: 'Laboratorio de ingeniería web y presencia digital',
        category: 'Web / Frontend / Cloud',
        description:
          'Construcción de mi propia plataforma digital como laboratorio activo para experimentar con arquitectura estática, rendimiento web, diseño editorial y despliegue automatizado.',
        context:
          'Generado con HTML estático sobre Astro 5 y alojado en Azure Static Web Apps con CI/CD automatizado. Sistema de tokens visuales sobrio, diseño mobile-first y arquitectura i18n desde la raíz.',
        statusLabel: 'Laboratorio activo en evolución',
        typeBadge: 'Plataforma en vivo',
      },
      en: {
        title: 'PerdomoPro',
        tagline: 'Web engineering laboratory & digital identity',
        category: 'Web / Frontend / Cloud',
        description:
          'Building my personal digital platform as an active laboratory to experiment with static architecture, web performance, editorial design, and automated continuous delivery.',
        context:
          'Generated as static HTML on Astro 5 and hosted on Azure Static Web Apps via automated CI/CD. Monochromatic design tokens, mobile-first responsiveness, and native root i18n architecture.',
        statusLabel: 'Active evolving laboratory',
        typeBadge: 'Live platform',
      },
    },
  },
] as const;
