// Función de Netlify: pide a AEMET la predicción oficial de una playa y la devuelve a la página.
// Existe porque AEMET no permite llamadas directas desde el navegador (CORS) y para que la clave no quede a la vista.
// La página la llama así: /api/aemet?code=3501601

const AEMET_API = "https://opendata.aemet.es/opendata/api/prediccion/especifica/playa/"; // Dirección de la API de playas de AEMET

const json = (status, body, cacheSeconds = 0) => new Response(JSON.stringify(body), { // Construye una respuesta JSON
  status, // Código HTTP
  headers: { // Cabeceras
    "Content-Type": "application/json; charset=utf-8", // Siempre JSON en UTF-8
    "Cache-Control": cacheSeconds ? "public, max-age=600" : "no-store", // El navegador la guarda 10 min (o nada si es un error)
    "Netlify-CDN-Cache-Control": cacheSeconds ? "public, s-maxage=" + cacheSeconds + ", stale-while-revalidate=600" : "no-store" // La red de Netlify la guarda más tiempo: muchas visitas = pocas llamadas a AEMET
  } // Fin de las cabeceras
}); // Fin de la respuesta

async function fetchWithTimeout(url, options = {}) { // fetch con tiempo máximo de 20 s
  const ctrl = new AbortController(); // Controlador para cancelar
  const timer = setTimeout(() => ctrl.abort(), 20000); // Cancela a los 20 s
  try { // Intenta la petición
    return await fetch(url, { ...options, signal: ctrl.signal }); // Hace la petición
  } finally { // Siempre
    clearTimeout(timer); // Quita el temporizador
  } // Fin del try
} // Fin de fetchWithTimeout

function decodeAemet(buffer) { // AEMET envía los datos en ISO-8859-15; se pasan a texto normal
  try { // Intenta con la codificación exacta
    return new TextDecoder("iso-8859-15").decode(buffer); // Decodifica con ISO-8859-15
  } catch (e) { // Si el entorno no la conoce
    return new TextDecoder("latin1").decode(buffer); // Usa Latin-1, prácticamente igual para el español
  } // Fin del try
} // Fin de decodeAemet

export default async (req) => { // Se ejecuta en cada petición a /api/aemet
  const code = new URL(req.url).searchParams.get("code") || ""; // Lee el código de playa de la URL
  if (!/^\d{7}$/.test(code)) return json(400, { error: "código de playa no válido" }); // Solo acepta códigos AEMET de 7 cifras (evita abusos)
  const key = process.env.AEMET_API_KEY; // Lee la clave guardada en las variables de entorno de Netlify
  if (!key) return json(500, { error: "el servidor no tiene configurada la clave de AEMET (variable AEMET_API_KEY)" }); // Aviso claro si falta
  try { // Intenta hablar con AEMET
    const r1 = await fetchWithTimeout(AEMET_API + code, { headers: { api_key: key, Accept: "application/json" } }); // Paso 1: pide la URL temporal de los datos
    const step1 = await r1.json().catch(() => null); // Lee la respuesta del paso 1
    if (r1.status === 401 || step1?.estado === 401) return json(502, { error: "AEMET no acepta la clave configurada en el servidor" }); // Clave incorrecta
    if (r1.status === 429 || step1?.estado === 429) return json(503, { error: "AEMET ha recibido demasiadas peticiones; prueba en un minuto" }); // Límite de AEMET superado
    if (!step1 || step1.estado !== 200 || !step1.datos) return json(502, { error: "AEMET: " + (step1?.descripcion || "respuesta inesperada") }); // Otros errores de AEMET
    const datosUrl = new URL(step1.datos); // URL temporal que da AEMET
    if (datosUrl.hostname !== "opendata.aemet.es") return json(502, { error: "AEMET devolvió una dirección inesperada" }); // Seguridad: solo se sigue si es de AEMET
    const r2 = await fetchWithTimeout(datosUrl); // Paso 2: descarga los datos
    if (!r2.ok) return json(502, { error: "AEMET respondió HTTP " + r2.status + " al descargar los datos" }); // Error en el paso 2
    const data = JSON.parse(decodeAemet(await r2.arrayBuffer())); // Decodifica y convierte en objeto
    return json(200, data, 3600); // Devuelve los datos; la red de Netlify los reutiliza 1 hora
  } catch (e) { // Si no se pudo contactar con AEMET o la respuesta está rota
    return json(502, { error: e.name === "AbortError" ? "AEMET tardó demasiado en responder" : "no se pudo obtener la predicción de AEMET" }); // Mensaje para la página
  } // Fin del try
}; // Fin de la función

export const config = { path: "/api/aemet" }; // Dirección pública de esta función
