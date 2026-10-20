/**
 * RECYCL RANGPUR — RANGPUR CITY FIXTURES
 * Scoped exclusively to Rangpur Metropolitan City (রংপুর শহর) and its neighborhoods/thanas.
 */
import { Category, Division, District, Product, User } from '../../../shared/types';

// Single city scope: Rangpur Metropolitan City
export const FIXTURE_DIVISIONS: Division[] = [
  { id: 1, nameBn: 'রংপুর শহর (মেট্রোপলিটন)', nameEn: 'Rangpur City (Metropolitan)', slug: 'rangpur-city', sortOrder: 1, isActive: true },
];

// Neighborhoods / Areas inside Rangpur City
export const FIXTURE_DISTRICTS: District[] = [
  { id: 1, divisionId: 1, nameBn: 'জাহাজ কোম্পানি মোড়', nameEn: 'Jahaj Company More', slug: 'jahaj-company-more', sortOrder: 1, isActive: true },
  { id: 2, divisionId: 1, nameBn: 'ধাপ ও মেডিকেল মোড়', nameEn: 'Dhap & Medical More', slug: 'dhap-medical-more', sortOrder: 2, isActive: true },
  { id: 3, divisionId: 1, nameBn: 'শাপলা চত্বর ও স্টেশন রোড', nameEn: 'Shapla Chattar & Station Road', slug: 'shapla-chattar', sortOrder: 3, isActive: true },
  { id: 4, divisionId: 1, nameBn: 'লালবাগ ও পার্কের মোড় (বেরোবি)', nameEn: 'Lalbag & Park More (BRUR)', slug: 'lalbag-park-more', sortOrder: 4, isActive: true },
  { id: 5, divisionId: 1, nameBn: 'কাচারী বাজার ও টাউন হল', nameEn: 'Kachari Bazar & Town Hall', slug: 'kachari-bazar', sortOrder: 5, isActive: true },
  { id: 6, divisionId: 1, nameBn: 'পায়রা চত্বর ও সেন্ট্রাল রোড', nameEn: 'Payra Chattar & Central Road', slug: 'payra-chattar', sortOrder: 6, isActive: true },
  { id: 7, divisionId: 1, nameBn: 'মডার্ন মোড় ও তাজহাট', nameEn: 'Modern More & Tajhat', slug: 'modern-more-tajhat', sortOrder: 7, isActive: true },
  { id: 8, divisionId: 1, nameBn: 'মাহিগঞ্জ ও সাতমাথা', nameEn: 'Mahiganj & Satmatha', slug: 'mahiganj-satmatha', sortOrder: 8, isActive: true },
  { id: 9, divisionId: 1, nameBn: 'সিও বাজার ও ক্যান্টনমেন্ট রোড', nameEn: 'CO Bazar & Cantonment Road', slug: 'co-bazar', sortOrder: 9, isActive: true },
];

