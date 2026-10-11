import type { CSSProperties } from "react";

/**
 * `data-reveal`-тай жагсаалтын i дэх элементийг бага зэрэг хоцроож гаргана (`style={revealDelay(i)}`).
 * Сервер component-оос дуудагддаг тул "use client" файлд биш энд байна.
 */
export function revealDelay(index: number, step = 80): CSSProperties {
  return { "--reveal-delay": `${index * step}ms` } as CSSProperties;
}
