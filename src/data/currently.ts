import type { Locale } from '../i18n/config';

export interface LocalizedCurrentlyTopic {
  title: string;
  subtitle: string;
  notes: string;
}

export interface CurrentlyTopicItem {
  id: string;
  number: string;
  category: string;
  status: 'active' | 'incubating';
  content: Record<Locale, LocalizedCurrentlyTopic>;
}

export const currentlyTopics: readonly CurrentlyTopicItem[] = [
  {
    id: 'cloud-architecture',
    number: '01',
    category: 'Cloud & Infrastructure',
    status: 'active',
    content: {
      'es-MX': {
        title: 'Arquitectura Cloud',
        subtitle: 'Diseño de servicios distribuidos en Azure & AWS',
        notes: 'Exploración de arquitecturas sin servidor, optimización de costos, redes virtuales seguras y patrones de resiliencia para aplicaciones web.',
      },
      en: {
        title: 'Cloud Architecture',
        subtitle: 'Distributed service design on Azure & AWS',
        notes: 'Exploring serverless architectures, cost optimization, secure virtual networking, and resilience patterns for web applications.',
      },
    },
  },
  {
    id: 'ai-agents',
    number: '02',
    category: 'Applied AI',
    status: 'active',
    content: {
      'es-MX': {
        title: 'Agentes de IA',
        subtitle: 'Orquestación de tareas y sistemas autónomos asistidos',
        notes: 'Estudio de flujos con llamada a funciones (function calling), razonamiento paso a paso e integración de agentes en herramientas de desarrollo.',
      },
      en: {
        title: 'AI Agents',
        subtitle: 'Task orchestration & assisted autonomous systems',
        notes: 'Studying function-calling workflows, step-by-step reasoning architectures, and embedding agent capabilities into developer tools.',
      },
    },
  },
  {
    id: 'local-ai',
    number: '03',
    category: 'Local Runtimes',
    status: 'active',
    content: {
      'es-MX': {
        title: 'IA Local & Edge',
        subtitle: 'Modelos de lenguaje en hardware propio sin dependencia de red',
        notes: 'Experimentación con cuantización, inferencia local sobre Apple Silicon y Linux, y aplicaciones privadas que no exponen datos sensibles.',
      },
      en: {
        title: 'Local & Edge AI',
        subtitle: 'Language models running on-prem without cloud dependencies',
        notes: 'Experimenting with model quantization, local inference on Apple Silicon/Linux, and private applications safeguarding sensitive data.',
      },
    },
  },
  {
    id: 'developer-tools',
    number: '04',
    category: 'Developer Experience',
    status: 'active',
    content: {
      'es-MX': {
        title: 'Herramientas de Desarrollo',
        subtitle: 'Utilidades CLI, tipado estricto y ergonomía técnica',
        notes: 'Investigación de herramientas de línea de comandos, linters, compiladores rápidos en Vite/Rust y estándares modernos de DX en TypeScript.',
      },
      en: {
        title: 'Developer Tools',
        subtitle: 'CLI utilities, strict typing & technical ergonomics',
        notes: 'Researching command-line tooling, fast linters, Vite/Rust-based toolchains, and modern developer experience standards with TypeScript.',
      },
    },
  },
  {
    id: 'automation',
    number: '05',
    category: 'DevOps & Workflows',
    status: 'active',
    content: {
      'es-MX': {
        title: 'Automatización de Procesos',
        subtitle: 'Eliminación sistemática de fricción operativa manual',
        notes: 'Creación de flujos con GitHub Actions, scripts en Bash/Python para soporte técnico y pipelines de despliegue continuo con validación automática.',
      },
      en: {
        title: 'Process Automation',
        subtitle: 'Systematically eliminating manual operational friction',
        notes: 'Authoring GitHub Actions workflows, Bash/Python scripts for IT operations, and zero-touch continuous deployment pipelines.',
      },
    },
  },
  {
    id: 'modern-web',
    number: '06',
    category: 'Frontend Engineering',
    status: 'active',
    content: {
      'es-MX': {
        title: 'Web Moderna & Rendimiento',
        subtitle: 'Arquitectura estática, accesibilidad y diseño editorial',
        notes: 'Profundización en Astro 5, componentes sin sobrecarga de JavaScript, Tailwind CSS 4 y micro-interacciones que respetan el rendimiento.',
      },
      en: {
        title: 'Modern Web & Performance',
        subtitle: 'Static architecture, accessibility & editorial design',
        notes: 'Deepening work with Astro 5, zero-JS islands where possible, Tailwind CSS 4 design tokens, and performance-conscious micro-interactions.',
      },
    },
  },
] as const;
