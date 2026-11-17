/* ==== Cuentas de la demo pública ====
 * Sus credenciales están publicadas en el README, así que las comparte cualquiera.
 * La interfaz no deja cambiarles el correo ni la contraseña para que nadie deje fuera al resto.
 * Es solo comodidad de interfaz: la protección real tiene que estar en Supabase.
 */
export const EMAILS_DEMO = [
  'cliente@distributechpro.com',
  'comercial1@distributechpro.com',
  'admin@distributechpro.com',
];

export const esCuentaDemo = (email?: string | null): boolean =>
  !!email && EMAILS_DEMO.includes(email.trim().toLowerCase());
