import { config } from "@/lib/config";
import type { News } from "@/types";

// Placeholder stories with illustrations, shown only while the database has no
// published news (set features.sampleData to false in config.json to turn off).
export type SampleNews = News & { category: { name: string; slug: string } | null };

const catName = (slug: string) => config.categories.find((c) => c.slug === slug)?.name ?? slug;

type Seed = {
  n: number; cat: string; img: string; headline: string; summary: string; area: string;
  hoursAgo: number; views: number; featured?: boolean; breaking?: boolean; video?: boolean; tags: string[];
};

// Fixed reference time keeps server output stable (no Date.now() while rendering).
const BASE = Date.parse("2026-11-15T06:30:00Z");

const seeds: Seed[] = [
  { n: 1, cat: "ballia-city", img: "ghat", headline: "गंगा घाट पर सुबह की आरती देखने उमड़ी भीड़, प्रशासन ने बढ़ाई सुविधाएँ", summary: "कार्तिक माह में घाटों पर श्रद्धालुओं की संख्या बढ़ी है। रोशनी, सफ़ाई और सुरक्षा के अतिरिक्त इंतज़ाम किए गए।", area: "बलिया सदर", hoursAgo: 2, views: 4820, featured: true, tags: ["गंगा", "आस्था"] },
  { n: 2, cat: "ballia-city", img: "road", headline: "मुख्य बाज़ार की सड़क का निर्माण शुरू, दो महीने में पूरा होगा काम", summary: "नगर पालिका ने बाज़ार की जर्जर सड़क के पुनर्निर्माण का काम शुरू कर दिया है। यातायात के लिए वैकल्पिक मार्ग तय।", area: "बलिया सदर", hoursAgo: 5, views: 3190, featured: true, tags: ["सड़क", "नगर पालिका"] },
  { n: 3, cat: "politics", img: "politics", headline: "जिला पंचायत की बैठक में विकास योजनाओं पर चर्चा, कई प्रस्ताव पारित", summary: "बैठक में ग्रामीण सड़कों, पेयजल और स्वास्थ्य केंद्रों के लिए बजट आवंटन को मंज़ूरी दी गई।", area: "बलिया सदर", hoursAgo: 7, views: 2740, featured: true, breaking: true, tags: ["पंचायत", "विकास"] },
  { n: 4, cat: "education", img: "education", headline: "सरकारी विद्यालयों में स्मार्ट क्लास की शुरुआत, बच्चों में दिखा उत्साह", summary: "जिले के चालीस विद्यालयों में डिजिटल बोर्ड और ई-सामग्री से पढ़ाई शुरू हुई। शिक्षकों को प्रशिक्षण दिया गया।", area: "रसड़ा", hoursAgo: 9, views: 2210, featured: true, tags: ["शिक्षा", "स्मार्ट क्लास"] },
  { n: 5, cat: "crime", img: "crime", headline: "रात्रि गश्त बढ़ाने के निर्देश, पुलिस अधीक्षक ने की समीक्षा बैठक", summary: "बाज़ारों और राजमार्गों पर गश्त बढ़ाई जाएगी। नागरिकों से संदिग्ध गतिविधि की सूचना तुरंत देने की अपील।", area: "बांसडीह", hoursAgo: 11, views: 1980, featured: true, breaking: true, tags: ["पुलिस", "सुरक्षा"] },
  { n: 6, cat: "agriculture", img: "farm", headline: "धान की कटाई तेज़, क्रय केंद्रों पर खरीद शुरू; किसानों को समय पर भुगतान का भरोसा", summary: "जिले में सरकारी क्रय केंद्र खुल गए हैं। अधिकारियों ने नमी की जाँच और तौल में पारदर्शिता के निर्देश दिए।", area: "बैरिया", hoursAgo: 14, views: 3560, tags: ["किसान", "धान"] },
  { n: 7, cat: "culture", img: "temple", headline: "ददरी मेले की तैयारियाँ अंतिम चरण में, पशु मेले और सांस्कृतिक कार्यक्रम होंगे आकर्षण", summary: "ऐतिहासिक मेले में इस बार प्रदर्शनी, लोकगीत और खेल प्रतियोगिताओं का आयोजन किया जाएगा।", area: "बलिया सदर", hoursAgo: 20, views: 5120, video: true, tags: ["मेला", "संस्कृति"] },
  { n: 8, cat: "sports", img: "sports", headline: "जिला स्तरीय फुटबॉल प्रतियोगिता में सिकंदरपुर की टीम विजेता", summary: "रोमांचक फाइनल में टाई-ब्रेकर के बाद सिकंदरपुर ने बाज़ी मारी। विजेता टीम को ट्रॉफी और नकद पुरस्कार मिला।", area: "सिकंदरपुर", hoursAgo: 26, views: 1640, video: true, tags: ["फुटबॉल", "खेल"] },
  { n: 9, cat: "jobs", img: "office", headline: "रोज़गार मेला में 1,200 युवाओं को मिला प्रस्ताव, 30 कंपनियों ने लिया हिस्सा", summary: "सेवायोजन कार्यालय की पहल पर आयोजित मेले में आईटीआई और स्नातक युवाओं को नौकरी के अवसर मिले।", area: "बलिया सदर", hoursAgo: 30, views: 2890, tags: ["रोज़गार", "युवा"] },
  { n: 10, cat: "uttar-pradesh", img: "dome", headline: "प्रदेश में ठंड की दस्तक, पूर्वांचल के जिलों में सुबह छाया रहेगा कोहरा", summary: "मौसम विभाग के अनुसार अगले कुछ दिनों में तापमान में गिरावट आएगी। यात्रियों को सावधानी बरतने की सलाह।", area: "", hoursAgo: 34, views: 1470, tags: ["मौसम", "उत्तर प्रदेश"] },
  { n: 11, cat: "tehsil", img: "village", headline: "बेल्थरा रोड क्षेत्र में पेयजल पाइपलाइन का काम पूरा, 12 गाँवों को मिलेगा नल से जल", summary: "जल निगम ने बताया कि परीक्षण के बाद अगले सप्ताह से आपूर्ति शुरू की जाएगी। ग्रामीणों में खुशी।", area: "बेल्थरा रोड", hoursAgo: 40, views: 1320, tags: ["पेयजल", "गाँव"] },
  { n: 12, cat: "ballia-city", img: "bridge", headline: "गंगा पुल पर मरम्मत का काम शुरू, रात में सीमित रहेगा आवागमन", summary: "लोक निर्माण विभाग ने सुरक्षा के मद्देनज़र रात में भारी वाहनों का प्रवेश रोकने का फ़ैसला किया है।", area: "बलिया सदर", hoursAgo: 48, views: 2050, tags: ["पुल", "यातायात"] },
  { n: 13, cat: "education", img: "education", headline: "महाविद्यालय में प्रवेश प्रक्रिया शुरू, ऑनलाइन आवेदन की अंतिम तिथि जारी", summary: "स्नातक और परास्नातक पाठ्यक्रमों के लिए आवेदन आमंत्रित किए गए हैं। हेल्प डेस्क की व्यवस्था की गई है।", area: "बलिया सदर", hoursAgo: 52, views: 1180, tags: ["प्रवेश", "कॉलेज"] },
  { n: 14, cat: "politics", img: "dome", headline: "विधायक निधि से बनेंगे नए सामुदायिक भवन, शिलान्यास कार्यक्रम संपन्न", summary: "तीन विकास खंडों में सामुदायिक भवनों का शिलान्यास हुआ। ग्रामीणों ने समयबद्ध निर्माण की माँग रखी।", area: "बैरिया", hoursAgo: 60, views: 960, tags: ["विकास", "शिलान्यास"] },
  { n: 15, cat: "crime", img: "crime", headline: "साइबर ठगी से बचाव पर जागरूकता शिविर, लोगों को दी गई ज़रूरी जानकारी", summary: "पुलिस ने ओटीपी, फ़र्ज़ी कॉल और लिंक के ज़रिए होने वाली ठगी से बचने के आसान तरीके बताए।", area: "रसड़ा", hoursAgo: 66, views: 1710, tags: ["साइबर", "जागरूकता"] },
  { n: 16, cat: "sports", img: "sports", headline: "खेल महाकुंभ में छात्र-छात्राओं ने दिखाया दम, एथलेटिक्स में बने नए रिकॉर्ड", summary: "तीन दिवसीय आयोजन में सैकड़ों खिलाड़ियों ने भाग लिया। चयनित खिलाड़ी मंडल स्तर पर खेलेंगे।", area: "बलिया सदर", hoursAgo: 72, views: 880, tags: ["खेल", "एथलेटिक्स"] },
];