export const FIXTURE_CATEGORIES: Category[] = [
  {
    id: 1,
    nameBn: 'মোবাইল ও গ্যাজেট',
    nameEn: 'Mobiles & Gadgets',
    slug: 'mobiles-gadgets',
    iconName: 'Smartphone',
    sortOrder: 1,
    isActive: true,
    subcategories: [
      { id: 1, categoryId: 1, nameBn: 'স্মার্টফোন', nameEn: 'Smartphones', slug: 'smartphones', sortOrder: 1, isActive: true },
      { id: 2, categoryId: 1, nameBn: 'ট্যাবলেট', nameEn: 'Tablets', slug: 'tablets', sortOrder: 2, isActive: true },
      { id: 3, categoryId: 1, nameBn: 'মোবাইল এক্সেসরিজ', nameEn: 'Accessories', slug: 'accessories', sortOrder: 3, isActive: true }
    ]
  },
  {
    id: 2,
    nameBn: 'কম্পিউটার ও ল্যাপটপ',
    nameEn: 'Computers & Laptops',
    slug: 'computers-laptops',
    iconName: 'Laptop',
    sortOrder: 2,
    isActive: true,
    subcategories: [
      { id: 4, categoryId: 2, nameBn: 'ল্যাপটপ', nameEn: 'Laptops', slug: 'laptops', sortOrder: 1, isActive: true },
      { id: 5, categoryId: 2, nameBn: 'ডেস্কটপ পিসি', nameEn: 'Desktop PCs', slug: 'desktop-pcs', sortOrder: 2, isActive: true },
      { id: 6, categoryId: 2, nameBn: 'মনিটর ও হার্ডওয়্যার', nameEn: 'Monitors & Hardware', slug: 'hardware', sortOrder: 3, isActive: true }
    ]
  },
  {
    id: 3,
    nameBn: 'মোটরবাইক ও সাইকেল',
    nameEn: 'Bikes & Bicycles',
    slug: 'vehicles-bikes',
    iconName: 'Bike',
    sortOrder: 3,
    isActive: true,
    subcategories: [
      { id: 7, categoryId: 3, nameBn: 'মোটরসাইকেল', nameEn: 'Motorcycles', slug: 'motorcycles', sortOrder: 1, isActive: true },
      { id: 8, categoryId: 3, nameBn: 'স্কুটার ও ই-বাইক', nameEn: 'Scooters & E-Bikes', slug: 'cars', sortOrder: 2, isActive: true },
      { id: 9, categoryId: 3, nameBn: 'বাইসাইকেল', nameEn: 'Bicycles', slug: 'bicycles', sortOrder: 3, isActive: true }
    ]
  },
  {
    id: 4,
    nameBn: 'ইলেকট্রনিক্স ও হোম অ্যাপ্লায়েন্স',
    nameEn: 'Electronics & Appliances',
    slug: 'electronics-appliances',
    iconName: 'Tv',
    sortOrder: 4,
    isActive: true,
    subcategories: [
      { id: 10, categoryId: 4, nameBn: 'টেলিভিশন ও স্পিকার', nameEn: 'TVs & Speakers', slug: 'tvs', sortOrder: 1, isActive: true },
      { id: 11, categoryId: 4, nameBn: 'ফ্রিজ ও সোলার আইপিএস', nameEn: 'Refrigerators & IPS', slug: 'refrigerators', sortOrder: 2, isActive: true },
      { id: 12, categoryId: 4, nameBn: 'ক্যামেরা ও লেন্স', nameEn: 'Cameras', slug: 'cameras', sortOrder: 3, isActive: true }
    ]
  },
  {
    id: 5,
    nameBn: 'ফার্নিচার ও গৃহসজ্জা',
    nameEn: 'Furniture & Decor',
    slug: 'furniture-decor',
    iconName: 'Armchair',
    sortOrder: 5,
    isActive: true,
    subcategories: [
      { id: 13, categoryId: 5, nameBn: 'সোফা ও ডাইনিং সেট', nameEn: 'Sofas & Dining Sets', slug: 'sofas', sortOrder: 1, isActive: true },
      { id: 14, categoryId: 5, nameBn: 'খাট ও ওয়ার্ডরোব', nameEn: 'Beds & Wardrobes', slug: 'beds', sortOrder: 2, isActive: true }
    ]
  },
  {
    id: 6,
    nameBn: 'ফ্যাশন ও লাইফস্টাইল',
    nameEn: 'Fashion & Lifestyle',
    slug: 'fashion-lifestyle',
    iconName: 'Shirt',
    sortOrder: 6,
    isActive: true,
    subcategories: [
      { id: 15, categoryId: 6, nameBn: 'ঘড়ি ও এক্সেসরিজ', nameEn: 'Watches & Accessories', slug: 'watches', sortOrder: 1, isActive: true }
    ]
  }
];

