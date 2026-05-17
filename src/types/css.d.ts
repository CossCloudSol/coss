// Allows TypeScript to accept side-effect CSS imports (e.g. import './globals.css')
declare module '*.css' {
  const styles: Record<string, string>;
  export default styles;
}
