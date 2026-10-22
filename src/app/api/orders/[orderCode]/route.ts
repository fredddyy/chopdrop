import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderCode: string }> }
) {
  const { orderCode } = await params;

  const order = await prisma.order.findUnique({
    where: { orderCode },
    include: {
      dailyMenu: {
        include: {
          meal: { include: { restaurant: true } },
          timeSlot: true,
        },
      },
      office: true,
      items: {
        include: { menuItem: { include: { category: true } } },
      },
    },
  });

  if (!order) {
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: order.id,
      orderCode: order.orderCode,
      status: order.status,
      paymentStatus: order.paymentStatus,
      customerName: order.customerName,
      fulfillmentType: order.fulfillmentType,
      deliveryAddress: order.deliveryAddress,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      meal: {
        name: order.dailyMenu.meal.name,
        type: order.dailyMenu.meal.type,
        imageUrl: order.dailyMenu.meal.imageUrl,
      },
      restaurant: {
        name: order.dailyMenu.meal.restaurant.name,
        address: order.dailyMenu.meal.restaurant.address,
      },
      timeSlot: {
        startTime: order.dailyMenu.timeSlot.startTime,
        endTime: order.dailyMenu.timeSlot.endTime,
      },
      office: order.office
        ? {
            name: order.office.name,
            address: order.office.address,
            collectionPoint: order.office.collectionPoint,
            assistantName: order.office.assistantName,
            assistantPhone: order.office.assistantPhone,
          }
        : null,
      items: order.items.map((item) => ({
        name: item.menuItem.name,
        category: item.menuItem.category.name,
        price: item.price,
        quantity: item.quantity,
      })),
    },
  });
}
