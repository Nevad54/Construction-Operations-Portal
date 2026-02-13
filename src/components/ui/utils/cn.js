// Simple className utility without external dependencies for now
export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}
