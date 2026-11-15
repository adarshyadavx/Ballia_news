import { MapPin } from "lucide-react";
import { config } from "@/lib/config";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("हमारे बारे में", `${config.site.name} के बारे में जानें`, "/about");

export default function AboutPage() {
  return (
    <main className="shell shell-read rise py-12 lg:py-16">
      <p className="text-sm font-medium text-primary">{config.site.name}</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">हमारे बारे में</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{config.site.tagline}।</p>
      <div className="article mt-10 text-[1.0625rem] leading-[1.95]">
        <p>{config.site.name} बलिया जिले की खबरों के लिए एक स्थानीय समाचार वेबसाइट है। हमारा उद्देश्य है — बलिया की हर खबर, सबसे पहले और सही रूप में आप तक पहुँचाना।</p>
        <h2>हमारा मिशन</h2>
        <p>शहर, तहसील और गाँव की ज़रूरी खबरें, प्रशासन और राजनीति की जानकारी, शिक्षा, खेल, कृषि और रोज़गार से जुड़ी सूचनाएँ सरल हिंदी में देना।</p>
        <h2>संपादक</h2>
        <p>संपादक का नाम यहाँ जोड़ें।</p>
        <h2>कार्यालय</h2>
        <p className="flex items-center gap-2"><MapPin size={18} className="text-primary" /> {config.contact.address}</p>
      </div>
    </main>
  );
}
