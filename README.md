# LUXURY REWARDS — Sistema Web de Fidelización de Clientes
### LUXURY PRIVATE TRAVEL • Turismo, Transporte Privado y Servicios VIP (Arequipa, Perú)

Sistema web integral de fidelización y recompensas diseñado con los más altos estándares visuales y arquitectónicos para **LUXURY PRIVATE TRAVEL**. Implementa una tarjeta digital con código QR de alta seguridad para la acumulación automática de puntos, canje de recompensas y control multi-rol con libro mayor transaccional (*ledger*).

---

## 💎 Identidad Visual y Paleta Premium

La plataforma refleja la exclusividad de un club privado de viajes:
- **Negro Principal:** `#080808`
- **Negro Secundario:** `#141414` / `#121212`
- **Dorado Principal:** `#D4AF37`
- **Dorado Claro:** `#F2D675`
- **Dorado Oscuro:** `#9D7625`
- **Blanco:** `#FFFFFF`
- **Gris:** `#A1A1AA`

---

## 👥 Cuentas de Demostración (Pre-Cargadas en Base de Datos)

El sistema cuenta con un seeder completo con datos demostrativos en Neon PostgreSQL:

| Rol | Correo Electrónico | Contraseña Predeterminada | Panel de Redirección |
| :--- | :--- | :--- | :--- |
| **👑 Administrador** | `admin@luxurytravel.com` | `Luxury2026*` | `/admin` |
| **👔 Operador** | `operador@luxurytravel.com` | `Luxury2026*` | `/operador` |
| **⭐ Cliente VIP** | `cliente@luxurytravel.com` | `Luxury2026*` | `/mi-cuenta` |

> *En la pantalla de inicio de sesión (`/login`) cuentas con botones de 1-click para autocompletar estas credenciales de demostración.*

---

## 🏗️ Stack Tecnológico

- **Framework:** Next.js 14 (App Router) con TypeScript estricto.
- **Estilos:** Tailwind CSS con variables HSL, temas oscuros y componentes inspirados en shadcn/ui.
- **Base de Datos:** PostgreSQL en la nube alojado en **Neon** (con connection pooling).
- **ORM:** Prisma ORM 5.
- **Autenticación:** Sesiones seguras HTTP-Only con tokens JWT firmados mediante `jose` y contraseñas hasheadas con `bcryptjs`.
- **Control de Acceso (RBAC):** Middleware de Next.js y guardias en el servidor que validan roles (ADMIN, OPERATOR, CUSTOMER) y previenen el acceso cruzado entre clientes.
- **Generación y Escaneo QR:** `qrcode` para generación de alta resolución en tarjeta digital y `html5-qrcode` para lectura desde cámaras de smartphones y tablets.
- **Gráficos:** Recharts para KPIs y tendencias de ingresos.
- **Notificaciones:** Sonner.
- **Exportaciones:** ExcelJS para hojas de cálculo `.xlsx` con cabeceras estilizadas y jsPDF para reportes y tarjetas VIP.

---

## 📦 Módulos del Sistema

