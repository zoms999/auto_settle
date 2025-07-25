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
  const { type, details } = body;

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

    const service = await prisma.service.create({
      data: {
        dealId,
        type,
        details,
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error creating service:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}