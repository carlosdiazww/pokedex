# PokeDex en Microsoft Azure — Creación de la cuenta (Azure for Students)

Este documento explica, paso a paso, cómo se creó la cuenta en la nube pública **Microsoft Azure** usando la oferta **Azure for Students** y cómo se dejó preparado el recurso donde se publica la aplicación PokeDex de Pueblo Paleta Inc.

> El procedimiento de despliegue de la aplicación está en [Despliegue.md](Despliegue.md).

**URL pública de la aplicación:** `https://<TU-URL>.azurestaticapps.net`

---

## Tabla de contenido

1. [¿Por qué Azure for Students?](#1-por-qué-azure-for-students)
2. [Requisitos previos](#2-requisitos-previos)
3. [Activación de la cuenta Azure for Students](#3-activación-de-la-cuenta-azure-for-students)
4. [Reconocimiento del portal de Azure](#4-reconocimiento-del-portal-de-azure)
5. [Creación del grupo de recursos](#5-creación-del-grupo-de-recursos)
6. [Creación del recurso Static Web App](#6-creación-del-recurso-static-web-app)
7. [Obtención del token de implementación](#7-obtención-del-token-de-implementación)
8. [Control de costos](#8-control-de-costos)
9. [Problemas frecuentes](#9-problemas-frecuentes)
10. [Referencias](#10-referencias)

---

## 1. ¿Por qué Azure for Students?

| Criterio | Detalle |
|---|---|
| Costo | Crédito gratuito de 100 USD por 12 meses, renovable mientras se mantenga la condición de estudiante. |
| Tarjeta de crédito | No se solicita; la verificación se hace con el correo institucional. |
| Servicio elegido | **Azure Static Web Apps (plan Free)**: no consume el crédito, incluye HTTPS automático, CDN global y permite definir encabezados HTTP propios. |
| Integración | Despliegue continuo desde GitHub Actions. |

La PokeDex es una aplicación Angular que, una vez compilada, son solo archivos estáticos (HTML, JS, CSS e imágenes) que consultan la API pública de PokéAPI desde el navegador. Por eso no se necesita una máquina virtual ni un App Service: Static Web Apps es la opción más sencilla, económica y segura.

## 2. Requisitos previos

- Correo institucional activo (por ejemplo `nombre@universidad.edu.co`).
- Un teléfono celular para recibir el código de verificación por SMS.
- Cuenta de GitHub.
- Navegador web actualizado.

## 3. Activación de la cuenta Azure for Students

1. Ingresar a **https://azure.microsoft.com/es-es/free/students/** y pulsar **"Empezar gratis"** (o "Activar ahora").
2. Iniciar sesión con el **correo institucional**.
   - Si la universidad usa Microsoft 365, el correo ya es una cuenta educativa y basta con escribir la contraseña institucional.
   - Si no lo es, elegir **"Crear una"** para registrar una cuenta Microsoft con ese correo.
3. **Verificación académica**: seleccionar el país (**Colombia**), confirmar el correo institucional y pulsar **"Comprobar el estado académico"**. Si se pide, abrir el enlace de verificación que llega al correo.
4. **Datos del perfil**: completar nombres, apellidos, correo de contacto y número celular. Ingresar el código recibido por SMS.
5. Aceptar el **contrato de suscripción**, la **declaración de privacidad** y los términos de la oferta, y pulsar **"Registrarse"**.
6. Azure redirige al portal (**Education Hub**), donde aparece la suscripción **"Azure for Students"** con el crédito disponible y su fecha de vencimiento.

> 📸 *Captura sugerida: `docs/img/01-education-hub.png` mostrando la suscripción activa.*

## 4. Reconocimiento del portal de Azure

Desde **https://portal.azure.com** se revisaron los elementos básicos:

- **Suscripciones**: buscar "Suscripciones" en la barra superior y confirmar que aparece *Azure for Students* con estado **Activo**.
- **Education Hub**: muestra el crédito restante.
- **Cost Management**: permite consultar el gasto acumulado.
- **Cloud Shell** (icono `>_`): terminal con Azure CLI, útil para verificar el recurso con comandos.

## 5. Creación del grupo de recursos

Un grupo de recursos es un contenedor lógico; agrupar todo aquí permite borrar el proyecto completo de una sola vez.

1. En el buscador del portal escribir **"Grupos de recursos"** y pulsar **"+ Crear"**.
2. Completar:
   - **Suscripción:** Azure for Students
   - **Grupo de recursos:** `rg-pokedex`
   - **Región:** East US 2
3. **Revisar y crear** → **Crear**.

Equivalente en Azure CLI (Cloud Shell):

```bash
az group create --name rg-pokedex --location eastus2
```

## 6. Creación del recurso Static Web App

1. En el buscador escribir **"Static Web Apps"** y pulsar **"+ Crear"**.
2. Pestaña **Datos básicos**:

| Campo | Valor |
|---|---|
| Suscripción | Azure for Students |
| Grupo de recursos | `rg-pokedex` |
| Nombre | `pokedex` |
| Tipo de plan | **Gratis (Free)** |
| Región de la API y entornos de ensayo | East US 2 |
| Origen de implementación | **Otro (Other)** |

   > Se eligió **"Otro"** en lugar de "GitHub" porque el flujo de despliegue ya está escrito en el repositorio (`.github/workflows/azure-static-web-apps.yml`) e incluye pasos propios de compilación y seguridad. Así Azure no genera ni sube un workflow automático que habría que modificar después.

3. Pulsar **Revisar y crear** → **Crear**. La creación tarda menos de un minuto.
4. Pulsar **"Ir al recurso"**. En la página **Información general** aparece la **URL** asignada (formato `https://<nombre-aleatorio>.azurestaticapps.net`). Mientras no se publique nada, muestra una página de bienvenida de Azure.

> 📸 *Captura sugerida: `docs/img/02-static-web-app-creada.png` con la URL visible.*

Equivalente en Azure CLI:

```bash
az staticwebapp create --name pokedex --resource-group rg-pokedex --location eastus2 --sku Free
```

## 7. Obtención del token de implementación

El token permite que GitHub Actions publique archivos en la Static Web App sin usar el usuario y contraseña de Azure.

1. En el recurso, pulsar **"Administrar token de implementación"** (*Manage deployment token*) en la barra superior de **Información general**.
2. Copiar el token.
3. En GitHub, abrir el repositorio `pokedex` → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
4. Nombre: `AZURE_STATIC_WEB_APPS_API_TOKEN` · Valor: el token copiado → **Add secret**.

Equivalente en Azure CLI:

```bash
az staticwebapp secrets list --name pokedex --resource-group rg-pokedex --query "properties.apiKey" -o tsv
```

> ⚠️ El token es una credencial: nunca se debe escribir en el código ni en archivos del repositorio. Si se filtra, se puede regenerar desde la misma opción del portal.

## 8. Control de costos

- El plan **Free** de Static Web Apps no tiene costo y no descuenta del crédito.
- Límites relevantes del plan Free: 100 GB de ancho de banda al mes y 250 MB por aplicación, de sobra para la PokeDex.
- Se recomienda crear una alerta en **Cost Management → Presupuestos** (por ejemplo 5 USD) como prevención.
- Al terminar el curso, borrar todo con:

```bash
az group delete --name rg-pokedex --yes
```

## 9. Problemas frecuentes

| Problema | Solución |
|---|---|
| "No pudimos verificar tu estado académico" | Usar exactamente el correo institucional; si persiste, elegir la verificación con documento o solicitar ayuda a la universidad. |
| No aparece la suscripción tras registrarse | Esperar unos minutos y recargar el portal, o cerrar sesión y volver a entrar. |
| La región elegida no está disponible | Static Web Apps solo se ofrece en algunas regiones: usar East US 2, Central US, West US 2, West Europe o East Asia. |
| La cuenta pide tarjeta de crédito | Se está en la oferta de cuenta gratuita general y no en Azure for Students; volver al enlace de la sección 3. |

## 10. Referencias

- Azure for Students: https://azure.microsoft.com/es-es/free/students/
- Documentación de Azure Static Web Apps: https://learn.microsoft.com/es-es/azure/static-web-apps/
- Planes de Static Web Apps: https://learn.microsoft.com/es-es/azure/static-web-apps/plans
- Código fuente original de la PokeDex: https://github.com/rcuello/ac4dem1a/tree/master/sistemas-distribuidos/poke-dex-lab
