"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Deal, Service, ServiceType, PaymentSchedule } from '@prisma/client';
import { JsonValue } from '@prisma/client/runtime/library';

interface DealDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: (Deal & { services: Service[], paymentSchedules: PaymentSchedule[] }) | null;
}

const serviceTypes = Object.values(ServiceType);

const DealDetailModal: React.FC<DealDetailModalProps> = ({ isOpen, onClose, deal }) => {
  const [formData, setFormData] = useState<Partial<Deal & { services: { [key in ServiceType]?: JsonValue } }>>({});

  useEffect(() => {
    if (deal) {
      const initialServices = deal.services.reduce((acc, service) => {
        acc[service.type] = service.details || {};
        return acc;
      }, {} as { [key in ServiceType]?: JsonValue });
      setFormData({
        ...deal,
        services: initialServices
      });
    }
  }, [deal]);

  const { totalQuote, totalPaid, outstandingAmount } = useMemo(() => {
    const services = formData.services || {};
    const totalQuote = Object.values(services).reduce((sum: number, service: JsonValue) => {
        if (typeof service === 'object' && service !== null && !Array.isArray(service)) {
            const typedService = service as { price?: number; count?: number };
            const price = Number(typedService.price) || 0;
            const count = Number(typedService.count) || 0;
            return sum + (price * count);
        }
        return sum;
    }, 0);

    const totalPaid = deal?.paymentSchedules?.filter(p => p.isPaid).reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const outstandingAmount = totalQuote - totalPaid;

    return { totalQuote, totalPaid, outstandingAmount };
  }, [formData.services, deal?.paymentSchedules]);

  if (!isOpen || !deal) return null;

  const handleServiceChange = (serviceType: ServiceType) => {
    const currentServices = formData.services || {};
    const updatedServices = { ...currentServices };
    if (updatedServices[serviceType]) {
      delete updatedServices[serviceType];
    } else {
      updatedServices[serviceType] = {}; // Initialize with empty details
    }
    setFormData({ ...formData, services: updatedServices });
  };

  const serviceTypeLabels: { [key in ServiceType]: string } = {
    TEST: '검사',
    LECTURE: '강연',
    CONSULTING: '컨설팅',
    ACTIVITY: '활동',
    ETC: '기타',
    REPORT: '보고서'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden border border-white/20 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 backdrop-blur-md">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-200">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 korean-text">{deal.companyName}</h2>
                <p className="text-sm text-gray-600 mt-1 korean-text">계약 상세 정보 및 관리</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label="모달 닫기"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50/50 to-blue-50/30">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Left Section */}
              <div className="space-y-6">
                <div className="bg-white/90 backdrop-blur-md border border-white/30 rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center korean-text">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    기본 정보
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50/70 rounded-lg border border-gray-200/50">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 korean-text">단체명</label>
                      <p className="text-gray-900 font-bold text-lg korean-text">{deal.companyName}</p>
                    </div>
                    <div className="p-4 bg-gray-50/70 rounded-lg border border-gray-200/50">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 korean-text">담당자</label>
                      <p className="text-gray-900 font-semibold korean-text">{deal.managerName}</p>
                    </div>
                    <div className="p-4 bg-gray-50/70 rounded-lg border border-gray-200/50">
                      <label className="block text-sm font-semibold text-gray-700 mb-3 korean-text">상태</label>
                      <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full border ${
                        deal.status === 'ONGOING' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        deal.status === 'PROSPECT' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        deal.status === 'COMPLETED' ? 'bg-green-100 text-green-800 border-green-200' :
                        deal.status === 'CARRIED_OVER' ? 'bg-purple-100 text-purple-800 border-purple-200' : 
                        'bg-gray-100 text-gray-800 border-gray-200'
                      } korean-text`}>
                        {deal.status === 'ONGOING' ? '진행중' : 
                         deal.status === 'PROSPECT' ? '가망' :
                         deal.status === 'COMPLETED' ? '완료' :
                         deal.status === 'CARRIED_OVER' ? '이월' : '보류'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-md border border-white/30 rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center korean-text">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    진행 체크리스트
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center p-4 bg-gray-50/70 rounded-lg hover:bg-gray-100/70 transition-all duration-200 border border-gray-200/50">
                      <input 
                        type="checkbox" 
                        id="quote-sent"
                        className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 transition-colors" 
                      />
                      <label htmlFor="quote-sent" className="ml-4 text-sm font-semibold text-gray-700 cursor-pointer korean-text">견적서 발송</label>
                    </div>
                    <div className="flex items-center p-4 bg-gray-50/70 rounded-lg hover:bg-gray-100/70 transition-all duration-200 border border-gray-200/50">
                      <input 
                        type="checkbox" 
                        id="contract-received"
                        className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 transition-colors" 
                      />
                      <label htmlFor="contract-received" className="ml-4 text-sm font-semibold text-gray-700 cursor-pointer korean-text">계약서 회수</label>
                    </div>
                    <div className="flex items-center p-4 bg-gray-50/70 rounded-lg hover:bg-gray-100/70 transition-all duration-200 border border-gray-200/50">
                      <input 
                        type="checkbox" 
                        id="code-issued"
                        className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 transition-colors" 
                      />
                      <label htmlFor="code-issued" className="ml-4 text-sm font-semibold text-gray-700 cursor-pointer korean-text">코드 발급</label>
                    </div>
                    <div className="flex items-center p-4 bg-gray-50/70 rounded-lg hover:bg-gray-100/70 transition-all duration-200 border border-gray-200/50">
                      <input 
                        type="checkbox" 
                        id="report-submitted"
                        className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 transition-colors" 
                      />
                      <label htmlFor="report-submitted" className="ml-4 text-sm font-semibold text-gray-700 cursor-pointer korean-text">보고서 제출</label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section */}
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    진행 프로그램
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {serviceTypes.map(type => (
                      <div key={type} className="flex items-center p-3 bg-gray-50/50 rounded-lg hover:bg-gray-100/50 transition-colors">
                        <input
                          type="checkbox"
                          id={type}
                          checked={!!formData.services?.[type]}
                          onChange={() => handleServiceChange(type)}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                        />
                        <label htmlFor={type} className="ml-3 text-sm text-gray-700 font-medium cursor-pointer">
                          {serviceTypeLabels[type]}
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 space-y-4">
                    {Object.keys(formData.services || {}).map(type => (
                      <div key={type} className="p-4 bg-gradient-to-r from-gray-50/80 to-blue-50/50 border border-gray-200/50 rounded-lg shadow-sm">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <div className="w-6 h-6 bg-indigo-100 rounded-md flex items-center justify-center mr-2">
                            <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                          {serviceTypeLabels[type as ServiceType]} 상세
                        </h4>
                        {type === 'TEST' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">버전</label>
                              <input 
                                type="text" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 transition-all duration-200" 
                                placeholder="예: v1.0"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">가격</label>
                              <input 
                                type="number" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 transition-all duration-200" 
                                placeholder="0"
                              />
                            </div>
                          </div>
                        )}
                        {type === 'LECTURE' && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">주제</label>
                              <input 
                                type="text" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 transition-all duration-200" 
                                placeholder="강연 주제"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">시간</label>
                              <input 
                                type="text" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 transition-all duration-200" 
                                placeholder="예: 2시간"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">가격</label>
                              <input 
                                type="number" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 transition-all duration-200" 
                                placeholder="0"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border border-blue-200/50 rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    정산 요약
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        총 견적가
                      </span>
                      <span className="font-bold text-gray-900 text-lg">₩{totalQuote.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        입금 완료
                      </span>
                      <span className="font-bold text-green-600 text-lg">₩{totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-white/30 pt-4">
                      <div className="flex justify-between items-center p-4 bg-white/70 rounded-lg shadow-sm">
                        <span className="text-base font-semibold text-gray-700 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          미수금
                        </span>
                        <span className={`font-bold text-xl ${outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₩{outstandingAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-blue-50/50 backdrop-blur-sm">
            <div className="text-sm text-gray-600 flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              변경사항은 자동으로 저장됩니다
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={onClose} 
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg hover:bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-sm hover:shadow-md"
              >
                닫기
              </button>
              <button className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                변경사항 저장
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealDetailModal;