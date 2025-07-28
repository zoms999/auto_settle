"use client";

import { signOut, useSession } from "next-auth/react";
import DealGrid from "./components/DealGrid";
import AddDealModal from "./components/AddDealModal";
import EditDealModal from "./components/EditDealModal";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Deal, PaymentSchedule, Service } from "@prisma/client";

export default function Home() {
  const { data: session } = useSession();
  const [deals, setDeals] = useState<(Deal & { services: Service[], paymentSchedules: PaymentSchedule[] })[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ONGOING');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<(Deal & { services: Service[], paymentSchedules: PaymentSchedule[] }) | null>(null);

  const fetchDeals = () => {
    axios.get('/api/deals').then(response => {
      setDeals(response.data);
    });
  };

  const handleEditDeal = (deal: Deal & { services: Service[], paymentSchedules: PaymentSchedule[] }) => {
    setSelectedDeal(deal);
    setIsEditModalOpen(true);
  };

  const handleDeleteDeal = async (dealId: string) => {
    try {
      await axios.delete(`/api/deals?id=${dealId}`);
      fetchDeals();
    } catch (error) {
      console.error('계약 삭제 실패:', error);
      alert('계약 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const kpis = useMemo(() => {
    const totalRevenue = deals.reduce((sum, deal) => {
      return sum + deal.paymentSchedules.filter(p => p.isPaid).reduce((s, p) => s + Number(p.amount), 0);
    }, 0);

    const totalQuote = deals.reduce((sum, deal) => {
      return sum + deal.services.reduce((s, service) => {
        const details = service.details as { price?: number, count?: number };
        return s + (Number(details?.price) || 0) * (Number(details?.count) || 0);
      }, 0);
    }, 0);

    const outstanding = totalQuote - totalRevenue;
    const ongoingDeals = deals.filter(d => d.status === 'ONGOING').length;

    return { totalRevenue, outstanding, ongoingDeals };
  }, [deals]);

  const filteredDeals = useMemo(() => {
    return deals.filter(deal => deal.status === activeTab);
  }, [deals, activeTab]);

  const tabs = [
    { key: 'ONGOING', label: '진행중' },
    { key: 'PROSPECT', label: '가망' },
    { key: 'CARRIED_OVER', label: '이월' },
    { key: 'COMPLETED', label: '완료' },
    { key: 'HOLD', label: '보류' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-200">
                <span className="text-white font-bold text-xl korean-text">AS</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900 korean-text">계약 관리 대시보드</h1>
                <p className="text-sm text-gray-600 korean-text">Auto Settle</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm text-gray-600 korean-text">안녕하세요,</p>
                <p className="font-semibold text-gray-900 korean-text">{session?.user?.name || "사용자"}님</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 md:hidden focus-visible:focus"
                  aria-label="메뉴 열기"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 korean-text"
                  aria-label="로그아웃"
                >
                  <span className="hidden sm:inline">로그아웃</span>
                  <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main>
        <div className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* KPI Summary */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className="group p-6 bg-white/90 backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/30 hover:border-green-200 hover:scale-105">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center korean-text">
                    <div className="w-5 h-5 bg-green-100 rounded-md flex items-center justify-center mr-2">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    총 매출
                  </h3>
                  <p className="text-2xl font-bold text-green-600 group-hover:text-green-700 transition-colors korean-text">
                    ₩{kpis.totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 korean-text">입금 완료된 금액</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:from-green-200 group-hover:to-green-300 transition-all duration-300 shadow-md">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="group p-6 bg-white/90 backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/30 hover:border-orange-200 hover:scale-105">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center korean-text">
                    <div className="w-5 h-5 bg-orange-100 rounded-md flex items-center justify-center mr-2">
                      <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    미수금
                  </h3>
                  <p className="text-2xl font-bold text-orange-600 group-hover:text-orange-700 transition-colors korean-text">
                    ₩{kpis.outstanding.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 korean-text">수금 대기 중인 금액</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center group-hover:from-orange-200 group-hover:to-orange-300 transition-all duration-300 shadow-md">
                  <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="group p-6 bg-white/90 backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/30 hover:border-blue-200 hover:scale-105 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center korean-text">
                    <div className="w-5 h-5 bg-blue-100 rounded-md flex items-center justify-center mr-2">
                      <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    진행중 계약
                  </h3>
                  <p className="text-2xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors korean-text">
                    {kpis.ongoingDeals}건
                  </p>
                  <p className="text-xs text-gray-500 mt-1 korean-text">현재 진행 중인 계약</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300 shadow-md">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs and Controls */}
          <div className="mb-6">
            <div className="sm:hidden">
              <label htmlFor="tabs" className="sr-only korean-text">
                탭 선택
              </label>
              <select
                id="tabs"
                name="tabs"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="block w-full py-3 pl-4 pr-10 text-base border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/90 backdrop-blur-md shadow-sm korean-text"
              >
                {tabs.map((tab) => (
                  <option key={tab.key} value={tab.key}>{tab.label}</option>
                ))}
              </select>
            </div>
            <div className="hidden sm:block">
              <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-sm border border-white/30 p-1">
                <nav className="flex space-x-1" aria-label="계약 상태 탭" role="tablist">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-6 py-3 text-sm font-semibold rounded-lg whitespace-nowrap transition-all duration-200 korean-text focus-visible:focus ${activeTab === tab.key
                        ? 'text-white bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md hover:shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                        }`}
                      role="tab"
                      aria-selected={activeTab === tab.key}
                      aria-controls={`${tab.key.toLowerCase()}-panel`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* Deal Grid */}
          <div role="tabpanel" id="ongoing-panel" aria-labelledby="ongoing-tab">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 korean-text">계약 목록</h2>
                <p className="text-sm text-gray-600 mt-1 korean-text">행을 클릭하여 상세 정보를 확인하세요</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="단체명, 담당자로 검색..."
                    className="pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white/90 backdrop-blur-md w-full sm:w-72 korean-text shadow-sm"
                    aria-label="계약 검색"
                  />
                  <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white/90 backdrop-blur-md border border-gray-300 rounded-lg hover:bg-white hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 korean-text"
                    aria-label="필터 옵션 열기"
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                    </svg>
                    <span className="hidden sm:inline">필터</span>
                  </button>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 korean-text"
                    aria-label="새 계약 추가"
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="hidden sm:inline">새 계약 추가</span>
                    <span className="sm:hidden">추가</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/30 overflow-hidden">
              <DealGrid
                deals={filteredDeals}
                onEdit={handleEditDeal}
                onDelete={handleDeleteDeal}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Add Deal Modal */}
      <AddDealModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchDeals}
      />

      {/* Edit Deal Modal */}
      <EditDealModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDeal(null);
        }}
        onSuccess={fetchDeals}
        deal={selectedDeal}
      />
    </div>
  );
}
