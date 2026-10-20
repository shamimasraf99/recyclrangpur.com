-- Development Seed Script: 001_seed_initial_data.sql
-- Bangladesh Used Products Marketplace (BikroyBD)

-- 1. Seed Roles
INSERT INTO roles (id, name, display_name_bn, display_name_en, description) VALUES
(1, 'guest', 'অতিথি', 'Guest', 'Unauthenticated public visitor'),
(2, 'user', 'ব্যবহারকারী', 'User', 'Standard authenticated user capable of listing and contacting sellers'),
(3, 'moderator', 'মডারেটর', 'Moderator', 'Listing reviewer and report triage staff'),
(4, 'admin', 'অ্যাডমিন', 'Admin', 'Platform administrator with category and user management rights'),
(5, 'super_admin', 'সুপার অ্যাডমিন', 'Super Admin', 'Full system access and role assignment privileges')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Seed Permissions
INSERT INTO permissions (id, code, module, description) VALUES
(1, 'listings:view:approved', 'listings', 'Browse public approved listings'),
(2, 'listings:search', 'listings', 'Execute keyword, category, and geo search'),
(3, 'seller:contact:view', 'seller', 'View seller phone and whatsapp contact details'),
(4, 'listings:create', 'listings', 'Publish new product listings'),
(5, 'listings:edit:own', 'listings', 'Update owned listings'),
(6, 'listings:delete:own', 'listings', 'Delete or archive owned listings'),
(7, 'listings:mark_sold:own', 'listings', 'Mark owned listings as sold or reserved'),
(8, 'wishlist:manage', 'wishlist', 'Add or remove items from personal wishlist'),
(9, 'reports:create', 'reports', 'Submit violation report against listing or user'),
(10, 'listings:moderate', 'moderation', 'Approve or reject pending listings'),
(11, 'listings:view:pending', 'moderation', 'View moderation queue'),
(12, 'reports:review', 'moderation', 'Investigate and resolve abuse reports'),
(13, 'users:view_all', 'users', 'View all registered users and account status'),
(14, 'users:suspend', 'users', 'Suspend or ban abusive user accounts'),
(15, 'categories:manage', 'categories', 'Create and modify marketplace categories'),
(16, 'banners:manage', 'marketing', 'Upload and configure promotional banners'),
(17, 'settings:view', 'settings', 'Read system configuration'),
(18, 'settings:update', 'settings', 'Modify system configuration parameters'),
(19, 'audit_logs:view', 'audit', 'Inspect system audit trail'),
(20, 'admins:manage_roles', 'admin', 'Assign and revoke admin/moderator roles'),
(21, 'system:critical_config', 'system', 'Modify security and root server parameters')
ON DUPLICATE KEY UPDATE code=VALUES(code);

-- 3. Map Roles to Permissions
-- Guest (1, 2, 3)
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3);

-- User (1-9)
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7), (2, 8), (2, 9);

-- Moderator (1-12)
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6), (3, 7), (3, 8), (3, 9), (3, 10), (3, 11), (3, 12);

-- Admin (1-19)
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6), (4, 7), (4, 8), (4, 9), (4, 10), (4, 11), (4, 12), (4, 13), (4, 14), (4, 15), (4, 16), (4, 17), (4, 18), (4, 19);

-- Super Admin (All 1-21)
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6), (5, 7), (5, 8), (5, 9), (5, 10), (5, 11), (5, 12), (5, 13), (5, 14), (5, 15), (5, 16), (5, 17), (5, 18), (5, 19), (5, 20), (5, 21);

-- 4. Seed Bangladesh 8 Divisions
INSERT INTO locations_divisions (id, name_bn, name_en, slug, sort_order) VALUES
(1, 'ঢাকা', 'Dhaka', 'dhaka', 1),
(2, 'চট্টগ্রাম', 'Chattogram', 'chattogram', 2),
(3, 'রাজশাহী', 'Rajshahi', 'rajshahi', 3),
(4, 'খুলনা', 'Khulna', 'khulna', 4),
(5, 'বরিশাল', 'Barishal', 'barishal', 5),
(6, 'সিলেট', 'Sylhet', 'sylhet', 6),
(7, 'রংপুর', 'Rangpur', 'rangpur', 7),
(8, 'ময়মনসিংহ', 'Mymensingh', 'mymensingh', 8)
ON DUPLICATE KEY UPDATE name_bn=VALUES(name_bn);

-- 5. Seed 64 Districts of Bangladesh
INSERT INTO locations_districts (id, division_id, name_bn, name_en, slug, sort_order) VALUES
-- Dhaka Division (1)
(1, 1, 'ঢাকা', 'Dhaka', 'dhaka-dist', 1),
(2, 1, 'গাজীপুর', 'Gazipur', 'gazipur', 2),
(3, 1, 'নারায়ণগঞ্জ', 'Narayanganj', 'narayanganj', 3),
(4, 1, 'টাঙ্গাইল', 'Tangail', 'tangail', 4),
(5, 1, 'নরসিংদী', 'Narsingdi', 'narsingdi', 5),
(6, 1, 'ফরিদপুর', 'Faridpur', 'faridpur', 6),
(7, 1, 'মানিকগঞ্জ', 'Manikganj', 'manikganj', 7),
(8, 1, 'মুন্সীগঞ্জ', 'Munshiganj', 'munshiganj', 8),
(9, 1, 'কিশোরগঞ্জ', 'Kishoreganj', 'kishoreganj', 9),
(10, 1, 'গোপালগঞ্জ', 'Gopalganj', 'gopalganj', 10),
(11, 1, 'মাদারীপুর', 'Madaripur', 'madaripur', 11),
(12, 1, 'রাজবাড়ী', 'Rajbari', 'rajbari', 12),
(13, 1, 'শরীয়তপুর', 'Shariatpur', 'shariatpur', 13),

-- Chattogram Division (2)
(14, 2, 'চট্টগ্রাম', 'Chattogram', 'chattogram-dist', 1),
(15, 2, 'কক্সবাজার', 'Coxs Bazar', 'coxs-bazar', 2),
(16, 2, 'কুমিল্লা', 'Cumilla', 'cumilla', 3),
(17, 2, 'ব্রাহ্মণবাড়িয়া', 'Brahmanbaria', 'brahmanbaria', 4),
(18, 2, 'চাঁদপুর', 'Chandpur', 'chandpur', 5),
(19, 2, 'নোয়াখালী', 'Noakhali', 'noakhali', 6),
(20, 2, 'ফেনী', 'Feni', 'feni', 7),
(21, 2, 'লক্ষ্মীপুর', 'Lakshmipur', 'lakshmipur', 8),
(22, 2, 'রাঙ্গামাটি', 'Rangamati', 'rangamati', 9),
(23, 2, 'বান্দরবান', 'Bandarban', 'bandarban', 10),
(24, 2, 'খাগড়াছড়ি', 'Khagrachhari', 'khagrachhari', 11),

-- Rajshahi Division (3)
(25, 3, 'রাজশাহী', 'Rajshahi', 'rajshahi-dist', 1),
(26, 3, 'বগুড়া', 'Bogura', 'bogura', 2),
(27, 3, 'পাবনা', 'Pabna', 'pabna', 3),
(28, 3, 'সিরাজগঞ্জ', 'Sirajganj', 'sirajganj', 4),
(29, 3, 'নওগাঁ', 'Naogaon', 'naogaon', 5),
(30, 3, 'নাটোর', 'Natore', 'natore', 6),
(31, 3, 'চাঁপাইনবাবগঞ্জ', 'Chapai Nawabganj', 'chapai-nawabganj', 7),
(32, 3, 'জয়পুরহাট', 'Joypurhat', 'joypurhat', 8),

-- Khulna Division (4)
(33, 4, 'খুলনা', 'Khulna', 'khulna-dist', 1),
(34, 4, 'যশোর', 'Jashore', 'jashore', 2),
(35, 4, 'কুষ্টিয়া', 'Kushtia', 'kushtia', 3),
(36, 4, 'ঝিনাইদহ', 'Jhenaidah', 'jhenaidah', 4),
(37, 4, 'সাতক্ষীরা', 'Satkhira', 'satkhira', 5),
(38, 4, 'চুয়াডাঙ্গা', 'Chuadanga', 'chuadanga', 6),
(39, 4, 'মাগুরা', 'Magura', 'magura', 7),
(40, 4, 'মেহেরপুর', 'Meherpur', 'meherpur', 8),
(41, 4, 'নড়াইল', 'Narail', 'narail', 9),
(42, 4, 'বাগেরহাট', 'Bagerhat', 'bagerhat', 10),

-- Barishal Division (5)
(43, 5, 'বরিশাল', 'Barishal', 'barishal-dist', 1),
(44, 5, 'পটুয়াখালী', 'Patuakhali', 'patuakhali', 2),
(45, 5, 'ভোলা', 'Bhola', 'bhola', 3),
(46, 5, 'পিরোজপুর', 'Pirojpur', 'pirojpur', 4),
(47, 5, 'ঝালকাঠি', 'Jhalokathi', 'jhalokathi', 5),
(48, 5, 'বরগুনা', 'Barguna', 'barguna', 6),

-- Sylhet Division (6)
(49, 6, 'সিলেট', 'Sylhet', 'sylhet-dist', 1),
(50, 6, 'মৌলভীবাজার', 'Moulvibazar', 'moulvibazar', 2),
(51, 6, 'হবিগঞ্জ', 'Habiganj', 'habiganj', 3),
(52, 6, 'সুনামগঞ্জ', 'Sunamganj', 'sunamganj', 4),

-- Rangpur Division (7)
(53, 7, 'রংপুর', 'Rangpur', 'rangpur-dist', 1),
(54, 7, 'দিনাজপুর', 'Dinajpur', 'dinajpur', 2),
(55, 7, 'গাইবান্ধা', 'Gaibandha', 'gaibandha', 3),
(56, 7, 'কুড়িগ্রাম', 'Kurigram', 'kurigram', 4),
(57, 7, 'নীলফামারী', 'Nilphamari', 'nilphamari', 5),
(58, 7, 'লালমনিরহাট', 'Lalmonirhat', 'lalmonirhat', 6),
(59, 7, 'ঠাকুরগাঁও', 'Thakurgaon', 'thakurgaon', 7),
(60, 7, 'পঞ্চগড়', 'Panchagarh', 'panchagarh', 8),

-- Mymensingh Division (8)
(61, 8, 'ময়মনসিংহ', 'Mymensingh', 'mymensingh-dist', 1),
(62, 8, 'জামালপুর', 'Jamalpur', 'jamalpur', 2),
(63, 8, 'নেত্রকোণা', 'Netrokona', 'netrokona', 3),
(64, 8, 'শেরপুর', 'Sherpur', 'sherpur', 4)
ON DUPLICATE KEY UPDATE name_bn=VALUES(name_bn);

-- 6. Seed Primary Categories
INSERT INTO categories (id, name_bn, name_en, slug, icon_name, sort_order) VALUES
(1, 'মোবাইল ও গ্যাজেট', 'Mobiles & Gadgets', 'mobiles-gadgets', 'device-phone-mobile', 1),
(2, 'ইলেকট্রনিক্স ও হোম অ্যাপ্লায়েন্স', 'Electronics & Appliances', 'electronics-appliances', 'tv', 2),
(3, 'কম্পিউটার ও ল্যাপটপ', 'Computers & Laptops', 'computers-laptops', 'computer-desktop', 3),
(4, 'মোটরযান ও বাইক', 'Vehicles & Bikes', 'vehicles-bikes', 'truck', 4),
(5, 'ফার্নিচার ও গৃহসজ্জা', 'Furniture & Home Decor', 'furniture-decor', 'home', 5),
(6, 'ফ্যাশন ও লাইফস্টাইল', 'Fashion & Lifestyle', 'fashion-lifestyle', 'sparkles', 6),
(7, 'শখ, খেলাধুলা ও ফিটনেস', 'Hobbies, Sports & Fitness', 'hobbies-sports', 'trophy', 7),
(8, 'ব্যবসা ও শিল্প সরঞ্জাম', 'Business & Industrial Tools', 'business-tools', 'briefcase', 8)
ON DUPLICATE KEY UPDATE name_bn=VALUES(name_bn);

