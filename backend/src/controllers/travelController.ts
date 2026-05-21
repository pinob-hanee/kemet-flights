import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';

// Pre-seeded high-fidelity luxury Egypt data in case DB queries are empty during seed phase
const LUXURY_HOTELS_SEED = [
  {
    id: "hotel-mena-house",
    nameEn: "Marriott Mena House, Giza",
    nameAr: "ماريوت مينا هاوس، الجيزة",
    descriptionEn: "Experience the ultimate pharaonic luxury. Nestled in the shadow of the Great Pyramids, this legendary 5-star hotel has hosted royalty and celebrities since 1869, surrounded by 40 acres of lush gardens.",
    descriptionAr: "جرب الفخامة الفرعونية المطلقة. يقع هذا الفندق الأسطوري ذو الـ 5 نجوم في ظل الأهرامات الكبرى، وقد استضاف الملوك والمشاهير منذ عام 1869، وتحيط به 40 فدانًا من الحدائق المورقة.",
    starRating: 5,
    addressEn: "Al Haram Street, Giza, Cairo",
    addressAr: "شارع الهرم، الجيزة، القاهرة",
    basePrice: 420.00,
    images: [
      "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80"
    ],
    amenities: ["Pyramid View Suites", "Gourmet Dining", "Infinity Pool", "Royal Spa", "Helipad"],
    rooms: [
      { id: "room-pyramid-deluxe", typeEn: "Deluxe Pyramid View Suite", typeAr: "جناح ديلوكس مطل على الأهرامات", pricePerNight: 550.00, capacity: 2 },
      { id: "room-garden-exec", typeEn: "Executive Garden Oasis Room", typeAr: "غرفة تنفيذية مطلة على الحديقة", pricePerNight: 420.00, capacity: 2 }
    ]
  },
  {
    id: "hotel-old-cataract",
    nameEn: "Sofitel Legend Old Cataract, Aswan",
    nameAr: "سوفيتيل ليجند أولد كاتاراكت، أسوان",
    descriptionEn: "A majestic Victorian Palace situated on a pink granite cliff overlooking the Nile River, facing Elephantine Island. An elegant blend of French art de vivre and traditional Nubian character.",
    descriptionAr: "قصر فيكتوري مهيب يقع على منحدر من الجرانيت الوردي يطل على نهر النيل، ويواجه جزيرة إلفنتين. مزيج أنيق من الفن الفرنسي والطابع النوبي التقليدي.",
    starRating: 5,
    addressEn: "Abtal Al Tahrir Street, Aswan",
    addressAr: "شارع أبطال التحرير، أسوان",
    basePrice: 480.00,
    images: [
      "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
    ],
    amenities: ["Nile Terrace High Tea", "Agatha Christie Suite", "Historical Gardens", "Hammam Spa"],
    rooms: [
      { id: "room-nile-royal", typeEn: "Royal Nile Suite", typeAr: "جناح النيل الملكي", pricePerNight: 750.00, capacity: 2 },
      { id: "room-palace-classic", typeEn: "Palace Classic Room", typeAr: "غرفة القصر الكلاسيكية", pricePerNight: 480.00, capacity: 2 }
    ]
  },
  {
    id: "hotel-nile-plaza",
    nameEn: "Four Seasons Nile Plaza, Garden City",
    nameAr: "فور سيزونز نايل بلازا، جاردن سيتي",
    descriptionEn: "Rising in the heart of modern Cairo along the Nile, this contemporary luxury tower offers panoramas of the river, multiple Michelin-caliber restaurants, and an elite art collection.",
    descriptionAr: "يرتفع هذا البرج الفاخر المعاصر في قلب القاهرة الحديثة على طول نهر النيل، ويقدم إطلالات بانورامية على النهر، ومطاعم متعددة من عيار ميشلان، ومجموعة فنية نخبوية.",
    starRating: 5,
    addressEn: "Corniche El Nil, Garden City, Cairo",
    addressAr: "كورنيش النيل، جاردن سيتي، القاهرة",
    basePrice: 510.00,
    images: [
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80"
    ],
    amenities: ["Panoramic Nile Views", "Outdoor Heated Pools", "State-of-the-art Wellness Centre"],
    rooms: [
      { id: "room-fourseasons-royal", typeEn: "Royal Terrace Suite", typeAr: "جناح رويال مع تراس", pricePerNight: 980.00, capacity: 4 },
      { id: "room-fourseasons-exec", typeEn: "Executive Nile Room", typeAr: "غرفة النيل التنفيذية", pricePerNight: 510.00, capacity: 2 }
    ]
  }
];

const FLIGHTS_SEED = [
  {
    id: "flight-ms779",
    flightNumber: "MS779",
    airlineEn: "EgyptAir (Star Alliance)",
    airlineAr: "مصر للطيران",
    departureAirport: "LHR (London Heathrow)",
    arrivalAirport: "CAI (Cairo International)",
    departureTime: "2026-06-15T14:30:00Z",
    arrivalTime: "2026-06-15T19:45:00Z",
    priceEconomy: 450.00,
    priceBusiness: 1250.00,
    priceFirstClass: 2400.00,
    baggagePolicyEn: "2 Checked bags (23kg each) + 1 Cabin bag",
    baggagePolicyAr: "حقيبتان مشحونتان (23 كجم لكل منهما) + حقيبة مقصورة واحدة"
  },
  {
    id: "flight-ek927",
    flightNumber: "EK927",
    airlineEn: "Emirates",
    airlineAr: "طيران الإمارات",
    departureAirport: "DXB (Dubai International)",
    arrivalAirport: "CAI (Cairo International)",
    departureTime: "2026-06-16T08:15:00Z",
    arrivalTime: "2026-06-16T11:30:00Z",
    priceEconomy: 380.00,
    priceBusiness: 980.00,
    priceFirstClass: 1850.00,
    baggagePolicyEn: "30kg Checked baggage + 1 Carry-on",
    baggagePolicyAr: "30 كجم أمتعة مشحونة + حقيبة يد واحدة"
  }
];

