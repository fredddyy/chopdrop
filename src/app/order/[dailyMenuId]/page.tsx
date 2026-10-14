import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { OrderForm } from "@/components/order-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ dailyMenuId: string }>;
}

export default async function OrderPage({ params }: PageProps) {
  const { dailyMenuId } = await params;

  const dailyMenu = await prisma.dailyMenu.findUnique({
    where: { id: dailyMenuId },
    include: {
      meal: {
        include: {
          restaurant: {
            include: {
              menuCategories: {
                include: { items: { orderBy: { sortOrder: "asc" } } },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      },
      timeSlot: true,
    },
  });

  if (!dailyMenu) {
    notFound();
  }

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-24">
      <OrderForm
        dailyMenu={{
          id: dailyMenu.id,
          meal: {
            id: dailyMenu.meal.id,
            name: dailyMenu.meal.name,
            description: dailyMenu.meal.description,
            imageUrl: dailyMenu.meal.imageUrl,
            price: dailyMenu.meal.price,
            type: dailyMenu.meal.type,
            tag: dailyMenu.meal.tag,
          },
          restaurant: {
            name: dailyMenu.meal.restaurant.name,
            address: dailyMenu.meal.restaurant.address,
            menuCategories: dailyMenu.meal.restaurant.menuCategories.map(
              (cat) => ({
                id: cat.id,
                name: cat.name,
                selectionRule: cat.selectionRule,
                items: cat.items.map((item) => ({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                })),
              })
            ),
          },
          timeSlot: {
            startTime: dailyMenu.timeSlot.startTime,
            endTime: dailyMenu.timeSlot.endTime,
            cutoffTime: dailyMenu.timeSlot.cutoffTime,
          },
          remaining: dailyMenu.maxOrders - dailyMenu.currentOrders,
        }}
      />
    </main>
  );
}
