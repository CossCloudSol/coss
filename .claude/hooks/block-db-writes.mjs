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

  const blocked = /\bprisma\s+(migrate\b|db\s+push\b)/i;

  if (blocked.test(command)) {
    console.error(
      "Blocked by project policy: prisma migrate and prisma db push are never run in this repo. " +
        "Schema changes are applied by the developer in the Supabase SQL Editor, followed by " +
        "`npx prisma generate`. Invoke /db-change and follow that procedure instead."
    );
    process.exit(2);
  }

  process.exit(0);
});
