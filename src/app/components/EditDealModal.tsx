"use client";

import React, { useState, useEffect } from 'react';
import { ServiceType, Deal, Service, PaymentSchedule } from '@prisma/client';
import axios from 'axios';

interface EditDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  deal: (Deal & { services: Service[], paymentSchedules: PaymentSchedule[] }) | null;
}

interface ServiceDetails {
  // 공통
  target?: string;
  price?: number;
  count?: number;
  memo?: string;

  // 검사 전용
  premium?: boolean;
  standard?: boolean;
  duration?: string;
  resultMethod?: string;

  // 강연 전용
  content?: string;
  schedule?: string;
  dispatchCount?: number;

  // 컨설팅 전용
  inPerson?: boolean;
  remote?: boolean;

  // 액티비티 전용
  activityCost?: number;

  // 보고서 전용
  submitDate?: string;
}

interface PaymentScheduleData {
  dueDate: string;
  amount: number;
  description: string;
  isPaid?: boolean;
}

const EditDealModal: React.FC<EditDealModalProps> = ({ isOpen, onClose, onSuccess, deal }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    managerName: '',
    contactInfo: {
      phone: '',
      email: ''
    },
    status: 'PROSPECT' as const,
    memo: ''
  });

  const [selectedServices, setSelectedServices] = useState<Set<ServiceType>>(new Set());
  const [serviceDetails, setServiceDetails] = useState<Record<ServiceType, ServiceDetails>>({} as Record<ServiceType, ServiceDetails>);
  const [paymentSchedules, setPaymentSchedules] = useState<PaymentScheduleData[]>([]);
  const [checklists, setChecklists] = useState({
    quoteInitial: false,
    quoteFinal: false,
    contractSent: false,
    contractReceived: false,
    codeIssued: false,
    reportSubmitted: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const serviceTypeLabels: Record<ServiceType, string> = {
    TEST: '검사',
    LECTURE: '강연',
    CONSULTING: '컨설팅',
    ACTIVITY: '액티비티',
    ETC: '기타',
    REPORT: '보고서'
  };

  const statusOptions = [
    { value: 'PROSPECT', label: '가망' },
    { value: 'ONGOING', label: '진행중' },
    { value: 'CARRIED_OVER', label: '이월' },
    { value: 'COMPLETED', label: '완료' },
    { value: 'HOLD', label: '보류' }
  ];

  // Initialize form data when deal changes
  useEffect(() => {
    if (deal) {
      const contactInfo = deal.contactInfo as { phone?: string, email?: string } || {};
      const dealChecklists = deal.checklists as {
        quoteInitial?: boolean,
        quoteFinal?: boolean,
        contractSent?: boolean,
        contractReceived?: boolean,
        codeIssued?: boolean,
        reportSubmitted?: boolean
      } || {};

      setFormData({
        companyName: deal.companyName,
        managerName: deal.managerName || '',
        contactInfo: {
          phone: contactInfo.phone || '',
          email: contactInfo.email || ''
        },
        status: deal.status as any,
        memo: deal.memo || ''
      });

      // Set services
      const services = new Set<ServiceType>();
      const details: Record<ServiceType, ServiceDetails> = {} as Record<ServiceType, ServiceDetails>;
      
      deal.services.forEach(service => {
        services.add(service.type);
        details[service.type] = service.details as ServiceDetails || {};
      });

      setSelectedServices(services);
      setServiceDetails(details);

      // Set payment schedules
      setPaymentSchedules(deal.paymentSchedules.map(schedule => ({
        dueDate: new Date(schedule.dueDate).toISOString().split('T')[0],
        amount: Number(schedule.amount),
        description: schedule.description || '',
        isPaid: schedule.isPaid
      })));

      // Set checklists
      setChecklists({
        quoteInitial: dealChecklists.quoteInitial || false,
        quoteFinal: dealChecklists.quoteFinal || false,
        contractSent: dealChecklists.contractSent || false,
        contractReceived: dealChecklists.contractReceived || false,
        codeIssued: dealChecklists.codeIssued || false,
        reportSubmitted: dealChecklists.reportSubmitted || false
      });
    }
  }, [deal]);

  const handleServiceToggle = (serviceType: ServiceType) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceType)) {
      newSelected.delete(serviceType);
      const newDetails = { ...serviceDetails };
      delete newDetails[serviceType];
      setServiceDetails(newDetails);
    } else {
      newSelected.add(serviceType);
      setServiceDetails({
        ...serviceDetails,
        [serviceType]: { price: 0, count: 1 }
      });
    }
    setSelectedServices(newSelected);
  };

  const handleServiceDetailChange = (serviceType: ServiceType, field: keyof ServiceDetails, value: string | number | boolean) => {
    setServiceDetails({
      ...serviceDetails,
      [serviceType]: {
        ...serviceDetails[serviceType],
        [field]: value
      }
    });
  };

  const addPaymentSchedule = () => {
    setPaymentSchedules([
      ...paymentSchedules,
      {
        dueDate: new Date().toISOString().split('T')[0],
        amount: 0,
        description: '',
        isPaid: false
      }
    ]);
  };

  const removePaymentSchedule = (index: number) => {
    setPaymentSchedules(paymentSchedules.filter((_, i) => i !== index));
  };

  const handlePaymentScheduleChange = (index: number, field: keyof PaymentScheduleData, value: string | number | boolean) => {
    const updated = [...paymentSchedules];
    updated[index] = { ...updated[index], [field]: value };
    setPaymentSchedules(updated);
  };

  const calculateTotalQuote = () => {
    return Array.from(selectedServices).reduce((total, serviceType) => {
      const details = serviceDetails[serviceType];
      if (details) {
        if (serviceType === 'ACTIVITY') {
          return total + (Number(details.activityCost) || 0);
        } else if (serviceType === 'ETC' || serviceType === 'REPORT') {
          return total + (Number(details.price) || 0);
        } else {
          return total + (Number(details.price) || 0) * (Number(details.count) || 0);
        }
      }
      return total;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal) return;
    
    setIsSubmitting(true);

    try {
      const dealData = {
        id: deal.id,
        ...formData,
        checklists,
        services: Array.from(selectedServices).map(serviceType => ({
          type: serviceType,
          details: serviceDetails[serviceType]
        })),
        paymentSchedules: paymentSchedules.map(schedule => ({
          ...schedule,
          amount: Number(schedule.amount)
        }))
      };

      await axios.put('/api/deals', dealData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('계약 수정 실패:', error);
      alert('계약 수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !deal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl my-2 sm:my-8 border border-white/20 animate-in slide-in-from-bottom-4 duration-300 max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-4rem)]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[calc(100vh-4rem)]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 backdrop-blur-md">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 korean-text">계약 수정</h2>
                <p className="text-sm text-gray-600 mt-1 korean-text">{deal.companyName} 계약 정보 수정</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-lg transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content - Same as AddDealModal but with pre-filled data */}
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50/50 to-blue-50/30 min-h-0">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-4">
              {/* Left Section - Basic Info */}
              <div className="space-y-6">
                <div className="bg-white/90 backdrop-blur-md border border-white/30 rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center korean-text">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    기본 정보
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 korean-text">단체명 *</label>
                      <input
                        type="text"
                        required
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 transition-all duration-200 korean-text"
                        placeholder="단체명을 입력하세요"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 korean-text">담당자</label>
                      <input
                        type="text"
                        value={formData.managerName}
                        onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 transition-all duration-200 korean-text"
                        placeholder="담당자명을 입력하세요"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 korean-text">전화번호</label>
                        <input
                          type="tel"
                          value={formData.contactInfo.phone}
                          onChange={(e) => setFormData({
                            ...formData,
                            contactInfo: { ...formData.contactInfo, phone: e.target.value }
                          })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 transition-all duration-200"
                          placeholder="010-0000-0000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 korean-text">이메일</label>
                        <input
                          type="email"
                          value={formData.contactInfo.email}
                          onChange={(e) => setFormData({
                            ...formData,
                            contactInfo: { ...formData.contactInfo, email: e.target.value }
                          })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 transition-all duration-200"
                          placeholder="example@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 korean-text">상태</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 transition-all duration-200 korean-text"
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 korean-text">통화내용/메모</label>
                      <textarea
                        value={formData.memo}
                        onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/80 transition-all duration-200 korean-text"
                        placeholder="통화 내용이나 특이사항을 입력하세요"
                      />
                    </div>
                  </div>
                </div>

                {/* Checklists */}
                <div className="bg-white/90 backdrop-blur-md border border-white/30 rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center korean-text">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    진행 체크리스트
                  </h3>

                  <div className="space-y-6">
                    {/* 견적서/계약서 공유 */}
                    <div className="bg-gray-50/70 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 korean-text">견적서/계약서 공유</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-gray-700 korean-text">견적서</h5>
                          <label className="flex items-center p-2 bg-white rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checklists.quoteInitial}
                              onChange={(e) => setChecklists({ ...checklists, quoteInitial: e.target.checked })}
                              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 korean-text">초기</span>
                          </label>
                          <label className="flex items-center p-2 bg-white rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checklists.quoteFinal}
                              onChange={(e) => setChecklists({ ...checklists, quoteFinal: e.target.checked })}
                              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 korean-text">확정</span>
                          </label>
                        </div>
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-gray-700 korean-text">계약서</h5>
                          <label className="flex items-center p-2 bg-white rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checklists.contractSent}
                              onChange={(e) => setChecklists({ ...checklists, contractSent: e.target.checked })}
                              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 korean-text">전달</span>
                          </label>
                          <label className="flex items-center p-2 bg-white rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checklists.contractReceived}
                              onChange={(e) => setChecklists({ ...checklists, contractReceived: e.target.checked })}
                              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 korean-text">회수</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* 코드발급 */}
                    <div className="bg-gray-50/70 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 korean-text">코드발급</h4>
                      <label className="flex items-center p-2 bg-white rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checklists.codeIssued}
                          onChange={(e) => setChecklists({ ...checklists, codeIssued: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 korean-text">코드발급 완료</span>
                      </label>
                    </div>

                    {/* 보고서 제출 */}
                    <div className="bg-gray-50/70 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 korean-text">보고서 제출</h4>
                      <label className="flex items-center p-2 bg-white rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checklists.reportSubmitted}
                          onChange={(e) => setChecklists({ ...checklists, reportSubmitted: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 korean-text">보고서 제출 완료</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Payment Schedules */}
                <div className="bg-white/90 backdrop-blur-md border border-white/30 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center korean-text">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      입금 예정
                    </h3>
                    <button
                      type="button"
                      onClick={addPaymentSchedule}
                      className="px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors korean-text"
                    >
                      + 추가
                    </button>
                  </div>

                  <div className="space-y-3">
                    {paymentSchedules.map((schedule, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50/70 rounded-lg">
                        <input
                          type="checkbox"
                          checked={schedule.isPaid || false}
                          onChange={(e) => handlePaymentScheduleChange(index, 'isPaid', e.target.checked)}
                          className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          title="입금 완료"
                        />
                        <input
                          type="date"
                          value={schedule.dueDate}
                          onChange={(e) => handlePaymentScheduleChange(index, 'dueDate', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/80"
                        />
                        <input
                          type="number"
                          value={schedule.amount}
                          onChange={(e) => handlePaymentScheduleChange(index, 'amount', Number(e.target.value))}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/80"
                          placeholder="금액"
                        />
                        <input
                          type="text"
                          value={schedule.description}
                          onChange={(e) => handlePaymentScheduleChange(index, 'description', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/80 korean-text"
                          placeholder="설명"
                        />
                        <button
                          type="button"
                          onClick={() => removePaymentSchedule(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Section - Services (same structure as AddDealModal) */}
              <div className="space-y-6">
                <div className="bg-white/90 backdrop-blur-md border border-white/30 rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center korean-text">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    진행 프로그램
                  </h3>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {Object.entries(serviceTypeLabels).map(([type, label]) => (
                      <div key={type} className="flex items-center p-3 bg-gray-50/50 rounded-lg hover:bg-gray-100/50 transition-colors">
                        <input
                          type="checkbox"
                          id={`edit-${type}`}
                          checked={selectedServices.has(type as ServiceType)}
                          onChange={() => handleServiceToggle(type as ServiceType)}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor={`edit-${type}`} className="ml-3 text-sm text-gray-700 font-medium cursor-pointer korean-text">
                          {label}
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Service Details - Same structure as AddDealModal but with edit prefix for IDs */}
                  <div className="space-y-4">
                    {Array.from(selectedServices).map(serviceType => (
                      <div key={serviceType} className="p-4 bg-gradient-to-r from-gray-50/80 to-blue-50/50 border border-gray-200/50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3 korean-text">
                          {serviceTypeLabels[serviceType]} 상세
                        </h4>
                        
                        {/* Service type specific forms - same as AddDealModal */}
                        {serviceType === 'TEST' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2 korean-text">버전</label>
                              <div className="flex gap-4">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={serviceDetails[serviceType]?.premium || false}
                                    onChange={(e) => handleServiceDetailChange(serviceType, 'premium', e.target.checked)}
                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700 korean-text">Premium</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={serviceDetails[serviceType]?.standard || false}
                                    onChange={(e) => handleServiceDetailChange(serviceType, 'standard', e.target.checked)}
                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700 korean-text">Standard</span>
                                </label>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1 korean-text">대상</label>
                              <input
                                type="text"
                                value={serviceDetails[serviceType]?.target || ''}
                                onChange={(e) => handleServiceDetailChange(serviceType, 'target', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/80 korean-text"
                                placeholder="대상자"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1 korean-text">가격</label>
                              <input
                                type="number"
                                value={serviceDetails[serviceType]?.price || 0}
                                onChange={(e) => handleServiceDetailChange(serviceType, 'price', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/80"
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1 korean-text">인원</label>
                              <input
                                type="number"
                                value={serviceDetails[serviceType]?.count || 1}
                                onChange={(e) => handleServiceDetailChange(serviceType, 'count', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/80"
                                placeholder="1"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1 korean-text">검사진행기간</label>
                              <input
                                type="text"
                                value={serviceDetails[serviceType]?.duration || ''}
                                onChange={(e) => handleServiceDetailChange(serviceType, 'duration', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/80 korean-text"
                                placeholder="예: 2주"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1 korean-text">결과지운영방식</label>
                              <input
                                type="text"
                                value={serviceDetails[serviceType]?.resultMethod || ''}
                                onChange={(e) => handleServiceDetailChange(serviceType, 'resultMethod', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/80 korean-text"
                                placeholder="운영방식"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1 korean-text">메모</label>
                              <textarea
                                value={serviceDetails[serviceType]?.memo || ''}
                                onChange={(e) => handleServiceDetailChange(serviceType, 'memo', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/80 korean-text"
                                placeholder="추가 메모"
                              />
                            </div>
                            <div className="sm:col-span-2 pt-2 border-t border-gray-200">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600 korean-text">검사비용 (가격×인원):</span>
                                <span className="text-lg font-bold text-green-600 korean-text">
                                  ₩{((serviceDetails[serviceType]?.price || 0) * (serviceDetails[serviceType]?.count || 0)).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        {/* Add other service types here - same as AddDealModal */}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Summary */}
                <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border border-blue-200/50 rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center korean-text">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    견적 요약
                  </h3>

                  <div className="bg-white/70 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-gray-700 korean-text">총 견적가:</span>
                      <span className="text-2xl font-bold text-blue-600 korean-text">
                        ₩{calculateTotalQuote().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-blue-50/50 backdrop-blur-sm">
            <div className="text-sm text-gray-600 korean-text">
              * 필수 입력 항목
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg hover:bg-white transition-all duration-200 korean-text"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.companyName}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed korean-text"
              >
                {isSubmitting ? '저장 중...' : '수정 완료'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDealModal;