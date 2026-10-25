Proceso de Despliegue - Pokédex

Este documento detalla el procedimiento técnico realizado para publicar y desplegar la aplicación web en la infraestructura de Azure Static Web Apps.

## Pasos para el Despliegue Continuo (CI/CD)

1. *Estructura del Repositorio:*
   - El código fuente principal se organizó dentro de la carpeta src/.
   - Se utilizó el archivo index.html con la interfaz retro y la lista de Pokémon integrada.

2. *Automatización con GitHub Actions:*
   - Mediante la integración con Azure Static Web Apps, cada cambio realizado en la rama main activa de forma automática un flujo de trabajo que compila y publica el sitio web instantáneamente.

3. *Verificación del Despliegue:*
   - Se validó el funcionamiento correcto del sitio accediendo directamente a la URL pública proporcionada por Azure (*.azurestaticapps.net).
