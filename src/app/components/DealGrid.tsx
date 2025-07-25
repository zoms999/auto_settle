"use client";

import React, { useState } from 'react';
import { Deal, Service, PaymentSchedule, ServiceType } from '@prisma/client';
import { getNextAction } from '@/lib/actions';

interface DealGridProps {
    deals: (Deal & { services: Service[], paymentSchedules: PaymentSchedule[] })[];
}

interface ExpandedDealData extends Deal {
    services: Service[];
    paymentSchedules: PaymentSchedule[];
}

const DealGrid: React.FC<DealGridProps> = ({ deals }) => {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleRow = (dealId: string) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(dealId)) {
            newExpandedRows.delete(dealId);
        } else {
            newExpandedRows.add(dealId);
        }
        setExpandedRows(newExpandedRows);
    };

    const getStatusDisplay = (status: string) => {
        const statusMap: { [key: string]: { text: string, color: string } } = {
            'PROSPECT': { text: '가망', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
            'ONGOING': { text: '진행중', color: 'bg-blue-100 text-blue-800 border-blue-200' },
            'CARRIED_OVER': { text: '이월', color: 'bg-purple-100 text-purple-800 border-purple-200' },
            'COMPLETED': { text: '완료', color: 'bg-green-100 text-green-800 border-green-200' },
            'HOLD': { text: '보류', color: 'bg-gray-100 text-gray-800 border-gray-200' }
        };
        return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800 border-gray-200' };
    };

    const calculateQuote = (services: Service[]) => {
        return services.reduce((sum, service) => {
            const details = service.details as { price?: number, count?: number };
            const price = Number(details?.price) || 0;
            const count = Number(details?.count) || 0;
            return sum + (price * count);
        }, 0);
    };

    const calculatePaidAmount = (paymentSchedules: PaymentSchedule[]) => {
        return paymentSchedules
            .filter(p => p.isPaid)
            .reduce((sum, p) => sum + Number(p.amount), 0);
    };

    const getServiceTypeDisplay = (type: ServiceType) => {
        const typeMap: { [key in ServiceType]: string } = {
            'TEST': '검사',
            'LECTURE': '강연',
            'CONSULTING': '컨설팅',
            'ACTIVITY': '액티비티',
            'ETC': '기타',
            'REPORT': '보고서'
        };
        return typeMap[type] || type;
    };

    const renderExpandedContent = (deal: ExpandedDealData) => {
        const contactInfo = deal.contactInfo as { phone?: string, email?: string } || {};
        const checklists = deal.checklists as {
            programs?: string[],
            quoteSent?: boolean,
            contractSent?: boolean,
            contractReceived?: boolean,
            codeIssued?: boolean,
            reportSubmitted?: boolean
        } || {};

        const totalQuote = calculateQuote(deal.services);
        const totalPaid = calculatePaidAmount(deal.paymentSchedules);
        const outstanding = totalQuote - totalPaid;

        return (
            <div className="bg-gray-50 border-t border-gray-200 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 영역 1: 기본 정보 및 프로그램 선택 */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 korean-text mb-4">기본 정보 및 프로그램 선택</h4>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 korean-text mb-1">단체명</label>
                                <input 
                                    type="text" 
                                    value={deal.companyName} 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 korean-text"
                                    readOnly
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 korean-text mb-1">담당자</label>
                                <input 
                                    type="text" 
                                    value={deal.managerName || ''} 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 korean-text"
                                    readOnly
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 korean-text mb-1">연락처</label>
                                <div className="space-y-2">
                                    <input 
                                        type="text" 
                                        placeholder="전화번호"
                                        value={contactInfo.phone || ''} 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 korean-text"
                                        readOnly
                                    />
                                    <input 
                                        type="email" 
                                        placeholder="이메일"
                                        value={contactInfo.email || ''} 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 korean-text"
                                        readOnly
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 korean-text mb-1">통화내용</label>
                                <textarea 
                                    value={deal.memo || ''} 
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 korean-text"
                                    readOnly
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 korean-text mb-2">진행 프로그램</label>
                                <div className="space-y-2">
                                    {['TEST', 'LECTURE', 'CONSULTING', 'ACTIVITY', 'ETC', 'REPORT'].map((type) => (
                                        <label key={type} className="flex items-center">
                                            <input 
                                                type="checkbox" 
                                                checked={deal.services.some(s => s.type === type)}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                disabled
                                            />
                                            <span className="ml-2 text-sm text-gray-700 korean-text">
                                                {getServiceTypeDisplay(type as ServiceType)}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 영역 2: 프로그램 상세 */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 korean-text mb-4">프로그램 상세</h4>
                        
                        <div className="space-y-4">
                            {deal.services.map((service, index) => {
                                const details = service.details as { 
                                    version?: string, 
                                    target?: string, 
                                    price?: number, 
                                    count?: number,
                                    content?: string,
                                    memo?: string 
                                } || {};
                                
                                return (
                                    <div key={service.id} className="bg-white p-4 rounded-lg border border-gray-200">
                                        <h5 className="font-medium text-gray-900 korean-text mb-3">
                                            {getServiceTypeDisplay(service.type)}
                                        </h5>
                                        
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-600 korean-text">버전/내용:</span>
                                                <p className="text-gray-900 korean-text">{details.version || details.content || '-'}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 korean-text">대상:</span>
                                                <p className="text-gray-900 korean-text">{details.target || '-'}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 korean-text">단가:</span>
                                                <p className="text-gray-900 korean-text">₩{(details.price || 0).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 korean-text">수량:</span>
                                                <p className="text-gray-900 korean-text">{details.count || 0}명</p>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-gray-600 korean-text">비용:</span>
                                                <p className="text-green-600 font-semibold korean-text">
                                                    ₩{((details.price || 0) * (details.count || 0)).toLocaleString()}
                                                </p>
                                            </div>
                                            {details.memo && (
                                                <div className="col-span-2">
                                                    <span className="text-gray-600 korean-text">메모:</span>
                                                    <p className="text-gray-900 korean-text">{details.memo}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 영역 3: 진행상황 및 정산 */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900 korean-text mb-4">진행상황 및 정산</h4>
                        
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <h5 className="font-medium text-gray-900 korean-text mb-3">견적서/계약서 공유</h5>
                                <div className="space-y-2">
                                    <label className="flex items-center">
                                        <input 
                                            type="checkbox" 
                                            checked={checklists.quoteSent || false}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            disabled
                                        />
                                        <span className="ml-2 text-sm text-gray-700 korean-text">견적서 전달</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input 
                                            type="checkbox" 
                                            checked={checklists.contractSent || false}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            disabled
                                        />
                                        <span className="ml-2 text-sm text-gray-700 korean-text">계약서 전달</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input 
                                            type="checkbox" 
                                            checked={checklists.contractReceived || false}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            disabled
                                        />
                                        <span className="ml-2 text-sm text-gray-700 korean-text">계약서 회수</span>
                                    </label>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <div className="space-y-2">
                                    <label className="flex items-center">
                                        <input 
                                            type="checkbox" 
                                            checked={checklists.codeIssued || false}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            disabled
                                        />
                                        <span className="ml-2 text-sm text-gray-700 korean-text">코드발급</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input 
                                            type="checkbox" 
                                            checked={checklists.reportSubmitted || false}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            disabled
                                        />
                                        <span className="ml-2 text-sm text-gray-700 korean-text">보고서 제출</span>
                                    </label>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <h5 className="font-medium text-gray-900 korean-text mb-3">정산 현황</h5>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 korean-text">총 견적가:</span>
                                        <span className="font-semibold text-gray-900 korean-text">₩{totalQuote.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 korean-text">총 입금액:</span>
                                        <span className="font-semibold text-green-600 korean-text">₩{totalPaid.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2">
                                        <span className="text-gray-600 korean-text">총 미수금:</span>
                                        <span className={`font-bold korean-text ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            ₩{outstanding.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <h5 className="font-medium text-gray-900 korean-text mb-3">입금예정 일자/금액</h5>
                                <div className="space-y-2">
                                    {deal.paymentSchedules.map((payment) => (
                                        <div key={payment.id} className="flex items-center justify-between">
                                            <label className="flex items-center flex-1">
                                                <input 
                                                    type="checkbox" 
                                                    checked={payment.isPaid}
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                    disabled
                                                />
                                                <span className="ml-2 text-sm text-gray-700 korean-text">
                                                    {new Date(payment.dueDate).toLocaleDateString('ko-KR')} 
                                                    {payment.description && ` - ${payment.description}`}
                                                </span>
                                            </label>
                                            <span className="text-sm font-medium text-gray-900 korean-text">
                                                ₩{Number(payment.amount).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="overflow-hidden">
            {/* 테이블 헤더 */}
            <div className="bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-4 px-6 py-4 text-sm font-semibold text-gray-700 korean-text">
                    <div className="col-span-1"></div>
                    <div className="col-span-1">순번</div>
                    <div className="col-span-3">단체명</div>
                    <div className="col-span-2">담당자</div>
                    <div className="col-span-1">견적가</div>
                    <div className="col-span-1">입금액</div>
                    <div className="col-span-1">미수금</div>
                    <div className="col-span-2">다음 액션</div>
                </div>
            </div>

            {/* 테이블 바디 */}
            <div className="divide-y divide-gray-200">
                {deals.map((deal, index) => {
                    const isExpanded = expandedRows.has(deal.id);
                    const status = getStatusDisplay(deal.status);
                    const totalQuote = calculateQuote(deal.services);
                    const totalPaid = calculatePaidAmount(deal.paymentSchedules);
                    const outstanding = totalQuote - totalPaid;
                    const nextAction = getNextAction(deal);

                    return (
                        <div key={deal.id} className="bg-white">
                            {/* 요약 행 */}
                            <div 
                                className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                                onClick={() => toggleRow(deal.id)}
                            >
                                <div className="col-span-1 flex items-center">
                                    <button className="p-1 hover:bg-gray-200 rounded transition-colors duration-150">
                                        <svg 
                                            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="col-span-1 flex items-center text-sm text-gray-600 korean-text">
                                    {index + 1}
                                </div>
                                <div className="col-span-3 flex items-center">
                                    <div>
                                        <div className="font-semibold text-gray-900 korean-text">{deal.companyName}</div>
                                        <div className="text-xs text-gray-500 korean-text">
                                            <span className={`inline-flex px-2 py-1 rounded-full border ${status.color}`}>
                                                {status.text}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-2 flex items-center text-sm text-gray-700 korean-text">
                                    {deal.managerName || '-'}
                                </div>
                                <div className="col-span-1 flex items-center text-sm font-semibold text-green-600 korean-text">
                                    ₩{totalQuote.toLocaleString()}
                                </div>
                                <div className="col-span-1 flex items-center text-sm font-semibold text-blue-600 korean-text">
                                    ₩{totalPaid.toLocaleString()}
                                </div>
                                <div className="col-span-1 flex items-center text-sm font-bold korean-text">
                                    <span className={outstanding > 0 ? 'text-red-600' : 'text-green-600'}>
                                        ₩{outstanding.toLocaleString()}
                                    </span>
                                </div>
                                <div className="col-span-2 flex items-center">
                                    {nextAction ? (
                                        <span className="inline-flex px-3 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full border border-orange-200 korean-text">
                                            {nextAction}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs korean-text">없음</span>
                                    )}
                                </div>
                            </div>

                            {/* 확장된 상세 내용 */}
                            {isExpanded && renderExpandedContent(deal)}
                        </div>
                    );
                })}
            </div>

            {deals.length === 0 && (
                <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 korean-text">계약이 없습니다</h3>
                    <p className="mt-1 text-sm text-gray-500 korean-text">새 계약을 추가하여 시작하세요.</p>
                </div>
            )}
        </div>
    );
};

export default DealGrid;