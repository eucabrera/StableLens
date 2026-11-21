export function Logo() {
  // Plain <a>: "/" is the static landing (rewritten to public/index.html), not an app route.
  return (
    <a href="/" className="flex items-center gap-2.5">
      <span className="flex size-7 items-center justify-center rounded-full bg-red text-sm font-bold tracking-tight text-white">
        S
      </span>
      <span className="text-[17px] font-semibold tracking-tight">StableLens</span>
    </a>
  );
}