const body = (s: Seed) =>
  `<p>${s.summary}</p>` +
  `<p>स्थानीय अधिकारियों के अनुसार इस दिशा में कार्य लगातार जारी है और आने वाले दिनों में इसके सकारात्मक परिणाम दिखाई देंगे। संबंधित विभाग ने नागरिकों से सहयोग की अपील की है।</p>` +
  `<h2>क्या कहते हैं स्थानीय लोग</h2>` +
  `<p>क्षेत्र के निवासियों ने इस पहल का स्वागत किया और उम्मीद जताई कि काम समय पर पूरा होगा। कई लोगों ने सुझाव दिए कि पारदर्शिता बनी रहे और शिकायतों का त्वरित निपटारा हो।</p>` +
  `<blockquote>हमें भरोसा है कि यह कदम बलिया के विकास में मददगार साबित होगा।</blockquote>` +
  `<p>अधिक जानकारी के लिए ${config.site.name} पर बने रहें। यह एक नमूना खबर है; असली खबरें एडमिन पैनल से जोड़ी जाएँगी।</p>`;

export const sampleNews: SampleNews[] = seeds.map((s) => {
  const t = new Date(BASE - s.hoursAgo * 3600_000).toISOString();
  return {
    id: `sample-${s.n}`, headline: s.headline, slug: `sample-${s.n}`, summary: s.summary, content: body(s),
    main_image: `/samples/${s.img}.svg`, image_caption: "प्रतीकात्मक चित्र", category_id: s.cat, area: s.area || null,
    tags: s.tags, youtube_url: null, writer_name: config.site.name, author_id: null,
    is_breaking: !!s.breaking, breaking_set_at: s.breaking ? t : null, is_featured: !!s.featured, featured_at: s.featured ? t : null,
    status: "published", view_count: s.views, published_at: t, created_at: t, updated_at: t,
    category: { name: catName(s.cat), slug: s.cat },
  };
});

const videoIds = new Set(seeds.filter((s) => s.video).map((s) => `sample-${s.n}`));
export const sampleVideos = sampleNews.filter((n) => videoIds.has(n.id));

export const sampleNewsBySlug = (slug: string) => sampleNews.find((n) => n.slug === slug) ?? null;

// Illustrations used when a story has no photo (or only the grey placeholder).
const byCategory: Record<string, string[]> = {
  "ballia-city": ["ghat", "road", "bridge"],
  tehsil: ["village", "farm"],
  crime: ["crime"],
  politics: ["politics", "dome"],
  education: ["education"],
  sports: ["sports"],
  agriculture: ["farm"],
  culture: ["temple", "ghat"],
  jobs: ["office"],
  "uttar-pradesh": ["dome", "bridge"],
};

export function fallbackImage(categorySlug: string | undefined, key: string): string {
  const list = byCategory[categorySlug ?? ""] ?? ["ghat", "bridge", "dome"];
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `/samples/${list[h % list.length]}.svg`;
}

export const needsFallbackImage = (src: string | null | undefined) => !src || src === "/default-news.svg";
