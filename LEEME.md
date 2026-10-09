# Playas de Canarias: cómo publicarla en Netlify

## Qué hay en esta carpeta

```
playas-netlify/
├── index.html                    La app (página web)
├── netlify.toml                  Configuración de Netlify
├── LEEME.md                      Esta guía
└── netlify/functions/
    ├── aemet.mjs                 Intermediario con AEMET (guarda la clave en el servidor)
    └── webcams.mjs               Intermediario con Windy (guarda la clave en el servidor)
```

Diferencia con la versión local: ya no hace falta `server.py`, y los visitantes **no tienen que meter ninguna clave**. Las claves de AEMET y Windy son las tuyas y quedan guardadas en Netlify, invisibles para el público.

## Antes de empezar

Necesitas:

- Una cuenta en **GitHub** (github.com).
- Una cuenta en **Netlify** (netlify.com). Puedes crearla con tu cuenta de GitHub.
- Tu **clave de AEMET** y tu **clave de Windy**, las mismas que usas en local.

## Paso 1. Subir la carpeta a GitHub

1. En GitHub, pulsa **New repository**, ponle un nombre (por ejemplo `playas-canarias`) y créalo **vacío**, sin README.
2. Abre una consola **dentro de esta carpeta** y ejecuta:

```
git init
git add .
git commit -m "Playas de Canarias"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/playas-canarias.git
git push -u origin main
```

Cambia `TU-USUARIO` por tu usuario de GitHub.

Si prefieres no usar la consola: en la página del repositorio vacío, pulsa **uploading an existing file** y arrastra el contenido de la carpeta, incluida la subcarpeta `netlify`.

## Paso 2. Crear el sitio en Netlify

1. Entra en Netlify y pulsa **Add new site → Import an existing project**.
2. Elige **GitHub**, autoriza el acceso y selecciona el repositorio `playas-canarias`.
3. En la configuración de compilación deja todo vacío o como venga: `netlify.toml` ya indica lo necesario.
4. Pulsa **Deploy**. En uno o dos minutos tendrás una dirección del tipo `https://nombre-aleatorio.netlify.app`.

Puedes cambiar ese nombre en **Site configuration → Change site name**, por ejemplo a `playas-canarias-liz.netlify.app`.

## Paso 3. Guardar las claves en Netlify

1. En tu sitio de Netlify ve a **Site configuration → Environment variables → Add a variable**.
2. Crea estas dos variables:

| Nombre (exacto)  | Valor                   |
|------------------|-------------------------|
| `AEMET_API_KEY`  | tu clave de AEMET       |
| `WINDY_API_KEY`  | tu clave de Windy       |

3. **Importante:** Netlify solo aplica las variables en el siguiente despliegue. Ve a **Deploys → Trigger deploy → Deploy site**.

## Paso 4. Ajustar la clave de Windy

En api.windy.com/keys, edita tu clave:

- **Domain restrictions:** `netlify.app`
- **Project identification:** la dirección de tu sitio, por ejemplo `https://playas-canarias-liz.netlify.app`

Como las llamadas a Windy ahora salen del servidor de Netlify, la restricción de dominio puede no tener efecto. Si después de ponerla las cámaras dan error de clave, déjala vacía.

## Paso 5. Comprobar que todo funciona

Abre tu dirección `.netlify.app` y revisa:

- **La previsión y las fotos** cargan como en local.
- **El bloque AEMET** de una tarjeta muestra datos. Si dice «el servidor no tiene configurada la clave», revisa el paso 3 y vuelve a desplegar.
- **«En directo»** muestra cámaras.

Si algo falla, en Netlify ve a **Logs → Functions** y elige `aemet` o `webcams`: ahí verás el error concreto.

## Actualizar la app más adelante

Cada vez que cambies algo y hagas `git push`, Netlify la vuelve a publicar automáticamente en un par de minutos.

## Recordatorios

- **Open-Meteo:** su API gratuita es solo para uso no comercial. Si algún día pones anuncios o cobras, necesitarás su plan de pago.
- **Atribuciones:** el pie de página ya cita a AEMET, Open-Meteo, Windy y los autores de Wikimedia. No las quites.
- **Imagen:** la app no debe usar logotipos ni nombres oficiales del Gobierno de Canarias o de su marca turística.
