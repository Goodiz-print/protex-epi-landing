/* Réception des soumissions du formulaire de devis et envoi par e-mail via
   Resend (même mécanique que la landing promotional-sourcing). Le formulaire
   poste en HTML natif (pas de JS requis) ; on répond par des redirections 303. */

import { getStore } from '@netlify/blobs'

const TO = 'contact@protex-epi.com'
const FROM = 'Protex EPI <noreply@protex-epi.com>'

const MAX = { product: 300, name: 200, company: 200, email: 254, phone: 50, quantity: 20, message: 5000 }

/* Garde-fous anti-abus. Le piège à bots ci-dessous n'arrête que les robots
   naïfs, et le plan gratuit Resend est plafonné à 100 e-mails par jour : un
   robot qui poste en boucle épuiserait le quota en quelques minutes et rendrait
   le formulaire muet pour la journée. D'où trois limites complémentaires :
   un délai de remplissage minimum, un quota par IP, et un plafond global
   nettement sous celui de Resend. */
const MIN_FILL_MS = 3_000 // Personne ne remplit le formulaire en moins de 3 s.
const PER_IP_PER_HOUR = 5
const PER_IP_PER_DAY = 10
const GLOBAL_PER_DAY = 60 // Marge sous les 100 e-mails/jour du plan gratuit Resend.

const HOUR_MS = 3_600_000
const DAY_MS = 24 * HOUR_MS

/* Netlify pose l'IP réelle du client dans x-nf-client-connection-ip ; le repli
   sur x-forwarded-for sert au développement local (`netlify dev`). */
const clientIp = (req: Request) =>
  req.headers.get('x-nf-client-connection-ip') ??
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
  ''

/* Le formulaire est servi en statique : impossible de signer un jeton au
   rendu, le champ `started-at` est donc rempli par le script de la page. Un
   robot qui ne l'envoie pas (comme un visiteur sans JavaScript) passe cette
   vérification — ce sont les quotas ci-dessous qui protègent le quota Resend. */
const filledTooFast = (startedAt: string, now: number) => {
  const started = Number(startedAt)
  return Number.isFinite(started) && started > 0 && now - started < MIN_FILL_MS
}

type Verdict = 'ok' | 'ip-quota' | 'daily-quota'

/* Compteurs persistés dans Netlify Blobs (inclus dans le plan gratuit, aucune
   variable d'environnement à poser) : les horodatages des envois par IP sur
   24 h glissantes, et un compteur par journée UTC. */
const consumeQuota = async (ip: string, now: number): Promise<Verdict> => {
  const store = getStore({ name: 'quote-throttle', consistency: 'strong' })
  const dayKey = `day:${new Date(now).toISOString().slice(0, 10)}`
  const ipKey = ip ? `ip:${ip}` : ''

  const [rawHits, rawCount] = await Promise.all([
    ipKey ? store.get(ipKey, { type: 'json' }) : null,
    store.get(dayKey, { type: 'json' }),
  ])

  const hits: number[] = (Array.isArray(rawHits) ? rawHits : []).filter(
    (value: unknown): value is number => typeof value === 'number' && now - value < DAY_MS,
  )
  const dayCount: number = typeof rawCount === 'number' ? rawCount : 0

  if (ipKey && hits.length >= PER_IP_PER_DAY) return 'ip-quota'
  if (ipKey && hits.filter((at) => now - at < HOUR_MS).length >= PER_IP_PER_HOUR) return 'ip-quota'
  if (dayCount >= GLOBAL_PER_DAY) return 'daily-quota'

  await Promise.all([
    ipKey ? store.setJSON(ipKey, [...hits, now]) : null,
    store.setJSON(dayKey, dayCount + 1),
  ])
  return 'ok'
}

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  )

