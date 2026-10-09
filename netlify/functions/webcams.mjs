// Función de Netlify: busca en Windy las webcams cercanas a una playa y las devuelve a la página.
// Existe para que la clave de Windy quede guardada en el servidor y los visitantes no necesiten una propia.
// La página la llama así: /api/webcams?lat=28.84&lon=-13.78&radius=10

const WINDY_API = "https://api.windy.com/webcams/api/v3/webcams"; // Dirección de la API de webcams de Windy

const json = (status, body, cacheSeconds = 0) => new Response(JSON.stringify(body), { // Construye una respuesta JSON
  status, // Código HTTP
  headers: { // Cabeceras
    "Content-Type": "application/json; charset=utf-8", // Siempre JSON en UTF-8
    "Cache-Control": "no-store", // El navegador no la guarda: las URLs de imagen caducan a los 10 minutos
    "Netlify-CDN-Cache-Control": cacheSeconds ? "public, s-maxage=" + cacheSeconds : "no-store" // La red de Netlify la reutiliza unos minutos para ahorrar cuota de Windy
  } // Fin de las cabeceras
}); // Fin de la respuesta

export default async (req) => { // Se ejecuta en cada petición a /api/webcams
  const params = new URL(req.url).searchParams; // Parámetros de la URL
  const lat = Number(params.get("lat")); // Latitud de la playa
  const lon = Number(params.get("lon")); // Longitud de la playa
  const radius = Number(params.get("radius")); // Radio de búsqueda en km
  const inCanarias = lat > 27.4 && lat < 29.5 && lon > -18.4 && lon < -13.2; // Comprueba que el punto está en Canarias (evita usar la función para otra cosa)
  if (!inCanarias || ![10, 40].includes(radius)) return json(400, { error: "parámetros no válidos" }); // Solo acepta Canarias y radios de 10 o 40 km
  const key = process.env.WINDY_API_KEY; // Lee la clave guardada en las variables de entorno de Netlify
  if (!key) return json(500, { error: "el servidor no tiene configurada la clave de Windy (variable WINDY_API_KEY)" }); // Aviso claro si falta
  const url = WINDY_API + "?nearby=" + lat.toFixed(4) + "," + lon.toFixed(4) + "," + radius + "&include=images,location,urls,player&limit=6&lang=es"; // Petición a Windy: cámaras cercanas, con imagen, ubicación, enlaces y reproductor
  const ctrl = new AbortController(); // Controlador para cancelar
  const timer = setTimeout(() => ctrl.abort(), 20000); // Cancela a los 20 s
  try { // Intenta hablar con Windy
    const res = await fetch(url, { headers: { "x-windy-api-key": key }, signal: ctrl.signal }); // La clave va en la cabecera x-windy-api-key
    const data = await res.json().catch(() => null); // Lee la respuesta
    if (res.status === 401 || res.status === 403) return json(502, { error: "Windy no acepta la clave configurada en el servidor" }); // Clave incorrecta
    if (!res.ok) return json(502, { error: "Windy respondió HTTP " + res.status }); // Otros errores
    return json(200, { webcams: data?.webcams || [] }, 300); // Devuelve solo la lista de cámaras; se reutiliza 5 minutos
  } catch (e) { // Si no se pudo contactar con Windy
    return json(502, { error: e.name === "AbortError" ? "Windy tardó demasiado en responder" : "no se pudo contactar con Windy" }); // Mensaje para la página
  } finally { // Siempre
    clearTimeout(timer); // Quita el temporizador
  } // Fin del try
}; // Fin de la función

export const config = { path: "/api/webcams" }; // Dirección pública de esta función
