import React, { useState } from "react";

const LimitNotification = () => {
  const [selectedAction, setSelectedAction] = useState("");

  const actions = [
    {
      id: "keep-active",
      label: "Keep budget active",
      description:
        "Continue using the current KES 5,000 limit and monitor overspending",
      badge: "Current",
    },
    {
      id: "increase-budget",
      label: "Increase budget automatically",
      description:
        "Raise limit by 15% to KES 5,750 to match your current spending pattern",
      badge: "+15%",
    },
    {
      id: "set-new-limit",
      label: "Set custom budget limit",
      description:
        "Manually choose a new amount that works better for your financial plan",
      badge: "Custom",
    },
    {
      id: "deactivate-budget",
      label: "Deactivate budget tracking",
      description: "Stop monitoring expenses for this category entirely",
      badge: "Stop",
    },
  ];

  return (
    <div className="w-80 bg-white rounded-2xl shadow-2xl border border-gray-200/60 overflow-hidden">
      {/* Elegant Header */}
      <div className="relative p-4 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center border border-red-500/30">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Budget Alert</h3>
              <p className="text-slate-300 text-xs">10% over limit</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white text-sm font-bold">KES 500</div>
            <div className="text-red-400 text-xs">over budget</div>
          </div>
        </div>
      </div>

      {/* Visual Indicator */}
      <div className="px-4 pt-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Budget</span>
          <span>110%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-1000"
            style={{ width: "110%" }}
          ></div>
        </div>
      </div>

      {/* Action Selection */}
      <div className="p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Choose how to handle this budget limit:
        </label>

        <div className="space-y-3">
          {actions.map((action) => (
            <div
              key={action.id}
              onClick={() => setSelectedAction(action.id)}
              className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                selectedAction === action.id
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                    selectedAction === action.id
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-400"
                  }`}
                >
                  {selectedAction === action.id && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800 mb-1">
                    {action.label}
                  </div>
                  <div className="text-xs text-gray-600 leading-relaxed">
                    {action.description}
                  </div>
                </div>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full h-fit ${
                  selectedAction === action.id
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {action.badge}
              </span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
            Ignore
          </button>
          <button
            className={`flex-1 py-2.5 text-sm text-white rounded-xl transition-all ${
              selectedAction
                ? "bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg hover:shadow-xl"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            disabled={!selectedAction}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default LimitNotification;
