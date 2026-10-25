 Proyecto Pokédex - Pueblo Paleta Inc.

Aplicación web desarrollada como caso de estudio para explorar especies de Pokémon y sus características mediante el uso de la PokéAPI.

## Tutorial Paso a Paso: Creación de Cuenta en Azure (Cloud Pública)

Para cumplir con el despliegue del proyecto en la nube utilizando Azure Static Web Apps, se siguieron los siguientes pasos:

1. *Registro en la plataforma:* 
   - Se ingresó al portal oficial de [Microsoft Azure](https://portal.azure.com/).
   - Se inició sesión utilizando la cuenta institucional (Azure for Students), la cual otorga créditos gratuitos para el uso de servicios en la nube sin costo monetario.
2. *Creación del recurso:*
   - En el buscador del portal de Azure, se buscó y seleccionó *"Static Web Apps"*.
   - Se hizo clic en el botón *"Create"*.
3. *Configuración inicial:*
   - Se seleccionó la suscripción activa (Azure for Students).
   - Se asignó un nombre al recurso (ej. pokedex).
   - Se eligió el plan de alojamiento gratuito (*Free*), diseñado para aplicaciones estáticas personales y de pruebas.
4. *Vinculación con GitHub:*
   - Se otorgaron los permisos necesarios para conectar Azure con la cuenta de GitHub (carlosdiazww).
   - Se seleccionó el repositorio pokedex y la rama de trabajo (main).
   - Se configuró el flujo de compilación indicando que la aplicación utiliza HTML/CSS/JS estático.
