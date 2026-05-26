/**
 * Barrel export para componentes compartidos.
 * Permite importar todo desde '@/components/shared' en una sola línea.
 *
 * Ejemplo:
 *   import { PageHeader, LoadingScreen, DataTable, RowActions } from '@/components/shared';
 */
export { LoadingScreen } from './LoadingScreen';
export { EmptyState } from './EmptyState';
export { PageHeader } from './PageHeader';
export { SearchInput } from './SearchInput';
export { StatusBadge } from './StatusBadge';
export { ModalOverlay, ModalHeader, ModalBody, ModalFooter } from './ModalOverlay';
export { FormField, inputClasses, selectClasses, textareaClasses } from './FormField';
export { DataTable, RowActions } from './DataTable';
export { FilterBar } from './FilterBar';
export { ConfirmModal } from './ConfirmModal';
export { Pagination } from './Pagination';