const TOURS_SEED = [
  {
    id: "tour-giza-vip",
    nameEn: "The Pharaoh's Legacy: VIP Private Tour of Giza & GEM",
    nameAr: "إرث الفرعون: جولة خاصة لكبار الشخصيات في الجيزة والمتحف الكبير",
    descriptionEn: "An ultra-exclusive excursion led by a world-renowned Egyptologist. Skip the queues with VIP private gate passes, access the Sphinx enclosure, tour the Step Pyramid of Saqqara, and view King Tut's treasures inside the Grand Egyptian Museum.",
    descriptionAr: "رحلة حصرية للغاية بقيادة عالم مصريات مشهور عالميًا. تخطى الطوابير ببطاقات مرور خاصة بكبار الشخصيات، وادخل مقصورة أبو الهول، وتجول في هرم سقارة المدرج، وشاهد كنوز الملك توت داخل المتحف المصري الكبير.",
    durationDays: 1,
    price: 350.00,
    images: ["https://images.unsplash.com/photo-1503177119275-0aa32b31d468?auto=format&fit=crop&w=800&q=80"],
    difficulty: "Easy",
    includesEn: ["Private Egyptologist guide", "Luxury Mercedes S-Class transfers", "Five-star lunch overlooking Pyramids", "VIP Express admission tickets"],
    includesAr: ["مرشد خاص في علم المصريات", "انتقالات بمرسيدس الفئة S الفاخرة", "غداء 5 نجوم يطل على الأهرامات", "تذاكر دخول سريعة لكبار الشخصيات"]
  },
  {
    id: "tour-luxor-balloon",
    nameEn: "The Valley of Kings & Sunrise Balloon Adventure",
    nameAr: "وادي الملوك ومغامرة منطاد شروق الشمس",
    descriptionEn: "Ascend at dawn over Luxor's West Bank in a private hot air balloon, witnessing the temples of Karnak and Hatshepsut bathed in golden light. Descend to tour the sacred Valley of the Kings, including access to Nefertari's tomb.",
    descriptionAr: "اصعد عند الفجر فوق الضفة الغربية للأقصر في منطاد هواء ساخن خاص، وشاهد معابد الكرنك وحتشبسوت مغمورة بالضوء الذهبي. انزل لزيارة وادي الملوك المقدس، بما في ذلك دخول مقبرة نفرتاري.",
    durationDays: 2,
    price: 490.00,
    images: ["https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80"],
    difficulty: "Moderate",
    includesEn: ["Hot Air Balloon ride", "VIP entry to Valley of the Kings & Queens", "Luxury Dahabiya lunch", "Bespoke photobook"],
    includesAr: ["ركوب المنطاد الطائر", "دخول سريع لوادي الملوك والملكات", "غداء على دهبية فاخرة", "كتاب صور تذكاري"]
  }
];

const CRUISES_SEED = [
  {
    id: "cruise-nile-royal",
    nameEn: "Kemet Queen: 5-Night Ultra-Luxury Dahabiya Nile Cruise",
    nameAr: "ملكة كيميت: رحلة نيلية فائقة الفخامة لمدة 5 ليالٍ",
    descriptionEn: "Settle into a palatial suite on a private twin-masted sailing Dahabiya. Drift slowly from Esna to Aswan, docking at hidden ancient temples inaccessible to massive cruisers, featuring candlelit temple dinners, organic on-board cuisine, and butler service.",
    descriptionAr: "استقر في جناح فاخر على متن دهبية شراعية خاصة ذات صاريين. انجرف ببطء من إسنا إلى أسوان، ورسو في معابد قديمة خفية لا يمكن للمراكب الكبيرة الوصول إليها، وتتميز بوجبات عشاء على ضوء الشموع في المعابد، ومأكولات عضوية على المتن، وخدمة الخادم الشخصي.",
    durationNights: 5,
    cabinsCount: 8,
    priceSuite: 1850.00,
    priceRoyal: 3200.00,
    images: ["https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=800&q=80"],
    departurePortEn: "Luxor Port",
    departurePortAr: "ميناء الأقصر",
    routePortsEn: ["Luxor", "Esna", "Edfu", "Kom Ombo", "Aswan"],
    routePortsAr: ["الأقصر", "إسنا", "إدفو", "كوم أمبو", "أسوان"]
  }
];

export class TravelController {
  public static async getHotels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Return seed data for instant visual beauty
      res.status(200).json({ success: true, data: LUXURY_HOTELS_SEED });
    } catch (error) {
      next(error);
    }
  }

  public static async getFlights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, data: FLIGHTS_SEED });
    } catch (error) {
      next(error);
    }
  }

  public static async getTours(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, data: TOURS_SEED });
    } catch (error) {
      next(error);
    }
  }

  public static async getCruises(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ success: true, data: CRUISES_SEED });
    } catch (error) {
      next(error);
    }
  }
}
export default TravelController;
