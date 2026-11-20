import type { Address, Carrier, Order, OrderItem, ShipmentDetail, ShipmentStatus, TrackingEvent } from '@colistra/sdk';
import { addBusinessDays, priceFor, SERVICES } from './pricing';
import { createRandom, type Random } from './random';

const SEED = 20260314;
export const ORDER_COUNT = 120;
export const SHIPMENT_COUNT = 95;

const HOUR = 3_600_000;

const FIRST_NAMES = [
  'Camille', 'Léa', 'Chloé', 'Manon', 'Inès', 'Juliette', 'Louise', 'Sarah', 'Clémence', 'Pauline',
  'Hugo', 'Lucas', 'Thomas', 'Antoine', 'Julien', 'Mathis', 'Nicolas', 'Paul', 'Bastien', 'Yanis',
  'Élodie', 'Margaux', 'Anaïs', 'Mélanie', 'Romain', 'Théo', 'Sophie', 'Nadia', 'Karim', 'Agathe',
];
const LAST_NAMES = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau',
  'Simon', 'Laurent', 'Lefèvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier',
  'Morel', 'Girard', 'André', 'Mercier', 'Blanc', 'Guérin', 'Boyer', 'Chevalier', 'Benali', 'Nguyen',
];
const CITIES: ReadonlyArray<{ city: string; postalCodes: string[]; hub: string }> = [
  { city: 'Paris', postalCodes: ['75003', '75005', '75011', '75012', '75018', '75020'], hub: 'Plateforme de Chilly-Mazarin' },
  { city: 'Lyon', postalCodes: ['69001', '69003', '69007'], hub: 'Plateforme de Saint-Priest' },
  { city: 'Marseille', postalCodes: ['13001', '13006', '13008'], hub: 'Plateforme de Vitrolles' },
  { city: 'Bordeaux', postalCodes: ['33000', '33800'], hub: 'Plateforme de Mérignac' },
  { city: 'Nantes', postalCodes: ['44000', '44100'], hub: 'Plateforme de Carquefou' },
  { city: 'Lille', postalCodes: ['59000', '59800'], hub: 'Plateforme de Lesquin' },
  { city: 'Toulouse', postalCodes: ['31000', '31400'], hub: 'Plateforme de Saint-Jory' },
  { city: 'Strasbourg', postalCodes: ['67000'], hub: 'Plateforme de Entzheim' },
  { city: 'Rennes', postalCodes: ['35000', '35700'], hub: 'Plateforme de Cesson-Sévigné' },
  { city: 'Montpellier', postalCodes: ['34000', '34070'], hub: 'Plateforme de Lattes' },
  { city: 'Nice', postalCodes: ['06000', '06300'], hub: 'Plateforme de Carros' },
  { city: 'Grenoble', postalCodes: ['38000', '38100'], hub: 'Plateforme de Saint-Priest' },
  { city: 'Dijon', postalCodes: ['21000'], hub: 'Plateforme de Longvic' },
  { city: 'Tours', postalCodes: ['37000'], hub: 'Plateforme de Saint-Pierre-des-Corps' },
  { city: 'Annecy', postalCodes: ['74000'], hub: 'Plateforme de Saint-Priest' },
  { city: 'La Rochelle', postalCodes: ['17000'], hub: 'Plateforme de Mérignac' },
  { city: 'Aix-en-Provence', postalCodes: ['13090', '13100'], hub: 'Plateforme de Vitrolles' },
  { city: 'Brest', postalCodes: ['29200'], hub: 'Plateforme de Cesson-Sévigné' },
];
const STREETS = [
  'rue des Lilas', 'rue de la République', 'avenue Jean Jaurès', 'boulevard Voltaire', 'rue Victor Hugo',
  'place du Marché', 'chemin des Vignes', 'allée des Tilleuls', 'rue Pasteur', 'rue du Faubourg Saint-Antoine',
  'quai des Chartrons', 'rue de la Paix', 'impasse des Peupliers', 'rue Émile Zola', 'avenue de la Libération',
];
const ADDRESS_COMPLEMENTS = ['Bâtiment B, 3e étage', 'Appartement 12', 'Digicode 4521A', 'Escalier C'];