### 1. Panel Administrativo (`/admin`)
- **Dashboard Central:** Indicadores en tiempo real (clientes activos, nuevos del mes, consumos, ventas en S/, puntos emitidos y canjeados), gráficos de barras y áreas, segmentación VIP y actividad reciente.
- **Gestión de Clientes (`/admin/clientes`):** CRUD completo, asignación automática de código `LPT-XXXXX`, tarjeta digital y QR de socio, filtros por nivel y exportación a Excel.
- **Tarjetas Digitales (`/admin/tarjetas`):** Bloqueo/activación de tarjetas, regeneración de token QR seguro, previsualización interactiva y descarga en imagen/PDF.
- **Catálogo de Servicios (`/admin/servicios`):** Rutas turísticas (Colca, Ruta del Sillar, Campiña Tour, Santuario de Chapi, Mollendo, Puno), traslados de aeropuerto, transporte corporativo y mensajería con tarifas referenciales y multiplicadores de puntos.
- **Registro de Consumos (`/admin/consumos`):** Formulario transaccional con métodos de pago (Yape, Plin, Transferencia, Tarjeta, Efectivo) y reversión con auditoría.
- **Libro Mayor de Puntos (`/admin/puntos`):** Ledger con trazabilidad inmutable de entradas y salidas de puntos, lotes con vencimiento a 12 meses, y formulario de ajuste administrativo con justificación obligatoria.
- **Recompensas (`/admin/recompensas`):** Catálogo de beneficios, bonos de descuento y cortesías con control de stock y nivel mínimo requerido.
- **Canjes (`/admin/canjes`):** Aprobación y validación rápida de vouchers con código único (`CJ-XXXXXX`).
- **Niveles VIP (`/admin/niveles`):** Configuración de Bronze, Silver, Gold y Platinum (umbrales de consumo, multiplicadores de acumulación y descuentos en carta).
- **Promociones (`/admin/promociones`):** Campañas de doble puntaje, bonos de cumpleaños y temporadas de viaje.
- **Reportes (`/admin/reportes`):** Filtros por rango de fechas y exportación a Excel (.xlsx) y PDF (.pdf).
- **Usuarios (`/admin/usuarios`):** Creación de nuevos operadores y administradores.
- **Auditoría (`/admin/auditoria`):** Registro de escaneos, cambios de saldo, inicios de sesión y operaciones sensibles.
- **Configuración (`/admin/configuracion`):** Nombre comercial, moneda (Soles - PEN), teléfono y correo de atención VIP.

### 2. Panel del Operador (`/operador`)
- Interfaz táctil optimizada para teléfonos y tablets.
- Escáner QR integrado para leer la tarjeta del pasajero con la cámara.
- Búsqueda rápida por DNI, nombres o teléfono.
- Visualización instantánea del nivel VIP y saldo de puntos.
- Botón rápido para registrar servicios con acreditación inmediata de puntos.
- Validador directo de códigos de canje de cupones.

### 3. Portal del Cliente VIP (`/mi-cuenta`)
- Experiencia de autoservicio exclusiva.
- Visualización interactiva de la tarjeta digital con QR dinámico.
- Descarga de la tarjeta en imagen PNG de alta calidad y documento PDF.
- Barra de progreso interactiva hacia el siguiente nivel VIP (ej. de Gold a Platinum).
- Catálogo de recompensas con canje en 1 clic y emisión instantánea del código de voucher.
- Historial completo de viajes realizados y puntos obtenidos.
- Edición de datos de contacto y actualización de contraseña.

---

## 🔒 Mecanismos de Seguridad y Trazabilidad

1. **Tokens QR Criptográficos:** El código QR contiene únicamente un token aleatorio seguro de 64 caracteres hexadecimales. No expone DNI, correo ni información sensible.
2. **Validación en Servidor:** Al escanear el QR, el servidor verifica que la tarjeta esté ACTIVA, que pertenezca a un cliente no bloqueado y que la membresía sea válida.
3. **Idempotencia y Transacciones:** La acumulación de puntos se ejecuta mediante `prisma.$transaction()`, asegurando que no se dupliquen puntos ni se admitan saldos negativos.
4. **Protección de Datos:** Las contraseñas están protegidas con `bcrypt` (10 rondas de salt). Las sesiones utilizan cookies `HttpOnly`, `SameSite=Lax` y cifrado JWT.

---

## 🚀 Puesta en Marcha en Desarrollo Local

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar las variables en `.env` (ya pre-configuradas con Neon PostgreSQL):
   ```env
   DATABASE_URL="postgresql://neondb_owner:password@ep-example-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
   DIRECT_URL="postgresql://neondb_owner:password@ep-example.us-east-1.aws.neon.tech/neondb?sslmode=require"
   AUTH_SECRET="luxury-rewards-super-secret-jwt-key-for-auth-and-tokens-2026"
   NEXTAUTH_URL="http://localhost:3000"
   DEMO_PASSWORD="Luxury2026*"
   NEXT_PUBLIC_TIMEZONE="America/Lima"
   ```

3. Sincronizar y poblar la base de datos (si se desea reiniciar):
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

4. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

5. Abrir el navegador en `http://localhost:3000`.

