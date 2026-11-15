import { config } from "@/lib/config";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("गोपनीयता नीति और शर्तें", "गोपनीयता नीति, कुकीज़ और उपयोग की शर्तें", "/privacy");

export default function PrivacyPage() {
  return (
    <main className="shell shell-read rise py-12 lg:py-16">
      <p className="text-sm font-medium text-primary">{config.site.name}</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">गोपनीयता नीति और शर्तें</h1>
      <div className="article mt-10 text-[1.0625rem] leading-[1.95]">
        <h2>हम कौन-सी जानकारी लेते हैं</h2>
        <p>जब आप संपर्क फ़ॉर्म से हमें खबर या संदेश भेजते हैं, तो आपका नाम, फ़ोन नंबर और संदेश हमारे पास सुरक्षित रखा जाता है। इसका उपयोग केवल आपसे संपर्क करने के लिए होता है।</p>
        <h2>कुकीज़ और एनालिटिक्स</h2>
        <p>वेबसाइट के उपयोग को समझने के लिए हम Google Analytics या Microsoft Clarity जैसे टूल उपयोग कर सकते हैं, जो कुकीज़ का इस्तेमाल करते हैं।</p>
        <h2>तृतीय-पक्ष विज्ञापन</h2>
        <p>इस वेबसाइट पर Adsterra जैसे तृतीय-पक्ष विज्ञापन नेटवर्क के विज्ञापन दिखाए जा सकते हैं। ये नेटवर्क आपकी रुचि के अनुसार विज्ञापन दिखाने के लिए कुकीज़ का उपयोग कर सकते हैं। सभी विज्ञापन &ldquo;प्रायोजित&rdquo; के रूप में चिह्नित होते हैं। किसी आपत्तिजनक विज्ञापन की सूचना हमें {config.contact.email} पर दें।</p>
        <h2>उपयोग की शर्तें</h2>
        <p>इस वेबसाइट की सामग्री केवल सूचना के लिए है। बिना अनुमति इसकी नकल या पुनः प्रकाशन की अनुमति नहीं है। हम सटीक खबर देने का प्रयास करते हैं; गलती होने पर सुधार किया जाएगा।</p>
        <h2>संपर्क</h2>
        <p>{config.contact.email} · {config.contact.phone}</p>
      </div>
    </main>
  );
}