export const FIXTURE_USERS: User[] = [
  {
    id: 101,
    uuid: 'usr-101-rgp',
    fullName: 'তানভীর আহমেদ',
    email: 'tanvir.ahmed@example.com',
    phoneNumber: '01711223344',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    bio: 'টেকপ্রেমী এবং গ্যাজেট সংগ্রাহক। জাহাজ কোম্পানি মোড়, রংপুর শহর।',
    isVerified: true,
    isSuspended: false,
    preferredLanguage: 'bn',
    roles: ['user'],
    permissions: ['listings:create', 'listings:edit:own', 'wishlist:manage'],
    createdAt: '2025-11-10T10:00:00Z',
    updatedAt: '2026-02-15T12:00:00Z'
  },
  {
    id: 102,
    uuid: 'usr-102-rgp',
    fullName: 'রাশেদুল করিম',
    email: 'rashed.karim@example.com',
    phoneNumber: '01819876543',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    bio: 'জেনুইন প্রোডাক্ট বিক্রয়ের বিশ্বস্ত প্রোফাইল। ধাপ, মেডিকেল মোড়, রংপুর শহর।',
    isVerified: true,
    isSuspended: false,
    preferredLanguage: 'bn',
    roles: ['user'],
    permissions: ['listings:create', 'listings:edit:own'],
    createdAt: '2026-01-05T08:30:00Z',
    updatedAt: '2026-03-01T09:20:00Z'
  },
  {
    id: 103,
    uuid: 'mod-103-rgp',
    fullName: 'নুসরাত জাহান (মডারেটর)',
    email: 'moderator@recyclrangpur.local',
    phoneNumber: '01611002233',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    bio: 'Content Moderation & Trust Safety Officer (Admin Domain Only)',
    isVerified: true,
    isSuspended: false,
    preferredLanguage: 'bn',
    roles: ['moderator'],
    permissions: [
      'listings:moderate',
      'listings:view:pending',
      'reports:review'
    ],
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z'
  },
  {
    id: 104,
    uuid: 'adm-104-rgp',
    fullName: 'মাহমুদুল হাসান (অ্যাডমিন)',
    email: 'ops.admin@recyclrangpur.local',
    phoneNumber: '01511004455',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80',
    bio: 'Recycl Rangpur Operations Administrator (Admin Domain Only)',
    isVerified: true,
    isSuspended: false,
    preferredLanguage: 'bn',
    roles: ['admin'],
    permissions: [
      'listings:moderate',
      'listings:view:pending',
      'reports:review',
      'users:view_all',
      'users:suspend',
      'categories:manage',
      'banners:manage',
      'settings:view',
      'audit_logs:view'
    ],
    createdAt: '2025-06-15T00:00:00Z',
    updatedAt: '2026-01-10T00:00:00Z'
  },
  {
    id: 999,
    uuid: 'super-admin-001',
    fullName: 'প্রধান সিস্টেম কন্ট্রোলার (Super Admin)',
    email: 'security.root@recyclrangpur.local',
    phoneNumber: '01900000001',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    bio: 'Recycl Rangpur Root Security & System Governance (Admin Domain Only)',
    isVerified: true,
    isSuspended: false,
    preferredLanguage: 'bn',
    roles: ['super_admin'],
    permissions: [
      'listings:moderate',
      'listings:view:pending',
      'reports:review',
      'users:view_all',
      'users:suspend',
      'categories:manage',
      'banners:manage',
      'settings:view',
      'settings:update',
      'audit_logs:view',
      'admins:manage_roles',
      'system:critical_config'
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  }
];

export const FIXTURE_PRODUCTS: Product[] = [
  {
    id: 1,
    uuid: 'prod-iphone-14-pro',
    sellerId: 101,
    seller: {
      id: 101,
      fullName: 'তানভীর আহমেদ',
      phoneNumber: '01711223344',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      createdAt: '2025-11-10T10:00:00Z'
    },
    title: 'iPhone 14 Pro Max - 256GB Deep Purple (অরিজিনাল বক্সসহ)',
    slug: 'iphone-14-pro-max-256gb-deep-purple',
    description: '১ বছর ব্যবহৃত কিন্তু ফুল ফ্রেশ কন্ডিশন। ব্যাটারি হেলথ ৮৮%। সাথে অরিজিনাল ক্যাবল ও বক্স দেওয়া হবে। রংপুর শহরের জাহাজ কোম্পানি মোড়ে সরাসরি দেখে নিতে পারবেন।',
    categoryId: 1,
    category: FIXTURE_CATEGORIES[0],
    subcategoryId: 1,
    subcategory: FIXTURE_CATEGORIES[0].subcategories![0],
    priceBdt: 88500,
    isNegotiable: true,
    condition: 'like_new',
    divisionId: 1,
    division: FIXTURE_DIVISIONS[0],
    districtId: 1,
    district: FIXTURE_DISTRICTS[0],
    areaDetails: 'জাহাজ কোম্পানি মোড়, রংপুর শহর',
    contactPhone: '01711223344',
    hidePhone: false,
    allowWhatsapp: true,
    moderationStatus: 'approved',
    availabilityStatus: 'available',
    viewsCount: 342,
    isFeatured: true,
    images: [
      {
        id: 1,
        productId: 1,
        imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=900&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&auto=format&fit=crop&q=80',
        sortOrder: 1,
        isPrimary: true
      },
      {
        id: 2,
        productId: 1,
        imageUrl: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=900&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=300&auto=format&fit=crop&q=80',
        sortOrder: 2,
        isPrimary: false
      }
    ],
    createdAt: '2026-10-14T09:15:00Z',
    updatedAt: '2026-10-15T10:00:00Z'
  },
  {
    id: 2,
    uuid: 'prod-macbook-air-m2',
    sellerId: 101,
    seller: {
      id: 101,
      fullName: 'তানভীর আহমেদ',
      phoneNumber: '01711223344',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      createdAt: '2025-11-10T10:00:00Z'
    },
    title: 'MacBook Air M2 (2022) 8/256GB Midnight Blue',
    slug: 'macbook-air-m2-2022-8-256gb',
    description: 'খুবই কম ব্যবহৃত ল্যাপটপ। ফ্রিল্যান্সিং কাজের জন্য নেওয়া হয়েছিল। ব্যাটারি সাইকেল কাউন্ট মাত্র ৪২। ধাপ, মেডিকেল মোড়, রংপুর শহরে সরাসরি এসে দেখে নিতে পারবেন।',
    categoryId: 2,
    category: FIXTURE_CATEGORIES[1],
    subcategoryId: 4,
    subcategory: FIXTURE_CATEGORIES[1].subcategories![0],
    priceBdt: 96000,
    isNegotiable: false,
    condition: 'like_new',
    divisionId: 1,
    division: FIXTURE_DIVISIONS[0],
    districtId: 2,
    district: FIXTURE_DISTRICTS[1],
    areaDetails: 'ধাপ, মেডিকেল মোড়, রংপুর শহর',
    contactPhone: '01711223344',
    hidePhone: false,
    allowWhatsapp: true,
    moderationStatus: 'approved',
    availabilityStatus: 'available',
    viewsCount: 520,
    isFeatured: true,
    images: [
      {
        id: 3,
        productId: 2,
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&auto=format&fit=crop&q=80',
        sortOrder: 1,
        isPrimary: true
      }
    ],
    createdAt: '2026-10-15T14:20:00Z',
    updatedAt: '2026-10-15T14:20:00Z'
  },
  {
    id: 3,
    uuid: 'prod-yamaha-r15-v3',
    sellerId: 102,
    seller: {
      id: 102,
      fullName: 'রাশেদুল করিম',
      phoneNumber: '01819876543',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      createdAt: '2026-01-05T08:30:00Z'
    },
    title: 'Yamaha R15 V3 Dual ABS (রংপুর বিআরটিএ রেজিস্ট্রেশন)',
    slug: 'yamaha-r15-v3-dual-abs-indonesian',
    description: 'রংপুর বিআরটিএ ডিজিটাল নাম্বার প্লেট ও স্মার্ট কার্ড। মোট ১৮,০০০ কিমি চলা। লালবাগ ও পার্কের মোড় এলাকায় সরাসরি টেস্ট রাইড দিয়ে দেখে নিতে পারবেন।',
    categoryId: 3,
    category: FIXTURE_CATEGORIES[2],
    subcategoryId: 7,
    subcategory: FIXTURE_CATEGORIES[2].subcategories![0],
    priceBdt: 365000,
    isNegotiable: true,
    condition: 'good',
    divisionId: 1,
    division: FIXTURE_DIVISIONS[0],
    districtId: 4,
    district: FIXTURE_DISTRICTS[3],
    areaDetails: 'লালবাগ ও পার্কের মোড়, রংপুর শহর',
    contactPhone: '01819876543',
    hidePhone: false,
    allowWhatsapp: true,
    moderationStatus: 'approved',
    availabilityStatus: 'available',
    viewsCount: 1240,
    isFeatured: true,
    images: [
      {
        id: 4,
        productId: 3,
        imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=900&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=300&auto=format&fit=crop&q=80',
        sortOrder: 1,
        isPrimary: true
      }
    ],
    createdAt: '2026-10-12T11:00:00Z',
    updatedAt: '2026-10-16T12:00:00Z'
  },
  {
    id: 4,
    uuid: 'prod-sony-bravia-55',
    sellerId: 102,
    seller: {
      id: 102,
      fullName: 'রাশেদুল করিম',
      phoneNumber: '01819876543',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      createdAt: '2026-01-05T08:30:00Z'
    },
    title: 'Sony Bravia 55 Inch 4K UHD Smart Google TV',
    slug: 'sony-bravia-55-inch-4k-uhd',
    description: 'সনি ব্রাভিয়া অরিজিনাল প্যানেল। ডলবি অডিও ও ভিশন সাপোর্ট। সাথে অরিজিনাল ভয়েস রিমোট ও ওয়াল মাউন্ট দেওয়া হবে। কাচারী বাজার ও টাউন হল সংলগ্ন বাসায় দেখে নিতে পারবেন।',
    categoryId: 4,
    category: FIXTURE_CATEGORIES[3],
    subcategoryId: 10,
    subcategory: FIXTURE_CATEGORIES[3].subcategories![0],
    priceBdt: 58000,
    isNegotiable: true,
    condition: 'good',
    divisionId: 1,
    division: FIXTURE_DIVISIONS[0],
    districtId: 5,
    district: FIXTURE_DISTRICTS[4],
    areaDetails: 'কাচারী বাজার ও টাউন হল, রংপুর শহর',
    contactPhone: '01819876543',
    hidePhone: false,
    allowWhatsapp: true,
    moderationStatus: 'approved',
    availabilityStatus: 'available',
    viewsCount: 180,
    isFeatured: false,
    images: [
      {
        id: 5,
        productId: 4,
        imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=900&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300&auto=format&fit=crop&q=80',
        sortOrder: 1,
        isPrimary: true
      }
    ],
    createdAt: '2026-10-16T08:00:00Z',
    updatedAt: '2026-10-16T08:00:00Z'
  },
  {
    id: 5,
    uuid: 'prod-l-shaped-sofa',
    sellerId: 101,
    seller: {
      id: 101,
      fullName: 'তানভীর আহমেদ',
      phoneNumber: '01711223344',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      createdAt: '2025-11-10T10:00:00Z'
    },
    title: 'সেগুন কাঠের এল-শেপ ৭ সিটার বিলাসবহুল সোফা সেট',
    slug: 'segun-wood-l-shaped-sofa-set',
    description: 'বাসা শিফট করার কারণে বিক্রি করা হচ্ছে। খাঁটি চিটাগাং সেগুন কাঠের তৈরি। শাপলা চত্বর ও স্টেশন রোড, রংপুর শহরে সরাসরি এসে দেখে নিতে পারবেন।',
    categoryId: 5,
    category: FIXTURE_CATEGORIES[4],
    subcategoryId: 13,
    subcategory: FIXTURE_CATEGORIES[4].subcategories![0],
    priceBdt: 42000,
    isNegotiable: true,
    condition: 'fair',
    divisionId: 1,
    division: FIXTURE_DIVISIONS[0],
    districtId: 3,
    district: FIXTURE_DISTRICTS[2],
    areaDetails: 'শাপলা চত্বর ও স্টেশন রোড, রংপুর শহর',
    contactPhone: '01711223344',
    hidePhone: true,
    allowWhatsapp: true,
    moderationStatus: 'approved',
    availabilityStatus: 'available',
    viewsCount: 215,
    isFeatured: false,
    images: [
      {
        id: 6,
        productId: 5,
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&auto=format&fit=crop&q=80',
        sortOrder: 1,
        isPrimary: true
      }
    ],
    createdAt: '2026-10-17T06:30:00Z',
    updatedAt: '2026-10-17T06:30:00Z'
  },
  {
    id: 6,
    uuid: 'prod-nikon-d750-body',
    sellerId: 102,
    seller: {
      id: 102,
      fullName: 'রাশেদুল করিম',
      phoneNumber: '01819876543',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      createdAt: '2026-01-05T08:30:00Z'
    },
    title: 'Nikon D750 Full Frame DSLR Body Only (যন্ত্রাংশের জন্য / For Parts)',
    slug: 'nikon-d750-dslr-body-for-parts',
    description: 'ক্যামেরার শাটার এরর এসেছে। কম দামে যন্ত্রাংশ বা পার্টসের প্রয়োজনে যেকেউ নিতে পারেন। পায়রা চত্বর ও সেন্ট্রাল রোড, রংপুর শহরে যোগাযোগ করুন।',
    categoryId: 4,
    category: FIXTURE_CATEGORIES[3],
    subcategoryId: 12,
    subcategory: FIXTURE_CATEGORIES[3].subcategories![1],
    priceBdt: 18500,
    isNegotiable: true,
    condition: 'for_parts',
    divisionId: 1,
    division: FIXTURE_DIVISIONS[0],
    districtId: 6,
    district: FIXTURE_DISTRICTS[5],
    areaDetails: 'পায়রা চত্বর ও সেন্ট্রাল রোড, রংপুর শহর',
    contactPhone: '01819876543',
    hidePhone: false,
    allowWhatsapp: true,
    moderationStatus: 'approved',
    availabilityStatus: 'available',
    viewsCount: 95,
    isFeatured: false,
    images: [
      {
        id: 7,
        productId: 6,
        imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=900&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&auto=format&fit=crop&q=80',
        sortOrder: 1,
        isPrimary: true
      }
    ],
    createdAt: '2026-10-17T12:00:00Z',
    updatedAt: '2026-10-17T12:00:00Z'
  }
];
