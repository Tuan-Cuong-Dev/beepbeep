import { NotificationTemplate, UserNotificationPreferences } from '../types';

export function renderMustache(s: string, vars: Record<string, any>) {
  return s.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const val = key.split('.').reduce((o: { [x: string]: any; },k: string | number)=>o?.[k], vars);
    return (val ?? '').toString();
  });
}

export function renderTemplate(
  tpl: NotificationTemplate,
  pref: UserNotificationPreferences,
  vars: Record<string, any>
) {
  const lang = pref.language ?? 'vi';
  const title = renderMustache(tpl.title[lang] ?? tpl.title['vi'], vars);
  const body  = renderMustache(tpl.body[lang]  ?? tpl.body['vi'], vars);
  return { title, body };
}
