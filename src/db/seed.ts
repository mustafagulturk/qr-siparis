import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { createDb } from "./index";
import { categories, orderItems, orders, products, tables, users } from "./schema";

// Örnek veri: Gaziantep mutfağından bir menü
const MENU = [
  {
    name: "Çorbalar",
    items: [
      ["Ezogelin Çorbası", "Kırmızı mercimek, bulgur ve nane ile", 9000, "🥣"],
      ["Yuvalama Çorbası", "Gaziantep'in meşhur yoğurtlu köfteli çorbası", 14000, "🥣"],
    ],
  },
  {
    name: "Kebaplar",
    items: [
      ["Ali Nazik", "Közlenmiş patlıcanlı yoğurt üzerinde kuzu kıyma", 42000, "🍢"],
      ["Simit Kebabı", "İnce bulgurlu, bol baharatlı Antep usulü kebap", 38000, "🍢"],
      ["Beyti Sarma", "Lavaşa sarılı, yoğurt ve tereyağlı sos ile", 44000, "🌯"],
      ["Lahmacun", "İnce hamur, taze kıyma, yanında yeşillik", 12000, "🫓"],
    ],
  },
  {
    name: "Tatlılar",
    items: [
      ["Fıstıklı Baklava", "Porsiyon, 4 dilim Antep fıstıklı", 26000, "🥮"],
      ["Katmer", "Kaymak ve Antep fıstığı ile, 2 kişilik", 32000, "🥞"],
      ["Künefe", "Sıcak servis, üzeri fıstıklı", 22000, "🧀"],
    ],
  },
  {
    name: "İçecekler",
    items: [
      ["Ayran", "Yayık ayranı", 4000, "🥛"],
      ["Şalgam", "Acılı veya acısız", 4500, "🥤"],
      ["Türk Kahvesi", "Lokum ile", 6000, "☕"],
      ["Menengiç Kahvesi", "Gaziantep'e özgü, sütlü", 7500, "☕"],
    ],
  },
] as const;

async function main() {
  const db = createDb();

  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(products);
  await db.delete(categories);
  await db.delete(tables);
  await db.delete(users);

  const passwordHash = await bcrypt.hash("demo1234", 10);
  await db.insert(users).values([
    { name: "Restoran Yöneticisi", email: "yonetici@demo.com", passwordHash, role: "admin" },
    { name: "Mutfak", email: "mutfak@demo.com", passwordHash, role: "kitchen" },
  ]);

  for (const [i, cat] of MENU.entries()) {
    const [c] = await db.insert(categories).values({ name: cat.name, sortOrder: i }).returning();
    await db.insert(products).values(
      cat.items.map(([name, description, price, emoji], j) => ({
        categoryId: c.id,
        name,
        description,
        price,
        emoji,
        sortOrder: j,
      })),
    );
  }

  // Masa 1'in anahtarı sabit, böylece README'deki demo linki her zaman çalışır
  await db.insert(tables).values(
    Array.from({ length: 6 }, (_, i) => ({
      name: `Masa ${i + 1}`,
      token: i === 0 ? "demo-masa-1" : randomBytes(9).toString("base64url"),
    })),
  );

  console.log("Örnek veri yüklendi.");
  console.log("Yönetici: yonetici@demo.com / demo1234");
  console.log("Mutfak:   mutfak@demo.com / demo1234");
  console.log("Müşteri:  /m/demo-masa-1");
  await db.$client.end();
}

main();
