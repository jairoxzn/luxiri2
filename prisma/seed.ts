import { PrismaClient, Role, DocType, CustomerStatus, CardStatus, ServiceCategory, PaymentMethod, PaymentStatus, BookingStatus, PointTransactionType, LotStatus, RedemptionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting LUXURY REWARDS database seed...");

  const demoPassword = process.env.DEMO_PASSWORD || "Luxury2026*";
  const hashedPassword = await bcrypt.hash(demoPassword, 10);

  // 1. Clean existing records in correct order
  console.log("Cleaning old records...");
  await prisma.auditLog.deleteMany();
  await prisma.pointTransaction.deleteMany();
  await prisma.pointLot.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.redemption.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.loyaltyCard.deleteMany();
  await prisma.customerTierHistory.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.service.deleteMany();
  await prisma.loyaltyTier.deleteMany();
  await prisma.loyaltyRule.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.user.deleteMany();

  // 2. Loyalty Rules
  console.log("Creating default Loyalty Rule...");
  await prisma.loyaltyRule.create({
    data: {
      key: "DEFAULT",
      name: "Regla Estándar Luxury Rewards",
      spendPerPoint: 10.00, // S/ 10.00 = 1 pt
      minSpend: 10.00,
      roundingMethod: "FLOOR",
      pointsExpiryMonths: 12,
      isActive: true,
    },
  });

  // 3. System Settings
  console.log("Creating System Settings...");
  await prisma.systemSetting.createMany({
    data: [
      { key: "COMPANY_NAME", value: "LUXURY PRIVATE TRAVEL", description: "Nombre comercial de la empresa" },
      { key: "CURRENCY_SYMBOL", value: "S/", description: "Símbolo de moneda" },
      { key: "CURRENCY_CODE", value: "PEN", description: "Código ISO de moneda" },
      { key: "SUPPORT_PHONE", value: "+51 958 123 456", description: "Teléfono de atención VIP" },
      { key: "SUPPORT_EMAIL", value: "reservas@luxuryprivatetravel.pe", description: "Email de contacto" },
      { key: "TIMEZONE", value: "America/Lima", description: "Zona horaria del sistema" },
    ],
  });

  // 4. Loyalty Tiers
  console.log("Creating VIP Tiers...");
  const bronzeTier = await prisma.loyaltyTier.create({
    data: {
      name: "BRONZE",
      slug: "bronze",
      minSpend: 0,
      minPoints: 0,
      pointsMultiplier: 1.0,
      discountPercent: 0.0,
      color: "#CD7F32",
      badgeIcon: "Shield",
      description: "Nivel de bienvenida para nuevos clientes exclusivos.",
      perks: JSON.stringify([
        "Acumulación normal: S/ 10 = 1 punto",
        "Tarjeta digital QR exclusiva",
        "Acceso a promociones generales de temporada",
        "Atención telefónica preferencial",
      ]),
      orderIndex: 1,
      isActive: true,
    },
  });

  const silverTier = await prisma.loyaltyTier.create({
    data: {
      name: "SILVER",
      slug: "silver",
      minSpend: 1500,
      minPoints: 150,
      pointsMultiplier: 1.15,
      discountPercent: 5.0,
      color: "#9CA3AF",
      badgeIcon: "Award",
      description: "Para viajeros frecuentes que buscan confort y beneficios especiales.",
      perks: JSON.stringify([
        "+15% de puntos adicionales por cada consumo",
        "5% de descuento en tours seleccionados",
        "Prioridad de asignación vehicular",
        "Atención dedicada por WhatsApp VIP",
      ]),
      orderIndex: 2,
      isActive: true,
    },
  });

  const goldTier = await prisma.loyaltyTier.create({
    data: {
      name: "GOLD",
      slug: "gold",
      minSpend: 4000,
      minPoints: 400,
      pointsMultiplier: 1.30,
      discountPercent: 10.0,
      color: "#D4AF37",
      badgeIcon: "Crown",
      description: "Para clientes distinguidos con acceso a ventajas VIP y promociones especiales.",
      perks: JSON.stringify([
        "+30% de puntos adicionales por consumo",
        "10% de descuento en traslados de aeropuerto y tours",
        "Cancelación flexible sin penalidad hasta 2 horas antes",
        "Bono de 50 puntos en el mes de tu cumpleaños",
        "Vehículo de gama alta garantizado",
      ]),
      orderIndex: 3,
      isActive: true,
    },
  });

  const platinumTier = await prisma.loyaltyTier.create({
    data: {
      name: "PLATINUM",
      slug: "platinum",
      minSpend: 8500,
      minPoints: 850,
      pointsMultiplier: 1.50,
      discountPercent: 15.0,
      color: "#E5E7EB",
      badgeIcon: "Sparkles",
      description: "La cumbre de la exclusividad. Beneficios premium y atención personalizada 24/7.",
      perks: JSON.stringify([
        "+50% de acumulación de puntos en todos los viajes",
        "15% de descuento permanente en toda la carta de servicios",
        "Upgrade gratuito a SUV Premium sujeto a disponibilidad",
        "Línea de concierge privado 24/7",
        "Cortesía de bebidas premium a bordo en viajes interprovinciales",
        "Puntos sin fecha de caducidad mientras mantenga el nivel",
      ]),
      orderIndex: 4,
      isActive: true,
    },
  });

  // 5. System Users
  console.log("Creating System Users...");
  const adminUser = await prisma.user.create({
    data: {
      name: "Carlos Mendoza (Administrador)",
      email: "admin@luxurytravel.com",
      password: hashedPassword,
      phone: "+51 954 112 233",
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const operatorUser = await prisma.user.create({
    data: {
      name: "Valeria Ríos (Operadora)",
      email: "operador@luxurytravel.com",
      password: hashedPassword,
      phone: "+51 958 445 566",
      role: Role.OPERATOR,
      isActive: true,
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      name: "Rodrigo Morales",
      email: "cliente@luxurytravel.com",
      password: hashedPassword,
      phone: "+51 984 778 899",
      role: Role.CUSTOMER,
      isActive: true,
    },
  });

  // 6. Services Catalog (10 Services from luxury private travel)
  console.log("Creating Services Catalog...");
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: "Traslado Privado Aeropuerto Rodríguez Ballón",
        slug: "traslado-aeropuerto",
        category: ServiceCategory.TRANSPORTE,
        description: "Recepción en sala de arribos con letrero, asistencia con equipaje y traslado en vehículo ejecutivo.",
        referencePrice: 80.00,
        pointsMultiplier: 1.0,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        name: "Viaje Privado Arequipa - Colca (Chivay)",
        slug: "arequipa-colca",
        category: ServiceCategory.VIAJES_PRIVADOS,
        description: "Servicio ida y vuelta o solo ida con conductor bilingüe, paradas panorámicas en Pampa Cañahuas y Mirador de los Andes.",
        referencePrice: 480.00,
        pointsMultiplier: 1.2,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        name: "City Tour Clásico y Miradores",
        slug: "city-tour-clasico",
        category: ServiceCategory.TOURS,
        description: "Recorrido por Yanahuara, Carmen Alto, Centro Histórico y Monasterio de Santa Catalina en van privada.",
        referencePrice: 150.00,
        pointsMultiplier: 1.0,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        name: "Tour Ruta del Sillar y Cañón de Culebrillas",
        slug: "ruta-del-sillar",
        category: ServiceCategory.TOURS,
        description: "Visita a las canteras activas de Añashuayco, labrado de sillar y caminata en el cañón virgen.",
        referencePrice: 120.00,
        pointsMultiplier: 1.0,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        name: "Campiña Tour Arequipeña & Mansión del Fundador",
        slug: "campina-tour",
        category: ServiceCategory.TOURS,
        description: "Paucarpata, Molino de Sabandía y Mansión del Fundador en transporte con aire acondicionado y confort.",
        referencePrice: 140.00,
        pointsMultiplier: 1.0,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        name: "Viaje Exclusivo al Santuario de Chapi (Polobaya)",
        slug: "santuario-de-chapi",
        category: ServiceCategory.VIAJES_PRIVADOS,
        description: "Servicio privado por devoción o visita turística con tiempo de espera y retorno.",
        referencePrice: 220.00,
        pointsMultiplier: 1.0,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        name: "Viaje Interprovincial Arequipa - Mollendo / Playas",
        slug: "arequipa-mollendo",
        category: ServiceCategory.VIAJES_PRIVADOS,
        description: "Traslado directo a balnearios de Mollendo, Mejía o La Punta en camioneta 4x4 o van ejecutiva.",
        referencePrice: 320.00,
        pointsMultiplier: 1.0,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        name: "Transporte Corporativo y Ejecutivo por Horas",
        slug: "transporte-corporativo-horas",
        category: ServiceCategory.TRANSPORTE_EMPRESARIAL,
        description: "Disposición de chofer profesional y vehículo de lujo por horas o jornada completa para ejecutivos.",
        referencePrice: 250.00,
        pointsMultiplier: 1.25,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        name: "Mensajería Express y Envío de Documentos Confidenciales",
        slug: "mensajeria-express",
        category: ServiceCategory.MENSAJERIA,
        description: "Entrega urgente puerta a puerta de paquetes y valijas empresariales con custodia y seguimiento.",
        referencePrice: 45.00,
        pointsMultiplier: 1.0,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        name: "Viaje Interprovincial Arequipa - Puno / Lago Titicaca",
        slug: "arequipa-puno",
        category: ServiceCategory.VIAJES_PRIVADOS,
        description: "Viaje escénico hacia el altiplano en camioneta de alta gama con paradas de descanso a gusto del cliente.",
        referencePrice: 550.00,
        pointsMultiplier: 1.2,
        isActive: true,
      },
    }),
  ]);

  // 7. Rewards Catalog (8 Rewards)
  console.log("Creating Rewards Catalog...");
  const rewards = await Promise.all([
    prisma.reward.create({
      data: {
        name: "Bono S/ 30 en Traslado al Aeropuerto",
        slug: "bono-30-aeropuerto",
        category: "Traslados",
        description: "Descuento directo de S/ 30.00 aplicable en tu próximo traslado ejecutivo al Aeropuerto Rodríguez Ballón.",
        pointsRequired: 30,
        stock: 50,
        minTierId: bronzeTier.id,
        terms: "Válido para un solo uso. No acumulable con otras promociones.",
        isActive: true,
      },
    }),
    prisma.reward.create({
      data: {
        name: "Traslado de Aeropuerto 100% Gratis",
        slug: "traslado-aeropuerto-gratis",
        category: "Traslados",
        description: "Servicio completo gratuito de traslado hacia o desde el aeropuerto en auto ejecutivo con agua y wifi a bordo.",
        pointsRequired: 80,
        stock: 30,
        minTierId: silverTier.id,
        terms: "Reserva previa con al menos 12 horas de anticipación.",
        isActive: true,
      },
    }),
    prisma.reward.create({
      data: {
        name: "50% de Descuento en Tour Ruta del Sillar",
        slug: "descuento-50-ruta-sillar",
        category: "Tours",
        description: "Obtén la mitad de precio en la experiencia guiada por las canteras de Añashuayco para dos personas.",
        pointsRequired: 60,
        stock: 25,
        minTierId: bronzeTier.id,
        terms: "Sujeto a disponibilidad de cupos.",
        isActive: true,
      },
    }),
    prisma.reward.create({
      data: {
        name: "Upgrade Gratuito a SUV de Lujo",
        slug: "upgrade-suv-lujo",
        category: "Servicios VIP",
        description: "Viaja en camioneta Toyota Prado o Land Cruiser en tu servicio interprovincial abonando tarifa de sedán.",
        pointsRequired: 120,
        stock: 15,
        minTierId: goldTier.id,
        terms: "Válido en rutas Colca, Puno o Mollendo. Confirmar 24h antes.",
        isActive: true,
      },
    }),
    prisma.reward.create({
      data: {
        name: "Tour Completo Campiña Arequipeña Gratis",
        slug: "tour-campina-gratis",
        category: "Tours",
        description: "Recorrido privado por Sabandía, Paucarpata y Mansión del Fundador para hasta 4 pasajeros.",
        pointsRequired: 140,
        stock: 10,
        minTierId: silverTier.id,
        terms: "Entradas a monumentos no incluidas.",
        isActive: true,
      },
    }),
    prisma.reward.create({
      data: {
        name: "Caja de Bombones La Ibérica & Champagne a Bordo",
        slug: "cortesia-iberica-champagne",
        category: "Cortesías VIP",
        description: "Detalle de bienvenida de alta gama durante tu viaje privado interprovincial o tour privado.",
        pointsRequired: 90,
        stock: 20,
        minTierId: goldTier.id,
        terms: "Solicitar con 24 horas de antelación.",
        isActive: true,
      },
    }),
    prisma.reward.create({
      data: {
        name: "Bono S/ 150 para Viaje al Cañón del Colca",
        slug: "bono-150-colca",
        category: "Viajes Privados",
        description: "Descuento significativo de S/ 150.00 en viaje privado hacia Chivay, Cabanaconde o Cruz del Cóndor.",
        pointsRequired: 150,
        stock: 12,
        minTierId: silverTier.id,
        terms: "Aplicable en servicios ida y vuelta.",
        isActive: true,
      },
    }),
    prisma.reward.create({
      data: {
        name: "Día Completo de Chofer Ejecutivo Privado (8 Horas)",
        slug: "dia-completo-chofer-vip",
        category: "Servicios VIP",
        description: "Exclusivo para miembros Platinum: disponibilidad absoluta de camioneta ejecutiva y chofer por 8 horas en la ciudad.",
        pointsRequired: 350,
        stock: 5,
        minTierId: platinumTier.id,
        terms: "Incluye combustible dentro del radio urbano de Arequipa.",
        isActive: true,
      },
    }),
  ]);

  // 8. Promotions
  console.log("Creating Promotions...");
  await prisma.promotion.createMany({
    data: [
      {
        name: "Doble Puntuación en Rutas Interprovinciales",
        slug: "doble-puntos-rutas-interprovinciales",
        description: "Acumula el doble de puntos (2 puntos por cada S/ 10) en todos los viajes a Colca, Puno y Mollendo los fines de semana.",
        bannerUrl: "/promo-interprovincial.jpg",
        promoType: "DOUBLE_POINTS",
        multiplier: 2.0,
        bonusPoints: 0,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        terms: "Aplica en viajes completados de viernes a domingo.",
        isActive: true,
      },
      {
        name: "Bono de Cumpleaños VIP Luxury",
        slug: "bono-cumpleanos-vip",
        description: "Celebramos contigo: recibe 50 puntos de regalo en tu cuenta durante el mes de tu onomástico para canjear de inmediato.",
        bannerUrl: "/promo-birthday.jpg",
        promoType: "BONUS_POINTS",
        multiplier: 1.0,
        bonusPoints: 50,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        terms: "Válido con DNI verificado en el mes de nacimiento.",
        isActive: true,
      },
      {
        name: "Semana Santa & Temporada Alta Colca",
        slug: "temporada-colca",
        description: "Bonificación especial de 30 puntos adicionales en todas las reservas del Tour Colca Privado.",
        bannerUrl: "/promo-colca.jpg",
        promoType: "BONUS_POINTS",
        multiplier: 1.0,
        bonusPoints: 30,
        startDate: new Date("2026-03-01"),
        endDate: new Date("2026-05-31"),
        terms: "Aplica a todos los niveles de cliente.",
        isActive: true,
      },
    ],
  });

  // 9. Customers (15 realistic Peruvian customers)
  console.log("Creating 15 Fictitious Customers with Digital Cards & QR tokens...");
  const rawCustomersData = [
    {
      firstName: "Rodrigo",
      lastName: "Morales Valdivia",
      docType: DocType.DNI,
      docNumber: "45892341",
      phone: "+51 984 778 899",
      email: "cliente@luxurytravel.com", // linked to customerUser
      userId: customerUser.id,
      address: "Av. Cayma 612, Dpto 401",
      district: "Cayma",
      city: "Arequipa",
      birthDate: new Date("1988-06-15"),
      tierId: goldTier.id,
      totalSpent: 4250.00,
      currentPoints: 215,
      lifetimePoints: 425,
      cardNumber: "LUX-2026-1001",
    },
    {
      firstName: "Fiorella",
      lastName: "Benavente Cáceres",
      docType: DocType.DNI,
      docNumber: "47123984",
      phone: "+51 959 123 456",
      email: "fiorella.benavente@gmail.com",
      address: "Calle Zela 204",
      district: "Cercado",
      city: "Arequipa",
      birthDate: new Date("1992-09-22"),
      tierId: platinumTier.id,
      totalSpent: 9400.00,
      currentPoints: 480,
      lifetimePoints: 940,
      cardNumber: "LUX-2026-1002",
    },
    {
      firstName: "Alejandro",
      lastName: "Vargas Llosa",
      docType: DocType.DNI,
      docNumber: "29654128",
      phone: "+51 958 667 788",
      email: "a.vargas.llosa@empresa.com.pe",
      address: "Urb. León XIII D-14",
      district: "Yanahuara",
      city: "Arequipa",
      birthDate: new Date("1975-03-11"),
      tierId: goldTier.id,
      totalSpent: 5120.00,
      currentPoints: 280,
      lifetimePoints: 512,
      cardNumber: "LUX-2026-1003",
    },
    {
      firstName: "Mariana",
      lastName: "Pacheco Guillén",
      docType: DocType.DNI,
      docNumber: "72194856",
      phone: "+51 954 332 211",
      email: "mariana.pacheco@outlook.com",
      address: "Av. Bolognesi 340",
      district: "Yanahuara",
      city: "Arequipa",
      birthDate: new Date("1996-11-04"),
      tierId: silverTier.id,
      totalSpent: 1850.00,
      currentPoints: 125,
      lifetimePoints: 185,
      cardNumber: "LUX-2026-1004",
    },
    {
      firstName: "Gonzalo",
      lastName: "Fernández-Dávila",
      docType: DocType.DNI,
      docNumber: "41982736",
      phone: "+51 987 554 433",
      email: "gonzalo.fdavila@constructora.pe",
      address: "Residencial Quinta Samay B-8",
      district: "Cerro Colorado",
      city: "Arequipa",
      birthDate: new Date("1982-08-19"),
      tierId: platinumTier.id,
      totalSpent: 11200.00,
      currentPoints: 620,
      lifetimePoints: 1120,
      cardNumber: "LUX-2026-1005",
    },
    {
      firstName: "Lucía",
      lastName: "Del Carpio Bedregal",
      docType: DocType.DNI,
      docNumber: "48291047",
      phone: "+51 952 889 900",
      email: "lucia.delcarpio@estudioabogados.pe",
      address: "Av. Ejército 708, Of. 602",
      district: "Yanahuara",
      city: "Arequipa",
      birthDate: new Date("1990-01-28"),
      tierId: silverTier.id,
      totalSpent: 2450.00,
      currentPoints: 195,
      lifetimePoints: 245,
      cardNumber: "LUX-2026-1006",
    },
    {
      firstName: "Diego",
      lastName: "Zevallos Rospigliosi",
      docType: DocType.DNI,
      docNumber: "43761928",
      phone: "+51 956 443 322",
      email: "diego.zevallos@miningtech.com",
      address: "Challapampa Mz. G Lote 12",
      district: "Cerro Colorado",
      city: "Arequipa",
      birthDate: new Date("1985-05-09"),
      tierId: goldTier.id,
      totalSpent: 4890.00,
      currentPoints: 239,
      lifetimePoints: 489,
      cardNumber: "LUX-2026-1007",
    },
    {
      firstName: "Camila",
      lastName: "Quiroz Falconí",
      docType: DocType.DNI,
      docNumber: "70482915",
      phone: "+51 974 115 566",
      email: "camila.quiroz@intercorp.pe",
      address: "Villa Médica F-201",
      district: "José Luis Bustamante y Rivero",
      city: "Arequipa",
      birthDate: new Date("1994-12-14"),
      tierId: bronzeTier.id,
      totalSpent: 720.00,
      currentPoints: 72,
      lifetimePoints: 72,
      cardNumber: "LUX-2026-1008",
    },
    {
      firstName: "Renato",
      lastName: "Barreda Málaga",
      docType: DocType.DNI,
      docNumber: "29847163",
      phone: "+51 959 778 811",
      email: "renato.barreda@agroexport.com",
      address: "Fundo San José Km 4.5",
      district: "Sachaca",
      city: "Arequipa",
      birthDate: new Date("1978-07-03"),
      tierId: silverTier.id,
      totalSpent: 2900.00,
      currentPoints: 210,
      lifetimePoints: 290,
      cardNumber: "LUX-2026-1009",
    },
    {
      firstName: "Andrea",
      lastName: "Cornejo Polar",
      docType: DocType.DNI,
      docNumber: "46918273",
      phone: "+51 958 223 344",
      email: "andrea.cornejo@clinica.pe",
      address: "Urb. Los Cedros E-5",
      district: "Cayma",
      city: "Arequipa",
      birthDate: new Date("1989-10-30"),
      tierId: bronzeTier.id,
      totalSpent: 480.00,
      currentPoints: 48,
      lifetimePoints: 48,
      cardNumber: "LUX-2026-1010",
    },
    {
      firstName: "Eduardo",
      lastName: "Montesinos Galdos",
      docType: DocType.DNI,
      docNumber: "42109845",
      phone: "+51 951 665 544",
      email: "eduardo.montesinos@notaria.pe",
      address: "Calle Santa Catalina 315",
      district: "Cercado",
      city: "Arequipa",
      birthDate: new Date("1983-04-18"),
      tierId: bronzeTier.id,
      totalSpent: 850.00,
      currentPoints: 85,
      lifetimePoints: 85,
      cardNumber: "LUX-2026-1011",
    },
    {
      firstName: "Patricia",
      lastName: "Rivera Santillana",
      docType: DocType.DNI,
      docNumber: "45291834",
      phone: "+51 957 334 455",
      email: "patricia.rivera@turismoandes.com",
      address: "Av. Dolores 154",
      district: "José Luis Bustamante y Rivero",
      city: "Arequipa",
      birthDate: new Date("1987-02-24"),
      tierId: silverTier.id,
      totalSpent: 3100.00,
      currentPoints: 250,
      lifetimePoints: 310,
      cardNumber: "LUX-2026-1012",
    },
    {
      firstName: "Alonso",
      lastName: "Bustamante Romero",
      docType: DocType.DNI,
      docNumber: "40819274",
      phone: "+51 986 441 122",
      email: "alonso.bustamante@inversiones.com",
      address: "Condominio La Alameda A-402",
      district: "Yanahuara",
      city: "Arequipa",
      birthDate: new Date("1981-09-08"),
      tierId: goldTier.id,
      totalSpent: 6200.00,
      currentPoints: 320,
      lifetimePoints: 620,
      cardNumber: "LUX-2026-1013",
    },
    {
      firstName: "Valeria",
      lastName: "Chávez Arispe",
      docType: DocType.DNI,
      docNumber: "73928164",
      phone: "+51 953 998 877",
      email: "valeria.chavez@arquitectura.pe",
      address: "Calle Tronchadero 120",
      district: "Cayma",
      city: "Arequipa",
      birthDate: new Date("1997-05-12"),
      tierId: bronzeTier.id,
      totalSpent: 300.00,
      currentPoints: 30,
      lifetimePoints: 30,
      cardNumber: "LUX-2026-1014",
    },
    {
      firstName: "Guillermo",
      lastName: "Tejada Nuñez",
      docType: DocType.DNI,
      docNumber: "29584712",
      phone: "+51 950 221 199",
      email: "guillermo.tejada@metalurgica.pe",
      address: "Parque Industrial Manzana C Lote 4",
      district: "Cercado",
      city: "Arequipa",
      birthDate: new Date("1974-12-01"),
      tierId: platinumTier.id,
      totalSpent: 12800.00,
      currentPoints: 780,
      lifetimePoints: 1280,
      cardNumber: "LUX-2026-1015",
    },
  ];

  const createdCustomers = [];
  for (let i = 0; i < rawCustomersData.length; i++) {
    const data = rawCustomersData[i];
    const code = `LPT-${10001 + i}`;
    
    // Generate secure random QR token (NOT containing DNI or sensitive info)
    const qrToken = crypto.randomBytes(24).toString("hex");

    const customer = await prisma.customer.create({
      data: {
        code,
        firstName: data.firstName,
        lastName: data.lastName,
        docType: data.docType,
        docNumber: data.docNumber,
        phone: data.phone,
        email: data.email,
        userId: data.userId || null,
        address: data.address,
        district: data.district,
        city: data.city,
        birthDate: data.birthDate,
        status: CustomerStatus.ACTIVE,
        tierId: data.tierId,
        totalSpent: data.totalSpent,
        currentPoints: data.currentPoints,
        lifetimePoints: data.lifetimePoints,
        notes: "Cliente registrado con membresía activa.",
        registeredAt: new Date(Date.now() - (180 - i * 10) * 86400000),
        card: {
          create: {
            cardNumber: data.cardNumber,
            qrCodeToken: qrToken,
            status: CardStatus.ACTIVE,
            issuedAt: new Date(Date.now() - (180 - i * 10) * 86400000),
            expiresAt: new Date(Date.now() + 365 * 86400000),
            lastScannedAt: new Date(Date.now() - 2 * 86400000),
          },
        },
      },
      include: {
        card: true,
      },
    });

    createdCustomers.push(customer);
  }

  // 10. Service Bookings (10 Consumos reales)
  console.log("Creating 10 Bookings / Consumos with Points and Payments...");
  const bookingsData = [
    {
      customerIndex: 0, // Rodrigo Morales
      serviceIndex: 0, // Traslado Aeropuerto
      amount: 80.00,
      method: PaymentMethod.YAPE,
      daysAgo: 25,
      points: 8,
    },
    {
      customerIndex: 0, // Rodrigo Morales
      serviceIndex: 1, // Viaje Colca
      amount: 480.00,
      method: PaymentMethod.TRANSFERENCIA_BANCARIA,
      daysAgo: 15,
      points: 48,
    },
    {
      customerIndex: 0, // Rodrigo Morales
      serviceIndex: 2, // City Tour
      amount: 150.00,
      method: PaymentMethod.TARJETA,
      daysAgo: 5,
      points: 15,
    },
    {
      customerIndex: 1, // Fiorella Benavente
      serviceIndex: 7, // Transporte Corporativo Horas
      amount: 500.00,
      method: PaymentMethod.TRANSFERENCIA_BANCARIA,
      daysAgo: 20,
      points: 65,
    },
    {
      customerIndex: 2, // Alejandro Vargas
      serviceIndex: 6, // Viaje Mollendo
      amount: 320.00,
      method: PaymentMethod.PLIN,
      daysAgo: 12,
      points: 32,
    },
    {
      customerIndex: 3, // Mariana Pacheco
      serviceIndex: 3, // Ruta del Sillar
      amount: 120.00,
      method: PaymentMethod.YAPE,
      daysAgo: 18,
      points: 12,
    },
    {
      customerIndex: 4, // Gonzalo Fernández-Dávila
      serviceIndex: 9, // Viaje Puno
      amount: 550.00,
      method: PaymentMethod.TARJETA,
      daysAgo: 7,
      points: 66,
    },
    {
      customerIndex: 5, // Lucía Del Carpio
      serviceIndex: 0, // Traslado Aeropuerto
      amount: 80.00,
      method: PaymentMethod.EFECTIVO,
      daysAgo: 9,
      points: 8,
    },
    {
      customerIndex: 6, // Diego Zevallos
      serviceIndex: 5, // Santuario Chapi
      amount: 220.00,
      method: PaymentMethod.YAPE,
      daysAgo: 4,
      points: 22,
    },
    {
      customerIndex: 14, // Guillermo Tejada
      serviceIndex: 7, // Corporativo
      amount: 750.00,
      method: PaymentMethod.TRANSFERENCIA_BANCARIA,
      daysAgo: 2,
      points: 97,
    },
  ];

  for (let i = 0; i < bookingsData.length; i++) {
    const item = bookingsData[i];
    const customer = createdCustomers[item.customerIndex];
    const service = services[item.serviceIndex];
    const bookingDate = new Date(Date.now() - item.daysAgo * 86400000);
    const code = `CNS-2026-${String(1001 + i).padStart(4, "0")}`;

    const booking = await prisma.booking.create({
      data: {
        code,
        customerId: customer.id,
        serviceId: service.id,
        description: `Servicio contratado: ${service.name}`,
        bookingDate,
        amount: item.amount,
        paymentMethod: item.method,
        paymentStatus: PaymentStatus.PAGADO,
        serviceStatus: BookingStatus.COMPLETADO,
        pointsEarned: item.points,
        operatorId: operatorUser.id,
        notes: "Servicio completado satisfactoriamente y verificado por operador.",
        isProcessedForPoints: true,
        completedAt: bookingDate,
        payments: {
          create: {
            amount: item.amount,
            paymentMethod: item.method,
            status: PaymentStatus.PAGADO,
            paidAt: bookingDate,
            referenceNumber: `OP-${Math.floor(100000 + Math.random() * 900000)}`,
          },
        },
      },
    });

    // Create Ledger Transaction
    await prisma.pointTransaction.create({
      data: {
        customerId: customer.id,
        bookingId: booking.id,
        type: PointTransactionType.EARNED,
        points: item.points,
        balanceAfter: customer.currentPoints,
        concept: `Puntos por ${service.name} (${booking.code})`,
        operatorId: operatorUser.id,
        referenceCode: booking.code,
        createdAt: bookingDate,
      },
    });

    // Create Point Lot for expiration tracking (12 months validity)
    const expiresAt = new Date(bookingDate.getTime() + 365 * 86400000);
    await prisma.pointLot.create({
      data: {
        customerId: customer.id,
        bookingId: booking.id,
        pointsInitial: item.points,
        pointsRemaining: item.points,
        status: LotStatus.ACTIVE,
        expiresAt,
        createdAt: bookingDate,
      },
    });
  }

  // 11. Redemptions (Canjes de prueba)
  console.log("Creating Sample Redemptions...");
  const customerRodrigo = createdCustomers[0];
  const rewardAirportBono = rewards[0]; // 30 pts

  // Completed Redemption
  const redemptionCode1 = `CJ-${Math.floor(100000 + Math.random() * 900000)}`;
  const qrValidationCode1 = crypto.randomBytes(16).toString("hex");
  const completedRedemption = await prisma.redemption.create({
    data: {
      code: redemptionCode1,
      customerId: customerRodrigo.id,
      rewardId: rewardAirportBono.id,
      pointsSpent: 30,
      status: RedemptionStatus.COMPLETADO,
      qrValidationCode: qrValidationCode1,
      requestedAt: new Date(Date.now() - 10 * 86400000),
      approvedAt: new Date(Date.now() - 9 * 86400000),
      approvedByUserId: adminUser.id,
      completedAt: new Date(Date.now() - 8 * 86400000),
      validatedByUserId: operatorUser.id,
      notes: "Validado y aplicado en servicio de aeropuerto.",
    },
  });

  await prisma.pointTransaction.create({
    data: {
      customerId: customerRodrigo.id,
      redemptionId: completedRedemption.id,
      type: PointTransactionType.REDEEMED,
      points: -30,
      balanceAfter: customerRodrigo.currentPoints,
      concept: `Canje de recompensa: ${rewardAirportBono.name} (${completedRedemption.code})`,
      operatorId: operatorUser.id,
      referenceCode: completedRedemption.code,
      createdAt: new Date(Date.now() - 10 * 86400000),
    },
  });

  // Pending Redemption for demonstration
  const rewardRutaSillar = rewards[2]; // 60 pts
  const redemptionCode2 = `CJ-${Math.floor(100000 + Math.random() * 900000)}`;
  const qrValidationCode2 = crypto.randomBytes(16).toString("hex");
  await prisma.redemption.create({
    data: {
      code: redemptionCode2,
      customerId: customerRodrigo.id,
      rewardId: rewardRutaSillar.id,
      pointsSpent: 60,
      status: RedemptionStatus.PENDIENTE,
      qrValidationCode: qrValidationCode2,
      requestedAt: new Date(Date.now() - 1 * 86400000),
      notes: "Solicitud ingresada por el cliente desde el portal web.",
    },
  });

  // 12. Audit Logs
  console.log("Creating Initial Audit Logs...");
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: "INIT_SYSTEM",
        entity: "SystemSetting",
        details: "Inicialización del sistema de fidelización Luxury Rewards.",
      },
      {
        userId: adminUser.id,
        action: "CONFIG_TIERS",
        entity: "LoyaltyTier",
        details: "Configuración de niveles Bronze, Silver, Gold y Platinum.",
      },
      {
        userId: operatorUser.id,
        action: "SCAN_QR",
        entity: "LoyaltyCard",
        entityId: customerRodrigo.card?.cardNumber,
        details: "Escaneo exitoso de tarjeta QR en módulo de atención.",
      },
    ],
  });

  console.log("✅ Seed completed successfully!");
  console.log("--------------------------------------------------");
  console.log("👥 Demo Accounts:");
  console.log(`👑 Administrador: admin@luxurytravel.com | Pass: ${demoPassword}`);
  console.log(`👔 Operador:     operador@luxurytravel.com | Pass: ${demoPassword}`);
  console.log(`⭐ Cliente:      cliente@luxurytravel.com | Pass: ${demoPassword}`);
  console.log("--------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