const PRODUCTS: ReadonlyArray<{ sku: string; name: string; priceCents: number; weightGrams: number }> = [
  { sku: 'BOL-LUNE', name: 'Bol à céréales « Lune », grès émaillé', priceCents: 2400, weightGrams: 450 },
  { sku: 'TAS-NUIT', name: 'Tasse émaillée bleu nuit', priceCents: 1900, weightGrams: 320 },
  { sku: 'ASS-MAREE', name: 'Assiette plate « Marée »', priceCents: 2800, weightGrams: 650 },
  { sku: 'VAS-SOLI', name: 'Vase soliflore en porcelaine', priceCents: 3500, weightGrams: 400 },
  { sku: 'VAS-BOULE', name: 'Vase boule en grès chamotté', priceCents: 6800, weightGrams: 1400 },
  { sku: 'THE-BRUME', name: 'Théière « Brume »', priceCents: 7400, weightGrams: 1100 },
  { sku: 'PICH-EAU', name: "Pichet à eau, émail sable", priceCents: 4900, weightGrams: 1200 },
  { sku: 'SAL-OMBRE', name: "Saladier « Terre d'ombre »", priceCents: 5900, weightGrams: 1800 },
  { sku: 'MUG-ANSE', name: 'Mug à anse large', priceCents: 2200, weightGrams: 380 },
  { sku: 'COUP-BIJ', name: 'Coupelle à bijoux', priceCents: 1500, weightGrams: 150 },
  { sku: 'SET-RAMEN', name: 'Set de 2 bols à ramen', priceCents: 6400, weightGrams: 1300 },
  { sku: 'PLAT-TARTE', name: 'Plat à tarte cannelé', priceCents: 4200, weightGrams: 1500 },
  { sku: 'BOUG-PORC', name: 'Bougeoir en porcelaine', priceCents: 2600, weightGrams: 300 },
  { sku: 'BEUR-GRES', name: 'Beurrier en grès', priceCents: 3200, weightGrams: 500 },
  { sku: 'LAMP-PIED', name: 'Pied de lampe en grès', priceCents: 12900, weightGrams: 2600 },
];

const EXCEPTION_REASONS = [
  'Adresse incomplète, colis en attente au centre de tri',
  'Colis endommagé pendant le transport',
  'Destinataire absent, avis de passage déposé',
  'Colis refusé par le destinataire',
  "Retard d'acheminement, colis bloqué au centre de tri",
];

const CARRIER_WEIGHTS: ReadonlyArray<[Carrier, number]> = [
  ['colissimo', 0.45],
  ['mondial_relay', 0.3],
  ['chronopost', 0.15],
  ['dhl', 0.1],
];

/** Atelier Lune's workshop, where every parcel leaves from. */
export const SHOP_ADDRESS: Address = {
  name: 'Atelier Lune',
  company: 'Atelier Lune SAS',
  line1: '14 rue des Potiers',
  postalCode: '69004',
  city: 'Lyon',
  country: 'FR',
  phone: '+33 4 78 00 12 34',
  email: 'expeditions@atelier-lune.example',
};

export interface SeedData {
  orders: Order[];
  shipments: ShipmentDetail[];
}

export function generateSeed(now: number = Date.now()): SeedData {
  const random = createRandom(SEED);
  const orders: Order[] = [];
  const shipments: ShipmentDetail[] = [];

  for (let i = 0; i < ORDER_COUNT; i++) {
    const labelled = i < SHIPMENT_COUNT;
    const hoursAgo = labelled
      ? 14 + (16 * 24 - 14) * Math.pow(1 - i / SHIPMENT_COUNT, 1.6) + random.int(-2, 2)
      : 14 - (i - SHIPMENT_COUNT) * 0.55 + random.next();
    const createdAt = now - Math.max(hoursAgo, 0.3) * HOUR;
    const order = generateOrder(random, i, createdAt, labelled);
    orders.push(order);

    if (labelled) {
      const labelHoursAfterOrder = random.int(2, 10);
      const labelledAt = Math.min(createdAt + labelHoursAfterOrder * HOUR, now - 1.5 * HOUR);
      shipments.push(generateShipment(random, order, labelledAt, now));
    }
  }

  return {
    orders: orders.reverse(),
    shipments: shipments.reverse(),
  };
}

