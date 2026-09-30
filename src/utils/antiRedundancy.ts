// Utility functions to protect against data redundancy, duplicate records, and double-submissions

export const normalizeText = (text: string): string => {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Removes accents: "café" -> "cafe"
};

export const normalizePhone = (phone: string): string => {
  return phone.replace(/\D/g, ''); // Keeps digits only
};

// Check if a product already exists in inventory
export const findDuplicateProduct = <T extends { id: string; producto: string }>(
  inventory: T[],
  productName: string,
  excludeId?: string | null
): T | null => {
  const cleanTarget = normalizeText(productName);
  if (!cleanTarget) return null;
  return (
    inventory.find(
      (item) => item.id !== excludeId && normalizeText(item.producto) === cleanTarget
    ) || null
  );
};

// Check if a client already exists by phone, email, or exact name
export const findDuplicateClient = (
  clients: Array<{ id: string; nombre: string; telefono?: string; correo?: string }>,
  target: { nombre: string; telefono: string; correo: string },
  excludeId?: string | null
): { isDuplicate: boolean; reason?: string; existingClient?: any } => {
  const cleanName = normalizeText(target.nombre);
  const cleanPhone = normalizePhone(target.telefono);
  const cleanEmail = normalizeText(target.correo);

  for (const client of clients) {
    if (excludeId && client.id === excludeId) continue;

    // Check telephone collision (if provided and at least 7 digits)
    if (cleanPhone && cleanPhone.length >= 7) {
      const existingPhone = normalizePhone(client.telefono || '');
      if (existingPhone && existingPhone === cleanPhone) {
        return {
          isDuplicate: true,
          reason: `Ya existe el cliente "${client.nombre}" con el mismo número telefónico (${client.telefono}).`,
          existingClient: client,
        };
      }
    }

    // Check email collision (if provided)
    if (cleanEmail && cleanEmail.includes('@')) {
      const existingEmail = normalizeText(client.correo || '');
      if (existingEmail && existingEmail === cleanEmail) {
        return {
          isDuplicate: true,
          reason: `Ya existe el cliente "${client.nombre}" con el mismo correo electrónico (${client.correo}).`,
          existingClient: client,
        };
      }
    }

    // Check exact name collision
    if (cleanName && normalizeText(client.nombre) === cleanName) {
      return {
        isDuplicate: true,
        reason: `Ya existe un cliente registrado exactamente con el nombre "${client.nombre}".`,
        existingClient: client,
      };
    }
  }

  return { isDuplicate: false };
};

// Remove any duplicate IDs or identical entities from array collections
export const deduplicateById = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
};
