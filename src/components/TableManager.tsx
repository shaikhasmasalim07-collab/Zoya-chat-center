import React, { useState, useEffect, useMemo } from 'react';
import { TableItem, Order } from '../types';
import { tableService } from '../services/tableService';
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Users,
  Search,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  LayoutGrid,
  List,
  Sparkles,
  ShoppingBag,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { playTapSound } from '../utils/sound';

interface TableManagerProps {
  orders?: Order[];
}

const PRESET_SECTIONS = [
  'Main Dining Hall',
  'AC Hall',
  'Family Section',
  'Family Cabin',
  'Outdoor Garden',
  'Rooftop Terrace',
  'Counter / Takeaway',
];

export const TableManager: React.FC<TableManagerProps> = ({ orders = [] }) => {
  const [tables, setTables] = useState<TableItem[]>(() => tableService.getTables());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);
  const [selectedTableDetails, setSelectedTableDetails] = useState<TableItem | null>(null);

  // Form State
  const [tableNumber, setTableNumber] = useState<number>(1);
  const [label, setLabel] = useState('Main Dining Hall');
  const [capacity, setCapacity] = useState<number>(4);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<TableItem | null>(null);

  // Reset Confirmation State
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    const unsub = tableService.subscribe((list) => {
      setTables(list);
    });
    return () => unsub();
  }, []);

  // Compute next suggested table number
  const nextAvailableTableNumber = useMemo(() => {
    if (tables.length === 0) return 1;
    const maxNum = Math.max(...tables.map((t) => t.tableNumber), 0);
    return maxNum + 1;
  }, [tables]);

  // Distinct Sections for filtering
  const allSections = useMemo(() => {
    const set = new Set<string>();
    tables.forEach((t) => {
      if (t.label) set.add(t.label);
    });
    return Array.from(set);
  }, [tables]);

  // Filtered tables
  const filteredTables = useMemo(() => {
    return tables.filter((tbl) => {
      const matchesSearch =
        tbl.tableNumber.toString().includes(searchTerm.trim()) ||
        (tbl.label && tbl.label.toLowerCase().includes(searchTerm.toLowerCase().trim()));
      const matchesSection = selectedSection === 'all' || tbl.label === selectedSection;
      return matchesSearch && matchesSection;
    });
  }, [tables, searchTerm, selectedSection]);

  // Overall statistics
  const stats = useMemo(() => {
    const total = tables.length;
    const active = tables.filter((t) => t.isActive).length;
    const totalSeats = tables.reduce((sum, t) => sum + (t.isActive ? (t.capacity || 4) : 0), 0);
    
    // Count tables with active orders
    const occupiedTableNums = new Set<number>();
    orders.forEach((o) => {
      if (o.status !== 'completed' && o.status !== 'cancelled') {
        occupiedTableNums.add(o.tableNumber);
      }
    });

    const occupiedCount = tables.filter((t) => occupiedTableNums.has(t.tableNumber)).length;

    return {
      total,
      active,
      inactive: total - active,
      occupied: occupiedCount,
      available: Math.max(0, active - occupiedCount),
      totalSeats,
    };
  }, [tables, orders]);

  const handleOpenAdd = () => {
    setEditingTable(null);
    setTableNumber(nextAvailableTableNumber);
    setLabel('Main Dining Hall');
    setCapacity(4);
    setIsActive(true);
    setFormError('');
    setIsModalOpen(true);
    playTapSound();
  };

  const handleOpenEdit = (table: TableItem) => {
    setEditingTable(table);
    setTableNumber(table.tableNumber);
    setLabel(table.label || 'Main Dining Hall');
    setCapacity(table.capacity || 4);
    setIsActive(table.isActive);
    setFormError('');
    setIsModalOpen(true);
    playTapSound();
  };

  const handleQuickAddNext = async () => {
    playTapSound();
    const result = await tableService.addTable({
      tableNumber: nextAvailableTableNumber,
      label: 'Main Dining Hall',
      capacity: 4,
      isActive: true,
    });
    if (!result.success && result.message) {
      alert(result.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const num = Math.floor(Number(tableNumber));
    if (!num || num < 1 || num > 999) {
      setFormError('Please enter a valid table number between 1 and 999.');
      return;
    }

    if (capacity < 1 || capacity > 50) {
      setFormError('Seating capacity must be between 1 and 50 persons.');
      return;
    }

    setIsSubmitting(true);
    playTapSound();

    try {
      if (editingTable) {
        const res = await tableService.updateTable({
          ...editingTable,
          tableNumber: num,
          label: label.trim() || `Table ${num}`,
          capacity: Number(capacity),
          isActive,
        });
        if (!res.success) {
          setFormError(res.message || 'Failed to update table.');
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await tableService.addTable({
          tableNumber: num,
          label: label.trim() || `Table ${num}`,
          capacity: Number(capacity),
          isActive,
        });
        if (!res.success) {
          setFormError(res.message || 'Failed to add table.');
          setIsSubmitting(false);
          return;
        }
      }

      setIsModalOpen(false);
      setEditingTable(null);
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    playTapSound();
    await tableService.deleteTable(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleToggleStatus = async (table: TableItem) => {
    playTapSound();
    await tableService.toggleTableStatus(table.id);
  };

  const handleResetToDefault = () => {
    playTapSound();
    tableService.resetToDefault();
    setShowResetConfirm(false);
  };

  return (
    <div id="table-manager-container" className="space-y-4">
      {/* Header & Quick Action Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#d8d6d3] shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#516B84] text-white shadow-xs">
                <Users className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#516B84] font-['Outfit'] leading-tight">
                  Dining Floor Tables Management
                </h3>
                <p className="text-xs text-slate-500">
                  Add, edit, or delete dining tables and manage customer seating capacity in real-time.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Quick Add Next Table */}
            <button
              id="quick-add-next-table-btn"
              type="button"
              onClick={handleQuickAddNext}
              className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-98 border border-slate-200 cursor-pointer"
              title={`Quickly add Table #${nextAvailableTableNumber}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>+ Add Table #{nextAvailableTableNumber}</span>
            </button>

            {/* Add Custom Table */}
            <button
              id="add-new-table-btn"
              type="button"
              onClick={handleOpenAdd}
              className="py-2 px-3.5 rounded-xl bg-[#516B84] hover:bg-[#3E5367] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Table</span>
            </button>

            {/* Reset to Default */}
            <button
              id="reset-tables-btn"
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
              title="Reset tables to default (1-10)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Floor Overview Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          <div className="bg-[#F7F7F6] p-3 rounded-xl border border-[#d8d6d3]">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Total Tables
            </span>
            <span className="text-xl font-bold text-slate-800 font-['Outfit']">
              {stats.total}
            </span>
          </div>

          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-0.5">
              Available Tables
            </span>
            <span className="text-xl font-bold text-emerald-700 font-['Outfit']">
              {stats.available}
            </span>
          </div>

          <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80">
            <span className="text-[10px] uppercase font-bold text-amber-700 block mb-0.5">
              Occupied (Eating)
            </span>
            <span className="text-xl font-bold text-amber-700 font-['Outfit']">
              {stats.occupied}
            </span>
          </div>

          <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200/80">
            <span className="text-[10px] uppercase font-bold text-blue-700 block mb-0.5">
              Total Seating Capacity
            </span>
            <span className="text-xl font-bold text-blue-700 font-['Outfit']">
              {stats.totalSeats} <span className="text-xs font-normal">Persons</span>
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
              Inactive / Off
            </span>
            <span className="text-xl font-bold text-slate-600 font-['Outfit']">
              {stats.inactive}
            </span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-tables-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search table number or section..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F7F7F6] border border-[#d8d6d3] rounded-lg focus:outline-none focus:border-[#516B84]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Section Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => {
                setSelectedSection('all');
                playTapSound();
              }}
              className={`py-1 px-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedSection === 'all'
                  ? 'bg-[#516B84] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Sections ({tables.length})
            </button>

            {allSections.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  setSelectedSection(sec);
                  playTapSound();
                }}
                className={`py-1 px-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedSection === sec
                    ? 'bg-[#516B84] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>

          {/* Grid vs List View Toggle */}
          <div className="flex items-center gap-1 self-end sm:self-auto bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setViewMode('grid');
                playTapSound();
              }}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white text-[#516B84] shadow-2xs' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid Floor View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('list');
                playTapSound();
              }}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white text-[#516B84] shadow-2xs' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tables Floor Display */}
      {filteredTables.length === 0 ? (
        <div className="bg-white rounded-xl p-8 border border-[#d8d6d3] text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No tables found</p>
          <p className="text-xs text-slate-400 mb-4">
            {searchTerm || selectedSection !== 'all'
              ? 'Try changing your search or section filters.'
              : 'Add your first restaurant table to start taking orders.'}
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="py-2 px-4 rounded-xl bg-[#516B84] text-white text-xs font-semibold shadow-xs hover:bg-[#3E5367] transition-all"
          >
            + Add Table Now
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID FLOOR VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredTables.map((tbl) => {
            const tableActiveOrders = orders.filter(
              (o) =>
                o.tableNumber === tbl.tableNumber &&
                o.status !== 'completed' &&
                o.status !== 'cancelled'
            );
            const isOccupied = tableActiveOrders.length > 0;
            const billTotal = tableActiveOrders.reduce((sum, o) => sum + o.totalAmount, 0);

            return (
              <div
                key={tbl.id}
                id={`admin-table-card-${tbl.tableNumber}`}
                className={`bg-white rounded-xl p-3.5 border transition-all flex flex-col justify-between relative group ${
                  !tbl.isActive
                    ? 'border-slate-200 bg-slate-50/70 opacity-60'
                    : isOccupied
                    ? 'border-[#516B84] ring-1 ring-[#516B84]/20 shadow-xs'
                    : 'border-[#d8d6d3] hover:border-[#516B84]/60 hover:shadow-xs'
                }`}
              >
                {/* Top Badge: Number & Status */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          !tbl.isActive
                            ? 'bg-slate-300'
                            : isOccupied
                            ? 'bg-amber-500 animate-pulse'
                            : 'bg-emerald-500'
                        }`}
                      />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        Table
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Active Status Badge */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(tbl)}
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                          tbl.isActive
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        title="Click to toggle table active/inactive status"
                      >
                        {tbl.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </div>
                  </div>

                  {/* Table Big Number & Section */}
                  <div className="my-1.5 text-center">
                    <span className="text-3xl font-extrabold text-slate-800 font-['Outfit'] block leading-none">
                      {tbl.tableNumber}
                    </span>
                    <span className="text-[11px] font-medium text-slate-600 block mt-1 truncate">
                      {tbl.label || `Table ${tbl.tableNumber}`}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                      <Users className="w-3 h-3" />
                      <span>{tbl.capacity || 4} Seats</span>
                    </span>
                  </div>
                </div>

                {/* Orders / Bill Info Box */}
                <div className="pt-2 border-t border-slate-100 text-xs mt-2">
                  {isOccupied ? (
                    <div
                      onClick={() => setSelectedTableDetails(tbl)}
                      className="bg-amber-50/80 p-2 rounded-lg border border-amber-200/80 text-center cursor-pointer hover:bg-amber-100/80 transition-colors"
                      title="Click to view active orders for this table"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                        <span>{tableActiveOrders.length} {tableActiveOrders.length === 1 ? 'Order' : 'Orders'}</span>
                        <span className="font-['Outfit'] text-xs">₹{billTotal}</span>
                      </div>
                      <span className="text-[9px] text-amber-700 block mt-0.5">
                        Click to view details ↗
                      </span>
                    </div>
                  ) : (
                    <div className="text-center py-1 text-[10px] text-emerald-600 font-medium bg-emerald-50/50 rounded-lg">
                      Ready for guests
                    </div>
                  )}

                  {/* Edit & Delete Action Buttons */}
                  <div className="flex items-center justify-end gap-1 mt-2.5 pt-1.5 border-t border-slate-100">
                    <button
                      type="button"
                      id={`edit-table-btn-${tbl.tableNumber}`}
                      onClick={() => handleOpenEdit(tbl)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-[#516B84] hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit Table"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      id={`delete-table-btn-${tbl.tableNumber}`}
                      onClick={() => {
                        playTapSound();
                        setDeleteTarget(tbl);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete Table"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-xl border border-[#d8d6d3] shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F6] text-slate-600 font-bold uppercase text-[10px] border-b border-[#d8d6d3]">
                <tr>
                  <th className="py-3 px-4">Table #</th>
                  <th className="py-3 px-4">Section / Name</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4">Live Orders</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTables.map((tbl) => {
                  const tableActiveOrders = orders.filter(
                    (o) =>
                      o.tableNumber === tbl.tableNumber &&
                      o.status !== 'completed' &&
                      o.status !== 'cancelled'
                  );
                  const isOccupied = tableActiveOrders.length > 0;
                  const billTotal = tableActiveOrders.reduce((sum, o) => sum + o.totalAmount, 0);

                  return (
                    <tr key={tbl.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 font-['Outfit'] text-sm">
                        Table {tbl.tableNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {tbl.label || `Table ${tbl.tableNumber}`}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {tbl.capacity || 4} Persons
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(tbl)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer ${
                            tbl.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              tbl.isActive ? 'bg-emerald-600' : 'bg-slate-400'
                            }`}
                          />
                          <span>{tbl.isActive ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        {isOccupied ? (
                          <button
                            type="button"
                            onClick={() => setSelectedTableDetails(tbl)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-bold text-[11px] hover:bg-amber-100 transition-colors"
                          >
                            <span>{tableActiveOrders.length} Orders</span>
                            <span className="text-amber-700">(₹{billTotal})</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No active orders</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(tbl)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#516B84] hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Table"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              playTapSound();
                              setDeleteTarget(tbl);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Table"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Table Modal */}
      {isModalOpen && (
        <div
          id="table-form-modal-backdrop"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn"
        >
          <div
            id="table-form-modal-box"
            className="bg-white rounded-2xl max-w-md w-full p-5 border border-[#d8d6d3] shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#516B84] text-white">
                  <Users className="w-4 h-4" />
                </span>
                <h4 className="text-base font-bold text-[#516B84] font-['Outfit']">
                  {editingTable ? `Edit Table #${editingTable.tableNumber}` : 'Add New Dining Table'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* Table Number */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Table Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="table-form-number-input"
                  type="number"
                  min="1"
                  max="999"
                  required
                  value={tableNumber}
                  onChange={(e) => setTableNumber(parseInt(e.target.value, 10) || 1)}
                  placeholder="e.g. 11"
                  className="w-full px-3 py-2 bg-[#F7F7F6] border border-[#d8d6d3] rounded-xl text-sm font-bold font-['Outfit'] text-slate-900 focus:outline-none focus:border-[#516B84]"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Unique number displayed on table stand and customer QR code.
                </span>
              </div>

              {/* Floor Section / Label */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Section / Area Name
                </label>
                <input
                  id="table-form-label-input"
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Main Dining Hall, AC Cabin, Rooftop"
                  className="w-full px-3 py-2 bg-[#F7F7F6] border border-[#d8d6d3] rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#516B84]"
                />

                {/* Preset Suggestions */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {PRESET_SECTIONS.map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setLabel(sec)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                        label === sec
                          ? 'bg-[#516B84] text-white border-[#516B84]'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seating Capacity */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Seating Capacity (Guests)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 4, 6, 8].map((cap) => (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => setCapacity(cap)}
                      className={`py-1.5 rounded-xl border text-center font-bold font-['Outfit'] text-xs transition-colors cursor-pointer ${
                        capacity === cap
                          ? 'bg-[#516B84] text-white border-[#516B84]'
                          : 'bg-[#F7F7F6] text-slate-700 border-[#d8d6d3] hover:bg-white'
                      }`}
                    >
                      {cap} Persons
                    </button>
                  ))}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">Custom capacity:</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 1)}
                    className="w-16 px-2 py-1 bg-[#F7F7F6] border border-[#d8d6d3] rounded-lg text-xs text-center font-bold"
                  />
                </div>
              </div>

              {/* Active / Enabled Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7F7F6] border border-[#d8d6d3]">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Table Available</span>
                  <span className="text-[10px] text-slate-500 block">
                    Show in customer table selection view
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#516B84]"></div>
                </label>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-3.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit-table-form-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2 px-4 rounded-xl bg-[#516B84] hover:bg-[#3E5367] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-98 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingTable ? 'Update Table' : 'Add Table'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Table Confirmation Modal */}
      {deleteTarget && (
        <div
          id="delete-table-modal-backdrop"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-[#d8d6d3] shadow-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>

            <h4 className="text-base font-bold text-slate-900 font-['Outfit']">
              Delete Table #{deleteTarget.tableNumber}?
            </h4>

            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-800">Table #{deleteTarget.tableNumber} ({deleteTarget.label})</strong> from the restaurant system? Customers will no longer be able to select this table.
            </p>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="py-2 px-4 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-table-btn"
                type="button"
                onClick={handleDeleteConfirm}
                className="py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                Yes, Delete Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset to Default Confirmation */}
      {showResetConfirm && (
        <div
          id="reset-tables-modal-backdrop"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-[#d8d6d3] shadow-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
              <RotateCcw className="w-6 h-6" />
            </div>

            <h4 className="text-base font-bold text-slate-900 font-['Outfit']">
              Reset Tables to Default?
            </h4>

            <p className="text-xs text-slate-500 leading-relaxed">
              This will restore the standard 10-table layout (Table 1 through 10). Any custom table configurations will be replaced.
            </p>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="py-2 px-4 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-reset-tables-btn"
                type="button"
                onClick={handleResetToDefault}
                className="py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                Reset Tables
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Orders Inspection Modal for Table */}
      {selectedTableDetails && (
        <div
          id="table-orders-detail-modal-backdrop"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-[#d8d6d3] shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#516B84] text-white">
                  <ShoppingBag className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-base font-bold text-[#516B84] font-['Outfit']">
                    Table #{selectedTableDetails.tableNumber} - Live Orders
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {selectedTableDetails.label} • {selectedTableDetails.capacity || 4} Guests capacity
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTableDetails(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of active orders for this table */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {orders
                .filter(
                  (o) =>
                    o.tableNumber === selectedTableDetails.tableNumber &&
                    o.status !== 'completed' &&
                    o.status !== 'cancelled'
                )
                .map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3 rounded-xl bg-[#F7F7F6] border border-[#d8d6d3] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-800">
                        #{ord.id.slice(-6)}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {ord.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {ord.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs text-slate-700"
                        >
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-semibold text-slate-900">
                            ₹{item.price * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600">Total:</span>
                      <span className="text-[#516B84] font-['Outfit'] text-sm">
                        ₹{ord.totalAmount}
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTableDetails(null)}
                className="py-2 px-4 rounded-xl bg-[#516B84] text-white text-xs font-semibold hover:bg-[#3E5367] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