-- 7. Seed Common Subcategories
INSERT INTO subcategories (id, category_id, name_bn, name_en, slug, sort_order) VALUES
-- Mobiles (1)
(1, 1, 'স্মার্টফোন', 'Smartphones', 'smartphones', 1),
(2, 1, 'ফিচার ফোন', 'Feature Phones', 'feature-phones', 2),
(3, 1, 'ট্যাবলেট', 'Tablets', 'tablets', 3),
(4, 1, 'মোবাইল এক্সেসরিজ', 'Mobile Accessories', 'mobile-accessories', 4),

-- Electronics (2)
(5, 2, 'টেলিভিশন ও স্পিকার', 'TV & Speakers', 'tv-speakers', 1),
(6, 2, 'রেফ্রিজারেটর ও ডিপ ফ্রিজ', 'Refrigerators & Freezers', 'refrigerators', 2),
(7, 2, 'এয়ার কন্ডিশনার (AC)', 'Air Conditioners', 'ac', 3),
(8, 2, 'ক্যামেরা ও ড্রোন', 'Cameras & Drones', 'cameras', 4),

-- Computers (3)
(9, 3, 'ল্যাপটপ', 'Laptops', 'laptops', 1),
(10, 3, 'ডেস্কটপ পিসি', 'Desktop PCs', 'desktop-pcs', 2),
(11, 3, 'গ্রাফিক্স কার্ড ও হার্ডওয়্যার', 'Hardware & GPU', 'hardware-gpu', 3),
(12, 3, 'মনিটর ও প্রিন্টার', 'Monitors & Printers', 'monitors-printers', 4),

-- Vehicles (4)
(13, 4, 'মোটরসাইকেল ও স্কুটার', 'Motorcycles & Scooters', 'motorcycles', 1),
(14, 4, 'ব্যক্তিগত গাড়ি ও কার', 'Cars', 'cars', 2),
(15, 4, 'বাইসাইকেল', 'Bicycles', 'bicycles', 3),
(16, 4, 'গাড়ির যন্ত্রাংশ', 'Auto Parts', 'auto-parts', 4),

-- Furniture (5)
(17, 5, 'খাট ও ওয়ার্ডরোব', 'Beds & Wardrobes', 'beds-wardrobes', 1),
(18, 5, 'সোফা ও চেয়ার', 'Sofas & Chairs', 'sofas-chairs', 2),
(19, 5, 'ডাইনিং টেবিল', 'Dining Tables', 'dining-tables', 3),

-- Fashion (6)
(20, 6, 'পুরুষদের পোশাক ও ঘড়ি', 'Mens Clothing & Watches', 'mens-clothing', 1),
(21, 6, 'নারীদের পোশাক ও গয়না', 'Womens Clothing & Jewelry', 'womens-clothing', 2),
(22, 6, 'ব্যাগ ও জুতা', 'Bags & Shoes', 'bags-shoes', 3)
ON DUPLICATE KEY UPDATE name_bn=VALUES(name_bn);

-- 8. Seed Platform Settings
INSERT INTO settings (`key`, `value`, `description`, `is_public`) VALUES
('site_name_bn', 'বিক্রয়বিডি', 'বাংলা প্ল্যাটফর্ম নাম', TRUE),
('site_name_en', 'BikroyBD', 'English Platform Name', TRUE),
('currency_symbol', '৳', 'Marketplace currency glyph', TRUE),
('currency_code', 'BDT', 'Marketplace currency code', TRUE),
('max_images_per_listing', '5', 'Max allowed image uploads per ad', TRUE),
('ad_auto_expire_days', '60', 'Listing lifespan in days', FALSE),
('contact_phone_masking_enabled', 'false', 'Enable or disable click-to-reveal phone numbers', TRUE),
('moderation_auto_approve', 'false', 'Auto-approve listings without human moderation', FALSE)
ON DUPLICATE KEY UPDATE `value`=VALUES(`value`);
