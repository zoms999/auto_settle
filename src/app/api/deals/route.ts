import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getServerSession, Session } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

interface PaymentScheduleInput {
  dueDate: string;
  amount: number;
  description?: string;
  isPaid?: boolean;
}

interface ServiceInput {
  type: 'TEST' | 'LECTURE' | 'CONSULTING' | 'ACTIVITY' | 'ETC' | 'REPORT';
  details: Prisma.JsonValue;
}

interface DealInput {
  companyName: string;
  managerName?: string;
  contactInfo?: Prisma.JsonValue;
  status: string;
  memo?: string;
  checklists?: Prisma.JsonValue;
  services?: ServiceInput[];
  paymentSchedules?: PaymentScheduleInput[];
}

async function getUserId(session: Session | null) {
  let userId: string;
  
  if (session?.user?.email) {
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || 'User',
        }
      });
    }
    userId = user.id;
  } else {
    let defaultUser = await prisma.user.findFirst({
      where: { email: 'default@example.com' }
    });
    
    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: {
          email: 'default@example.com',
          name: 'Default User',
        }
      });
    }
    userId = defaultUser.id;
  }
  
  return userId;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = await getUserId(session);

    const deals = await prisma.deal.findMany({
      where: {
        userId: userId
      },
      include: {
        services: true,
        paymentSchedules: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Convert BigInt to number for JSON serialization
    const serializedDeals = deals.map(deal => ({
      ...deal,
      paymentSchedules: deal.paymentSchedules.map(schedule => ({
        ...schedule,
        amount: Number(schedule.amount)
      }))
    }));

    return NextResponse.json(serializedDeals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = await getUserId(session);

    const body: DealInput = await request.json();
    console.log('Received body:', JSON.stringify(body, null, 2));
    
    const { services, paymentSchedules, ...dealData } = body;

    // Process payment schedules to convert date strings to Date objects
    const processedPaymentSchedules = paymentSchedules?.map((schedule: PaymentScheduleInput) => {
      console.log('Processing schedule:', schedule);
      return {
        ...schedule,
        dueDate: new Date(schedule.dueDate),
        amount: BigInt(schedule.amount)
      };
    }) || [];
    
    console.log('Processed payment schedules:', processedPaymentSchedules);

    // Create deal with services and payment schedules
    const deal = await prisma.deal.create({
      data: {
        ...dealData,
        userId: userId,
        services: {
          create: (services || []) as Prisma.ServiceCreateWithoutDealInput[],
        },
        paymentSchedules: {
          create: processedPaymentSchedules,
        },
      } as Prisma.DealUncheckedCreateInput,
      include: {
        services: true,
        paymentSchedules: true,
      },
    });

    // Convert BigInt to number for JSON serialization
    const serializedDeal = {
      ...deal,
      paymentSchedules: deal.paymentSchedules.map(schedule => ({
        ...schedule,
        amount: Number(schedule.amount)
      }))
    };

    return NextResponse.json(serializedDeal, { status: 201 });
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json(
      { error: 'Failed to create deal', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = await getUserId(session);

    const body: DealInput & { id: string } = await request.json();
    const { id, services, paymentSchedules, ...dealData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Deal ID is required' },
        { status: 400 }
      );
    }

    // Check if deal belongs to user
    const existingDeal = await prisma.deal.findFirst({
      where: { id, userId }
    });

    if (!existingDeal) {
      return NextResponse.json(
        { error: 'Deal not found or unauthorized' },
        { status: 404 }
      );
    }

    // Process payment schedules
    const processedPaymentSchedules = paymentSchedules?.map((schedule: PaymentScheduleInput) => ({
      ...schedule,
      dueDate: new Date(schedule.dueDate),
      amount: BigInt(schedule.amount)
    })) || [];

    // Update deal with services and payment schedules
    const deal = await prisma.deal.update({
      where: { id },
      data: {
        ...dealData,
        services: {
          deleteMany: {},
          create: (services || []) as Prisma.ServiceCreateWithoutDealInput[],
        },
        paymentSchedules: {
          deleteMany: {},
          create: processedPaymentSchedules,
        },
      } as Prisma.DealUncheckedUpdateInput,
      include: {
        services: true,
        paymentSchedules: true,
      },
    });

    // Convert BigInt to number for JSON serialization
    const serializedDeal = {
      ...deal,
      paymentSchedules: deal.paymentSchedules.map(schedule => ({
        ...schedule,
        amount: Number(schedule.amount)
      }))
    };

    return NextResponse.json(serializedDeal);
  } catch (error) {
    console.error('Error updating deal:', error);
    return NextResponse.json(
      { error: 'Failed to update deal', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = await getUserId(session);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Deal ID is required' },
        { status: 400 }
      );
    }

    // Check if deal belongs to user
    const existingDeal = await prisma.deal.findFirst({
      where: { id, userId }
    });

    if (!existingDeal) {
      return NextResponse.json(
        { error: 'Deal not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete deal (services and payment schedules will be deleted automatically due to cascade)
    await prisma.deal.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('Error deleting deal:', error);
    return NextResponse.json(
      { error: 'Failed to delete deal', details: (error as Error).message },
      { status: 500 }
    );
  }
}