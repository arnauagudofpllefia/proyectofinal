// Resumen del archivo: src\app\_components\ProfileGlyph.js
// Este modulo implementa responsabilidades concretas del sistema, separando logica de forma clara para facilitar mantenimiento y escalabilidad.

"use client";

import { useEffect, useState } from "react";
import { getProfileAvatarUrl, getProfileIconDefinition } from "@/lib/profileIcon";

const AVATAR_PLACEHOLDER_SRC = "/avatar-placeholder.svg";

/**
 * Funcion: ProfileGlyph.

 * Proposito: encapsular una parte concreta de la logica para mejorar claridad y mantenimiento.

 * Contexto: se invoca desde el flujo principal de esta pantalla o modulo.

 */
export default function ProfileGlyph({ iconId, className = "h-5 w-5" }) {
  const icon = getProfileIconDefinition(iconId);
  const avatarUrl = getProfileAvatarUrl(iconId);
  const [imageSrc, setImageSrc] = useState(avatarUrl || AVATAR_PLACEHOLDER_SRC);

  useEffect(() => {
    setImageSrc(avatarUrl || AVATAR_PLACEHOLDER_SRC);
  }, [avatarUrl]);

  return (
    <span className={`inline-flex overflow-hidden rounded-full ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt="Avatar"
        className="h-full w-full object-cover"
        onError={() => setImageSrc(AVATAR_PLACEHOLDER_SRC)}
      />
      <svg viewBox="0 0 24 24" className="hidden" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        {icon.paths.map((pathValue) => (
          <path key={pathValue} d={pathValue} />
        ))}
      </svg>
    </span>
  );
}

