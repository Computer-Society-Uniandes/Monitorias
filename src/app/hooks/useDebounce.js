'use client';

import { useDebounce as useDebounceHook } from '@uidotdev/usehooks';

/**
 * Hook personalizado para debounce
 * Retrasa la actualización de un valor hasta que haya pasado un tiempo específico sin cambios
 *
 * @param {any} value - El valor a debounce
 * @param {number} delay - Tiempo de espera en milisegundos (default: 300ms)
 * @returns {any} El valor debounced
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 *
 * useEffect(() => {
 *   // Esta búsqueda solo se ejecuta después de 300ms sin cambios
 *   searchAPI(debouncedSearch);
 * }, [debouncedSearch]);
 */
export const useDebounce = (value, delay = 300) => {
    return useDebounceHook(value, delay);
};
