import { getCategories } from "@/lib/data";
import { MobileNav } from "./mobile-nav";

export async function MobileNavLoader() {
  return <MobileNav categories={await getCategories()} />;
}