function generateOrder(random: Random, index: number, createdAt: number, labelled: boolean): Order {
  const firstName = random.pick(FIRST_NAMES);
  const lastName = random.pick(LAST_NAMES);
  const place = random.pick(CITIES);
  const itemCount = random.chance(0.55) ? 1 : random.int(2, 4);
  const items: OrderItem[] = [];
  for (let n = 0; n < itemCount; n++) {
    const product = random.pick(PRODUCTS);
    const existing = items.find((item) => item.sku === product.sku);
    if (existing) existing.quantity += 1;
    else items.push({ sku: product.sku, name: product.name, quantity: 1, unitPrice: { amount: product.priceCents, currency: 'EUR' } });
  }

  const productWeight = items.reduce((sum, item) => sum + weightOf(item.sku) * item.quantity, 0);
  const packagingGrams = 250 + 120 * items.length;
  const weightKg = Math.round((productWeight + packagingGrams) / 10) / 100;
  const dimensions =
    weightKg < 1 ? { length: 20, width: 15, height: 12 } : weightKg < 2.5 ? { length: 30, width: 22, height: 18 } : { length: 40, width: 30, height: 28 };

  return {
    id: random.id('ord'),
    number: `AL-${10001 + index}`,
    status: labelled ? 'labelled' : 'awaiting_label',
    customer: {
      name: `${firstName} ${lastName}`,
      email: `${slug(firstName)}.${slug(lastName)}@example.fr`,
    },
    shippingAddress: {
      name: `${firstName} ${lastName}`,
      line1: `${random.int(1, 148)} ${random.pick(STREETS)}`,
      ...(random.chance(0.2) ? { line2: random.pick(ADDRESS_COMPLEMENTS) } : {}),
      postalCode: random.pick(place.postalCodes),
      city: place.city,
      country: 'FR',
      phone: `+33 6 ${random.digits(2)} ${random.digits(2)} ${random.digits(2)} ${random.digits(2)}`,
    },
    items,
    total: { amount: items.reduce((sum, item) => sum + item.unitPrice.amount * item.quantity, 0), currency: 'EUR' },
    package: {
      weight: { value: weightKg, unit: 'kg' },
      dimensions: { ...dimensions, unit: 'cm' },
    },
    createdAt: new Date(createdAt).toISOString(),
  };
}

function generateShipment(random: Random, order: Order, labelledAt: number, now: number): ShipmentDetail {
  const carrier = pickCarrier(random);
  const service = random.pick(SERVICES.filter((s) => s.carrier === carrier));
  const parcel = parcelOf(order);
  const ageHours = (now - labelledAt) / HOUR;
  const status = pickStatus(random, ageHours);
  const place = CITIES.find((c) => c.city === order.shippingAddress.city)!;
  const events = buildEvents(random, { carrier, status, labelledAt, now, city: order.shippingAddress.city, hub: place.hub, days: service.estimatedDays });
  const trackingNumber = trackingNumberFor(random, carrier);

  return {
    id: random.id('shp'),
    orderId: order.id,
    orderNumber: order.number,
    carrier,
    service: service.service,
    trackingNumber,
    status,
    cost: { amount: priceFor(service, parcel), currency: 'EUR' },
    recipient: {
      name: order.shippingAddress.name,
      postalCode: order.shippingAddress.postalCode,
      city: order.shippingAddress.city,
    },
    estimatedDelivery: status === 'delivered' || status === 'returned' ? null : addBusinessDays(new Date(labelledAt), service.estimatedDays),
    createdAt: new Date(labelledAt).toISOString(),
    updatedAt: events[0].occurredAt,
    events,
    labelUrl: `https://labels.colistra.test/${trackingNumber}.pdf`,
  };
}

function pickCarrier(random: Random): Carrier {
  let roll = random.next();
  for (const [carrier, weight] of CARRIER_WEIGHTS) {
    if (roll < weight) return carrier;
    roll -= weight;
  }
  return 'colissimo';
}

