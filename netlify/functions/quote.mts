/* Réception des soumissions du formulaire de devis et envoi par e-mail via
   Resend (même mécanique que la landing promotional-sourcing). Le formulaire
   poste en HTML natif (pas de JS requis) ; on répond par des redirections 303. */

const TO = 'contact@protex-epi.com'
const FROM = 'Protex EPI <noreply@protex-epi.com>'

const MAX = { product: 300, name: 200, company: 200, email: 254, phone: 50, quantity: 20, message: 5000 }

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

  // Piège à bots : on fait comme si l'envoi avait réussi.
  if (field('bot-field')) return redirect(thanksPath)

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
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
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
    console.error('Échec de l’envoi Resend :', res.status, await res.text())
    return redirect(errorPath)
  }

  return redirect(thanksPath)
}
