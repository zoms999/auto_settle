import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

interface IParams {
  dealId?: string;
}

export async function GET(
  request: Request,
  { params }: { params: IParams }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { dealId } = params;

  if (!dealId || typeof dealId !== "string") {
    throw new Error("Invalid ID");
  }

  const deal = await prisma.deal.findUnique({
    where: {
      id: dealId,
      user: {
        email: session.user.email,
      },
    },
    include: {
      services: true,
      paymentSchedules: true,
    },
  });

  return NextResponse.json(deal);
}

export async function PATCH(
  request: Request,
  { params }: { params: IParams }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { dealId } = params;
  const body = await request.json();
  const { companyName, managerName, contactInfo, status, memo, checklists } = body;

  if (!dealId || typeof dealId !== "string") {
    throw new Error("Invalid ID");
  }

  const deal = await prisma.deal.update({
    where: {
      id: dealId,
      user: {
        email: session.user.email,
      },
    },
    data: {
      companyName,
      managerName,
      contactInfo,
      status,
      memo,
      checklists,
    },
  });

  return NextResponse.json(deal);
}

export async function DELETE(
  request: Request,
  { params }: { params: IParams }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { dealId } = params;

  if (!dealId || typeof dealId !== "string") {
    throw new Error("Invalid ID");
  }

  const deal = await prisma.deal.delete({
    where: {
      id: dealId,
      user: {
        email: session.user.email,
      },
    },
  });

  return NextResponse.json(deal);
}