function pickStatus(random: Random, ageHours: number): ShipmentStatus {
  if (ageHours >= 24 * 7 && random.chance(0.1)) return 'returned';
  if (ageHours >= 24 && random.chance(0.13)) return 'exception';
  const roll = random.next();
  if (ageHours < 12) return roll < 0.7 ? 'label_created' : 'in_transit';
  if (ageHours < 36) return roll < 0.15 ? 'label_created' : roll < 0.75 ? 'in_transit' : 'out_for_delivery';
  if (ageHours < 72) return roll < 0.3 ? 'in_transit' : roll < 0.55 ? 'out_for_delivery' : 'delivered';
  return 'delivered';
}

function buildEvents(
  random: Random,
  input: { carrier: Carrier; status: ShipmentStatus; labelledAt: number; now: number; city: string; hub: string; days: number },
): TrackingEvent[] {
  const { carrier, status, labelledAt, now, city, hub, days } = input;
  const steps: Array<Omit<TrackingEvent, 'occurredAt'> & { afterHours: number }> = [
    { status: 'label_created', description: 'Étiquette créée, en attente de dépôt', location: null, afterHours: 0 },
  ];
  if (status === 'label_created') return finalize(steps);

  steps.push({ status: 'in_transit', description: `Colis pris en charge par ${CARRIER_NAMES[carrier]}`, location: 'Lyon', afterHours: random.int(3, 9) });
  steps.push({ status: 'in_transit', description: "Colis en cours d'acheminement", location: hub, afterHours: random.int(8, 16) });
  if (status === 'in_transit') return finalize(steps);

  if (status === 'exception' || status === 'returned') {
    steps.push({ status: 'exception', description: random.pick(EXCEPTION_REASONS), location: city, afterHours: random.int(6, 20) });
    if (status === 'returned') {
      steps.push({ status: 'returned', description: "Retour à l'expéditeur en cours", location: hub, afterHours: random.int(24, 72) });
    }
    return finalize(steps);
  }

  steps.push({ status: 'out_for_delivery', description: 'Colis en cours de livraison', location: city, afterHours: Math.max(days * 24 - 30, 4) });
  if (status === 'out_for_delivery') return finalize(steps);

  steps.push({
    status: 'delivered',
    description: carrier === 'mondial_relay' ? 'Colis retiré en Point Relais' : 'Colis livré au destinataire',
    location: city,
    afterHours: random.int(2, 6),
  });
  return finalize(steps);

  function finalize(list: typeof steps): TrackingEvent[] {
    // Intermediate events that would be in the future are dropped; the event that
    // gives the shipment its status always stays, at the latest a little before now.
    const events: TrackingEvent[] = [];
    let time = labelledAt;
    list.forEach(({ afterHours, ...event }, index) => {
      const isLast = index === list.length - 1;
      const candidate = time + afterHours * HOUR;
      if (!isLast && candidate > now - HOUR) return;
      time = isLast ? Math.max(Math.min(candidate, now - random.int(20, 240) * 60_000), time) : candidate;
      events.push({ ...event, occurredAt: new Date(time).toISOString() });
    });
    return events.reverse();
  }
}

const CARRIER_NAMES: Record<Carrier, string> = {
  colissimo: 'Colissimo',
  chronopost: 'Chronopost',
  mondial_relay: 'Mondial Relay',
  dhl: 'DHL Express',
};

export function trackingNumberFor(random: Random, carrier: Carrier): string {
  switch (carrier) {
    case 'colissimo':
      return `6A${random.digits(11)}`;
    case 'chronopost':
      return `XW${random.digits(9)}FR`;
    case 'mondial_relay':
      return random.digits(8);
    case 'dhl':
      return `JD${random.digits(10)}`;
  }
}

export function parcelOf(order: Order) {
  return {
    weightGrams: Math.round(order.package.weight.value * 1000),
    lengthCm: order.package.dimensions.length,
    widthCm: order.package.dimensions.width,
    heightCm: order.package.dimensions.height,
  };
}

function weightOf(sku: string): number {
  return PRODUCTS.find((p) => p.sku === sku)!.weightGrams;
}

function slug(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
