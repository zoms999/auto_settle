import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { dealId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { dealId } = params;
  const body = await request.json();
  const { dueDate, amount, description, isPaid } = body;

  try {
    // Verify deal belongs to user
    const deal = await prisma.deal.findFirst({
      where: {
        id: dealId,
        user: {
          email: session.user.email,
        },
      },
    });

    if (!deal) {
      return new NextResponse("Deal not found", { status: 404 });
    }

    const paymentSchedule = await prisma.paymentSchedule.create({
      data: {
        dealId,
        dueDate: new Date(dueDate),
        amount: BigInt(amount),
        description,
        isPaid: isPaid || false,
      },
    });

    return NextResponse.json({
      ...paymentSchedule,
      amount: paymentSchedule.amount.toString(),
    });
  } catch (error) {
    console.error("Error creating payment schedule:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}