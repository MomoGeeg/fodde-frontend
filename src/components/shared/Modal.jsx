import { X } from "lucide-react";

/**
 * Modal générique — pattern commun à tous les espaces (RAF, SE, RH…)
 *
 * Usage :
 *   <Modal title="Mon titre" onClose={handleClose}>
 *     <p>Contenu</p>
 *   </Modal>
 *
 * Props :
 *   title    — string affiché dans le header
 *   onClose  — fonction appelée sur croix ou clic sur le fond
 *   size     — "sm" | "md" (défaut) | "lg"
 *   children — contenu du corps
 */
const SIZES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export default function Modal({ title, onClose, size = "md", children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`w-full ${SIZES[size]} rounded-xl bg-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Corps */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
