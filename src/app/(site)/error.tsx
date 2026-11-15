"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="shell shell-narrow py-28 text-center">
      <h1 className="text-2xl font-bold tracking-tight">कुछ गड़बड़ हो गई</h1>
      <p className="mt-2 text-muted-foreground">कृपया थोड़ी देर बाद दोबारा कोशिश करें।</p>
      <button onClick={reset} className="mt-6 inline-flex h-11 cursor-pointer items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground transition-colors hover:bg-primary/90">दोबारा कोशिश करें</button>
    </div>
  );
}
