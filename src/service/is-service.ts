import { Service } from "./service.js";


export function isService(value: unknown): value is Service {
  const maybeService = value as null | undefined | Partial<Service>;
  return typeof maybeService?.serviceName === 'string';
}
