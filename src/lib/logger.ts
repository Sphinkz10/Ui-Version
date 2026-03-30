import pino from 'pino';

// Em ambiente de browser, não queremos instanciar streams complexos.
// O Pino faz fallback automático para console.log/info no browser se configurado de forma simples,
// ou simplesmente funciona bem com o formatador base.
export const logger = pino({
  level: import.meta.env.VITE_LOG_LEVEL || (import.meta.env.PROD ? 'info' : 'debug'),
  browser: {
    asObject: true,
    write: (o) => {
      // Basic translation of Pino JSON to Sentry breadcrumbs or standard console depending on env
      if (typeof window !== 'undefined' && (window as any).Sentry && o.level >= 40) {
        // Enviar os erros para sentry
        import('@sentry/react').then((Sentry) => {
           Sentry.addBreadcrumb({
             category: 'log',
             message: o.msg,
             level: o.level >= 50 ? 'error' : 'warning',
             data: o,
           });
        });
      }
      // Replicate visually in dev
      if (!import.meta.env.PROD) {
        if (o.level >= 50) console.error(o.msg, o);
        else if (o.level >= 40) console.warn(o.msg, o);
        else console.log(o.msg, o);
      }
    }
  }
});