/* Chemins relatifs : les redirections restent valides sur les Deploy Previews Netlify. */
const redirect = (path: string) => new Response(null, { status: 303, headers: { Location: path } })

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const form = await req.formData()
  const field = (key: string) => String(form.get(key) ?? '').trim()

  const locale = field('locale') === 'en' ? 'en' : 'fr'
  const thanksPath = locale === 'en' ? '/en/thank-you/' : '/merci/'
  const errorPath = locale === 'en' ? '/en/quote/?error=1' : '/devis/?error=1'

  /* Piège à bots et remplissage instantané : on fait comme si l'envoi avait
     réussi, pour ne rien apprendre au robot sur ce qui l'a bloqué. */
  if (field('bot-field')) return redirect(thanksPath)
  if (filledTooFast(field('started-at'), Date.now())) {
    console.warn('Soumission rejetée : formulaire rempli en moins de', MIN_FILL_MS, 'ms')
    return redirect(thanksPath)
  }

  const product = field('product')
  const name = field('name')
  const company = field('company')
  const email = field('email')
  const phone = field('phone')
  const quantity = field('quantity')
  const message = field('message')

  const valid =
    name.length > 0 &&
    name.length <= MAX.name &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    email.length <= MAX.email &&
    product.length <= MAX.product &&
    company.length <= MAX.company &&
    phone.length <= MAX.phone &&
    quantity.length <= MAX.quantity &&
    message.length <= MAX.message
  if (!valid) return redirect(errorPath)

  /* Quotas, consommés seulement par une soumission valide. Contrairement au
     piège à bots, on renvoie ici la page d'erreur : un visiteur légitime qui
     tombe sur la limite doit savoir que sa demande n'est pas partie et peut
     nous appeler, alors que le robot, lui, ignore la réponse. */
  let verdict: Verdict = 'ok'
  try {
    verdict = await consumeQuota(clientIp(req), Date.now())
  } catch (error) {
    // Blobs indisponible (incident, `netlify dev` sans store) : on laisse
    // passer plutôt que de perdre une vraie demande, mais on le trace.
    console.error('Garde-fou anti-abus inopérant (Netlify Blobs) :', error)
  }
  if (verdict === 'ip-quota') {
    console.warn('Soumission rejetée : quota par IP atteint')
    return redirect(errorPath)
  }
  if (verdict === 'daily-quota') {
    console.error(
      `Soumission rejetée : plafond de ${GLOBAL_PER_DAY} envois/jour atteint. Si ce n'est pas une attaque, relever GLOBAL_PER_DAY (plan Resend gratuit : 100 e-mails/jour).`,
    )
    return redirect(errorPath)
  }

  // Sans clé Resend, l'appel API échouerait en 401 : on le dit explicitement
  // dans les logs Netlify (Logs → Functions → quote) pour diagnostiquer en un
  // coup d'œil une variable d'environnement absente ou hors scope « Functions ».
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error(
      'RESEND_API_KEY manquante : ajouter la variable dans Netlify (Site configuration → Environment variables, scope Functions) puis redéployer. Voir .env.example.',
    )
    return redirect(errorPath)
  }

  const subject = product ? `[Site] Demande de devis — ${product}` : '[Site] Demande de devis'

  const rows: Array<[string, string]> = [
    ['Produit concerné', product || 'Demande générale'],
    ['Nom', name],
    ['Société', company || '—'],
    ['E-mail', email],
    ['Téléphone', phone || '—'],
    ['Quantité souhaitée', quantity || '—'],
    ['Langue', locale],
  ]

  const html = [
    '<h2>Nouvelle demande de devis envoyée depuis le site</h2>',
    '<table cellpadding="4">',
    ...rows.map(
      ([label, value]) =>
        `<tr><td><strong>${label}</strong></td><td>${escapeHtml(value)}</td></tr>`,
    ),
    '</table>',
    '<h3>Message</h3>',
    `<p>${escapeHtml(message).replace(/\r?\n/g, '<br />')}</p>`,
  ].join('\n')

  const text = [
    'Nouvelle demande de devis envoyée depuis le site',
    '',
    ...rows.map(([label, value]) => `${label} : ${value}`),
    '',
    'Message :',
    message,
  ].join('\n')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      reply_to: email,
      subject,
      html,
      text,
    }),
  })

  if (!res.ok) {
    // 401 = clé invalide ; 403 « domain is not verified » = le domaine de FROM
    // (protex-epi.com) n'est pas vérifié dans Resend (Domains → DNS SPF/DKIM).
    console.error('Échec de l’envoi Resend :', res.status, await res.text())
    return redirect(errorPath)
  }

  return redirect(thanksPath)
}
