export const es = {
  // Nav
  "nav.home": "Inicio",
  "nav.accounts": "Mis cuentas",
  "nav.settings": "Configuracion",
  "nav.help": "Ayuda",
  "nav.logout": "Cerrar sesion",

  // Dashboard
  "dashboard.hello": "Hola!",
  "dashboard.summary": "Aqui tienes un resumen de tus publicaciones",
  "dashboard.getStarted": "Empecemos",
  "dashboard.getStartedDesc": "Sigue estos pasos para programar tus primeras publicaciones",
  "dashboard.upcoming": "Proximas",
  "dashboard.publishedToday": "Publicados hoy",
  "dashboard.withErrors": "Con errores",
  "dashboard.uploadContent": "Subir contenido",
  "dashboard.uploadZip": "Sube un ZIP con tus posts del mes",
  "dashboard.upcomingPosts": "Proximas publicaciones",
  "dashboard.emptyTitle": "Tu calendario esta vacio",
  "dashboard.emptyDesc": "Sube el contenido del mes y Aluminum Studio se encarga de publicar por ti",

  // Businesses
  "businesses.title": "Mis cuentas",
  "businesses.subtitle": "Las cuentas de Instagram que gestionas",
  "businesses.add": "Anadir cuenta",
  "businesses.emptyTitle": "Tu lista de cuentas esta vacia",
  "businesses.emptyDesc": "Conecta tu primera cuenta de Instagram y empieza a programar publicaciones",
  "businesses.posts": "posts",
  "businesses.notConnected": "Sin conectar — toca para conectar",

  // New business
  "newBusiness.title": "Nueva cuenta",
  "newBusiness.subtitle": "Anade una nueva cuenta de Instagram",
  "newBusiness.name": "Nombre",
  "newBusiness.slug": "Slug",
  "newBusiness.timezone": "Zona horaria",
  "newBusiness.description": "Descripcion",
  "newBusiness.create": "Crear cuenta",
  "newBusiness.cancel": "Cancelar",

  // Business detail
  "business.connected": "Instagram conectado",
  "business.notConnected": "Instagram no conectado",
  "business.notConnectedDesc": "Conecta tu cuenta para empezar a publicar automaticamente",
  "business.reconnect": "Reconectar",
  "business.connect": "Conectar",
  "business.scheduled": "Programados",
  "business.published": "Publicados",
  "business.errors": "Con errores",
  "business.upload": "Subir contenido",
  "business.uploadZip": "Sube el ZIP del mes",
  "business.viewPosts": "Ver publicaciones",
  "business.managePosts": "Gestiona tus posts",
  "business.recentUploads": "Contenido subido recientemente",
  "business.viewAll": "Ver todo",

  // Batches
  "batches.title": "Subidas",
  "batches.uploadZip": "Subir ZIP",
  "batches.emptyTitle": "Aun no has subido contenido",
  "batches.emptyDesc": "Sube un archivo ZIP con tus posts organizados por carpetas",
  "batches.validPosts": "validos",
  "batches.errors": "errores",

  // Batch detail
  "batch.analyzing": "Analizando tu contenido...",
  "batch.analyzingDesc": "Esto puede tardar unos segundos. La pagina se actualizara automaticamente.",
  "batch.postsFound": "Posts encontrados",
  "batch.readyToPublish": "Listos para publicar",
  "batch.withProblems": "Con problemas",
  "batch.activateTitle": "Todo listo? Activa las publicaciones",
  "batch.activate": "Activar",
  "batch.problems": "problema",
  "batch.problems_plural": "problemas",
  "batch.fixAndReupload": "Corrige estos problemas en tu carpeta y vuelve a subir el ZIP",
  "batch.warnings": "aviso",
  "batch.warnings_plural": "avisos",
  "batch.warningsNote": "(no son errores)",
  "batch.yourPosts": "Tus posts",

  // Posts
  "posts.title": "Posts",
  "posts.all": "Todos",

  // Post detail
  "post.notFound": "Post no encontrado.",
  "post.retry": "Reintentar",
  "post.cancel": "Cancelar",
  "post.publishedOnIG": "Publicado en Instagram",
  "post.viewPost": "Ver post",
  "post.details": "Detalles del post",
  "post.scheduledFor": "Programado para",
  "post.type": "Tipo",
  "post.media": "Media",
  "post.files": "archivos",
  "post.file": "archivo",
  "post.attempts": "Intentos",
  "post.publishedAt": "Publicado",
  "post.caption": "Caption",
  "post.mediaFiles": "Archivos multimedia",
  "post.publishHistory": "Historial de publicacion",
  "post.attempt": "Intento",

  // Connect
  "connect.title": "Conecta tu Instagram",
  "connect.step": "Paso",
  "connect.of": "de",
  "connect.professionalAccount": "Tienes cuenta profesional en Instagram?",
  "connect.professionalDesc": "Instagram tiene dos tipos de cuenta. Para usar Aluminum Studio necesitas una profesional (empresa o creador).",
  "connect.personal": "Personal",
  "connect.notCompatible": "No compatible",
  "connect.professional": "Profesional",
  "connect.businessOrCreator": "Empresa o Creador",
  "connect.hasProfessional": "Si, tengo cuenta profesional",
  "connect.facebookPage": "Tienes pagina de Facebook vinculada?",
  "connect.facebookDesc": "Instagram profesional necesita estar conectado a una pagina de Facebook para publicar automaticamente.",
  "connect.authorize": "Autoriza a Aluminum Studio",
  "connect.authorizeDesc": "Haz clic en el boton de abajo. Se abrira una ventana de Facebook/Instagram donde debes aceptar los permisos.",
  "connect.connectIG": "Conectar mi Instagram",
  "connect.back": "Volver",

  // Login
  "login.welcome": "Bienvenido",
  "login.subtitle": "Inicia sesion para continuar",
  "login.email": "Email",
  "login.password": "Password",
  "login.submit": "Iniciar sesion",

  // Logs
  "logs.title": "Registro de actividad",
  "logs.entries": "registros",
  "logs.all": "Todos",
  "logs.noResults": "No se encontraron registros.",
  "logs.time": "Hora",
  "logs.action": "Accion",
  "logs.business": "Cuenta",
  "logs.entity": "Entidad",

  // 404
  "notFound.title": "Pagina no encontrada",
  "notFound.desc": "La pagina que buscas no existe o ha sido movida.",
  "notFound.goHome": "Ir al Dashboard",

  // Common
  "common.loading": "Cargando...",
  "common.networkError": "Error de red. Comprueba tu conexion.",
  "common.poweredBy": "Powered by Aluminum Studio",
} as const;

export type TranslationKey = keyof typeof es;
