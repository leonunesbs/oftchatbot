interface SnellenLetterProps {
  letter: string;
  size: number;
  className?: string;
}

/**
 * Renders a Sloan letter inside a fixed size×size box.
 * Keeping a fixed box per optotype preserves chart spacing rules.
 */
export default function SnellenLetter({ letter, size, className }: SnellenLetterProps) {
  return (
    <span
      className={`inline-flex items-center justify-center leading-none select-none ${className ?? ""}`}
      aria-label={`Letra ${letter}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${size}px`,
        lineHeight: 1,
        fontFamily: "var(--font-sloan-optotype), 'Arial Black', 'Helvetica Neue', sans-serif",
      }}
    >
      {letter}
    </span>
  );
}
