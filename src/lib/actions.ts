import { Deal, Service, PaymentSchedule } from '@prisma/client';

type DealWithRelations = Deal & {
  services: Service[];
  paymentSchedules: PaymentSchedule[];
};

export function getNextAction(deal: DealWithRelations): string | null {
  const checklists = deal.checklists as {
    quoteInitial?: boolean;
    quoteFinal?: boolean;
    contractSent?: boolean;
    contractReceived?: boolean;
    codeIssued?: boolean;
    reportSubmitted?: boolean;
  } || {};

  // Calculate financial status
  const totalQuote = deal.services.reduce((sum, service) => {
    const details = service.details as { 
      price?: number, 
      count?: number, 
      activityCost?: number 
    };
    
    if (service.type === 'ACTIVITY') {
      return sum + (Number(details?.activityCost) || 0);
    } else if (service.type === 'ETC' || service.type === 'REPORT') {
      return sum + (Number(details?.price) || 0);
    } else {
      return sum + (Number(details?.price) || 0) * (Number(details?.count) || 0);
    }
  }, 0);

  const totalPaid = deal.paymentSchedules
    .filter(p => p.isPaid)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const outstanding = totalQuote - totalPaid;

  // Check for overdue payments
  const overduePayments = deal.paymentSchedules.filter(p => 
    !p.isPaid && new Date(p.dueDate) < new Date()
  );

  // Priority actions based on status and conditions
  if (overduePayments.length > 0) {
    return '연체 입금 확인 필요';
  }

  if (outstanding > 0 && deal.status === 'ONGOING') {
    const upcomingPayments = deal.paymentSchedules.filter(p => 
      !p.isPaid && new Date(p.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );
    if (upcomingPayments.length > 0) {
      return '입금 예정 확인';
    }
  }

  if (deal.status === 'PROSPECT') {
    if (!checklists.quoteInitial) {
      return '초기 견적서 발송 필요';
    }
    if (!checklists.quoteFinal) {
      return '확정 견적서 발송 필요';
    }
    return '계약 진행 확인';
  }

  if (deal.status === 'ONGOING') {
    if (!checklists.contractReceived) {
      return '계약서 회수 필요';
    }
    if (!checklists.codeIssued) {
      return '코드 발급 필요';
    }
    if (!checklists.reportSubmitted) {
      return '보고서 제출 필요';
    }
  }

  if (deal.status === 'COMPLETED' && outstanding > 0) {
    return '최종 정산 확인';
  }

  return null;
}