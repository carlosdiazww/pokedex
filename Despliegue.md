# Despliegue de la PokeDex en Azure Static Web Apps

Este documento explica cómo se publicó la aplicación PokeDex en **Azure Static Web Apps** y cómo se configuraron los **encabezados HTTP de seguridad** exigidos por Pueblo Paleta Inc.

> La creación de la cuenta y del recurso en Azure está en [README.md](README.md).

**URL pública:** `https://<TU-URL>.azurestaticapps.net`
**Resultado en securityheaders.com:** A+

---

## Tabla de contenido

1. [Arquitectura del despliegue](#1-arquitectura-del-despliegue)
2. [Requisitos](#2-requisitos)
3. [Preparar el repositorio](#3-preparar-el-repositorio)
4. [Archivos agregados al proyecto](#4-archivos-agregados-al-proyecto)
5. [Flujo de GitHub Actions](#5-flujo-de-github-actions)
6. [Publicar la aplicación](#6-publicar-la-aplicación)
7. [Verificar el funcionamiento](#7-verificar-el-funcionamiento)
8. [Encabezados de seguridad](#8-encabezados-de-seguridad)
9. [Escaneos de seguridad](#9-escaneos-de-seguridad)
10. [Actualizar la aplicación](#10-actualizar-la-aplicación)
11. [Problemas encontrados y soluciones](#11-problemas-encontrados-y-soluciones)
12. [Resumen de comandos](#12-resumen-de-comandos)

---

## 1. Arquitectura del despliegue

```
 Desarrollador ──git push──▶ GitHub (repo pokedex, rama main)
                                   │
                                   ▼
                        GitHub Actions (Ubuntu + Node 20)
                        npm ci → ng build → preparar-index.js
                                   │  token AZURE_STATIC_WEB_APPS_API_TOKEN
                                   ▼
                     Azure Static Web Apps (plan Free, CDN + HTTPS)
                     staticwebapp.config.json → encabezados + rutas SPA
                                   │
                                   ▼
          Navegador del usuario ──consultas GraphQL──▶ beta.pokeapi.co
```

La aplicación es una SPA (Single Page Application) hecha en **Angular 14**. Al compilarse produce solo archivos estáticos, y los datos de los Pokémon se consultan desde el navegador a la API pública de PokéAPI. Por eso basta un hosting estático.

## 2. Requisitos

| Herramienta | Uso |
|---|---|
| Git | Versionar y subir el código. |
| Node.js 20 LTS + npm | Compilar y probar en local (opcional; en la nube lo hace GitHub Actions). |
| Cuenta de GitHub | Repositorio `pokedex` y ejecución de GitHub Actions. |
| Suscripción Azure for Students | Recurso Static Web App ya creado (ver README.md). |

## 3. Preparar el repositorio

### 3.1 Descargar el código fuente original

```bash
git clone --depth 1 --filter=blob:none --sparse https://github.com/rcuello/ac4dem1a.git
cd ac4dem1a
git sparse-checkout set sistemas-distribuidos/poke-dex-lab
```

El proyecto Angular queda en `sistemas-distribuidos/poke-dex-lab/source/pokedex-angular`.

### 3.2 Crear el repositorio `pokedex` en GitHub

1. En GitHub: **New repository** → nombre `pokedex` → **Public** → sin README (se agrega después) → **Create repository**.
2. Copiar el contenido de `pokedex-angular` a una carpeta nueva y subirlo **en la raíz** del repositorio:

```bash
mkdir pokedex
cp -r ac4dem1a/sistemas-distribuidos/poke-dex-lab/source/pokedex-angular/. pokedex/
cd pokedex
mv README.md README-pokedex-angular.md          # README original del autor
rm .github/workflows/pipelines.yml              # pipeline de pruebas del autor (requiere Codecov)
```

### 3.3 Probar en local (opcional)

```bash
npm ci
npm start            # http://localhost:4200
```

## 4. Archivos agregados al proyecto

El código fuente de Angular **no se modificó**. Solo se agregaron estos archivos:

| Archivo | Propósito |
|---|---|
| `.github/workflows/azure-static-web-apps.yml` | Compila y publica automáticamente en cada `push` a `main`. |
| `staticwebapp.config.json` | Encabezados de seguridad y redirección de rutas de la SPA. |
| `preparar-index.js` | Limpia el `index.html` compilado para que cumpla la CSP. |
| `README.md` / `Despliegue.md` | Documentación (escrita con StackEdit). |

## 5. Flujo de GitHub Actions

Archivo `.github/workflows/azure-static-web-apps.yml`:

```yaml
name: Despliegue PokeDex en Azure Static Web Apps

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build_and_deploy_job:
    runs-on: ubuntu-latest
    env:
      HUSKY: 0
    steps:
      - name: Descargar el código
        uses: actions/checkout@v4

      - name: Configurar Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Instalar dependencias
        run: npm ci

      - name: Compilar Angular (producción)
        run: npm run build

      - name: Ajustar index.html para la CSP
        run: node preparar-index.js

      - name: Copiar imágenes a la ruta /pokedex-angular/assets que usa environment.prod.ts
        run: |
          mkdir -p dist/pokedex-angular/pokedex-angular
          cp -r dist/pokedex-angular/assets dist/pokedex-angular/pokedex-angular/

      - name: Copiar configuración de Static Web Apps
        run: cp staticwebapp.config.json dist/pokedex-angular/

      - name: Publicar en Azure
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: upload
          app_location: dist/pokedex-angular
          api_location: ""
          output_location: ""
          skip_app_build: true
          skip_api_build: true
```

Explicación de los pasos:

| Paso | Qué hace y por qué |
|---|---|
| `HUSKY: 0` | El proyecto trae Husky (hooks de Git) en el script `prepare`; en el servidor no se necesita y se desactiva. |
| `npm ci` | Instala exactamente las versiones de `package-lock.json`, garantizando un build reproducible. |
| `npm run build` | Ejecuta `ng build` en modo producción; el resultado queda en `dist/pokedex-angular`. |
| `node preparar-index.js` | Quita el JavaScript inline del `index.html` (ver sección 8.3). |
| Copia de `assets` | `environment.prod.ts` busca los sprites en `/pokedex-angular/assets/images` (ruta pensada para GitHub Pages). Se copian también allí para que las imágenes carguen sin tocar el código fuente. |
| Copia de `staticwebapp.config.json` | Azure lee este archivo desde la carpeta que se publica. |
| `skip_app_build: true` | Se le indica a Azure que no compile de nuevo, porque el build ya se hizo y se le aplicaron ajustes. |

## 6. Publicar la aplicación

1. Confirmar que el secreto `AZURE_STATIC_WEB_APPS_API_TOKEN` existe en **Settings → Secrets and variables → Actions** (ver README.md, sección 7).
2. Subir el proyecto:

```bash
git init
git add .
git commit -m "PokeDex: despliegue en Azure Static Web Apps con encabezados de seguridad"
git branch -M main
git remote add origin https://github.com/carlosdiazww/pokedex.git
git push -u origin main
```

3. En GitHub, abrir la pestaña **Actions**: aparece la ejecución **"Despliegue PokeDex en Azure Static Web Apps"**. Tarda entre 2 y 4 minutos y debe terminar con ✅.
4. En el portal de Azure, la Static Web App muestra en **Entornos** la implementación de producción.

> 📸 *Capturas sugeridas: `docs/img/03-github-actions-ok.png` y `docs/img/04-pokedex-funcionando.png`.*

## 7. Verificar el funcionamiento

1. Abrir la URL pública: carga la PokeDex con la lista de Pokémon y sus sprites.
2. Cambiar la versión de Pokédex (Green, Red & Blue, Yellow, Gold…), buscar por nombre, filtrar por tipo y ordenar.
3. Entrar al detalle de un Pokémon (por ejemplo `/pokemon/25`) y **recargar con F5**: la página debe seguir funcionando gracias a `navigationFallback`.
4. Abrir las herramientas de desarrollador (**F12 → Consola**): no debe haber mensajes `Refused to load…` ni `Refused to execute…` de la CSP.
5. Revisar los encabezados desde una terminal:

```bash
curl -I https://<TU-URL>.azurestaticapps.net
```

## 8. Encabezados de seguridad

### 8.1 Archivo `staticwebapp.config.json`

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": [
      "/assets/*",
      "/pokedex-angular/*",
      "/*.{js,css,ico,png,jpg,gif,ttf,otf,woff,woff2,eot,txt,map}"
    ]
  },
  "globalHeaders": {
    "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://beta.pokeapi.co https://pokeapi.co; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "X-Permitted-Cross-Domain-Policies": "none"
  }
}
```

- `navigationFallback`: cualquier ruta que no sea un archivo (por ejemplo `/about` o `/pokemon/25`) devuelve `index.html` y Angular decide qué mostrar. Las exclusiones evitan que una imagen inexistente devuelva HTML.
- `globalHeaders`: se agregan a **todas** las respuestas.

### 8.2 Qué protege cada encabezado

| Encabezado | Valor | Protección |
|---|---|---|
| **Content-Security-Policy** | Ver detalle abajo | Mitiga XSS e inyección de recursos: el navegador solo carga lo que esté en la lista blanca. |
| **Strict-Transport-Security** | 2 años, subdominios, preload | Obliga a usar HTTPS; evita ataques de degradación a HTTP y robo de sesión. |
| **X-Frame-Options** | `DENY` | Impide que la app se incruste en un `<iframe>` (clickjacking). |
| **X-Content-Type-Options** | `nosniff` | El navegador no "adivina" el tipo de archivo; evita ejecutar como script algo que no lo es. |
| **Referrer-Policy** | `strict-origin-when-cross-origin` | A otros sitios solo se les envía el dominio, nunca la ruta completa. |
| **Permissions-Policy** | Todo deshabilitado | Bloquea cámara, micrófono, geolocalización, pagos, USB, etc., que la app no usa. |
| Cross-Origin-Opener-Policy | `same-origin` | Aísla la ventana de otras pestañas (protege contra ataques tipo Spectre/XS-Leaks). |
| Cross-Origin-Resource-Policy | `same-origin` | Otros sitios no pueden incrustar los recursos de la app. |
| X-Permitted-Cross-Domain-Policies | `none` | Bloquea políticas de Flash/PDF entre dominios. |

**Directivas de la CSP**, definidas a partir de lo que la aplicación realmente usa:

| Directiva | Valor | Motivo |
|---|---|---|
| `default-src` | `'self'` | Por defecto solo se confía en el propio dominio. |
| `script-src` | `'self'` | Solo los `.js` compilados; **ningún script inline**. |
| `style-src` | `'self' 'unsafe-inline' fonts.googleapis.com` | Angular 14 inserta los estilos de cada componente en etiquetas `<style>`; Roboto viene de Google Fonts. |
| `font-src` | `'self' fonts.gstatic.com` | Fuente `pokemon-gb` local y archivos de Roboto. |
| `img-src` | `'self' data:` | Todos los sprites están en `/assets`. |
| `connect-src` | `'self' beta.pokeapi.co pokeapi.co` | Consultas GraphQL y REST a PokéAPI. |
| `object-src` | `'none'` | Sin plugins (Flash, Java). |
| `base-uri` / `form-action` | `'self'` | Evita secuestro de `<base>` y envío de formularios a otros sitios. |
| `frame-ancestors` | `'none'` | Equivalente moderno de `X-Frame-Options: DENY`. |
| `upgrade-insecure-requests` | — | Convierte cualquier petición `http://` en `https://`. |

### 8.3 Ajuste del `index.html` compilado (`preparar-index.js`)

Con `script-src 'self'` el navegador bloquea todo JavaScript inline. El `index.html` generado tenía dos casos que romperían la aplicación:

1. Un `<script>` inline llamado *"Single Page Apps for GitHub Pages"* que solo sirve en GitHub Pages. En Azure las rutas las resuelve `navigationFallback`, así que se elimina.
2. El atributo `onload="this.media='all'"` que Angular agrega a la hoja de estilos al optimizar el CSS crítico. Si la CSP lo bloquea, los estilos quedan con `media="print"` y la página se ve sin diseño.

`preparar-index.js` elimina ambos sobre el archivo de `dist/` (el código fuente queda igual) y, como control de calidad, **hace fallar el pipeline** si todavía queda algún script o evento inline, para no publicar una versión rota.

## 9. Escaneos de seguridad

### 9.1 securityheaders.com

1. Entrar a **https://securityheaders.com**.
2. Pegar la URL pública, marcar **Hide results** si se desea y pulsar **Scan**.
3. Resultado obtenido: **A+**. Los seis encabezados evaluados (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy y Permissions-Policy) aparecen en verde.
4. La única advertencia es informativa: `unsafe-inline` en `style-src`, necesaria por cómo Angular 14 inserta los estilos de los componentes. Solo afecta estilos (no scripts) y no baja la calificación.

> 📸 *Captura: `docs/img/05-securityheaders-A-plus.png`.*

### 9.2 SSL Labs (revisión avanzada, opcional)

1. Entrar a **https://www.ssllabs.com/ssltest/**, pegar el dominio (sin `https://`) y pulsar **Submit**.
2. Azure administra el certificado TLS automáticamente; el resultado esperado es **A/A+** (TLS 1.2/1.3, sin protocolos obsoletos y HSTS activo).

> 📸 *Captura: `docs/img/06-ssllabs.png`.*

### 9.3 OWASP ZAP (revisión avanzada, opcional)

1. Instalar ZAP desde **https://www.zaproxy.org/download/**.
2. **Automated Scan** → pegar la URL pública → **Attack** (escaneo pasivo + spider tradicional).
3. Revisar la pestaña **Alerts**. Hallazgos esperables y su interpretación:
   - *CSP: style-src unsafe-inline* → riesgo bajo, explicado en la sección 9.1.
   - *Cross-Domain JavaScript Source / Timestamp Disclosure* → informativos, sin impacto real.
4. Exportar el reporte desde **Report → Generate Report** y agregarlo a `docs/`.

## 10. Actualizar la aplicación

Cualquier cambio que se suba a `main` se publica solo:

```bash
git add .
git commit -m "Descripción del cambio"
git push
```

También se puede relanzar manualmente desde **Actions → Despliegue PokeDex… → Run workflow**.

## 11. Problemas encontrados y soluciones

| Problema | Causa | Solución |
|---|---|---|
| La página carga sin estilos | La CSP bloquea el `onload` inline de la hoja de estilos. | `preparar-index.js` elimina `media="print" onload=…`. |
| Error 404 al recargar `/pokemon/25` | El servidor busca un archivo que no existe. | `navigationFallback` en `staticwebapp.config.json`. |
| Sprites de los Pokémon no cargan | `environment.prod.ts` usa la ruta `/pokedex-angular/assets/images`. | El workflow copia `assets` también a esa ruta. |
| El pipeline falla en `npm ci` por Husky | El script `prepare` ejecuta `husky install`. | Variable de entorno `HUSKY: 0`. |
| `deployment_token was not provided` | Falta el secreto en GitHub o tiene otro nombre. | Crear `AZURE_STATIC_WEB_APPS_API_TOKEN` (README, sección 7). |
| Error de validación de `staticwebapp.config.json` | JSON mal formado o claves inválidas. | Validar el JSON; por ejemplo, en `mimeTypes` las extensiones deben empezar por punto (`".otf"`). |
| `Unterminated string token` al compilar en local | Caché de compilación de Angular dañada. | Borrar la carpeta `.angular/cache` y compilar de nuevo. |

## 12. Resumen de comandos

```bash
# Obtener el código fuente
git clone --depth 1 --filter=blob:none --sparse https://github.com/rcuello/ac4dem1a.git
cd ac4dem1a && git sparse-checkout set sistemas-distribuidos/poke-dex-lab

# Prueba local
npm ci
npm start

# Simular el build de producción como lo hace GitHub Actions
npm run build
node preparar-index.js

# Publicar
git add . && git commit -m "mensaje" && git push

# Verificar encabezados
curl -I https://<TU-URL>.azurestaticapps.net

# (Azure CLI) Ver la URL del recurso
az staticwebapp show --name pokedex --resource-group rg-pokedex --query defaultHostname -o tsv
```
