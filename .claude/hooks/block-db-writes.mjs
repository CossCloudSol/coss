let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let command = "";
  try {
    command = JSON.parse(raw)?.tool_input?.command ?? "";
  } catch {
    process.exit(0);
  }

  // Text inside quotes is data, not a command being run — a commit message,
  // an echoed string, or a grep pattern shouldn't trip this hook.
  const unquoted = command
    .replace(/"(?:\\.|[^"\\])*"/g, " ")
    .replace(/'(?:\\.|[^'\\])*'/g, " ");

  // Only match an actual invocation: prisma (bare, or via npx/pnpm/yarn) as
  // the command starting the string or starting a new command after a shell
  // separator, followed by migrate or db push.
  const blocked =
    /(?:^|[;&|(\n])\s*(?:(?:npx|pnpm|yarn)\s+)?prisma\s+(?:migrate\b|db\s+push\b)/i;

  if (blocked.test(unquoted)) {
    console.error(
      "Blocked by project policy: prisma migrate and prisma db push are never run in this repo. " +
        "Schema changes are applied by the developer in the Supabase SQL Editor, followed by " +
        "`npx prisma generate`. Invoke /db-change and follow that procedure instead."
    );
    process.exit(2);
  }

  process.exit(0);
});
