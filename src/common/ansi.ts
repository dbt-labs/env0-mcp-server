// Strip ANSI escape codes from a string (e.g. [0m[1m color/formatting sequences)
// eslint-disable-next-line no-control-regex
const ANSI_ESCAPE_RE = /\x1B\[[0-9;]*[A-Za-z]|\x1B[@-_]/g;

export function stripAnsi(str: string): string {
  return str.replace(ANSI_ESCAPE_RE, '');
}
